const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
assert(
  fs.existsSync("src/course-presentation.ts"),
  "dedicated bitmap course presentation",
);
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
const c = {};
vm.createContext(c);
vm.runInContext(
  require("node:module").stripTypeScriptTypes(
    ["small-lettering", "cadre", "course-presentation"]
      .map((n) => strip(fs.readFileSync(`src/${n}.ts`, "utf8")))
      .join("\n"),
  ) + ";this.renderCourse=drawCourseCard;this.renderCadre=drawCadre;",
  c,
);
for (const phase of ["blackBefore", "course", "blackAfter", "later"]) {
  const marks = [];
  c.renderCadre(
    {
      fillStyle() {},
      fillRect(...r) {
        marks.push(r);
      },
    },
    { phase },
    4000,
  );
  assert.equal(
    marks.length,
    0,
    "course interludes must not display gameplay status or footer",
  );
}
for (const phase of ["course", "later"]) {
  const rects = [];
  let color;
  c.renderCourse(
    {
      fillStyle(c) {
        color = c;
      },
      fillRect(x, y, w, h) {
        rects.push({ x, y, w, h, color });
      },
    },
    phase,
  );
  const glyphs = rects.filter((r) => r.color === 0xe3d4b3);
  assert(glyphs.length > 30, "readable pixel letters");
  const left = Math.min(...glyphs.map((r) => r.x)),
    right = Math.max(...glyphs.map((r) => r.x + r.w));
  assert(Math.abs((left + right) / 2 - 160) <= 0.5, "text optically centered");
  for (const r of rects) {
    assert(
      [r.x, r.y, r.w, r.h].every(Number.isInteger),
      "no subpixel softening",
    );
    assert(
      r.x >= 7 && r.x + r.w <= 313 && r.y >= 7 && r.y + r.h <= 175,
      "stay inside viewport",
    );
  }
}
console.log(
  "PASS course cards: integer bitmap, centered hierarchy, quiet black viewport and CADRE boundaries",
);
