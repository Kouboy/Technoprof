// Read-only diagnostic probes of the 0.42 game logic; does not alter the playable.
const fs = require('fs');
const bootstrap = fs.readFileSync('work/check.cjs','utf8').split('g.begin();step(300)')[0];
const fresh = () => new Function('require', bootstrap + '\nreturn {g,step};')(require);
const results = {};
results.edgeDriving = [];
for(let mission=0;mission<3;mission++) {
  const {g,step}=fresh(); g.mission=mission;g.begin();g.notified=true;g.phase='road';
  let frames=0;
  for(;frames<20000&&g.phase==='road';frames++) {
    g.keys.UP.isDown=true;g.keys.LEFT.isDown=g.car>-.96;g.keys.RIGHT.isDown=g.car< -1;step(1);
  }
  results.edgeDriving.push({mission:mission+1,phase:g.phase,collisions:g.collisions,vehicle:g.vehicle,seconds:frames*.02,remaining:g.remaining});
}
results.introCombat=[];
for(const room of [3,6]) {
  const {g,step}=fresh();g.begin();g.school();g.schoolFade=0;g.enterRoom(room,170);g.face=1;
  const e=g.enemies[0];let frames=0;
  for(;frames<400&&e.hp>0;frames++) {
    g.keys.RIGHT.isDown=e.x-g.px>44;
    if(g.attack===0)g.keys.X.just=true;
    step(1);
  }
  results.introCombat.push({room,enemyHp:e.hp,seconds:frames*.02,introRemaining:g.encounterTime,playerHp:g.hp,enemyWind:e.wind});
}
results.introOverlap=[];
for(const room of [3,6]) {
  const {g,step}=fresh();g.begin();g.school();g.schoolFade=0;g.enterRoom(room,170);
  g.keys.RIGHT.isDown=true;step(23);
  results.introOverlap.push({room,playerX:g.px,enemyX:g.enemies[0].x,separation:Math.abs(g.px-g.enemies[0].x),introRemaining:g.encounterTime});
}
results.clockAtFps=[];
for(const fps of [15,30,60,120]) {
  const {g}=fresh();g.begin();g.notified=true;g.phase='road';g.obstacles=[];g.speed=0;
  for(let i=0;i<fps*10;i++) g.update(0,1000/fps);
  results.clockAtFps.push({fps,realSeconds:10,clockSeconds:240-g.remaining});
}
const {g,step}=fresh();g.begin();g.school();g.schoolFade=0;g.enterRoom(6,100);step(100);g.enterRoom(7,100);g.enterRoom(6,100);
results.returnDuringSpeech={introRemaining:g.encounterTime};
console.log(JSON.stringify(results,null,2));
fs.writeFileSync('work/audit-042-results.json',JSON.stringify(results,null,2)+'\n');
