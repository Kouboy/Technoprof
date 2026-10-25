const assert=require('node:assert/strict');
const {createGame}=require('./test-harness.cjs');
const fs=require('node:fs'),vm=require('node:vm');
function lastClass(){const t=createGame({policy:'three-required'}),g=t.g;g.validatedDay=true;g.startDay(false);g.mission=2;g.won=2;g.phase='school';g.vehicle=7;g.hp=1;g.finish(true);g.next();return t}
{
 const t=lastClass(),g=t.g;
 assert.equal(g.phase,'home','three successes lead to a return journey, not directly to ending');
 assert.equal(g.won,3);assert.equal(g.mission,3);assert.equal(g.vehicle,7);
 const timer=g.remaining,results=JSON.stringify(g.results),hp=g.hp;
 t.advance(3);assert.equal(g.phase,'home');assert.equal(g.remaining,timer);assert.equal(g.hp,hp);assert(!g.notified);
 g.speed=110;g.keys.UP.isDown=true;t.advance(5);assert(g.speed<=110);
 const before=g.road,km=g.kilometers;t.advance(1);assert(Math.abs(g.road-before-110/3.6)<.001);assert(Math.abs(g.kilometers-km-110/3600)<.000001);
 const travel=g.travel,road=g.road;g.setPaused(true);t.advance(12);assert.equal(g.travel,travel);assert.equal(g.road,road);g.setPaused(false);
 g.trafficHit=0;const speed=g.speed;g.crash(g.car,1);assert.equal(g.vehicle,7);assert(g.speed<speed);assert(g.trafficHit>0);
 g.next();assert.equal(g.phase,'home','duplicate next must not skip the return');
 g.finish(false,'breakdown');assert.equal(g.phase,'home','protected return cannot be failed by generic termination');
 g.road=2999.9;g.speed=80;t.advance(.1);assert.equal(g.phase,'homeArrival');
 g.setPaused(true);const age=g.age;t.advance(10);assert.equal(g.age,age);g.setPaused(false);
 t.advance(1.9);assert.equal(g.phase,'homeArrival');assert.equal(g.speed,0);assert(!g.motorRunning());
 t.advance(1.12);assert.equal(g.phase,'homeArrival','hold a genuinely black image before the ending');
 assert(!g.session.missionTiming[4],'return time must not create a fourth assignment');
 t.advance(.3);assert.equal(g.phase,'ending');assert.equal(g.cinematic.index,0);assert.equal(g.remaining,timer);assert.equal(JSON.stringify(g.results),results);
 assert(g.session.events.some(e=>e.kind==='home-return-start'));assert(g.session.events.some(e=>e.kind==='home-return-end'));
 g.skipCinematic();assert.equal(g.phase,'report');g.startDay(false);assert.equal(g.phase,'free');assert.equal(g.mission,0);assert.equal(g.vehicle,100);
}
for(const fps of [30,60,120]){
 const t=lastClass(),g=t.g;g.obstacles=[];g.car=0;g.keys.UP.isDown=true;
 for(let i=0;i<fps*120&&g.phase==='home';i++)t.step(1000/fps);
 assert.equal(g.phase,'homeArrival');assert(Math.abs(g.road-3000)<.001);assert.equal(g.won,3);
 t.advance(3.4,fps);assert.equal(g.phase,'ending');
}
{
 const t=lastClass(),g=t.g;g.keys.DOWN.isDown=true;t.advance(3);assert.equal(g.speed,0);const road=g.road;t.advance(1);assert.equal(g.road,road);
 g.keys.DOWN.isDown=false;t.advance(4);assert(g.speed>45&&g.speed<=80,'release brake resumes gentle cruise');
 const gaps=g.obstacles.slice(1).map((o,i)=>o.z-g.obstacles[i].z);assert(gaps.every(n=>n>1000),'return traffic is rare');
}
// The home CADRE is a destination, never an overdue fourth assignment.
{
 const src=fs.readFileSync('src/cadre.ts','utf8').replace(/import[^;]+;/g,'').replace(/export /g,'');const c={};vm.createContext(c);
 vm.runInContext(require('node:module').stripTypeScriptTypes(src)+';globalThis.model=cadreModel;',c);
 const s={...lastClass().g,phase:'home',remaining:1,road:2700,notified:false};const m=c.model(s,3000);
 assert(m.home);assert(m.driving);assert(!m.assigned);assert(!m.urgent);assert(!m.near);assert.equal(m.distance,'0,30 KM');assert.equal(m.status,'FIN DE SERVICE');
}
console.log('PASS home return: strict campaign -> 3 km protected night road -> parked fade -> ending; controls, pause, crashes, density, CADRE, 30/60/120 FPS');
