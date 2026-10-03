const assert=require('assert'),fs=require('fs'),vm=require('vm');
const {createGame}=require('./test-harness.cjs'),{driveInput}=require('./drive-bot.cjs');
const scope={};vm.createContext(scope);vm.runInContext(require('node:module').stripTypeScriptTypes(fs.readFileSync('src/driving.ts','utf8').replace(/export /g,''))+';globalThis.rules={DRIVE,contactWidth,shoulderAmount,shoulderDrag,roadProjection,trafficWidth};',scope);
const r=scope.rules;
for(const type of [0,1,2]){
 assert.equal(r.contactWidth(type),(42+r.trafficWidth(type))/210);
 for(const [offset,hit]of [[r.contactWidth(type)-.015,true],[r.contactWidth(type)+.015,false]]){
  const {g,step}=createGame();g.loadScenario('road');g.speed=180;g.car=offset;g.obstacles=[{z:3,x:0,type}];step();assert.equal(g.collisions>0,hit);
 }
}
assert.equal(r.shoulderAmount(.98),0);assert(r.shoulderAmount(1.05)>0);assert.equal(r.shoulderAmount(1.15),1);
assert.equal(r.shoulderDrag(-1.1,200),r.shoulderDrag(1.1,200));
const projection=r.roadProjection(0,0,.62);assert.equal(projection.x,160+.62*105);assert.equal(projection.scale,1);
console.log('PASS widths share render/collision geometry, symmetric progressive shoulders and contact projection');
const results=[];
for(const preference of [-1,1])for(const mission of [0,1,2]){
 const {g,step}=createGame();g.seed=4401;g.mission=mission;g.begin();g.phase='road';g.notified=true;
 const visited=new Set();let ticks=0;for(;ticks<12000&&g.phase==='road';ticks++){driveInput(g,preference);visited.add(g.botTarget);step();}
 assert.equal(g.phase,'arrival',`driver ${preference} mission ${mission} ${g.vehicle} HP ${g.remaining}s`);
 assert(visited.size>=2);assert(g.remaining>90);assert(g.vehicle>=56,`recoverable drive ${g.vehicle}`);
 results.push({preference,mission:mission+1,lanes:[...visited],seconds:ticks*.02,collisions:g.collisions,vehicle:g.vehicle,remaining:Math.round(g.remaining)});
}
for(const side of [-1,1])for(const lane of [.98,1.15]){
 const {g,step}=createGame();g.begin();g.phase='road';g.notified=true;
 for(let i=0;i<12000&&g.phase==='road';i++){
  const predict=g.car+g.steerVelocity*.24,target=side*lane;
  g.keys.RIGHT.isDown=predict<target-.015;g.keys.LEFT.isDown=predict>target+.015;g.keys.UP.isDown=true;step();
 }
 assert(g.collisions>0||g.phase==='fail',`safe edge remains at ${side*lane}`);
 results.push({fixedLane:side*lane,phase:g.phase,collisions:g.collisions,remaining:Math.round(g.remaining)});
}
console.log('PASS two actual input trajectories, three missions, edge-exploit regression',JSON.stringify(results));
{
 const {g,step,advance}=createGame();g.loadScenario('road');g.speed=220;g.obstacles=[{z:2,x:0,type:0}];step();assert.equal(g.collisions,1);assert.equal(g.vehicle,78);advance(.2);assert.equal(g.collisions,1);assert(g.speed>80);g.obstacles=[];g.keys.UP.isDown=true;advance(8);assert(g.speed>180);
 g.car=1.15;g.keys.RIGHT.isDown=true;advance(15);assert(g.speed<70);g.keys.RIGHT.isDown=false;
 g.car=0;g.obstacles=[{z:g.travel+100,x:.62,type:0}];let passed=0;g.audio.pass=()=>passed++;g.speed=220;advance(4);assert.equal(passed,1);
 g.obstacles=[{z:g.travel-45,x:0,type:0}];step();assert(g.obstacles[0].z-g.travel>900);
}
console.log('PASS one impact per encounter, recovery, useful shoulder penalty, single pass sound, recycling beyond visible distance');
fs.writeFileSync('work/driving-044-results.json',JSON.stringify(results,null,2));

for(const brake of [false,true]){const {g,advance}=createGame();g.loadScenario('road-brake');g.keys.DOWN.isDown=brake;g.keys.UP.isDown=!brake;advance(2);assert.equal(g.collisions,brake?0:1);}
for(const speed of [40,110,260]){const {g,advance}=createGame();g.loadScenario('road');g.obstacles=[];g.speed=speed;const visual=g.visualSpeed();g.keys.RIGHT.isDown=true;advance(.2);assert(g.car>0);assert(g.steerVelocity>0);g.keys.RIGHT.isDown=false;const x=g.car;advance(.02);assert(g.car>x);console.log('PASS steering anticipation and visual speed at',speed,visual.toFixed(2));}
console.log('PASS braking preserves a late decision window');
