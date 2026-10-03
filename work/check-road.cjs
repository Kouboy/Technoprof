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

const skyCalls=[];const skySprite={setTint(){return this;},setPosition(x,y){skyCalls.push([x,y]);return this;},setDisplaySize(w,h){assert(w>=306&&h>0);return this;},setVisible(){return this;}};art.clouds=skySprite;art.skyline=skySprite;art.sky(67,54,20);assert.equal(skyCalls.length,2);assert(Math.abs(skyCalls[0][0])<20&&Math.abs(skyCalls[1][0])<20);art.hide();console.log('PASS sky parallax coverage and cleanup');
