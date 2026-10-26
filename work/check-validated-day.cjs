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
const seconds = [180, 195, 210];
const results = [];
for (const fps of [30, 60, 120]) {
  const { g, report: r } = runDay({ fps, mode: "direct" });
  assert(!g.workshop, "continuous pilot uses normal player rules");
  assert.equal(r.phase, "title");
  assert.equal(g.runPolicy, "three-required");
  assert(r.homeReturn.seconds > 90, "the day really drives home before the ending");
  assert(r.homeReturn.arrivalSeconds >= 12.2, "parking, slow walk, 2s fade and black hold precede ending");
  assert.equal(r.homeReturn.completions.length, 1);
  assert.equal(r.homeReturn.completions[0].meters, 3000);
  assert.equal(r.homeReturn.completions[0].vehicle, r.ends[2].vehicle);
  assert.equal(r.results.length, 3, "return adds no fourth assignment result");
  assert.deepEqual(r.cinematics.intro, [0, 1]);
  assert.deepEqual(r.cinematics.ending, Array.from({ length: 14 }, (_, i) => i));
  assert(
    r.cinematics.clocksStable,
    "intro and ending never charge gameplay clocks",
  );
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
// A less effective keyboard pilot stops at its first terminal final encounter.
// Two successful courses cannot unlock either the ending or a winning report.
const keyboard = runDay({ mode: "keyboard" }).report;
assert.equal(keyboard.phase, "fail");
assert.equal(keyboard.won, 2);
assert.equal(keyboard.results.length, 3);
assert.equal(keyboard.journal.navigationByMission[3].end.outcome, "failure");
assert.equal(
  keyboard.journal.events.filter((e) => e.kind === "failure").length,
  1,
);
assert.deepEqual(keyboard.cinematics.intro, [0, 1]);
assert.deepEqual(keyboard.cinematics.ending, []);
assert(keyboard.cinematics.clocksStable);
results.push({ ...keyboard, journal: undefined });

// Lifecycle: road timeout costs a life and restarts H1, preserving the run journal.
const t = createGame({ policy: "three-required" }),
  g = t.g;
g.workshop = true;
g.validatedDay = true;
g.seed = 4301;
g.startDay(false);
g.workshop = false;
assert.equal(g.phase, "free");
assert(!g.notified);
assert.equal(g.remaining, 180);
t.advance(5, 30);
assert.equal(g.remaining, 180, "cruising is uncharged");
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
const failedSession = g.session;
assert.equal(g.journalSnapshot().navigationByMission[1].end.outcome, "failure");
t.advance(2.2, 30);
t.press("ENTER");
assert.equal(g.phase, "lifeLost");
t.advance(2.7);
assert.equal(g.phase, "free");
assert.equal(g.mission, 0);
assert.equal(g.navigationRevision, "H1");
assert.equal(g.room, 200);
assert.equal(g.remaining, 180);
assert.equal(g.vehicle, 100);
assert.equal(g.hp, 5);
assert(!g.navigationCare.used && !g.recoveryScene.active);
assert.equal(Object.keys(g.validatedDayRuns).length, 0);
assert.equal(g.session, failedSession, "retry keeps the same run journal");
assert.deepEqual(Object.keys(g.journalSnapshot().navigationByMission), ["1"]);
assert.equal(
  g.journalSnapshot().events.filter((e) => e.kind === "failure").length,
  1,
);
assert.equal(g.results.length, 1);
assert.equal(g.won, 0);
assert.equal(g.cinematic, null, "retry goes straight to the car");
// Isolated lifecycle fixture: success preserves a worn car across assignments,
// while a later failure retries Berthelot rather than advancing or losing Ormeaux.
g.vehicle = 38;
g.hp = 1;
g.navigationCare.used = true;
g.finish(true);
g.next();
assert.equal(g.vehicle, 38);
assert.equal(g.hp, 5);
assert(!g.navigationCare.used);
assert.equal(g.navigationRevision, "A3");
assert.equal(g.room, 100);
assert.equal(g.won, 1);
g.hp = 1;
g.navigationCare.used = true;
g.finish(false);
assert.equal(g.phase, "fail");
g.next();
assert.equal(g.phase, "lifeLost");
t.advance(2.7);
assert.equal(g.phase, "free");
assert.equal(g.mission, 1);
assert.equal(g.navigationRevision, "A3");
assert.equal(g.room, 100);
assert.equal(g.vehicle, 100);
assert.equal(g.hp, 5);
assert(!g.navigationCare.used && !g.recoveryScene.active);
assert.equal(g.results.length, 3);
assert.equal(g.won, 1);
assert.equal(g.lives, 1);
assert.equal(Object.keys(g.validatedDayRuns).length, 1);
assert.equal(Object.keys(g.journalSnapshot().navigationByMission).length, 2);
g.workshop = true;
g.loadScenario("bruel-navigation-a3-care");
assert(!g.validatedDay);
assert.equal(Object.keys(g.validatedDayRuns).length, 0);
assert(
  g.journalSnapshot().navigation && !g.journalSnapshot().navigationByMission,
);
const legacy = createGame({ policy: "legacy-two" }).g;
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
  "PASS complete day: three assignments + protected 3 km home road and parked black fade at 30/60/120 fps; automatic 10/69s cinematics, shared clocks, care, damage persistence, shared three-life budget, pause, timeout, same-assignment retry retaining successes, lab switch and legacy isolation.",
);
