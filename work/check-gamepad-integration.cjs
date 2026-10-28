const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const { stripTypeScriptTypes } = require("node:module");
const { createGame } = require("./test-harness.cjs");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  stripTypeScriptTypes(
    fs.readFileSync("src/gamepad-input.ts", "utf8").replace(/export /g, ""),
  ) + ";globalThis.PadInput=GamepadInput;",
  ctx,
);
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
function setup() {
  let snapshot = [pad()];
  const t = createGame({ policy: "three-required", gamepads: () => snapshot });
  t.g.controls = new t.api.ActionInput();
  t.g.keys = t.g.controls.keys;
  t.g.gamepad = new ctx.PadInput();
  return { ...t, set: (value) => (snapshot = value) };
}
for (const brake of [1, 2]) {
  const t = setup(),
    g = t.g;
  g.startDay(false);
  g.phase = "road";
  g.notified = true;
  g.speed = 100;
  g.obstacles = [];
  t.set([pad([0])]);
  t.advance(1);
  assert(g.speed > 110, "held A really accelerates");
  const speed = g.speed;
  t.set([pad([brake])]);
  t.advance(0.5);
  assert(g.speed < speed - 35, "held B/X really brakes");
  assert.equal(g.attack, 0, "pedals cannot strike while driving");
}
{
  const t = setup(),
    g = t.g;
  g.startDay(false);
  g.phase = "road";
  g.notified = true;
  g.speed = 100;
  g.obstacles = [];
  t.set([pad([7])]);
  t.advance(1);
  assert(g.speed > 110);
  const fast = g.speed;
  t.set([pad([6])]);
  t.advance(0.5);
  assert(g.speed < fast - 35);
  assert(g.gamepadMode);
  t.set([]);
  t.step();
  assert(g.paused, "disconnect pauses a gamepad-controlled run");
  assert.equal(g.pauseReason, "MANETTE DECONNECTEE");
  assert.equal(g.controls.gamepadDrive, null);
}
{
  const t = setup(),
    g = t.g;
  g.startDay(false);
  g.phase = "road";
  g.notified = true;
  g.speed = 100;
  g.obstacles = [];
  const half = pad();
  half.buttons[7].value = 0.55;
  t.set([half]);
  t.advance(1);
  assert(g.speed > 105 && g.speed < 120, "partial acceleration");
}
{
  const t = setup(),
    g = t.g;
  g.startDay();
  t.set([pad([9])]);
  t.step();
  assert.equal(g.phase, "free", "Start skips the entire intro");
  t.step();
  assert(!g.paused, "held Start cannot pause the road it opened");
  t.set([pad()]);
  t.step();
  t.set([pad([9])]);
  t.step();
  assert(g.paused);
  t.set([pad()]);
  t.step();
  t.set([pad([9])]);
  t.step();
  assert(!g.paused);
}
{
  const t = setup(),
    g = t.g;
  g.startDay(false);
  g.notified = true;
  g.school();
  g.enterRoom(0, 110);
  g.schoolFade = g.bossIntro = g.encounterTime = 0;
  g.enemies = [];
  t.set([pad([0])]);
  t.step();
  assert(g.vy < 0, "A jumps through existing physics");
  t.advance(1.5);
  assert(g.py === 159);
  t.advance(0.3);
  assert(g.py === 159, "held A never auto-jumps");
  t.set([pad()]);
  t.step();
  t.set([pad([1])]);
  t.step();
  assert(g.attack > 0, "B strikes");
}
{
  const t = setup(),
    g = t.g;
  g.startDay(false);
  g.notified = true;
  g.school();
  g.enterRoom(1, 110);
  g.schoolFade = g.bossIntro = 0;
  assert(g.encounterTime > 0);
  const x = g.px;
  t.set([pad([15, 1])]);
  t.step();
  assert.equal(g.px, x, "dialogue locks movement");
  assert.equal(
    g.dialogue.characters,
    t.api.dialogueLength(g.room, g.dialogue, g.encounter()),
  );
  assert.equal(g.dialogue.page, 0);
  t.advance(0.5);
  assert.equal(g.dialogue.page, 0, "holding B never skips a page");
  t.set([pad()]);
  t.step();
  t.set([pad([1])]);
  t.step();
  assert.equal(g.dialogue.page, 1, "fresh B advances the completed page");
  assert.equal(g.attack, 0, "dialogue B never also strikes");
}
{
  const t = setup(),
    g = t.g;
  g.startDay(false);
  g.notified = true;
  g.school();
  g.enterRoom(2, 90);
  g.schoolFade = g.bossIntro = g.encounterTime = g.interactLock = 0;
  g.enemies = [];
  const exit = g.pointerExits().find((exit) => exit.key === "UP");
  assert(exit, "test room has a stairway");
  g.px = (exit.from + exit.to) / 2;
  t.set([pad([12])]);
  t.step();
  assert.equal(g.roomTransition?.target, exit.target);
  const remaining = g.remaining;
  t.advance(0.1);
  assert.equal(g.remaining, remaining, "transition suspends the deadline");
  t.advance(0.4);
  assert.equal(g.room, exit.target);
  const room = g.room;
  t.advance(0.8);
  assert.equal(g.room, room, "held direction cannot chain stairways");
}
{
  const t = setup(),
    g = t.g;
  g.startDay(false);
  g.phase = "course";
  g.age = 1;
  t.set([pad([1])]);
  t.step();
  assert.equal(g.phase, "blackAfter", "B continues after the lesson");
  g.phase = "fail";
  g.setPaused(true);
  t.set([pad()]);
  t.step();
  t.set([pad([9])]);
  t.step();
  assert(!g.paused, "Start resumes a suspended failure before retrying");
  assert.equal(g.phase, "fail");
}
{
  const t = createGame({
      gamepads: () => {
        throw new Error("SecurityError");
      },
    }),
    g = t.g;
  g.controls = new t.api.ActionInput();
  g.keys = g.controls.keys;
  g.gamepad = new ctx.PadInput();
  g.startDay(false);
  t.step();
  assert(!g.gamepadConnected);
  assert(!g.paused, "a blocked Gamepad API preserves other controls");
}
console.log(
  "PASS actual gamepad drive, partial triggers, disconnect pause, contextual Start, jump/strike, dialogue and stair transition",
);
