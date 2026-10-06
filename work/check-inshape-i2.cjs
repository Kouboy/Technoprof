const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
const plain = (value) => JSON.parse(JSON.stringify(value));
function setup(scenario, fps = 60, dialogue = false) {
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
  g.loadScenario(scenario);
  t.advance(0.4, fps);
  if (!dialogue) dismiss(t, fps);
  return t;
}
function release(t) {
  for (const k of Object.values(t.g.physicalKeys)) k.isDown = false;
}
function pulse(t, key) {
  t.g.physicalKeys[key].just = true;
}
function dismiss(t, fps) {
  for (let n = 0; t.g.encounterTime && n < 20; n++) {
    pulse(t, "F");
    t.step(1000 / fps);
  }
  assert.equal(
    t.g.encounterTime,
    0,
    "Action reveals and advances all introduction pages",
  );
}
function until(t, fps, predicate, seconds = 5, pilot) {
  for (let n = 0; !predicate() && n < fps * seconds; n++) {
    if (pilot) {
      release(t);
      pilot();
    }
    t.step(1000 / fps);
  }
  assert(predicate(), "condition not reached: " + predicate.toString());
  release(t);
}
function paused(t, fps) {
  const before = JSON.stringify([
    t.g.remaining,
    t.g.px,
    t.g.py,
    t.g.enemies,
    t.g.projectiles,
  ]);
  t.g.setPaused(true);
  t.advance(0.8, fps);
  assert.equal(
    JSON.stringify([
      t.g.remaining,
      t.g.px,
      t.g.py,
      t.g.enemies,
      t.g.projectiles,
    ]),
    before,
    "pause freezes all actors, attacks and clock",
  );
  t.g.setPaused(false);
}
function strike(t, fps) {
  pulse(t, "F");
  t.step(1000 / fps);
  until(t, fps, () => !t.g.attack && !t.g.hitStop, 1.5);
}
function poseNear(t, e, side = -1, distance = 42) {
  t.g.px = e.x + side * distance;
  t.g.face = -side;
  t.g.py = 159;
  t.g.vy = 0;
  t.g.lastGroundX = t.g.px;
}
const baseline = setup("inshape-navigation-i1");
const original = JSON.stringify(baseline.api.INSHAPE_NAV);
const i1 = baseline.api.INSHAPE_NAV,
  i2 = baseline.api.INSHAPE_NAV_I2;
assert.equal(i2.id, "inshape-navigation-atelier-i2");
assert.equal(i2.seconds, i1.seconds);
assert.equal(Object.keys(i2.rooms).length, 18);
for (const [id, room] of Object.entries(i1.rooms)) {
  const next = i2.rooms[id];
  assert.notEqual(next, room, "I2 room must not mutate I1");
  for (const key of [
    "exits",
    "gaps",
    "navigation",
    "care",
    "hp",
    "actor",
    "boss",
  ]) {
    if (key === "exits" && [304, 307, 315].includes(Number(id))) continue;
    assert.equal(
      JSON.stringify(next[key]),
      JSON.stringify(room[key]),
      id + "/" + key,
    );
  }
  assert.equal(next.role, room.role);
}
assert.equal(
  Object.values(i2.rooms).reduce(
    (n, r) => n + (r.formation?.length ?? (r.role ? 1 : 0)),
    0,
  ),
  10,
);
assert.equal(Object.values(i1.rooms).filter((r) => r.formation).length, 0);
const report = { duos: [], liveDuos: [], retreat: [], boss: [] };

for (const fps of [30, 60, 144]) {
  for (const room of [302, 306]) {
    const t = setup("inshape-navigation-i2-view-" + room, fps, true),
      g = t.g;
    assert(g.isInshapeI2());
    assert.equal(g.enemies.length, 2);
    assert.deepEqual(plain(g.enemies.map((e) => e.role)), [
      room === 302 ? "student" : "guard",
      "thrower",
    ]);
    assert.deepEqual(
      plain(g.encounter()),
      plain(i1.rooms[room === 302 ? room : 300].encounter),
      "one actor gives their classic introduction without explaining the duo",
    );
    const frozen = JSON.stringify([g.px, g.remaining, g.enemies]);
    g.physicalKeys.D.isDown = true;
    pulse(t, "SPACE");
    t.advance(0.7, fps);
    assert.equal(
      JSON.stringify([g.px, g.remaining, g.enemies]),
      frozen,
      "introduction freezes both opponents and inputs",
    );
    release(t);
    paused(t, fps);
    dismiss(t, fps);
    const [front, back] = g.enemies;
    for (const side of [-1, 1]) {
      const corner = setup("inshape-navigation-i2-view-" + room, fps),
        c = corner.g;
      const bounds = c.movementBounds(),
        gap = c.combatProfile().bodyGap;
      c.px = side < 0 ? bounds.min : bounds.max;
      c.enemies[0].x = side < 0 ? bounds.min + gap - 2 : bounds.max - gap + 2;
      c.enemies[1].x = c.enemies[0].x - side * 76;
      const before = c.px;
      c.separateFighters(before);
      assert.equal(
        c.px,
        before,
        "wall contact must not move player through the duo",
      );
      assert(c.enemies.every((e) => Math.abs(c.px - e.x) >= gap - 0.001));
    }
    g.inv = 999; // Isolated dispatch/spacing stress, not a survival claim.
    g.px = 95;
    t.advance(4, fps);
    assert(
      g.session.events.some(
        (e) =>
          e.kind === "enemy-attack" &&
          e.data.role === front.role &&
          e.data.stage === "release",
      ),
      "front uses own melee pattern",
    );
    assert(
      g.session.events.some((e) => e.kind === "projectile"),
      "partner independently launches projectiles",
    );
    assert(
      Math.abs(front.x - back.x) >= t.api.INSHAPE_I2_COMBAT.allyGap - 0.01,
    );
    paused(t, fps);
    for (const x of [10, 302, front.x, back.x, (front.x + back.x) / 2]) {
      g.px = x;
      g.py = 159;
      g.vy = 0;
      t.step(1000 / fps);
      assert(g.px >= g.movementBounds().min && g.px <= g.movementBounds().max);
      assert(
        g.enemies.every(
          (e) => Math.abs(g.px - e.x) >= g.combatProfile().bodyGap - 0.01,
        ),
        "ground player cannot overlap either body",
      );
    }
    g.px = (front.x + back.x) / 2;
    g.py = 110;
    g.vy = 0;
    t.step(1000 / fps);
    assert(
      g.py < g.combatProfile().jumpClear,
      "airborne traversal is not projected onto the ground",
    );
    g.py = 159;
    g.vy = 0;
    g.projectiles = [];
    for (const e of g.enemies) {
      e.wind = 0;
      e.recovery = 0;
      e.cool = 999;
      e.stun = 0;
    }
    poseNear(t, front);
    strike(t, fps);
    assert.equal(front.hp, 1);
    assert.equal(back.hp, 2, "hitting one actor does not damage partner");
    front.recovery = 0;
    front.stun = 0;
    poseNear(t, front);
    strike(t, fps);
    assert.equal(front.hp, 0);
    assert.equal(back.hp, 2);
    assert(
      !g.cleared.has(room),
      "one defeated actor cannot clear the paired encounter",
    );
    back.recovery = 0;
    back.stun = 0;
    poseNear(t, back);
    strike(t, fps);
    back.recovery = 0;
    back.stun = 0;
    poseNear(t, back);
    strike(t, fps);
    assert.equal(back.hp, 0);
    assert(g.cleared.has(room));
    g.enterRoom(room === 302 ? 301 : 305, 20);
    t.advance(0.4, fps);
    g.enterRoom(room, 20);
    t.advance(0.4, fps);
    assert.equal(g.encounterTime, 0);
    assert(
      g.enemies.every((e) => e.hp <= 0),
      "both deaths persist on revisit",
    );
    report.duos.push({
      fps,
      room,
      independent: true,
      paused: true,
      persistent: true,
    });

    const live = setup("inshape-navigation-i2-view-" + room, fps),
      l = live.g;
    for (
      let n = 0;
      n < fps * 20 && l.enemies.some((e) => e.hp > 0) && l.phase === "school";
      n++
    ) {
      release(live);
      const target = l.enemies.find((e) => e.hp > 0),
        dx = target.x - l.px,
        dir = Math.sign(dx) || 1;
      if (!l.playerRecovery && !l.hitStop) {
        if (Math.abs(dx) > 40)
          l.physicalKeys[dir > 0 ? "D" : "Q"].isDown = true;
        if (
          l.py === 159 &&
          !l.attack &&
          (target.wind > 0 ||
            l.projectiles.some((p) => Math.abs(p.x - l.px) < 50))
        ) {
          pulse(live, "SPACE");
          l.physicalKeys[dir > 0 ? "D" : "Q"].isDown = true;
        } else if (Math.abs(dx) <= 56 && l.py >= 135 && !l.attack) {
          l.physicalKeys[dir > 0 ? "D" : "Q"].isDown = true;
          pulse(live, "F");
        }
      }
      live.step(1000 / fps);
    }
    assert(
      l.enemies.every((e) => e.hp <= 0),
      "both opponents can be beaten with normal health and inputs",
    );
    assert(l.hp > 0);
    report.liveDuos.push({ fps, room, hp: l.hp, hits: l.punches });

    const pointer = setup("inshape-navigation-i2-view-" + room, fps),
      p = pointer.g;
    p.enemies[0].hp = 0;
    p.enemies[1].cool = 999;
    p.direct.tick(0);
    p.direct.down(1, p.enemies[1].x, 110);
    p.direct.up(1, p.enemies[1].x, 110);
    until(pointer, fps, () => p.enemies[1].hp === 1, 4);
    assert.equal(
      p.enemies[0].hp,
      0,
      "mouse/touch targets the surviving partner, not the first array entry",
    );
  }

  for (const side of [-1, 1]) {
    const t = setup("inshape-navigation-i2-view-308", fps),
      g = t.g,
      e = g.enemies[0];
    assert.equal(e.hp, 3);
    e.x = 160;
    e.cool = 999;
    poseNear(t, e, side);
    pulse(t, "F");
    t.step(1000 / fps);
    until(t, fps, () => e.hp === 2, 0.5);
    const hitX = e.x,
      gap = Math.abs(e.x - g.px);
    assert(e.retreatTime > 0);
    paused(t, fps);
    until(t, fps, () => e.retreatTime === 0 && e.stun === 0, 1.5);
    assert(
      (e.x - hitX) * -side > 30,
      "student visibly retreats away from the received hit",
    );
    assert(Math.abs(e.x - g.px) > gap + 30);
    assert.equal(e.hp, 2, "reposition grants no extra health");
    g.inv = 999;
    until(
      t,
      fps,
      () =>
        g.session.events.some(
          (x) => x.kind === "projectile" && x.data.kind === "book",
        ),
      3,
    );
    e.wind = 0;
    e.strikeTime = 0;
    e.recovery = 0;
    e.cool = 0;
    poseNear(t, e, side, 40);
    until(t, fps, () => e.catchupAttack === "kick" && e.wind > 0, 1);
    assert.equal(e.hp, 2);
    report.retreat.push({
      fps,
      side,
      displacement: Number(Math.abs(e.x - hitX).toFixed(2)),
      book: true,
      kick: true,
    });

    const wall = setup("inshape-navigation-i2-view-308", fps),
      w = wall.g,
      pinned = w.enemies[0];
    pinned.x = side < 0 ? 282 : 27;
    pinned.cool = 999;
    poseNear(wall, pinned, side);
    const playerX = w.px,
      playerHp = w.hp;
    pulse(wall, "F");
    wall.step(1000 / fps);
    until(wall, fps, () => pinned.hp === 2, 0.5);
    assert(
      (w.px - playerX) * side >= 17.9,
      "cornered student creates distance through a small visible push",
    );
    assert.equal(w.hp, playerHp, "reposition push never damages the player");
    until(wall, fps, () => pinned.retreatTime === 0 && pinned.stun === 0, 1.5);
    assert(pinned.x >= 22 && pinned.x <= 287);
  }

  for (const side of [-1, 1])
    for (const active of ["push", "advance"]) {
      const dodge = setup("inshape-navigation-i2-boss", fps),
        d = dodge.g,
        boss = d.enemies[0];
      boss.x = 160;
      poseNear(dodge, boss, side, 40);
      d.inv = 0;
      d.setSecurityI2Phase(boss, active + "-windup");
      const direction = boss.securityCycle.dir,
        hp = d.hp,
        startX = boss.x;
      pulse(dodge, "SPACE");
      d.physicalKeys[side < 0 ? "D" : "Q"].isDown = true;
      until(dodge, fps, () => boss.securityCycle.phase === active, 1);
      assert.equal(
        boss.securityCycle.dir,
        direction,
        "crossing during windup cannot auto-retarget the attack",
      );
      // until() releases held inputs at its boundary. Keep the crossing movement
      // through the active pose, rather than landing underneath the boss.
      d.physicalKeys[side < 0 ? "D" : "Q"].isDown = true;
      until(dodge, fps, () => boss.securityCycle.phase !== active, 1);
      assert.equal(
        d.hp,
        hp,
        "jump and crossing dodge the committed " +
          active +
          " / " +
          JSON.stringify({
            fps,
            side,
            playerX: d.px,
            playerY: d.py,
            enemyX: boss.x,
            direction,
            events: d.session.events.filter((x) => x.kind === "hurt"),
          }),
      );
      if (active === "advance")
        assert(
          (boss.x - startX) * direction > 45,
          "advance continues in its committed direction",
        );
    }

  // A human-like pilot stays outside the push, jumps the committed advance,
  // closes only during opening and attacks only when the book is ready.
  const t = setup("inshape-navigation-i2-boss", fps),
    g = t.g,
    e = g.enemies[0];
  assert.equal(e.hp, 6);
  assert(e.securityCycle);
  const phases = new Set();
  let openingHits = 0,
    priorPhase = e.securityCycle.phase,
    contacts = 0,
    maxHits = 0;
  for (let n = 0; n < fps * 60 && e.hp > 0 && g.phase === "school"; n++) {
    release(t);
    const c = e.securityCycle,
      dx = e.x - g.px,
      side = Math.sign(dx) || 1;
    phases.add(c.phase);
    if (c.phase !== priorPhase && c.phase === "opening") openingHits = 0;
    priorPhase = c.phase;
    if (!g.playerRecovery && !g.hitStop) {
      if (c.phase === "approach" && Math.abs(dx) > 69)
        g.physicalKeys[side > 0 ? "D" : "Q"].isDown = true;
      if (c.phase === "push-windup" && Math.abs(dx) < 64)
        g.physicalKeys[side > 0 ? "Q" : "D"].isDown = true;
      if (c.phase === "advance-windup" && c.time < 0.08 && g.py === 159)
        pulse(t, "SPACE");
      if (c.phase === "opening") {
        if (Math.abs(dx) > 57)
          g.physicalKeys[side > 0 ? "D" : "Q"].isDown = true;
        else if (g.py >= 130 && !g.attack) pulse(t, "F");
      }
    }
    t.step(1000 / fps);
    for (const event of g.session.events.slice(contacts)) {
      if (event.kind === "contact") {
        openingHits++;
        maxHits = Math.max(maxHits, openingHits);
        assert(openingHits <= 2, "no more than two hits in an opening");
      }
    }
    contacts = g.session.events.length;
  }
  assert.equal(
    e.hp,
    0,
    "read/jump/punish pilot can win without debug invulnerability",
  );
  assert.equal(
    g.hp,
    5,
    "reading the push then jumping the advance can win without damage",
  );
  assert(g.pointerExits().some((x) => x.target === -1));
  for (const p of [
    "push-windup",
    "push",
    "advance-windup",
    "advance",
    "opening",
    "reset",
  ])
    assert(phases.has(p), p + " must appear in the real fight");
  const cycles = g.session.events.filter(
    (x) => x.kind === "security-cycle" && x.data.phase === "opening",
  ).length;
  assert(cycles >= 3, "six HP require at least three attack cycles");
  report.boss.push({
    fps,
    seconds: Number((210 - g.remaining).toFixed(2)),
    hp: g.hp,
    cycles,
    maxHits,
  });

  const stress = setup("inshape-navigation-i2-boss", fps),
    s = stress.g,
    boss = s.enemies[0];
  s.inv = 999; // Explicit guard/combo stress, independent from pilot above.
  for (const phase of [
    "approach",
    "push-windup",
    "push",
    "advance-windup",
    "advance",
    "opening",
    "reset",
  ]) {
    s.setSecurityI2Phase(boss, phase);
    boss.stun = 0;
    paused(stress, fps);
  }
  s.setSecurityI2Phase(boss, "push-windup");
  poseNear(stress, boss);
  strike(stress, fps);
  assert.equal(boss.hp, 6, "frontal mashing cannot damage a committed attack");
  assert(s.session.events.some((x) => x.kind === "blocked"));
  s.setSecurityI2Phase(boss, "opening");
  boss.stun = 0;
  s.attack = 0;
  s.bookBlocked = 0;
  poseNear(stress, boss);
  strike(stress, fps);
  assert.equal(boss.hp, 5);
  assert.equal(boss.securityCycle.hits, 1);
  poseNear(stress, boss);
  pulse(stress, "F");
  stress.step(1000 / fps);
  until(stress, fps, () => boss.hp === 4, 0.5);
  assert.equal(boss.securityCycle.phase, "reset");
  paused(stress, fps);
  until(stress, fps, () => !s.attack && !s.hitStop, 1.5);
  poseNear(stress, boss);
  strike(stress, fps);
  assert.equal(boss.hp, 4, "third continuous hit cannot stun-lock the boss");
  assert(
    !s.pointerExits().some((x) => x.target === -1),
    "class door stays locked with a living boss",
  );
}
assert.equal(
  JSON.stringify(baseline.api.INSHAPE_NAV),
  original,
  "I2 tests never mutate I1 data",
);
for (const scenario of [
  "inshape-navigation-i1-view-302",
  "inshape-navigation-i1-boss",
  "hanouna-navigation-h1-boss",
]) {
  const t = setup(scenario);
  assert(!t.g.isInshapeI2());
  assert.equal(t.g.enemies.length, 1);
  assert.equal(t.g.enemies[0].securityCycle, undefined);
  assert.equal(t.g.enemies[0].retreatTime, undefined);
}
console.log(
  "InShape I2: paired dispatch, independent deaths, spacing, pause/revisit, student retreat and security cycles PASS",
);
console.log(JSON.stringify(report, null, 2));
require("node:fs").writeFileSync(
  "work/inshape-i2-results.json",
  JSON.stringify(report, null, 2) + "\n",
);
