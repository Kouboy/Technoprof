const assert = require("node:assert/strict");
const { load } = require("./audio-harness.cjs");
const { createGame } = require("./test-harness.cjs");
for (const [name, room] of [
  ["sequence-class-h1", 207],
  ["sequence-class-a3", 111],
  ["sequence-class-i2", 309],
]) {
  const t = createGame();
  t.g.workshop = true;
  t.g.loadScenario(name);
  assert.equal(
    t.g.phase,
    "opening",
    "frozen visual fixture begins after door interaction",
  );
  assert.equal(t.g.room, room);
  assert(t.g.paused);
  assert.equal(t.g.enemies.filter((e) => e.hp > 0).length, 0);
}
function soundRig() {
  const { AudioKit, bank } = load(),
    a = new AudioKit(),
    events = [];
  const param = (value = 0) => ({
    value,
    setTargetAtTime(v) {
      this.value = v;
    },
  });
  a.context = { currentTime: 0 };
  a.master = { gain: param() };
  a.ambience = { gain: param() };
  for (const name of ["room", "hum"])
    a.loops[name] = {
      gain: { gain: param() },
      filter: { frequency: param() },
      source: { playbackRate: param(1) },
    };
  a.play = (
    kind,
    side = 0,
    weight = 1,
    delay = 0,
    group = "fx",
    rate = 1,
    offset = 0,
  ) => {
    if (!a.muted && !a.paused)
      events.push({ kind, weight, group, rate, offset });
  };
  a.tone = () => events.push({ kind: "tone" });
  return { a, bank, events };
}
{
  const { a, events } = soundRig();
  a.muted = true;
  a.scene("opening", false, 120, 0, 111, false, { age: 0 });
  a.scene("opening", false, 120, 0.2, 111, false, { age: 0.2 });
  a.muted = false;
  a.scene("opening", false, 120, 0.1, 111, false, { age: 0.3 });
  assert(
    !events.some((e) => ["handle", "door"].includes(e.kind)),
    "unmuting does not replay old sequence cues",
  );
}
for (const [road, reason, expected] of [
  [true, "breakdown", "stall"],
  [true, "late", "skid"],
  [false, "exhausted", "cloth"],
  [false, "late", "paper"],
]) {
  const { a, events } = soundRig();
  for (const age of [0, 0.2, 0.5, 1.1])
    a.scene("fail", false, 0, 0.1, 200, false, { road, reason, age });
  assert(
    events.some((e) => e.kind === expected),
    `distinct ${road ? "road" : "foot"} ${reason} failure cue`,
  );
  assert(
    !events.some((e) => e.kind === "tone"),
    "failure is a material scene, not generic descending beeps",
  );
  const count = events.length;
  a.scene("fail", true, 0, 4, 200, false, { road, reason, age: 1.1 });
  a.scene("fail", false, 0, 0, 200, false, { road, reason, age: 1.1 });
  assert.equal(
    events.length,
    count,
    "finished failure cues never replay on resume",
  );
}
{
  const { a, events } = soundRig();
  a.scene("opening", false, 120, 0, 111, false, { age: 0 });
  assert.equal(events[0].kind, "handle");
  assert(!events.some((e) => e.kind === "door"), "latch precedes moving door");
  a.scene("opening", true, 120, 10, 111, false, { age: 0.03 });
  assert(
    !events.some((e) => e.kind === "door"),
    "pause cannot release a queued door",
  );
  a.scene("opening", false, 120, 0, 111, false, { age: 0.03 });
  a.scene("opening", false, 120, 0.15, 111, false, { age: 0.18 });
  assert.equal(events.filter((e) => e.kind === "door").length, 1);
  a.scene("opening", false, 120, 0.65, 111, false, { age: 0.83 });
  assert(events.some((e) => e.kind === "step"));
  a.scene("course", false, 120, 0, 111, false, { age: 0 });
  assert.equal(events.filter((e) => e.kind === "bell-start").length, 1);
  a.scene("course", true, 120, 0, 111, false, { age: 0.4 });
  a.scene("course", false, 120, 0, 111, false, { age: 0.4 });
  const bell = events.filter((e) => e.kind === "bell-start");
  assert.equal(bell.length, 2);
  assert(bell[1].offset >= 0.4, "resume only the remaining bell tail");
  a.scene("course", false, 120, 0.1, 111, false, { age: 0.5 });
  assert.equal(events.filter((e) => e.kind === "bell-start").length, 2);
  a.scene("blackAfter", false, 120, 0, 111, false, { age: 0 });
  assert(!events.some((e) => e.kind === "bell-end"));
  a.scene("later", false, 120, 0, 111, false, { age: 0 });
  assert.equal(events.filter((e) => e.kind === "bell-end").length, 1);
  a.scene("free", false, 240, 0, 300, false, { age: 0 });
  const n = events.length;
  a.scene("free", false, 240, 1, 300, false, { age: 1 });
  assert.equal(events.length, n);
}
{
  const { a, events } = soundRig();
  a.scene("school", false, 12, 0.02, 206, false, { age: 0 });
  const normal = a.loops.room.gain.gain.value;
  events.length = 0;
  a.scene("school", false, 11, 0.02, 208, false, { care: true, age: 0 });
  assert.equal(a.loops.hum.gain.gain.value, 0);
  assert(a.loops.room.gain.gain.value < normal * 0.5);
  assert(a.loops.room.filter.frequency.value < 300);
  assert(
    !events.some((e) => e.kind === "tone"),
    "no urgency cue even in an already-used infirmary",
  );
  for (let i = 0; i < 20; i++)
    a.scene("school", false, 10 - i * 0.01, 1, 208, false, {
      care: true,
      age: i,
    });
  assert(!events.some((e) => ["relay", "drip", "tone"].includes(e.kind)));
  assert(events.some((e) => e.kind === "cloth" || e.kind === "paper"));
  a.talk(2, true, 0, true);
  const soft = events.at(-1);
  a.talk(2, true);
  assert(soft.weight < events.at(-1).weight * 0.6);
  a.scene("school", false, 9, 0.02, 206, false, { age: 0 });
  assert.equal(a.loops.room.filter.frequency.value, 550);
  assert(
    a.loops.hum.gain.gain.value > 0,
    "normal ambience resumes outside care",
  );
  const { makeMaterial, FOLEY, AUDIO } = soundRig().bank;
  for (const kind of ["handle", "stall", "cloth", "bell-start", "bell-end"]) {
    assert(FOLEY[kind], kind + " is a real material");
    const pcm = makeMaterial(kind, AUDIO.sampleRate);
    assert(pcm.every(Number.isFinite));
    assert(pcm.some((v) => Math.abs(v) > 0.01));
  }
}
for (const fps of [30, 60, 120]) {
  const t = createGame(),
    g = t.g;
  g.loadScenario("road");
  g.speed = 220;
  g.vehicle = 0;
  g.finish(false, "breakdown");
  const time = g.remaining,
    travel = g.travel;
  t.advance(0.4, fps);
  assert(g.speed < 220 && g.speed > 0, "visible coast after failure");
  assert(g.travel > travel);
  assert.equal(g.remaining, time);
  g.setPaused(true);
  const frozen = [g.speed, g.travel, g.age];
  t.advance(2, fps);
  assert.deepEqual([g.speed, g.travel, g.age], frozen);
  g.setPaused(false);
  t.advance(2, fps);
  assert.equal(g.speed, 0);
  assert.equal(g.phase, "fail");
  assert.equal(g.results.length, 1);
  t.press("ENTER");
  assert.equal(g.phase, "free");
}
console.log(
  "PASS differentiated failures, latch/door/steps/bells, offset-only audio resume, quiet care and coast clocks at 30/60/120fps.",
);
