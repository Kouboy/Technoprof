// Controlled continuous journey: choose real inputs, never change world state
// after starting. A known route and reactive pilot are not human discovery.
const fs = require("node:fs");
const { createGame } = require("./test-harness.cjs");
const { driveInput } = require("./fair-drive-bot-060.cjs");
exports.runDay = ({
  seed = 4301,
  fps = 60,
  care = true,
  mode = "keyboard",
  bruel = "discovery",
  inshape = "first",
} = {}) => {
  const t = createGame({ policy: "three-required" }),
    g = t.g,
    api = t.api;
  g.workshop = true;
  g.seed = seed;
  g.validatedDay = true;
  g.controls = new api.ActionInput();
  g.keys = g.controls.keys;
  g.physicalKeys = Object.fromEntries(
    Object.values(api.BINDINGS)
      .flat()
      .map((k) => [k, { isDown: false, just: false }]),
  );
  g.direct = new api.DirectInput(g);
  g.startDay();
  g.workshop = false;
  g.direct.tick(0);
  const aliases = {
    LEFT: "Q",
    RIGHT: "D",
    UP: "Z",
    DOWN: "S",
    X: "F",
    SPACE: "SPACE",
    ENTER: "ENTER",
  };
  const hold = (a) => (g.physicalKeys[aliases[a]].isDown = true);
  const pulse = (a) => {
    g.physicalKeys[aliases[a]].just = true;
    g.handleKeyDown({ key: aliases[a], repeat: false });
  };
  const tap = (x, y) => {
    g.direct.down(1, x, y);
    g.direct.up(1, x, y);
  };
  let floorJumpTarget = null;
  const move = (x) => {
    if (floorJumpTarget !== null) x = floorJumpTarget;
    const dir = Math.sign(x - g.px);
    const gap = g
      .floorGaps()
      .find(([l, r]) => (dir > 0 ? g.px < l && x > l : g.px > r && x < r));
    if (
      gap &&
      g.py === 159 &&
      Math.abs(g.px - (dir > 0 ? gap[0] : gap[1])) <= 18
    ) {
      floorJumpTarget = dir > 0 ? gap[1] + 18 : gap[0] - 18;
      jump(dir);
      return;
    }
    if (mode === "keyboard") {
      if (Math.abs(x - g.px) > 1) hold(x > g.px ? "RIGHT" : "LEFT");
    } else if (
      g.direct.intent?.kind !== "walk" ||
      Math.abs(g.direct.intent.x - x) > 2
    )
      tap(x, 164);
  };
  const action = () => {
    if (mode === "keyboard") pulse("X");
    else tap(160, 164);
  };
  const strike = (e) => {
    if (!g.attack) {
      if (mode === "keyboard") {
        hold(e.x > g.px ? "RIGHT" : "LEFT");
        pulse("X");
      } else tap(e.x, 110);
    }
  };
  const jump = (dir = 0) => {
    if (g.py !== 159) return;
    if (mode === "keyboard") {
      pulse("SPACE");
      if (dir) hold(dir > 0 ? "RIGHT" : "LEFT");
    } else {
      g.direct.down(1, 150, 153);
      g.direct.move(1, 150 + dir * 28, 120);
      g.direct.up(1, 150 + dir * 28, 120);
    }
  };
  const passage = (target) => {
    const e = g.pointerExits().find((e) => e.target === target);
    if (!e) throw Error("Missing exit " + g.room + " -> " + target);
    const x = e.edge ? (e.key === "LEFT" ? 15 : 297) : (e.from + e.to) / 2,
      dir = x > g.px ? 1 : -1;
    const gap = g
      .floorGaps()
      .filter(([l, r]) => (dir > 0 ? g.px < r && x > r : g.px > l && x < l))
      .sort((a, b) => (dir > 0 ? a[0] - b[0] : b[1] - a[1]))[0];
    if (g.py < 159) {
      move(dir > 0 ? (gap?.[1] ?? x) + 24 : (gap?.[0] ?? x) - 24);
      return;
    }
    if (gap && Math.abs(g.px - (dir > 0 ? gap[0] : gap[1])) <= 22) {
      jump(dir);
      return;
    }
    if (mode === "keyboard") {
      if (e.edge) hold(e.key);
      else if (g.px < e.from + 2 || g.px > e.to - 2) move(x);
      else hold(e.key);
    } else if (g.direct.intent?.kind !== "exit") {
      if (e.edge && Math.abs(g.px - e.hint[0]) >= 60) move(x);
      else {
        const m = api.passageMarker(e, g.px);
        if (m) tap(m.x + m.w / 2, m.y + m.h / 2);
      }
    }
  };
  const designs = JSON.parse(
    fs.readFileSync("work/etablissements-ld-proposition.json"),
  );
  const a3 = JSON.parse(
    fs.readFileSync("work/bruel-navigation-a3-design.json"),
  );
  const profiles = [api.HANOUNA_NAV, api.BRUEL_NAV_A3, api.INSHAPE_NAV_I2];
  const routeSlugs = [
    designs.hanouna.routes.first,
    a3.routes[bruel],
    designs.inshape.routes[inshape],
  ];
  const routes = routeSlugs.map((r, n) => {
    const ids = Object.fromEntries(
      Object.values(profiles[n].rooms).map((r) => [r.navigation.id, r.id]),
    );
    return r.map((x) => ids[x]);
  });
  if (care) {
    routes[0].splice(-1, 0, 208, 206);
    const at = routes[1].indexOf(api.NAV_ID.jonction);
    routes[1].splice(at + 1, 0, api.NAV_ID.infirmerie, api.NAV_ID.jonction);
    const prep = routes[2].indexOf(307);
    routes[2].splice(prep + 1, 0, 317, 315, 317, 307);
  }
  const roomRuns = [[], [], []],
    arrivalClocks = [],
    schoolClocks = [],
    ends = [];
  const cinematics = { intro: [], ending: [], clocksStable: true };
  const chargedClocks = () =>
    JSON.stringify([
      g.remaining,
      Object.entries(g.session.missionTiming).flatMap(([mission, timing]) =>
        Object.entries(timing.clock).map(([phase, seconds]) => [
          mission,
          phase,
          seconds,
        ]),
      ),
    ]);
  let mission = -1,
    ri = 0,
    lastRoom = -1;
  for (
    let n = 0;
    n < fps * 1400 && g.phase !== "title" && g.phase !== "report";
    n++
  ) {
    for (const k of Object.values(g.physicalKeys)) k.isDown = false;
    const cinematicClock = g.cinematic ? chargedClocks() : null;
    if (g.mission !== mission) {
      mission = g.mission;
      ri = 0;
      lastRoom = -1;
    }
    if (g.phase === "intro" || g.phase === "ending") {
      const frames = cinematics[g.phase];
      if (frames.at(-1) !== g.cinematic.index) frames.push(g.cinematic.index);
      // Automatic montage: no input should be needed or injected here.
    } else if (["free", "receive", "road", "home"].includes(g.phase)) {
      const probe = {
        ...g,
        keys: Object.fromEntries(
          ["LEFT", "RIGHT", "UP", "DOWN"].map((k) => [k, { isDown: false }]),
        ),
      };
      driveInput(probe);
      if (mode === "keyboard") {
        for (const a of ["LEFT", "RIGHT", "UP", "DOWN"])
          if (probe.keys[a].isDown) hold(a);
      } else {
        if (!g.direct.gesture) g.direct.down(1, 160, 140);
        g.direct.move(
          1,
          160 + probe.botTarget * 105,
          probe.keys.DOWN.isDown ? 160 : 140,
        );
      }
    } else {
      if (g.direct.gesture)
        g.direct.up(1, g.direct.gesture.nx, g.direct.gesture.ny);
      if (g.phase === "arrival") arrivalClocks[mission] ??= g.remaining;
      if (g.phase === "school") {
        schoolClocks[mission] ??= g.remaining;
        if (g.room !== lastRoom) {
          lastRoom = g.room;
          floorJumpTarget = null;
          roomRuns[mission].push(g.room);
          if (g.room === routes[mission][ri + 1]) ri++;
        }
        if (g.roomTransition || g.schoolFade || g.playerRecovery || g.hitStop) {
        } else if (g.encounterTime || g.recoveryScene.state === "dialogue")
          action();
        else if (g.recoveryScene.active) {
        } else {
          const e = g.enemies
            .filter((e) => e.hp > 0)
            .sort((a, b) => Math.abs(a.x - g.px) - Math.abs(b.x - g.px))[0];
          if (!e) passage(g.arena ? -1 : routes[mission][ri + 1]);
          else {
            const dx = e.x - g.px,
              side = Math.sign(dx) || 1,
              dist = Math.abs(dx);
            // A direct walk persists during enemy anticipation. Keep observing
            // the floor even when no new tactical move is issued this frame.
            if (
              mode === "direct" &&
              floorJumpTarget === null &&
              g.py === 159 &&
              g.direct.intent?.kind === "walk"
            ) {
              const target = g.direct.intent.x,
                dir = Math.sign(target - g.px);
              const gap = g
                .floorGaps()
                .find(([l, r]) =>
                  dir > 0
                    ? g.px <= l && target > l && l - g.px <= 18
                    : g.px >= r && target < r && g.px - r <= 18,
                );
              if (gap) {
                floorJumpTarget = dir > 0 ? gap[1] + 18 : gap[0] - 18;
                jump(dir);
              }
            }
            if (floorJumpTarget !== null) {
              if (g.py === 159 && Math.abs(g.px - floorJumpTarget) < 4)
                floorJumpTarget = null;
              else move(floorJumpTarget);
            } else if (e.securityCycle) {
              const c = e.securityCycle;
              if (c.phase === "approach" && dist > 69) move(e.x - side * 65);
              if (c.phase === "push-windup" && dist < 64) move(e.x - side * 76);
              if (c.phase === "advance-windup" && c.time < 0.08) jump();
              if (c.phase === "opening") {
                if (dist > 57) move(e.x - side * 55);
                else if (g.py >= 130) strike(e);
              }
            } else if (e.parentCycle) {
              if (e.chargeTime > 0) {
                if (dist < 58) jump(g.floorGaps().length ? side : 0);
                if ((g.px - e.x) * (e.chargeDir ?? -1) < 0 && dist > 60)
                  move(e.x - side * 55);
              } else if (e.parentCycle.phase === "opening") {
                if (dist > 61) move(e.x - side * 57);
                else if (g.py >= 130) strike(e);
              } else if (!e.wind && dist > 72) move(e.x - side * 65);
            } else if (
              g.projectiles.some((p) => Math.abs(p.x - g.px) < 50) &&
              !g.attack
            ) {
              jump(side);
            } else if (e.wind > 0 || e.chargeTime > 0) {
              if ((e.boss && e.pattern % 2 === 0) || e.parent || !e.boss)
                jump();
              else move(e.x - side * 87);
            } else if (dist > (e.boss ? 69 : 40))
              move(e.x - side * (e.boss ? 65 : 37));
            else if (g.py >= 130) strike(e);
          }
        }
      } else if (g.phase === "opening") {
        ends[mission] ??= {
          remaining: g.remaining,
          hp: g.hp,
          vehicle: g.vehicle,
        };
      } else if (g.phase === "course" && g.age > 0.4) {
        if (mode === "keyboard") pulse("ENTER");
        else tap(160, 120);
      }
    }
    t.step(1000 / fps);
    if (cinematicClock !== null && cinematicClock !== chargedClocks())
      cinematics.clocksStable = false;
    // Preserve the first terminal attempt for diagnosis. Restarting here would
    // erase its journal and turn a failed pilot into a repeated hidden retry.
    if (g.phase === "fail") {
      ends[mission] ??= {
        remaining: g.remaining,
        hp: g.hp,
        vehicle: g.vehicle,
      };
      break;
    }
  }
  return {
    g,
    report: {
      seed,
      fps,
      care,
      mode,
      bruel,
      inshape,
      phase: g.phase,
      failureReason: g.failureReason,
      results: [...g.results],
      won: g.won,
      roomRuns,
      arrivalClocks,
      schoolClocks,
      ends,
      cinematics,
      homeReturn: {
        seconds: g.session.phaseSeconds.home ?? 0,
        arrivalSeconds: g.session.phaseSeconds.homeArrival ?? 0,
        completions: g.session.events
          .filter((e) => e.kind === "home-return-end")
          .map((e) => e.data),
      },
      collisions: g.collisions,
      falls: g.session.falls,
      journal: g.journalSnapshot(),
    },
  };
};
