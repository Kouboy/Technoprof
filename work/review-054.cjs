// Diagnostic read-only review: records current behaviour, including known defects.
// This is not a regression suite and does not endorse the defective behaviour.
const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const { createGame } = require('./test-harness.cjs');
const strip = s => s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, '').replace(/export /g, '');
const scope = {}; vm.createContext(scope);
vm.runInContext(require('node:module').stripTypeScriptTypes(
  ['world', 'gameplay', 'dialogue', 'controls', 'direct-input'].map(n => strip(fs.readFileSync('src/' + n + '.ts', 'utf8'))).join('\n')
) + ';globalThis.r={ActionInput,DirectInput};', scope);
const results = { version: '0.54', date: '2026-10-02', scope: 'Logic probes without rendering/audio; not a human playtest', edgeHints: [], ordinaryCombat: [], bossMash: [], payload: [] };
function school(room, x, mission = 0) {
  const h = createGame(), g = h.g;
  g.loadScenario('stairs'); g.mission = mission; g.roomEnemies.clear(); g.enterRoom(room, x);
  g.encounterTime = g.bossIntro = g.schoolFade = 0; g.interactLock = 0; g.inv = 0;
  return h;
}
for (const [room, direction, start, arrow, beyond, target] of [
  [0, 'right', 240, 298, 310, 1], [1, 'right', 240, 298, 310, 2],
  [3, 'right', 240, 298, 310, 4], [6, 'right', 240, 298, 310, 7],
  [8, 'right', 240, 298, 310, 3], [1, 'left', 60, 15, 8, 0], [2, 'left', 60, 15, 8, 1],
]) {
  const h = school(room, start), g = h.g; g.enemies = [];
  g.controls = new scope.r.ActionInput(); g.keys = g.controls.keys; g.direct = new scope.r.DirectInput(g); g.direct.tick(0);
  // Actual arrow lies at y137..151; its centre is y144.
  g.direct.tap(arrow, 144); h.advance(3);
  const observed = { room, direction, tap: [arrow, 144], after: { room: g.room, x: g.px, intent: g.direct.intent } };
  assert.equal(g.room, room, 'reproduce current arrow-target shortfall');
  g.direct.tap(beyond, 164); h.advance(1);
  observed.edgeTapAfter = { room: g.room, x: g.px }; assert.equal(g.room, target, 'walking beyond the hint crosses the edge');
  results.edgeHints.push(observed);
}
for (const room of [1, 3, 6]) {
  const h = school(room, 170), g = h.g;
  for (let i = 0; i < 500 && g.phase === 'school' && g.enemies.some(e => e.hp > 0); i++) {
    if (i % 25 === 0) g.keys.X.just = true;
    h.step();
  }
  results.ordinaryCombat.push({ room, strategy: 'stationary, attack every 0.5 s', elapsed: g.session.elapsed, playerHp: g.hp, enemyHp: g.enemies[0]?.hp, hits: g.punches });
}
for (const mission of [0, 1, 2]) for (const seconds of [.5, .65, .85]) {
  const h = school(4, 170, mission), g = h.g; let clock = 0, next = 0;
  while (clock < 30 && g.phase === 'school' && g.enemies.some(e => e.hp > 0)) {
    if (clock >= next) { g.keys.X.just = true; next += seconds; }
    h.step(); clock += .02;
  }
  results.bossMash.push({ mission, cadence: seconds, elapsed: clock, playerHp: g.hp, bossHp: g.enemies[0]?.hp, hits: g.punches, phase: g.phase });
}
for (const path of ['Jouer-Technoprof.html', 'Jouer-Technoprof-0.54.html', 'Technoprof-0.54-testeurs.zip']) {
  results.payload.push({ path, bytes: fs.statSync(path).size });
}
fs.writeFileSync('work/review-054-results.json', JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
