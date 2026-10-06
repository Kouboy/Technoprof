const assert = require("node:assert/strict");
const fs = require("node:fs");
const { createGame } = require("./test-harness.cjs");
const { runDay } = require("./validated-day-runner.cjs");
const revisions = ["H1", "A3", "I2"];
const schools = [
  "Collège des Ormeaux",
  "Lycée Auguste-Berthelot",
  "Lycée professionnel des Trois-Ponts",
];
const seconds = [240, 225, 210];
const results = [];
for (const fps of [30, 60, 120]) {
  const { g, report: r } = runDay({ fps, mode: "direct" });
  assert(!g.workshop, "continuous pilot uses normal player rules");
  assert.equal(r.phase, "report");
  assert.equal(
    r.won,
    3,
    "all three driving, boss and course sequences complete with real inputs",
  );
  assert.equal(r.journal.mode, "journee-atelier");
  assert.deepEqual(Object.keys(r.journal.navigationByMission), ["1", "2", "3"]);
  const assignments = r.journal.events.filter(
    (e) => e.kind === "day-affectation",
  );
  assert.deepEqual(
    Array.from(assignments, (e) => e.data.school),
    schools,
  );
  for (let i = 0; i < 3; i++) {
    const nav = r.journal.navigationByMission[i + 1];
    assert.equal(nav.revision, revisions[i]);
    assert.equal(nav.end.outcome, "success");
    assert.equal(
      r.arrivalClocks[i],
      r.schoolClocks[i],
      "arrival cinema never charges shared timer",
    );
    const timing = r.journal.missionTiming[i + 1];
    assert(
      timing.clock.road > 40,
      "real driving time is charged on each assignment",
    );
    const charged = Object.values(timing.clock).reduce((a, b) => a + b, 0);
    assert(
      Math.abs(seconds[i] - r.ends[i].remaining - charged) < 0.01,
      "road + school share one clock",
    );
    assert(
      !timing.clock.recovery &&
        !timing.clock.arrival &&
        !timing.clock.dialogue &&
        !timing.clock.transition,
    );
    const care = r.journal.events.filter((e) => e.mission === i + 1);
    const start = care.filter((e) => e.kind === "care-start");
    const complete = care.filter((e) => e.kind === "care-complete");
    const exit = care.filter((e) => e.kind === "care-exit");
    assert.equal(start.length, 1);
    assert.equal(complete.length, 1);
    assert.equal(exit.length, 1);
    assert.equal(
      complete[0].data.hp,
      5,
      "full recovery is preserved for each profile",
    );
    assert.equal(
      exit[0].data.remaining,
      start[0].data.remaining,
      "care scene suspends clock through exit",
    );
    assert(
      timing.seconds.later > 2 && timing.seconds.course > 0,
      "each class passes through the normal ellipse",
    );
    if (i > 0)
      assert(
        r.ends[i].vehicle <= r.ends[i - 1].vehicle,
        "vehicle damage persists between courses",
      );
  }
  assert(
    r.roomRuns[2].includes(317) && r.roomRuns[2].includes(315),
    "new optional care branch is used",
  );
  results.push({ ...r, journal: undefined });
}
// A less effective keyboard pilot fails the final encounter, but still receives
// the ordinary 2/3-day report, not the isolated final-boss trial outcome.
const keyboard = runDay({ mode: "keyboard" }).report;
assert.equal(keyboard.phase, "report");
assert.equal(keyboard.won, 2);
assert.equal(keyboard.results.length, 3);
assert.equal(keyboard.journal.navigationByMission[3].end.outcome, "failure");
results.push({ ...keyboard, journal: undefined });

// Lifecycle tests: timeout on the real road clock, advance, reset and lab switch.
const t = createGame(),
  g = t.g;
g.workshop = true;
g.validatedDay = true;
g.seed = 4301;
g.startDay();
g.workshop = false;
assert.equal(g.phase, "free");
assert(!g.notified);
assert.equal(g.remaining, 240);
t.advance(5, 30);
assert.equal(g.remaining, 240, "cruising is uncharged");
g.setPaused(true);
const paused = JSON.stringify([
  g.phase,
  g.age,
  g.remaining,
  g.travel,
  g.session.elapsed,
]);
t.advance(3, 30);
assert.equal(
  JSON.stringify([g.phase, g.age, g.remaining, g.travel, g.session.elapsed]),
  paused,
);
g.setPaused(false);
for (let n = 0; n < 30 * 280 && g.phase !== "fail"; n++) t.step(1000 / 30);
assert.equal(g.phase, "fail");
assert.equal(g.failureReason, "late");
t.advance(2.2, 30);
t.press("ENTER");
assert.equal(g.phase, "free");
assert.equal(g.navigationRevision, "A3");
assert.equal(g.remaining, 225);
assert(!g.navigationCare.used && !g.recoveryScene.active);
assert.equal(Object.keys(g.validatedDayRuns).length, 1);
assert.equal(g.journalSnapshot().navigationByMission[1].end.outcome, "failure");
assert.equal(g.journalSnapshot().navigationByMission[2].revision, "A3");
// Isolated state setup: persisting a worn car and used care across begin must
// reset personnel/room state, while preserving vehicle condition.
g.vehicle = 38;
g.hp = 1;
g.navigationCare.used = true;
g.finish(false);
g.next();
assert.equal(g.vehicle, 38);
assert.equal(g.hp, 5);
assert(!g.navigationCare.used);
assert.equal(g.navigationRevision, "I2");
assert.equal(g.room, 300);
g.finish(false);
g.next();
assert.equal(g.phase, "report");
assert.equal(Object.keys(g.journalSnapshot().navigationByMission).length, 3);
g.startDay();
assert.equal(g.navigationRevision, "H1");
assert.equal(g.room, 200);
assert.equal(g.vehicle, 100);
assert.equal(g.results.length, 0);
assert.equal(g.won, 0);
assert.equal(Object.keys(g.validatedDayRuns).length, 0);
assert.equal(Object.keys(g.journalSnapshot().navigationByMission).length, 1);
g.workshop = true;
g.loadScenario("bruel-navigation-a3-care");
assert(!g.validatedDay);
assert.equal(Object.keys(g.validatedDayRuns).length, 0);
assert(
  g.journalSnapshot().navigation && !g.journalSnapshot().navigationByMission,
);
const legacy = createGame().g;
legacy.startDay();
assert(!legacy.validatedDay && !legacy.navigationProfile);
assert(!legacy.navigationSpec());
fs.writeFileSync(
  "work/validated-day-results.json",
  JSON.stringify(
    {
      scope:
        "Inputs only after start; known routes, not human discovery or audio validation",
      runs: results,
      lifecycle: true,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "PASS complete day: three roads + H1/A3/I2 courses at 30/60/120 fps, shared clocks, care, damage persistence, 2/3 failure report, pause, timeout, replay, lab switch and legacy isolation.",
);
