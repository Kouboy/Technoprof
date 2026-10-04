const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { createGame } = require("./test-harness.cjs");
function setup() {
  const t = createGame(),
    g = t.g;
  g.workshop = true;
  g.controls = new t.api.ActionInput();
  g.keys = g.controls.keys;
  g.physicalKeys = Object.fromEntries(
    Object.values(t.api.BINDINGS)
      .flat()
      .map((k) => [k, { isDown: false, just: false }]),
  );
  g.direct = new t.api.DirectInput(g);
  g.loadScenario("bruel-navigation-a3");
  g.enterRoom(111, 150);
  t.advance(0.4);
  for (let i = 0; i < 12 && g.encounterTime; i++) {
    g.physicalKeys.F.just = true;
    t.step();
  }
  assert.equal(g.enemies[0].hp, 6);
  assert.equal(g.enemies[0].parentCycle.phase, "guard");
  return t;
}
function release(t) {
  for (const k of Object.values(t.g.physicalKeys)) k.isDown = false;
}
function tap(t, x, y) {
  t.g.direct.down(1, x, y);
  t.g.direct.up(1, x, y);
}
function strike(t, mode) {
  if (t.g.attack || t.g.hitStop || t.g.playerRecovery) return;
  if (mode === "keyboard") t.g.physicalKeys.F.just = true;
  else tap(t, t.g.enemies[0].x, 110);
}
function jump(t, mode) {
  if (mode === "keyboard") t.g.physicalKeys.SPACE.just = true;
  else {
    t.g.direct.down(1, 150, 153);
    t.g.direct.move(1, 150, 124);
    t.g.direct.up(1, 150, 124);
  }
}
function move(t, x, mode) {
  const g = t.g;
  if (mode === "keyboard") {
    if (Math.abs(x - g.px) > 1)
      g.physicalKeys[x > g.px ? "D" : "Q"].isDown = true;
  } else if (g.direct.intent?.kind !== "walk") tap(t, x, 164);
}
function play(t, mode, mash) {
  const g = t.g,
    e = g.enemies[0],
    dx = e.x - g.px,
    side = Math.sign(dx) || 1;
  if (
    e.parentCycle.phase === "breakaway" ||
    g.roomTransition ||
    g.playerRecovery ||
    g.hitStop
  )
    return;
  if ((e.chargeTime ?? 0) > 0) {
    if (Math.abs(dx) < 58 && g.py === 159) jump(t, mode);
    if ((g.px - e.x) * (e.chargeDir ?? -1) < 0 && Math.abs(dx) > 60)
      move(t, e.x - side * 55, mode);
  } else if (e.parentCycle.phase === "opening") {
    if (Math.abs(dx) > 61) move(t, e.x - side * 57, mode);
    else if (g.py >= 130) strike(t, mode);
  } else if (!e.wind && Math.abs(dx) > 72) move(t, e.x - side * 65, mode);
  if (mash && Math.abs(dx) <= 61 && g.py >= 130) strike(t, mode);
}
const results = [];
for (const fps of [30, 60, 120])
  for (const mode of ["keyboard", "direct"])
    for (const mash of [false, true]) {
      const t = setup(),
        g = t.g,
        e = g.enemies[0];
      if (mash) g.inv = 999; // Explicit anti-lock stress, not a survival claim.
      let groups = 0,
        hits = 0,
        breaking = false,
        breakHp,
        breakPlayerHp,
        firstGap,
        maxDisplacement = 0;
      for (let i = 0; i < fps * 70 && e.hp > 0 && g.phase === "school"; i++) {
        release(t);
        play(t, mode, mash);
        t.step(1000 / fps);
        const events = g.session.events;
        for (const event of events.slice(groups)) {
          if (event.kind === "boss-opening") hits = 0;
          if (event.kind === "contact") {
            hits++;
            assert(hits <= 2, "no more than two hits in one opening");
            assert(event.data.openingHit <= 2);
          }
        }
        groups = events.length;
        if (e.parentCycle.phase === "breakaway") {
          if (!breaking) {
            breaking = true;
            breakHp = e.hp;
            breakPlayerHp = g.hp;
            firstGap = Math.abs(e.x - g.px);
          }
          assert.equal(
            e.hp,
            breakHp,
            "mashing cannot damage through physical reprise",
          );
          assert.equal(g.hp, breakPlayerHp, "reprise displaces without damage");
          maxDisplacement = Math.max(
            maxDisplacement,
            Math.abs(e.x - g.px) - firstGap,
          );
        } else if (breaking) {
          assert(
            Math.abs(e.x - g.px) >= 83.9,
            "guard restored beyond book reach",
          );
          breaking = false;
        }
      }
      assert.equal(
        e.hp,
        0,
        JSON.stringify({
          fps,
          mode,
          mash,
          hp: g.hp,
          remaining: g.remaining,
          cycle: e.parentCycle,
          x: e.x,
          player: g.px,
        }),
      );
      const releases = g.session.events.filter(
        (e) => e.kind === "enemy-attack" && e.data.stage === "release",
      );
      const openings = g.session.events.filter(
        (e) => e.kind === "boss-opening",
      );
      const reprises = g.session.events.filter(
        (e) => e.kind === "boss-breakaway",
      );
      assert(
        releases.length >= 3,
        "six HP must require repeated readings of the charge",
      );
      assert(openings.length >= 3);
      assert(reprises.length >= 2);
      assert(maxDisplacement > 0);
      if (!mash) assert(g.hp > 0, "real health responsive play can win");
      results.push({
        fps,
        mode,
        mash,
        releaseCount: releases.length,
        openings: openings.length,
        reprises: reprises.length,
        endHp: g.hp,
      });
    }
// Declared one-hit opening fixture near each wall. Only real input can cause the
// second hit/reprise; no target relocation after setup. Check pause mid-reprise.
for (const side of [-1, 1])
  for (const fps of [30, 60, 120]) {
    const t = setup(),
      g = t.g,
      e = g.enemies[0];
    e.x = side > 0 ? 271 : 32;
    g.px = e.x - side * 45;
    g.face = side;
    g.openParentWindow(e);
    e.parentCycle.hits = 1;
    for (let i = 0; i < fps * 2 && e.parentCycle.phase !== "breakaway"; i++) {
      release(t);
      strike(t, "keyboard");
      t.step(1000 / fps);
    }
    assert.equal(e.hp, 5);
    assert.equal(e.parentCycle.phase, "breakaway");
    const snap = () => [
      g.hp,
      g.remaining,
      g.px,
      g.py,
      e.x,
      e.parentCycle.elapsed,
      e.parentCycle.phase,
    ];
    const before = snap();
    g.setPaused(true);
    t.advance(3, fps);
    assert.deepEqual(snap(), before);
    g.setPaused(false);
    g.pauseForFocusLoss();
    t.advance(2, fps);
    assert.deepEqual(snap(), before);
    g.setPaused(false);
    t.advance(0.5, fps);
    assert(Math.abs(e.x - g.px) >= 83.9);
    assert.equal(e.hp, 5);
    assert.equal(g.hp, 5);
    // A preparation can be paused; a scene exit/defeat can never revive a dead boss.
    assert(g.session.events.some((v) => v.kind === "boss-guard-restored"));
  }
fs.writeFileSync(
  "work/parent-cycle-a3-results.json",
  JSON.stringify(
    {
      method:
        "Real input dodge/punish battles; mash stress alone declares invulnerability. Wall/pause fixtures explicitly declared. Human gamefeel still needs observation.",
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "PASS parent cycle A3: 12 battles keyboard/direct at 30/60/120 fps, at most two hits/opening, repeated charges, no damage during reprise, restored distance and wall/pause/focus fixtures.",
);
