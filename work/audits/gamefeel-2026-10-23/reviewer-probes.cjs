const fs = require('node:fs'), vm = require('node:vm');
fs.mkdirSync('work/checkpoints/gamefeel-reviewer', {recursive:true});
const {createGame} = require('../../test-harness.cjs');
const {runDay} = require('../../validated-day-runner.cjs');

function setup(scenario='hanouna-navigation-h1') {
  const t = createGame(), g=t.g;
  g.workshop=true;
  g.controls=new t.api.ActionInput();
  g.keys=g.controls.keys;
  g.physicalKeys=Object.fromEntries(Object.values(t.api.BINDINGS).flat().map(k=>[k,{isDown:false,just:false}]));
  g.direct=new t.api.DirectInput(g);
  g.loadScenario(scenario);
  t.advance(1);
  g.direct.tick(0);
  return t;
}

const text=fs.readFileSync('src/player-experience.ts','utf8');
const helpSource=text.slice(text.indexOf('export function contextualHelp'),text.indexOf('type Host =')).replace('export ','');
const ctx={DAY_BRIEFS:['brief1','brief2','brief3']};
vm.createContext(ctx);
vm.runInContext(require('node:module').stripTypeScriptTypes(helpSource),ctx);
const help = [0,1,4,200,201,207].map(room=>({room,help:ctx.contextualHelp({paused:false,phase:'school',mission:0,room,age:1,session:{elapsed:1},roomEnteredAt:0,encounterTime:0})}));

function queuedInput(kind,delay) {
  const t=setup(),g=t.g;
  // An isolated safe target only measures input acceptance, not enemy balance.
  g.enemies=[{x:g.px+36,hp:999,stun:999,wind:0,cool:999,recovery:999,pattern:0}];
  g.face=1;
  g.physicalKeys.F.just=true;
  t.step(1000/60);
  t.advance(delay,60);
  if(kind==='keyboard')g.physicalKeys.F.just=true;
  else {g.direct.down(1,g.enemies[0].x,110);g.direct.up(1,g.enemies[0].x,110);}
  t.advance(1,60);
  return {kind,delay,attacks:g.session.events.filter(e=>e.kind==='attack').map(e=>e.at)};
}

function jumpBuffer(leadFrames) {
  const t=setup(),g=t.g;
  g.physicalKeys.SPACE.just=true;
  t.step(1000/60);
  let steps=0;
  // First flight's landing is 43rd frame at 60fps.
  while(steps<41-leadFrames){t.step(1000/60);steps++;}
  const at={py:g.py,vy:g.vy};
  g.physicalKeys.SPACE.just=true;
  t.step(1000/60);
  let minimum=g.py;
  for(let i=0;i<20;i++){t.step(1000/60);minimum=Math.min(minimum,g.py);}
  return {leadFrames,at,minimum,finalY:g.py};
}

function periodicFight(scenario,jumping,interval) {
  const t=setup(scenario),g=t.g;
  for(let i=0;g.encounterTime && i<20;i++){g.physicalKeys.F.just=true;t.step(1000/60);}
  const e=g.enemies[0],start=g.session.elapsed;
  for(let i=0;i<60*40 && g.phase==='school' && e.hp>0;i++) {
    if(i%interval===0) {
      g.physicalKeys.F.just=true;
      if(jumping)g.physicalKeys.SPACE.just=true;
    }
    // Constant forward pressure is deliberately uninformed by enemy phases.
    g.physicalKeys.D.isDown=true;
    t.step(1000/60);
  }
  return {scenario,jumping,interval,phase:g.phase,hp:g.hp,enemyHp:e.hp,elapsed:g.session.elapsed-start,attacks:g.session.events.filter(e=>e.kind==='attack').length,contacts:g.session.events.filter(e=>e.kind==='contact').length,blocked:g.session.events.filter(e=>e.kind==='blocked').length};
}
const report={help,queues:[queuedInput('keyboard',0.2),queuedInput('direct',0.2),queuedInput('keyboard',0.4),queuedInput('direct',0.4),queuedInput('keyboard',0.48)],jumpBuffer:[0,1,2].map(jumpBuffer),periodicFights:[]};
for(const scenario of ['hanouna-navigation-h1-boss','bruel-navigation-a3-parent','inshape-navigation-i2-boss'])for(const jump of [false,true])for(const interval of [6,12,18])report.periodicFights.push(periodicFight(scenario,jump,interval));
if(process.argv.includes('--days')) report.days=[];
if(report.days)for(const fps of [30,60,120])for(const mode of ['keyboard','direct']) {
  const r=runDay({fps,mode}).report;
  report.days.push({fps,mode,won:r.won,results:r.results,falls:r.falls,collisions:r.collisions,timing:r.journal.missionTiming});
}
fs.writeFileSync('work/checkpoints/gamefeel-reviewer/probes.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
