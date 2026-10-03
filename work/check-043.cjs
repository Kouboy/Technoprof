const assert=require('assert');
const {createGame}=require('./test-harness.cjs');
const contact=(room,art)=>{
 const {g,advance,press}=createGame();g.begin();g.school();g.schoolFade=0;g.enterRoom(room,175);
 if(art)g.art={};const e=g.enemies[0];e.x=215;g.face=1;
 const before=[g.px,g.py,g.remaining,e.x,e.hp];
 g.keys.RIGHT.isDown=true;advance(.3);g.keys.RIGHT.isDown=false;
 assert.deepEqual([g.px,g.py,g.remaining,e.x,e.hp],before);assert.equal(e.wind,0);
 press('X');assert(g.encounterTime>0);press('X');press('X');press('X');
 assert.equal(g.encounterTime,0);assert.equal(g.attack,0);assert.equal(e.hp,before[4]);
 press('X');advance(.2);assert.equal(e.hp,room===1?2:1);
 return [e.hp,g.px,g.py,g.remaining,g.punches];
};
for(const room of [1,3,6])assert.deepEqual(contact(room,false),contact(room,true));
console.log('PASS locked conversation, reveal then advance, no accidental attack, identical rules with/without art');

{
 const {g,advance,press}=createGame();g.loadScenario('hit');g.inv=0;press('X');g.hurt();const hp=g.enemies[0].hp;
 assert.equal(g.attack,0);press('X');assert.equal(g.attack,0);advance(.2);assert.equal(g.enemies[0].hp,hp);
 g.enterRoom(8,112);g.schoolFade=0;g.keys.X.just=true;advance(.02);assert(g.falling>0);assert.equal(g.attack,0);
 g.enterRoom(5,220);g.schoolFade=0;g.interactLock=0;g.attack=.3;g.keys.UP.isDown=true;advance(.1);assert.equal(g.room,5);advance(.5);assert.equal(g.room,6);
 g.enterRoom(6,300);g.encounterTime=0;g.py=130;g.vy=0;advance(.02);assert.equal(g.room,6);g.keys.UP.isDown=false;g.keys.RIGHT.isDown=true;advance(.8);g.keys.RIGHT.isDown=false;assert.equal(g.room,7);
 console.log('PASS hurt cancels book, no strike during recovery/fall, interaction waits for recovery/landing');
}
for(const [scenario,reason,seconds]of [['late','late',2.1],['exhausted','exhausted',1],['breakdown','breakdown',2]]){
 const {g,advance,press}=createGame();g.loadScenario(scenario);advance(seconds);assert.equal(g.phase,'fail',scenario);assert.equal(g.failureReason,reason);
 assert.equal(g.attack,0);assert.equal(g.encounterTime,0);assert(g.enemies.every(e=>e.wind===0&&e.recovery===0));
 const count=g.results.length,remaining=g.remaining;g.finish(false);assert.equal(g.results.length,count);press('ENTER');assert.equal(g.phase,'fail');advance(2);assert.equal(g.remaining,remaining);assert.equal(g.phase,'fail');press('ENTER');assert.equal(g.phase,'free');
 assert(g.session.events.some(e=>e.kind==='failure'&&e.data.reason===reason));
}
console.log('PASS three real failures, explicit reasons, terminal cleanup, idempotence, fresh Enter after reading delay');
for(const fps of [15,30,60,120]){
 const {g,advance,step}=createGame();g.loadScenario('late');g.remaining=240;advance(10,fps);assert(Math.abs(g.remaining-230)<1e-8,`${fps} fps clock`);
 const before=g.remaining;step(1500);assert(g.paused);assert.equal(g.pauseReason,'INTERRUPTION LONGUE');advance(2,fps);assert.equal(g.remaining,before);
}
console.log('PASS 15/30/60/120 fps equal mission time; long stalls pause explicitly');
function traffic(seed){const {g,advance}=createGame();g.seed=seed;g.loadScenario('road');g.car=-1.1;g.obstacles.forEach(o=>o.z=-45);advance(1);return JSON.stringify(g.obstacles);}
assert.equal(traffic(4301),traffic(4301));assert.notEqual(traffic(4301),traffic(4302));
{
 const {g,step,advance,press}=createGame();g.workshop=true;g.loadScenario('hit');g.paused=true;const before=g.remaining;g.workshopStep=true;step();assert(g.paused);assert(Math.abs(g.remaining-(before-.02))<1e-8);advance(1);assert.equal(g.remaining,before-.02);
 g.loadScenario('success');press('X');advance(.7);assert.equal(g.enemies[0].hp,0);g.px=280;press('UP');assert.equal(g.phase,'opening');const clock=g.remaining;advance(4.4);assert.equal(g.phase,'course');assert.equal(g.remaining,clock);
 g.loadScenario('arrival');press('X');advance(7.7);assert.equal(g.phase,'school');assert.equal(g.attack,0);
}
console.log('PASS seed replay, paused 20ms step, real final blow/class entry, transition rejects stale attack');
