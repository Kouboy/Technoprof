const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
function setup(mission, room) {
  const t = createGame({ policy: "three-required" }),
    g = t.g;
  g.validatedDay = true;
  g.mission = mission;
  g.begin();
  g.notified = true;
  g.school();
  g.schoolFade = 0;
  g.enterRoom(room, 45);
  for (let n = 0; g.encounterTime && n < 20; n++) t.press("X");
  return t;
}
for (const [mission, room] of [
  [1, 111],
  [2, 308],
]) {
  const t = setup(mission, room),
    g = t.g;
  assert.equal(
    g.floorGaps().length,
    1,
    "one visible opening in the requested combat room",
  );
  const [l, r] = g.floorGaps()[0];
  assert(r - l <= 32 && l > 75 && r < 200);
  assert(
    g.px < l - 20 && g.enemies[0].x > r + 20,
    "arrival and opponent start on safe ground",
  );
  assert(
    g.pointerExits().every((e) => e.edge || e.to < l - 20 || e.from > r + 20),
    "doors clear of hole",
  );
  for (const fps of [30, 60, 120])
    for (const direction of [-1, 1]) {
      const h = setup(mission, room),
        s = h.g,
        e = s.enemies[0];
      e.x = direction > 0 ? l - 9 : r + 9;
      e.wind = e.stun = e.recovery = 0;
      e.cool = 10;
      if (e.parent) {
        e.chargeDir = direction;
        e.chargeTime = 0.8;
        e.parentCycle.phase = "charge";
      } else {
        e.retreatTime = 0.7;
        e.retreatDir = direction;
      }
      s.px = direction > 0 ? r + 80 : l - 60;
      s.inv = 20;
      const hp = e.hp;
      let lifted = false;
      for (let i = 0; i < fps; i++) {
        h.step(1000 / fps);
        lifted ||= (e.floorLift ?? 0) > 5;
      }
      assert(lifted, "enemy visibly steps over the opening");
      assert(!e.floorStep && !(e.floorLift ?? 0), "step ends on floor");
      assert.equal(e.hp, hp, "no free damage from hole");
      assert(
        direction > 0 ? e.x >= r + 6 : e.x <= l - 6,
        "enemy reaches opposite safe bank",
      );
    }
}
console.log(
  "PASS two combat holes: safe spawn/doors, two-way enemy step at 30/60/120 fps, no free damage",
);
for (const [mission, room] of [
  [1, 111],
  [2, 308],
])
  for (const fps of [30, 60, 120]) {
    const t = setup(mission, room),
      g = t.g,
      e = g.enemies[0],
      [l, r] = g.floorGaps()[0];
    e.cool = 100;
    e.x = 275;
    g.px = l - 12;
    g.lastGroundX = g.px;
    g.inv = 100;
    g.keys.RIGHT.isDown = true;
    t.press("SPACE");
    t.advance(0.72, fps);
    assert.equal(g.falling, 0, "early directional jump crosses combat hole");
    assert(g.px > r && g.hp === 5);
    g.keys.RIGHT.isDown = false;
    g.px = l - 1;
    g.py = 159;
    g.lastGroundX = l - 15;
    g.keys.RIGHT.isDown = true;
    while (!g.falling) t.step(1000 / fps);
    g.keys.RIGHT.isDown = false;
    g.setPaused(true);
    const state = [g.falling, g.py, g.remaining, g.hp];
    t.advance(0.5, fps);
    assert.deepEqual(
      [g.falling, g.py, g.remaining, g.hp],
      state,
      "pause freezes real fall",
    );
    g.setPaused(false);
    t.advance(1, fps);
    assert.equal(g.hp, 4);
    assert(g.px < l);
    assert.equal(g.session.falls, 1);
  }
{
  const t = setup(1, 111),
    g = t.g,
    e = g.enemies[0],
    [l, r] = g.floorGaps()[0];
  e.x = l - 9;
  e.chargeDir = 1;
  e.chargeTime = 0.08;
  e.parentCycle.phase = "charge";
  g.px = 250;
  g.inv = 100;
  t.advance(0.04);
  assert(e.floorStep);
  t.advance(0.04);
  assert(e.floorLift > 0);
  g.setPaused(true);
  const state = JSON.stringify(e);
  t.advance(0.5);
  assert.equal(JSON.stringify(e), state);
  g.setPaused(false);
  t.advance(0.4);
  assert.equal(
    e.parentCycle.phase,
    "opening",
    "charge expiring over hole still yields its opening",
  );
  assert(!e.floorStep);
  assert.equal(e.floorLift, 0);
}
{
  const t = setup(1, 111),
    g = t.g,
    e = g.enemies[0];
  e.x = 195;
  g.px = 108;
  g.beginParentBreakaway(e);
  const hp = g.hp;
  t.advance(0.5);
  assert(!g.falling);
  assert.equal(g.hp, hp, "reprise never forces fall damage");
  assert(Math.abs(e.x - g.px) >= 84, "safe bank keeps clear separation");
}
{
  const t = setup(1, 111),
    g = t.g,
    e = g.enemies[0];
  g.px = 171;
  g.py = 140;
  e.x = 190;
  e.chargeTime = 0;
  g.separateFighters(171);
  assert(
    !g.floorGaps().some(([l, r]) => g.px > l && g.px < r),
    "neutral body separation cannot deposit an airborne professor into the hole",
  );
}
console.log(
  "PASS combat floors: directional jump, single fall damage, pause, charge landing/opening and safe reprise/body separation",
);
