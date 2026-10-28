// Real built Phaser scene: one failed PNG, no half-booted update, then native retry.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, ".."),
  dist = path.join(root, "dist"),
  out = path.join(root, "work/checkpoints/optimization-2026-10-28/boot-error");
fs.mkdirSync(out, { recursive: true });
let failNext = false;
const server = http.createServer((req, res) => {
  const rel =
      new URL(req.url, "http://local").pathname.slice(1) || "index.html",
    file = path.resolve(dist, rel);
  if (!file.startsWith(dist + path.sep) || !fs.existsSync(file))
    return res.writeHead(404).end();
  if (failNext && rel.startsWith("art/") && rel.endsWith(".png")) {
    failNext = false;
    return res.writeHead(404).end();
  }
  res.setHeader(
    "Content-Type",
    {
      ".html": "text/html",
      ".js": "text/javascript",
      ".png": "image/png",
      ".wav": "audio/wav",
    }[path.extname(file)] || "application/octet-stream",
  );
  res.setHeader("Cache-Control", "no-store");
  if (file.endsWith(".js")) {
    const js = fs.readFileSync(file, "utf8"),
      marker = /this\.runtime\.mark\((['"`])create\1\)/g;
    assert.equal([...js.matchAll(marker)].length, 1);
    res.end(
      js.replace(marker, (m) => m + ",globalThis.__bootCreateObserved=true"),
    );
  } else fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const reports = [];
  try {
    for (const [name, engine] of [
      ["chrome", chromium],
      ["firefox", firefox],
    ]) {
      const browser = await engine.launch({
        headless: true,
        ...(name === "chrome" ? { channel: "chrome" } : {}),
      });
      try {
        const page = await browser.newPage({
            viewport: { width: 1000, height: 800 },
          }),
          errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        failNext = true;
        await page.goto("http://127.0.0.1:" + server.address().port, {
          timeout: 90000,
        });
        await page.waitForFunction(() => window.__bootCreateObserved, null, {
          timeout: 90000,
        });
        await page.waitForTimeout(800);
        assert(
          await page
            .getByRole("button", { name: "Réessayer", exact: true })
            .isVisible(),
        );
        assert.deepEqual(errors, []);
        assert.equal(
          await page
            .getByRole("button", { name: "Prendre le service", exact: true })
            .count(),
          0,
        );
        await page.screenshot({ path: path.join(out, name + "-error.png") });
        await page
          .getByRole("button", { name: "Réessayer", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Prendre le service", exact: true })
          .waitFor({ timeout: 90000 });
        assert(await page.locator("#loading").isHidden());
        assert.deepEqual(errors, []);
        reports.push({
          name,
          version: browser.version(),
          errors,
          failedBootGuarded: true,
          nativeRetryReady: true,
        });
      } finally {
        await browser.close();
      }
    }
    fs.writeFileSync(
      path.join(out, "reports.json"),
      JSON.stringify(reports, null, 2),
    );
    console.log(
      "PASS real Phaser boot error: no update exceptions, visible retry and successful native reload in Chrome/Firefox",
    );
  } finally {
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
