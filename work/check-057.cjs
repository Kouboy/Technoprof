const assert=require('assert'),fs=require('fs');
const {createGame}=require('./test-harness.cjs');
const {runDay}=require('./day-runner-057.cjs');
const reports=[];
for(const fps of [30,60,120])for(const mode of ['keyboard','direct'])for(const path of ['detour','shortcut'])for(const seed of [1,4301,8317]){
  const r=runDay({fps,mode,path,seed}); reports.push(r);
  assert.equal(r.end.phase,'report',JSON.stringify({...r,journal:undefined}));
  assert.deepEqual(Array.from(r.results),['COURS ASSURE','COURS ASSURE','COURS ASSURE']);
  assert.equal(r.falls,0); assert(r.collisions<=4);
  assert.equal(r.journal.version,JSON.parse(fs.readFileSync('package.json')).version.split('.').slice(0,2).join('.'));
  const events=r.journal.events, wins=events.filter(e=>e.kind==='success');
  assert.equal(wins.length,3);
  for(let i=0;i<3;i++){
    const assigned=[240,225,210][i],timing=r.journal.missionTiming[String(i+1)];
    const spent=Object.values(timing.clock).reduce((sum,t)=>sum+t,0);
    assert(Math.abs(assigned-wins[i].data.remaining-spent)<.015);
    assert(wins[i].data.remaining>[130,60,5][i]); assert(wins[i].data.hp>=2);
    assert(timing.clock.road>45 && timing.clock.road<85);
    for(const category of ['dialogue','arrival','arrivalFade','transition','opening','course'])assert(!timing.clock[category]);
  }
  assert(r.rooms.includes(14)&&r.rooms.includes(24));
  assert(r.rooms.includes(path==='detour'?12:15));assert(r.rooms.includes(path==='detour'?22:23));
  assert(events.some(e=>e.kind==='projectile'&&e.room===21),'projectile must actually be thrown during real entry');
}
console.log('PASS 057: 36 full three-school days, 108 assignments, keyboard/direct, both paths, 3 seeds, 30/60/120 fps; three wins, no falls, at most 4 road hits under the denser schedule, exact shared timer accounting');
const fresh=()=>{const t=createGame();t.g.workshop=true;t.g.seed=4301;t.g.startDay();return t;};
const intro=t=>{for(let i=0;t.g.encounterTime&&i<12;i++)t.press('X');assert.equal(t.g.encounterTime,0);};
for(const [mission,room] of [[1,11],[1,13],[1,14],[2,21],[2,22],[2,24]]){
  const t=fresh(),g=t.g;g.mission=mission;g.begin();g.school();g.schoolFade=0;g.enterRoom(room,90);
  const clock=g.remaining,x=g.px,enemyX=g.enemies[0].x;
  g.keys.RIGHT.isDown=true;g.keys.X.isDown=true;t.advance(50);g.keys.RIGHT.isDown=false;g.keys.X.isDown=false;
  assert.equal(g.px,x);assert.equal(g.enemies[0].x,enemyX);assert.equal(g.remaining,clock);assert(g.encounterTime>0);
  intro(t);assert.equal(g.attack,0);g.enterRoom(g.missionSpec().start,50);g.enterRoom(room,90);assert.equal(g.encounterTime,0);
}
console.log('PASS new encounters: manual full-page reveal/advance, 50-second reading freeze, no held-input skip, no confirming attack, no repeat on return');
for(const mission of [1,2]){
  const t=fresh(),g=t.g;g.mission=mission;g.begin();g.school();g.schoolFade=0;
  const m=g.missionSpec();assert.equal(g.room,m.start);assert.equal(g.remaining,m.seconds);
  const reached=new Set([m.start]),todo=[m.start];while(todo.length){const id=todo.shift();g.enterRoom(id,80);for(const e of g.pointerExits()){assert(m.rooms[e.target]);if(!reached.has(e.target)){reached.add(e.target);todo.push(e.target);}}}
  assert.equal(reached.size,Object.keys(m.rooms).length);g.enterRoom(m.arena,50);assert(!g.pointerExits().length);
  g.cleared.add(m.arena);const exit=g.pointerExits()[0];assert.equal(exit.target,-1);assert(exit.label.includes(m.classroom));
  g.begin();g.notified=true;g.phase='arrival';g.age=0;const before=g.remaining;while(g.phase!=='school')t.step();assert.equal(g.room,m.start);assert.equal(g.remaining,before);
  g.phase='road';g.remaining=.001;t.step();assert.equal(g.phase,'fail');assert.equal(g.results.length,1);t.advance(2.1);t.press('ENTER');assert.equal(g.mission,mission+1);assert.equal(g.phase,mission===1?'free':'report');
}
console.log('PASS both maps: all rooms reachable, persistent returns, arena locked until win, correct classroom, destination arrival and late -> next assignment/report');
{
 const t=fresh(),g=t.g;g.mission=2;g.begin();g.school();g.schoolFade=0;g.enterRoom(24,170);intro(t);g.inv=0;
 const e=g.enemies[0];e.x=220;e.cool=10;e.facing=-1;t.press('X');t.advance(.2);assert.equal(e.hp,6);assert.equal(g.impactKind,'block');
 t.advance(.5);g.px=270;g.face=-1;e.x=220;e.facing=-1;e.cool=10;e.recovery=0;t.press('X');t.advance(.2);assert.equal(e.hp,5);assert.equal(g.impactKind,'hit');
 e.stun=0;e.recovery=0;e.turnTime=0;e.facing=-1;g.updateSecurity(e,.02);assert(e.turnTime>.8);assert.equal(e.facing,-1);g.updateSecurity(e,.5);assert.equal(e.facing,-1);g.updateSecurity(e,.4);assert.equal(e.facing,1);
 g.projectiles=[{x:g.px-3,dir:1,life:1}];g.py=100;g.inv=0;const hp=g.hp;g.updateProjectiles(.02);assert.equal(g.hp,hp);
 g.py=159;g.projectiles=[{x:g.px-3,dir:1,life:1}];g.updateProjectiles(.02);assert.equal(g.hp,hp-1);assert.equal(g.projectiles.length,0);
 g.projectiles=[{x:200,dir:1,life:1}];g.enterRoom(21,50);assert.equal(g.projectiles.length,0);
}
{
 const t=fresh(),g=t.g;g.mission=1;g.begin();g.school();g.schoolFade=0;g.enterRoom(14,120);intro(t);
 const e=g.enemies[0];e.x=31;e.chargeTime=.5;e.chargeDir=-1;const hp=e.hp;g.updateParent(e,.04);assert.equal(e.hp,hp);assert(e.stun>0);assert(e.recovery>0);
}
console.log('PASS frontal security guard/back opening/850ms turn, jumpable one-hit projectile and cleanup; parent boss cannot defeat itself on walls');
const versionTag=JSON.parse(fs.readFileSync('package.json')).version.split('.').slice(0,2).join('');
fs.writeFileSync(`work/day-results-${versionTag}.json`,JSON.stringify({method:'Continuous physical keyboard aliases or DirectInput gestures from normal startDay; state observation only, no health/timer/position/phase writes after start. Synthetic fps is not hardware or human gamefeel validation.',reports:reports.map(r=>({...r,journal:r.journal}))},null,2));

