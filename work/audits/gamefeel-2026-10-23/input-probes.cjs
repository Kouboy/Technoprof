const fs=require('node:fs');
fs.mkdirSync('work/checkpoints', {recursive:true});
const {createGame}=require('../../test-harness.cjs');
const cases=[];
for(const gap of [36,136])for(const delay of [.2,.4,.48]){
 const t=createGame(),g=t.g;
 g.workshop=true;g.controls=new t.api.ActionInput();g.keys=g.controls.keys;
 g.physicalKeys=Object.fromEntries(Object.values(t.api.BINDINGS).flat().map(k=>[k,{isDown:false,just:false}]));
 g.loadScenario('hanouna-navigation-h1');t.advance(1);g.face=1;
 g.enemies=[{x:g.px+gap,hp:999,stun:999,wind:0,cool:999,recovery:999,pattern:0}];
 g.physicalKeys.F.just=true;t.step(1000/60);t.advance(delay,60);
 const before={attack:g.attack,hitStop:g.hitStop};
 g.physicalKeys.F.just=true;t.step(1000/60);t.advance(1,60);
 cases.push({gap,delay,before,attacks:g.session.events.filter(e=>e.kind==='attack').map(e=>e.at)});
}
fs.writeFileSync('work/checkpoints/audit-gamefeel-input.json',JSON.stringify(cases,null,2));console.log(JSON.stringify(cases,null,2));
