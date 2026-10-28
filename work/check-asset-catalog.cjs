const assert = require('node:assert/strict');
const fs = require('node:fs');
const { selectDayAssets, dayDocument, DAY_ASSETS } = require('../tools/asset-catalog.cjs');
let removed = 0;
for(const name of ['service-data','technical-data','central-data','stair-data','court-data']) {
 const source=fs.readFileSync('src/'+name+'.ts','utf8');
 const selected=selectDayAssets('/project/src/'+name+'.ts',source);
 assert(selected && !selected.includes('data:image/'),'historical-only image omitted before URL emission: '+name);
}
for (const [name, rule] of Object.entries(DAY_ASSETS)) {
  const source = fs.readFileSync('src/' + name + '.ts', 'utf8');
  const selected = selectDayAssets('/project/src/' + name + '.ts', source);
  assert(selected && selected.length < source.length, name);
  const parse = text => require('node:vm').runInNewContext(text.replace(/export const \w+\s*=/, 'globalThis.result =') + '\nresult;');
  const before = parse(source), after = parse(selected);
  if (rule.keep) {
    assert.deepEqual(Object.keys(after), rule.keep);
    for (const key of rule.keep) assert.equal(after[key], before[key], name + '/' + key);
    assert.throws(() => selectDayAssets('/project/src/' + name + '.ts', 'export const ' + rule.export + ' = {};'), /Missing/);
  } else assert.equal(after, '', 'unused standalone sheet is empty in day only');
  removed += Buffer.byteLength(source) - Buffer.byteLength(selected);
}
assert.equal(selectDayAssets('/project/src/audio.ts', 'unchanged'), null);
assert.equal(selectDayAssets('/project/other/art-data.ts', 'unchanged'), null);
assert(removed > 10000000, 'catalogue must remove actual bitmap payload');
console.log('PASS explicit day asset catalogue, retained bytes identical; removed source bytes: ' + removed);
const html = dayDocument(fs.readFileSync('index.html', 'utf8'));
const bootstrap = html.match(/<script>\s*\/\/ Day player bootstrap[\s\S]*?<\/script>/)[0].replace(/<\/?script>/g, '');
for (const essai of ['labo', 'retouches', 'poses', 'cadre', 'journee', '']) {
  const elements = Object.fromEntries(['developer-controls','developer-links','legacy-tests','pose-controls','player-feedback'].map(id => [id, {}]));
  require('node:vm').runInNewContext(bootstrap, { location: { search: '?essai=' + essai }, document: { getElementById: id => elements[id] } });
  assert.equal(elements['player-feedback'].hidden, false);
  for (const [id, element] of Object.entries(elements)) if (id !== 'player-feedback') assert.equal(element.hidden, true);
}
assert(!html.includes('const testView'), 'old workshop bootstrap must be replaced');
assert.throws(() => dayDocument('<html>changed markup</html>'), /bootstrap/);
console.log('PASS day player DOM ignores old workshop URL options and keeps feedback visible');
