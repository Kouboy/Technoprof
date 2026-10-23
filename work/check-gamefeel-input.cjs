const assert=require('node:assert/strict');
const {createGame}=require('./test-harness.cjs');
function setup(variant='tolerant',segment='gaps') {
 const t=createGame(),g=t.g;g.workshop=true;g.loadScenario(`gamefeel-${variant}-${segment}`);
 g.encounterTime=g.bossIntro=g.schoolFade=0;g.interactLock=0;g.hitStop=0;
 g.enemies=[];g.px=60;g.py=159;g.vy=0;
 return t;
}
{
 const {g}=setup();assert.equal(g.room,317);assert.equal(g.gamefeelVariant,'tolerant');
 assert.equal(g.gamefeelTuning().attackBuffer,.16);assert.equal(g.gamefeelTuning().jumpBuffer,.09);
 assert.equal(g.journalSnapshot().gamefeel.variant,'tolerant');
 g.loadScenario('journee-validee');assert.equal(g.gamefeelTuning().attackBuffer,.1);
 assert.equal(g.gamefeelTuning().jumpBuffer,0);assert.equal(g.gamefeelLab,false);
 assert.equal(g.journalSnapshot().gamefeel,undefined);
}
// A fresh F in the final 140ms is accepted only in B. Holding never repeats.
for(const variant of ['reference','tolerant']) {
 const t=setup(variant),g=t.g;g.attack=.15;g.attackHit=true;
 t.press('X');t.advance(.18,100);
 assert.equal(g.session.events.filter(e=>e.kind==='attack').length,variant==='tolerant'?1:0);
 g.keys.X.isDown=true;t.advance(.8,100);
 assert.equal(g.session.events.filter(e=>e.kind==='attack').length,variant==='tolerant'?1:0);
}
for(const fps of [30,60,120])for(const variant of ['reference','tolerant']) {
 const t=setup(variant),g=t.g;g.py=153;g.vy=155;
 g.keys.SPACE.just=true;t.step(1000/fps);t.advance(.06,fps);
 assert.equal(g.vy<0,variant==='tolerant',`landing anticipation ${variant} ${fps}`);
}
{
 const t=setup(),g=t.g;g.py=120;g.vy=30;t.press('SPACE');t.advance(.5,100);
 assert.equal(g.py,159,'an early press expires');assert.equal(g.jumpBuffer,0);
}
for(const interruption of ['pause','menu','door','dialogue','hurt','care','reprise','fall']) {
 const t=setup(),g=t.g;g.jumpBuffer=.09;g.attackBuffer=.16;
 if(interruption==='pause'){g.setPaused(true);g.setPaused(false);}
 if(interruption==='menu'){g.setPlayerMenu(true);g.setPlayerMenu(false);}
 if(interruption==='door')g.changeRoom(307,60);
 if(interruption==='dialogue'){g.encounterTime=5;t.step();}
 if(interruption==='hurt'){g.inv=0;g.hurt();}
 if(interruption==='care'){g.enterRoom(315,60);t.step();}
 if(interruption==='reprise'){
  g.loadScenario('gamefeel-tolerant-parent');g.jumpBuffer=.09;g.attackBuffer=.16;
  g.beginParentBreakaway(g.enemies[0]);
 }
 if(interruption==='fall'){g.px=130;g.py=159;g.tryFall();assert(g.falling>0);}
 assert.equal(g.jumpBuffer,0,interruption);assert.equal(g.attackBuffer,0,interruption);
}
{
 const t=setup(),g=t.g;g.py=153;g.vy=155;g.hitStop=.04;
 t.press('SPACE');t.advance(.1,100);assert(g.vy<0,'a voluntary hit stop preserves a fresh landing request');
}
{
 const t=setup(),g=t.g;g.px=130;g.py=153;g.vy=155;t.press('SPACE');t.advance(.05,100);
 assert(g.falling>0,'a queued jump never rescues a landing in a hole');
}
{
 const t=setup(),g=t.g;t.press('SPACE');
 const trace=g.session.events.filter(e=>e.kind==='control');
 assert(trace.some(e=>e.data.action==='jump'&&e.data.outcome==='request'));
 assert(trace.some(e=>e.data.action==='jump'&&e.data.outcome==='accepted'));
 g.loadScenario('inshape-navigation-i2-view-317');t.press('SPACE');
 assert(!g.session.events.some(e=>e.kind==='control'),'no instrumentation noise outside the lab');
}
console.log('PASS A/B isolation, 100/160ms attacks, 90ms safe landing buffer, held input, expiry, forced cancellations, trace at 30/60/120fps');
const reviewCases = {
 'fresh runtime per comparison': () => {
  const t=setup('reference'),g=t.g;t.step(250);
  assert(g.journalSnapshot().runtime.frameIntervalsMs.samples>0);
  g.loadScenario('gamefeel-tolerant-gaps');t.step(8);
  const frames=g.journalSnapshot().runtime.frameIntervalsMs;
  assert.equal(frames.samples,1);assert.equal(frames.max,8);
 },
 'ground jump during hit stop has a decision': () => {
  const t=setup(),g=t.g;g.hitStop=.04;t.press('SPACE');
  const decisions=g.session.events.filter(e=>e.kind==='control'&&e.data.action==='jump');
  assert(decisions.some(e=>e.data.outcome==='rejected'&&e.data.reason==='hit-stop'));
 },
 'resume frame consumes simultaneous commands': () => {
  for(const action of ['SPACE','X']) {
   const t=setup(),g=t.g;g.setPaused(true);g.keys.P.just=true;g.keys[action].just=true;t.step();
   assert.equal(g.paused,false);assert.equal(g.py,159);assert.equal(g.attack,0);
   assert(!g.session.events.some(e=>e.kind==='control'&&e.data.outcome==='accepted'));
  }
 },
 'landing buffer is at most 90ms of controllable time': () => {
  for(const [fps,y] of [[30,155.501],[60,155.501],[120,156.251]]) {
   const t=setup(),g=t.g;g.py=y;g.vy=0;g.keys.SPACE.just=true;
   t.step(1000/fps);for(let n=0;n<Math.ceil(.14*fps);n++)t.step(1000/fps);
   assert.equal(g.vy,0,`${fps}fps must not accept a >90ms-early request`);
   assert.equal(g.py,159);
  }
 },
};
const failures=[];
for(const [name,test] of Object.entries(reviewCases))try{test();console.log('PASS review:',name);}catch(e){failures.push(name+': '+e.message);}
assert.deepEqual(failures,[]);
for(const device of ['keyboard','pointer']) {
 const t=setup(),g=t.g;
 g.controls=new t.api.ActionInput();g.keys=g.controls.keys;
 g.physicalKeys=Object.fromEntries(Object.values(t.api.BINDINGS).flat().map(k=>[k,{isDown:false,just:false}]));
 g.direct=new t.api.DirectInput(g);g.direct.tick(0);g.py=153;g.vy=155;
 if(device==='keyboard')g.physicalKeys.SPACE.just=true;
 else{g.direct.down(1,60,150);g.direct.move(1,60,110);g.direct.up(1,60,110);}
 t.step(20);t.advance(.07,100);
 assert(g.vy<0,device+' uses the same landing tolerance');
 assert(g.session.events.some(e=>e.kind==='control'&&e.data.action==='jump'&&e.data.outcome==='accepted'&&e.data.source===device));
}
console.log('PASS actual ActionInput keyboard and DirectInput swipe use the B landing buffer');
