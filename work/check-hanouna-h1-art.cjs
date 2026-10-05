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
const dataSource = fs.readFileSync("src/hanouna-h1-data.ts", "utf8");
const data = JSON.parse(
  dataSource
    .slice(dataSource.indexOf("= ") + 2)
    .trim()
    .replace(/;$/, ""),
);
const dimensions = {},
  frames = new Map();
for (const [key, file] of Object.entries({
  entree: "entree-v3.png",
  etage: "etage-v2.png",
  infirmerie: "infirmerie-v1.png",
})) {
  const original = fs.readFileSync("art/hanouna-h1/" + file);
  assert(
    original.equals(Buffer.from(data[key].split(",")[1], "base64")),
    "original source embedded intact",
  );
  dimensions["hanouna-h1-" + key] = [
    original.readUInt32BE(16),
    original.readUInt32BE(20),
  ];
}
const scene = {
  load: {
    image(key, uri) {
      assert(dimensions[key]);
      assert(uri.startsWith("data:image/png;base64,"));
    },
  },
  textures: {
    get(key) {
      return {
        add(i, source, x, y, w, h) {
          const [width, height] = dimensions[key];
          assert(
            x >= 0 &&
              y >= 0 &&
              w > 0 &&
              h > 0 &&
              x + w <= width &&
              y + h <= height,
          );
          frames.set(key + "/" + i, [x, y, w, h]);
        },
        setFilter(filter) {
          assert.equal(filter, 0);
        },
      };
    },
  },
};
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
  obj.setOrigin = (x, y = x) => {
    obj.origin = [x, y];
    return obj;
  };
  obj.setDepth = (depth) => {
    obj.depth = depth;
    return obj;
  };
  images.push(obj);
  return obj;
}
const scope = {
  HANOUNA_H1_DATA: data,
  Phaser: { Textures: { FilterMode: { NEAREST: 0 } } },
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
scope.Renderer.preload(scene);
const art = new scope.Renderer({
    ...scene,
    add: { image, graphics: () => ink },
  }),
  count = images.length;
t.g.hanounaArt = art;
const before = JSON.stringify(layout);
assert.equal(frames.size, 9, "nine distinct compositions");
assert.equal(
  new Set(Object.values(scope.backgrounds).map(([k, f]) => k + "/" + f)).size,
  9,
);
assert.equal(
  art.nurse.height,
  86,
  "adult nurse equals teacher head-to-sole scale",
);
assert.deepEqual(art.nurse.origin, [0.5, 0.986]);
assert.equal(art.nurse.y, 163, "nurse stands on the shared floor");
const arenaActor = {
  visible: true,
  scaleX: -0.225,
  scaleY: 0.225,
  setScale(x, y) {
    this.scaleX = x;
    this.scaleY = y;
  },
};
for (let frame = 0; frame < 3; frame++) {
  arenaActor.scaleX = -0.225;
  arenaActor.scaleY = 0.225;
  art.fitArenaActors({ teacher: arenaActor, inspector: { visible: false } });
  assert(
    Math.abs(arenaActor.scaleX + 0.18) < 1e-10,
    "arena keeps facing and common teacher scale",
  );
  assert(
    Math.abs(arenaActor.scaleY - 0.18) < 1e-10,
    "fresh render scale stable",
  );
}
for (let pass = 0; pass < 3; pass++)
  for (const room of Object.values(layout.rooms)) {
    const [key, frame] = scope.backgrounds[room.id];
    assert(frames.has(key + "/" + frame), "loaded texture and frame");
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
assert.notDeepEqual(
  scope.backgrounds[scope.h.hall],
  scope.backgrounds[scope.h.escalier],
  "hall and stair no longer reuse a panorama",
);
art.render(layout.rooms[scope.h.seuil], 0.5);
assert(art.background.visible, "class-entry presentation retains the room");
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
