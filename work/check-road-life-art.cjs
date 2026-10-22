const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
const c = {};
vm.createContext(c);
vm.runInContext(
  stripTypeScriptTypes(
    ["small-lettering", "road-art"]
      .map((n) => strip(fs.readFileSync(`src/${n}.ts`, "utf8")))
      .join("\n") +
      ";globalThis.api={roadDecoration,roadPatchPlacement,paintRoadPatch,ROAD_PATCH_FRAMES,ROAD_FRAMES,districtAnchors,RoadArt};",
    { mode: "transform" },
  ),
  c,
);
const a = c.api;
const seen = new Map();
let buildings = 0,
  ads = 0,
  patches = 0;
for (let travel = 0; travel < 30000; travel += 180)
  for (const t of a.districtAnchors(travel)) {
    const key =
      t.kind === 7
        ? "verge"
        : t.kind === 1 || t.kind === 5
          ? "district"
          : undefined;
    if (!key) continue;
    const frame = t.kind === 7 ? t.variant : t.kind === 1 ? 0 : 3;
    const uid = `${t.id}/${key}/${frame}`;
    const patch = a.roadDecoration(t.id, key, frame);
    if (seen.has(uid)) {
      assert.equal(patch, seen.get(uid), "no change at segment crossing");
      continue;
    }
    seen.set(uid, patch);
    if (frame < 3 || (key === "district" && frame === 3)) buildings++;
    if (patch) {
      patches++;
      if (patch.startsWith("ad")) ads++;
    }
  }
assert(
  ads >= 3 && ads < buildings * 0.12,
  "rare ads actually occur in normal routes",
);
assert(patches > ads * 2, "subtle variants outnumber advertising");
for (const [key, frame] of [
  ["district", 0],
  ["district", 3],
  ["verge", 0],
  ["verge", 1],
  ["verge", 2],
]) {
  for (let id = 0; id < 500; id++) {
    const tag = a.roadDecoration(id, key, frame);
    if (!tag) continue;
    const left = a.roadPatchPlacement(key, frame, tag, 150, false);
    const right = a.roadPatchPlacement(key, frame, tag, 150, true);
    assert(
      Math.abs(left.dx + right.dx) < 1e-8,
      "opposite façade mirrors position",
    );
    assert(left.width > 0 && left.height > 0 && left.width <= 150);
    assert.equal(left.width, right.width);
    assert.equal(left.bottom, right.bottom);
    assert(
      left.dx - left.width / 2 >= -75 && left.dx + left.width / 2 <= 75,
      "patch belongs to façade",
    );
  }
}
for (const [tag, frame] of Object.entries(a.ROAD_PATCH_FRAMES)) {
  const ink = {
    fillStyle() {},
    fillRect(x, y, w, h) {
      assert([x, y, w, h].every(Number.isInteger));
      assert(w > 0 && h > 0);
      assert(
        x >= 0 && y >= 0 && x + w <= frame[2] && y + h <= frame[3],
        tag + " bounded pixels",
      );
    },
  };
  a.paintRoadPatch(ink, tag);
}
// The source baseline, not transparent atlas padding, anchors façade details.
{
  const p = a.roadPatchPlacement("verge", 2, "ad0", 150, false);
  assert(
    Math.abs(p.bottom - (0.81 - (490 - 46) / 447) * ((150 * 447) / 452)) < 1e-8,
  );
}
// Reused base/patch sprites must restore mirroring and depth independently.
const images = [];
function image() {
  const s = {};
  for (const key of [
    "setTexture",
    "setOrigin",
    "setPosition",
    "setDisplaySize",
    "setFlipX",
    "setTint",
    "setDepth",
    "setVisible",
  ])
    s[key] = (...v) => {
      s[key + "Args"] = v;
      return s;
    };
  images.push(s);
  return s;
}
const art = Object.create(a.RoadArt.prototype);
Object.assign(art, {
  images: [],
  index: 0,
  depth: 3.04,
  scene: { add: { image } },
});
const id = Array.from({ length: 500 }, (_, i) => i).find((id) =>
  a.roadDecoration(id, "verge", 2),
);
art.draw("verge", 2, 90, 150, 100, true, id);
assert.equal(images.length, 2);
assert.equal(images[0].setFlipXArgs[0], true);
assert.equal(images[1].setFlipXArgs[0], false, "letters never mirrored");
assert(
  images[1].setDepthArgs[0] > images[0].setDepthArgs[0] &&
    images[1].setDepthArgs[0] < 3.041,
);
art.index = 0;
art.draw("verge", 2, 240, 150, 100, false, id);
assert.equal(images.length, 2, "fixed sprite pool");
assert.equal(images[0].setFlipXArgs[0], false);
assert.equal(images[1].setFlipXArgs[0], false);
art.mission = 2;
art.index = 0;
art.draw("verge", 2, 240, 150, 100, false, id);
assert.notEqual(images[0].setTintArgs[0], 0xffffff);
assert.equal(images[0].setTintArgs[0], images[1].setTintArgs[0]);
art.mission = 1;
art.index = 0;
art.draw("verge", 2, 240, 150, 100, false, id);
assert.equal(images[0].setTintArgs[0], 0xffffff, "daylight restored on pooled base");
assert.equal(images[1].setTintArgs[0], 0xffffff, "daylight restored on pooled patch");
console.log(
  `PASS road life art: ${ads} rare ads / ${buildings} wall surfaces, ${patches} total stable details, bounded textures, readable-side flips and pooled depth`,
);
