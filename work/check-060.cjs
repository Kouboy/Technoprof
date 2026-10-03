const fs=require('fs'),assert=require('assert/strict');
const {createGame}=require('./test-harness.cjs'),{runDay}=require('./day-runner-057.cjs');
const {driveInput}=require('./fair-drive-bot-060.cjs');
const a=createGame().audit;
const paths=Array.from(a.MISSIONS).map((m,i)=>{
 const q=[[m.start]],seen=new Set();
 while(q.length){const p=q.shift(),id=p.at(-1);if(id===m.arena)return p;if(seen.has(id))continue;seen.add(id);for(const e of a.missionPassages(i,id,false))q.push([...p,e.target]);}
 throw Error('Unreachable classroom');
});
assert.deepEqual(paths.map(p=>p.length),[9,18,36]);
assert.deepEqual(paths.map((p,i)=>p.reduce((n,id)=>n+a.missionEnemies(i,id).length,0)),[3,6,12]);
for(const [i,m] of a.MISSIONS.entries()){
 const reached=new Set(),q=[m.start];while(q.length){const id=q.shift();if(reached.has(id))continue;reached.add(id);for(const e of a.missionPassages(i,id,false)){assert(m.rooms[e.target]);assert(e.spawn>=10&&e.spawn<=302);q.push(e.target);}}
 assert.equal(reached.size,Object.keys(m.rooms).length);
 assert.equal(a.DAY_LOAD[i].rooms,paths[i].length);assert.equal(a.DAY_LOAD[i].encounters,paths[i].filter(id=>a.missionEnemies(i,id).length).length);
}
// Every added encounter uses normal entry: speech freezes both actors and clock.
for(const [i,m] of a.MISSIONS.entries())for(const r of Object.values(m.rooms).filter(r=>r.id>=40&&r.role||r.id===25)){
 const h=createGame(),g=h.g;g.workshop=true;g.mission=i;g.begin();g.school();g.schoolFade=0;g.enterRoom(r.id,45);
 assert.equal(g.enemies.length,1);assert(g.encounterTime);const clock=g.remaining,x=g.px,enemy=g.enemies[0].x;
 g.keys.RIGHT.isDown=true;h.advance(10);g.keys.RIGHT.isDown=false;assert.equal(g.px,x);assert.equal(g.enemies[0].x,enemy);assert.equal(g.remaining,clock);
 // Early action reveals, fresh next action confirms, and confirmation cannot attack.
 g.dialogue.characters=0;h.press('X');assert(g.encounterTime);h.press('X');assert.equal(g.encounterTime,0);assert.equal(g.attack,0);
 g.enterRoom(m.start,45);g.enterRoom(r.id,45);assert.equal(g.encounterTime,0);
}
const reports=[];
for(const path of ['detour','shortcut'])for(const mode of ['keyboard','direct']){
 const r=runDay({seed:4301,path,mode});assert.equal(r.end.phase,'report');assert.equal(r.results.length,3);assert.equal(r.falls,0);
 const encounters=[1,2,3].map(m=>r.journal.events.filter(e=>e.mission===m&&e.kind==='room'&&e.data.introduction>0).length);
 assert.deepEqual(encounters,path==='detour'?[4,6,12]:[3,6,12]);
 const rooms=[1,2,3].map(m=>r.journal.events.filter(e=>e.mission===m&&e.kind==='room').length);
 assert.deepEqual(rooms,path==='detour'?[10,18,36]:[9,18,37]);
 const passing=[1,2,3].map(m=>r.journal.events.filter(e=>e.mission===m&&['pass','near-pass'].includes(e.kind)).length);
 assert(passing[0]>=22&&passing[0]<=27);assert(passing[1]>=37);assert(passing[2]>=70);assert(passing[2]>=passing[1]*1.7);
 const wins=r.journal.events.filter(e=>e.kind==='success').map(e=>e.data);
 assert(wins[0].remaining>wins[1].remaining+25);assert(wins[1].remaining>wins[2].remaining+50);assert(wins[2].remaining>5);
 reports.push({path,mode,rooms,encounters,passing,wins,hits:r.collisions});
}
// Two reproducible dense-road routes can be completed cleanly through held inputs.
// This is feasibility evidence, not a promise that a human or every seed is easy.
const cleanRoads=[];
for(const seed of [4301,8317]){
 const h=createGame(),g=h.g;g.workshop=true;g.seed=seed;g.mission=2;g.begin();
 let steps=0;while(['free','receive','road'].includes(g.phase)&&steps++<15000){driveInput(g);h.step(1000/60);}
 assert.equal(g.phase,'arrival');assert.equal(g.collisions,0);assert(g.remaining>135);assert.equal(g.vehicle,100);
 cleanRoads.push({seed,remaining:g.remaining,passing:g.session.events.filter(e=>['pass','near-pass'].includes(e.kind)).length});
}
const versionTag=JSON.parse(fs.readFileSync('package.json')).version.split('.').slice(0,2).join('');
fs.writeFileSync(`work/progression-${versionTag}.json`,JSON.stringify({method:'Graph paths plus normal held keyboard/direct full days. Clean road uses a visible-traffic anticipatory input driver; no world position, HP or timer correction. Human balance remains to be tested.',paths,reports,cleanRoads},null,2));
console.log('PASS 060 minimum rooms 9/18/36, encounters 3/6/12, both branches, returns, all rooms reachable, added intros and actual passing exposure; 4 full days and 2 clean dense-road input-only routes.');

