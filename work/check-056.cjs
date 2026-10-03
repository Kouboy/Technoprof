const assert=require('assert'),fs=require('fs');
const {runMission}=require('./mission-runner.cjs');
const {createGame}=require('./test-harness.cjs');
const reports=[];
for(const fps of [30,60,120])for(const mode of ['keyboard','direct'])for(const path of ['detour','shortcut'])for(const seed of [1,4301,8317,123456,4294967294]){
 const r=runMission({fps,mode,path,seed});reports.push(r);
 assert.equal(r.outcome,'COURS ASSURE');assert.equal(r.end.phase,'free');assert.equal(r.nextRemaining,225);
 assert.deepEqual(r.rooms,path==='detour'?[0,1,5,6,7,3,30,31,32,4]:[0,1,2,8,3,30,31,32,4]);
 assert.equal(r.collisions,0);assert.equal(r.falls,0);assert(r.hp>=3);assert(r.remaining>130);
 assert.equal(r.arrivalClock,r.schoolClock,'arrival cinema does not charge time');
 const timing=r.journal.missionTiming['1'];
 assert(timing.clock.road>60&&timing.clock.road<61);
 const spent=Object.values(timing.clock).reduce((s,v)=>s+v,0);
 assert(Math.abs(240-r.remaining-spent)<.01,'every charged second must be accounted for');
 for(const k of ['dialogue','transition','hitStop','arrival','arrivalFade','opening','course'])assert(!(k in timing.clock),k+' must not charge');
 assert(timing.seconds.dialogue>7&&timing.seconds.boss>8);
 assert(r.threats.some(t=>t.startsWith('3:')),'student winds up from actual entry');
 if(path==='detour')assert(r.threats.some(t=>t.startsWith('6:')),'guard winds up from actual entry');
 assert(r.threats.includes('4:1')&&r.threats.includes('4:2'),'stamp and sweep occur');
}
const quick=reports.find(r=>r.seed===4301&&r.fps===60&&r.mode==='keyboard'&&r.path==='detour');
const slowRead=runMission({readingDelay:10});
assert(slowRead.elapsed>quick.elapsed+50);assert(Math.abs(slowRead.remaining-quick.remaining)<.04,'reading time does not penalize the player');
for(const mode of ['keyboard','direct']){
 const idle=runMission({mode,driveStyle:'coast'});reports.push(idle);
 assert.equal(idle.outcome,'RETARD SUR LA ROUTE');assert.equal(idle.journal.events.find(e=>e.kind==='failure').data.reason,'late');
 const straight=runMission({mode,driveStyle:'straight'});reports.push(straight);
 assert(straight.collisions>=2);assert(straight.vehicle<quick.vehicle,'no-steering is not a free route');
}
const mash=runMission({boss:'mash'});reports.push(mash);
assert(mash.hp<quick.hp);assert(mash.journal.events.filter(e=>e.kind==='blocked').length>=10);
// Intentionally preserve the forgiving first encounter: exact repeated presses
// can win at a health cost. This is measured, not treated as an invincible boss.
{
 const {g,api,step,advance}=createGame();g.workshop=true;g.seed=8317;g.loadScenario('mission');
 assert.equal(g.phase,'free');assert(!g.notified);assert.equal(g.seed,8317);
 g.controls=new api.ActionInput();g.keys=g.controls.keys;g.direct=new api.DirectInput(g);
 g.school();advance(.8);g.direct.tick(0);g.direct.down(1,120,150);g.direct.move(1,95,120);g.direct.up(1,95,120);
 advance(1.3);assert.equal(g.px,42);assert.equal(g.direct.intent,null,'swipe at blocked boundary ends at the reachable point');
 const prior=g.session.elapsed;g.setPaused(true);advance(2);assert.equal(g.session.elapsed,prior);
}
{
 const {g}=createGame();const removed=[];
 g.textures={exists:k=>k.startsWith('raw-'),get:()=>({getSourceImage:()=>({width:1536,height:1024})}),remove:k=>removed.push(k)};
 g.releasePreparedSources();assert.equal(removed.length,13);assert(removed.every(k=>k.startsWith('raw-')));
 assert.equal(g.runtime.releasedSources.rgbaBytes,13*1536*1024*4);
 g.runtime.frame(16.6);g.runtime.frame(33.3);g.runtime.frame(1200);g.runtime.frame(NaN);
 const stats=g.runtime.snapshot().frameIntervalsMs;assert.equal(stats.samples,2);assert.equal(stats.p50,17);assert.equal(stats.p95,34);assert.equal(stats.interruptionsOver1s,1);
 for(let i=0;i<10000;i++)g.runtime.frame(16.6);assert.equal(g.runtime.frames.size,2);
 g.runtime.resetFrames();assert.equal(g.runtime.snapshot().frameIntervalsMs.p50,null);
}
fs.writeFileSync('work/mission-results-060.json',JSON.stringify({method:'Continuous input-only VM journeys, deterministic seed; no position/HP/timer/phase skips after start. Synthetic FPS is not hardware performance.',reports:reports.map(({end,...r})=>r)},null,2));
const rows=['seed,fps,mode,path,outcome,remaining,hp,vehicle,collisions,falls,elapsed'];
for(const r of reports)rows.push([r.seed,r.fps,r.mode,r.path,r.outcome,r.remaining.toFixed(2),r.hp,r.vehicle,r.collisions,r.falls,r.elapsed].join(','));
fs.writeFileSync('work/mission-results-060.csv',rows.join('\n'));
console.log('PASS 056: 60 continuous first assignments (2 paths, 2 control modes, 5 seeds, 30/60/120 fps), class and cruising return; exact timer accounting, suspended reading/cinema/fades, hazards and both boss threats');
console.log('PASS slow reading, no-input late, no-steering damage, naive strikes cost health; clamped swipe, bounded runtime stats and 13 source texture releases');
