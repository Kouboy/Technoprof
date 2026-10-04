const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
const dataSource = fs.readFileSync("src/bruel-a3-data.ts", "utf8");
const data = JSON.parse(
  dataSource
    .slice(dataSource.indexOf("= ") + 2)
    .trim()
    .replace(/;$/, ""),
);
const dimensions = {};
for (const [name, uri] of Object.entries(data)) {
  const embedded = Buffer.from(uri.split(",")[1], "base64");
  const source = fs.readFileSync(`art/bruel-a3/${name}-${name === "reseau" ? "v3" : "v2"}.png`);
  assert(
    source.equals(embedded),
    `${name}: export uses the selected original PNG`,
  );
  dimensions["bruel-a3-" + name] = [
    source.readUInt32BE(16),
    source.readUInt32BE(20),
  ];
}
dimensions["bruel-backgrounds"] = [1672, 941];
dimensions["infirmary-nurse"] = [1254, 1254];
const images = [],
  textures = new Map();
const graphics = () => {
  const g = {
    rects: [],
    clear() {
      this.rects = [];
      return this;
    },
  };
  for (const key of [
    "fillStyle",
    "lineStyle",
    "strokeRect",
    "lineBetween",
    "fillEllipse",
  ])
    g[key] = (...args) => {
      assert(args.every(Number.isFinite));
      return g;
    };
  g.fillRect = (...r) => {
    assert(r.every(Number.isFinite));
    g.rects.push(r);
    return g;
  };
  g.setDepth = () => g;
  return g;
};
function image(x, y, key, frame) {
  const s = { x, y, key, frame, visible: false };
  s.setPosition = (x, y) => {
    s.x = x;
    s.y = y;
    return s;
  };
  s.setTexture = (key, frame) => {
    s.key = key;
    s.frame = frame;
    return s;
  };
  s.setVisible = (v) => {
    s.visible = v;
    return s;
  };
  s.setDisplaySize = (w, h) => {
    s.width = w;
    s.height = h;
    return s;
  };
  s.setDepth = (d) => {
    s.depth = d;
    return s;
  };
  s.setOrigin = () => s;
  images.push(s);
  return s;
}
const scene = {
  load: {
    image(key, uri) {
      assert(dimensions[key]);
      assert(uri.startsWith("data:image/png;base64,"));
    },
  },
  add: { image, graphics },
  textures: {
    get(key) {
      if (!textures.has(key))
        textures.set(key, {
          frames: [],
          filter: null,
          add(name, source, x, y, w, h) {
            const [width, height] = dimensions[key];
            assert(
              x >= 0 &&
                y >= 0 &&
                w > 0 &&
                h > 0 &&
                x + w <= width &&
                y + h <= height,
              `${key}/${name}: crop bounds`,
            );
            this.frames.push({ name, x, y, w, h });
          },
          setFilter(value) {
            this.filter = value;
            return this;
          },
        });
      return textures.get(key);
    },
  },
};
const fixture = createGame();
const scope = {
  Phaser: { Textures: { FilterMode: { NEAREST: 0 } } },
  NAV_ID: fixture.api.NAV_ID,
  NAV_CARE: fixture.api.NAV_CARE,
  INFIRMARY: { nurseX: 225 },
  INFIRMARY_DATA:
    "data:image/png;base64," +
    fs.readFileSync("art/infirmiere-bruel-a3.png").toString("base64"),
  BRUEL_A3_DATA: data,
};
const view = fs.readFileSync("src/presentation.ts", "utf8");
const source = ["small-lettering", "bruel-a3-art", "bruel-navigation-art"]
  .map((n) => strip(fs.readFileSync("src/" + n + ".ts", "utf8")))
  .join("\n");
vm.createContext(scope);
vm.runInContext(
  require("node:module").stripTypeScriptTypes(
    strip(view.slice(0, view.indexOf("export const DAYLIGHT"))) +
      "\n" +
      source +
      "\nglobalThis.Renderer=BruelNavigationArt;globalThis.rooms=A3_ROOM_ART;",
    { mode: "transform" },
  ),
  scope,
);
scope.Renderer.preload(scene);
const renderer = new scope.Renderer(scene),
  initialImageCount = images.length;
const unique = new Set(
  Object.values(scope.rooms).map(([key, frame]) => key + ":" + frame),
);
assert.equal(
  unique.size,
  12,
  "12 distinct room views, no repeated generic corridor",
);
fixture.g.workshop = true;
fixture.g.loadScenario("bruel-navigation-a3");
const layout = fixture.g.navigationSpec();
assert.equal(Object.keys(scope.rooms).length, Object.keys(layout.rooms).length);
const before = JSON.stringify(layout);
for (let visit = 0; visit < 3; visit++)
  for (const room of Object.values(layout.rooms)) {
    renderer.hide();
    renderer.render(
      room,
      { used: false, active: false, gain: 1 },
      55,
      true,
      visit * 0.7,
    );
    assert.equal(renderer.a3.background.visible, true);
    assert.equal(renderer.a3.background.x, 7);
    assert.equal(renderer.a3.background.y, 7);
    assert.equal(renderer.a3.background.width, 306);
    assert.equal(renderer.a3.background.height, 168);
    assert.equal(renderer.nurse.visible, room.id === 107);
    assert.equal(renderer.a3.courtView.visible, room.id === 104);
    assert(
      renderer.patches.every((p) => !p.visible),
      "old door/stair patches are not drawn over A3",
    );
    for (const [x, y, w, h] of renderer.a3.ink.rects)
      assert(
        x >= 7 && y >= 7 && x + w <= 313 && y + h < 144,
        "physical signs stay in wall area and viewport",
      );
  }
assert.equal(images.length, initialImageCount, "no per-frame image allocation");
assert.equal(
  JSON.stringify(layout),
  before,
  "render cannot change topology, encounters or signage rules",
);
renderer.hide();
assert(
  images.every((s) => !s.visible),
  "all A3 layers/nurse clear before another phase/profile",
);
for (const profile of ["bruel-navigation", "bruel-navigation-a2"]) {
  fixture.g.loadScenario(profile);
  const hall = fixture.g.navigationSpec().rooms[102];
  renderer.hide();
  renderer.render(hall, { used: false, active: false, gain: 1 }, 55, false, 0);
  assert.equal(renderer.a3.background.visible, false);
  assert.equal(renderer.nurse.visible, false);
  assert(
    renderer.patches.some((p) => p.visible),
    "A1/A2 keep original workshop composition",
  );
}
for (const id of Object.keys(layout.rooms)) {
  fixture.g.loadScenario("bruel-navigation-a3-view-" + id);
  assert.equal(fixture.g.room, Number(id));
  assert.equal(fixture.g.remaining, 225);
  assert.equal(fixture.g.hp, 5);
}
console.log(
  "PASS A3 rendering: 12 unique views, selected embedded PNGs/crop bounds, wall lettering, source rules intact, repeated visits/no allocations, phase/profile cleanup and declared room presets. Visual perception requires browser observation.",
);
