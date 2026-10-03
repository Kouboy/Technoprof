const fs=require('fs'), vm=require('vm'), assert=require('assert/strict');
const {createGame}=require('./test-harness.cjs');
const strip=s=>s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
const scope={};vm.createContext(scope);
vm.runInContext(require('node:module').stripTypeScriptTypes(['world','passage-layout','controls','gameplay','direct-input','small-lettering'].map(n=>strip(fs.readFileSync('src/'+n+'.ts','utf8'))).join('\n'))+';globalThis.api={EDGE_EXITS,EXITS,BLOCKED_EDGES,roomPassages,withinPassage,passageMarker,markerPassage,doorwayPassage,smallWidth,ActionInput,DirectInput,installDirectInput,walkBounds};',scope);
const a=scope.api;
// The college's right-hand exit now enters the quiet wing, before the arena.
a.EDGE_EXITS[3]=a.EDGE_EXITS[3].map(e=>({...e,target:30,spawn:45}));
function school(room,x){
 const h=createGame(),g=h.g;g.loadScenario('passages');g.enterRoom(room,x);
 g.encounterTime=g.bossIntro=g.schoolFade=0;g.interactLock=0;
 g.enemies=[];g.roomEnemies.set(room,[]);g.controls=new a.ActionInput();g.keys=g.controls.keys;
 g.direct=new a.DirectInput(g);g.direct.tick(0);return h;
}
function consume(h,exit,fps){
 const g=h.g;let count=0;
 while(!g.roomTransition&&g.phase==='school'&&count++<fps*4)h.step(1000/fps);
 if(exit.target===-1){assert.equal(g.phase,'opening');assert.equal(g.direct.intent,null);return;}
 assert(g.roomTransition,`missing passage ${g.room} -> ${exit.target}`);
 assert.equal(g.direct.intent,null,'passage consumes pointer intention');
 const clock=g.remaining;h.advance(.1,fps);
 assert.equal(g.remaining,clock,'imposed fade freezes the deadline');
 h.advance(.35,fps);
 assert.equal(g.room,exit.target);assert.equal(g.roomTransition,null);
 assert.equal(g.px,Math.max(a.walkBounds(exit.target).min,Math.min(a.walkBounds(exit.target).max,exit.spawn)));
 const room=g.room,x=g.px;h.advance(.7,fps);assert.equal(g.room,room);assert.equal(g.px,x,'pointer movement stops on arrival');
}
for(const fps of [15,30,60,120])for(const [room,exits]of Object.entries(a.EDGE_EXITS))for(const exit of exits){
 const h=school(+room,exit.key==='LEFT'?60:240),g=h.g,marker=a.passageMarker(exit,g.px);
 assert(marker);assert.equal(a.markerPassage(g.pointerExits(),g.px,marker.x+marker.w/2,marker.y+marker.h/2)?.target,exit.target);
 g.direct.down(1,marker.x+marker.w/2,marker.y+marker.h/2);g.direct.up(1,marker.x+marker.w/2,marker.y+marker.h/2);
 assert.equal(g.direct.intent.kind,'exit');consume(h,exit,fps);
}
console.log('PASS 055 centres of all eight lateral arrows, 15/30/60/120 fps, frozen fade and consumed movement');
for(const [room,exits]of Object.entries(a.EXITS))for(const exit of exits){
 const h=school(+room,(exit.from+exit.to)/2),g=h.g,marker=a.passageMarker(exit,g.px);
 assert.equal(marker.w,20+a.smallWidth(exit.key==='UP'?'HAUT':'BAS'),'layout fits actual bitmap type');
 g.direct.tap(marker.x+marker.w/2,marker.y+marker.h/2);consume(h,exit,50);
}
{
 const h=school(4,235),g=h.g;assert.equal(g.pointerExits().length,0,'classroom remains closed before victory');
 g.direct.tap(281,69);assert.equal(g.direct.intent,null);
 g.cleared.add(4);g.px=245;const exit=g.pointerExits()[0],marker=a.passageMarker(exit,g.px);
 g.direct.tap(marker.x+marker.w/2,marker.y+marker.h/2);consume(h,exit,50);
}
console.log('PASS all nine vertical indicators and classroom after victory, matching glyph bounds');
for(const [room,exits]of Object.entries(a.EDGE_EXITS))for(const exit of exits){
 const h=school(+room,exit.key==='LEFT'?11:299),g=h.g;
 h.step();assert.equal(g.roomTransition,null,'position alone cannot exit');
 g.controls.setSource('keyboard',[exit.key==='LEFT'?'RIGHT':'LEFT']);h.step();assert.equal(g.roomTransition,null,'inward movement cannot exit');
 g.controls.reset();g.px=exit.key==='LEFT'?11:299;g.controls.setSource('keyboard',['LEFT','RIGHT']);h.step();assert.equal(g.roomTransition,null,'opposed input cannot exit');
 g.controls.reset();g.controls.setSource('keyboard',[exit.key]);g.px=exit.key==='LEFT'?11:299;
 g.playerRecovery=.1;h.step();assert.equal(g.roomTransition,null,'recoil cannot exit');g.playerRecovery=0;
 g.attack=.25;h.step();assert.equal(g.roomTransition,null,'attack cannot exit');g.attack=0;
 g.py=120;h.step();assert.equal(g.roomTransition,null,'airborne cannot exit');g.py=159;g.vy=0;
 h.step();assert(g.roomTransition);assert.equal(g.roomTransition.target,exit.target);
}
for(const [room,sides]of Object.entries(a.BLOCKED_EDGES))for(const side of sides){
 const h=school(+room,side==='left'?42:278),g=h.g;
 assert(!g.pointerExits().some(e=>e.edge&&e.key===(side==='left'?'LEFT':'RIGHT')));
 const x=side==='left'?15:298;assert(!a.markerPassage(g.pointerExits(),g.px,x,144)?.edge);
 g.direct.tap(x,164);h.advance(2);assert.equal(g.room,+room);assert.equal(g.roomTransition,null);assert.equal(g.px,side==='left'?a.walkBounds(+room).min:a.walkBounds(+room).max,'physical closure stops movement');assert.equal(g.direct.intent,null,'blocked destination cannot keep auto-walking forever');
}
console.log('PASS keyboard exits, opposed input, recoil/attack/airborne gates and every blocked edge');
{
 const h=school(0,240),g=h.g;g.direct.tap(298,144);g.controls.keyboardActive=true;g.controls.setSource('keyboard',['LEFT']);h.step();
 assert.equal(g.direct.intent,null);assert(g.px<240,'keyboard takes over');
 g.controls.reset();g.px=240;g.direct.tap(298,144);g.setPaused(true);assert.equal(g.direct.intent,null);h.advance(2);assert.equal(g.room,0);
 g.setPaused(false);g.direct.tick(0);g.direct.tap(298,144);g.playerRecovery=.15;h.step();assert.equal(g.direct.intent,null,'hurt cancels automatic approach');
 g.playerRecovery=0;h.advance(2);assert.equal(g.room,0);
}
{
 const h=school(0,240),g=h.g;const edge=g.pointerExits()[0],marker=a.passageMarker(edge,g.px);
 // An explicit arrow remains clickable when a broad enemy hitbox overlaps it.
 g.enemies=[{x:298,hp:1,boss:false,cool:5,wind:0,recovery:0,stun:0,pattern:0}];
 g.direct.tap(marker.x+marker.w/2,marker.y+marker.h/2);assert.equal(g.direct.intent.kind,'exit');
 g.direct.tap(298,110);assert.equal(g.direct.intent.kind,'attack','actor still selectable outside the marker');
}
console.log('PASS keyboard takeover, pause/hurt cancellation and explicit marker priority');
for(const pointerType of ['mouse','touch'])for(const [width,height]of [[640,480],[366,274.5]]){
 const events={},listeners={},game={querySelector:()=>({getBoundingClientRect:()=>({left:20,top:30,width,height})}),addEventListener:(k,f)=>events[k]=f,focus(){},setPointerCapture(){}};
 const ctx={document:{getElementById:()=>game,addEventListener:(k,f)=>listeners[k]=f},window:{addEventListener:(k,f)=>listeners[k]=f}};vm.createContext(ctx);
 vm.runInContext(require('node:module').stripTypeScriptTypes(['world','passage-layout','controls','gameplay','direct-input'].map(n=>strip(fs.readFileSync('src/'+n+'.ts','utf8'))).join('\n'))+';globalThis.install=installDirectInput;',ctx);
 const h=school(0,240),g=h.g;g.direct=ctx.install(g);const exit=g.pointerExits()[0],marker=a.passageMarker(exit,g.px);
 const x=marker.x+marker.w/2,y=marker.y+marker.h/2,event={pointerId:3,pointerType,button:0,clientX:20+x*width/320,clientY:30+y*height/240,preventDefault(){}};
 events.pointerdown(event);events.pointerup(event);events.lostpointercapture(event);consume(h,exit,50);
}
console.log('PASS actual pointer adapter: mouse/touch, desktop/phone-scale canvas, capture release and transition');
