const fs=require('fs');
const {createGame}=require('./test-harness.cjs');
const {driveInput}=require('./fair-drive-bot-060.cjs');
const runs=[];
for(const mission of [0,1,2])for(const seed of [4301,8317,2026]){
 const h=createGame(),g=h.g;g.workshop=true;g.seed=seed;g.mission=mission;g.begin();
 let chosen=null,at=null,found=null;
 for(let tick=0;tick<10000&&['free','receive','road'].includes(g.phase);tick++){
  for(const k of Object.values(g.keys)) k.isDown=false;
  driveInput(g);
  if(!chosen&&g.notified&&g.speed>160){
   chosen=g.obstacles.filter(o=>!o.sounded&&!o.hit&&o.z-g.travel>90&&o.z-g.travel<220).sort((a,b)=>a.z-b.z)[0]??null;
  }
  if(chosen){
   const width=(42+[52,68,46][chosen.type])/210;
   const side=chosen.x>0?-1:1;
   const target=chosen.sounded?chosen.x:chosen.x+side*(width+.03);
   const predicted=g.car+g.steerVelocity*.24;
   g.keys.RIGHT.isDown=predicted<target-.01;g.keys.LEFT.isDown=predicted>target+.01;
   g.keys.UP.isDown=true;g.keys.DOWN.isDown=false;
  }
  h.step(1000/60);
  if(chosen?.sounded&&!at)at={tick,time:g.session.elapsed,distance:chosen.z-g.travel,car:g.car,lane:chosen.x,type:chosen.type,event:g.session.events.at(-1)};
  if(chosen?.hit&&at){found={pass:at,hit:{tick,time:g.session.elapsed,distance:chosen.z-g.travel,car:g.car,event:g.session.events.at(-1)},vehicle:g.vehicle};break;}
  if(chosen&&chosen.z-g.travel<0&&!chosen.sounded){chosen=null;at=null;}
  if(chosen&&at&&chosen.z-g.travel<0){chosen=null;at=null;}
 }
 runs.push({mission:mission+1,seed,found});
}
fs.writeFileSync(__dirname+'/review-060-pass-results.json',JSON.stringify({method:'Normal held inputs. Drive alongside one naturally spawned vehicle just outside contact width, then steer inward after its pass announcement. No position, speed, clock or vehicle writes.',runs},null,2));console.log(JSON.stringify(runs,null,2));
