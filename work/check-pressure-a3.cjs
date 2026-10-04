const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { createGame } = require("./test-harness.cjs");
function ready(revision, room, fps = 60) {
  const t = createGame(),
    g = t.g;
  g.workshop = true;
  g.loadScenario("bruel-navigation-" + revision.toLowerCase());
  if (g.room !== room) g.enterRoom(room, 150);
  t.advance(0.4, fps);
  for (let i = 0; g.encounterTime && i < 14; i++) t.press("X");
  assert.equal(g.encounterTime, 0);
  // Isolated cadence/contact preset. After setup, all responses use gameplay update.
  const e = g.enemies[0];
  g.px = e.x - 40;
  g.face = 1;
  return { ...t, e };
}
const cadence = [];
for (const fps of [30, 60, 120])
  for (const room of [100, 101, 110, 111]) {
    const measures = [];
    for (const revision of ["A2", "A3"]) {
      const t = ready(revision, room, fps),
        g = t.g,
        e = t.e;
      g.inv = 999; // Only cadence test suppresses harm, so deaths don't truncate the sample.
      let first = null,
        releases = 0,
        windFrames = 0;
      for (let i = 0; i < fps * 16; i++) {
        const before = e.wind;
        t.step(1000 / fps);
        if (e.wind > 0) windFrames++;
        if (
          before > 0 &&
          e.wind <= 0 &&
          (e.strikeTime > 0 || e.chargeTime > 0)
        ) {
          releases++;
          first ??= (i + 1) / fps;
        }
      }
      assert(first !== null);
      measures.push({ revision, first, releases, windFrames });
    }
    assert(
      measures[1].first < measures[0].first * 0.75,
      JSON.stringify({ fps, room, measures }),
    );
    assert(
      measures[1].releases >= measures[0].releases * 1.5,
      "more actual releases, not just a smaller unused constant",
    );
    assert(
      measures[1].windFrames >= fps * 0.3,
      "preparation is visible in context",
    );
    cadence.push({ fps, room, measures });
  }
const pressure = [];
for (const fps of [30, 60, 120])
  for (const room of [100, 101, 110]) {
    const runs = [];
    for (const revision of ["A2", "A3"]) {
      const t = ready(revision, room, fps),
        g = t.g,
        e = t.e;
      for (let i = 0; i < fps * 10 && e.hp > 0 && g.phase === "school"; i++) {
        // Repeat attacks and close the distance, without dodging or modifying AI.
        g.keys.RIGHT.isDown = e.x - g.px > 40;
        if (!g.attack && !g.hitStop && !g.playerRecovery) g.keys.X.just = true;
        t.step(1000 / fps);
      }
      assert(e.hp <= 0);
      runs.push({
        revision,
        hp: g.hp,
        releases: g.session.events.filter(
          (v) => v.kind === "enemy-attack" && v.data.stage === "release",
        ).length,
      });
    }
    assert(
      runs[1].releases > 0,
      "repeated hits cannot indefinitely silence the enemy",
    );
    assert(
      runs[1].hp < runs[0].hp,
      "same careless approach must have an observable cost",
    );
    const dodge = ready("A3", room, fps),
      g = dodge.g,
      e = dodge.e;
    for (let i = 0; i < fps * 15 && e.hp > 0; i++) {
      g.keys.RIGHT.isDown = false;
      if (e.wind > 0) {
        if (g.py === 159) g.keys.SPACE.just = true;
      } else if (!g.attack && !g.hitStop && !g.playerRecovery && g.py > 130) {
        if (e.x - g.px > 40) g.keys.RIGHT.isDown = true;
        else g.keys.X.just = true;
      }
      dodge.step(1000 / fps);
    }
    assert(e.hp <= 0, "responsive play can defeat the enemy");
    assert(
      g.hp > runs[1].hp,
      JSON.stringify({
        fps,
        room,
        runs,
        dodgeHp: g.hp,
        events: g.session.events.filter((v) =>
          ["hurt", "enemy-attack"].includes(v.kind),
        ),
      }),
    );
    pressure.push({ fps, room, runs, dodgeHp: g.hp });
  }
// Dialogue and pause remain protected even with fast attacks.
const t = createGame(),
  g = t.g;
g.workshop = true;
g.loadScenario("bruel-navigation-a3");
const snapshot = [g.hp, g.enemies[0].x, g.enemies[0].cool, g.remaining];
t.advance(40, 60);
assert.deepEqual(
  [g.hp, g.enemies[0].x, g.enemies[0].cool, g.remaining],
  snapshot,
);
const p = ready("A3", 100);
p.e.cool = 0;
p.step();
assert(p.e.wind > 0);
const wind = p.e.wind;
p.g.setPaused(true);
p.advance(3);
assert.equal(p.e.wind, wind);
fs.writeFileSync(
  "work/pressure-a3-results.json",
  JSON.stringify(
    {
      method:
        "Cadence uses declared invulnerability only to avoid truncation; pressure/dodge use real health, movement and attacks; not human gamefeel validation.",
      cadence,
      pressure,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "PASS A3: 12 A2/A3 cadence comparisons, 9 careless-vs-dodge comparisons at 30/60/120 fps, protected dialogue and paused preparation.",
);
