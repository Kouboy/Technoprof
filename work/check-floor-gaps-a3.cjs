const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const { createGame } = require("./test-harness.cjs");
const setup = (room, x) => {
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
  g.enterRoom(room, x);
  t.advance(1);
  g.direct.tick(0);
  return t;
};
const base = setup(104, 55),
  rooms = base.g.navigationSpec().rooms;
const hazards = Object.values(rooms).filter((r) => r.gaps.length);
assert.equal(hazards.length, 2);
for (const r of hazards) {
  assert.equal(r.navigation.floor, 1);
  assert.equal(r.encounter, undefined);
  assert.equal(r.boss, undefined);
  assert.equal(r.care, undefined);
  for (const [l, h] of r.gaps) {
    assert(
      h - l <= 34 && l >= 90 && h <= 208,
      "readable jump with approach runway",
    );
    for (const room of Object.values(rooms))
      for (const e of room.exits ?? [])
        if (e.target === r.id)
          assert(e.spawn < l - 20 || e.spawn > h + 20, "safe return spawn");
    for (const e of r.exits)
      assert(
        e.edge || e.to < l - 25 || e.from > h + 25,
        "hole cannot mask an access",
      );
  }
}
for (const profile of ["bruel-navigation", "bruel-navigation-a2"]) {
  base.g.loadScenario(profile);
  assert(
    Object.values(base.g.navigationSpec().rooms).every((r) => !r.gaps.length),
    "earlier workshop profiles unchanged",
  );
}
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
const props = fs.readFileSync("src/school-props.ts", "utf8"),
  context = {};
vm.createContext(context);
vm.runInContext(
  require("node:module").stripTypeScriptTypes(
    strip(props.slice(0, props.indexOf("export class SchoolProps"))) +
      ";globalThis.geometry={WOOD_HOLE,woodHoleLayout,fallingCrop};",
  ),
  context,
);
const { WOOD_HOLE, woodHoleLayout, fallingCrop } = context.geometry;
// Use the actual background renderer: late descent must still draw the torso
// so the foreground crop, rather than a hard y threshold, decides visibility.
vm.runInContext(
  require("node:module").stripTypeScriptTypes(
    strip(fs.readFileSync("src/new-school-art.ts", "utf8")) +
      ";globalThis.RoomArt=NewSchoolArt;",
    { mode: "transform" },
  ),
  context,
);
const imageStub = new Proxy({}, { get: () => () => imageStub });
const roomArt = Object.create(context.RoomArt.prototype);
roomArt.background = imageStub;
roomArt.door = imageStub;
let teacherDraws = 0;
const host = {
  mission: 1,
  room: 105,
  py: 220,
  falling: 0.4,
  enemies: [],
  phase: "school",
  projectiles: [],
  art: {
    drawTeacher() {
      teacherDraws++;
    },
  },
};
roomArt.render(host, rooms[105]);
assert.equal(teacherDraws, 1, "torso persists into late A3 fall");
roomArt.render(host, {
  ...rooms[105],
  navigation: { ...rooms[105].navigation, revision: "A2" },
});
assert.equal(teacherDraws, 1, "earlier profiles retain their presentation");
const png = fs.readFileSync("art/bruel-a3/trou-plancher.png");
assert.equal(png.readUInt32BE(16), WOOD_HOLE.width);
assert.equal(png.readUInt32BE(20), WOOD_HOLE.height);
assert.equal(png[25], 6, "source includes alpha");
const data = JSON.parse(
  fs
    .readFileSync("src/wood-hole-data.ts", "utf8")
    .split("= ")[1]
    .trim()
    .replace(/;$/, ""),
);
assert(
  png.equals(Buffer.from(data.split(",")[1], "base64")),
  "exact source embedded",
);
const reports = [];
for (const r of hazards)
  for (const [l, h] of r.gaps) {
    const p = woodHoleLayout(l, h),
      scale = p.w / WOOD_HOLE.width;
    assert(Math.abs(p.x + WOOD_HOLE.left * scale - l) < 1e-6);
    assert(Math.abs(p.x + WOOD_HOLE.right * scale - h) < 1e-6);
    assert(
      p.y >= 151 && p.y + p.h <= 175 && p.frontY > 163,
      "rim on floor, not skirting or HUD",
    );
    assert(
      fallingCrop(480, 469 / 480, 0.18, 185, p.frontY) < 469,
      "falling body disappears below front timber lip",
    );
    for (const fps of [30, 60, 120])
      for (const mode of ["keyboard", "direct"])
        for (const dir of [-1, 1]) {
          const x = dir > 0 ? l - 12 : h + 12,
            t = setup(r.id, x),
            g = t.g;
          if (mode === "keyboard") {
            g.physicalKeys[dir > 0 ? "D" : "Q"].isDown = true;
            g.physicalKeys.SPACE.just = true;
          } else {
            g.direct.down(1, 150, 153);
            g.direct.move(1, 150 + dir * 28, 120);
            g.direct.up(1, 150 + dir * 28, 120);
          }
          for (let i = 0; i < fps * 0.9; i++) {
            t.step(1000 / fps);
            assert.equal(g.falling, 0, "early jump clears hole");
          }
          assert.equal(g.hp, 5);
          assert.equal(g.py, 159);
          assert(dir > 0 ? g.px > h : g.px < l, "land on opposite bank");
          assert.equal(g.room, r.id);
          const f = setup(r.id, dir > 0 ? l - 25 : h + 25),
            s = f.g;
          if (mode === "keyboard")
            s.physicalKeys[dir > 0 ? "D" : "Q"].isDown = true;
          else {
            s.direct.down(1, dir > 0 ? h + 30 : l - 30, 164);
            s.direct.up(1, dir > 0 ? h + 30 : l - 30, 164);
          }
          for (let i = 0; i < fps * 2 && !s.falling; i++) f.step(1000 / fps);
          assert(s.falling > 0, "walking into opening initiates actual fall");
          for (const k of Object.values(s.physicalKeys)) k.isDown = false;
          f.step(1000 / fps);
          if (mode === "direct")
            assert.equal(
              s.direct.intent,
              null,
              "fall cancels automatic destination",
            );
          s.physicalKeys.P.just = true;
          f.step(1000 / fps);
          const paused = [s.falling, s.remaining, s.hp, s.py];
          f.advance(0.5, fps);
          assert.deepEqual(
            [s.falling, s.remaining, s.hp, s.py],
            paused,
            "pause freezes fall and countdown",
          );
          s.physicalKeys.P.just = true;
          f.step(1000 / fps);
          f.advance(1, fps);
          assert.equal(s.hp, 4);
          assert.equal(s.session.falls, 1);
          assert.equal(s.falling, 0);
          assert.equal(s.py, 159);
          assert(dir > 0 ? s.px < l : s.px > h, "recover on entry bank");
          assert.equal(s.room, r.id);
          f.advance(1, fps);
          assert.equal(s.session.falls, 1, "no repeated or double damage");
          reports.push({
            room: r.id,
            fps,
            mode,
            dir,
            jump: "clear",
            fall: "one-health",
            pause: "frozen",
          });
        }
  }
fs.writeFileSync(
  "work/floor-gaps-a3-results.json",
  JSON.stringify(
    { holes: hazards.map((r) => ({ id: r.id, gaps: r.gaps })), cases: reports },
    null,
    2,
  ) + "\n",
);
console.log(
  "PASS A3 timber openings: quiet upper-floor rooms only, safe door/spawn offsets, exact embedded sprite/rim geometry; 24 two-way keyboard/direct jumps and falls, recovery, pause, single damage, no repeated pointer intent. Visual inspection remains necessary.",
);
