const fs = require('node:fs');
fs.mkdirSync('work/checkpoints', {recursive:true});
const {createGame} = require('../../test-harness.cjs');
const {driveInput} = require('../../fair-drive-bot-060.cjs');
const dt = 1/120;
function isolated(speed) {
  const t = createGame(), g = t.g;
  g.validatedDay = true; g.startDay();
  g.phase='road';g.notified=true;g.speed=speed;g.obstacles=[];
  return t;
}
const results = {scope:'Controlled initial states only, then normal inputs and actual simulation; no collision-free run is a human playtest', acceleration:[], braking:[], steering:[], impacts:[], passThenCrash:[]};
{
 const t=isolated(110),g=t.g;g.keys.UP.isDown=true;
 const reached={};
 for(let n=0;n<120*20;n++){
   t.step(1000/120);
   for(const target of [180,220,240,255,260]) if(g.speed>=target && !reached[target]) reached[target]=+(n*dt+dt).toFixed(3);
 }
 results.acceleration.push({from:110,reached});
}
for(const speed of [110,260]) {
 const t=isolated(speed),g=t.g;g.keys.DOWN.isDown=true;
 let n=0;
 while(g.speed>0&&n<120*10){t.step(1000/120);n++;}
 results.braking.push({from:speed,seconds:+(n*dt).toFixed(3),distanceMeters:+g.road.toFixed(2)});
}
for(const speed of [110,260]) {
 const t=isolated(speed),g=t.g;
 // Keep speed exactly nominal by using the existing cruise cap at 110.
 if(speed===110){g.phase='free';g.notified=false;}
 g.keys.UP.isDown=true;g.keys.RIGHT.isDown=true;
 for(let i=0;i<36;i++)t.step(1000/120);
 const atRelease={x:g.car,v:g.steerVelocity};
 g.keys.RIGHT.isDown=false;
 for(let i=0;i<72;i++)t.step(1000/120);
 results.steering.push({speed,holdSeconds:.3,releaseSeconds:.6,xAtRelease:+atRelease.x.toFixed(3),velocityAtRelease:+atRelease.v.toFixed(3),extraPixelsAfterRelease:+((g.car-atRelease.x)*105).toFixed(2),finalVelocity:+g.steerVelocity.toFixed(3)});
}
for(const speed of [20,110,260]) {
 const t=isolated(speed),g=t.g;g.crash(0,0);
 const after={hp:g.vehicle,speed:g.speed};
 g.keys.UP.isDown=true;
 let n=0;while(g.speed<speed&&n<120*20){t.step(1000/120);n++;}
 results.impacts.push({from:speed,carDamage:100-after.hp,afterSpeed:after.speed,recoverySeconds:+(n*dt).toFixed(3)});
}
for(const mission of [0,1,2])for(const seed of [4301,8317,2026]) {
 const t=createGame(),g=t.g;g.workshop=true;g.seed=seed;g.mission=mission;g.begin();
 let chosen=null,announced=null,found=null;
 for(let tick=0;tick<10000&&['free','receive','road'].includes(g.phase);tick++){
  for(const key of Object.values(g.keys))key.isDown=false;
  driveInput(g);
  if(!chosen&&g.notified&&g.speed>160) chosen=g.obstacles.filter(o=>!o.sounded&&!o.hit&&o.z-g.travel>90&&o.z-g.travel<220).sort((a,b)=>a.z-b.z)[0]??null;
  if(chosen){const width=(42+[52,68,46][chosen.type])/210,side=chosen.x>0?-1:1;
   const target=chosen.sounded?chosen.x:chosen.x+side*(width+.03),predicted=g.car+g.steerVelocity*.24;
   g.keys.RIGHT.isDown=predicted<target-.01;g.keys.LEFT.isDown=predicted>target+.01;
   g.keys.UP.isDown=true;g.keys.DOWN.isDown=false;}
  t.step(1000/60);
  if(chosen?.sounded&&!announced)announced={time:g.session.elapsed,distance:chosen.z-g.travel};
  if(chosen?.hit&&announced){found={delayMs:Math.round((g.session.elapsed-announced.time)*1000),distanceAtAnnouncement:+announced.distance.toFixed(2)};break;}
  if(chosen&&chosen.z-g.travel<0){chosen=null;announced=null;}
 }
 results.passThenCrash.push({mission:mission+1,seed,found});
}
fs.writeFileSync('work/checkpoints/audit-gamefeel-road.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
