const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
function ending() {
  const t = createGame({ policy: "three-required" });
  t.g.workshop = true;
  t.g.loadScenario("cinematic-ending");
  return t;
}
{
  const t = ending(),
    g = t.g;
  t.advance(68.98);
  assert.equal(g.cinematic.panel.id, "wake");
  t.advance(0.04);
  assert.equal(
    g.phase,
    "ending",
    "last image survives the end of the soundtrack",
  );
  assert.equal(g.cinematic.elapsed, 69);
  assert(g.endingFade !== null && g.endingFade < 0.05);
  const fade = g.endingFade;
  g.setPaused(true);
  t.advance(5);
  assert.equal(g.endingFade, fade);
  g.setPaused(false);
  t.advance(1.4);
  assert.equal(g.phase, "ending");
  assert(g.endingFade > 1.3 && g.endingFade < 1.5);
  t.advance(1.7);
  assert.equal(g.phase, "title");
  assert.equal(g.cinematic, null);
  assert(!g.paused);
  assert.equal(g.endingFade, null);
}
{
  const t = ending(),
    g = t.g;
  t.advance(1);
  g.skipCinematic();
  assert.equal(g.phase, "title");
  assert.equal(g.cinematic, null);
}
for (const phase of ["road", "school"]) {
  const t = createGame({ policy: "three-required" }),
    g = t.g;
  g.startDay(false);
  g.phase = phase;
  g.vehicle = 23;
  g.hp = 1;
  g.finish(false, phase === "road" ? "breakdown" : "exhausted");
  t.advance(2.1);
  t.press("ENTER");
  assert.equal(g.phase, "lifeLost", "failure shows the lost life");
  t.advance(2.7);
  assert.equal(g.phase, phase === "school" ? "school" : "free");
  if(phase === "school") assert.equal(g.remaining,120);
  assert.equal(g.lives, 2);
  assert.equal(
    g.results.length,
    1,
    "retry preserves the run journal",
  );
  g.startDay(false);
  assert.equal(g.phase, "free");
  assert.equal(g.mission, 0);
  assert.equal(g.vehicle, 100);
  assert.equal(g.hp, 5);
}
console.log(
  "PASS 69s ending + 3s suspendable fade, skip and road/school lost-life retry",
);
{
  const t = createGame({ policy: "three-required" }),
    g = t.g;
  g.startDay(false);
  g.phase = "road";
  g.finish(false, "breakdown");
  t.advance(12.6);
  assert.equal(
    g.phase,
    "lifeLost",
    "silent/no-audio Game Over also shows the counter automatically",
  );
}
