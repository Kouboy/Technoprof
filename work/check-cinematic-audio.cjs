const assert = require("node:assert/strict");
const { AudioKit } = require("./audio-harness.cjs").load();
const a = new AudioKit(),
  events = [];
a.context = { currentTime: 0 };
a.master = { gain: { setTargetAtTime() {} } };
a.stopGroup = () => {};
a.tone = (...args) => {
  if (!a.muted && !a.paused) events.push(["tone", ...args]);
};
a.play = (...args) => {
  if (!a.muted && !a.paused) events.push(["sample", ...args]);
};
const cue = (kind, index) => kind === "intro" ? (index === 0 ? "alarm" : undefined) : ({2:"doorbell",10:"bell",11:"alarm"})[index];
const scene = (kind, index, age) =>
  a.scene(kind, false, 180, 0.02, 200, false, {
    cinematic: { kind, index, age, cue: cue(kind, index) },
  });
scene("intro", 0, 0);
assert(events.length > 0, "phone alarm begins");
const n = events.length;
scene("intro", 0, 0.02);
assert.equal(events.length, n, "no per-frame alarm");
a.scene("intro", true, 180, 2, 200, false, {
  cinematic: { kind: "intro", index: 0, age: 0.02, cue: "alarm" },
});
scene("intro", 0, 0.02);
assert.equal(events.length, n, "no alarm replay at pause resume");
scene("intro", 1, 0);
const quiet = events.length;
scene("intro", 1, 2);
assert.equal(events.length, quiet);
scene("ending", 2, 0);
assert(events.length > quiet, "doorbell");
for (const index of [5, 6, 7, 8, 9]) { const before = events.length; scene("ending", index, 0); assert.equal(events.length, before, "campus has no premature bell/alarm"); }
scene("ending", 10, 0);
assert(events.some((e) => e[0] === "sample" && e[1] === "bell-start"));
const bell = events.length;
scene("ending", 10, 0.02);
assert.equal(events.length, bell);
scene("ending", 11, 0);
assert(events.length > bell, "bell switches to the same phone motif");
const mute = events.length;
a.muted = true;
scene("intro", 0, 0);
a.muted = false;
scene("intro", 0, 0.1);
assert.equal(events.length, mute, "no backlog on unmute");
console.log(
  "PASS silent-story cues: phone alarm, quiet page, doorbell, school bell, wake-up and pause/mute consumption",
);
