const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const source = ["driving", "presentation", "road-art"]
  .map((n) => fs.readFileSync(`src/${n}.ts`, "utf8"))
  .join("\n")
  .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\r?\n/gm, "")
  .replaceAll("export ", "");
const c = {};
vm.createContext(c);
vm.runInContext(
  stripTypeScriptTypes(source, { mode: "transform" }) +
    ";this.api={trafficCue,DRIVE,roadLightPlacement,roadLightTrail,drawRoadLamp,RoadArt};",
  c,
);
const a = c.api;
for (let i = 0; i < 64; i++)
  for (const random of [0, 0.25, 0.99]) {
    const cue = [300, 550, 750, 260, 900, 560, 620, 900][i % 8];
    const old = a.DRIVE.motionScale * (cue * 0.36 + (i ? random * 35 : 0));
    assert(Math.abs(a.trafficCue(i, 0, random).gap * 1.12 - old) < 1e-8);
    assert(Math.abs(a.trafficCue(i, 1, random).gap * 2.24 - old) < 1e-8);
    assert(
      Math.abs(a.trafficCue(i, 2, random).gap * 4 - old) < 1e-8,
      "last journey unchanged",
    );
  }
for (const key of ["traffic", "district"])
  for (const frame of key === "traffic" ? [0, 1, 2] : [2]) {
    const left = a.roadLightPlacement(key, frame, 100, false),
      right = a.roadLightPlacement(key, frame, 100, true);
    assert(left.length > 0);
    left.forEach((p, i) => {
      assert.equal(p.dx, -right[i].dx);
      assert.equal(p.dy, right[i].dy);
      assert(p.radius > 0);
    });
  }
assert.equal(a.roadLightPlacement("district", 0, 100, false).length, 0);
assert.equal(a.roadLightTrail(0), 0);
assert.equal(a.roadLightTrail(110), 0);
assert(a.roadLightTrail(260) > a.roadLightTrail(180));
assert(a.roadLightTrail(999) <= 4);
const calls = [];
const g = {
  fillStyle(...args) {
    calls.push(["style", ...args]);
  },
  fillEllipse(...args) {
    calls.push(["ellipse", ...args]);
  },
  fillRect(...args) {
    calls.push(["rect", ...args]);
  },
};
a.drawRoadLamp(g, 100, 80, 2, 0xffe7ab, 0);
assert(
  calls.some((c) => c[0] === "ellipse"),
  "layered halo",
);
assert.equal(
  calls.filter((c) => c[0] === "rect").length,
  1,
  "bulb only at rest",
);
calls.length = 0;
a.drawRoadLamp(g, 100, 80, 2, 0xffe7ab, 3);
assert.equal(
  calls.filter((c) => c[0] === "rect").length,
  4,
  "bulb and three fading trail segments",
);
// Lights belong to the same world-depth band as their sprite, not a global overlay.
const graphics = [];
const sprites = [];
const art = Object.create(a.RoadArt.prototype);
Object.assign(art, {
  layers: [],
  images: [],
  index: 0,
  lightImages: [],
  lightIndex: 0,
  depth: 3.01,
  scene: {
    add: {
      image() {
        const s = {};
        for (const method of [
          "setTexture",
          "setPosition",
          "setDisplaySize",
          "setOrigin",
          "setFlipX",
          "setTint",
          "setAlpha",
          "setDepth",
          "setVisible",
        ])
          s[method] = (...args) => {
            s[method + "Args"] = args;
            return s;
          };
        sprites.push(s);
        return s;
      },
      graphics() {
        const g = { depth: 0, cleared: 0 };
        for (const k of [
          "fillStyle",
          "fillEllipse",
          "fillRect",
          "fillTriangle",
          "setMask",
        ])
          g[k] = () => g;
        g.setDepth = (d) => ((g.depth = d), g);
        g.clear = () => g.cleared++;
        graphics.push(g);
        return g;
      },
    },
  },
});
art.lights("traffic", 0, 120, 100, 30, false, 1, 260);
assert.equal(graphics.length, 0, "no lights or allocations at midday");
art.lights("traffic", 0, 120, 100, 30, false, 2, 260);
assert.equal(graphics.length, 0, "halos must not rebuild graphics geometry");
const far = sprites[0].setDepthArgs[0];
art.layer(10);
const bridge = art.depth;
art.lights("district", 2, 230, 150, 29, true, 2, 260);
assert(
  far < bridge &&
    sprites.at(-1).setDepthArgs[0] > bridge &&
    sprites.at(-1).setDepthArgs[0] < 3.1,
);
const count = sprites.length;
art.hide();
assert.equal(art.lightIndex, 0);
assert(
  sprites.every((s) => s.setVisibleArgs[0] === false),
  "pause/repaint/scene change hides pooled lights",
);
art.lights("traffic", 0, 120, 100, 30, false, 2, 260);
art.layer(10);
art.lights("district", 2, 230, 150, 29, true, 2, 260);
assert.equal(
  sprites.length,
  count,
  "light sprite pool stabilises after first frame",
);
console.log(
  "PASS dusk lights: source anchors, mirrored lamp heads, bounded speed trails, +12% early streams and unchanged final traffic",
);
