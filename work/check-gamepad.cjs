const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
assert(fs.existsSync("src/gamepad-input.ts"), "gamepad adapter exists");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  stripTypeScriptTypes(
    fs.readFileSync("src/gamepad-input.ts", "utf8").replace(/export /g, ""),
  ) + ";globalThis.PadInput=GamepadInput;",
  ctx,
);
const context = (phase = "school", menu = false) => ({
  phase,
  menu,
  focused: true,
});
function pad(buttons = [], axes = [0, 0]) {
  return {
    index: 0,
    connected: true,
    mapping: "standard",
    axes,
    buttons: Array.from({ length: 17 }, (_, i) => ({
      pressed: buttons.includes(i),
      value: buttons.includes(i) ? 1 : 0,
    })),
  };
}
function make() {
  return new ctx.PadInput();
}
let input = make();
let state = input.sample([pad([9])], context("title", true), 0.016);
assert.deepEqual([...state.ui], ["start"], "first Start discovers and starts");
assert.deepEqual(
  [...input.sample([pad([9])], context("intro"), 0.016).ui],
  [],
  "held Start cannot skip the intro",
);
input.sample([pad()], context("intro"), 0.016);
assert.deepEqual(
  [...input.sample([pad([9])], context("intro"), 0.016).ui],
  ["start"],
);
for (const [button, action] of [
  [0, "SPACE"],
  [1, "X"],
]) {
  input = make();
  input.sample([pad()], context(), 0.016);
  assert(
    input.sample([pad([button])], context(), 0.016).actions.includes(action),
  );
  assert(
    !input.sample([pad([button])], context(), 0.016).actions.includes(action),
    "one press, not repeated",
  );
  input.sample([pad()], context(), 0.016);
  assert(
    input.sample([pad([button])], context(), 0.016).actions.includes(action),
  );
}
input = make();
assert(
  !input.sample([pad([], [0.1, -0.1])], context("road"), 0.016).drive,
  "stick drift stays neutral",
);
state = input.sample([pad([15, 7])], context("road"), 0.016);
assert.equal(state.drive.steer, 1);
assert.equal(state.drive.throttle, 1);
assert.equal(state.drive.brake, 0);
state = input.sample([pad([14, 6])], context("free"), 0.016);
assert.equal(state.drive.steer, -1);
assert.equal(state.drive.brake, 1);
const half = pad([], [0.6, 0]);
half.buttons[7].value = 0.55;
state = input.sample([half], context("road"), 0.016);
assert(state.drive.throttle > 0 && state.drive.throttle < 1);
assert(state.drive.steer > 0 && state.drive.steer < 1);
state = input.sample([pad([14, 15])], context("road"), 0.016);
assert.equal(state.drive?.steer ?? 0, 0, "opposed directions cancel");
assert(input.sample([pad([12])], context(), 0.016).actions.includes("UP"));
assert(input.sample([pad([13])], context(), 0.016).actions.includes("DOWN"));
input = make();
input.sample([pad()], context("school", true), 0.016);
assert.deepEqual(
  [...input.sample([pad([0])], context("school", true), 0.016).ui],
  ["accept"],
);
input.sample([pad()], context("school", true), 0.016);
assert.deepEqual(
  [...input.sample([pad([1])], context("school", true), 0.016).ui],
  ["back"],
);
input = make();
assert(
  input.sample([pad([13])], context("title", true), 0.016).ui.includes("down"),
);
assert(
  !input.sample([pad([13])], context("title", true), 0.1).ui.includes("down"),
);
assert(
  input.sample([pad([13])], context("title", true), 0.35).ui.includes("down"),
);
input = make();
input.sample([pad()], context(), 0.016);
input.suspend();
assert.deepEqual(
  [...input.sample([pad([0, 9])], context(), 0.016).actions],
  [],
);
assert.deepEqual(
  [...input.sample([pad([0, 9])], context(), 0.016).ui],
  [],
  "focus return cannot replay a held Start",
);
input.sample([pad()], context(), 0.016);
assert(input.sample([pad([9])], context(), 0.016).ui.includes("start"));
state = input.sample([], context(), 0.016);
assert(state.lost);
assert.equal(state.drive, null);
assert.equal(state.actions.length, 0);
assert(!input.sample([], context(), 0.016).lost, "one disconnect event");
assert(
  !make().sample([{ ...pad(), mapping: "" }], context(), 0.016).connected,
  "unknown mapping never guesses buttons",
);
assert(
  make().sample([null, pad()], context(), 0.016).connected,
  "holes in navigator array",
);
input = make();
input.sample([pad()], context("course"), 0.016);
assert(
  input.sample([pad([1])], context("course"), 0.016).ui.includes("continue"),
);
input = make();
input.sample([pad()], context("fail"), 0.016);
assert(
  input.sample([pad([9])], context("fail"), 0.016).actions.includes("ENTER"),
);
console.log(
  "PASS standard pad, analog drive, deadzone, action edges, contextual Start, menu repeat, disconnect, focus and unknown mapping",
);

input = make();
state = input.sample([pad([9])], context("fail", true), 0.016);
assert.deepEqual(
  [...state.ui],
  ["start"],
  "a paused failure resumes before accepting retry",
);
assert.equal(state.actions.length, 0);
