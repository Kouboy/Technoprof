// Focused diagnostic: fixed workshop setup, then player inputs only.
// No health, position, immunity or enemy-state edits after the setup.
const fs = require('fs');
const {createGame} = require('./test-harness.cjs');
function trial(fps, delay, movement) {
  const {g,step} = createGame();
  g.workshop = true;
  g.loadScenario('bruel-rush');
  const e = g.enemies[0], hp = g.hp;
  let windAt, releaseAt, jumpAt, hitAt, charged = false;
  for(let i=0;i<fps*5;i++) {
    const t=i/fps;
    if(windAt!==undefined && jumpAt===undefined && t-windAt>=delay-1e-8) {
      g.keys.SPACE.just=true;
      jumpAt=t;
    }
    g.keys.RIGHT.isDown=movement==='toward' && jumpAt!==undefined;
    g.keys.LEFT.isDown=movement==='away' && jumpAt!==undefined;
    step(1000/fps);
    if(windAt===undefined && e.wind>0) windAt=t;
    if(releaseAt===undefined && e.chargeTime>0) releaseAt=t;
    if(g.hp<hp && hitAt===undefined) hitAt=t;
    if(e.chargeTime>0) charged=true;
    if(charged && e.chargeTime<=0) return {fps,delay,movement,damage:hp-g.hp,windAt,releaseAt,jumpAt,hitAt};
  }
  throw Error('First charge did not finish');
}
const rows=[];
for(const fps of [30,60,120]) for(const movement of ['still','toward','away'])
  for(let i=0;i<=160;i++) rows.push(trial(fps,i/100,movement));
const summary=[30,60,120].flatMap(fps=>['still','toward','away'].map(movement=>{
  const group=rows.filter(r=>r.fps===fps && r.movement===movement);
  const safe=group.filter(r=>r.damage===0).map(r=>r.delay);
  return {fps,movement,trials:group.length,safeTrials:safe.length,firstSafe:safe[0]??null,lastSafe:safe.at(-1)??null};
}));
const output={setup:'bruel-rush workshop: player x175, parent x220, grounded, no immunity; normal windup and charge',summary,rows};
fs.writeFileSync('work/review-060-charge-results.json',JSON.stringify(output,null,2));
console.log(JSON.stringify(summary,null,2));
