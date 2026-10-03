const fs=require('fs'),assert=require('assert/strict');
const {createGame}=require('./test-harness.cjs');
const {driveInput}=require('./fair-drive-bot-060.cjs');
const {audit:a}=createGame();
// The first journey retains the exact former second-journey authored stream.
const former=[
 [300,.62,0,70],[550,-.62,1,62],[750,0,2,84],[260,.62,0,84],
 [900,-.62,2,74],[560,.62,1,64],[620,0,0,78],[900,-.62,0,72],
];
for(let index=0;index<64;index++)for(const random of [0,.25,.99]){
 const [gap,x,type,speed]=former[index%8],first=a.trafficCue(index,0,random);
 assert.equal(first.x,x);assert.equal(first.type,type);assert.equal(first.speed,speed);
 assert(Math.abs(first.gap-a.DRIVE.motionScale*(gap*.36+(index?random*35:0)))<1e-8);
 const second=a.trafficCue(index,1,random),third=a.trafficCue(index,2,random);
 assert(Math.abs(second.gap*2-first.gap)<1e-8);
 assert(Math.abs(third.gap*4-first.gap)<1e-8);
 assert.equal(second.speed,third.speed,'dense waves must retain their spacing');
}
// One side remains open within each dense wave; the opening changes each wave.
const right=new Set([0,1,2,3].map(i=>a.trafficCue(i,2,.5).x));
const left=new Set([4,5,6,7].map(i=>a.trafficCue(i,2,.5).x));
assert(!right.has(-.62));assert(!left.has(.62));assert(right.has(0)&&left.has(0));
assert.equal(a.TRAFFIC.capacity,32);
const roads=[];
for(const seed of [1,4301,8317])for(const mission of [0,1,2]){
 const {g,step}=createGame();g.workshop=true;g.seed=seed;g.mission=mission;g.begin();
 let ticks=0,confirmed=0,peakVisible=0;
 while(['free','receive','road'].includes(g.phase)&&ticks++<15000){
  const before=new Map(g.obstacles.map(o=>[o,o.z-g.travel]));
  driveInput(g);step(1000/60);
  for(const o of g.obstacles)if(before.get(o)>=-a.DRIVE.contactDepth&&o.z-g.travel<-a.DRIVE.contactDepth&&!o.hit)confirmed++;
  peakVisible=Math.max(peakVisible,g.obstacles.filter(o=>o.z-g.travel>0&&o.z-g.travel<a.DRIVE.visibleDistance).length);
 }
 assert.equal(g.phase,'arrival');assert.equal(g.collisions,0);assert.equal(g.vehicle,100);
 assert(g.remaining>[170,165,135][mission],'a clean road must leave time for the school');
 assert(confirmed>=[20,35,68][mission]);
 roads.push({seed,mission:mission+1,confirmed,peakVisible,remaining:g.remaining,hits:g.collisions});
}
for(const seed of [1,4301,8317]){
 const r=roads.filter(r=>r.seed===seed);
 assert(r[1].confirmed>=r[0].confirmed*1.5);
 assert(r[2].confirmed>=r[1].confirmed*1.7);
}
fs.writeFileSync('work/traffic-confirmed-061.json',JSON.stringify({method:'Fixed deterministic entry, normal cruising and assignment, held inputs only. Crossings confirmed after the contact zone with no hit; independent of early pass sounds. Controlled feasibility, not human discovery or physical-phone validation.',roads},null,2));
console.log('PASS 061 former second-journey baseline, exact x1/x2/x4 density including jitter, alternating open-side waves, 9 clean normal roads and confirmed crossing progression');
