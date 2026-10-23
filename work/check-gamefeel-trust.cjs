const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const {createGame} = require('./test-harness.cjs');
const strip = s => s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, '').replace(/export /g, '');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(require('node:module').stripTypeScriptTypes(strip(fs.readFileSync('src/player-experience.ts','utf8'))+';globalThis.help=contextualHelp;'),ctx);
const state = {phase:'school',paused:false,mission:0,age:1,room:200,encounterTime:0,roomEnteredAt:0,session:{elapsed:1}};
for(const [room,match] of [[200,/marcher/],[201,/F\/X/],[207,/inspection/]]) {
 state.room=room;assert.match(ctx.help(state),match,`actual H1 room ${room} must teach its action`);
 state.encounterTime=5;assert.equal(ctx.help(state),'');state.encounterTime=0;
 state.roomTransition={};assert.equal(ctx.help(state),'');state.roomTransition=null;
 state.paused=true;assert.equal(ctx.help(state),'');state.paused=false;
}
state.session.elapsed=60;state.roomEnteredAt=59;state.room=201;
assert.match(ctx.help(state),/F\/X/,'reading a dialogue must not consume the help window');
console.log('PASS H1 contextual help, dialogue/transition/pause priority and fresh reading window');
function road(fps=60) {
 const t=createGame(),g=t.g;g.begin();g.phase='road';g.notified=true;g.speed=260;
 g.keys.UP.isDown=true;g.car=0;g.obstacles=[{z:30,x:.5,type:0,speed:78}];
 const sounds=[];g.audio.pass=(...args)=>sounds.push(args);
 return {...t,fps,o:g.obstacles[0],sounds};
}
const successes=g=>g.session.events.filter(e=>['pass','near-pass'].includes(e.kind));
for(const fps of [30,60,120]) {
 const t=road(fps),g=t.g;let approach=false;
 for(let n=0;n<40;n++) {
  t.step(1000/fps);const d=t.o.z-g.travel;
  if(t.sounds.length&&d>=-4){approach=true;assert.equal(successes(g).length,0,'approach sound is not a completed pass');}
  if(successes(g).length){assert(d<-4);break;}
 }
 assert(approach);assert.equal(successes(g).length,1);assert.equal(successes(g)[0].kind,'near-pass');
 t.advance(.02);assert.equal(successes(g).length,1,'one confirmation per traffic life');
}
{
 const t=road(),g=t.g;
 while(!t.sounds.length)t.step(1000/120);
 g.car=t.o.x;g.steerVelocity=0;t.advance(.15,120);
 assert(t.o.hit);assert.equal(successes(g).length,0,'a late collision cancels confirmation');
}
{
 const t=road(),g=t.g;g.trafficHit=1;g.car=t.o.x;
 t.advance(.3,120);assert.equal(g.collisions,0);assert.equal(successes(g).length,0,'cooldown overlap is not a clean pass');
 t.o.z=g.travel-41;t.o.passed=true;t.o.passMargin=-1;t.step(1000/120);
 assert.equal(t.o.passed,false);assert.equal(t.o.passMargin,undefined);
}
console.log('PASS approach vs clearance, one confirmation, late crash/cooldown rejection and recycling at 30/60/120fps');
