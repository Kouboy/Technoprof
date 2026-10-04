const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { createGame } = require("./test-harness.cjs");
const a2 = process.argv.includes("--a2");
const a3 = process.argv.includes("--a3");
const revision = a3 ? "A3" : a2 ? "A2" : "A1";
const careHome = (t) => (a3 ? t.api.NAV_ID.jonction : t.api.NAV_ID.hall);
const scenarioName = (name) =>
  a3 || a2
    ? name.replace(
        "bruel-navigation",
        "bruel-navigation-" + revision.toLowerCase(),
      )
    : name;
const setup = (scenario = "bruel-navigation", hp = 5, gain = 1) => {
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
  g.loadScenario(scenarioName(scenario));
  g.direct.tick(0);
  return t;
};
const keys = {
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
const hold = (t, a) => (t.g.physicalKeys[keys[a]].isDown = true);
const pulse = (t, a) => (t.g.physicalKeys[keys[a]].just = true);
const tap = (t, x, y) => {
  t.g.direct.down(1, x, y);
  t.g.direct.up(1, x, y);
};
function walk(t, x, mode) {
  if (mode === "keyboard") {
    if (Math.abs(x - t.g.px) > 1) hold(t, x > t.g.px ? "RIGHT" : "LEFT");
  } else if (t.g.direct.intent?.kind !== "walk") tap(t, x, 164);
}
function exit(t, target, mode) {
  const g = t.g,
    e = g.pointerExits().find((e) => e.target === target);
  assert(e, `missing ${g.room}->${target}`);
  if (mode === "keyboard") {
    if (e.edge) hold(t, e.key);
    else if (g.px < e.from + 2) walk(t, e.from + 3, mode);
    else if (g.px > e.to - 2) walk(t, e.to - 3, mode);
    else hold(t, e.key);
  } else if (g.direct.intent?.kind !== "exit") {
    if (e.edge && Math.abs(g.px - e.hint[0]) >= 60)
      walk(t, e.key === "LEFT" ? 15 : 297, mode);
    else {
      const m = t.api.passageMarker(e, g.px);
      if (m) tap(t, m.x + m.w / 2, m.y + m.h / 2);
    }
  }
}
const d = JSON.parse(
  fs.readFileSync(
    `work/bruel-navigation${revision !== "A1" ? "-" + revision.toLowerCase() : ""}-design.json`,
    "utf8",
  ),
);
const t0 = setup(),
  spec = t0.g.missionSpec(),
  bySlug = Object.fromEntries(
    Object.values(spec.rooms).map((r) => [r.navigation.id, r.id]),
  );
for (const z of d.zones) {
  const r = spec.rooms[bySlug[z.id]];
  assert(r);
  assert.equal(r.navigation.floor, z.floor);
  assert.equal(r.exits.length, z.exits.length);
  for (const e of z.exits) {
    const actual = r.exits.find((a) => a.target === bySlug[e.to]);
    assert(actual);
    assert.equal(actual.spawn, e.spawn);
    assert.equal(actual.hint[0], e.x);
    assert.equal(actual.key, e.kind);
  }
  if (z.encounterSource !== undefined) {
    const original = t0.audit.MISSIONS[1].rooms[z.encounterSource];
    assert.equal(r.role, original.role);
    assert.equal(r.hp, original.hp);
    assert.deepEqual(r.encounter, original.encounter);
  }
}
assert.throws(() => t0.g.enterRoom(999, 50), /Zone inconnue/);
const ordinary = createGame();
ordinary.g.loadScenario(scenarioName("bruel-navigation"));
assert(!ordinary.g.navigationProfile, "profile must require workshop");
for (const name of ["mission", "bruel-cour", "bruel-drive", "road"]) {
  t0.g.loadScenario(name);
  assert(!t0.g.navigationProfile);
  assert(!t0.g.roomSpec()?.navigation);
}

// Quiet branches isolate traversal rules from combat. Entry presets are declared;
// transitions themselves must use the same physical/pointer inputs as the player.
let branchChecks = 0;
if (a2 || a3)
  for (const fps of [30, 60, 120])
    for (const mode of ["keyboard", "direct"]) {
      for (const source of [
        "hall",
        "principal",
        "palier",
        "annexe",
        "infirmerie",
      ]) {
        const id = t0.api.NAV_ID[source];
        for (const edge of spec.rooms[id].exits) {
          const t = setup("bruel-navigation-care"),
            g = t.g;
          g.enterRoom(id, 150);
          t.advance(0.4, fps);
          for (let i = 0; i < fps * 6 && g.room === id; i++) {
            release(t);
            exit(t, edge.target, mode);
            t.step(1000 / fps);
          }
          assert.equal(
            g.room,
            edge.target,
            `branch ${source}->${edge.target} ${mode} ${fps}`,
          );
          // Keep the source intention held across the forced fade.
          t.advance(0.4, fps);
          assert.equal(
            g.room,
            edge.target,
            "held input cannot immediately bounce",
          );
          assert.equal(g.navigationMetrics.choices.length, 1);
          if (mode === "direct")
            assert(!g.direct.intent, "pointer transition consumes its target");
          branchChecks++;
        }
      }
      if (mode === "keyboard") {
        const t = setup("bruel-navigation-care"),
          g = t.g;
        g.enterRoom(t.api.NAV_ID.annexe, 15);
        t.advance(0.4, fps);
        hold(t, "UP");
        hold(t, "LEFT");
        for (let i = 0; i < fps * 3 && g.room !== t.api.NAV_ID.palier; i++)
          t.step(1000 / fps);
        assert.equal(g.room, t.api.NAV_ID.palier);
        t.advance(0.4, fps);
        release(t);
        hold(t, "UP");
        t.advance(0.8, fps);
        assert.equal(
          g.room,
          t.api.NAV_ID.palier,
          "UP carried onto the return door needs release",
        );
        release(t);
        t.step(1000 / fps);
        hold(t, "UP");
        t.advance(0.4, fps);
        assert.equal(
          g.room,
          t.api.NAV_ID.annexe,
          "fresh UP is accepted after release",
        );
        branchChecks++;
      }
    }

const careReports = [];
for (const fps of [30, 60, 120])
  for (const mode of ["keyboard", "direct"])
    for (const gain of [1, 2])
      for (const hp of [1, 2, 3, 4, 5]) {
        const t = setup("bruel-navigation-care", hp, gain),
          g = t.g;
        // Use actual passage input from hall, then actual cabinet input from its entry.
        for (
          let i = 0;
          i < fps * 8 && g.room !== t.api.NAV_ID.infirmerie;
          i++
        ) {
          release(t);
          exit(t, t.api.NAV_ID.infirmerie, mode);
          t.step(1000 / fps);
        }
        assert.equal(g.room, t.api.NAV_ID.infirmerie);
        t.advance(0.4, fps);
        release(t);
        for (let i = 0; i < fps * 6 && !g.navigationCare.used; i++) {
          release(t);
          if (g.navigationCare.active) {
            hold(t, "RIGHT");
            pulse(t, "SPACE");
            pulse(t, "X");
          } // ignored while administering care
          else if (mode === "direct") {
            if (g.direct.intent?.kind !== "care") tap(t, 180, 109);
          } else if (Math.abs(g.px - 180) > 20) walk(t, 180, mode);
          else pulse(t, "X");
          t.step(1000 / fps);
          if (hp === 5 && g.messageTime > 0) break;
        }
        assert.equal(g.hp, Math.min(5, hp + gain));
        assert.equal(g.navigationCare.used, hp < 5);
        assert.equal(g.attack, 0, "a care action cannot strike");
        assert.equal(g.py, 159, "locked care cannot jump");
        const starts = g.session.events.filter((e) => e.kind === "care-start"),
          completes = g.session.events.filter(
            (e) => e.kind === "care-complete",
          );
        if (hp < 5) {
          assert.equal(completes.length, 1);
          assert.equal(starts.length, 1);
          assert(
            Math.abs(
              starts[0].data.remaining - completes[0].data.remaining - 1.2,
            ) < 0.021,
          );
        }
        // No new stock on leaving and returning through real exits.
        release(t);
        for (let i = 0; i < fps * 5 && g.room !== careHome(t); i++) {
          release(t);
          exit(t, careHome(t), mode);
          t.step(1000 / fps);
        }
        t.advance(0.4, fps);
        for (
          let i = 0;
          i < fps * 5 && g.room !== t.api.NAV_ID.infirmerie;
          i++
        ) {
          release(t);
          exit(t, t.api.NAV_ID.infirmerie, mode);
          t.step(1000 / fps);
        }
        t.advance(0.4, fps);
        assert.equal(g.navigationCare.used, hp < 5);
        assert.equal(g.hp, Math.min(5, hp + gain));
        careReports.push({
          fps,
          mode,
          gain,
          startHp: hp,
          endHp: g.hp,
          careUses: completes.length,
          remaining: +g.remaining.toFixed(3),
        });
      }
for (const fps of [30, 60, 120]) {
  const t = setup("bruel-navigation-care", 2, 2),
    g = t.g;
  g.enterRoom(t.api.NAV_ID.infirmerie, 180);
  t.advance(0.4, fps);
  pulse(t, "X");
  t.step(1000 / fps);
  assert(g.navigationCare.active);
  const state = [g.hp, g.navigationCare.elapsed, g.remaining, g.px];
  g.setPaused(true);
  t.advance(5, fps);
  assert.deepEqual([g.hp, g.navigationCare.elapsed, g.remaining, g.px], state);
  g.setPaused(false);
  g.pauseForFocusLoss();
  t.advance(2, fps);
  assert.deepEqual([g.hp, g.navigationCare.elapsed, g.remaining, g.px], state);
  g.setPaused(false);
  t.advance(1.3, fps);
  assert.equal(g.hp, 4);
  assert.equal(
    g.session.events.filter((e) => e.kind === "care-complete").length,
    1,
  );
  const late = setup("bruel-navigation-care", 2, 2);
  late.g.enterRoom(late.api.NAV_ID.infirmerie, 180);
  late.advance(0.4, fps);
  late.g.remaining = 0.5;
  pulse(late, "X");
  late.step(1000 / fps);
  late.advance(0.7, fps);
  assert.equal(late.g.phase, "fail");
  assert.equal(late.g.hp, 2);
  assert(!late.g.navigationCare.used);
}

const routesReports = [];
const runs = ["discovery", "known", "correctedWrongTurn"].map((path) => ({
  path,
  hp: 5,
  gain: 1,
}));
if (a2 || a3) runs.push({ path: "midcourseChoice", hp: 5, gain: 1 });
runs.push({ path: "known", hp: 5, gain: 1, road: true });
for (const path of ["discoveryWithCare", "knownWithCare"])
  for (const gain of [1, 2]) runs.push({ path, hp: 2, gain });
for (const fps of [30, 60, 120])
  for (const mode of ["keyboard", "direct"])
    for (const run of runs) {
      const { path, hp, gain } = run,
        t = setup(
          run.road ? "bruel-navigation-road" : "bruel-navigation",
          hp,
          gain,
        ),
        g = t.g,
        route = d.routes[path].map((id) => bySlug[id]);
      let ri = 0;
      let roadSpent = 0;
      if (run.road) {
        assert.equal(g.phase, "free");
        assert(!g.notified);
        let arrivalClock;
        const { driveInput } = require("./fair-drive-bot-060.cjs");
        for (
          let i = 0;
          i < fps * 150 && g.phase !== "school" && g.phase !== "fail";
          i++
        ) {
          release(t);
          if (["free", "receive", "road"].includes(g.phase)) {
            const probe = {
              ...g,
              keys: Object.fromEntries(
                ["LEFT", "RIGHT", "UP", "DOWN"].map((k) => [
                  k,
                  { isDown: false },
                ]),
              ),
            };
            driveInput(probe, 1);
            g.botTarget = probe.botTarget;
            if (mode === "keyboard") {
              for (const a of ["LEFT", "RIGHT", "UP", "DOWN"])
                if (probe.keys[a].isDown) hold(t, a);
            } else {
              if (!g.direct.gesture) g.direct.down(1, 160, 140);
              g.direct.move(
                1,
                160 + probe.botTarget * 105,
                probe.keys.DOWN.isDown ? 160 : 140,
              );
            }
          }
          t.step(1000 / fps);
          if (g.phase === "arrival" && arrivalClock === undefined)
            arrivalClock = g.remaining;
        }
        assert.equal(
          g.phase,
          "school",
          "actual road must reach workshop school",
        );
        assert.equal(g.room, t.api.NAV_ID.cour);
        assert.equal(g.remaining, arrivalClock, "cinema is free");
        roadSpent = 225 - g.remaining;
        assert(roadSpent > 45 && roadSpent < 85);
        assert(g.notified);
        assert(g.navigationProfile);
      }
      const move = (x) => walk(t, x, mode),
        strike = () => {
          if (g.attack || g.hitStop || g.playerRecovery) return;
          if (mode === "keyboard") pulse(t, "X");
          else tap(t, g.enemies[0].x, 110);
        };
      for (let i = 0; i < fps * 220 && g.phase === "school"; i++) {
        release(t);
        if (g.roomTransition || g.schoolFade || g.navigationCare.active) {
        } else if (g.encounterTime) {
          if (mode === "keyboard") pulse(t, "X");
          else tap(t, 160, 164);
        } else if (g.playerRecovery || g.hitStop) {
        } else {
          if (g.room === route[ri + 1]) ri++;
          const e = g.enemies.find((e) => e.hp > 0);
          if (e) {
            const dx = e.x - g.px,
              side = Math.sign(dx) || 1;
            if (a3 && e.role !== "influential" && e.wind > 0) {
              // Read the actual preparation cue and dodge, rather than race the attack.
              if (g.py === 159) {
                if (mode === "keyboard") pulse(t, "SPACE");
                else {
                  g.direct.down(1, 150, 153);
                  g.direct.move(1, 150, 124);
                  g.direct.up(1, 150, 124);
                }
              }
            } else if (e.role === "influential") {
              if ((e.chargeTime ?? 0) > 0) {
                if (Math.abs(dx) < 58 && g.py === 159) {
                  if (mode === "keyboard") pulse(t, "SPACE");
                  else {
                    g.direct.down(1, 150, 153);
                    g.direct.move(1, 150, 124);
                    g.direct.up(1, 150, 124);
                  }
                }
                if ((g.px - e.x) * (e.chargeDir ?? -1) < 0 && Math.abs(dx) > 60)
                  move(e.x - side * 55);
              } else if (e.recovery > 0.2 || e.stun > 0) {
                if (Math.abs(dx) > 61) move(e.x - side * 57);
                else if (g.py >= 130) strike();
              } else if (!e.wind && Math.abs(dx) > 72) move(e.x - side * 65);
            } else if (Math.abs(dx) > 45) move(e.x - side * 40);
            else strike();
          } else if (
            g.room === t.api.NAV_ID.infirmerie &&
            !g.navigationCare.used
          ) {
            if (mode === "direct") {
              if (g.direct.intent?.kind !== "care") tap(t, 180, 109);
            } else if (Math.abs(g.px - 180) > 20) move(180);
            else pulse(t, "X");
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
          path,
          room: g.room,
          hp: g.hp,
          remaining: g.remaining,
          x: g.px,
        }),
      );
      assert.equal(g.results[0], "COURS ASSURE");
      assert.equal(g.roomEnemies.size, new Set(route).size);
      const nav = g.journalSnapshot().navigation;
      assert.equal(nav.visits.length, route.length);
      assert.equal(
        nav.annexeUses,
        path.startsWith("discovery") || path === "midcourseChoice"
          ? 0
          : path.startsWith("known")
            ? 1
            : 2,
      );
      assert.equal(nav.revision, revision);
      assert.equal(nav.midcourseUses, path === "midcourseChoice" ? 1 : 0);
      if (path.endsWith("WithCare")) {
        assert(nav.careUsed);
        assert.equal(
          g.session.events.filter((e) => e.kind === "care-complete").length,
          1,
        );
        if (!a3)
          assert.equal(
            nav.hp,
            hp + gain - 1,
            "same bot loses one HP over the full encounter sequence",
          );
        else assert(nav.hp > 0, "responsive dodge bot must survive with care");
      }
      assert.equal(
        g.session.events.filter((e) => e.kind === "navigation-choice").length,
        route.length - 1,
      );
      const budget = g.remaining;
      t.advance(4.4, fps);
      assert.equal(g.phase, "course");
      assert.equal(g.remaining, budget);
      g.freshKey = true;
      t.step(1000 / fps);
      t.advance(3.2, fps);
      assert.equal(g.phase, "free");
      assert(!g.navigationProfile);
      assert.equal(g.room, 20);
      const exportedAfterEllipse = g.journalSnapshot().navigation;
      assert.equal(exportedAfterEllipse.hp, nav.hp);
      assert.equal(exportedAfterEllipse.remaining, budget);
      assert.equal(exportedAfterEllipse.careUsed, nav.careUsed);
      routesReports.push({
        fps,
        mode,
        path,
        road: !!run.road,
        roadSpent: +roadSpent.toFixed(3),
        startHp: hp,
        gain: nav.careUsed ? gain : 0,
        hp: nav.hp,
        remaining: +budget.toFixed(3),
        visits: nav.visits.map((v) => v.zone),
        returns: nav.returns,
        ...(a3
          ? {
              enemyReleases: g.session.events.filter(
                (e) => e.kind === "enemy-attack" && e.data.stage === "release",
              ).length,
            }
          : {}),
      });
    }
fs.writeFileSync(
  `work/navigation${revision !== "A1" ? "-" + revision.toLowerCase() : ""}-atelier-results.json`,
  JSON.stringify(
    {
      method:
        "Isolated declared presets; all traversal and care through physical aliases or DirectInput. Only edge-case tests set timer/position explicitly. Not human orientation or phone validation.",
      care: careReports,
      branchChecks,
      routes: routesReports,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `PASS atelier ${revision}: graph matches runtime; profile isolated; 60 care comparisons through both inputs at 30/60/120 fps; capped gain, one-use reentry, pause/focus, late precedence; ${routesReports.length} full routes including 24 +1/+2 care runs and 6 continuous road-to-class trials with real fights and course-to-cruising ellipse.`,
);
