const {readFileSync}=require('fs'), vm=require('vm'), assert=require('assert/strict');
const {stripTypeScriptTypes}=require('node:module');
const modules=['driving','road-structures','presentation','road-art'];
const source=modules.map(n=>readFileSync('src/'+n+'.ts','utf8')).join('\n').replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\r?\n/gm,'').replaceAll('export ','');
const c={};vm.createContext(c);vm.runInContext(stripTypeScriptTypes(source,{mode:'transform'})+'\nthis.anchors=districtAnchors;this.bridgeGeometry=bridgeGeometry;this.drawRoadBridge=drawRoadBridge;this.roadsideProjection=roadsideProjection;',c);
// Changing district must never transform an already visible object.
for(const travel of [710,718,1438,2158,2878]){
 const next=c.anchors(travel+4);
 for(const a of c.anchors(travel)){
  if(a.d<5||a.d>700)continue;
  const same=next.find(b=>b.z===a.z&&b.kind===a.kind&&b.lane===a.lane);
  assert(same&&same.variant===a.variant,'visible prop changed at district boundary');
  assert.equal(same.d,a.d-4);
 }
}
const variants=new Set();for(let t=0;t<4000;t+=180)for(const a of c.anchors(t))if(a.kind===7)variants.add(a.variant);
assert.deepEqual([...variants].sort(),[0,1,2,3,4,5]);
assert(c.anchors(390).some(a=>a.kind===6&&a.z===388&&a.d===-2),'overpass vanished at player plane');
const at=c.roadsideProjection(388,0), behind=c.roadsideProjection(388,-0.001);
assert(Math.abs(at.x-behind.x)<0.01&&Math.abs(at.y-behind.y)<0.01,'perspective jumps at crossing');
assert(c.roadsideProjection(388,-20).scale>at.scale);
for(const d of [300,80,0,-20]){
 const b=c.bridgeGeometry(388,d);
 assert(b.feet-84*b.scale>b.underside,'truck intersects bridge underside');
 assert(b.right-b.left>3.1*105*b.scale,'piers block road');
}
let count=0;const clipped={fillStyle(){},fillRect(x,y,w,h){
 assert([x,y,w,h].every(Number.isInteger));assert(w>0&&h>0);
 assert(x>=7&&y>=7&&x+w<=313&&y+h<=175);count++;
}};
for(const variant of [0,1])for(const d of [600,48,0,-20,-48])c.drawRoadBridge(clipped,388,d,variant);
assert(count>0);
console.log('PASS 0.52 stable district identity, six props, continuous crossing, truck clearance, integer bridge clipping');
