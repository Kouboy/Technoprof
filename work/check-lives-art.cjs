const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
assert(
  fs.existsSync("src/lives-art.ts"),
  "lives portrait and loss/radiation presentation",
);
const embedded = JSON.parse(
  fs
    .readFileSync("src/radiation-data.ts", "utf8")
    .match(/export const RADIATION_DATA = ("[^"\n]+");/)[1],
);
assert.deepEqual(
  Buffer.from(embedded.split(",")[1], "base64"),
  fs.readFileSync("art/radiation-2026-10-26/radiation.png"),
  "selected radiation illustration is embedded unchanged",
);
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
const ctx = {
  Phaser: { TintModes: { FILL: 1 } },
  RADIATION_DATA: "data:image/png;base64,AA==",
  // The stripped import uses this presentation-only texture registration stub.
  addPreparedTexture: (scene, key, canvas) =>
    scene.textures.addCanvas(key, canvas),
};
vm.createContext(ctx);
vm.runInContext(
  require("node:module").stripTypeScriptTypes(
    ["small-lettering", "cadre", "lives", "lives-art"]
      .map((n) => strip(fs.readFileSync("src/" + n + ".ts", "utf8")))
      .join("\n"),
  ) + ";this.api={LivesArt};",
  ctx,
);
const drawings = [],
  images = [],
  frames = [];
const graphics = () => {
  let color;
  const rects = [];
  const g = {
    rects,
    clear() {
      rects.length = 0;
      return this;
    },
    fillStyle(c) {
      color = c;
      return this;
    },
    fillRect(x, y, w, h) {
      rects.push({ x, y, w, h, color });
      return this;
    },
  };
  for (const n of ["setDepth", "setPosition", "setAngle", "setScale"])
    g[n] = () => g;
  drawings.push(g);
  return g;
};
function image(x, y, key, frame) {
  const im = {
    x,
    y,
    key,
    frame,
    visible: false,
    setVisible(v) {
      this.visible = v;
      return this;
    },
    setPosition(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
    setDisplaySize(w, h) {
      this.w = w;
      this.h = h;
      return this;
    },
    setAlpha(a) {
      this.alpha = a;
      return this;
    },
  };
  for (const n of [
    "setOrigin",
    "setDepth",
    "setTint",
    "setTintMode",
    "clearTint",
  ])
    im[n] = () => im;
  images.push(im);
  return im;
}
const cropCalls = [],
  pixels = new Uint8ClampedArray([
    110, 15, 115, 255, 130, 110, 85, 255, 110, 111, 109, 255,
  ]);
ctx.document = {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage(...a) {
        cropCalls.push(a);
      },
      getImageData: () => ({ data: pixels }),
      putImageData() {},
    }),
  }),
};
const texture = {
  getSourceImage: () => ({ teacher: true }),
  has: () => frames.length > 0,
  add(...args) {
    frames.push(args);
  },
  setFilter() {},
};
const art = new ctx.api.LivesArt({
  add: { graphics, image },
  textures: {
    get: () => texture,
    exists: () => false,
    addCanvas: () => texture,
  },
});
assert.equal(
  cropCalls.length,
  1,
  "face crop is prepared once from the original teacher atlas",
);
assert.deepEqual(cropCalls[0].slice(1), [163, 32, 94, 99, 0, 0, 94, 99]);
assert.equal(pixels[3], 0, "muted magenta edge pixels become transparent");
assert.equal(pixels[7], 255, "skin remains opaque");
assert.equal(pixels[11], 255, "grey hair remains opaque");
assert.deepEqual(
  frames,
  [["life-head", 0, 0, 0, 94, 99]],
  "portrait reuses the actual grey-haired profile frame",
);
art.hud(3);
assert(art.face.visible);
assert.equal(art.face.key, "life-profile");
assert.equal(art.face.frame, "life-head");
assert.deepEqual(
  [art.face.w, art.face.h],
  [14, 15],
  "smaller head with preserved proportions",
);
assert(drawings[0].rects.length > 20, "readable life number");
for (const r of drawings[0].rects) {
  assert.equal(r.h, 1, "HUD is only outlined pixel lettering, no cartouche");
  assert(
    [r.x, r.y, r.w, r.h].every(Number.isInteger) &&
      r.x >= 274 &&
      r.x + r.w <= 313 &&
      r.y >= 8 &&
      r.y + r.h <= 26,
    "compact upper-right bounds",
  );
}
art.hide();
assert(images.every((im) => !im.visible));
assert(drawings.every((g) => g.rects.length === 0));
const lossShapes = [];
for (const age of [0, 0.79, 0.8, 1.2, 2.5]) {
  art.hide();
  art.loss(3, 2, age);
  assert(!art.image.visible);
  assert(art.face.visible);
  assert.equal(
    art.face.frame,
    "life-head",
    "same actual profile during life loss",
  );
  assert.deepEqual([art.face.w, art.face.h], [42, 44]);
  if (age === 0 || age === 1.2)
    lossShapes.push(JSON.stringify(drawings[0].rects));
}
assert.notEqual(
  lossShapes[0],
  lossShapes[1],
  "central digit changes from old count to new",
);
art.hide();
art.radiation(0.4);
assert(art.image.visible);
assert(!art.face.visible);
assert.equal(drawings[1].rects.length, 0, "stamp waits for impact");
art.hide();
art.radiation(0.8);
assert(drawings[1].rects.length > 50);
art.hide();
assert(
  images.every((im) => !im.visible),
  "portrait and radiation clear before title",
);
const props = fs.readFileSync("src/school-props.ts", "utf8");
vm.runInContext(
  require("node:module").stripTypeScriptTypes(
    strip(fs.readFileSync("src/dialogue.ts", "utf8")) +
      "\n" +
      strip(
        props.slice(
          props.indexOf("export function dialogueLayout("),
          props.indexOf("export function drawDialogue("),
        ),
      ),
  ) + ";this.bubble=dialogueLayout;this.encounters=ENCOUNTERS;",
  ctx,
);
for (const data of Object.values(ctx.encounters))
  for (let page = 0; page < data.pages.length; page++) {
    const b = ctx.bubble(
      0,
      1,
      300,
      false,
      { page, characters: 0 },
      "B/X",
      data,
      258,
    );
    assert(
      b.x + b.w + 2 <= 264,
      "dialogue does not cover the upper-right life count",
    );
  }
console.log(
  "PASS tiny teacher portrait/count, reserved HUD bounds, central loss, timed radiation stamp and layer cleanup",
);
