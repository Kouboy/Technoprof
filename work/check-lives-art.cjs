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
const ctx = { RADIATION_DATA: "data:image/png;base64,AA==" };
vm.createContext(ctx);
vm.runInContext(
  require("node:module").stripTypeScriptTypes(
    ["small-lettering", "cadre", "lives", "lives-art"]
      .map((n) => strip(fs.readFileSync("src/" + n + ".ts", "utf8")))
      .join("\n"),
  ) + ";this.api={LivesArt,drawLifeCount};",
  ctx,
);
const drawings = [],
  graphics = () => {
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
const image = {
  visible: false,
  setVisible(v) {
    this.visible = v;
    return this;
  },
};
for (const n of ["setOrigin", "setDisplaySize", "setDepth", "setAlpha"])
  image[n] = () => image;
const art = new ctx.api.LivesArt({
  add: { graphics, image: () => image },
  textures: { get: () => ({ setFilter() {} }) },
});
art.hud(3);
assert(drawings[0].rects.length > 60, "recognizable multi-tone tiny head");
for (const r of drawings[0].rects)
  assert(
    [r.x, r.y, r.w, r.h].every(Number.isInteger) &&
      r.x >= 264 &&
      r.x + r.w <= 312 &&
      r.y >= 7 &&
      r.y + r.h <= 34,
    "HUD in reserved upper-right area",
  );
art.hide();
assert(drawings.every((g) => g.rects.length === 0));
for (const age of [0, 0.79, 0.8, 1.2, 2.5]) {
  art.hide();
  art.loss(3, 2, age);
  assert(!image.visible);
  assert(drawings.some((g) => g.rects.length > 60));
}
art.hide();
art.radiation(0.4);
assert(image.visible);
assert.equal(drawings[1].rects.length, 0, "stamp waits for its impact");
art.hide();
art.radiation(0.8);
assert(drawings[1].rects.length > 50, "large readable red stamp");
art.hide();
assert(!image.visible, "radiation clears before title or restart");
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
