// npm run build:pages, then node tools/check-pwa-browser.cjs [Playwright module].
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { createHash } = require("node:crypto");
const { chromium } = require(process.argv[2] || "playwright");

const root = path.resolve("dist");
const scope = "/Technoprof/";
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const release = JSON.parse(worker.match(/^const RELEASE = (.+);/m)[1]);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".wav": "audio/wav",
};
let online = true;
let breakDownload = false;
const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (!url.pathname.startsWith(scope)) return response.writeHead(404).end();
  const name = url.pathname.slice(scope.length) || "index.html";
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file))
    return response.writeHead(404).end();
  if (!online || (breakDownload && name.endsWith("13-retour-maison.wav")))
    return response.writeHead(503).end();
  response.writeHead(200, {
    "Content-Type": types[path.extname(file)] || "application/octet-stream",
    "Content-Length": fs.statSync(file).size,
  });
  fs.createReadStream(file).pipe(response);
});

function sourceImage(name) {
  const source = fs.readFileSync(`src/${name}-data.ts`, "utf8");
  const bytes = Buffer.from(
    source.match(/base64,([A-Za-z0-9+/=]+)/)[1],
    "base64",
  );
  return `${createHash("sha256").update(bytes).digest("hex")}.png`;
}

async function checkBrokenAssets(browser, base) {
  const placeholder = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jr1sAAAAASUVORK5CYII=",
    "base64",
  );
  for (const [file, asset] of [
    [sourceImage("sky"), "sky"],
    [sourceImage("car-right"), "raw-service-right"],
    ["13-retour-maison.wav", "13-retour-maison.wav"],
  ]) {
    const context = await browser.newContext({ serviceWorkers: "block" });
    try {
      const page = await context.newPage();
      const path = `**/${file}`;
      await page.route(path, (route) =>
        file.endsWith(".png")
          ? route.fulfill({ contentType: "image/png", body: placeholder })
          : route.fulfill({ status: 404 }),
      );
      await page.goto(base);
      const retry = page.getByRole("button", {
        name: "Réessayer",
        exact: true,
      });
      await retry.waitFor({ timeout: 45000 });
      assert(
        (await page.locator("#loading-stage").textContent()).includes(
          `(${asset})`,
        ),
      );
      assert.equal(
        await page.getByRole("button", { name: "Prendre le service" }).count(),
        0,
      );
      await page.unroute(path);
      await retry.click();
      await page
        .getByRole("button", { name: "Prendre le service" })
        .waitFor({ timeout: 45000 });
    } finally {
      await context.close();
    }
  }
  console.log(
    "PASS incomplete skyline/right-facing sprite and missing WAV block startup; retry starts the complete game",
  );
}

(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 960, height: 540 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.bulletinStarted = false;
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args) {
        if (!this.loop && this.buffer?.duration > 6 && this.buffer.duration < 7)
          window.bulletinStarted = true;
        return start.apply(this, args);
      };
    });
    const base = `http://127.0.0.1:${server.address().port}${scope}`;
    await page.goto(base);
    await page.getByRole("button", { name: "Réglages", exact: true }).tap();
    const prep = page.getByRole("button", {
      name: "Préparer le jeu hors connexion",
    });
    await prep.waitFor();
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    assert.deepEqual(
      await page.evaluate(() => caches.keys()),
      [],
      "no offline download before opt-in",
    );

    const cdp = await context.newCDPSession(page);
    const install = await cdp.send("Page.getInstallabilityErrors");
    assert.deepEqual(install.installabilityErrors, []);
    const manifest = await cdp.send("Page.getAppManifest");
    assert.equal(manifest.url, `${base}manifest.webmanifest`);

    // A late failed download must leave no partly ready offline edition.
    breakDownload = true;
    await prep.tap();
    await page
      .getByText("Impossible de préparer le hors connexion.", { exact: false })
      .waitFor({ timeout: 90000 });
    assert.deepEqual(await page.evaluate(() => caches.keys()), []);
    breakDownload = false;
    await prep.tap();
    await page
      .getByRole("button", { name: "Jeu disponible hors connexion" })
      .waitFor({ timeout: 90000 });
    const files = await page.evaluate(async () => {
      const [name] = await caches.keys();
      return (await (await caches.open(name)).keys()).map(
        (request) => request.url,
      );
    });
    assert.equal(files.length, release.files.length + 1);
    assert(files.includes(`${base}.offline-ready`));
    assert(release.files.every((name) => files.includes(base + name)));

    online = false;
    await context.setOffline(true);
    await page.goto(`${base}?fenetre=1`);
    const play = page.getByRole("button", {
      name: "Prendre le service",
      exact: true,
    });
    await play.waitFor({ timeout: 45000 });
    const wave = release.files.find((file) => file.endsWith(".wav"));
    const partial = await page.evaluate(async (file) => {
      const response = await fetch(file, { headers: { Range: "bytes=10-19" } });
      return [response.status, (await response.arrayBuffer()).byteLength];
    }, wave);
    assert.deepEqual(partial, [206, 10]);
    await play.tap();
    await page.waitForFunction(
      () =>
        window.bulletinStarted &&
        !document.getElementById("radio-caption").hidden,
      null,
      { timeout: 30000 },
    );
    assert.match(
      await page.locator("#radio-caption").textContent(),
      /Radio Educa France/,
    );
    assert.deepEqual(errors, []);
    console.log(
      `PASS PWA: installable at ${scope}, opt-in, failed-download retry, all ${release.files.length} assets, offline title/intro/game, WAV ranges`,
    );
    online = true;
    await context.close();
    await checkBrokenAssets(browser, base);
  } finally {
    await browser.close();
  }
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => server.close());
