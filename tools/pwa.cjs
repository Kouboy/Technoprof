const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");

function createPwaPlugin(root) {
  return {
    name: "technoprof-pwa",
    apply: "build",
    transformIndexHtml() {
      return [
        {
          tag: "link",
          attrs: { rel: "manifest", href: "./manifest.webmanifest" },
        },
        {
          tag: "link",
          attrs: { rel: "apple-touch-icon", href: "./pwa/icon-192.png" },
        },
      ];
    },
    writeBundle(options, bundle) {
      const dir = path.resolve(options.dir);
      fs.mkdirSync(path.join(dir, "pwa"), { recursive: true });
      const icons = [192, 512].map((size) => {
        const name = `icon-${size}.png`;
        const src = `pwa/${name}`;
        fs.copyFileSync(
          path.join(root, "art/presentation-2026-10-28", name),
          path.join(dir, src),
        );
        return {
          src: `./${src}`,
          sizes: `${size}x${size}`,
          type: "image/png",
          purpose: "any",
        };
      });
      const manifest = {
        id: "./",
        name: "TECHNOPROF — Physique appliquée",
        short_name: "TECHNOPROF",
        lang: "fr",
        start_url: "./?fenetre=1",
        scope: "./",
        display: "standalone",
        orientation: "landscape",
        theme_color: "#141e27",
        background_color: "#101719",
        icons,
      };
      fs.writeFileSync(
        path.join(dir, "manifest.webmanifest"),
        JSON.stringify(manifest, null, 2),
      );
      const files = [
        "index.html",
        "manifest.webmanifest",
        ...icons.map((icon) => icon.src.slice(2)),
        ...Object.keys(bundle).filter((name) =>
          /^(assets|art|audio)\//.test(name),
        ),
      ].sort();
      const hash = createHash("sha256");
      let bytes = 0;
      for (const name of files) {
        const data = fs.readFileSync(path.join(dir, name));
        bytes += data.length;
        hash.update(JSON.stringify([name, data.length])).update(data);
      }
      const release = {
        version: hash.digest("hex").slice(0, 20),
        bytes,
        files,
      };
      const worker = fs.readFileSync(path.join(__dirname, "pwa-sw.js"), "utf8");
      fs.writeFileSync(
        path.join(dir, "sw.js"),
        `const RELEASE = ${JSON.stringify(release)};\n${worker}`,
      );
    },
  };
}

module.exports = { createPwaPlugin };
