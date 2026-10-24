const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { createPagesPlugin, musicFiles } = require("../tools/pages-assets.cjs");
const root = path.resolve(__dirname, ".."),
  plugin = createPagesPlugin(root),
  emitted = [];
const ctx = {
  emitFile(entry) {
    emitted.push(entry);
    return String(emitted.length);
  },
  getFileName(ref) {
    return emitted[Number(ref) - 1].fileName;
  },
};
const bytes = Buffer.from("a small unchanged bitmap"),
  uri = "data:image/png;base64," + bytes.toString("base64");
const transformed = plugin.transform.call(
  ctx,
  `export const A="${uri}"; export const B="${uri}";`,
  path.join(root, "src/test-data.ts"),
);
assert(!transformed.code.includes("data:image"));
assert.equal(emitted.length, 1, "deduplicate identical images");
assert.deepEqual(emitted[0].source, bytes);
assert(emitted[0].fileName.endsWith(".png"));
assert(transformed.code.includes("import.meta.ROLLUP_FILE_URL_1"));
assert.equal(
  plugin.transform.call(ctx, "plain code", path.join(root, "src/plain.ts")),
  null,
);
assert.equal(
  plugin.transform.call(
    ctx,
    `"${uri}"`,
    path.join(root, "node_modules/example/src/plain.js"),
  ),
  null,
);
const files = musicFiles(root);
assert.equal(files.length, 12);
assert.equal(new Set(files).size, 12);
for (const file of files) {
  assert(file.startsWith("audio/"));
  assert(file.endsWith(".wav"));
  assert(fs.existsSync(path.join(root, file)));
}
plugin.generateBundle.call(ctx, {}, {});
for (const file of files) {
  const found = emitted.find((e) => e.fileName === file);
  assert(found, file);
  assert.equal(
    crypto.createHash("sha256").update(found.source).digest("hex"),
    crypto
      .createHash("sha256")
      .update(fs.readFileSync(path.join(root, file)))
      .digest("hex"),
  );
}
assert(emitted.some((e) => e.fileName === ".nojekyll"));
const info = JSON.parse(
  emitted.find((e) => e.fileName === "build-info.json").source,
);
assert.equal(info.profile, "journee-musicale");
assert.equal(info.music.length, 12);
console.log(
  "PASS Pages export: image bytes preserved/deduplicated, only project data transformed, twelve identical WAVs and build identity",
);
