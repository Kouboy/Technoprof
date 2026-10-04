const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { createGame } = require("./test-harness.cjs");
function ready(fps, mode, pattern, old = false) {
  const t = createGame(),
    g = t.g;
  g.workshop = true;
  g.controls = new t.api.ActionInput();
  g.keys = g.controls.keys;
  g.physicalKeys = Object.fromEntries(
    Object.values(t.api.BINDINGS)
      .flat()
      .map((k) => [k, { isDown: false, just: false }]),
  );
  g.direct = new t.api.DirectInput(g);
  g.loadScenario("hanouna-navigation-h1-boss");
  g.direct.tick(0);
  const tap = (x, y) => {
    g.direct.down(1, x, y);
    g.direct.up(1, x, y);
  };
  const action = () => {
    if (mode === "keyboard") g.physicalKeys.F.just = true;
    else
      tap(g.encounterTime ? g.px : g.enemies[0].x, g.encounterTime ? 164 : 110);
  };
  for (let i = 0; g.encounterTime && i < 16; i++) {
    action();
    t.step(1000 / fps);
  }
  assert(!g.encounterTime);
  const e = g.enemies[0];
  // Isolated fight starts at a credible approach distance. No extra HP or protection.
  g.px = 120;
  g.face = 1;
  g.inv = 0;
  e.x = 200;
  e.pattern = pattern;
  if (old) {
    const tuning = g.enemyTuning();
    g.enemyTuning = () => ({
      ...tuning,
      boss: {
        ...tuning.boss,
        stampWind: 0.4,
        sweepWind: 0.55,
        recovery: 0.65,
        cooldown: 0.5,
      },
    });
  }
  const clear = () => {
    for (const k of Object.values(g.physicalKeys)) k.isDown = false;
  };
  const move = (x) => {
    if (mode === "keyboard") {
      if (Math.abs(x - g.px) > 1)
        g.physicalKeys[x > g.px ? "D" : "Q"].isDown = true;
    } else if (g.direct.intent?.kind !== "walk") tap(x, 164);
  };
  return { ...t, e, action, tap, clear, move };
}
function counterFight(fps, mode, pattern, old = false) {
  const t = ready(fps, mode, pattern, old),
    g = t.g,
    e = t.e;
  let stage = "wait",
    since = 0,
    attempts = 0,
    releases = 0;
  for (let i = 0; i < fps * 45 && e.hp > 0 && g.phase === "school"; i++) {
    t.clear();
    const before = e.wind;
    if (stage === "wait" && e.wind > 0) stage = "evade";
    if (stage === "evade") t.move(e.x - 100);
    else if (stage === "reaction") {
      since += 1 / fps;
      if (since >= 0.35) stage = "return";
    } else if (stage === "return") {
      if (e.x - g.px > 66) t.move(e.x - 64);
      else {
        t.action();
        stage = "swing";
        attempts++;
      }
    } else if (stage === "swing" && !g.attack && !g.playerRecovery) {
      if (old) break;
      stage = "wait";
    }
    t.step(1000 / fps);
    if (before > 0 && e.wind <= 0 && e.strikeTime > 0) {
      stage = "reaction";
      since = 0;
      releases++;
    }
  }
  const contacts = g.session.events.filter(
    (v) => v.room === 207 && v.kind === "contact",
  );
  const hurts = g.session.events.filter(
    (v) => v.room === 207 && v.kind === "hurt",
  );
  if (old)
    assert.equal(
      contacts.length,
      0,
      "old 650ms window closes before a delayed return",
    );
  else {
    assert.equal(
      e.hp,
      0,
      JSON.stringify({
        fps,
        mode,
        pattern,
        stage,
        x: g.px,
        enemyX: e.x,
        hp: g.hp,
        attempts,
        releases,
      }),
    );
    assert.equal(contacts.length, 6);
    assert.equal(
      hurts.length,
      0,
      "retreat and delayed counter must not require damage trading",
    );
    assert(
      releases >= 6,
      "one deliberate counter per attack, several reads required",
    );
  }
  return {
    fps,
    mode,
    first: pattern % 2 ? "sweep" : "stamp",
    old,
    attempts,
    releases,
    contacts: contacts.length,
    hp: g.hp,
  };
}
const results = [];
for (const fps of [30, 60, 120])
  for (const mode of ["keyboard", "direct"])
    for (const pattern of [0, 1]) {
      results.push(counterFight(fps, mode, pattern, true));
      results.push(counterFight(fps, mode, pattern));
    }
// H1 boss specialization must leave ordinary pressure and published/A3 boss values intact.
const t = ready(60, "keyboard", 0),
  h1 = t.g.enemyTuning();
t.g.loadScenario("bruel-navigation-a3");
const a3 = t.g.enemyTuning();
for (const key of [
  "student",
  "parent",
  "guard",
  "security",
  "thrower",
  "filmer",
])
  assert.deepEqual(h1[key], a3[key]);
assert.equal(a3.boss.recovery, 0.65);
t.g.navigationProfile = false;
assert.equal(t.g.enemyTuning().boss.recovery, 1.1);
// Pause/focus cannot spend the opening or cause an automatic strike on resume.
const p = ready(60, "keyboard", 0),
  g = p.g,
  e = p.e;
e.wind = 0;
e.strikeTime = 0;
e.recovery = 0.8;
g.px = e.x - 64;
g.setPaused(true);
p.advance(2);
assert.equal(e.recovery, 0.8);
g.setPaused(false);
g.setWorkshopFocus(true);
p.advance(2);
assert.equal(e.recovery, 0.8);
g.setWorkshopFocus(false);
g.setPaused(false);
p.action();
p.advance(0.2);
assert.equal(e.hp, 5);
// Striking into the still-visible kick is blocked; opening starts after that pose.
const k = ready(60, "keyboard", 1);
k.g.px = k.e.x - 64;
k.e.wind = 0;
k.e.strikeTime = 0.36;
k.e.recovery = 1.35;
k.action();
k.advance(0.2);
assert.equal(k.e.hp, 6);
assert(k.g.session.events.some((v) => v.kind === "blocked"));
k.advance(0.4);
k.action();
k.advance(0.2);
assert.equal(k.e.hp, 5);
// Repeated strikes can use the opening but cannot extend it until the K.O.
const spam = ready(60, "keyboard", 0);
spam.g.px = spam.e.x - 64;
spam.e.wind = spam.e.strikeTime = 0;
spam.e.recovery = 1.35;
for (let i = 0; i < 60 * 5 && spam.e.wind <= 0 && spam.e.hp > 0; i++) {
  spam.clear();
  if (spam.e.x - spam.g.px > 67) spam.move(spam.e.x - 64);
  else if (!spam.g.attack) spam.action();
  spam.step(1000 / 60);
}
assert(
  spam.e.hp > 0 && spam.e.wind > 0,
  "opening expires and boss attacks again despite repeated strikes",
);
fs.writeFileSync(
  "work/inspector-h1-results.json",
  JSON.stringify(
    { delayedCounters: results, pause: true, poseMatchesOpening: true },
    null,
    2,
  ) + "\n",
);
console.log(
  "PASS H1 Inspector: 12 old-window reproductions, 12 six-hit no-damage fights after 350ms reaction/retreat/return, keyboard/direct 30/60/120fps; pose/opening alignment, pause/focus and unchanged ordinary/A3/published tuning.",
);
