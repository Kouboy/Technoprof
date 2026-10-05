const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { createGame } = require("./test-harness.cjs");
const design = JSON.parse(
  fs.readFileSync("work/etablissements-ld-proposition.json", "utf8"),
).inshape;
function setup(scenario = "inshape-navigation-i1", hp = 5) {
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
}
const names = {
  LEFT: "Q",
  RIGHT: "D",
  UP: "Z",
  DOWN: "S",
  X: "F",
  SPACE: "SPACE",
};
const release = (t) =>
  Object.values(t.g.physicalKeys).forEach((k) => (k.isDown = false));
const hold = (t, a) => (t.g.physicalKeys[names[a]].isDown = true);
const pulse = (t, a) => (t.g.physicalKeys[names[a]].just = true);
function tap(t, x, y) {
  t.g.direct.down(1, x, y);
  t.g.direct.up(1, x, y);
}
function action(t, mode) {
  if (mode === "keyboard") pulse(t, "X");
  else tap(t, 160, 164);
}
function move(t, x, mode) {
  if (mode === "keyboard") {
    if (Math.abs(x - t.g.px) > 1) hold(t, x > t.g.px ? "RIGHT" : "LEFT");
  } else if (
    t.g.direct.intent?.kind !== "walk" ||
    Math.abs(t.g.direct.intent.x - x) > 2
  )
    tap(t, x, 164);
}
function jump(t, mode, dir = 0) {
  if (t.g.py !== 159 || t.g.vy !== 0) return;
  if (mode === "keyboard") {
    pulse(t, "SPACE");
    if (dir) hold(t, dir > 0 ? "RIGHT" : "LEFT");
  } else {
    t.g.direct.down(1, 150, 153);
    t.g.direct.move(1, 150 + dir * 28, 120);
    t.g.direct.up(1, 150 + dir * 28, 120);
  }
}
function passage(t, target, mode) {
  const g = t.g,
    e = g.pointerExits().find((e) => e.target === target);
  assert(e, "missing passage " + g.room + " -> " + target);
  const dest = e.edge ? (e.key === "LEFT" ? 15 : 297) : (e.from + e.to) / 2;
  const crossing = g
    .floorGaps()
    .find(([l, r]) => (g.px < l && dest > r) || (g.px > r && dest < l));
  if (crossing) {
    const [l, r] = crossing,
      dir = dest > g.px ? 1 : -1;
    if (g.py === 159 && Math.abs(g.px - (dir > 0 ? l : r)) <= 22) {
      jump(t, mode, dir);
      return;
    }
    if (g.py < 159) {
      move(t, dir > 0 ? r + 24 : l - 24, mode);
      return;
    }
  }
  if (mode === "keyboard") {
    if (e.edge) hold(t, e.key);
    else if (g.px < e.from + 2) move(t, e.from + 3, mode);
    else if (g.px > e.to - 2) move(t, e.to - 3, mode);
    else hold(t, e.key);
  } else if (g.direct.intent?.kind !== "exit") {
    if (e.edge && Math.abs(g.px - e.hint[0]) >= 60) move(t, dest, mode);
    else {
      const m = t.api.passageMarker(e, g.px);
      if (m) tap(t, m.x + m.w / 2, m.y + m.h / 2);
    }
  }
}
function advanceTo(t, target, mode, fps, seconds = 8) {
  const from = t.g.room;
  for (let n = 0; n < fps * seconds && t.g.room === from; n++) {
    release(t);
    passage(t, target, mode);
    t.step(1000 / fps);
  }
  release(t);
  assert.equal(t.g.room, target, `${from}->${target} ${mode} ${fps}`);
}
const base = setup(),
  spec = base.g.navigationSpec(),
  ids = base.api.INSHAPE_ID;
assert(spec && ids, "I1 integration missing from harness");
assert.equal(spec.id, "inshape-navigation-atelier-i1");
assert.equal(base.g.mission, 2);
assert(base.g.pressureCombat());
assert(base.g.recoveryProfile());
assert.equal(base.g.enemyTuning().student.wind, 0.34);
assert.equal(base.g.enemyTuning().guard.wind, 0.38);
assert.equal(base.g.enemyTuning().security.wind, 0.45);
assert.equal(base.g.enemyTuning().security.turn, 0.85);
const slug = Object.fromEntries(
  Object.values(spec.rooms).map((r) => [r.navigation.id, r.id]),
);
assert.equal(Object.keys(spec.rooms).length, 17);
for (const z of design.zones) {
  const r = spec.rooms[slug[z.id]];
  assert(r, z.id);
  assert.equal(r.navigation.floor, z.floor);
  const expected = design.connections
    .filter(([a, b]) => a === z.id || b === z.id)
    .map(([a, b]) => slug[a === z.id ? b : a])
    .sort();
  if (r.boss)
    assert.equal(r.exits.length, 0, "boss has no return before class");
  else
    assert.deepEqual([...r.exits.map((e) => e.target)].sort(), expected, z.id);
  if (design.encounterSources[z.id] !== undefined) {
    const source = base.audit.missionEnemies(
        2,
        design.encounterSources[z.id],
      )[0],
      enemy = base.audit.missionEnemies(2, r.id, spec)[0];
    assert.equal(enemy.hp, source.hp, z.id + " source hp");
    assert.equal(enemy.role, source.role, z.id + " role");
    assert.deepEqual(
      r.encounter,
      base.audit.MISSIONS[2].rooms[design.encounterSources[z.id]].encounter,
    );
  }
}
assert.equal(Object.values(spec.rooms).filter((r) => r.role).length, 10);
const routeCounts = { first: 8, workshops: 8, known: 7, service: 7 };
for (const [name, count] of Object.entries(routeCounts))
  assert.equal(
    design.routes[name].filter((x) => spec.rooms[slug[x]].role).length,
    count,
  );
const sharedEncounters = design.routes.first.filter(
  (zone) =>
    spec.rooms[slug[zone]].role &&
    Object.keys(routeCounts).every((name) =>
      design.routes[name].includes(zone),
    ),
);
assert.deepEqual(sharedEncounters, [
  "i-parvis",
  "i-jonction",
  "i-liaison",
  "i-preparation",
  "i-sas",
  "i-seuil",
]);
const hazard = spec.rooms[ids.palierService];
assert.equal(hazard.navigation.floor, 1);
assert(!hazard.encounter && !hazard.role && !hazard.care);
assert.deepEqual(
  [
    ...Object.values(spec.rooms)
      .filter((r) => r.gaps.length)
      .map((r) => r.navigation.id),
  ],
  design.quietHazards,
);
for (const [l, r] of hazard.gaps) {
  assert(r - l <= 34 && l >= 90 && r <= 208);
  for (const room of Object.values(spec.rooms))
    for (const e of room.exits)
      if (e.target === hazard.id)
        assert(e.spawn < l - 20 || e.spawn > r + 20, "safe service return");
  for (const e of hazard.exits)
    assert(
      e.edge || e.to < l - 25 || e.from > r + 25,
      "gap cannot cover stair access",
    );
}
const normal = createGame();
normal.g.loadScenario("inshape-navigation-i1");
assert(!normal.g.navigationProfile, "workshop gate");
assert.equal(normal.audit.DAY_LOAD[2].encounters, 12);
const report = { connections: 0, care: [], gaps: [], routes: [] };
for (const fps of [30, 60, 120])
  for (const mode of ["keyboard", "direct"]) {
    for (const r of Object.values(spec.rooms).filter((r) => !r.boss))
      for (const e of r.exits) {
        const t = setup(),
          g = t.g;
        for (const id of Object.keys(spec.rooms)) {
          g.roomEnemies.set(Number(id), []);
          g.cleared.add(Number(id));
        }
        g.navigationCare.used = true;
        g.enterRoom(r.id, 150);
        // Palier's initial fixture stands on a safe bank rather than in the hole.
        if (r.id === hazard.id)
          g.enterRoom(r.id, e.target === ids.service ? 210 : 100);
        t.advance(0.4, fps);
        advanceTo(t, e.target, mode, fps);
        t.advance(0.4, fps);
        assert.equal(g.room, e.target, "held input cannot bounce back");
        assert.equal(g.hp, 5, "connection can cross safely");
        if (mode === "direct") assert(!g.direct.intent);
        report.connections++;
      }
    for (const hp of [1, 3, 5]) {
      const t = setup("inshape-navigation-i1-care", hp),
        g = t.g;
      t.advance(0.4, fps);
      assert.equal(g.room, ids.jonction);
      advanceTo(t, ids.infirmerie, mode, fps);
      assert(g.recoveryScene.active && g.navigationCare.used);
      const clock = g.remaining;
      t.advance(0.4, fps);
      release(t);
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
        let n = 0;
        n < fps * 12 && (g.room === ids.infirmerie || g.roomTransition);
        n++
      ) {
        release(t);
        if (g.recoveryScene.state === "dialogue") action(t, mode);
        t.step(1000 / fps);
      }
      assert.equal(g.room, ids.jonction);
      assert.equal(g.hp, 5);
      assert(!g.recoveryScene.active);
      assert.equal(
        g.session.events.find((e) => e.kind === "care-exit").data.remaining,
        clock,
      );
      assert(clock - g.remaining <= 1 / fps + 1e-8);
      assert.equal(
        g.session.events.filter((e) => e.kind === "care-complete").length,
        1,
      );
      advanceTo(t, ids.infirmerie, mode, fps);
      t.advance(0.4, fps);
      assert(!g.recoveryScene.active);
      assert.equal(g.hp, 5);
      assert(g.remaining < clock, "free navigation resumes the mission clock");
      assert.equal(
        g.session.events.filter((e) => e.kind === "care-start").length,
        1,
      );
      report.care.push({
        fps,
        mode,
        startHp: hp,
        full: true,
        unique: true,
        frozen: true,
      });
    }
    for (const dir of [-1, 1])
      for (const [l, r] of hazard.gaps) {
        const t = setup("inshape-navigation-i1-service"),
          g = t.g;
        g.enterRoom(hazard.id, dir > 0 ? l - 12 : r + 12);
        t.advance(0.4, fps);
        jump(t, mode, dir);
        for (let n = 0; n < fps * 0.9; n++) {
          if (mode === "keyboard") hold(t, dir > 0 ? "RIGHT" : "LEFT");
          t.step(1000 / fps);
          assert.equal(g.falling, 0);
        }
        release(t);
        assert.equal(g.hp, 5);
        assert.equal(g.py, 159);
        assert(dir > 0 ? g.px > r : g.px < l);
        assert.equal(g.room, hazard.id);
        const f = setup("inshape-navigation-i1-service"),
          s = f.g;
        s.enterRoom(hazard.id, dir > 0 ? l - 25 : r + 25);
        f.advance(0.4, fps);
        for (let n = 0; n < fps * 2 && !s.falling; n++) {
          release(f);
          move(f, dir > 0 ? r + 30 : l - 30, mode);
          f.step(1000 / fps);
        }
        assert(s.falling > 0, "walking into gap starts fall");
        release(f);
        s.direct.cancel();
        const fallingY = s.py;
        f.step(1000 / fps);
        assert(s.py > fallingY, "physical descent");
        assert.equal(s.room, hazard.id);
        s.setPaused(true);
        const paused = [s.py, s.hp, s.falling, s.remaining];
        f.advance(1, fps);
        assert.deepEqual([s.py, s.hp, s.falling, s.remaining], paused);
        s.setPaused(false);
        f.advance(2, fps);
        assert.equal(s.hp, 4, "single fall damage");
        assert.equal(s.falling, 0);
        assert.equal(s.py, 159);
        assert(dir > 0 ? s.px < l : s.px > r, "same safe bank recovery");
        assert.equal(s.room, hazard.id);
        assert.equal(
          s.session.events.filter((e) => e.kind === "fall").length,
          1,
        );
        report.gaps.push({
          fps,
          mode,
          dir,
          jump: true,
          fall: true,
          recovery: true,
        });
      }
    for (const routeName of Object.keys(routeCounts)) {
      const t = setup(),
        g = t.g,
        route = design.routes[routeName].map((x) => slug[x]);
      let ri = 0,
        jumpGoal = null;
      for (let n = 0; n < fps * 200 && g.phase === "school"; n++) {
        release(t);
        if (g.roomTransition || g.schoolFade || g.playerRecovery || g.hitStop) {
        } else if (g.encounterTime) action(t, mode);
        else {
          if (g.room === route[ri + 1]) {
            ri++;
            jumpGoal = null;
          }
          const e = g.enemies.find((e) => e.hp > 0);
          if (e) {
            const dx = e.x - g.px,
              side = Math.sign(dx) || 1,
              dist = Math.abs(dx);
            if (e.role === "security") {
              const behind = (g.px - e.x) * (e.facing ?? -1) < 0;
              if (jumpGoal !== null) {
                if (Math.abs(jumpGoal - g.px) > 3) move(t, jumpGoal, mode);
                else jumpGoal = null;
              }
              if (g.py === 159 && g.vy === 0 && !g.attack) {
                if (
                  dist <= 55 &&
                  (e.recovery > 0.16 || (behind && e.turnTime > 0.16))
                ) {
                  if (mode === "keyboard") {
                    hold(t, side > 0 ? "RIGHT" : "LEFT");
                    pulse(t, "X");
                  } else tap(t, e.x, 110);
                } else if (e.wind > 0 && dist < 75) {
                  jumpGoal = e.x + (g.px < e.x ? 48 : -48);
                  jump(t, mode, side);
                } else if (dist > 53 && jumpGoal === null)
                  move(t, e.x - side * 48, mode);
              }
            } else if (dist > 40) {
              move(t, e.x - side * 37, mode);
              if (
                e.wind > 0 ||
                g.projectiles.some((p) => Math.abs(p.x - g.px) < 45)
              )
                jump(t, mode, side);
            } else if (!g.attack && g.py >= 135) {
              if (mode === "keyboard") {
                hold(t, side > 0 ? "RIGHT" : "LEFT");
                pulse(t, "X");
              } else tap(t, e.x, 110);
            } else if (e.wind > 0 && !g.attack) jump(t, mode);
          } else passage(t, g.arena ? -1 : route[ri + 1], mode);
        }
        t.step(1000 / fps);
      }
      assert.equal(
        g.phase,
        "opening",
        JSON.stringify({
          routeName,
          fps,
          mode,
          room: g.room,
          hp: g.hp,
          x: g.px,
          boss: g.enemies[0],
          remaining: g.remaining,
        }),
      );
      assert.equal(g.results[0], "COURS ASSURE");
      assert.equal(g.session.events.filter((e) => e.kind === "fall").length, 0);
      const nav = g.journalSnapshot().navigation;
      assert.equal(nav.revision, "I1");
      assert.equal(nav.profile, spec.id);
      assert.deepEqual(
        [...nav.visits.map((v) => v.zone)],
        design.routes[routeName],
      );
      assert.equal(
        g.session.events.filter((e) => e.kind === "contact" && e.data.hp === 0)
          .length,
        routeCounts[routeName],
        "correct live encounter count",
      );
      const clock = g.remaining;
      t.advance(4.4, fps);
      assert.equal(g.phase, "course");
      assert.equal(g.remaining, clock);
      g.freshKey = true;
      t.step(1000 / fps);
      t.advance(3.2, fps);
      assert.equal(g.phase, "report");
      assert(!g.navigationProfile);
      assert.equal(g.journalSnapshot().navigation.profile, spec.id);
      report.routes.push({
        route: routeName,
        fps,
        mode,
        hp: nav.hp,
        visits: nav.visits.length,
        encounters: routeCounts[routeName],
        remaining: clock,
      });
    }
  }
fs.writeFileSync(
  "work/inshape-i1-results.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `PASS I1: approved reversible graph, 10 source encounters / 7-8 per route; ${report.connections} real-input links, ${report.care.length} unique full/frozen care runs, ${report.gaps.length} two-way jump/fall runs, ${report.routes.length} complete live combat routes and ellipses.`,
);
