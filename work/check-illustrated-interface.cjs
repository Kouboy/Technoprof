const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const strip = source => source.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, '').replace(/export /g, '');
assert(fs.existsSync('src/interface-presentation.ts'), 'Illustrated failure presentation must exist');
const context = {};
vm.createContext(context);
vm.runInContext(stripTypeScriptTypes(strip(fs.readFileSync('src/interface-presentation.ts', 'utf8'))) + ';globalThis.notice=failureNotice;', context);
for (const reason of ['breakdown', 'exhausted', 'late', null]) {
  for (const mission of [0, 1, 2]) {
    const s = { failureReason: reason, mission, brokenRoad: reason === 'breakdown', pointerMode: false };
    const before = JSON.stringify(s), n = context.notice(s);
    assert.equal(JSON.stringify(s), before, 'presentation never changes simulation');
    assert.equal(n.next, mission === 2 ? 'VOIR LE BILAN' : 'AFFECTATION SUIVANTE');
    assert.equal(n.frame, reason === 'breakdown' ? 'road' : reason === 'exhausted' ? 'school' : null);
    assert(n.cause.length && n.detail.length);
    assert(!JSON.stringify(n).includes('RADIATION'), 'one assignment failure is not radiation');
  }
}
let rects = [], color;
const g = { clear() { rects = []; }, fillStyle(c) { color = c; }, fillRect(x,y,w,h) { rects.push({x,y,w,h,color}); } };
vm.runInContext(stripTypeScriptTypes(strip(fs.readFileSync('src/presentation.ts', 'utf8'))) + ';globalThis.frame=drawSurround;', context);
context.frame(g);
assert(rects.length > 40, 'frame has deliberate bevels, screws and wear');
for (const r of rects) {
  assert([r.x,r.y,r.w,r.h].every(Number.isInteger));
  assert(r.x >= 0 && r.y >= 0 && r.x+r.w <= 320 && r.y+r.h <= 179);
  assert(r.x+r.w <= 7 || r.x >= 313 || r.y+r.h <= 7 || r.y >= 175, 'frame ink stays outside playable view');
}
const once = JSON.stringify(rects); context.frame(g); assert.equal(JSON.stringify(rects), once);
const title = fs.readFileSync('src/title-screen.ts', 'utf8');
for (const required of ['<Press Start to Teach>', '(c) 2026 Brainrot Interactive Software']) assert(title.includes(required));
const data = fs.readFileSync('src/interface-data.ts','utf8');
for(const [name,file] of Object.entries({TITLE_DATA:'concept-v8-wear.png',FAILURE_DATA:'failure-atlas-v3.png'})) {
  const match=data.match(new RegExp('export const '+name+' = ("[^"\\n]+");'));
  assert(match, name+' embedded source missing');
  const payload=JSON.parse(match[1]);
  assert.deepEqual(Buffer.from(payload.split(',')[1],'base64'),fs.readFileSync('art/title-2026-10-23/'+file),'selected art bytes unchanged');
}
console.log('PASS failure cause/next/read-only mapping; frame bounds/determinism; title strings');
