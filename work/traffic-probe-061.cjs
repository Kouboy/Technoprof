const fs=require('fs');
const {createGame}=require('./test-harness.cjs');
const drivers={simple:require('./drive-bot.cjs').driveInput,anticipatory:require('./fair-drive-bot-060.cjs').driveInput};
const trials=[];
for(const driver of ['simple','anticipatory'])for(const seed of [1,4301,8317])for(const mission of [0,1,2]){
 const {g,step}=createGame();g.workshop=true;g.seed=seed;g.mission=mission;g.begin();
 let steps=0,confirmed=0,visiblePeak=0;
 while(['free','receive','road'].includes(g.phase)&&steps++<15000){
  const before=new Map(g.obstacles.map(o=>[o,o.z-g.travel]));
  drivers[driver](g,1);step(1000/60);
  for(const o of g.obstacles)if(before.get(o)>=-4&&o.z-g.travel<-4&&!o.hit)confirmed++;
  visiblePeak=Math.max(visiblePeak,g.obstacles.filter(o=>o.z-g.travel>0&&o.z-g.travel<900).length);
 }
 trials.push({driver,seed,mission:mission+1,phase:g.phase,vehicle:g.vehicle,hits:g.collisions,remaining:g.remaining,confirmed,announced:g.session.events.filter(e=>['pass','near-pass'].includes(e.kind)).length,visiblePeak});
 console.log(JSON.stringify(trials.at(-1)));
}
fs.writeFileSync('work/traffic-probe-061.json',JSON.stringify({method:'Normal cruising and assignment from fixed deterministic start; held inputs only. Confirmed crossings observed after the contact zone, no hit, independently of anticipatory announcements. Human visibility and difficulty remain unverified.',trials},null,2));
