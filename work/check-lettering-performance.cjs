const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const { stripTypeScriptTypes } = require("node:module");
const strip = (s) =>
  stripTypeScriptTypes(
    s.replace(/^import[^\n]*\n/gm, "").replace(/export /g, ""),
  );
const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  strip(fs.readFileSync("src/small-lettering.ts", "utf8")) +
    ";globalThis.smallRows=rows;",
  ctx,
);
vm.runInContext(
  strip(fs.readFileSync("src/cadre.ts", "utf8")) + ";globalThis.font=GLYPHS;",
  ctx,
);
function raster(draw) {
  const pixels = new Map();
  let calls = 0;
  draw({
    fillStyle() {},
    fillRect(x, y, w, h) {
      calls++;
      for (let a = x; a < x + w; a++)
        for (let b = y; b < y + h; b++) pixels.set(a + "," + b, 1);
    },
  });
  return { pixels: [...pixels.keys()].sort(), calls };
}
function reference(g, table, normalize, x, y, text, scale, max) {
  let cursor = Math.round(x),
    end = cursor + max;
  for (const c of normalize(text)) {
    const rows = table[c] ?? table["?"],
      glyph = typeof rows === "string" ? rows.split("/") : rows;
    if (cursor + glyph[0].length * scale > end) break;
    glyph.forEach((row, j) =>
      [...row].forEach((p, i) => {
        if (p === "1")
          g.fillRect(
            cursor + i * scale,
            Math.round(y) + j * scale,
            scale,
            scale,
          );
      }),
    );
    cursor += (glyph[0].length + 1) * scale;
  }
}
const texts = [
  "",
  "ÉTAT DU PROF",
  "RESEAU RECTORAL — AFFECTATION REÇUE",
  "SALLES 42C / B12",
  "21:30 / RETOUR À LA MAISON",
  "1234567890 %!?",
  "ABCDEFGHIJKLM NOPQRSTUVWXYZ",
  "L’ÉCOLE — ?",
];
const smallClean = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replaceAll("’", "'");
const largeClean = (s) => smallClean(s).replaceAll("—", "-");
let actualCalls = 0,
  referenceCalls = 0;
for (const text of texts) {
  for (const [x, y] of [
    [0, 0],
    [2.4, 7.8],
    [-3.6, 4.1],
  ]) {
    for (const scale of [1, 2])
      for (const max of [3, 27, 320]) {
        const a = raster((g) => ctx.bitmap(g, x, y, text, 1, scale, max));
        const b = raster((g) =>
          reference(g, ctx.font, largeClean, x, y, text, scale, max),
        );
        assert.deepEqual(a.pixels, b.pixels, "bitmap pixels/clipping: " + text);
        actualCalls += a.calls;
        referenceCalls += b.calls;
      }
    const a = raster((g) => ctx.smallPrint(g, x, y, text));
    const b = raster((g) =>
      reference(g, ctx.smallRows, smallClean, x, y, text, 1, Infinity),
    );
    assert.deepEqual(a.pixels, b.pixels, "small lettering: " + text);
    actualCalls += a.calls;
    referenceCalls += b.calls;
  }
}
assert(
  actualCalls < referenceCalls * 0.8,
  "merge contiguous ink: " + actualCalls + "/" + referenceCalls,
);
console.log(
  "PASS identical lettering pixels, accents, clipping and scales; rectangles " +
    referenceCalls +
    " -> " +
    actualCalls,
);
