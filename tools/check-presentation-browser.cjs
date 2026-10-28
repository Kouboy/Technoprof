// Isolated real HTML/CSS and loading controller, without booting a second game.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const { createPresentationPlugin } = require("./presentation-assets.cjs");
const root = path.resolve(__dirname, ".."),
  out = path.join(
    root,
    "work/checkpoints/optimization-2026-10-28/presentation",
  );
fs.mkdirSync(out, { recursive: true });
const source = stripTypeScriptTypes(
  fs
    .readFileSync(path.join(root, "src/loading-presentation.ts"), "utf8")
    .replace(/export /g, ""),
);
const html =
  createPresentationPlugin(root, "development")
    .transformIndexHtml.handler(
      fs.readFileSync(path.join(root, "index.html"), "utf8"),
    )
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "") +
  '<style>body>#game-shell~*{display:none!important}</style><script type="module">' +
  source +
  "\nconst handlers={};installLoadingPresentation({on:(event,fn)=>handlers[event]=fn});window.loadingProbe={handlers,prepareLoadingPresentation,finishLoadingPresentation};</script>";
const server = http.createServer((_req, res) =>
  res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" }).end(html),
);
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
        const page = await browser.newPage(),
          errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        for (const [width, height] of [
          [1000, 800],
          [390, 844],
          [844, 390],
          [320, 568],
        ]) {
          await page.setViewportSize({ width, height });
          await page.goto("http://127.0.0.1:" + server.address().port);
          await page.waitForFunction(() => !!window.loadingProbe);
          await page.evaluate(() => loadingProbe.handlers.progress(0.45));
          const layout = await page.evaluate(() => {
            const panel = document.getElementById("loading"),
              box = panel.getBoundingClientRect(),
              items = [...panel.children]
                .filter((e) => !e.hidden)
                .map((e) => {
                  const r = e.getBoundingClientRect();
                  return {
                    tag: e.tagName,
                    x: r.x,
                    y: r.y,
                    right: r.right,
                    bottom: r.bottom,
                  };
                });
            return {
              box: { x: box.x, y: box.y, right: box.right, bottom: box.bottom },
              items,
              scroll: panel.scrollHeight > panel.clientHeight,
              progress: document.getElementById("loading-progress").value,
              icon: document.querySelector(".loading-portrait").naturalWidth,
              overflow: document.documentElement.scrollWidth > innerWidth,
            };
          });
          fs.writeFileSync(
            path.join(out, name + "-" + width + "-layout.json"),
            JSON.stringify(layout, null, 2),
          );
          assert.equal(layout.icon, 128);
          assert.equal(layout.progress, 0.45);
          assert(!layout.overflow);
          assert(!layout.scroll, "loader content fits");
          for (const item of layout.items)
            assert(
              item.x >= layout.box.x &&
                item.right <= layout.box.right + 1 &&
                item.y >= layout.box.y &&
                item.bottom <= layout.box.bottom + 1,
              "loader child fits",
            );
          await page.locator("#game-shell").screenshot({
            path: path.join(out, `${name}-${width}x${height}.png`),
          });
          await page.evaluate(() => loadingProbe.handlers.complete());
          assert.equal(
            await page.locator("progress").getAttribute("value"),
            null,
          );
          await page.evaluate(() => loadingProbe.finishLoadingPresentation());
          assert(await page.locator("#loading").isHidden());
          reports.push({ name, width, height, layout });
        }
        await page.reload();
        await page.waitForFunction(() => !!window.loadingProbe);
        await page.evaluate(() => {
          loadingProbe.handlers.loaderror();
          loadingProbe.finishLoadingPresentation();
        });
        assert(
          await page.getByRole("button", { name: "Réessayer" }).isVisible(),
        );
        await page.getByRole("button", { name: "Réessayer" }).click();
        await page.waitForFunction(() => !!window.loadingProbe);
        assert(
          await page.getByRole("button", { name: "Réessayer" }).isHidden(),
        );
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    }
    fs.writeFileSync(
      path.join(out, "reports.json"),
      JSON.stringify(reports, null, 2),
    );
    console.log(
      "PASS Chrome/Firefox loading at 4 sizes, real stages/error/reload, no overflow or clipped content",
    );
  } finally {
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
