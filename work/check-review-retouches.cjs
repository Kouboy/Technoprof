const assert = require('node:assert/strict');
const { createGame } = require('./test-harness.cjs');
const { load } = require('./audio-harness.cjs');
for (const [mission, seconds] of [180, 195, 210].entries()) {
  const { g, advance } = createGame();
  g.validatedDay = true; g.mission = mission; g.begin();
  assert.equal(g.remaining, seconds, 'new shared mission deadline');
  assert.equal(g.missionSpec().seconds, seconds);
  advance(1); assert.equal(g.remaining, seconds, 'cruising remains uncharged');
  g.phase = 'arrival'; g.age = 0; advance(1);
  assert.equal(g.remaining, seconds, 'arrival remains uncharged');
}
for (const [type, damage] of [[0,18],[1,25],[2,18]]) {
  const { g } = createGame(); g.begin(); g.speed = 180;
  g.crash(0, type); assert.equal(g.vehicle, 100 - damage);
  assert.equal(g.speed, 180 * 0.48, 'impact slowdown unchanged');
  g.crash(0, type); assert.equal(g.vehicle, 100 - damage, 'contact lock still prevents repeated damage');
  g.vehicle = 3; g.trafficHit = 0; g.crash(0, type);
  assert.equal(g.vehicle, 0, 'damage clamps at zero');
}
const utterances = [];
const { AudioKit, bank } = load({
  SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
  speechSynthesis: { getVoices: () => [{ lang: 'fr-FR', localService: true }], speak: u => utterances.push(u), cancel() {}, pause() {}, resume() {} },
});
const { g } = createGame();
assert.equal(g.radioLines.length, 3);
for (const text of g.radioLines) {
  const audio = new AudioKit(); audio.context = { currentTime: 0 };
  audio.radio(text, true); audio.radio(text, true);
  assert.equal(utterances.at(-1).text, text);
  assert(text.startsWith('Radio Éduca-France. '), 'approved spoken radio name, distinct from caption typography');
  assert(!/idiotie/i.test(text));
  utterances.at(-1).onend(); assert(audio.radioDone);
  audio.radio(text, true); assert(!audio.radioPlaying, 'completed bulletin is not repeated');
}
assert.equal(utterances.length, 3);
assert(g.radioLines[2].includes('corrigent les copies des examens en retard'));
for (const fps of [30,60,120]) {
  const a = new AudioKit(), events = [];
  a.context = { currentTime: 0 };
  a.master = { gain: { setTargetAtTime() {} } };
  a.play = (kind, side, weight, delay, group, rate, offset) => { if (!a.muted) events.push({kind,offset}); };
  a.stopGroup = () => {}; a.fx = () => {};
  for (let frame = 0; frame <= fps * 2.2; frame++)
    a.scene('arrival', false, 180, 1/fps, 0, false, { age: frame/fps });
  assert.equal(events.filter(e => e.kind === 'car-door').length, 0, 'no slam while still parking');
  a.scene('arrival', false, 180, 1/fps, 0, false, { age: 2.26 });
  assert.equal(events.filter(e => e.kind === 'car-door').length, 1, 'slam accompanies teacher exit');
  a.scene('arrival', true, 180, 10, 0, false, { age: 2.26 });
  a.scene('arrival', false, 180, 0, 0, false, { age: 2.26 });
  a.scene('arrival', false, 180, 1, 0, false, { age: 3.26 });
  assert.equal(events.filter(e => e.kind === 'car-door').length, 1, 'pause cannot replay slam');
}
assert(bank.FOLEY['car-door'][0] < 0.5, 'car door is a short mechanical impact');
const pcm = bank.makeMaterial('car-door', bank.AUDIO.sampleRate);
assert(pcm.some(v => Math.abs(v) > 0.1));
assert(pcm.every(Number.isFinite));
{
  const a = new AudioKit(), events = [];
  a.context = { currentTime: 0 };
  a.master = { gain: { setTargetAtTime() {} } };
  a.stopGroup = () => {}; a.fx = () => {};
  a.play = kind => { if (!a.muted) events.push(kind); };
  a.scene('arrival', false, 180, 0, 0, false, { age: 2.2 });
  a.muted = true;
  a.scene('arrival', false, 180, 0.06, 0, false, { age: 2.26 });
  a.muted = false;
  a.scene('arrival', false, 180, 0.01, 0, false, { age: 2.27 });
  assert(!events.includes('car-door'), 'unmute cannot replay a suppressed slam');
  a.scene('arrivalFade', false, 180, 0, 0, false, { age: 0 });
  assert(!events.includes('car-door'), 'no pending cue leaks into arrival fade');
}
console.log('PASS deadlines, gentler collisions, spoken radio identity and single exit-door cue across pause at 30/60/120 fps');
