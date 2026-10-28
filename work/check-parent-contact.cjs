const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
function ready(facing = 1) {
  const t = createGame(),
    g = t.g;
  g.workshop = true;
  g.loadScenario("bruel-navigation-a3");
  g.enterRoom(111, 55);
  g.roomSpec().gaps = [];
  t.advance(0.8);
  for (let i = 0; i < 20 && g.encounterTime; i++) t.press("X");
  const e = g.enemies[0];
  e.x = 170;
  e.wind = e.stun = e.chargeTime = 0;
  e.recovery = 2;
  e.parentCycle.phase = "opening";
  e.parentCycle.hits = 0;
  g.px = e.x - facing * 74;
  g.face = facing;
  g.inv = 999;
  g.attack = g.hitStop = 0;
  return { ...t, e };
}
for (const fps of [30, 60, 120])
  for (const facing of [-1, 1]) {
    let t = ready(facing);
    t.press("X");
    t.advance(0.22, fps);
    assert.equal(
      t.e.hp,
      5,
      "book touching visible coat edge hits in both facings",
    );
    t.advance(0.15, fps);
    assert.equal(t.e.hp, 5, "same swing never damages twice");
    t = ready(facing);
    t.g.px = t.e.x - facing * 96;
    const sounds = [];
    t.g.audio.combat = (kind) => sounds.push(kind);
    t.press("X");
    t.advance(0.17, fps);
    assert.equal(t.e.hp, 6, "out of reach at active-window start");
    // Controlled collision fixture: opponent enters the book sweep after its
    // first sample. This is not a human-pilot or enemy-movement claim.
    t.e.x = t.g.px + facing * 72;
    t.advance(0.07, fps);
    assert.equal(
      t.e.hp,
      5,
      "contact sampled throughout the visible active sweep",
    );
    assert.equal(
      sounds.filter((v) => v === "swing").length,
      1,
      "one whoosh per swing",
    );
    t = ready(facing);
    t.g.px = t.e.x - facing * 90;
    t.press("X");
    t.advance(0.4, fps);
    assert.equal(t.e.hp, 6, "distant target remains out of reach");
    t = ready(facing);
    t.e.recovery = 0;
    t.e.parentCycle.phase = "guard";
    t.e.cool = 1;
    t.press("X");
    t.advance(0.18, fps);
    assert.equal(t.e.hp, 6);
    assert(t.e.blockTime > 0, "guard creates an explicit parry reaction");
    assert(t.g.session.events.some((e) => e.kind === "blocked"));
  }
{
  const t = ready(),
    g = t.g,
    e = t.e;
  e.x = 200;
  e.recoilDistance = 14;
  e.recoilTime = 0.22;
  g.px = 112;
  g.attack = 0.3;
  g.attackHit = false;
  t.step(1);
  assert.equal(e.hp, 5, "hitbox follows the visible recoil body");
}
console.log(
  "PASS Parent contact: coat edge, visible recoil, late sweep contact, one hit/one sound, bounded range and explicit guard in both facings at 30/60/120fps",
);
