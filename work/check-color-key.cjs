// Compare the four real production loops over every RGB value, including all
// possible source alpha bytes. No image decoder or resampling is involved.
const fs = require("node:fs"),
  assert = require("node:assert/strict");
const count = 256 ** 3,
  original = new Uint8ClampedArray(count * 4);
for (let color = 0; color < count; color++) {
  const i = color * 4;
  original[i] = color >>> 16;
  original[i + 1] = (color >>> 8) & 255;
  original[i + 2] = color & 255;
  original[i + 3] = (color >>> 5) & 255;
}
const expected = original.slice();
for (let i = 0; i < expected.length; i += 4) {
  const [r, g, b] = expected.subarray(i, i + 3);
  if (r > 110 && b > 100 && r > g * 1.6 && b > g * 1.6) expected[i + 3] = 0;
}
for (const file of ["car-art", "hall-art", "road-art", "slice-art"]) {
  const source = fs.readFileSync("src/" + file + ".ts", "utf8");
  const loop = source.match(
    /for \(let i = 0; i < pixels\.data\.length; i \+= 4\) \{[\s\S]*?\n\s*\}/,
  )?.[0];
  assert(loop, file + " production loop found");
  assert(!loop.includes("subarray"), "no temporary per-pixel view");
  const actual = original.slice();
  new Function("pixels", loop)({ data: actual });
  assert(
    Buffer.from(actual.buffer).equals(Buffer.from(expected.buffer)),
    file + " identical RGBA for all 16777216 RGB values",
  );
}
console.log(
  "PASS four production color-key loops: identical RGBA for all 16,777,216 RGB values and 256 alpha values",
);
