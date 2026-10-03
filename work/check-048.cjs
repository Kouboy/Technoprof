const assert=require('assert'),fs=require('fs'),vm=require('vm');
const {createGame}=require('./test-harness.cjs');
const strip=s=>s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
const ctx={};vm.createContext(ctx);
vm.runInContext(require('node:module').stripTypeScriptTypes(['world','dialogue','gameplay','combat-poses','driving','presentation','small-lettering','cadre','school-props'].map(n=>strip(fs.readFileSync('src/'+n+'.ts','utf8'))).join('\n')+'\nglobalThis.rules={dialogueReady,dialogueLayout,dialogueLength,ENCOUNTERS,BOSS,DRIVE,teacherPose,roadProjection,cadreModel};'),ctx);
const r=ctx.rules;
for(const fps of [15,30,60,120]) for(const [scenario,room] of [['parent',1],['student',3],['guard',6],['boss',4]]) {
 const {g,advance,press}=createGame();g.loadScenario(scenario);
 const e=g.enemies[0],before=[g.px,g.py,g.remaining,e.x,e.hp,g.hp];
 g.keys.RIGHT.isDown=true;g.keys.UP.isDown=true;g.keys.SPACE.isDown=true;
 advance(.2,fps);assert(g.dialogue.characters>0);assert(!r.dialogueReady(room,g.dialogue));
 assert.equal(r.teacherPose(g).frame,0,'held direction must not animate a locked teacher');
 press('X');assert(r.dialogueReady(room,g.dialogue));assert.equal(g.dialogue.page,0);
 g.keys.X.isDown=true;advance(30,fps);
 assert.equal(g.dialogue.page,0,'held action must not skip a page');
 assert.deepEqual([g.px,g.py,g.remaining,e.x,e.hp,g.hp],before);
 assert(r.cadreModel(g,4200).suspended,'clock must say suspended');
 press('X');assert.equal(g.dialogue.page,1);assert(!r.dialogueReady(room,g.dialogue));
 const chars=g.dialogue.characters;g.setPaused(true);advance(2,fps);assert.equal(g.dialogue.characters,chars);g.setPaused(false);
 press('X');assert(r.dialogueReady(room,g.dialogue));assert(g.encounterTime>0);
 press('X');assert.equal(g.encounterTime,0);assert.equal(g.bossIntro,0);assert.equal(g.attack,0);assert.equal(g.attackBuffer,0);
 assert.deepEqual([g.px,g.py,g.remaining,e.x,e.hp,g.hp],before,'final confirmation cannot move, hit or cost mission time');
 for(const k of Object.values(g.keys))k.isDown=false;
 advance(.1,fps);assert(g.remaining<before[2]);assert.equal(g.attack,0);
 g.enterRoom(5,50);g.enterRoom(room,100);assert.equal(g.encounterTime,0,'do not repeat the greeting on re-entry');
}
console.log('PASS four conversations at 15/30/60/120 fps: frozen actors/timer, typewriter, held input, pause, last X consumed, re-entry');
{
 const {g,press,advance}=createGame();g.loadScenario('parent');g.schoolFade=.7;press('X');assert.equal(g.dialogue.page,0);assert.equal(g.dialogue.characters,0);advance(.8);assert(g.dialogue.characters>0);assert(!r.dialogueReady(g.room,g.dialogue));
}
for(const room of [1,3,4,6])for(const page of [0,1])for(const x of [22,150,287]){
 const state={page,characters:0},b=r.dialogueLayout(room,9,x,true,state);
 assert(b.x>=12&&b.x+b.w<=308);assert(b.y+b.h<r.dialogueLayout(room,9,x,true,state).mouthY);
 const headTop=room===4 ? 163-(488-20)*.238 : 163-(773-160)*.14;
 assert(b.y+b.h+2<=headTop-6,'bubble border needs clear air above both faces');
 assert(b.mouthY<=headTop-4,'tail must stop above the face');
 assert.equal(b.hint,'X/F : AFFICHER');state.characters=r.dialogueLength(room,state);
 assert.equal(r.dialogueLayout(room,9,x,true,state).hint,page?'X/F : TERMINER':'X/F : SUITE');
}
console.log('PASS incoming fade discards action; bubble bounds and reveal/next/close hints');
for(const hit of [false,true]){
 const {g,advance}=createGame();g.loadScenario('sweep');g.px=hit?150:100;
 const hp=g.hp;advance(.8);assert.equal(g.enemies[0].strikeTime,r.BOSS.sweepPose);assert.equal(g.hp,hp-(hit?1:0));
 advance(.2);assert(g.enemies[0].strikeTime>.1,'sweep must still be visible after 200ms');
 advance(.3);assert.equal(g.enemies[0].strikeTime,0);assert(g.enemies[0].recovery>0);assert.equal(g.hp,hp-(hit?1:0));
}
console.log('PASS 360ms sweep, unchanged reach, one damage event and retained recovery window');
for(const speed of [40,110,260]){
 const {g,step}=createGame();g.loadScenario('road');g.speed=speed;g.obstacles=[];
 const v=g.visualSpeed();const old=(speed/3.6)*(1+.65*Math.max(0,(speed-110)/150)**1.3);
 assert(Math.abs(v/old-2.4)<1e-10);
 const depth=80,before=r.roadProjection(g.travel,depth).y;
 const oldPixels=r.roadProjection(g.travel+old*.25,depth-old*.25).y-before;
 const newPixels=r.roadProjection(g.travel+v*.25,depth-v*.25).y-before;
 assert(newPixels>oldPixels*2.4,'near-ground optic flow must materially increase');
 step();assert(Math.abs(g.road-g.speed/3.6*.02)<1e-10,'km stay tied to physical speed');
 console.log('PASS speed',speed,'world/s',v.toFixed(1),'near-ground pixels/250ms',newPixels.toFixed(1));
}
const source=['main','cadre'].map(n=>fs.readFileSync('src/'+n+'.ts','utf8')).join('\n');
assert(!/ST-HANOUNA|SAINT-HANOUNA/.test(source));assert(source.includes('COLLEGE C. HANOUNA'));assert(source.includes('"C. HANOUNA"'));
console.log('PASS renamed establishment on destination and facades');
