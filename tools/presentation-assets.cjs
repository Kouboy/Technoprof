const fs = require("node:fs"),
  path = require("node:path");

function createPresentationPlugin(root, mode) {
  const directory = path.join(root, "art/presentation-2026-10-28");
  return {
    name: "technoprof-presentation",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        for (const size of [32, 128]) {
          const png = fs.readFileSync(path.join(directory, `icon-${size}.png`));
          html = html.replaceAll(
            `__PRESENTATION_ICON_${size}__`,
            "data:image/png;base64," + png.toString("base64"),
          );
        }
        return html;
      },
    },
    generateBundle() {
      // A crawler reads this image; the game never preloads the promotional kit.
      if (mode === "pages")
        this.emitFile({
          type: "asset",
          fileName: "presentation/social-2026-10-28.png",
          source: fs.readFileSync(path.join(directory, "social-1200x630.png")),
        });
    },
  };
}
module.exports = { createPresentationPlugin };
