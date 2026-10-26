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
  ) + ";globalThis.api={campaignWon,requiredAssignments,CinematicSequence,cinematicTimecodes};",
  c,
);
assert.equal(c.api.requiredAssignments("three-required"), 3);
assert(!c.api.campaignWon(2, "three-required"));
assert(c.api.campaignWon(3, "three-required"));
assert(c.api.campaignWon(2, "legacy-two"), "historical comparison is explicit");
for (const kind of ["intro", "ending"]) {
  const csv = fs.readFileSync("docs/cinematiques/timecodes-" + kind + ".csv", "utf8").trim().split("\n").slice(1);
  const rows = c.api.cinematicTimecodes(kind);
  assert.equal(csv.length, rows.length);
  const seconds = t => { const [m, s] = t.split(":"); return Number(m) * 60 + Number(s); };
  csv.forEach((line, i) => { const [id,start,end,duration,cue] = line.split(","); const p = rows[i];
    assert.equal(id, p.id); assert.equal(Number(duration), p.seconds); assert.equal(cue, p.cue);
    assert(Math.abs(seconds(start) - p.start) < 0.001); assert(Math.abs(seconds(end) - p.end) < 0.001);
  });
}
for (const [kind, count] of [
  ["intro", 2],
  ["ending", 14],
]) {
  const s = new c.api.CinematicSequence(kind);
  assert.equal(s.index, 0);
  assert.equal(s.count, count);
  if (kind === "ending") {
    const ids = [];
    const cues = [];
    for (let i = 0; i < count; i++) { s.index = i; ids.push(s.panel.id); if (s.cue) cues.push([i, s.cue]); }
    assert.deepEqual(Array.from(ids), ["grading", "fatigue", "doorbell", "visitor", "invitation", "car-ride", "courtyard", "corridor", "preparation", "classroom", "aesh", "exterior", "bell", "wake"]);
    assert.deepEqual(JSON.parse(JSON.stringify(cues)), [[2, "doorbell"], [12, "bell"], [13, "alarm"]]);
    s.index = 0;
  }
  assert.equal(s.totalSeconds, kind === "intro" ? 10 : 69);
  s.tick(0.5, false);
  assert.equal(s.age, 0.5);
  s.tick(5, true);
  assert.equal(s.age, 0.5, "pause freezes vignette");
  s.tick(NaN, false); s.tick(-1, false);
  assert.equal(s.age, 0.5, "invalid deltas cannot corrupt the montage clock");
  const firstSeconds = s.panel.seconds;
  s.tick(firstSeconds - 0.5 + 0.125, false);
  assert.equal(s.index, 1);
  assert(Math.abs(s.age - 0.125) < 1e-8, "frame remainder is preserved");
  const elapsed = s.elapsed;
  s.tick(10, true);
  assert.equal(s.elapsed, elapsed);
  s.tick(s.totalSeconds, false);
  assert(s.done, "automatically completes without any input");
  assert.equal(s.index, count - 1);
  assert.equal(s.elapsed, s.totalSeconds);
  s.tick(100, false);
  assert.equal(s.elapsed, s.totalSeconds, "finished clock is stable");
}
for (const fps of [30, 60, 120]) {
  const s = new c.api.CinematicSequence("ending"), seen = [];
  for (let i = 0; i < fps * 70; i++) { if (seen.at(-1) !== s.index) seen.push(s.index); s.tick(1 / fps, false); }
  assert(s.done);
  assert.equal(s.elapsed, 69);
  assert.deepEqual(seen, Array.from({ length: 14 }, (_, i) => i));
}
for (const kind of ["intro", "ending"]) {
  const s = new c.api.CinematicSequence(kind);
  s.tick(1, false); s.skip();
  assert(s.done); assert.equal(s.elapsed, 1, "skip retains actual watched time");
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
    assert.equal(g.phase, "lifeLost");
    assert.equal(g.lives, 2);
    t.advance(2.7);
    assert.equal(g.mission, mission, "retry retains the current assignment");
    assert.equal(g.won, mission, "earlier assignments remain acquired");
    assert.equal(g.results.length, 1, "the failed attempt remains in the journal");
    g.startDay(false);
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
    policy: "three-required", requiredSuccesses: 3, firstFailureEndsRun: false,
    startingLives: 3, livesRemaining: 3,
  });
  assert.equal(g.phase, "intro");
  const timer = g.remaining;
  t.advance(2);
  assert.equal(g.remaining, timer);
  t.press("X");
  assert.equal(g.cinematic.index, 0, "action never advances automatic montage");
  t.press("SPACE");
  t.press("ENTER");
  assert.equal(g.cinematic.index, 0, "jump/enter do not skip images");
  t.advance(3.6);
  assert.equal(g.cinematic.index, 1);
  t.advance(5);
  assert.equal(g.phase, "free");
  assert(g.introSeen);
  g.won = 2;
  g.mission = 2;
  g.phase = "school";
  g.finish(true);
  g.next();
  assert.equal(g.phase, "home");
  assert.equal(g.won, 3);
  g.road = 3000;
  t.advance(12.4);
  assert.equal(g.phase, "ending");
  const before = g.remaining;
  t.advance(72.1);
  assert.equal(g.phase, "title");
  assert.equal(g.remaining, before);
}
for (const kind of ["intro", "ending"]) {
  const t = createGame({ policy: "three-required" }), g = t.g;
  g.workshop = true; g.loadScenario("cinematic-" + kind);
  t.advance(1);
  const elapsed = g.cinematic.elapsed;
  g.setPaused(true); t.advance(70);
  assert.equal(g.cinematic.elapsed, elapsed, "runtime pause freezes all montage time");
  g.skipCinematic(); assert(g.cinematic, "cannot skip through pause menu");
  g.setPaused(false); g.skipCinematic();
  assert.equal(g.phase, kind === "intro" ? "free" : "title");
  assert.equal(g.cinematic, null);
}
console.log(
  "PASS strict campaign, automatic 10/69s montage, remainder and pause stability, 30/60/120fps and inert action inputs",
);
