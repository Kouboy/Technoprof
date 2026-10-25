const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const scope = {};
vm.createContext(scope);
const source = fs
  .readFileSync("src/presentation.ts", "utf8")
  .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
  .replace(/export /g, "");
vm.runInContext(
  stripTypeScriptTypes(source) +
    ';this.draw=typeof drawBossHealth === "function" ? drawBossHealth : null;',
  scope,
);
assert(scope.draw, "shared boss gauge exists");
let color,
  rects = [];
const g = {
  fillStyle: (c) => (color = c),
  fillRect: (x, y, w, h) => rects.push({ x, y, w, h, color }),
};
for (const max of [6, 7, 8])
  for (const hp of [0, 1, max - 1, max]) {
    rects = [];
    scope.draw(g, hp, max);
    const cells = rects.filter((r) => r.color === 0x9c4c3e);
    assert.equal(cells.length, hp, "one rusty red cell per actual hit point");
    assert(rects.length > 20, "frame, bevel, recesses, screws and wear");
    for (const r of rects) {
      assert([r.x, r.y, r.w, r.h].every(Number.isInteger));
      assert(r.x >= 99 && r.x + r.w <= 221 && r.y >= 14 && r.y + r.h <= 26);
    }
  }
const { createGame } = require("./test-harness.cjs");
for (const scenario of [
  "hanouna-navigation-h1-boss",
  "bruel-navigation-a3-parent",
  "inshape-navigation-i2-boss",
]) {
  const t = createGame(),
    g = t.g;
  g.workshop = true;
  g.loadScenario(scenario);
  const boss = g.enemies.find((e) => e.boss);
  assert(boss);
  assert.equal(boss.maxHp, boss.hp);
  boss.hp--;
  const max = boss.maxHp;
  g.enterRoom(g.room, g.px);
  assert.equal(g.enemies[0].maxHp, max, "return never shrinks capacity");
}
console.log(
  "PASS boss gauge: true initial HP, persistent capacity, readable empty cells and integer metal frame",
);
