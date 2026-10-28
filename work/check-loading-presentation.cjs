const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const ids = Object.fromEntries(
  [
    "loading",
    "loading-stage",
    "loading-progress",
    "loading-retry",
    "player-panel",
  ].map((id) => [
    id,
    {
      hidden: id === "loading-retry",
      removeAttribute(name) {
        delete this[name];
      },
    },
  ]),
);
const context = {
  document: { getElementById: (id) => ids[id] },
  location: {
    reload() {
      context.reloaded = true;
    },
  },
};
vm.createContext(context);
vm.runInContext(
  stripTypeScriptTypes(
    fs
      .readFileSync("src/loading-presentation.ts", "utf8")
      .replace(/export /g, ""),
  ) +
    ";globalThis.api={installLoadingPresentation,prepareLoadingPresentation,finishLoadingPresentation}",
  context,
);
const handlers = {},
  loader = {
    on(name, fn) {
      handlers[name] = fn;
    },
  };
context.api.installLoadingPresentation(loader);
assert.equal(ids["loading-progress"].value, 0);
handlers.progress(0.4);
assert.equal(ids["loading-progress"].value, 0.4);
handlers.complete();
assert(
  !("value" in ids["loading-progress"]),
  "preparation is not a false 100% ready",
);
assert.match(ids["loading-stage"].textContent, /Préparation/);
context.api.finishLoadingPresentation();
assert(ids.loading.hidden);
context.api.installLoadingPresentation(loader);
handlers.loaderror();
assert.equal(
  context.api.prepareLoadingPresentation(),
  false,
  "do not construct sprites from missing images",
);
handlers.progress(1);
handlers.complete();
context.api.finishLoadingPresentation();
assert(!ids.loading.hidden);
assert.match(ids["loading-stage"].textContent, /interrompu/);
assert(!ids["loading-retry"].hidden);
assert(ids["player-panel"].hidden && ids["player-panel"].inert);
ids["loading-retry"].onclick();
assert(context.reloaded);
console.log(
  "PASS real loading progress, separate preparation, ready hide, persistent error and explicit reload",
);
const { g } = require("./test-harness.cjs").createGame();
g.loadingFailed = true;
g.keys = undefined;
g.draw = () => {
  throw Error("No rendering after a failed boot");
};
g.update(0, 16);
console.log(
  "PASS failed boot never enters game update with uninitialized art/input",
);
