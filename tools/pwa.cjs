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
      const dimensions = {};
      for (const [name, entry] of Object.entries(bundle)) {
        if (!/^art\/[a-f0-9]+\.png$/.test(name)) continue;
        const header = entry.source;
        const view = new DataView(
          header.buffer,
          header.byteOffset,
          header.byteLength,
        );
        dimensions[path.basename(name)] = [
          view.getUint32(16),
          view.getUint32(20),
        ];
      }
      const index = path.join(dir, "index.html");
      const html = fs.readFileSync(index, "utf8");
      fs.writeFileSync(
        index,
        html.replace(
          /<html[^>]*>/,
          (tag) =>
            `${tag}\n<script id="asset-dimensions" type="application/json">${JSON.stringify(dimensions)}</script>`,
        ),
      );
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
        display: "fullscreen",
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
