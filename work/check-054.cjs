const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const {createGame}=require('./test-harness.cjs');
const scope={};vm.createContext(scope);
const strip=s=>s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
vm.runInContext(require('node:module').stripTypeScriptTypes(['world','passage-layout','gameplay','dialogue','controls','direct-input','small-lettering','cadre'].map(n=>strip(fs.readFileSync('src/'+n+'.ts','utf8'))).join('\n'))+';globalThis.rules={PLAY,DIALOGUE,EXITS,dialogueLetters,dialogueLength,cadreModel,DirectInput,ActionInput};',scope);
const r=scope.rules;
function settle(h){h.advance(r.PLAY.roomFadeOut+r.PLAY.roomFadeIn+.02);assert.equal(h.g.roomTransition,null);}
for(const fps of [15,30,60,120]){
 const h=createGame(),g=h.g;g.loadScenario('stairs');g.interactLock=0;g.keys.DOWN.isDown=true;
 const clock=g.remaining;h.step();assert.equal(g.room,7);assert(g.roomTransition);assert.equal(g.roomTransitionAlpha(),0);
 const committed=g.remaining;assert(committed<clock);h.advance(.1,fps);assert.equal(g.room,7);assert(g.roomTransitionAlpha()>.7);
 g.keys.X.just=true;g.keys.SPACE.just=true;h.advance(.04,fps);assert.equal(g.room,3);assert.equal(g.attack,0);assert.equal(g.py,159);assert.equal(g.remaining,committed);
 assert(r.cadreModel(g,4200).suspended,'CADRE must match frozen clock');
 const age=g.roomTransition.age;g.setPaused(true);h.advance(1,fps);assert.equal(g.roomTransition.age,age);g.setPaused(false);
 g.keys.DOWN.isDown=true;h.advance(.2,fps);assert.equal(g.roomTransition,null);
 // Continuing the held command cannot turn arrival into another departure.
 h.advance(2,fps);assert.equal(g.room,3);assert.equal(g.attack,0);assert.equal(g.py,159);
 g.keys.DOWN.isDown=false;h.step();g.keys.DOWN.isDown=true;h.step();settle(h);assert.equal(g.room,7);
 h.advance(2,fps);assert.equal(g.room,7,'held DOWN must not bounce back');
 g.keys.DOWN.isDown=false;h.step();g.keys.DOWN.just=true;h.step();settle(h);assert.equal(g.room,3,'new press allows an intentional return');
}
console.log('PASS 0.54 held stair input, fresh return, two-sided fade, pause, frozen CADRE/time and rejected jump/attack at 15/30/60/120 fps');

for(const [from,x,key,to,spawn] of [[0,299,'RIGHT',1,18],[1,11,'LEFT',0,290],[1,299,'RIGHT',2,20],[2,11,'LEFT',1,290],[3,299,'RIGHT',30,45],[6,299,'RIGHT',7,28],[7,11,'LEFT',6,280],[8,299,'RIGHT',3,100]]){
 const h=createGame(),g=h.g;g.loadScenario('stairs');g.enterRoom(from,x);g.encounterTime=g.bossIntro=0;g.enemies=[];g.interactLock=0;
 h.advance(.5);assert.equal(g.room,from,'position alone cannot take an exit');assert.equal(g.roomTransition,null);
 g.keys[key==='LEFT'?'RIGHT':'LEFT'].isDown=true;h.step();assert.equal(g.roomTransition,null,'moving inward cannot exit');g.keys[key==='LEFT'?'RIGHT':'LEFT'].isDown=false;g.px=x;
 g.keys[key].isDown=true;g.playerRecovery=.12;h.step();assert.equal(g.roomTransition,null,'recoil cannot exit');g.playerRecovery=0;g.px=x;
 h.step();assert(g.roomTransition);g.keys[key].isDown=false;settle(h);assert.equal(g.room,to);assert.equal(g.px,spawn);
}
for(const [room,exits] of Object.entries(r.EXITS))for(const exit of exits){
 const h=createGame(),g=h.g;g.loadScenario('stairs');g.enterRoom(+room,(exit.from+exit.to)/2);g.encounterTime=g.bossIntro=0;g.enemies=[];g.interactLock=0;g.keys[exit.key].just=true;
 h.step();assert(g.roomTransition);settle(h);assert.equal(g.room,exit.target,'explicit exit route');
}
console.log('PASS 0.54 all 8 lateral and 9 explicit links, correct spawn, direction required, recoil rejected');
{
 const h=createGame(),g=h.g;g.loadScenario('stairs');g.controls=new r.ActionInput();g.keys=g.controls.keys;g.direct=new r.DirectInput(g);g.direct.tick(0);g.interactLock=0;
 g.direct.tap(230,110);h.step();assert(g.roomTransition);assert.equal(g.direct.intent,null);assert(!g.direct.down(1,60,100),'transition must reject gestures');settle(h);assert.equal(g.room,3);
 h.advance(1);g.direct.tap(45,110);h.step();settle(h);assert.equal(g.room,7);h.advance(1);assert.equal(g.room,7,'pointer command must not survive the change');
 g.changeRoom(3,42);g.begin();assert.equal(g.roomTransition,null,'restart cancels pending destination');h.advance(.5);assert.equal(g.phase,'free');
}
{
 const {g}=createGame(),draws=[];g.labels=[{y:20,setAlpha:a=>draws.push(['text',a])}];g.sceneFade={fillStyle:(c,a)=>draws.push(['overlay',a]),fillRect:(...v)=>draws.push(v)};g.g={fillStyle(){throw Error('fade must cover actors on a higher layer');}};g.fadeViewport(1);assert.equal(draws[1][1],1);assert.equal(draws[2][3],172,'HUD is outside the faded viewport');
}
for(const fps of [15,30,60,120])for(const scenario of ['parent','student','guard','boss']){
 const h=createGame(),g=h.g,sounds=[];g.audio.talk=(...a)=>sounds.push(a);g.loadScenario(scenario);g.schoolFade=.2;
 h.advance(.18,fps);assert.equal(sounds.length,0,'fade cannot speak');h.advance(.6,fps);assert(sounds.length>2&&sounds.length<=8,'quiet, bounded letter cadence');assert(sounds.every(a=>a[0]===g.room));
 const count=sounds.length,letters=g.dialogue.characters;g.setPaused(true);h.advance(1,fps);assert.equal(sounds.length,count);assert.equal(g.dialogue.characters,letters);g.setPaused(false);
 h.press('X');assert.equal(sounds.length,count,'full-page reveal must not burst sounds');h.advance(1,fps);assert.equal(sounds.length,count,'fully revealed page must stay silent');
 h.press('X');assert.equal(g.dialogue.page,1);assert.equal(sounds.length,count,'next page input itself stays quiet');h.advance(.3,fps);assert(sounds.length>count);
 h.press('X');h.press('X');const final=sounds.length;h.advance(.5,fps);assert.equal(sounds.length,final,'combat cannot replay a completed line');
}
assert(!r.dialogueLetters(1,{page:0,characters:4},3),'space is silent');assert(!r.dialogueLetters(1,{page:0,characters:23},22),'punctuation is silent');assert(r.dialogueLetters(3,{page:0,characters:5},3));
console.log('PASS 0.54 mouse/touch command consumed, restart cleanup, foreground fade, natural speech cadence, silent punctuation/pause/reveal and no sound backlog');
