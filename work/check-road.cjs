const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {stripTypeScriptTypes}=require('node:module');
const source=['driving','road-structures','presentation','road-art'].map(n=>fs.readFileSync('src/'+n+'.ts','utf8')).join('\n').replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\r?\n/gm,'').replaceAll('export ','');
const c={};vm.createContext(c);vm.runInContext(stripTypeScriptTypes(source,{mode:'transform'})+'\nthis.anchors=districtAnchors;this.frames=ROAD_FRAMES;this.RoadArt=RoadArt;this.bridgeGeometry=bridgeGeometry;this.drawRoadBridge=drawRoadBridge;this.roadsideProjection=roadsideProjection;',c);
for(const frames of Object.values(c.frames))for(const [x,y,w,h] of frames)assert(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);
const before=c.anchors(29),after=c.anchors(31);
for(const a of before){const z=a.d+29;if(z>=31)assert(after.some(b=>b.d+31===z&&b.kind===a.kind&&b.lane===a.lane),'world anchor disappeared at segment boundary');}
assert(after.some(a=>a.d+31===33&&a.kind===2)===false);
// Mixed graphics and sprites use the same increasing depth, below the player.
let currentDepth=0;const graphics={setDepth(n){currentDepth=n;return this;},clear(){},setMask(){return this;}};
const art=Object.create(c.RoadArt.prototype);art.layers=[];art.images=[];art.scene={add:{graphics:()=>Object.create(graphics)}};art.mask={};
art.layer(0);const far=currentDepth;art.layer(20);const bridge=currentDepth;art.layer(50);const near=currentDepth;
assert(far<bridge&&bridge<near&&near<3.1);art.hide();assert.equal(art.index,0);
console.log('PASS road atlas bounds, world anchors across segment boundaries, mixed-layer depths below player');
// Phaser 4 geometry masks are Canvas-only. WebGL ignored this call and warned
// on every scene creation; do not create or apply a useless mask there.
c.Phaser={CANVAS:1};
for(const renderer of [1,2]) {
 let graphics=0,applied=0;
 const road=Object.create(c.RoadArt.prototype), mask={};
 const shape={fillStyle(){return this;},fillRect(){return this;},setVisible(){return this;},createGeometryMask(){return mask;}};
 road.scene={game:{renderer:{type:renderer}},add:{graphics(){graphics++;return shape;}}};
 road.world={setMask(value){assert.equal(value,mask);applied++;return this;}};
 road.installViewportMask();
 assert.equal(graphics,renderer===1?1:0);assert.equal(applied,renderer===1?1:0);
}
console.log('PASS Canvas keeps its viewport mask; WebGL creates no unsupported geometry mask');

// One viewport mask on the shared world; children retain their exact depth order.
const parented=[];let sorted=false;
art.world={add(child){parented.push(child);},sort(key){assert.equal(key,'depth');sorted=true;},setVisible(){}};
art.layer(51);assert.equal(parented.length,1,'new road layers join the masked world');
art.finishFrame();assert(sorted,'pooled children must be re-sorted every frame');

const skyCalls=[];const skySprite={setTint(){return this;},setPosition(x,y){skyCalls.push([x,y]);return this;},setDisplaySize(w,h){assert(w>=306&&h>0);return this;},setVisible(){return this;}};
let cityVisible=false,cityPosition=[];
art.clouds=skySprite;art.skyline=skySprite;
art.skylineLights={...skySprite,setPosition(x,y){cityPosition=[x,y];return this;},setVisible(v){cityVisible=v;return this;}};
art.sky(67,54,20);assert.equal(skyCalls.length,2);assert(Math.abs(skyCalls[0][0])<20&&Math.abs(skyCalls[1][0])<20);assert.equal(cityVisible,false,'day skyline has no lit windows');
art.sky(67,54,20,3);assert.equal(cityVisible,true,'night home journey lights city windows');assert.deepEqual(cityPosition,skyCalls.at(-1),'lights track skyline bend and horizon');
art.hide();assert.equal(cityVisible,false,'hide cleans city overlay');console.log('PASS sky parallax coverage, night-only city lights and cleanup');
