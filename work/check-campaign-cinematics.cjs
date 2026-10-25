const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
const c = {};
vm.createContext(c);
vm.runInContext(
  require("node:module").stripTypeScriptTypes(
    ["campaign", "cinematic"]
      .map((n) => strip(fs.readFileSync("src/" + n + ".ts", "utf8")))
      .join("\n"),
  ) + ";globalThis.api={campaignWon,requiredAssignments,CinematicSequence};",
  c,
);
assert.equal(c.api.requiredAssignments("three-required"), 3);
assert(!c.api.campaignWon(2, "three-required"));
assert(c.api.campaignWon(3, "three-required"));
assert(c.api.campaignWon(2, "legacy-two"), "historical comparison is explicit");
for (const [kind, count] of [
  ["intro", 2],
  ["ending", 12],
]) {
  const s = new c.api.CinematicSequence(kind);
  assert.equal(s.index, 0);
  assert.equal(s.count, count);
  if (kind === "ending") {
    const ids = [];
    const cues = [];
    for (let i = 0; i < count; i++) { s.index = i; ids.push(s.panel.id); if (s.cue) cues.push([i, s.cue]); }
    assert.deepEqual(Array.from(ids), ["grading", "fatigue", "doorbell", "visitor", "invitation", "courtyard", "corridor", "preparation", "classroom", "aesh", "bell", "wake"]);
    assert.deepEqual(JSON.parse(JSON.stringify(cues)), [[2, "doorbell"], [10, "bell"], [11, "alarm"]]);
    s.index = 0;
  }
  assert(!s.advance(), "entry frame action rejected");
  s.tick(0.5, false);
  assert.equal(s.age, 0.5);
  s.tick(5, true);
  assert.equal(s.age, 0.5, "pause freezes vignette");
  assert(s.advance());
  assert.equal(s.index, 1);
  assert(!s.advance(), "same-frame second action rejected");
  while (!s.done) {
    s.tick(0.5, false);
    s.advance();
  }
  assert.equal(s.index, count - 1);
  assert(!s.advance(), "finished state is stable");
}
const { createGame } = require("./test-harness.cjs");
assert.equal(
  createGame({ policy: null }).g.runPolicy,
  "three-required",
  "production constructor defaults to strict",
);
for (const mission of [0, 1, 2])
  for (const reason of ["late", "breakdown", "exhausted"]) {
    const t = createGame({ policy: "three-required" }),
      g = t.g;
    g.validatedDay = true;
    g.startDay(false);
    g.mission = mission;
    g.begin();
    g.won = mission;
    g.vehicle = reason === "breakdown" ? 0 : 39;
    g.hp = 1;
    g.navigationCare.used = true;
    g.phase = reason === "breakdown" ? "road" : "school";
    g.finish(false, reason);
    t.advance(2.1);
    t.press("ENTER");
    assert.equal(g.mission, 0);
    assert.equal(g.phase, "free");
    assert.equal(g.won, 0);
    assert.equal(g.vehicle, 100);
    assert.equal(g.hp, 5);
    assert.equal(g.remaining, 180);
    assert.equal(g.results.length, 0);
    assert(!g.navigationCare.used);
    assert.equal(g.navigationRevision, "H1");
  }
{
  const t = createGame({ policy: "three-required" }),
    g = t.g;
  g.validatedDay = true;
  g.startDay();
  assert.deepEqual(JSON.parse(JSON.stringify(g.journalSnapshot().campaign)), {
    policy: "three-required", requiredSuccesses: 3, firstFailureEndsRun: true,
  });
  assert.equal(g.phase, "intro");
  const timer = g.remaining;
  t.advance(2);
  assert.equal(g.remaining, timer);
  t.press("X");
  assert.equal(g.cinematic.index, 1);
  t.advance(0.5);
  t.press("X");
  assert.equal(g.phase, "free");
  assert(g.introSeen);
  g.won = 2;
  g.mission = 2;
  g.phase = "school";
  g.finish(true);
  g.next();
  assert.equal(g.phase, "ending");
  assert.equal(g.won, 3);
  const before = g.remaining;
  for (let i = 0; i < 12; i++) {
    t.advance(0.6);
    t.press("X");
  }
  assert.equal(g.phase, "report");
  assert.equal(g.remaining, before);
}
console.log(
  "PASS strict 3/3 campaign, every failure resets whole run, 2/12 silent panels with expanded campus, semantic sound cues, frozen time and single advance",
);
