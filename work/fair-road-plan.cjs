const {createGame}=require('./test-harness.cjs');const {driveInput}=require('./fair-drive-bot-060.cjs');
for(const cap of [260])for(const seed of [1,4301,8317]){
 const t=createGame(),g=t.g;g.workshop=true;g.seed=seed;g.mission=2;g.begin();let steps=0;
 while(['free','road','receive'].includes(g.phase)&&steps++<20000){
 driveInput(g,1);if(g.notified&&g.speed>cap){g.keys.UP.isDown=false;g.keys.DOWN.isDown=true;}t.step(1000/60);
 }
 console.log({cap,seed,phase:g.phase,hits:g.collisions,vehicle:g.vehicle,remaining:g.remaining,passed:g.session.events.filter(e=>['pass','near-pass'].includes(e.kind)).length});
}

