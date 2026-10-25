// Optional native-browser check; install Playwright or set PLAYWRIGHT_MODULE.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, "..");
const out = path.join(root, "work/checkpoints");
fs.mkdirSync(out, { recursive: true });
let server;
async function main() {
  let base = process.env.PAGES_URL;
  if (!base) {
    const dist = path.join(root, "dist");
    server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://localhost");
      if (!url.pathname.startsWith("/Technoprof/")) {
        res.writeHead(404).end();
        return;
      }
      const file = path.resolve(
        dist,
        decodeURIComponent(url.pathname.slice("/Technoprof/".length)) ||
          "index.html",
      );
      if (
        !file.startsWith(dist + path.sep) ||
        !fs.existsSync(file) ||
        !fs.statSync(file).isFile()
      ) {
        res.writeHead(404).end();
        return;
      }
      const type =
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".png": "image/png",
          ".wav": "audio/wav",
          ".json": "application/json",
        }[path.extname(file)] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": type,
        "Content-Length": fs.statSync(file).size,
      });
      if (req.method === "HEAD") res.end();
      else fs.createReadStream(file).pipe(res);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${server.address().port}/Technoprof/`;
  }
  const info = await fetch(base + "build-info.json").then((r) => {
    assert.equal(r.status, 200);
    return r.json();
  });
  assert.equal(info.profile, "journee-musicale");
  for (const file of info.music) {
    const response = await fetch(new URL(file, base), { method: "HEAD" });
    assert.equal(response.status, 200, file);
    assert(Number(response.headers.get("content-length")) > 500000, file);
  }
  const report = [];
  for (const [name, engine, mobile] of [
    ["chromium", chromium, false],
    ["firefox", firefox, false],
    ["chromium-touch", chromium, true],
  ]) {
    const browser = await engine.launch({ headless: true });
    try {
      const context = await browser.newContext({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1100, height: 950 },
        ...(mobile ? { isMobile: true, hasTouch: true } : {}),
      });
      await context.addInitScript(() => {
        window.__musicPlayers = [];
        const create = document.createElement.bind(document);
        document.createElement = function (name, ...args) {
          const element = create(name, ...args);
          if (name.toLowerCase() === "audio")
            window.__musicPlayers.push(element);
          return element;
        };
      });
      const page = await context.newPage(),
        errors = [],
        failed = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => {
        if (r.status() >= 400 && !r.url().endsWith("favicon.ico"))
          failed.push(`${r.status()} ${r.url()}`);
      });
      await page.goto(base, { waitUntil: "load", timeout: 90000 });
      await page
        .getByRole("button", { name: "Prendre le service", exact: true })
        .waitFor({ timeout: 90000 });
      assert(await page.locator("#developer-controls").isHidden());
      assert(await page.locator("#developer-links").isHidden());
      assert(await page.locator("#workshop").isHidden());
      // The title image is mounted by JS after the document load event.
      await page.waitForFunction(
        () => {
          const img = document.querySelector(".title-art img");
          return img?.complete && img.naturalWidth > 0;
        },
        null,
        { timeout: 30000 },
      );
      assert(
        await page
          .locator(".title-art img")
          .evaluate((img) => img.complete && img.naturalWidth > 0),
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: path.join(out, `pages-${name}-title.png`),
        fullPage: true,
      });
      const activate = async (label) => {
        const button = page.getByRole("button", { name: label, exact: true });
        if (mobile) await button.tap();
        else await button.click();
      };
      await activate("Réglages");
      assert.equal(await page.getByRole("slider").count(), 4);
      await page.waitForFunction(
        () =>
          window.__musicPlayers.some(
            (a) =>
              a.src.includes("Titre-Interpretation") &&
              a.currentTime > 0.1 &&
              !a.paused,
          ),
        null,
        { timeout: 30000 },
      );
      await activate("Retour");
      await activate("Prendre le service");
      if (
        await page
          .getByRole("button", { name: "Passer la cinématique", exact: true })
          .isVisible()
      )
        await activate("Passer la cinématique");
      else if (await page.getByRole("button", { name: "Passer l’introduction", exact: true }).isVisible())
        await activate("Passer l’introduction");
      await page.waitForFunction(
        () =>
          window.__musicPlayers.some(
            (a) =>
              a.src.endsWith("02-autoradio.wav") &&
              a.currentTime > 0.1 &&
              !a.paused,
          ),
        null,
        { timeout: 45000 },
      );
      assert(await page.locator("#player-panel").isHidden());
      if (mobile) {
        const box = await page.locator("#game canvas").boundingBox();
        assert(box);
        await page.touchscreen.tap(
          box.x + box.width * 0.6,
          box.y + box.height * 0.55,
        );
      } else {
        await page.keyboard.down("ArrowUp");
        await page.waitForTimeout(200);
        await page.keyboard.up("ArrowUp");
      }
      await page.screenshot({
        path: path.join(out, `pages-${name}-road.png`),
        fullPage: true,
      });
      assert.deepEqual(errors, []);
      assert.deepEqual(failed, []);
      report.push({
        browser: name,
        base,
        commit: info.commit,
        title: true,
        road: true,
        defaultMusic: true,
        separateVolumes: 4,
        errors,
        failed,
      });
      console.log(
        `PASS ${name}: public day, artwork, native title/road music and ${mobile ? "touch" : "keyboard"} input`,
      );
      await context.close();
    } finally {
      await browser.close();
    }
  }
  fs.writeFileSync(
    path.join(
      out,
      process.env.PAGES_URL ? "pages-live.json" : "pages-local.json",
    ),
    JSON.stringify(report, null, 2),
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    server?.closeAllConnections();
    server?.close();
  });
