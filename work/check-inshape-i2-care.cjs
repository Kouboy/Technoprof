const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
function setup(hp = 3) {
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
  g.loadScenario("inshape-navigation-i2-care");
  return t;
}
const release = (t) =>
  Object.values(t.g.physicalKeys).forEach((k) => (k.isDown = false));
function tap(t, x, y) {
  t.g.direct.down(1, x, y);
  t.g.direct.up(1, x, y);
}
function action(t, mode) {
  if (mode === "keyboard") t.g.physicalKeys.F.just = true;
  else tap(t, 160, 164);
}
function move(t, x, mode) {
  if (mode === "keyboard") {
    if (Math.abs(x - t.g.px) > 1)
      t.g.physicalKeys[x > t.g.px ? "D" : "Q"].isDown = true;
  } else if (
    t.g.direct.intent?.kind !== "walk" ||
    Math.abs(t.g.direct.intent.x - x) > 2
  )
    tap(t, x, 164);
}
function passage(t, target, mode) {
  const g = t.g,
    e = g.pointerExits().find((e) => e.target === target);
  assert(e, `missing passage ${g.room}->${target}`);
  const dest = e.edge ? (e.key === "LEFT" ? 15 : 297) : (e.from + e.to) / 2;
  const dir = dest > g.px ? 1 : -1;
  const gap = g
    .floorGaps()
    .filter(([l, r]) => (dir > 0 ? g.px < r && dest > r : g.px > l && dest < l))
    .sort((a, b) => (dir > 0 ? a[0] - b[0] : b[1] - a[1]))[0];
  if (g.py < 159) {
    move(t, dir > 0 ? (gap?.[1] ?? dest) + 24 : (gap?.[0] ?? dest) - 24, mode);
    return;
  }
  if (gap && Math.abs(g.px - (dir > 0 ? gap[0] : gap[1])) <= 22) {
    if (mode === "keyboard") {
      t.g.physicalKeys.SPACE.just = true;
      t.g.physicalKeys[dir > 0 ? "D" : "Q"].isDown = true;
    } else {
      g.direct.down(1, 150, 153);
      g.direct.move(1, 150 + dir * 28, 120);
      g.direct.up(1, 150 + dir * 28, 120);
    }
    return;
  }
  if (mode === "keyboard") {
    if (e.edge) t.g.physicalKeys[e.key === "LEFT" ? "Q" : "D"].isDown = true;
    else if (g.px < e.from + 2 || g.px > e.to - 2) move(t, dest, mode);
    else t.g.physicalKeys[e.key === "UP" ? "Z" : "S"].isDown = true;
  } else if (g.direct.intent?.kind !== "exit") {
    if (e.edge && Math.abs(g.px - e.hint[0]) >= 60) move(t, dest, mode);
    else {
      const m = t.api.passageMarker(e, g.px);
      if (m) tap(t, m.x + m.w / 2, m.y + m.h / 2);
    }
  }
}
function advanceTo(t, target, mode, fps) {
  const from = t.g.room;
  for (let n = 0; n < fps * 12 && t.g.room === from; n++) {
    release(t);
    passage(t, target, mode);
    t.step(1000 / fps);
  }
  release(t);
  assert.equal(t.g.room, target, `${from}->${target}, ${mode}, ${fps}fps`);
  assert.equal(t.g.falling, 0, "passage must finish on a safe bank");
}
const b = setup(),
  spec = b.g.navigationSpec(),
  ids = b.api.INSHAPE_ID,
  care = b.api.INSHAPE_I2_CARE;
assert.equal(Object.keys(spec.rooms).length, 18);
assert.equal(spec.seconds, 210);
assert.deepEqual(
  Object.values(spec.rooms)
    .filter((r) => r.care)
    .map((r) => r.id),
  [ids.infirmerie],
);
assert(!spec.rooms[ids.galerie].exits.some((e) => e.target === ids.infirmerie));
assert(
  spec.rooms[ids.preparation].exits.some((e) => e.target === ids.sas),
  "direct route to class remains optional-care free",
);
const corridor = spec.rooms[care.corridor];
assert.equal(corridor.gaps.length, 2);
assert(!corridor.encounter && !corridor.role && !corridor.care);
assert.deepEqual(
  Array.from(corridor.exits, (e) => e.target),
  [ids.preparation, ids.infirmerie],
);
assert.equal(spec.rooms[ids.infirmerie].exits[0].target, care.corridor);
const branch = spec.rooms[ids.preparation].exits.find(
  (e) => e.target === care.corridor,
);
assert(
  spec.rooms[ids.preparation].gaps.every(
    ([l, r]) => branch.to < l || branch.from > r,
  ),
  "access window stays on landing",
);
for (const r of Object.values(spec.rooms))
  for (const e of r.exits) {
    assert(spec.rooms[e.target], "no dangling exit");
    assert(
      spec.rooms[e.target].gaps.every(([l, r]) => e.spawn < l || e.spawn > r),
      "all arrivals on intact floor",
    );
  }
const visited = new Set(),
  walk = (id) => {
    if (visited.has(id)) return;
    visited.add(id);
    spec.rooms[id].exits.forEach((e) => walk(e.target));
  };
walk(spec.start);
assert.equal(visited.size, 18);
const original = JSON.stringify(b.api.INSHAPE_NAV);
let runs = 0;
for (const fps of [30, 60, 144])
  for (const mode of ["keyboard", "direct"])
    for (const hp of [1, 3, 5]) {
      const t = setup(hp),
        g = t.g;
      t.advance(0.4, fps);
      assert.equal(g.room, ids.preparation);
      advanceTo(t, care.corridor, mode, fps);
      t.advance(0.4, fps);
      advanceTo(t, ids.infirmerie, mode, fps);
      assert.equal(g.hp, hp, "detour can be traversed without damage");
      assert(g.recoveryScene.active && g.navigationCare.used);
      const clock = g.remaining;
      t.advance(0.4, fps);
      g.setPaused(true);
      const before = JSON.stringify([
        g.hp,
        g.px,
        g.remaining,
        g.recoveryScene.state,
      ]);
      t.advance(2, fps);
      assert.equal(
        JSON.stringify([g.hp, g.px, g.remaining, g.recoveryScene.state]),
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
      assert.equal(
        g.room,
        care.corridor,
        "automatic return enters corridor, not old gallery",
      );
      assert.equal(g.hp, 5);
      assert(!g.recoveryScene.active);
      assert.equal(
        g.session.events.find((e) => e.kind === "care-exit").data.remaining,
        clock,
      );
      advanceTo(t, ids.infirmerie, mode, fps);
      t.advance(0.4, fps);
      assert(!g.recoveryScene.active);
      assert.equal(
        g.session.events.filter((e) => e.kind === "care-start").length,
        1,
      );
      assert.equal(
        g.session.events.filter((e) => e.kind === "care-complete").length,
        1,
      );
      assert(g.remaining < clock, "timer resumes outside recovery");
      advanceTo(t, care.corridor, mode, fps);
      t.advance(0.4, fps);
      advanceTo(t, ids.preparation, mode, fps);
      t.advance(0.4, fps);
      assert.equal(g.hp, 5, "return across two holes and landing is safe");
      assert.equal(
        g.room,
        ids.preparation,
        "held input cannot bounce through branch again",
      );
      advanceTo(t, ids.sas, mode, fps);
      assert.equal(g.room, ids.sas);
      runs++;
    }
for (const fps of [30, 60, 144])
  for (const dir of [-1, 1]) {
    const t = setup(),
      g = t.g;
    g.enterRoom(care.corridor, dir > 0 ? 90 : 237);
    t.advance(0.4, fps);
    for (let n = 0; n < fps * 3 && !g.falling; n++) {
      release(t);
      g.physicalKeys[dir > 0 ? "D" : "Q"].isDown = true;
      t.step(1000 / fps);
    }
    release(t);
    assert(g.falling > 0, "walking into corridor hole causes a real fall");
    g.setPaused(true);
    const frozen = [g.falling, g.hp, g.remaining];
    t.advance(1, fps);
    assert.deepEqual([g.falling, g.hp, g.remaining], frozen);
    g.setPaused(false);
    t.advance(1, fps);
    assert.equal(g.hp, 2, "fall costs exactly one health point");
    assert.equal(g.falling, 0);
    assert(
      g.floorGaps().every(([l, r]) => g.px < l || g.px > r),
      "fall recovers on intact floor",
    );
  }
assert.equal(
  JSON.stringify(b.api.INSHAPE_NAV),
  original,
  "I1 remains unchanged",
);
console.log(
  `PASS I2 optional late-care graph: 18 rooms, single infirmary, two-hole corridor, ${runs} keyboard/direct round trips, full unique paused healing, timer resumption and continuation to sas`,
);
