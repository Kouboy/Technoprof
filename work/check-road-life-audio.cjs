const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
const { load } = require("./audio-harness.cjs");
// Reproduce the original symptom through the actual update and pause paths.
for (const mission of [0, 1, 2]) {
  const t = createGame();
  const g = t.g;
  g.begin();
  g.mission = mission;
  g.phase = "arrival";
  g.age = 0;
  g.parkSpeed = 148;
  const motors = [];
  g.audio.motor = (speed, on) => motors.push(on);
  t.advance(1.7);
  assert.equal(motors.at(-1), true, "engine accompanies parking");
  t.advance(0.2);
  assert.equal(
    motors.at(-1),
    false,
    "engine stops once parked, before teacher exits",
  );
  g.setPaused(true);
  g.setPaused(false);
  assert.equal(motors.at(-1), false, "resume cannot restart parked engine");
  t.advance(1);
  assert.equal(motors.at(-1), false, "teacher walks in silence");
  g.phase = "free";
  g.age = 0;
  t.step();
  assert.equal(motors.at(-1), true, "next drive restarts engine");
}
function rig() {
  const { AudioKit } = load();
  const a = new AudioKit();
  const events = [];
  a.context = { currentTime: 0 };
  a.master = { gain: { setTargetAtTime() {} } };
  a.play = () => {};
  a.stopGroup = () => {};
  a.attention = () => {};
  a.tone = (...args) => {
    if (!a.muted && !a.paused) events.push(args);
  };
  const step = (distance, dt = 1 / 60, phase = "road", paused = false) =>
    a.scene(phase, paused, 180, dt, 0, false, { distance });
  return { a, events, step };
}
{
  const t = createGame();
  const { a, events } = rig();
  t.g.begin();
  t.g.phase = "road";
  t.g.notified = true;
  t.g.road = t.g.missionSpec().meters - 900;
  t.g.remaining = 180;
  t.g.speed = 0;
  t.g.audio.scene = a.scene.bind(a);
  t.step();
  assert.equal(
    events.length,
    2,
    "actual game supplies remaining metres to GPS",
  );
  t.g.setPaused(true);
  t.advance(8);
  t.g.setPaused(false);
  assert.equal(events.length, 2, "actual pause/resume preserves GPS cadence");
  t.g.phase = "arrival";
  t.g.age = 0;
  t.g.parkSpeed = 100;
  t.advance(3);
  assert.equal(events.length, 2, "actual arrival never repeats GPS");
}
for (const fps of [30, 60, 120]) {
  const { a, events, step } = rig();
  step(1000);
  assert.equal(events.length, 0, "no GPS above approach threshold");
  step(999);
  assert.equal(events.length, 2, "one soft two-note ping on approach");
  for (let i = 0; i < fps * 4 - 1; i++) step(900, 1 / fps);
  assert.equal(events.length, 2, "no premature repeat");
  step(900, 1 / fps);
  assert.equal(events.length, 4, "4 second repeat");
  step(499, 0);
  assert.equal(events.length, 6, "closer proximity acknowledged immediately");
  for (let i = 0; i < fps * 2; i++) step(400, 1 / fps);
  assert.equal(events.length, 8, "2 second repeat");
  const count = events.length;
  step(400, 40, "road", true);
  step(400, 0);
  assert.equal(
    events.length,
    count,
    "pause consumes neither time nor a new alert",
  );
  step(400, 10, "arrival");
  step(400, 10, "arrivalFade");
  step(400, 10, "school");
  assert.equal(events.length, count, "no GPS after road");
  step(900, 0);
  assert.equal(events.length, count + 2, "fresh assignment can alert again");
  a.muted = true;
  step(400, 0);
  for (let i = 0; i < fps * 6; i++) step(400, 1 / fps);
  a.muted = false;
  step(400, 0);
  assert.equal(
    events.length,
    count + 2,
    "unmute does not replay accumulated pings",
  );
}
// A receive -> road transition must keep the approach cadence.
{
  const { events, step } = rig();
  step(900, 0, "receive");
  step(900, 2, "receive");
  step(900, 1, "road");
  assert.equal(
    events.length,
    5,
    "three mission-notification notes plus one GPS pair",
  );
  step(900, 1, "road");
  assert.equal(events.length, 7);
}
// Exercise real GPS oscillators and voice cancellation, including the delayed note.
for (const boundary of ["pause", "arrival", "mute"]) {
  const { AudioKit } = load();
  const a = new AudioKit();
  const sources = [];
  const param = () => ({
    value: 0,
    setTargetAtTime() {},
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime() {},
    cancelScheduledValues() {},
  });
  a.context = {
    currentTime: 10,
    createOscillator() {
      const s = {
        frequency: param(),
        connect(n) {
          return n;
        },
        disconnect() {},
        start(at) {
          this.started = at;
        },
        stop(at) {
          this.stopped = at;
        },
      };
      sources.push(s);
      return s;
    },
    createGain() {
      return {
        gain: param(),
        connect(n) {
          return n;
        },
        disconnect() {},
      };
    },
  };
  a.master = { gain: param() };
  a.play = () => {};
  a.scene("road", false, 180, 0, 0, false, { distance: 400 });
  assert.equal(sources.length, 2);
  assert(sources[1].started > 10, "second GPS note scheduled");
  assert.equal(a.voices.size, 2);
  if (boundary === "mute") a.muted = true;
  a.scene(
    boundary === "arrival" ? "arrival" : "road",
    boundary === "pause",
    180,
    0,
    0,
    false,
    { distance: 400 },
  );
  assert.equal(
    a.voices.size,
    0,
    "all pending GPS tails cancelled at " + boundary,
  );
  assert(
    sources.every((s) => s.stopped <= 10.014),
    "GPS cannot ring later across " + boundary,
  );
}
console.log(
  "PASS driving audio: GPS proximity cadence, pause/mute/phase boundaries and parked motor on all three arrivals",
);
