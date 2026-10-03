const assert = require('assert'), fs = require('fs'), vm = require('vm');
const { createGame } = require('./test-harness.cjs');
const strip = s => s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, '').replace(/export /g, '');
const scope = {};
vm.createContext(scope);
vm.runInContext(require('node:module').stripTypeScriptTypes(
  ['gameplay', 'combat-poses'].map(n => strip(fs.readFileSync('src/' + n + '.ts', 'utf8'))).join('\n') +
  '\nglobalThis.api={PLAY,teacherPose,enemyPose};'), scope);
const { PLAY, teacherPose, enemyPose } = scope.api;
function setup(name) {
  const h = createGame(); h.g.loadScenario(name);
  h.sounds = []; h.g.audio.combat = (...args) => h.sounds.push(args);
  return h;
}
for (const fps of [15, 30, 60, 120]) {
  for (const scenario of ['hit', 'hit-left']) {
    const { g, press, advance, sounds } = setup(scenario), enemy = g.enemies[0], hp = enemy.hp;
    const oldX = enemy.x;
    press('X'); advance(.1, fps); assert.equal(enemy.hp, hp); assert.equal(sounds.length, 0);
    advance(.1, fps); assert.equal(enemy.hp, hp - 1);
    assert.equal(g.impactY, 104); assert.equal(g.impactX, oldX - g.face * 9);
    assert.equal(enemy.strikeTime, 0); assert.equal(enemy.wind, 0);
    assert.equal(sounds.filter(s => s[0] === 'hit').length, 1);
    advance(.45, fps); assert.equal(enemy.hp, hp - 1, 'one hit per press');
  }
}
console.log('PASS anticipation then one contact/sound, mirrored book anchors, 15/30/60/120 fps');
for (const scenario of ['block', 'block-left']) {
  const { g, press, advance, sounds } = setup(scenario), hp = g.enemies[0].hp;
  press('X'); advance(.16);
  assert.equal(g.enemies[0].hp, hp); assert(g.bookBlocked > 0);
  assert.equal(teacherPose(g).frame, 5, 'show contact before retracting the book'); assert(g.attack <= PLAY.attackRecovery);
  assert.equal(sounds.filter(s => s[0] === 'block').length, 1);
  assert.equal(sounds.filter(s => s[0] === 'hit').length, 0);
  advance(.12); assert.equal(teacherPose(g).frame, 6, 'book recoils after the stop');
}
{
  const { g, press, advance, sounds } = setup('whiff');
  press('X'); g.keys.X.isDown = true; advance(1);
  assert.deepEqual(sounds.map(s => s[0]), ['swing']); assert.equal(g.punches, 0);
  assert.equal(g.attack, 0, 'held key must not auto attack');
}
console.log('PASS empty swing, guarded book rebound and no held-key autofire');
{
  const { g, press, advance } = setup('whiff');
  press('X'); advance(.4); press('X'); assert(g.attackBuffer > 0);
  advance(.15); assert.equal(g.session.events.filter(e => e.kind === 'attack').length, 2);
  advance(.7); assert.equal(g.session.events.filter(e => e.kind === 'attack').length, 2);
  g.loadScenario('whiff'); press('X'); advance(.2); press('X'); advance(.6);
  assert.equal(g.session.events.filter(e => e.kind === 'attack').length, 1, 'early mash is not stored');
  for (const end of ['hurt', 'room', 'finish', 'fall']) {
    g.loadScenario('whiff'); press('X'); advance(.4); press('X'); assert(g.attackBuffer > 0);
    if (end === 'hurt') g.hurt(-1);
    if (end === 'room') g.enterRoom(7, 90);
    if (end === 'finish') g.finish(false);
    if (end === 'fall') { g.room = 8; g.px = 112; g.py = 159; g.tryFall(); }
    assert.equal(g.attackBuffer, 0, end + ' cancels buffer');
  }
}
console.log('PASS late 100ms press carried once; early mashing and interruption cannot replay attacks');
for (const scenario of ['hurt', 'hurt-left']) {
  const { g, advance, sounds, step } = setup(scenario), hp = g.hp;
  advance(.72); assert.equal(g.hp, hp - 1); assert(g.playerRecovery > 0);
  const pose = teacherPose(g); assert.equal(pose.frame, 6); assert.equal(pose.alpha, 1);
  const before = g.playerRecovery; step(); assert.equal(g.playerRecovery, before, 'hit stop holds reaction');
  const face = g.face; g.keys.LEFT.isDown = true; g.keys.RIGHT.isDown = false;
  advance(.1); assert.equal(g.face, face, 'cannot reverse a hurt pose mid-reaction');
  advance(.3); assert.equal(g.playerRecovery, 0);
  assert.equal(sounds.filter(s => s[0] === 'hurt').length, 1);
}
console.log('PASS directional professor recoil, opaque contact, hit-stop and recovery release');
for (const name of ['defeat-parent', 'defeat-student', 'defeat-guard', 'success']) {
  const { g, press, advance } = setup(name), e = g.enemies[0];
  press('X'); advance(.2); assert.equal(e.hp, 0); assert(e.downTime > .9);
  const p = enemyPose(e, -1); assert.equal(p.alpha, 1); assert(p.angle > 0);
  advance(.4); const down = enemyPose(e, -1); assert(down.y >= 159); assert.equal(down.alpha, 1);
  advance(.7); assert.equal(e.downTime, 0); assert.equal(enemyPose(e, -1).alpha, 0);
}
{
  const { g, step } = setup('parent'), e = g.enemies[0];
  g.encounterTime = 0; e.hp = 1; e.x = 274; e.chargeDir = 1; e.chargeTime = 1;
  step(); assert.equal(e.hp, 0); assert(e.downTime > 0, 'wall defeat also remains visible');
}
console.log('PASS four readable defeats, including parent furniture collision');
{
  const { g } = setup('hit'); const levels = [];
  g.cameras.main.shake = (_, intensity) => levels.push(intensity);
  g.hurt(-1); g.inv = 0; g.reducedShake = true; g.hurt(1);
  assert.equal(levels[1], levels[0] * .2);
  const e = { x: 287, hp: 2, stun: .22, recoilTime: .22, recoilDistance: 0, hitDirection: 1 };
  assert.equal(enemyPose(e, -1).x, 287, 'no false teleport at wall');
}
console.log('PASS reduced shake and clamped recoil at room edge');
