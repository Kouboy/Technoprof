const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const { createGame } = require("./test-harness.cjs");
const t = createGame();
t.g.workshop = true;
t.g.loadScenario("hanouna-navigation-h1");
const layout = t.g.navigationSpec(),
  images = [];
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
const ink = {
  clear() {
    return this;
  },
};
for (const method of [
  "fillStyle",
  "fillRect",
  "lineStyle",
  "lineBetween",
  "strokeRect",
  "setDepth",
])
  ink[method] = (...args) => {
    assert(args.every(Number.isFinite));
    return ink;
  };
function image(x, y, key, frame) {
  const obj = { x, y, key, frame, visible: false };
  obj.setTexture = (key, frame) => {
    Object.assign(obj, { key, frame });
    return obj;
  };
  obj.setVisible = (visible) => {
    obj.visible = visible;
    return obj;
  };
  obj.setDisplaySize = (width, height) => {
    Object.assign(obj, { width, height });
    return obj;
  };
  obj.setOrigin = () => obj;
  obj.setDepth = (depth) => {
    obj.depth = depth;
    return obj;
  };
  images.push(obj);
  return obj;
}
const scope = {
  h: t.api.HANOUNA_ID,
  INFIRMARY: { nurseX: 225 },
  VIEW: { x: 7, y: 7, width: 306, height: 168, floor: 163 },
};
vm.createContext(scope);
vm.runInContext(
  stripTypeScriptTypes(
    strip(fs.readFileSync("src/small-lettering.ts", "utf8")) +
      "\n" +
      strip(fs.readFileSync("src/hanouna-navigation-art.ts", "utf8")) +
      "\nglobalThis.Renderer=HanounaNavigationArt;globalThis.backgrounds=H1_BACKGROUNDS;globalThis.signs=H1_SIGNS;",
    { mode: "transform" },
  ),
  scope,
);
const art = new scope.Renderer({ add: { image, graphics: () => ink } }),
  count = images.length;
t.g.hanounaArt = art;
const before = JSON.stringify(layout);
const known = {
  courtyard: ["playable"],
  hall: ["floor"],
  "annex-stair": ["playable"],
  "wing-34": ["floor"],
  corridor: ["__BASE"],
  "bruel-a3-aile-b": [2],
};
for (let pass = 0; pass < 3; pass++)
  for (const room of Object.values(layout.rooms)) {
    const [key, frame] = scope.backgrounds[room.id];
    assert(known[key]?.includes(frame), "loaded texture and frame");
    assert(scope.signs[room.id]?.length);
    art.hide();
    art.render(room);
    assert(art.background.visible);
    assert.equal(art.background.key, key);
    assert.equal(art.background.frame, frame);
    assert.equal(art.background.width, 306);
    assert.equal(art.background.height, 168);
    assert.equal(art.nurse.visible, room.id === scope.h.infirmerie);
    // H1 labels are physical plates; keep them inside the wall and above actors' floor.
    for (const [x, y, lines] of scope.signs[room.id]) {
      const width = Math.max(20, ...lines.map((s) => scope.smallWidth(s) + 8));
      assert(
        x >= 8 && y >= 8 && x + width <= 313 && y + lines.length * 8 + 5 < 144,
      );
    }
  }
assert.equal(images.length, count, "no image allocation on return visits");
assert.equal(
  JSON.stringify(layout),
  before,
  "render does not mutate the level",
);
assert.equal(
  scope.backgrounds[scope.h.hall][0],
  "annex-stair",
  "open staircase, not the condemned central stair",
);
art.hide();
assert(images.every((i) => !i.visible));
for (const room of Object.values(layout.rooms)) {
  t.g.loadScenario("hanouna-navigation-h1-view-" + room.id);
  assert.equal(t.g.room, room.id);
  assert(t.g.usesHanounaArt());
}
for (const scenario of ["bruel-navigation-a3", "first-assignment", "road"]) {
  t.g.loadScenario(scenario);
  assert(!t.g.usesHanounaArt());
}
console.log(
  "PASS H1 rendering: nine rooms/plates, loaded frames, open stair, nurse limited to care, stable allocations, topology unchanged and isolated presets. Native visual inspection is also required.",
);
