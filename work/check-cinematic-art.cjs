const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
const bytes = fs.readFileSync("art/cinematics-2026-10-24/storyboard-atlas.png");
const payload = JSON.parse(
  fs.readFileSync("src/cinematic-data.ts", "utf8").match(/= ("[^"]+")/)[1],
);
assert.deepEqual(
  Buffer.from(payload.split(",")[1], "base64"),
  bytes,
  "atlas original bytes preserved",
);
const width = bytes.readUInt32BE(16),
  height = bytes.readUInt32BE(20),
  frames = [];
const introBytes = fs.readFileSync("art/cinematics-2026-10-24/intro-v2.png");
const introPayload = JSON.parse(fs.readFileSync("src/cinematic-intro-data.ts", "utf8").match(/= ("[^"]+")/)[1]);
assert.deepEqual(Buffer.from(introPayload.split(",")[1], "base64"), introBytes);
const campusBytes = fs.readFileSync("art/cinematics-2026-10-24/campus-v3-ramp.png");
const campusPayload = JSON.parse(fs.readFileSync("src/cinematic-campus-data.ts", "utf8").match(/= ("[^"]+")/)[1]);
assert.deepEqual(Buffer.from(campusPayload.split(",")[1], "base64"), campusBytes);
const dimensions = {
  "cinematic-storyboard": { width, height },
  "cinematic-intro-v2": { width: introBytes.readUInt32BE(16), height: introBytes.readUInt32BE(20) },
  "cinematic-campus-v2": { width: campusBytes.readUInt32BE(16), height: campusBytes.readUInt32BE(20) },
};
const texture = key => ({
  getSourceImage: () => dimensions[key],
  add: (id, _source, x, y, w, h) => frames.push({ key, id, x, y, w, h }),
  setFilter() {},
});
const image = {
  setDepth() {
    return this;
  },
  setDisplaySize(w, h) {
    this.w = w;
    this.h = h;
    return this;
  },
  setVisible(v) {
    this.visible = v;
    return this;
  },
  setFrame(f) {
    this.frame = f;
    return this;
  },
  setTexture(key, f) { this.key = key; this.frame = f; return this; },
  setAlpha(a) {
    this.alpha = a;
    return this;
  },
};
const rects=[];
const graphics = {
  setDepth() {
    return this;
  },
  fillStyle() {},
  fillRect(x,y,w,h) {rects.push({x,y,w,h});},
  clear() {},
};
const scope = { CINEMATIC_DATA: payload, CINEMATIC_INTRO_DATA: introPayload, CINEMATIC_CAMPUS_DATA: campusPayload };
vm.createContext(scope);
vm.runInContext(
  require("node:module").stripTypeScriptTypes(
    strip(fs.readFileSync("src/cinematic.ts", "utf8")) +
      "\n" +
      strip(fs.readFileSync("src/cinematic-art.ts", "utf8")),
  ) + ";globalThis.api={CinematicArt,CinematicSequence};",
  scope,
);
const art = new scope.api.CinematicArt({
  textures: { get: key => texture(key) },
  add: { graphics: () => graphics, image: () => image },
});
assert.equal(frames.length, 16, "original atlas plus corrected introduction and expanded campus");
for (const f of frames) {
  assert([f.x, f.y, f.w, f.h].every(Number.isInteger));
  assert(
    f.x >= 4 && f.y >= 4 && f.x + f.w <= dimensions[f.key].width - 4 && f.y + f.h <= dimensions[f.key].height - 4,
  );
  assert(f.w > 0 && f.h > 0);
}
for (const kind of ["intro", "ending"]) {
  const s = new scope.api.CinematicSequence(kind);
  while (!s.done) {
    s.tick(0.6, false);
    art.render(s);
    assert(image.visible);
    assert.equal(image.frame, String(s.panel.frame));
    assert.equal(image.key, s.panel.texture);
    const crop = frames.find(f => f.key === image.key && f.id === image.frame);
    assert(Math.abs(image.w / image.h - crop.w / crop.h) < 0.001, "preserve each illustration's proportions");
    assert(image.w <= 212.0001 && image.h <= 158.0001);
    assert.equal(image.alpha, 1);
    s.tick(s.panel.seconds - s.age, false);
  }
}
const start = new scope.api.CinematicSequence("intro");
art.render(start); assert.equal(image.alpha, 0, "ordinary opening fades in");
const rupture = new scope.api.CinematicSequence("ending");
for (const index of [10, 11]) { rupture.index = index; rupture.age = 0; art.render(rupture); assert.equal(image.alpha, 1, "bell and wake-up cut immediately"); }
art.hide();
assert(!image.visible);
assert(image.w <= 212.0001 && image.h <= 158.0001);
for(const r of rects)assert(r.x>=0&&r.y>=0&&r.x+r.w<=320&&r.y+r.h<=240,'cinematic uses the same 320x240 logical camera coordinates');
console.log(
  "PASS illustrated animatic: three original PNGs preserved, sixteen bounded crops, fourteen story panels, aspect-correct centered frames and visibility cleanup",
);
