const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const files = ['slice-art', 'hall-art', 'wing-art', 'bridge-art', 'new-school-art'];
const context = {
  ART_DATA: { corridor: 'old', prof: 'prof', inspecteur: 'inspecteur' },
  INSPECTRICE_DATA: 'inspectrice', HALL_DATA: { hall: 'old', parent: 'parent' },
  WING_DATA: { wing: 'old', student: 'student' },
  BRIDGE_DATA: { bridge: 'old', guard: 'guard' }, QUIET_SCHOOL_DATA: 'old',
  NEW_SCHOOL_DATA: { 'bruel-backgrounds': 'old', 'pro-backgrounds': 'pro', 'bruel-enemies': 'bruel', 'pro-enemies': 'pro' },
  preloadCatchupStudent: scene => scene.load.image('catchup', 'catchup'),
};
vm.createContext(context);
for (const name of files) {
  const source = fs.readFileSync('src/' + name + '.ts', 'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, '').replace(/export /g, '');
  vm.runInContext(stripTypeScriptTypes(source, { mode: 'transform' }), context);
}
for (const legacy of [false, true]) {
  const loaded = new Map(), scene = { load: { image: (key, data) => loaded.set(key, data) } };
  context.scene = scene; context.legacy = legacy;
  vm.runInContext('for (const art of [SliceArt, HallArt, WingArt, BridgeArt, NewSchoolArt]) art.preload(scene, legacy);', context);
  for (const key of ['corridor', 'hall', 'wing-34', 'bridge-33', 'quiet-backgrounds'])
    assert.equal(loaded.has(key), legacy, key + ' legacy=' + legacy);
  for (const key of ['raw-prof', 'raw-inspecteur', 'raw-inspectrice', 'raw-parent', 'raw-student-34', 'raw-guard-33', 'bruel-backgrounds', 'pro-backgrounds', 'bruel-enemies', 'pro-enemies', 'catchup'])
    assert(loaded.has(key), 'shared actor or I2 entry missing: ' + key);
}
console.log('PASS shared actor preloads, historical backgrounds omitted in day and preserved in workshop');
