const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
for (const fps of [30, 60, 120])
  for (const facing of [-1, 1]) {
    const t = createGame(),
      g = t.g;
    g.workshop = true;
    g.loadScenario("bruel-navigation-a3");
    const room = Object.values(g.navigationSpec().rooms).find(
      (r) => r.role === "filmer",
    );
    assert(room);
    g.enterRoom(room.id, 150);
    t.advance(0.8, fps);
    for (let i = 0; i < 20 && g.encounterTime; i++) t.press("X");
    const e = g.enemies[0];
    e.x = 150;
    g.px = 150 + facing * 45;
    g.face = -facing;
    e.facing = facing;
    e.cool = 0;
    g.inv = 999;
    t.step(1000 / fps);
    assert(e.wind >= 0.57, "filming pupil has ~0.6s actual preparation");
    let windTime = 0,
      heldX;
    while (e.wind > 0 && windTime < 1) {
      const wind = e.wind,
        x = e.x;
      if (wind <= 0.17) heldX ??= x;
      t.step(1000 / fps);
      windTime += 1 / fps;
      if (heldX !== undefined)
        assert(Math.abs(e.x - heldX) < 0.001, "feet settle before release");
    }
    assert(windTime >= 0.55 && windTime < 0.65);
    assert.equal(e.facing, facing);
    assert(e.strikeTime > 0, "visible active pose after preparation");
    e.wind = 0.5;
    e.recovery = 0;
    e.stun = 0;
    g.setPaused(true);
    const x = e.x;
    t.advance(0.3, fps);
    assert.equal(e.wind, 0.5);
    assert.equal(e.x, x);
    g.setPaused(false);
    // Close, correctly facing book contact cancels preparation.
    e.x = 220;
    g.px = 180;
    g.face = 1;
    g.attack = 0;
    g.playerRecovery = 0;
    g.hitStop = 0;
    t.press("X");
    t.advance(0.17, fps);
    assert.equal(e.wind, 0);
    assert(e.hp < room.hp);
  }
console.log(
  "PASS filming pupil: 0.6s preparation, planted feet before contact, committed direction, pause and interrupt at 30/60/120fps",
);
