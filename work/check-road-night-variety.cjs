const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const source = fs
  .readFileSync("src/road-art.ts", "utf8")
  .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\r?\n/gm, "")
  .replaceAll("export ", "");
const context = {};
vm.createContext(context);
vm.runInContext(
  stripTypeScriptTypes(source, { mode: "transform" }) +
    ";this.api={RoadArt,roadTrafficVariant,recolorRoadTraffic,ROAD_WINDOWS,roadWindowPlacement,ROAD_FRAMES};",
  context,
);
const a = context.api;
const art = Object.create(a.RoadArt.prototype),
  vehicle = { z: 350, type: 0 };
const identity = art.trafficIdentity(vehicle);
for (const z of [351.5, 600, -40, 9000]) {
  vehicle.z = z;
  assert.equal(
    art.trafficIdentity(vehicle),
    identity,
    "moving/recycled vehicle keeps identity",
  );
}
for (let frame = 0; frame < 3; frame++) {
  const variants = new Set(
    Array.from({ length: 64 }, (_, id) => a.roadTrafficVariant(id, frame)),
  );
  assert.equal(variants.size, 5, "five paints available for every silhouette");
  assert.equal(
    a.roadTrafficVariant(identity, frame),
    a.roadTrafficVariant(identity, frame),
  );
}
const width = 1536,
  height = 1024,
  pixels = new Uint8ClampedArray(width * height * 4);
const put = (x, y, color) => pixels.set(color, (y * width + x) * 4),
  get = (x, y) =>
    Array.from(pixels.slice((y * width + x) * 4, (y * width + x) * 4 + 4));
// Body, glass, plate, rear lamp, wheel, truck panel and hinge.
const samples = [
  [100, 690, [67, 110, 145, 255]],
  [220, 540, [60, 80, 100, 255]],
  [250, 647, [220, 220, 215, 255]],
  [100, 621, [255, 45, 25, 255]],
  [70, 780, [35, 35, 35, 255]],
  [1120, 450, [210, 209, 195, 255]],
  [1085, 410, [150, 150, 150, 255]],
];
samples.forEach(([x, y, c]) => put(x, y, c));
a.recolorRoadTraffic(pixels, width, height, 2);
assert.notDeepEqual(get(100, 690), samples[0][2]);
assert.notDeepEqual(get(1120, 450), samples[5][2]);
for (const i of [1, 2, 3, 4, 6])
  assert.deepEqual(
    get(samples[i][0], samples[i][1]),
    samples[i][2],
    "glass/plate/lamp/wheel/hinge preserved",
  );
assert.deepEqual(get(0, 0), [0, 0, 0, 0], "alpha preserved");
for (const [key, windows] of Object.entries(a.ROAD_WINDOWS)) {
  const [kind, frameText] = key.split("/"),
    frame = Number(frameText);
  assert(windows.length > 0);
  for (const [x, y, w, h] of windows) {
    const [sx, sy, sw, sh] = a.ROAD_FRAMES[kind][frame];
    assert(
      x >= sx && y >= sy && x + w <= sx + sw && y + h <= sy + sh,
      "windows inside inspected source façade",
    );
  }
  const left = a.roadWindowPlacement(kind, frame, 100, false),
    right = a.roadWindowPlacement(kind, frame, 100, true);
  assert.equal(left.width, right.width);
  assert.equal(left.origin, right.origin);
}
const images = [];
const image = () => {
  const s = {};
  for (const method of [
    "setTexture",
    "setOrigin",
    "setPosition",
    "setDisplaySize",
    "setFlipX",
    "setTint",
    "setDepth",
    "setVisible",
  ])
    s[method] = (...v) => ((s[method + "Args"] = v), s);
  images.push(s);
  return s;
};
Object.assign(art, {
  images: [],
  layers: [],
  index: 0,
  depth: 3.03,
  mission: 3,
  scene: { add: { image } },
});
art.draw("district", 0, 80, 140, 100, true, 4);
assert.equal(images.length, 2, "night façade gains one pooled overlay");
assert.equal(
  images[1].setFlipXArgs[0],
  true,
  "all window panes mirror with façade",
);
assert(
  images[1].setDepthArgs[0] > images[0].setDepthArgs[0] &&
    images[1].setDepthArgs[0] < 3.031,
  "overlay belongs to object painter layer",
);
art.hide();
art.index = 0;
art.draw("district", 0, 220, 140, 100, false, 4);
assert.equal(images.length, 2, "overlay reused");
assert.equal(images[1].setFlipXArgs[0], false);
art.hide();
art.mission = 1;
art.draw("district", 0, 220, 140, 100, false, 4);
assert.equal(images[1].setVisibleArgs[0], false, "day hides night windows");
const draw = source.slice(source.indexOf("  draw("));
assert(
  !/getImageData|putImageData|createElement/.test(draw),
  "no image processing in per-frame path",
);
console.log(
  "PASS road night variety: stable object identity, five body paints, protected details, façade mirroring/depth, night-only pooled windows",
);
