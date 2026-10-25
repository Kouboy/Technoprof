const assert = require("node:assert/strict");
const fs = require("node:fs"),
  vm = require("node:vm");
const { stripTypeScriptTypes } = require("node:module");
assert(
  fs.existsSync("src/game-window.ts"),
  "dedicated window controller exists",
);
const source = stripTypeScriptTypes(
  fs.readFileSync("src/game-window.ts", "utf8").replace(/export /g, ""),
);
function fixture({
  blocked = false,
  dedicated = false,
  denied = false,
  width = 1000,
  height = 800,
} = {}) {
  const classes = new Set(),
    events = {},
    nodes = {};
  function element(id) {
    return (nodes[id] = {
      children: [],
      textContent: "",
      hidden: false,
      id,
      append(...children) {
        this.children.push(...children);
      },
      setAttribute(key, value) {
        this[key] = value;
      },
      focus() {},
      getBoundingClientRect() {
        return { height: id === "player-toolbar" ? 40 : 20 };
      },
    });
  }
  ["player-toolbar", "player-feedback", "game"].forEach(element);
  let opens = 0,
    pauses = 0,
    focused = 0;
  const popup = {
    closed: false,
    focus() {
      focused++;
    },
  };
  const sizes = {};
  const body = {
    classList: {
      toggle(k, on) {
        if (on) classes.add(k);
        else classes.delete(k);
      },
      contains(k) {
        return classes.has(k);
      },
    },
    style: {
      setProperty(k, v) {
        sizes[k] = v;
      },
    },
  };
  const doc = {
    body,
    fullscreenElement: null,
    fullscreenEnabled: true,
    getElementById: (id) => nodes[id],
    createElement: (tag) => element(tag),
    addEventListener(type, handler) {
      events[type] = handler;
    },
    documentElement: {
      async requestFullscreen() {
        if (denied) throw Error("denied");
        doc.fullscreenElement = this;
        events.fullscreenchange();
      },
    },
    async exitFullscreen() {
      doc.fullscreenElement = null;
      events.fullscreenchange();
    },
  };
  const location = {
    href:
      "file:///C:/Jeu/Jouer-Technoprof-Journee-Atelier.html?musique=essai" +
      (dedicated ? "&fenetre=1" : ""),
  };
  let requested;
  const win = {
    location,
    innerWidth: width,
    innerHeight: height,
    screen: { availWidth: 1600, availHeight: 1000 },
    open(...args) {
      opens++;
      requested = args;
      return blocked ? null : popup;
    },
    addEventListener() {},
  };
  const ctx = {
    window: win,
    document: doc,
    URL,
    Math,
    requestAnimationFrame: (cb) => cb(),
    getComputedStyle: () => ({
      paddingTop: "0",
      paddingBottom: "0",
      paddingLeft: "0",
      paddingRight: "0",
    }),
  };
  vm.createContext(ctx);
  vm.runInContext(source + ";globalThis.install=installGameWindow;", ctx);
  ctx.install(() => {
    pauses++;
  });
  const button = (text) =>
    nodes["player-toolbar"].children.find((n) => n.textContent === text);
  return {
    button,
    classes,
    doc,
    popup,
    get opens() {
      return opens;
    },
    get pauses() {
      return pauses;
    },
    get focused() {
      return focused;
    },
    get requested() {
      return requested;
    },
    nodes,
    sizes,
  };
}
(async () => {
  const f = fixture();
  assert(
    f.classes.has("player-screen"),
    "all player views use the fitted frame",
  );
  assert.equal(
    f.sizes["--window-game-width"],
    "1000px",
    "no reserved external toolbar or feedback space",
  );
  const large = fixture({ dedicated: true, width: 1920, height: 1080 });
  assert.equal(
    large.sizes["--window-game-width"],
    "1440px",
    "4:3 fills 1080p height without 960px cap",
  );
  f.button("Ouvrir dans une fenêtre").onclick();
  assert.equal(f.opens, 1);
  assert.equal(f.pauses, 1);
  assert.equal(new URL(f.requested[0]).searchParams.get("fenetre"), "1");
  assert.equal(new URL(f.requested[0]).searchParams.get("musique"), "essai");
  assert(f.requested[2].includes("popup"));
  assert(f.requested[2].includes("width="));
  f.button("Ouvrir dans une fenêtre").onclick();
  assert.equal(f.opens, 1, "reuse without reloading the run");
  f.popup.closed = true;
  f.button("Ouvrir dans une fenêtre").onclick();
  assert.equal(f.opens, 2);
  const b = fixture({ blocked: true });
  b.button("Ouvrir dans une fenêtre").onclick();
  assert(
    b.nodes["player-toolbar"].children.some((n) =>
      n.textContent.includes("bloqué"),
    ),
    "popup failure explained",
  );
  assert(b.button("Adapter cet onglet"), "same-tab fallback stays available");
  b.button("Adapter cet onglet").onclick();
  assert(b.classes.has("dedicated-window"));
  const d = fixture({ dedicated: true });
  assert(d.classes.has("dedicated-window"));
  assert(!d.button("Ouvrir dans une fenêtre"), "no recursive launch button");
  await f.button("Plein écran").onclick();
  assert(f.classes.has("dedicated-window"));
  await f.button("Quitter le plein écran").onclick();
  assert(!f.classes.has("dedicated-window"));
  await d.button("Plein écran").onclick();
  await d.button("Quitter le plein écran").onclick();
  assert(
    d.classes.has("dedicated-window"),
    "popup mode survives fullscreen exit",
  );
  const denied = fixture({ denied: true });
  await denied.button("Plein écran").onclick();
  assert(!denied.classes.has("dedicated-window"));
  assert(denied.button("Plein écran"));
  assert(
    denied.nodes["player-toolbar"].children.some((n) =>
      n.textContent.includes("indisponible"),
    ),
  );
  console.log(
    "PASS window gesture, query, reuse, blocked fallback, fullscreen enter/exit/rejection and dedicated mode",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
