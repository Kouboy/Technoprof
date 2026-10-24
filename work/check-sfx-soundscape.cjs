const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
const scope = {};
vm.createContext(scope);
vm.runInContext(
  require("node:module").stripTypeScriptTypes(
    strip(fs.readFileSync("src/soundscape.ts", "utf8")),
  ) + ";globalThis.api={floorSound,passageSound,walkContacts};",
  scope,
);
const { floorSound, passageSound, walkContacts } = scope.api;
const room = (name, floor = 0, frame = 1, care = false) => ({
  name,
  frame,
  navigation: { floor },
  care: care ? {} : undefined,
});
assert.equal(floorSound(1, room("GALERIE B", 1)), "wood");
assert.equal(floorSound(1, room("INFIRMERIE", 1, 1, true)), "tile");
assert.equal(floorSound(0, room("GALERIE C", 1)), "tile");
assert.equal(floorSound(2, room("ATELIER", 0)), "concrete");
assert.equal(floorSound(2, room("PALIER TECHNIQUE", 1)), "metal");
assert.equal(floorSound(2, room("COUR TECHNIQUE", 0, 0)), "concrete");
assert.equal(passageSound(room("HALL"), room("GALERIE"), true), "passage");
assert.equal(
  passageSound(room("GALERIE"), room("INFIRMERIE", 0, 1, true), false),
  "door",
);
assert.equal(
  passageSound(room("ESCALIER", 0), room("PALIER", 1), false),
  "stairs",
);
assert.equal(passageSound(room("COUR", 0, 0), room("VESTIBULE"), true), "door");
for (const fps of [30, 60, 120]) {
  let phase = 0,
    hits = 0;
  for (let i = 0; i < fps * 2; i++) {
    const next = phase + 13 / fps;
    hits += walkContacts(phase, next);
    phase = next;
  }
  assert.equal(hits, 8, `walking cadence stable ${fps}`);
}
assert.equal(walkContacts(4, 4), 0);
assert.equal(walkContacts(0, 40), 1, "slow frames do not backlog footsteps");
console.log(
  "PASS SFX soundscape: floor identities, real passages and animation contacts at 30/60/120 fps",
);
