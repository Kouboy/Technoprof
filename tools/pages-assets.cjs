// Web delivery only. Keep standalone exports embedded and original image bytes intact.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  cp = require("node:child_process");

function musicFiles(root) {
  const source = fs.readFileSync(path.join(root, "src/music.ts"), "utf8");
  const map = source.match(
    /export const MUSIC_FILES = \{([\s\S]*?)\} as const;/,
  );
  if (!map) throw Error("Music catalogue not found");
  const files = [...map[1].matchAll(/"([^"\n]+\.wav)"/g)].map(
    (m) => "audio/" + m[1],
  );
  const films = fs.readFileSync(path.join(root, "src/cinematic-audio.ts"), "utf8").match(/export const CINEMATIC_AUDIO = \{([\s\S]*?)\} as const;/);
  if (!films) throw Error("Cinematic audio catalogue not found");
  files.push(...[...films[1].matchAll(/"([^"\n]+\.wav)"/g)].map(m => "audio/" + m[1]));
  if (
    !files.length ||
    files.some((f) => f.includes("..") || !f.startsWith("audio/"))
  )
    throw Error("Unexpected music paths");
  return [...new Set(files)];
}

function createPagesPlugin(root) {
  root = path.resolve(root).replaceAll("\\", "/");
  const sourceRoot = path.resolve(root, "src").replaceAll("\\", "/") + "/";
  const images = new Map();
  return {
    name: "technoprof-pages-assets",
    enforce: "pre",
    transform(source, id) {
      const clean = id.split("?")[0].replaceAll("\\", "/");
      if (!clean.startsWith(sourceRoot) || !clean.endsWith(".ts")) return null;
      let changed = false;
      const code = source.replace(
        /(["'])(data:image\/(png|webp|jpe?g);base64,([A-Za-z0-9+/=]+))\1/g,
        (_match, _quote, _uri, extension, base64) => {
          const bytes = Buffer.from(base64, "base64");
          const sha256 = crypto
            .createHash("sha256")
            .update(bytes)
            .digest("hex");
          const fileName =
            "art/" + sha256 + "." + (extension === "jpeg" ? "jpg" : extension);
          let image = images.get(fileName);
          if (!image) {
            image = {
              fileName,
              sha256,
              bytes: bytes.length,
              ref: this.emitFile({ type: "asset", fileName, source: bytes }),
            };
            images.set(fileName, image);
          }
          changed = true;
          return "import.meta.ROLLUP_FILE_URL_" + image.ref;
        },
      );
      return changed ? { code, map: null } : null;
    },
    generateBundle() {
      const music = musicFiles(root);
      for (const fileName of music)
        this.emitFile({
          type: "asset",
          fileName,
          source: fs.readFileSync(path.join(root, fileName)),
        });
      let commit = process.env.GITHUB_SHA || "local";
      if (commit === "local") {
        try {
          commit = cp
            .execFileSync(
              "git",
              ["-c", "safe.directory=" + root, "rev-parse", "HEAD"],
              {
                cwd: root,
                encoding: "utf8",
                stdio: ["ignore", "pipe", "ignore"],
              },
            )
            .trim();
        } catch {}
      }
      const info = {
        profile: "journee-musicale",
        commit,
        music,
        images: [...images.values()].map(({ fileName, sha256, bytes }) => ({
          fileName,
          sha256,
          bytes,
        })),
      };
      this.emitFile({
        type: "asset",
        fileName: "build-info.json",
        source: JSON.stringify(info, null, 2) + "\n",
      });
      this.emitFile({ type: "asset", fileName: ".nojekyll", source: "" });
    },
  };
}
module.exports = { createPagesPlugin, musicFiles };
