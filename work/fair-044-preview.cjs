const {createGame}=require('./test-harness.cjs');const {driveInput}=require('./fair-drive-bot-060.cjs');
for(const seed of [4401,1]){const t=createGame(),g=t.g;g.seed=seed;g.mission=2;g.begin();g.phase='road';g.notified=true;let n=0;while(g.phase==='road'&&n++<12000){driveInput(g);t.step();}console.log({seed,phase:g.phase,car:g.car,hits:g.collisions,vehicle:g.vehicle,remaining:g.remaining});}
