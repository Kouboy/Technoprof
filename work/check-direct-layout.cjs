const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const { createGame } = require("./test-harness.cjs");
const events = {},
  box = { left: 225, top: 0.359, width: 394, height: 295.5 };
const game = {
  querySelector() {
    return { getBoundingClientRect: () => ({ ...box }) };
  },
  addEventListener: (k, v) => (events[k] = v),
  focus() {},
  setPointerCapture() {},
};
const ctx = {
  document: { getElementById: () => game, addEventListener() {} },
  window: { addEventListener() {} },
};
vm.createContext(ctx);
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
vm.runInContext(
  stripTypeScriptTypes(strip(fs.readFileSync("src/direct-input.ts", "utf8"))) +
    ";globalThis.install=installDirectInput;",
  ctx,
);
const { g, api } = createGame();
g.loadScenario("road");
g.playerMenu = false;
g.paused = false;
g.controls = new api.ActionInput();
g.direct = ctx.install(g);
const event = (x, y) => ({
  pointerId: 1,
  pointerType: "touch",
  button: 0,
  clientX: x,
  clientY: y,
  preventDefault() {},
});
const down = event(
  box.left + (256 * box.width) / 320,
  box.top + (140 * box.height) / 240,
);
events.pointerdown(down);
g.direct.tick(0);
assert(g.direct.gesture);
const before = { ...g.direct.gesture };
Object.assign(box, { left: 187.5, top: 0.125, width: 469, height: 351.75 });
events.pointermove(event(down.clientX + 1, down.clientY));
g.direct.tick(0);
const gesture = g.direct.gesture;
assert(
  Math.abs(gesture.nx - gesture.x - 320 / 469) < 1e-9,
  "1 physical pixel must remain a small positive move after reflow",
);
assert(Math.abs(gesture.ny - gesture.y) < 1e-9, "no phantom brake/jump");
// Preserve an already established steering/braking displacement through another reflow.
events.pointermove(event(down.clientX + 30, down.clientY + 30));
const dx = gesture.nx - gesture.x,
  dy = gesture.ny - gesture.y;
Object.assign(box, { left: 20, top: 150, width: 640, height: 480 });
events.pointermove(event(down.clientX + 30, down.clientY + 30));
assert(Math.abs(gesture.nx - gesture.x - dx) < 1e-9);
assert(Math.abs(gesture.ny - gesture.y - dy) < 1e-9);
events.pointerup(event(down.clientX + 30, down.clientY + 30));
assert.equal(g.direct.gesture, null);
console.log(
  "PASS held touch preserves steering/braking across canvas reflow; +1px stays +1px and release clears gesture",
);
