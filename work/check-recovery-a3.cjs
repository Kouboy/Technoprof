const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
function setup(hp = 2, gain = 1) {
  const t = createGame(),
    g = t.g;
  g.workshop = true;
  g.navigationStartHp = hp;
  g.navigationGain = gain;
  g.controls = new t.api.ActionInput();
  g.keys = g.controls.keys;
  g.physicalKeys = Object.fromEntries(
    Object.values(t.api.BINDINGS)
      .flat()
      .map((k) => [k, { isDown: false, just: false }]),
  );
  g.direct = new t.api.DirectInput(g);
  g.loadScenario("bruel-navigation-a3-care");
  g.direct.tick(0);
  return t;
}
function release(t) {
  for (const k of Object.values(t.g.physicalKeys)) k.isDown = false;
}
function tap(t, x = 150, y = 30) {
  t.g.direct.down(1, x, y);
  t.g.direct.up(1, x, y);
}
function action(t, mode) {
  if (mode === "direct") tap(t);
  else t.g.physicalKeys.F.just = true;
}
function enter(t, mode, fps) {
  const g = t.g;
  for (let i = 0; i < fps * 6 && g.room !== 107; i++) {
    release(t);
    if (mode === "direct") {
      if (g.direct.intent?.kind !== "exit") tap(t, 170, 62);
    } else if (g.px < 153) g.physicalKeys.D.isDown = true;
    else g.physicalKeys.Z.isDown = true;
    t.step(1000 / fps);
  }
  release(t);
  assert.equal(g.room, 107);
  t.advance(0.4, fps);
}
function finish(t, mode, fps) {
  for (
    let i = 0;
    i < fps * 12 && (t.g.recoveryScene.active || t.g.roomTransition);
    i++
  ) {
    release(t);
    if (t.g.recoveryScene.state === "dialogue") action(t, mode);
    t.step(1000 / fps);
  }
  assert.equal(t.g.room, 108);
  assert(!t.g.recoveryScene.active);
  assert(!t.g.roomTransition);
}
exports.run = () => {
  const reports = [];
  for (const fps of [30, 60, 120])
    for (const mode of ["keyboard", "direct"])
      for (const gain of [1, 2])
        for (const hp of [1, 2, 3, 4, 5]) {
          const t = setup(hp, gain),
            g = t.g;
          enter(t, mode, fps);
          assert(
            g.navigationCare.used,
            "reserve usage at entry, even at full health",
          );
          const start = g.remaining;
          finish(t, mode, fps);
          assert.equal(g.hp, 5);
          assert.equal(
            g.session.events.find((e) => e.kind === "care-exit").data.remaining,
            start,
            "whole scene and automatic exit cost no mission time",
          );
          assert(
            start - g.remaining <= 1 / fps + 1e-8,
            "only the normal resumed substep may charge the clock",
          );
          assert.equal(g.attack, 0);
          assert.equal(g.py, 159);
          const complete = g.session.events.filter(
            (e) => e.kind === "care-complete",
          );
          assert.equal(complete.length, 1);
          assert.equal(complete[0].data.gain, 5 - hp);
          assert.equal(
            g.session.events.filter((e) => e.kind === "care-start").length,
            1,
          );
          assert.equal(
            g.session.events.filter((e) => e.kind === "care-exit").length,
            1,
          );
          // Declared subsequent injury, followed by real reentry: no replay or double healing.
          g.hp = 2;
          enter(t, mode, fps);
          t.advance(2, fps);
          action(t, mode);
          t.step(1000 / fps);
          assert.equal(g.hp, 2);
          assert(!g.recoveryScene.active);
          assert.equal(
            g.session.events.filter((e) => e.kind === "care-complete").length,
            1,
          );
          assert(
            g.remaining < start,
            "normal timer resumes on an already-used visit",
          );
          reports.push({
            fps,
            mode,
            gain: "full",
            startHp: hp,
            endHp: 5,
            careUses: 1,
            remaining: +start.toFixed(3),
          });
        }
  for (const fps of [30, 60, 120]) {
    const t = setup(),
      g = t.g;
    enter(t, "keyboard", fps);
    for (let i = 0; i < fps * 3 && g.recoveryScene.state !== "dialogue"; i++)
      t.step(1000 / fps);
    const clock = g.remaining;
    t.advance(25, fps);
    assert.equal(g.remaining, clock);
    assert.equal(g.hp, 2);
    assert.equal(g.recoveryScene.dialogue.page, 0, "reading has no timeout");
    g.direct.down(1, 150, 153);
    g.direct.move(1, 150, 124);
    g.direct.up(1, 150, 124);
    assert.notEqual(
      g.direct.feedback?.kind,
      "jump",
      "no contradictory jump feedback in the recovery scene",
    );
    const snapshot = () => [
      g.hp,
      g.remaining,
      g.px,
      g.recoveryScene.state,
      g.recoveryScene.dialogue.page,
      g.recoveryScene.dialogue.characters,
    ];
    const before = snapshot();
    g.setPaused(true);
    t.advance(3, fps);
    assert.deepEqual(snapshot(), before);
    g.setPaused(false);
    g.pauseForFocusLoss();
    t.advance(3, fps);
    assert.deepEqual(snapshot(), before);
    g.setPaused(false);
    // Movement/jump/doors don't escape the dialogue; a held Action advances once.
    g.physicalKeys.D.isDown =
      g.physicalKeys.SPACE.isDown =
      g.physicalKeys.Z.isDown =
        true;
    g.physicalKeys.F.isDown = true;
    t.step(1000 / fps);
    const page = g.recoveryScene.dialogue.page;
    t.advance(2, fps);
    assert.equal(g.recoveryScene.dialogue.page, page);
    assert.equal(g.px, 116);
    assert.equal(g.py, 159);
    release(t);
    t.step(1000 / fps);
    finish(t, "keyboard", fps);
    const resumed = g.remaining;
    t.advance(0.5, fps);
    assert(g.remaining < resumed);
    assert.equal(g.hp, 5);
    // Scene can start at a positive last fraction; a zero clock cannot start healing.
    const near = setup();
    near.g.remaining = 0.05;
    near.g.enterRoom(107, 55);
    const last = near.g.remaining;
    near.advance(4, fps);
    assert.equal(near.g.remaining, last);
    finish(near, "keyboard", fps);
    assert.equal(near.g.hp, 5);
    const late = setup();
    late.g.remaining = 0;
    late.g.enterRoom(107, 55);
    late.step(1000 / fps);
    assert.equal(late.g.phase, "fail");
    assert(!late.g.navigationCare.used);
    assert.equal(late.g.hp, 2);
    // Replay during an unfinished scene resets the reservation for a new trial.
    const reset = setup();
    reset.g.enterRoom(107, 55);
    reset.advance(1, fps);
    reset.g.loadScenario("bruel-navigation-a3-care");
    assert(!reset.g.recoveryScene.active);
    assert(!reset.g.navigationCare.used);
  }
  for (const fps of [30, 60, 120])
    for (const stage of ["enter", "dialogue", "leave", "transition"]) {
      const t = setup(),
        g = t.g;
      g.enterRoom(107, 55);
      for (let i = 0; i < fps * 8; i++) {
        if (
          stage === "transition"
            ? !!g.roomTransition
            : g.recoveryScene.state === stage
        )
          break;
        if (g.recoveryScene.state === "dialogue") action(t, "keyboard");
        t.step(1000 / fps);
      }
      assert(
        stage === "transition"
          ? g.roomTransition
          : g.recoveryScene.state === stage,
      );
      const snap = () => [
        g.room,
        g.hp,
        g.remaining,
        g.px,
        g.recoveryScene.state,
        g.recoveryScene.dialogue.page,
        g.recoveryScene.dialogue.characters,
        g.navigationCare.used,
        g.roomTransition?.age,
      ];
      const frozen = snap();
      g.setPaused(true);
      t.advance(2, fps);
      assert.deepEqual(snap(), frozen);
      g.setPaused(false);
      g.pauseForFocusLoss();
      t.advance(2, fps);
      assert.deepEqual(snap(), frozen);
      g.setPaused(false);
      finish(t, "keyboard", fps);
      assert.equal(g.hp, 5);
      assert.equal(
        g.session.events.filter((e) => e.kind === "care-complete").length,
        1,
      );
    }
  for (const fps of [30, 60, 120]) {
    const t = setup(),
      g = t.g;
    g.enterRoom(107, 55);
    for (
      let i = 0;
      i < fps * 8 && (g.recoveryScene.active || g.roomTransition);
      i++
    ) {
      g.physicalKeys.Z.isDown = true;
      if (g.recoveryScene.state === "dialogue") action(t, "keyboard");
      t.step(1000 / fps);
    }
    assert.equal(g.room, 108);
    t.advance(0.5, fps);
    assert.equal(
      g.room,
      108,
      "held entry cannot bounce back after automatic return",
    );
    assert.equal(g.hp, 5);
    assert.equal(
      g.session.events.filter((e) => e.kind === "care-complete").length,
      1,
    );
  }
  console.log(
    "PASS recovery A3: 60 full-heal/unique-use cases, keyboard/direct at 30/60/120 fps; frozen scene/exit clock, dialogue controls, pause/focus, late boundary and replay.",
  );
  return reports;
};
if (require.main === module) exports.run();
