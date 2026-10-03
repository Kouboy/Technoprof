const assert = require('assert'), fs = require('fs'), vm = require('vm');
const {createGame} = require('./test-harness.cjs');
const source = fs.readFileSync('src/presentation.ts', 'utf8')
  .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\r?\n/gm, '').replace(/export /g, '');
const scope = {};
vm.createContext(scope);
vm.runInContext(require('node:module').stripTypeScriptTypes(source +
  '\nglobalThis.api={VIEW,DAYLIGHT,shadowSpans,drawContactShadow,drawSurround,wearAnchors,REFERENCE_SCENES};'), scope);
const a = scope.api;
const graphics = () => ({rects: [], clear(){this.rects=[];}, fillStyle(){}, fillRect(...r){this.rects.push(r);}});
for (const x of [-40, 8, 95.3, 117, 128.7, 300, 355]) {
  const gaps = [[95.3,128.7], [190,223]], g = graphics();
  a.drawContactShadow(g, x, 159, 30, gaps);
  for (const [left,y,w,h] of g.rects) {
    assert(w>=0 && left>=8 && left+w<=312);
    assert(y>=158 && y+h<=175);
    for (const [l,r] of gaps) assert(left+w<=l || left>=r || w===0, 'shadow drawn into a hole');
  }
}
assert.equal(a.shadowSpans(115,159,20,[[95,128]]).spans.length,0);
const grounded=a.shadowSpans(150,159,30,[]), jumping=a.shadowSpans(150,110,30,[]);
assert(jumping.opacity<grounded.opacity);
assert(jumping.spans[0][1]-jumping.spans[0][0]<grounded.spans[0][1]-grounded.spans[0][0]);
const border=graphics(); a.drawSurround(border);
for (const [x,y,w,h] of border.rects) {
  assert(y+h<=a.VIEW.hud, 'surround must not cover the CADRE');
  assert(x+w<=7 || x>=313 || y+h<=7 || y>=175, 'surround clips playable area');
}
console.log('PASS contact shadows stay on floor, clip fractional holes, shrink in flight; frame preserves viewport and CADRE');
const before=a.wearAnchors(142.8), after=a.wearAnchors(143.2);
for (const mark of before.filter(m=>m.z>=143.2)) {
  const next=after.find(m=>m.id===mark.id);
  assert(next); assert.deepEqual(next, mark, 'road repair changes position at a streaming boundary');
}
console.log('PASS asphalt repairs remain anchored in world space across streaming boundaries');
for (const scene of Object.keys(a.REFERENCE_SCENES)) {
  let reference;
  for (let time=0;time<3;time++) {
    const {g,advance}=createGame(); g.loadPresentation(scene,time);
    const snapshot=()=>JSON.stringify({phase:g.phase,room:g.room,px:g.px,py:g.py,travel:g.travel,
      speed:g.speed,car:g.car,remaining:g.remaining,positions:g.enemies.map(e=>e.x),obstacles:g.obstacles});
    const actual=snapshot(); advance(1);
    assert.equal(snapshot(),actual,'reference scene must not advance the timer or actors');
    if(reference)assert.equal(actual,reference,'time comparison must preserve the composition');
    reference=actual;
  }
}
console.log('PASS '+Object.keys(a.REFERENCE_SCENES).length+' reference scenes frozen at three times, identical framing, positions, traffic and countdown');
{
  const {g}=createGame(); g.loadScenario('parent');
  const image=()=>({visible:true,x:70,alpha:1,setTint(value){this.tint=value;}});
  g.art={teacher:image(),backdrop:image(),inspector:image()};
  g.groundContact=graphics(); g.roadWash=graphics();
  g.mission=2; g.applyPresentation();
  assert.equal(g.art.backdrop.tint,a.DAYLIGHT[2].background);
  assert.equal(g.art.teacher.tint,a.DAYLIGHT[2].actor);
  assert(g.groundContact.rects.length>0); assert.equal(g.roadWash.rects.length,0);
  g.phase='road'; g.applyPresentation();
  assert.equal(g.groundContact.rects.length,0); assert(g.roadWash.rects.length>0);
  for(const phase of ['arrival','arrivalFade','opening','blackBefore','course','blackAfter','later']) {
    g.phase=phase; g.applyPresentation();
    assert.equal(g.groundContact.rects.length,0,phase+' must not retain school shadows');
    assert.equal(g.roadWash.rects.length,0,phase+' must not retain a road wash');
  }
}
console.log('PASS lighting separates actors from backgrounds; no residual floor or road overlays in transitions');
