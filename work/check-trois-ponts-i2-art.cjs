const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const { createGame } = require("./test-harness.cjs");
const t = createGame();
t.g.workshop = true;
t.g.loadScenario("inshape-navigation-i2");
const spec = t.g.navigationSpec(),
  before = JSON.stringify(spec),
  images = [],
  frames = new Set();
const meta = JSON.parse(
  fs.readFileSync("art/trois-ponts-i2/atlas.json", "utf8"),
);
function image(x, y, key, frame) {
  const o = { x, y, key, frame };
  for (const [name, props] of Object.entries({
    setTexture: ["key", "frame"],
    setPosition: ["x", "y"],
    setDisplaySize: ["width", "height"],
    setOrigin: ["originX", "originY"],
    setDepth: ["depth"],
    setVisible: ["visible"],
  }))
    o[name] = (...args) => {
      props.forEach((p, n) => (o[p] = args[n] ?? args[0]));
      return o;
    };
  images.push(o);
  return o;
}
function graphics() {
  const g = {
    calls: [],
    clear() {
      this.calls = [];
      return this;
    },
    setDepth(d) {
      this.depth = d;
      return this;
    },
  };
  for (const m of ["fillStyle", "fillRect", "lineStyle", "lineBetween"])
    g[m] = (...a) => {
      assert(a.every(Number.isFinite));
      g.calls.push([m, ...a]);
      return g;
    };
  return g;
}
const scope = {
  VIEW: { x: 7, y: 7, width: 306, height: 168, floor: 163 },
  INFIRMARY: { nurseX: 225 },
  Phaser: { Textures: { FilterMode: { NEAREST: 0 } } },
};
vm.createContext(scope);
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
vm.runInContext(
  stripTypeScriptTypes(
    [
      "src/trois-ponts-i2-data.ts",
      "src/small-lettering.ts",
      "src/trois-ponts-i2-art.ts",
    ]
      .map((f) => strip(fs.readFileSync(f, "utf8")))
      .join("\n") +
      "\nglobalThis.Renderer=TroisPontsI2Art;globalThis.mapping=TP_ROOM_ART;globalThis.payload=TROIS_PONTS_I2_DATA;",
    { mode: "transform" },
  ),
  scope,
);
const scene = {
  add: { image, graphics },
  textures: {
    get(key) {
      const k = key.slice(6),
        b = fs.readFileSync("art/trois-ponts-i2/" + meta[k].file),
        w = b.readUInt32BE(16),
        h = b.readUInt32BE(20);
      assert.equal(
        scope.payload[k],
        "data:image/png;base64," + b.toString("base64"),
        "embedded original matches source",
      );
      return {
        add(n, s, x, y, cw, ch) {
          assert(
            x >= 0 && y >= 0 && cw > 0 && ch > 0 && x + cw <= w && y + ch <= h,
          );
          frames.add(key + ":" + n);
        },
        setFilter() {},
      };
    },
  },
};
const art = new scope.Renderer(scene);
assert.equal([...frames].filter((f) => /:\d+$/.test(f)).length, 17);
const poolSize = images.length;
assert.equal(art.nurse.height, 86);
assert.equal(art.nurse.y, 163);
assert.equal(art.nurse.originY, 0.986);
assert(
  art.background.depth < 1.4 && art.ambient.depth < 1.4,
  "holes remain in front",
);
assert.equal(Object.keys(scope.mapping).length, 18);
for (let p = 0; p < 4; p++)
  for (const r of Object.values(spec.rooms)) {
    art.render(r, r.boss ? 0.7 : undefined, p * 0.21);
    assert(art.background.visible || art.panels.some((p) => p.visible));
    const panels = art.panels.filter((p) => p.visible);
    if (panels.length) {
      assert.equal(panels[0].x, 7);
      assert.equal(panels.at(-1).x + panels.at(-1).width, 313);
      for (let n = 1; n < panels.length; n++)
        assert.equal(
          panels[n].x,
          panels[n - 1].x + panels[n - 1].width,
          "continuous room",
        );
    }
    assert.equal(art.nurse.visible, !!r.care);
    assert.equal(art.background.key, scope.mapping[r.id][0]);
    assert.equal(art.background.frame, scope.mapping[r.id][1]);
    assert.equal(images.length, poolSize, "fixed pool");
    if (![313, 317].includes(r.id))
      assert.equal(art.ambient.calls.length, 0, "leak cleared on transition");
  }
assert.equal(JSON.stringify(spec), before, "renderer never changes rules");
art.render(spec.rooms[309], 0.7);
assert(
  art.ink.calls.some((c) => c[0] === "fillRect" && c[3] === 2),
  "class opens to its own doorway",
);
art.hide();
assert(images.every((i) => !i.visible));
assert.equal(art.ink.calls.length + art.ambient.calls.length, 0);
console.log(
  "PASS Trois-Ponts I2 art: 18 rooms, 16 distinct frames, intact PNG payloads, bounded crops, fixed pool, nurse scale, hole depth, transition cleanup and class opening. Native readability checked separately.",
);
