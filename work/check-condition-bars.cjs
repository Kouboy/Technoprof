const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const { stripTypeScriptTypes } = require("node:module");
const strip = (s) => s.replace(/import[^\n]*\n/g, "").replace(/export /g, "");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  stripTypeScriptTypes(
    ["small-lettering", "cadre"]
      .map((n) => strip(fs.readFileSync("src/" + n + ".ts", "utf8")))
      .join("\n"),
  ) + ";globalThis.bars=drawConditionBars;globalThis.draw=drawCadre;",
  ctx,
);
function paint(value, max, y) {
  const shapes = [];
  let color;
  ctx.bars(
    {
      fillStyle(c) {
        color = c;
      },
      fillRect(x, yy, w, h) {
        shapes.push({ x, y: yy - y, w, h, color });
      },
    },
    value,
    max,
    y,
  );
  return shapes;
}
for (const value of [0, 20, 40, 60, 80, 100])
  assert.deepEqual(
    paint(value, 100, 222),
    paint(value / 20, 5, 210),
    "same car/prof design at " + value + "%",
  );
const shapes = paint(82, 100, 222);
assert.equal(shapes.filter((r) => r.w === 14 && r.h === 8).length, 5);
const fills = shapes.filter((r) => r.h === 5);
assert.equal(fills.length, 5);
assert.deepEqual(
  fills.map((r) => r.w),
  [10, 10, 10, 10, 1],
);
assert.equal(paint(0, 100, 222).filter((r) => r.h === 5).length, 0);
assert.equal(
  paint(100, 100, 222).filter((r) => r.h === 5 && r.w === 10).length,
  5,
);
console.log(
  "PASS shared five bars, car/prof thresholds, partial segment, full and empty",
);
const labels = [];
ctx.smallPrint = (g, x, y, text) => labels.push(text);
ctx.draw(
  { fillStyle() {}, fillRect() {} },
  {
    phase: "road",
    notified: true,
    remaining: 180,
    vehicle: 82,
    speed: 110,
    road: 100,
    mission: 0,
    hp: 5,
    age: 0,
    ambienceClock: 0,
    paused: false,
  },
  4200,
);
assert(
  !labels.some((t) => t.includes("%")),
  "car HUD uses condition bars without an integrity percentage",
);
