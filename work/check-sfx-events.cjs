const assert = require("node:assert/strict");
const { load } = require("./audio-harness.cjs");
const { createGame } = require("./test-harness.cjs");
{
  const { g } = createGame();
  g.loadScenario("passages");
  assert.equal(g.room, 0);
  assert.equal(
    g.sceneSoundContext().outdoor,
    true,
    "legacy courtyard remains outdoors",
  );
  assert.equal(g.sceneSoundContext().surface, "concrete");
}
function rig() {
  const a = new (load().AudioKit)(),
    events = [];
  const param = () => ({
    value: 0,
    setTargetAtTime(v) {
      this.value = v;
    },
  });
  a.context = { currentTime: 0 };
  a.master = { gain: param() };
  a.ambience = { gain: param() };
  a.stopGroup = () => {};
  a.play = (kind, side, weight, delay, group, rate, offset) => {
    if (!a.paused && !a.muted)
      events.push({ kind, side, weight, group, rate, offset });
  };
  a.tone = () => {};
  return { a, events };
}
for (const [phase, kind, at] of [
  ["lifeLost", "relay", 0.8],
  ["radiated", "stamp", 0.65],
]) {
  const { a, events } = rig();
  a.scene(phase, false, 120, 0, 0, false, { age: 0 });
  a.scene(phase, false, 120, at, 0, false, { age: at });
  assert.equal(events.filter((e) => e.kind === kind).length, 1);
  a.scene(phase, true, 120, 0, 0, false, { age: at });
  a.scene(phase, false, 120, 0, 0, false, { age: at });
  assert.equal(
    events.filter((e) => e.kind === kind).length,
    1,
    "pause cannot duplicate the loss click or radiation stamp",
  );
}
{
  const { a, events } = rig();
  a.scene("school", false, 120, 0.02, 105, false, {
    surface: "wood",
    outdoor: false,
  });
  a.fx("step");
  assert.equal(events.at(-1).kind, "step-wood");
  a.scene("school", true, 120, 0, 105, false, {
    surface: "wood",
    outdoor: false,
  });
  const count = events.length;
  a.fx("step");
  assert.equal(events.length, count);
  a.scene("school", false, 120, 0, 105, false, {
    surface: "wood",
    outdoor: false,
  });
  a.fx("step");
  assert.equal(events.at(-1).kind, "step-wood");
  a.scene("school", false, 120, 0.02, 208, false, {
    surface: "tile",
    care: true,
  });
  a.fx("step");
  assert.equal(events.at(-1).kind, "step");
  assert(events.at(-1).weight < 0.6);
}
for (const fps of [30, 60, 120]) {
  const { a, events } = rig();
  for (let i = 0; i < fps * 5.8; i++)
    a.scene("arrival", false, 120, 1 / fps, 0, false, {
      age: i / fps,
      arrivalEntry: "gate",
    });
  assert.equal(events.filter((e) => e.kind === "car-door").length, 1);
  assert.equal(events.filter((e) => e.kind === "gate").length, 1);
  assert(events.filter((e) => e.kind.startsWith("step")).length >= 7);
  const n = events.length;
  a.scene("arrival", true, 120, 10, 0, false, {
    age: 5.7,
    arrivalEntry: "gate",
  });
  a.scene("arrival", false, 120, 0, 0, false, {
    age: 5.7,
    arrivalEntry: "gate",
  });
  assert.equal(
    events.length,
    n,
    "no repeated arrival footsteps/gate on resume",
  );
  const other = rig();
  other.a.scene("arrival", false, 120, 0, 0, false, {
    age: 3.7,
    arrivalEntry: "door",
  });
  assert(
    !other.events.some((e) => e.kind === "gate"),
    "only H1 has an animated gate",
  );
}
{
  const { a, events } = rig();
  a.scene("arrival", false, 120, 0, 0, false, {
    age: 4.6,
    arrivalEntry: "door",
  });
  const count = events.filter((e) => e.kind === "door").length;
  assert.equal(count, 1);
  a.scene("arrival", true, 120, 10, 0, false, {
    age: 4.6,
    arrivalEntry: "door",
  });
  a.scene("arrival", false, 120, 0, 0, false, {
    age: 4.6,
    arrivalEntry: "door",
  });
  assert.equal(
    events.filter((e) => e.kind === "door").length,
    count,
    "arrival door is an atomic cue on resume",
  );
}
for (const fps of [30, 60, 120])
  for (const kind of ["passage", "door", "stairs"]) {
    const { a, events } = rig(),
      transition = { age: 0, sound: kind, surface: "tile" };
    a.scene("school", false, 120, 0.02, 201, false, {
      surface: "tile",
      transition,
    });
    for (let i = 1; i < Math.ceil(0.3 * fps); i++) {
      transition.age = i / fps;
      a.scene("school", false, 120, 1 / fps, 202, false, {
        surface: "tile",
        transition,
      });
    }
    if (kind === "stairs")
      assert.equal(events.filter((e) => e.kind === "stairs").length, 1);
    if (kind === "door") {
      assert.equal(events.filter((e) => e.kind === "handle").length, 1);
      assert.equal(
        events.filter((e) => e.kind === "door-passage").length,
        1,
        "room door has its own short hinge/latch sample",
      );
    }
    if (kind === "passage")
      assert(
        !events.some((e) => ["door", "handle", "stairs"].includes(e.kind)),
      );
    const n = events.length;
    a.scene("school", true, 120, 10, 202, false, {
      surface: "tile",
      transition,
    });
    a.scene("school", false, 120, 0, 202, false, {
      surface: "tile",
      transition,
    });
    assert.equal(events.length, n);
  }
for (const kind of ["passage", "door", "stairs"]) {
  const { a, events } = rig(),
    transition = { age: 0, sound: kind, surface: "wood" };
  const context = { transition, surface: "wood" };
  a.scene("school", false, 120, 0, 105, false, context);
  transition.age = 0.04;
  a.scene("school", false, 120, 0.04, 105, false, context);
  const first = events.length;
  a.scene("school", true, 120, 0, 105, false, context);
  a.scene("school", false, 120, 0, 105, false, context);
  assert.equal(
    events.length,
    first,
    "resume never repeats the latch or first contact",
  );
  transition.age = 0.2;
  a.scene("school", false, 120, 0.16, 104, false, context);
  assert.equal(
    events.filter((e) => e.kind === "step-wood").length,
    kind === "passage" ? 2 : 0,
    "pending corridor contact survives a mid-transition pause and uses destination floor",
  );
}
{
  const t = createGame(),
    g = t.g,
    events = [];
  g.audio.fx = (...e) => events.push(e);
  g.workshop = true;
  g.loadScenario("bruel-navigation-a3-view-105");
  assert.equal(g.sceneSoundContext().surface, "wood");
  g.encounterTime = g.schoolFade = 0;
  g.enemies = [];
  events.length = 0;
  t.advance(0.8);
  assert(!events.some((e) => e[0] === "step"), "idle is silent");
  g.keys.RIGHT.isDown = true;
  t.advance(0.3);
  g.keys.RIGHT.isDown = false;
  assert(events.some((e) => e[0] === "step"));
  events.length = 0;
  g.vy = -100;
  g.py = 110;
  g.keys.RIGHT.isDown = true;
  t.advance(0.05);
  assert(!events.some((e) => e[0] === "step"), "no airborne steps");
}
console.log(
  "PASS SFX events: surfaces, gentle care, arrival footsteps/gate, passage identity, pause and actual grounded movement",
);
{
  const { AudioKit } = load(),
    a = new AudioKit();
  let created = 0;
  a.context = {
    createBuffer(ch, length, sampleRate) {
      created++;
      const data = new Float32Array(length);
      return { length, sampleRate, getChannelData: () => data };
    },
  };
  const first = a.buffer("book", 0),
    second = a.buffer("book", 1);
  assert.notDeepEqual(first.getChannelData(0), second.getChannelData(0));
  assert.strictEqual(a.buffer("book", 0), first);
  assert.strictEqual(a.buffer("book", 1), second);
  assert.equal(created, 2, "takes are cached");
}
