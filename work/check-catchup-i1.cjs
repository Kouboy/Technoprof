const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
function ready(fps, facing, distance = 40) {
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
    "speech freezes actors and timer",
  );
  for (let i = 0; g.encounterTime && i < 12; i++) {
    g.physicalKeys.F.just = true;
    t.step(1000 / fps);
  }
  assert(!g.encounterTime);
  const e = g.enemies[0];
  assert(e.female && e.actor === "catchup-student");
  assert.equal(e.hp, 3);
  g.px = 160;
  g.face = -facing;
  e.x = 160 - facing * distance;
  e.facing = facing;
  g.inv = 0;
  for (let i = 0; !e.wind && i < fps; i++) t.step(1000 / fps);
  assert(e.wind > 0, "visible anticipation");
  assert.equal(e.catchupAttack, distance > 63 ? "book" : "kick");
  return t;
}
function release(t, fps) {
  const e = t.g.enemies[0];
  for (let n = 0; !e.strikeTime && n < fps; n++) t.step(1000 / fps);
  assert(e.strikeTime > 0 && e.strikeTime <= 0.26, "readable follow-through");
}
function pause(t, fps) {
  const g = t.g,
    e = g.enemies[0];
  const state = JSON.stringify([
    g.remaining,
    g.px,
    e.x,
    e.wind,
    e.strikeTime,
    e.recovery,
    g.projectiles,
  ]);
  g.setPaused(true);
  t.advance(1, fps);
  assert.equal(
    JSON.stringify([
      g.remaining,
      g.px,
      e.x,
      e.wind,
      e.strikeTime,
      e.recovery,
      g.projectiles,
    ]),
    state,
    "pause freezes attack and book",
  );
  g.setPaused(false);
}
for (const fps of [30, 60, 120])
  for (const facing of [-1, 1]) {
    for (const strategy of ["contact", "jump", "retreat", "cross"]) {
      const t = ready(fps, facing),
        g = t.g,
        e = g.enemies[0],
        hp = g.hp;
      pause(t, fps);
      if (strategy === "jump") g.physicalKeys.SPACE.just = true;
      if (strategy === "retreat")
        g.physicalKeys[facing > 0 ? "D" : "Q"].isDown = true;
      if (strategy === "cross") g.px = e.x - facing * 40;
      release(t, fps);
      assert.equal(
        g.hp,
        hp - (strategy === "contact" ? 1 : 0),
        strategy + " vs kick",
      );
      if (strategy === "contact") {
        assert.equal(g.impactY, 120);
        const hits = g.session.events.filter((x) => x.kind === "hurt").length;
        t.advance(0.18, fps);
        assert.equal(
          g.session.events.filter((x) => x.kind === "hurt").length,
          hits,
          "one damage per kick",
        );
      }
      pause(t, fps);
    }
    for (const strategy of ["contact", "jump", "cross"]) {
      const t = ready(fps, facing, 105),
        g = t.g,
        e = g.enemies[0],
        hp = g.hp;
      if (strategy === "cross") g.px = e.x - facing * 70;
      release(t, fps);
      assert.equal(g.projectiles.length, 1);
      assert.equal(g.projectiles[0].kind, "book");
      assert.equal(
        g.projectiles[0].dir,
        facing,
        "committed direction, no auto-aim",
      );
      pause(t, fps);
      if (strategy === "jump") {
        t.advance(0.15, fps);
        g.physicalKeys.SPACE.just = true;
      }
      t.advance(strategy === "jump" ? 0.48 : 0.63, fps);
      assert.equal(
        g.hp,
        hp - (strategy === "contact" ? 1 : 0),
        strategy + " vs book",
      );
      if (strategy === "contact") {
        assert.equal(
          g.session.events.filter((x) => x.kind === "hurt").length,
          1,
          "one book, one hit",
        );
        assert.equal(g.projectiles.length, 0, "book removed on impact");
      }
    }
    for (const distance of [40, 105]) {
      const t = ready(fps, facing, distance),
        g = t.g,
        e = g.enemies[0];
      g.px = e.x + facing * 40;
      g.face = -facing;
      g.physicalKeys.F.just = true;
      t.step(1000 / fps);
      for (let n = 0; e.hp === 3 && n < fps * 0.25; n++) t.step(1000 / fps);
      assert.equal(e.hp, 2);
      assert.equal(e.wind, 0, "book interrupts either preparation");
      assert.equal(e.strikeTime, 0);
      assert.equal(g.projectiles.length, 0);
      t.advance(0.1, fps);
      assert.equal(
        g.projectiles.length,
        0,
        "cancelled throw cannot emit later",
      );
    }
    const t = ready(fps, facing, 105),
      g = t.g,
      e = g.enemies[0];
    release(t, fps);
    g.px = e.x + facing * 40;
    g.inv = 10;
    for (let n = 0; e.catchupAttack !== "kick" && n < fps * 2; n++)
      t.step(1000 / fps);
    assert.equal(
      e.catchupAttack,
      "kick",
      "closing distance changes next attack to kick",
    );
    assert(e.wind > 0 && !e.recovery, "new kick follows recovery");
    // A projectile never survives a KO or a room transition.
    e.hp = 0;
    t.step(1000 / fps);
    assert.equal(g.projectiles.length, 0);
  }
console.log(
  "PASS I1 terminale: speech freeze; books and kicks, jump/retreat/cross dodge, committed facing, one-hit projectiles, visible recovery, interrupt/pause/KO; both orientations at 30/60/120fps.",
);
