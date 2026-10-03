const fs=require('fs'), assert=require('assert/strict');
const {createGame}=require('./test-harness.cjs'),{runDay}=require('./day-runner-057.cjs');
const {audit}=createGame();
for(const [m,first] of [[0,30],[1,16],[2,26]]){
 const spec=audit.MISSIONS[m];
 for(let id=first;id<first+3;id++){
  const h=createGame(),g=h.g;g.mission=m;g.begin();g.school();g.schoolFade=0;g.enterRoom(id,50);
  assert.equal(g.enemies.length,0);assert.equal(g.encounterTime,0);assert.equal(g.bossIntro,0);assert.equal(g.floorGaps().length,0);
  assert.equal(g.roomSpec().role,undefined);assert.equal(g.roomSpec().encounter,undefined);
  const x=g.px,t=g.remaining;g.keys.RIGHT.isDown=true;h.advance(.3);assert(g.px>x);assert(g.remaining<t);
  const exits=audit.missionPassages(m,id,false);assert(exits.length>=2);
  assert(exits.some(e=>e.target=== (id===first+2?(m===0?spec.arena:m===1?40:60):id+1)),'forward passage');
  assert(exits.some(e=>e.target=== (id===first?(m===0?3:m===1?13:22):id-1)),'return passage');
  for(const e of exits){assert(spec.rooms[e.target]);assert(e.spawn>=10&&e.spawn<=302);}
 }
 assert.equal(audit.missionPassages(m,spec.arena,false).length,0);
 assert.equal(audit.missionPassages(m,spec.arena,true)[0].target,-1);
}
const exposures=[];
for(const seed of [1,4301,3842110648])for(const mode of ['keyboard','direct']){
 const r=runDay({seed,mode,path:'shortcut'}),events=r.journal.events;
 assert.equal(r.end.phase,'report');assert(r.collisions<=4);
 const passed=[1,2,3].map(m=>events.filter(e=>e.mission===m&&['pass','near-pass'].includes(e.kind)).length);
 assert(passed[1]>=passed[0]+2 && passed[2]>=passed[1]+4,JSON.stringify(passed));
 for(const id of [30,31,32,16,17,18,26,27,28])assert(r.rooms.includes(id));
 exposures.push({seed,mode,passed,orientation:[1,2,3].map(m=>r.journal.missionTiming[m].clock.orientation),remaining:events.filter(e=>e.kind==='success').map(e=>e.data.remaining)});
}
{
 const g=createGame().g;g.begin();const cars=g.obstacles,locations=cars.map(o=>o.z);g.age=14.99;g.update(0,20);assert.equal(g.phase,'receive');assert.equal(g.obstacles,cars);assert(cars.every((o,i)=>Math.abs(o.z-locations[i])<2));
 assert.equal(cars.length,audit.TRAFFIC.capacity);
 const colors=audit.DAYLIGHT.map(l=>l.background);assert.equal(new Set(colors).size,3);assert(audit.DAYLIGHT[0].name.includes('07:00'));assert(audit.DAYLIGHT[2].name.includes('18:30'));
 const calls=[],p=new Proxy({}, {get:(_,k)=>(...a)=>{calls.push([k,...a]);}});
 for(const id of [30,31,32,16,17,18,26,27,28])audit.drawSchoolWear(p,id,0,1);
 assert(calls.some(c=>c[0]==='fillTriangle'));assert(calls.some(c=>c[0]==='lineBetween'));
}
const b=fs.readFileSync('art/quiet-backgrounds-059.png');assert.equal(b.readUInt32BE(16),1672);assert.equal(b.readUInt32BE(20),941);
fs.writeFileSync('work/traffic-exposure-060.json',JSON.stringify({method:'Normal input-only full days. Encounter counts, not entity capacity. Human difficulty and hardware touch feel require user testing.',exposures},null,2));
console.log('PASS 059 nine quiet rooms, forward/return passages, no enemies/intros/gaps, active orientation clock, locked arenas; 6 normal days with progressive actual traffic exposure and no notification pop; three time-of-day palettes, background animation primitives and atlas size');

