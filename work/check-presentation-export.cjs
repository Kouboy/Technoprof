const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const {
  createPresentationPlugin,
} = require("../tools/presentation-assets.cjs");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const mode of ["day", "pages", "development"]) {
  const plugin = createPresentationPlugin(root, mode),
    out = plugin.transformIndexHtml.handler(html),
    emitted = [];
  assert(!out.includes("__PRESENTATION_"));
  assert.match(out, /<link\s+rel="icon"[^>]+href="data:image\/png;base64,/);
  assert.match(out, /class="loading-portrait"\s+src="data:image\/png;base64,/);
  assert(out.includes("og:image:width") && out.includes("1200"));
  plugin.generateBundle.call({ emitFile: (e) => emitted.push(e) });
  assert.equal(
    emitted.length,
    mode === "pages" ? 1 : 0,
    "promotional image is Pages-only, never in standalone preload",
  );
  if (mode === "pages") {
    assert.equal(emitted[0].fileName, "presentation/social-2026-10-28.png");
    assert.deepEqual(
      emitted[0].source,
      fs.readFileSync(
        path.join(root, "art/presentation-2026-10-28/social-1200x630.png"),
      ),
    );
  }
}
console.log(
  "PASS inline offline icons, sharing metadata, Pages-only byte-identical social card",
);
