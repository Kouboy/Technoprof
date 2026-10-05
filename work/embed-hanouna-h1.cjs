const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const sources = {
  entree: "entree-v5.png",
  etage: "etage-v4.png",
  infirmerie: "infirmerie-v1.png",
};
const data = Object.fromEntries(
  Object.entries(sources).map(([key, file]) => [
    key,
    "data:image/png;base64," +
      fs
        .readFileSync(path.join(root, "art/hanouna-h1", file))
        .toString("base64"),
  ]),
);
fs.writeFileSync(
  path.join(root, "src/hanouna-h1-data.ts"),
  "// Original generated PNGs embedded unchanged. Rebuild: node work/embed-hanouna-h1.cjs\n" +
    "export const HANOUNA_H1_DATA = " +
    JSON.stringify(data) +
    ";\n",
);
for (const [key, file] of Object.entries(sources)) {
  const bytes = fs.readFileSync(path.join(root, "art/hanouna-h1", file));
  console.log(key, bytes.readUInt32BE(16), bytes.readUInt32BE(20));
}
