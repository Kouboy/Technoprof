const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { musicFiles } = require("../tools/pages-assets.cjs");
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const read = (name) => fs.readFileSync(path.join(dist, name));
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const info = JSON.parse(read("build-info.json"));
assert.equal(info.profile, "journee-musicale");
assert.match(info.commit, /^[a-f0-9]{40}$/);
assert.deepEqual(info.music, musicFiles(root));
assert.equal(info.music.length, 17);
const html = read("index.html").toString();
assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest"/);
const sizes = JSON.parse(
  html.match(
    /<script id="asset-dimensions" type="application\/json">([^<]+)<\/script>/,
  )[1],
);
assert.equal(
  Object.keys(sizes).length,
  info.images.filter((image) => image.fileName.endsWith(".png")).length,
);
const manifest = JSON.parse(read("manifest.webmanifest"));
assert.equal(manifest.scope, "./");
assert.equal(manifest.display, "fullscreen");
assert.equal(manifest.orientation, "landscape");
assert.deepEqual(
  manifest.icons.map((icon) => icon.sizes),
  ["192x192", "512x512"],
);
for (const icon of manifest.icons) assert(read(icon.src).length > 1000);
const worker = read("sw.js").toString();
const offline = JSON.parse(worker.match(/^const RELEASE = (.+);/m)[1]);
assert(offline.files.includes("index.html"));
assert(
  offline.files.every((name) => fs.statSync(path.join(dist, name)).isFile()),
);
assert.equal(
  offline.bytes,
  offline.files.reduce((bytes, name) => bytes + read(name).length, 0),
);
assert(!offline.files.includes("diagnostic-voix.html"));
assert(html.includes("Day player bootstrap"));
assert(!html.includes("const testView"));
assert(
  html.includes("document.getElementById('player-feedback').hidden = false"),
);
assert(fs.existsSync(path.join(dist, ".nojekyll")));
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(
  (m) => m[1],
);
assert(scripts.length > 0);
for (const name of [
  ...scripts.map((url) => url.slice(2)),
  ...info.music,
  ...info.images.map((image) => image.fileName),
])
  assert(offline.files.includes(name), `offline copy ships ${name}`);
const inlineRadio = new Set();
for (const url of scripts) {
  assert(url.startsWith("./"), "Script URL must work below /Technoprof/");
  const code = read(url).toString();
  for (const [, sample] of code.matchAll(
    /data:audio\/mpeg;base64,([A-Za-z0-9+/=]+)/g,
  ))
    inlineRadio.add(hash(Buffer.from(sample, "base64")));
  assert(
    Buffer.byteLength(code) < 5 * 1024 * 1024,
    "Do not ship the embedded standalone JS on the web",
  );
  assert(
    !/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{10000}/.test(code),
    "Large image payload still embedded",
  );
}
for (const name of ["matin", "midi", "soir"])
  assert(
    inlineRadio.has(
      hash(fs.readFileSync(path.join(root, "audio/bulletins", name + ".mp3"))),
    ),
    name + " bulletin inline",
  );
assert(info.images.length > 0);
for (const image of info.images) {
  const bytes = read(image.fileName);
  assert.equal(bytes.length, image.bytes);
  assert.equal(hash(bytes), image.sha256);
  if (image.fileName.endsWith(".png"))
    assert.deepEqual(sizes[path.basename(image.fileName)], [
      bytes.readUInt32BE(16),
      bytes.readUInt32BE(20),
    ]);
}
for (const name of info.music)
  assert.equal(
    hash(read(name)),
    hash(fs.readFileSync(path.join(root, name))),
    name,
  );
function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}
const shippedAudio = filesIn(path.join(dist, "audio"))
  .map((f) => path.relative(dist, f).replaceAll("\\", "/"))
  .sort();
assert.deepEqual(
  shippedAudio,
  [...info.music].sort(),
  "Ship only the seventeen used audio stems/tracks",
);
const all = filesIn(dist);
const total = all.reduce((sum, file) => sum + fs.statSync(file).size, 0);
assert(total < 1024 ** 3, "Pages site size");
console.log(
  `PASS Pages build: ${info.images.length} intact images, 17 original WAVs, relative entrypoint, ${(total / 1024 ** 2).toFixed(1)} MiB total`,
);
