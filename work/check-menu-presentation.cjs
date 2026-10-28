const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
assert(
  fs.existsSync("src/menu-presentation.ts"),
  "dedicated native menu bitmap presentation",
);
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
const contexts = [];
const scope = {
  document: {
    createElement(tag) {
      assert.equal(tag, "canvas");
      const marks = [],
        canvas = {
          style: {},
          className: "",
          setAttribute(k, v) {
            this[k] = v;
          },
          getContext() {
            return {
              set fillStyle(v) {},
              fillRect(...r) {
                marks.push(r);
              },
            };
          },
        };
      contexts.push({ canvas, marks });
      return canvas;
    },
  },
};
vm.createContext(scope);
vm.runInContext(
  require("node:module").stripTypeScriptTypes(
    strip(
      fs
        .readFileSync("src/cadre.ts", "utf8")
        .split("export const cleanText")[0],
    ) + strip(fs.readFileSync("src/menu-presentation.ts", "utf8")),
  ) + ";this.render=paintMenuLabel;",
  scope,
);
const action = () => {};
function label(text, tagName = "BUTTON") {
  return {
    tagName,
    textContent: text,
    className: "primary",
    children: [],
    onclick: action,
    attrs: {},
    append(node) {
      this.children.push(node);
      node.parentNode = this;
    },
    setAttribute(k, v) {
      this.attrs[k] = v;
    },
  };
}
for (const [text, tag] of [
  ["Reprendre", "BUTTON"],
  ["Service suspendu", "H1"],
  ["Réglages", "BUTTON"],
  ["CADRE / PERSONNEL REMPLAÇANT", "SMALL"],
]) {
  const node = label(text, tag);
  scope.render(node);
  assert.equal(node.textContent, text, "native text retained");
  assert.equal(node.onclick, action, "bitmap never owns input");
  assert.equal(node.attrs["aria-label"], text);
  assert.equal(node.children.length, 1);
  const { canvas, marks } = contexts.at(-1);
  assert.equal(canvas["aria-hidden"], "true");
  assert(canvas.width > 0 && canvas.height === 7);
  assert(marks.length > 10);
  assert(
    marks.every((r) => r.every(Number.isInteger)),
    "integer bitmap cells",
  );
  assert(
    marks.every(
      ([x, y, w, h]) => x >= 0 && y >= 0 && x + w <= canvas.width && y + h <= 7,
    ),
    "no clipped glyph",
  );
}
scope.render(label("Réglages"));
const accent = contexts.at(-1);
scope.render(label("REGLAGES"));
const ascii = contexts.at(-1);
assert.deepEqual(
  accent.marks,
  ascii.marks,
  "French accents normalize to existing game glyphs",
);
const changing = label("Couper le son (M)");
scope.render(changing);
const count = contexts.length;
scope.render(changing);
assert.equal(
  contexts.length,
  count,
  "steady UI cannot allocate canvases each frame",
);
changing.children = [];
changing.textContent = "Rétablir le son (M)";
scope.render(changing);
assert.equal(contexts.length, count + 1);
assert.equal(
  changing.attrs["aria-label"],
  "Rétablir le son (M)",
  "dynamic labels stay accessible",
);
assert.equal(
  changing.className.split(" ").filter((c) => c === "menu-bitmap").length,
  1,
);
console.log(
  "PASS menu bitmap: shared game glyphs, native labels/actions retained, integer cells, no input interception",
);
