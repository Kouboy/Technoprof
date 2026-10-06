const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const { createGame } = require("./test-harness.cjs");
const t = createGame();
t.g.workshop = true;
t.g.loadScenario(
  process.argv.includes("--i2")
    ? "inshape-navigation-i2"
    : "inshape-navigation-i1",
);
const spec = t.g.navigationSpec(),
  before = JSON.stringify(spec),
  images = [],
  frames = new Set();
function image(x, y, key, frame) {
  const o = { x, y, key, frame, visible: false, scaleX: 1, scaleY: 1 };
  for (const [name, props] of Object.entries({
    setTexture: ["key", "frame"],
    setPosition: ["x", "y"],
    setDisplaySize: ["width", "height"],
    setOrigin: ["originX", "originY"],
    setScale: ["scaleX", "scaleY"],
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
    depth: 0,
    clear() {
      this.calls = [];
      return this;
    },
    setDepth(n) {
      this.depth = n;
      return this;
    },
  };
  for (const method of [
    "fillStyle",
    "fillRect",
    "fillTriangle",
    "lineStyle",
    "lineBetween",
  ])
    g[method] = (...args) => {
      assert(args.every(Number.isFinite));
      g.calls.push([method, ...args]);
      return g;
    };
  return g;
}
const raw = fs.readFileSync("art/pro-backgrounds-057.png"),
  dims = [raw.readUInt32BE(16), raw.readUInt32BE(20)];
const scene = {
  add: { image, graphics },
  textures: {
    get(key) {
      assert.equal(key, "pro-backgrounds");
      return {
        add(name, s, x, y, w, h) {
          assert(
            x >= 0 &&
              y >= 0 &&
              w > 0 &&
              h > 0 &&
              x + w <= dims[0] &&
              y + h <= dims[1],
          );
          frames.add(name);
        },
      };
    },
  },
};
const scope = {
  i: t.api.INSHAPE_ID,
  VIEW: { x: 7, y: 7, width: 306, height: 168, floor: 163 },
  INFIRMARY: { nurseX: 225 },
};
vm.createContext(scope);
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
vm.runInContext(
  stripTypeScriptTypes(
    strip(fs.readFileSync("src/small-lettering.ts", "utf8")) +
      "\n" +
      strip(fs.readFileSync("src/inshape-navigation-art.ts", "utf8")) +
      "\nglobalThis.Renderer=InshapeNavigationArt;",
    { mode: "transform" },
  ),
  scope,
);
const art = new scope.Renderer(scene),
  count = images.length;
assert.equal(frames.size, 6);
assert.equal(art.nurse.height, 86);
assert.equal(art.nurse.originY, 0.986);
assert.equal(art.nurse.y, 163);
assert(art.ground.depth < 1.4, "metal floor must not cover the hole");
for (let pass = 0; pass < 8; pass++)
  for (const r of Object.values(spec.rooms)) {
    art.render(r, r.boss ? 0.7 : undefined);
    assert.equal(art.nurse.visible, !!r.care);
    for (const p of art.patches.filter((p) => p.visible))
      assert(frames.has(p.frame));
    if (r.care)
      assert(
        art.patches.every((p) => !p.visible),
        "care clears previous props",
      );
    if (r.id === t.api.INSHAPE_ID.palierService)
      assert(art.ground.calls.some((c) => c[0] === "fillRect"));
    else
      assert.equal(
        art.ground.calls.length,
        0,
        "service floor cleared after changing room",
      );
    assert.equal(images.length, count, "no per-frame sprite allocation");
  }
assert.equal(JSON.stringify(spec), before, "render never mutates gameplay");
const prof = image(0, 0, "prof");
prof.visible = true;
prof.setScale(0.225);
const enemy = image(0, 0, "security");
enemy.visible = true;
enemy.setScale(-0.235, 0.235);
art.fitActors({ teacher: prof }, { enemy });
assert(Math.abs(prof.scaleX - 0.18) < 1e-8);
assert(Math.abs(enemy.scaleX + 0.188) < 1e-8);
art.hide();
assert(images.every((p) => p === prof || p === enemy || !p.visible));
assert.equal(art.ink.calls.length, 0);
assert.equal(art.ground.calls.length, 0);
const atelier = fs.readFileSync("work/export-navigation-atelier.cjs", "utf8");
assert(atelier.includes("Jouer-Technoprof-Atelier-InShape-I1.html"));
assert(atelier.includes("inshape-navigation-i1"));
console.log(
  "PASS I1 art: source crop bounds, fixed sprite pool, room/care cleanup, metal floor behind hole, matched nurse/boss scales and isolated export. Native observation required for readability.",
);
