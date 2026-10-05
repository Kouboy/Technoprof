const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
function ready(fps, facing) {
  const t = createGame(),
    g = t.g;
  g.workshop = true;
  g.controls = new t.api.ActionInput();
  g.keys = g.controls.keys;
  g.physicalKeys = Object.fromEntries(
    Object.values(t.api.BINDINGS)
      .flat()
      .map((k) => [k, { isDown: false, just: false }]),
  );
  g.direct = new t.api.DirectInput(g);
  g.loadScenario("inshape-navigation-i1-view-308");
  const start = [g.px, g.enemies[0].x, g.remaining];
  t.advance(1, fps);
  assert.deepEqual(
    [g.px, g.enemies[0].x, g.remaining],
    start,
    "speech freezes both actors and timer",
  );
  for (let i = 0; g.encounterTime && i < 12; i++) {
    g.physicalKeys.F.just = true;
    t.step(1000 / fps);
  }
  assert(!g.encounterTime);
  const e = g.enemies[0];
  assert(e.female && e.actor === "catchup-student");
  assert.equal(e.hp, 2);
  g.px = 160;
  g.face = -facing;
  e.x = 160 - facing * 40;
  e.facing = facing;
  g.inv = 0;
  for (let i = 0; e.wind <= 0 && i < fps; i++) t.step(1000 / fps);
  assert(e.wind > 0 && e.wind <= 0.34, "existing visible anticipation");
  return t;
}
for (const fps of [30, 60, 120])
  for (const facing of [-1, 1]) {
    for (const strategy of ["contact", "jump", "retreat"]) {
      const t = ready(fps, facing),
        g = t.g,
        e = g.enemies[0],
        hp = g.hp;
      if (strategy === "jump") g.physicalKeys.SPACE.just = true;
      if (strategy === "retreat")
        g.physicalKeys[facing > 0 ? "D" : "Q"].isDown = true;
      for (let n = 0; !e.strikeTime && n < fps; n++) t.step(1000 / fps);
      assert(
        e.strikeTime > 0 && e.strikeTime <= 0.2,
        "readable hand follow-through",
      );
      if (strategy === "contact") {
        assert.equal(g.hp, hp - 1);
        assert.equal(g.impactY, 110);
        const hits = g.session.events.filter((x) => x.kind === "hurt").length;
        t.advance(0.15, fps);
        assert.equal(
          g.session.events.filter((x) => x.kind === "hurt").length,
          hits,
          "no repeated grab damage during pose",
        );
      } else assert.equal(g.hp, hp, strategy + " avoids interception");
      const frozen = [g.remaining, g.px, e.x, e.strikeTime, e.recovery];
      g.setPaused(true);
      t.advance(1, fps);
      assert.deepEqual(
        [g.remaining, g.px, e.x, e.strikeTime, e.recovery],
        frozen,
      );
      g.setPaused(false);
      for (const k of Object.values(g.physicalKeys)) k.isDown = false;
    }
    const t = ready(fps, facing),
      g = t.g,
      e = g.enemies[0];
    g.physicalKeys.F.just = true;
    t.step(1000 / fps);
    for (let n = 0; e.hp === 2 && n < fps * 0.2; n++) t.step(1000 / fps);
    assert.equal(e.hp, 1);
    assert.equal(e.wind, 0, "book interrupts preparation");
    t.advance(0.12, fps);
    assert.equal(e.strikeTime, 0, "cancelled interception cannot strike later");
  }
console.log(
  "PASS I1 terminale: frozen full conversation; interception contact, jump/retreat dodge, 200ms pose, one damage, pause, interrupted attack; both orientations at 30/60/120fps.",
);
