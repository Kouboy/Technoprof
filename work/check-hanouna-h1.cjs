const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { createGame } = require("./test-harness.cjs");
const design = JSON.parse(
  fs.readFileSync("work/etablissements-ld-proposition.json", "utf8"),
).hanouna;
const setup = (scenario = "hanouna-navigation-h1", hp = 5) => {
  const t = createGame(),
    g = t.g;
  g.workshop = true;
  g.navigationStartHp = hp;
  g.controls = new t.api.ActionInput();
  g.keys = g.controls.keys;
  g.physicalKeys = Object.fromEntries(
    Object.values(t.api.BINDINGS)
      .flat()
      .map((k) => [k, { isDown: false, just: false }]),
  );
  g.direct = new t.api.DirectInput(g);
  g.loadScenario(scenario);
  g.direct.tick(0);
  return t;
};
const names = {
  LEFT: "Q",
  RIGHT: "D",
  UP: "Z",
  DOWN: "S",
  X: "F",
  SPACE: "SPACE",
};
const release = (t) => {
  for (const k of Object.values(t.g.physicalKeys)) k.isDown = false;
};
const hold = (t, a) => (t.g.physicalKeys[names[a]].isDown = true);
const pulse = (t, a) => (t.g.physicalKeys[names[a]].just = true);
const tap = (t, x, y) => {
  t.g.direct.down(1, x, y);
  t.g.direct.up(1, x, y);
};
function action(t, mode) {
  if (mode === "keyboard") pulse(t, "X");
  else tap(t, 160, 164);
}
function move(t, x, mode) {
  if (mode === "keyboard") {
    if (Math.abs(x - t.g.px) > 1) hold(t, x > t.g.px ? "RIGHT" : "LEFT");
  } else if (t.g.direct.intent?.kind !== "walk") tap(t, x, 164);
}
function exit(t, target, mode) {
  const g = t.g,
    e = g.pointerExits().find((e) => e.target === target);
  assert(e, "missing exit");
  if (mode === "keyboard") {
    if (e.edge) hold(t, e.key);
    else if (g.px < e.from + 2) move(t, e.from + 3, mode);
    else if (g.px > e.to - 2) move(t, e.to - 3, mode);
    else hold(t, e.key);
  } else if (g.direct.intent?.kind !== "exit") {
    if (e.edge && Math.abs(g.px - e.hint[0]) >= 60)
      move(t, e.key === "LEFT" ? 15 : 297, mode);
    else {
      const m = t.api.passageMarker(e, g.px);
      if (m) tap(t, m.x + m.w / 2, m.y + m.h / 2);
    }
  }
}
function jump(t, mode) {
  if (t.g.py !== 159) return;
  if (mode === "keyboard") pulse(t, "SPACE");
  else {
    t.g.direct.down(1, 150, 153);
    t.g.direct.move(1, 150, 121);
    t.g.direct.up(1, 150, 121);
  }
}
const initial = setup(),
  spec = initial.g.missionSpec(),
  h = initial.api.HANOUNA_ID;
const slug = Object.fromEntries(
  Object.values(spec.rooms).map((r) => [r.navigation.id, r.id]),
);
assert.equal(Object.keys(spec.rooms).length, 9);
for (const z of design.zones) {
  const r = spec.rooms[slug[z.id]];
  assert(r);
  assert.equal(r.navigation.floor, z.floor);
  assert.equal(r.gaps.length, 0);
  const expected = design.connections
    .filter(([a, b]) => a === z.id || b === z.id)
    .map(([a, b]) => slug[a === z.id ? b : a])
    .sort();
  assert.deepEqual(
    r.boss ? expected : [...r.exits.map((e) => e.target)].sort(),
    expected,
  );
  if (design.encounterSources[z.id] !== undefined) {
    const enemies = initial.audit.missionEnemies(
      0,
      design.encounterSources[z.id],
    );
    assert.equal(r.hp, enemies[0].hp);
  }
}
assert.equal(
  Object.values(spec.rooms).filter((r) => r.exits.length >= 3).length,
  1,
);
assert.equal(Object.values(spec.rooms).filter((r) => r.role).length, 3);
const boss = initial.audit.missionEnemies(0, h.seuil, spec)[0];
assert(boss.female && boss.boss);
assert.equal(boss.hp, 6);
assert.equal(
  initial.audit.missionEnemies(0, h.vestibule, spec)[0].parent,
  true,
);
assert.equal(initial.g.careResource(), undefined);
const baseline = createGame();
baseline.g.loadScenario("hanouna-navigation-h1");
assert(!baseline.g.navigationProfile);
const reports = { passages: 0, care: [], routes: [] };
for (const fps of [30, 60, 120])
  for (const mode of ["keyboard", "direct"]) {
    for (const r of Object.values(spec.rooms).filter((r) => !r.boss))
      for (const e of r.exits) {
        const t = setup(),
          g = t.g;
        // Explicit cleared-room fixture isolates each connection; complete routes below use live enemies.
        for (const id of Object.keys(spec.rooms)) {
          g.roomEnemies.set(Number(id), []);
          g.cleared.add(Number(id));
        }
        g.navigationCare.used = true;
        g.enterRoom(r.id, 150);
        t.advance(0.4, fps);
        for (let i = 0; i < fps * 6 && g.room === r.id; i++) {
          release(t);
          exit(t, e.target, mode);
          t.step(1000 / fps);
        }
        assert.equal(g.room, e.target, `${r.id}->${e.target} ${mode} ${fps}`);
        t.advance(0.4, fps);
        assert.equal(g.room, e.target, "held input cannot bounce");
        if (mode === "direct") assert(!g.direct.intent);
        reports.passages++;
      }
    for (const hp of [1, 3, 5]) {
      const t = setup("hanouna-navigation-h1-care", hp),
        g = t.g;
      t.advance(0.4, fps);
      for (let i = 0; i < fps * 6 && g.room !== h.infirmerie; i++) {
        release(t);
        exit(t, h.infirmerie, mode);
        t.step(1000 / fps);
      }
      assert.equal(g.room, h.infirmerie);
      assert(g.recoveryScene.active);
      assert(g.navigationCare.used);
      const clock = g.remaining;
      t.advance(0.4, fps);
      g.setPaused(true);
      const before = [g.hp, g.px, g.recoveryScene.state, g.remaining];
      t.advance(2, fps);
      assert.deepEqual(
        [g.hp, g.px, g.recoveryScene.state, g.remaining],
        before,
      );
      g.setPaused(false);
      g.pauseForFocusLoss();
      t.advance(1, fps);
      assert.deepEqual(
        [g.hp, g.px, g.recoveryScene.state, g.remaining],
        before,
      );
      g.setPaused(false);
      for (
        let i = 0;
        i < fps * 12 && (g.room === h.infirmerie || g.roomTransition);
        i++
      ) {
        release(t);
        if (g.recoveryScene.state === "dialogue") action(t, mode);
        t.step(1000 / fps);
      }
      assert.equal(g.room, h.jonction);
      assert.equal(g.hp, 5);
      assert.equal(
        g.session.events.find((e) => e.kind === "care-exit").data.remaining,
        clock,
      );
      assert(
        clock - g.remaining <= 1 / fps + 1e-8,
        "only free play after the fade may resume the clock",
      );
      assert(!g.recoveryScene.active);
      assert.equal(
        g.session.events.filter((e) => e.kind === "care-complete").length,
        1,
      );
      release(t);
      for (let i = 0; i < fps * 6 && g.room !== h.infirmerie; i++) {
        release(t);
        exit(t, h.infirmerie, mode);
        t.step(1000 / fps);
      }
      t.advance(0.4, fps);
      assert(!g.recoveryScene.active);
      assert.equal(g.hp, 5);
      assert.equal(
        g.session.events.filter((e) => e.kind === "care-start").length,
        1,
      );
      reports.care.push({
        fps,
        mode,
        hp,
        healed: 5,
        suspendedClock: true,
        unique: true,
      });
    }
    for (const care of [false, true]) {
      const t = setup(),
        g = t.g,
        route = design.routes.first.map((x) => slug[x]);
      if (care) route.splice(route.length - 1, 0, h.infirmerie, h.jonction);
      let ri = 0;
      for (let i = 0; i < fps * 180 && g.phase === "school"; i++) {
        release(t);
        if (g.navigationMetrics.visits.length > ri + 1)
          ri = g.navigationMetrics.visits.length - 1;
        if (g.roomTransition || g.schoolFade || g.playerRecovery || g.hitStop) {
        } else if (g.encounterTime || g.recoveryScene.state === "dialogue")
          action(t, mode);
        else if (g.recoveryScene.active) {
        } else {
          if (g.room === route[ri + 1]) ri++;
          const e = g.enemies.find((e) => e.hp > 0);
          if (e) {
            const dx = e.x - g.px,
              side = Math.sign(dx) || 1;
            if (e.wind > 0 || e.chargeTime > 0) {
              if ((e.boss && e.pattern % 2 === 0) || e.parent || !e.boss)
                jump(t, mode);
              else move(t, e.x - side * 87, mode);
            } else if (Math.abs(dx) > (e.boss ? 69 : 40))
              move(t, e.x - side * (e.boss ? 65 : 37), mode);
            else if (!g.attack && g.py >= 130) {
              if (mode === "keyboard") pulse(t, "X");
              else tap(t, e.x, 110);
            }
          } else exit(t, g.arena ? -1 : route[ri + 1], mode);
        }
        t.step(1000 / fps);
      }
      assert.equal(
        g.phase,
        "opening",
        JSON.stringify({
          fps,
          mode,
          care,
          room: g.room,
          hp: g.hp,
          x: g.px,
          remaining: g.remaining,
        }),
      );
      assert.equal(g.results[0], "COURS ASSURE");
      assert.equal(g.session.events.filter((e) => e.kind === "fall").length, 0);
      assert.equal(g.navigationCare.used, care);
      const nav = g.journalSnapshot().navigation;
      assert.equal(nav.profile, spec.id);
      assert.equal(nav.revision, "H1");
      assert.deepEqual(
        [...nav.visits.map((v) => v.zone)],
        route.map((id) => spec.rooms[id].navigation.id),
      );
      const clock = g.remaining;
      t.advance(4.4, fps);
      assert.equal(g.phase, "course");
      assert.equal(g.remaining, clock);
      g.freshKey = true;
      t.step(1000 / fps);
      t.advance(3.2, fps);
      assert.equal(g.phase, "free");
      assert(!g.navigationProfile);
      assert.equal(
        g.journalSnapshot().navigation.profile,
        spec.id,
        "completed profile remains identifiable",
      );
      reports.routes.push({
        fps,
        mode,
        care,
        hp: nav.hp,
        visits: nav.visits.length,
        remaining: clock,
      });
    }
  }
fs.writeFileSync(
  "work/hanouna-h1-results.json",
  JSON.stringify(reports, null, 2) + "\n",
);
console.log(
  `PASS H1: graph isolated, 3 original encounters, female boss, no holes; ${reports.passages} real-input connections, ${reports.care.length} full/unique/frozen care runs, ${reports.routes.length} complete combat routes and ellipses.`,
);
