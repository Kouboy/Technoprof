const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
const { g } = createGame({ policy: "three-required" });
const graphics = new Proxy({}, { get: () => () => graphics });
g.g = g.sceneGraphics = graphics;
g.txt = () => {};
g.drawRoad = () => {};
g.applyPresentation = () => {};
g.presentationHideHud = true;
g.cinematicArt = { hide() {}, render() {} };
g.sceneSurround = {
  ink: 42,
  visible: true,
  clear() {
    this.ink = 0;
  },
  setVisible(value) {
    this.visible = value;
    return this;
  },
};
const draw = () => Object.getPrototypeOf(g).draw.call(g);
g.startDay();
draw();
assert.equal(
  g.sceneSurround.ink,
  42,
  "intro must not erase the retained metal frame",
);
assert.equal(
  g.sceneSurround.visible,
  false,
  "hide game frame during illustrated film",
);
g.skipCinematic();
draw();
assert.equal(g.sceneSurround.visible, true, "frame restored after skip");
assert.equal(g.sceneSurround.ink, 42);
g.startDay(true);
draw();
g.cinematic.tick(11);
g.completeCinematic();
draw();
assert.equal(
  g.sceneSurround.visible,
  true,
  "frame restored after automatic intro completion",
);
assert.equal(g.sceneSurround.ink, 42);
console.log(
  "PASS retained frame survives intro, skip and automatic return to driving",
);
