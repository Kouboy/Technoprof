const fs=require('fs'),vm=require('vm'),assert=require('assert');
const strip=s=>s.replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\r?\n/gm,'').replace(/export /g,'');
const source=['small-lettering','cadre'].map(n=>strip(fs.readFileSync('src/'+n+'.ts','utf8'))).join('\n')+';globalThis.api={cadreModel,drawCadre,bitmap,bitmapWidth,clockWidth,smallWidth};';
const ctx={};vm.createContext(ctx);vm.runInContext(require('node:module').stripTypeScriptTypes(source),ctx);const {cadreModel,drawCadre,bitmap,bitmapWidth,clockWidth,smallWidth}=ctx.api;
const base={phase:'free',notified:false,remaining:240,vehicle:100,speed:110,road:3400,mission:0,hp:5,age:0,ambienceClock:0,boardMessage:'',messageTime:0,brokenRoad:false,schoolFade:0,bossIntro:0,encounterTime:0,paused:false};
const model=(p)=>cadreModel({...base,...p},4200);
assert.equal(model({}).time,'--:--');assert.equal(model({}).distance,'');assert(!model({}).near);
assert.equal(model({notified:true,phase:'road',remaining:60.01}).time,'01:01');assert.equal(model({notified:true,remaining:-.1}).time,'00:00');
assert(!model({notified:true,phase:'road',road:3200}).near);assert(model({notified:true,phase:'road',road:3200.1}).near);
assert.equal(model({notified:true,phase:'road',road:2400}).distance,'1,80 KM');assert.equal(model({notified:true,phase:'road',road:4300}).distance,'0,00 KM');
assert.equal(model({notified:true,phase:'receive',age:1.5}).reveal,.5);
assert(model({notified:true,phase:'arrival'}).suspended);assert(model({notified:true,phase:'school',schoolFade:.5}).suspended);assert(model({notified:true,phase:'school',bossIntro:2}).suspended);
assert(model({notified:true,phase:'school',encounterTime:2}).suspended);assert(model({notified:true,phase:'road',paused:true}).suspended);
for(const text of ['04:00','--:--','00:01','01:11','02:37'])assert(clockWidth(text)<=86,text+' clock must fit');
for(const [text,width] of [['AFFECTATION',88],['PERSONNEL',62],['RETARD IMMINENT',82],['SERVICE 3/3',58],['ETAT DU PROF',89]])assert(smallWidth(text)<=width,text+' label must fit');
for(const [text,scale,width]of [['42C',2,37],['260 KM/H',1,88],['4,20',2,75],['0,49',2,75],['5/5',1,24]])assert(bitmapWidth(text,scale)<=width,text+' instrument value must fit');
let draws=[],color=0;const g={fillStyle(c){color=c;},fillRect(x,y,w,h){draws.push({x,y,w,h,color});}};
bitmap(g,0,0,'ABCDEFGHIJKLMN',0xffffff,1,20);assert(draws.every(p=>p.x+p.w<=20));
for(const phase of ['title','free','receive','road','arrival','arrivalFade','school','opening','blackBefore','course','blackAfter','later','fail','tow','report']){
 const state={...base,phase,notified:!['title','free','tow'].includes(phase),remaining:19,vehicle:30,hp:1,messageTime:2,boardMessage:'UN MESSAGE ADMINISTRATIF TRES LONG '.repeat(6)};
 const before=JSON.stringify(state);draws=[];drawCadre(g,state,4200);assert.equal(JSON.stringify(state),before,'render must be read only');assert(draws.length>0);assert(draws.every(p=>[p.x,p.y,p.w,p.h].every(Number.isInteger)&&p.x>=0&&p.x+p.w<=320&&p.y>=179&&p.y+p.h<=240&&p.w>=0&&p.h>=0),phase+' stays in the HUD');
}
console.log('PASS CADRE hidden destination, timer rounding, 1km threshold, km formatting, reveal, suspended state, text fit, integer pixels and viewport bounds');

assert(!model({phase:'road',notified:true,road:3700}).veryNear);assert(model({phase:'road',notified:true,road:3700.01}).veryNear);assert(!model({phase:'free',notified:false,road:4100}).veryNear);
draws=[];drawCadre(g,{...base,phase:'road',notified:true,road:3710},4200);assert(draws.some(p=>p.x>=218&&p.y>=209&&p.y<223&&p.color===0xd97561));
console.log('PASS distance turns red strictly below 500m');

for (const phase of ['fail', 'report']) {
 for (const notified of [true, false]) {
  for (const remaining of [0, 19, 180]) {
   const terminal = model({phase, notified, remaining, paused: true});
   assert.equal(terminal.status, phase === 'fail' ? 'ECHEC' : 'TERMINE');
   assert(terminal.terminal && terminal.suspended);
   assert(!terminal.urgent && !terminal.near && !terminal.veryNear);
  }
 }
 // Terminal screens do not reuse the live clock's blinking urgency borders.
 draws=[];drawCadre(g,{...base,phase,notified:true,remaining:0,ambienceClock:0},4200);
 assert(!draws.some(p=>p.color===0xd97561 && p.x===117 && p.w===88));
}
for (const [failureReason, expected] of [
 ['late','ECHEC - DELAI DEPASSE'],
 ['exhausted','ECHEC - PROF EPUISE'],
 ['breakdown','ECHEC - VOITURE HORS SERVICE'],
 [null,'ECHEC - AFFECTATION INTERROMPUE'],
]) {
 assert.equal(model({phase:'fail',notified:true,failureReason}).failureCause,expected);
 assert(bitmapWidth(expected)<=298, 'Failure cause fits the bottom strip');
 assert.equal(model({phase:'school',notified:true,failureReason}).failureCause,'');
}
assert.equal(model({phase:'school',notified:true,remaining:19}).status,'RETARD IMMINENT');
assert.equal(model({phase:'school',notified:true,remaining:19,paused:true}).status,'SUSPENDU');
assert(!model({phase:'school',notified:true,remaining:19,bossIntro:1}).urgent);
console.log('PASS terminal status, explicit failure causes, suspended timer and no terminal urgency');
