const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
const scope = {};
vm.createContext(scope);
vm.runInContext(
  stripTypeScriptTypes(
    ["small-lettering", "school-signage"]
      .map((f) => strip(fs.readFileSync(`src/${f}.ts`, "utf8")))
      .join("\n"),
    { mode: "transform" },
  ),
  scope,
);
function render(
  style,
  kind,
  x = 22,
  y = 35,
  lines = ["AILE C / 1ER ETAGE", "C30-C45 / ESCALIER"],
) {
  const calls = [];
  const g = {
    fillStyle(...a) {
      calls.push(["color", ...a]);
    },
    fillRect(...a) {
      calls.push(["rect", ...a]);
    },
  };
  const bounds = scope.drawSchoolSign(g, style, x, y, lines, true, kind);
  return { calls, bounds };
}
// Signs at scene edges must remain fully visible without shrinking the bitmap text.
for (const style of ["ormeaux", "berthelot", "trois-ponts"]) {
  for (const kind of ["direction", "room", "paper", "warning"]) {
    const { calls, bounds: b } = render(style, kind, 310.4, 138.8);
    assert(
      b.x >= 9 && b.y >= 9 && b.x + b.width <= 311 && b.y + b.height <= 141,
    );
    assert(
      b.width >= scope.smallWidth("C30-C45 / ESCALIER") + 12,
      "no cropped lettering",
    );
    for (const c of calls.filter((c) => c[0] === "rect")) {
      const [, x, y, w, h] = c;
      assert([x, y, w, h].every(Number.isInteger), "sharp logical pixels");
      assert(w > 0 && h > 0);
      assert(
        x >= 7 && y >= 7 && x + w <= 313 && y + h < 144,
        "all mounting and wear inside scene wall",
      );
    }
    const finalText = [];
    const textInk = {
      fillStyle(...a) {
        finalText.push(["color", ...a]);
      },
      fillRect(...a) {
        finalText.push(["rect", ...a]);
      },
    };
    ["AILE C / 1ER ETAGE", "C30-C45 / ESCALIER"].forEach((s, i) =>
      scope.smallPrint(textInk, b.x + 6, b.y + 4 + i * 8, s, b.textColor),
    );
    assert.deepEqual(
      calls.slice(-finalText.length),
      finalText,
      "wear never overwrites letters",
    );
    assert.deepEqual(
      render(style, kind),
      render(style, kind),
      "stable fixtures across revisits",
    );
  }
}
assert.notDeepEqual(
  render("ormeaux", "direction").calls,
  render("berthelot", "direction").calls,
);
assert.notDeepEqual(
  render("berthelot", "direction").calls,
  render("trois-ponts", "direction").calls,
);
assert.notDeepEqual(
  render("ormeaux", "room").calls,
  render("ormeaux", "paper").calls,
);
console.log(
  "School signage: visible bounds, integer glyphs, protected text and stable material families OK",
);
