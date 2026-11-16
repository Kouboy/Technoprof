const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
for (const name of ["lives-road-first", "lives-foot-second", "lives-final"]) {
  const { g } = createGame();
  g.workshop = true;
  g.loadScenario(name);
  assert.equal(
    g.workshopScenario,
    name,
    "Replay retains the authored life scenario",
  );
  assert.equal(g.phase, "fail");
  assert.equal(g.lives, name === "lives-final" ? 0 : 2);
  g.loadScenario(g.workshopScenario);
  assert.equal(g.phase, "fail");
}
for (const mission of [0, 1, 2])
  for (const reason of ["breakdown", "exhausted", "late"]) {
    const t = createGame({ policy: "three-required" }),
      g = t.g;
    g.validatedDay = true;
    g.startDay(false);
    g.mission = mission;
    g.begin();
    g.won = mission;
    assert.equal(g.lives, 3, "a new game has three lives");
    const session = g.session;
    for (let defeat = 1; defeat <= 3; defeat++) {
      g.phase = reason === "breakdown" ? "road" : "school";
      g.remaining = 8;
      g.vehicle = reason === "breakdown" ? 0 : 27;
      g.hp = 1;
      g.navigationCare.used = true;
      g.cleared.add(999);
      g.roomEnemies.set(999, []);
      g.finish(false, reason);
      g.finish(false, reason);
      assert.equal(
        g.lives,
        3 - defeat,
        "one loss only, even on duplicate finish",
      );
      t.advance(2.1);
      t.press("ENTER");
      assert.equal(g.phase, "lifeLost");
      g.next();
      assert.equal(
        g.phase,
        "lifeLost",
        "repeated continue cannot bypass the loss card",
      );
      assert.equal(g.lifeLossFrom, 4 - defeat);
      const age = g.age;
      g.setPaused(true);
      t.advance(4);
      assert.equal(g.age, age);
      g.setPaused(false);
      g.finish(false, reason);
      assert.equal(g.lives, 3 - defeat, "loss card cannot lose another life");
      t.advance(2.7);
      if (defeat < 3) {
        const schoolRetry = reason !== "breakdown";
        assert.equal(g.phase, schoolRetry ? "school" : "free");
        assert.equal(g.mission, mission);
        assert.equal(g.won, mission);
        assert.equal(g.hp, 5);
        assert.equal(g.vehicle, 100);
        assert.equal(g.road, 0);
        assert.equal(g.notified, schoolRetry);
        assert.equal(g.room, g.missionSpec().start);
        assert.equal(g.remaining, schoolRetry ? 120 : g.missionSpec().seconds);
        assert(!g.navigationCare.used && !g.recoveryScene.active);
        assert(!g.cleared.has(999));
        assert(!g.roomEnemies.has(999));
        assert.equal(g.session, session, "retry retains the run journal");
        assert.equal(g.results.length, defeat);
      } else {
        assert.equal(g.phase, "radiated");
        assert.equal(g.won, mission);
        const a = g.age;
        g.setPaused(true);
        t.advance(3);
        assert.equal(g.age, a);
        g.setPaused(false);
        g.finish(false, reason);
        assert.equal(g.lives, 0);
        t.advance(6.2);
        assert.equal(g.phase, "title");
      }
    }
    g.startDay(false);
    assert.equal(g.lives, 3);
    assert.equal(g.won, 0);
    assert.equal(g.mission, 0);
  }
for (const fps of [30, 60, 120]) {
  const t = createGame({ policy: "three-required" }),
    g = t.g;
  g.startDay(false);
  g.phase = "road";
  g.finish(false, "breakdown");
  t.advance(12.6, fps);
  assert.equal(
    g.phase,
    "lifeLost",
    "automatic music/silent exit shows the counter",
  );
  t.advance(2.7, fps);
  assert.equal(g.phase, "free");
  assert.equal(g.lives, 2);
  g.startHomeReturn();
  g.finish(false, "breakdown");
  assert.equal(g.lives, 2);
  assert.equal(g.phase, "home");
}
console.log(
  "PASS 3 lives: all missions/reasons, exact single loss, school checkpoint at 120s or road retry, reset health/rooms/care, retained journal, pause, third radiation/title and protected home",
);
for (const mission of [0, 1, 2])
  for (const reason of ["exhausted", "late"]) {
    const t = createGame({ policy: "three-required" }),
      g = t.g;
    g.validatedDay = true;
    g.startDay(false);
    g.mission = g.won = mission;
    g.begin();
    g.school();
    const { start, arena } = g.missionSpec();
    g.cleared.add(start);
    g.navigationCare.used = true;
    g.enterRoom(arena, 48);
    const spawn = g.px;
    const initialHp = g.enemies[0].hp;
    g.encounterTime = g.bossIntro = 0;
    g.enemies[0].hp = 1;
    g.px = 215;
    g.projectiles.push({ x: 45, life: 1, dir: 1 });
    g.finish(false, reason);
    g.next();
    g.completeLifeLoss();
    assert.equal(g.phase, "school");
    assert.equal(g.room, arena, "active boss defeat retries the arena");
    assert.equal(g.px, spawn);
    assert.equal(g.remaining, 60);
    assert.equal(g.lives, 2);
    assert.equal(g.won, mission);
    assert.equal(g.hp, 5);
    assert.equal(g.enemies[0].hp, initialHp);
    assert(g.enemies[0].boss && g.arena);
    assert.equal(g.projectiles.length, 0);
    assert.equal(g.encounterTime, 0);
    assert(g.cleared.has(start) && g.navigationCare.used);
    t.advance(0.4);
    assert.equal(g.remaining, 60, "entry fade does not spend the retry minute");
    assert.equal(
      g.session.events.findLast((e) => e.kind === "mission-retry").data
        .checkpoint,
      "boss",
    );
    g.enemies[0].hp = 0;
    g.finish(false, "late");
    g.next();
    g.completeLifeLoss();
    assert.equal(
      g.room,
      start,
      "a defeated boss no longer owns the checkpoint",
    );
    assert.equal(g.remaining, 120);
  }
for (const fps of [30, 60, 120])
  for (const mission of [0, 1, 2]) {
    const t = createGame({ policy: "three-required" }),
      g = t.g;
    g.validatedDay = true;
    g.startDay(false);
    g.mission = mission;
    g.begin();
    g.phase = "road";
    g.finish(false, "late");
    g.next();
    g.completeLifeLoss();
    assert.equal(g.phase, "free", "road timeout restarts road, not school");
    assert.equal(g.remaining, g.missionSpec().seconds);
    g.school();
    g.finish(false, "late");
    g.next();
    g.completeLifeLoss();
    assert.equal(g.phase, "school");
    assert.equal(g.remaining, 120);
    assert.equal(g.lives, 1);
    const room = g.room;
    g.setPaused(true);
    t.advance(3, fps);
    assert.equal(g.remaining, 120);
    assert.equal(g.room, room);
    g.setPaused(false);
    t.advance(0.4, fps);
    assert.equal(g.remaining, 120, "entry fade does not consume retry time");
    assert.equal(g.recoveryScene.active, false);
    assert.equal(g.navigationCare.used, false);
    assert.equal(
      g.session.events.filter((e) => e.kind === "mission-retry").at(-1).data
        .checkpoint,
      "school",
    );
  }
{
  const t = createGame({ policy: "three-required" }),
    g = t.g;
  g.startDay(false);
  g.vehicle = 0;
  t.step();
  assert.equal(
    g.phase,
    "fail",
    "a breakdown before assignment also costs a life",
  );
  assert.equal(g.lives, 2);
}
{
  const t = createGame({ policy: "three-required" }),
    g = t.g,
    shakes = [];
  g.cameras.main.shake = (...args) => shakes.push(args);
  g.reducedShake = true;
  g.startDay(false);
  g.phase = "school";
  g.schoolFade = 0.7;
  g.lives = 1;
  g.finish(false, "exhausted");
  assert.equal(g.schoolFade, 0, "failure clears stale entry gates for touch");
  g.next();
  g.completeLifeLoss();
  t.advance(0.7);
  assert.equal(shakes.length, 1);
  assert.equal(shakes[0][0], 120);
  assert(
    Math.abs(shakes[0][1] - 0.0004) < 1e-10,
    "stamp respects reduced-shake setting",
  );
}
