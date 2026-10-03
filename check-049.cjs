const assert=require('assert'),fs=require('fs'),vm=require('vm');
const {createGame}=require('./test-harness.cjs');
const scope={};vm.createContext(scope);
const code=fs.readFileSync('src/controls.ts','utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
vm.runInContext(require('node:module').stripTypeScriptTypes(code)+';globalThis.api={ActionInput,BINDINGS};',scope);
const {ActionInput,BINDINGS}=scope.api;
function wired(){const h=createGame();h.g.controls=new ActionInput();h.g.keys=h.g.controls.keys;h.g.physicalKeys=Object.fromEntries(Object.values(BINDINGS).flat().map(k=>[k,{isDown:false,just:false}]));return h;}
for(const [aliases,logical] of [[['Z','UP'],'UP'],[['Q','LEFT'],'LEFT'],[['S','DOWN'],'DOWN'],[['D','RIGHT'],'RIGHT'],[['F','X'],'X']]) {
 const input=new ActionInput(),raw=Object.fromEntries(aliases.map(k=>[k,{isDown:false}]));
 raw[aliases[0]].isDown=true;input.sampleKeyboard(raw,()=>false);assert(input.keys[logical].isDown);assert(input.keys[logical]._justDown);
 input.keys[logical]._justDown=false;raw[aliases[1]].isDown=true;input.sampleKeyboard(raw,k=>k===aliases[1]);assert(!input.keys[logical]._justDown,'second alias must not repeat');
 raw[aliases[0]].isDown=false;input.sampleKeyboard(raw,()=>false);assert(input.keys[logical].isDown,'other alias remains held');
 raw[aliases[1]].isDown=false;input.sampleKeyboard(raw,()=>false);assert(!input.keys[logical].isDown);
 input.sampleKeyboard(raw,k=>k===aliases[0]);assert(input.keys[logical]._justDown,'quick tap survives sampling');
}
{
 const a=new ActionInput();a.setSource('touch1',['UP']);a.setSource('touch2',['LEFT']);a.sampleKeyboard({D:{isDown:true}},()=>false);
 assert(a.keys.UP.isDown&&a.keys.LEFT.isDown&&a.keys.RIGHT.isDown);a.setSource('touch1',[]);assert(!a.keys.UP.isDown&&a.keys.LEFT.isDown);a.reset();assert(Object.values(a.keys).every(k=>!k.isDown&&!k._justDown));
}
for(const alias of [false,true]){
 const {g,advance}=wired();g.begin();g.obstacles=[];g.physicalKeys[alias?'Z':'UP'].isDown=true;g.physicalKeys[alias?'D':'RIGHT'].isDown=true;advance(.3);assert(g.speed>40);assert(g.car>0);
 g.physicalKeys[alias?'Z':'UP'].isDown=false;g.physicalKeys[alias?'S':'DOWN'].isDown=true;const speed=g.speed;advance(.2);assert(g.speed<speed);
 g.loadScenario('parent');g.physicalKeys[alias?'F':'X'].just=true;advance(.02);assert(g.dialogue.characters>20);assert.equal(g.dialogue.page,0);
 for(let i=0;i<3;i++){g.physicalKeys[alias?'F':'X'].just=true;advance(.02);}assert.equal(g.encounterTime,0);assert.equal(g.attack,0);
 g.loadScenario('hit');g.physicalKeys[alias?'F':'X'].just=true;advance(.25);assert.equal(g.enemies[0].hp,1);
 g.setPaused(true);assert(Object.values(g.keys).every(k=>!k.isDown&&!k._justDown));
}
console.log('PASS ZQSD/F and arrows/X: steering, throttle, brake, dialogues, strike; alias OR, quick taps, sources and pause');
const directScope={};vm.createContext(directScope);
const strip=s=>s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
vm.runInContext(require('node:module').stripTypeScriptTypes(['world','controls','gameplay','direct-input'].map(n=>strip(fs.readFileSync('src/'+n+'.ts','utf8'))).join('\n'))+';globalThis.DirectInput=DirectInput;',directScope);
function direct(scenario){const h=wired();h.g.loadScenario(scenario);h.g.direct=new directScope.DirectInput(h.g);h.g.direct.tick(0);return {...h,tap:(x,y)=>{h.g.direct.down(1,x,y);h.g.direct.up(1,x,y);h.step();}};}
{
 const {g,advance,tap}=direct('parent');const clock=g.remaining,hp=g.enemies[0].hp;
 for(let i=0;i<4;i++)tap(140,160);assert.equal(g.encounterTime,0);assert.equal(g.remaining,clock);assert.equal(g.attack,0);assert.equal(g.enemies[0].hp,hp);
 g.setPaused(true);assert(!g.direct.down(1,120,160));advance(.2);assert.equal(g.remaining,clock);
}
{
 const {g,advance,tap}=direct('late');g.remaining=240;g.px=100;tap(180,164);advance(1.2);assert(Math.abs(g.px-180)<=2);assert.equal(g.room,0);
 g.px=100;g.direct.down(1,160,155);g.direct.move(1,185,130);g.direct.up(1,185,130);advance(.15);assert(g.py<159);assert(g.px>100);advance(.9);assert.equal(g.py,159);
 g.direct.down(1,160,155);g.direct.cancel();g.direct.up(1,160,155);assert(!g.direct.intent);assert(!g.controls.keys.SPACE.isDown);
}
{
 const {g,advance,tap}=direct('hit');g.px=60;tap(220,120);advance(1.7);assert.equal(g.enemies[0].hp,1);assert.equal(g.punches,1);advance(.4);assert.equal(g.punches,1,'one tap must not autofire');
 const b=direct('block');b.tap(220,110);b.advance(.2);assert.equal(b.g.enemies[0].hp,6);assert(b.g.bookBlocked>0,'direct input must respect the boss guard');
}
{
 const {g,advance,tap}=direct('late');g.remaining=240;g.enterRoom(5,100);g.direct.tick(0);tap(245,110);advance(1.5);assert.equal(g.room,6);assert(g.encounterTime>0);assert.equal(g.direct.intent,null);
}
{
 const {g,advance,tap}=direct('success');g.enemies[0].hp=0;g.cleared.add(4);tap(280,120);advance(1.5);assert.equal(g.phase,'opening');const clock=g.remaining;advance(4.4);assert.equal(g.phase,'course');tap(160,100);assert.equal(g.phase,'blackAfter');assert.equal(g.remaining,clock);
}
{
 const {g,advance,tap}=direct('late');advance(2.1);assert.equal(g.phase,'fail');tap(140,100);assert.equal(g.phase,'fail');advance(2.1);tap(140,100);assert.equal(g.phase,'free');
}
{
 const {g,advance}=direct('road');g.obstacles=[];g.speed=40;g.direct.down(1,160,140);assert(!g.direct.down(2,170,140));advance(.4);assert(g.speed>40);
 const speed=g.speed;g.direct.move(1,190,160);advance(.2);assert(g.car>0);assert(g.speed<speed);g.direct.up(1,190,160);advance(.1);assert(!g.controls.sources.has('direct'));
 g.direct.down(1,160,140);g.setPaused(true);assert.equal(g.direct.gesture,null);assert(Object.values(g.keys).every(k=>!k.isDown));
}
{
 const {g,advance,tap}=direct('late');g.remaining=240;tap(230,164);g.physicalKeys.Q.isDown=true;advance(.2);assert.equal(g.direct.intent,null);assert(!g.pointerMode);assert(g.px<100);
}
console.log('PASS direct mouse/touch: conversations, destinations, swipe jump, single approach/strike, guard, doors, course, failure, gas/brake/steer, cancel and keyboard takeover');
for(const pointerType of ['mouse','touch']){
 const events={},listeners={};const game={querySelector:()=>({getBoundingClientRect:()=>({left:20,top:30,width:640,height:480})}),addEventListener:(k,f)=>events[k]=f,focus(){},setPointerCapture(){}};
 const dom={document:{getElementById:()=>game,addEventListener:(k,f)=>listeners[k]=f},window:{addEventListener:(k,f)=>listeners[k]=f}};
 vm.createContext(dom);vm.runInContext(require('node:module').stripTypeScriptTypes(['world','controls','gameplay','direct-input'].map(n=>strip(fs.readFileSync('src/'+n+'.ts','utf8'))).join('\n'))+';globalThis.install=installDirectInput;',dom);
 const {g,advance,step}=wired();g.loadScenario('late');g.remaining=240;g.direct=dom.install(g);
 const event=(x,y)=>({pointerId:1,pointerType,button:0,clientX:20+x*2,clientY:30+y*2,preventDefault(){}});
 events.pointerdown(event(180,164));events.pointerup(event(180,164));events.lostpointercapture(event(180,164));advance(1.2);assert(Math.abs(g.px-180)<=2,'correct canvas coordinate conversion and retained tap intent');
 events.pointerdown(event(160,155));events.pointermove(event(185,130));events.pointerup(event(185,130));step();assert(g.py<159);
 events.pointerdown(event(260,164));events.pointercancel(event(260,164));assert.equal(g.direct.intent,null);assert(!g.direct.gesture);
 g.loadScenario('road');events.pointerdown(event(160,140));step();listeners.blur();assert.equal(g.direct.gesture,null);assert(!g.controls.sources.has('direct'));
}
console.log('PASS real pointer adapter for mouse/touch: canvas scaling, capture release, swipe, pointer cancellation and blur');
{
 const {g,tap,advance,step}=direct('parent');g.workshop=true;g.setPaused(true);tap(160,160);advance(2);assert.equal(g.dialogue.characters,0);assert.equal(g.direct.pendingAction,'X');
 g.workshopStep=true;step();assert(g.dialogue.characters>30);assert.equal(g.direct.pendingAction,null);assert(g.paused);assert.equal(g.remaining,240);
 advance(1);assert.equal(g.dialogue.page,0);
}
{
 const {g,step}=direct('road');const {driveInput}=require('./drive-bot.cjs');g.obstacles=[];g.begin();g.phase='road';g.notified=true;g.direct.tick(0);g.direct.down(1,160,140);
 for(let i=0;i<10000&&g.phase==='road';i++){driveInput(g,1);g.direct.move(1,160+g.botTarget*105,g.keys.DOWN.isDown?160:140);step();}
 assert.equal(g.phase,'arrival','first mission must be reachable using direct gesture controls');assert(g.vehicle>=56);assert(g.remaining>90);
 console.log('PASS gesture-driven first route',JSON.stringify({vehicle:g.vehicle,collisions:g.collisions,remaining:g.remaining}));
}
console.log('PASS workshop queues gestures until one step, preserves dialogue and timer while paused');
