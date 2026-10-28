const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const file = "src/prepared-texture.ts";
assert(
  fs.existsSync(file),
  "immutable prepared textures must avoid CanvasTexture snapshots",
);
const source = fs
  .readFileSync(file, "utf8")
  .replace(/^import[^\n]+\n/gm, "")
  .replaceAll("export ", "");
const scope = {
  Phaser: {
    Textures: { Events: { ADD: "addtexture", ADD_KEY: "addtexture-" } },
  },
};
vm.createContext(scope);
vm.runInContext(
  require("node:module").stripTypeScriptTypes(source) +
    ";this.addPreparedTexture=addPreparedTexture;",
  scope,
);
const canvas = {
  width: 64,
  height: 32,
  getContext() {
    throw Error("no pixel readback during registration");
  },
};
const events = [],
  frames = [],
  texture = {
    add: (...args) => frames.push(args),
    getSourceImage: () => canvas,
  };
let duplicate = false;
const scene = {
  textures: {
    create(key, source, w, h) {
      assert.equal(key, "test");
      assert.equal(source, canvas);
      assert.equal(w, 64);
      assert.equal(h, 32);
      return duplicate ? null : texture;
    },
    emit(...args) {
      assert.equal(frames.length, 1, "base exists before observers run");
      events.push(args);
    },
  },
};
assert.equal(scope.addPreparedTexture(scene, "test", canvas), texture);
assert.deepEqual(frames, [["__BASE", 0, 0, 0, 64, 32]]);
assert.deepEqual(events, [
  ["addtexture", "test", texture],
  ["addtexture-test", texture],
]);
assert.equal(texture.getSourceImage(), canvas);
assert.equal(texture.imageData, undefined);
assert.equal(texture.buffer, undefined);
duplicate = true;
assert.equal(scope.addPreparedTexture(scene, "test", canvas), null);
assert.equal(events.length, 2);
console.log(
  "PASS immutable texture: same source/base frame and add events, no pixel readback/snapshot, duplicate key unchanged",
);
