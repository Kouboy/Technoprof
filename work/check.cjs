const ts=require('typescript'),fs=require('fs'),vm=require('vm'),assert=require('assert');
let source=fs.readFileSync('src/main.ts','utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'');source=['world','passage-layout','controls','dialogue','gameplay','missions','direct-input','session-log','driving','road-structures','presentation','player-experience'].map(n=>fs.readFileSync('src/'+n+'.ts','utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'')).join('\n')+'\nclass AudioKit {attention(){} talk(){} fx(){} ambienceVolume=1; combat(){} enemyGesture(){} tone(){} radio(){} noise(){} roadImpact(){} pass(){} motor(){} scene(){} unlock(){} muted=false;}\n'+source;source=source.slice(0,source.indexOf('new Phaser.Game'))+'\nglobalThis.Game=Game;';
const roadSource=fs.readFileSync('src/road-art.ts','utf8');source=roadSource.slice(roadSource.indexOf('export const VERGE'),roadSource.indexOf('export class RoadArt')).replaceAll('export ','')+'\n'+source;
const context={Phaser:{Scene:class{},Math:{Clamp:(n,a,b)=>Math.max(a,Math.min(b,n))},Input:{Keyboard:{JustDown:k=>{const v=k.just;k.just=false;return v;}}}}};vm.createContext(context);vm.runInContext(require('node:module').stripTypeScriptTypes(source),context);const g=new context.Game();g.keys=Object.fromEntries(['LEFT','RIGHT','UP','DOWN','SPACE','X','ENTER','P','M','F2','F3','F4'].map(k=>[k,{isDown:false,just:false}]));g.draw=()=>{};g.cameras={main:{shake(){}}};const {driveInput}=require('./drive-bot.cjs');const step=n=>{for(let i=0;i<n;i++)g.update(0,20);};const settle=()=>{for(let i=0;g.roomTransition&&i<25;i++)step(1);assert(!g.roomTransition);};const edge=(x,key)=>{acknowledge();step(18);g.px=x;g.keys[key].isDown=true;step(1);g.keys[key].isDown=false;settle();};const acknowledge=()=>{settle();for(let i=0;g.encounterTime>0&&i<50;i++){g.keys.X.just=true;step(1);}assert.equal(g.encounterTime,0);};const press=k=>{acknowledge();step(18);g.keys[k].just=true;step(1);settle();acknowledge();};
g.begin();step(300);assert.equal(g.phase,'free');assert.equal(g.remaining,240);assert(g.travel>0);step(460);assert.equal(g.phase,'receive');assert(g.remaining<240);const t=g.remaining;g.phase='arrival';g.parkFrom=g.car;g.parkSpeed=120;g.age=0;step(145);assert.equal(g.speed,0);while(g.phase!=='school')step(1);assert.equal(g.phase,'school');assert.equal(g.remaining,t);
g.schoolFade=0;edge(301,'RIGHT');assert.equal(g.room,1);g.px=80;press('UP');assert.equal(g.room,5);g.px=25;press('DOWN');assert.equal(g.room,1);edge(301,'RIGHT');assert.equal(g.room,2);g.px=250;press('UP');assert.equal(g.room,8);g.px=25;press('DOWN');assert.equal(g.room,2);edge(10,'LEFT');assert.equal(g.room,1);g.px=80;press('UP');g.px=230;press('UP');assert.equal(g.room,6);edge(301,'RIGHT');assert.equal(g.room,7);g.px=220;press('DOWN');assert.equal(g.room,3);edge(301,'RIGHT');assert.equal(g.room,30);edge(301,'RIGHT');assert.equal(g.room,31);g.px=281;press('UP');assert.equal(g.room,32);edge(301,'RIGHT');assert.equal(g.room,4);assert(g.arena);assert.equal(g.cam,0);g.bossIntro=0;g.encounterTime=0;g.enemies[0].hp=0;g.px=280;press('UP');assert.equal(g.phase,'opening');const frozen=g.remaining;step(171);assert.equal(g.phase,'blackBefore');step(41);assert.equal(g.phase,'course');assert.equal(g.remaining,frozen);step(300);assert.equal(g.phase,'course');g.freshKey=true;step(1);assert.equal(g.phase,'blackAfter');step(41);assert.equal(g.phase,'later');step(111);assert.equal(g.phase,'free');assert.equal(g.mission,1);assert.equal(g.won,1);
g.phase='road';g.remaining=.01;step(1);assert.equal(g.phase,'fail');assert.equal(g.results.length,2);
console.log('PASS cruising, mission timer, shared timer, room navigation, boss framing, door, fade, automatic return, timeout');


g.begin();g.car=.2;step(300);assert(g.car<.2);g.keys.RIGHT.isDown=true;step(10);assert(g.car>.2);g.keys.RIGHT.isDown=false;console.log('PASS curves drift outward; steering responds');

// Traffic objects survive assignment; speed is independent of mission state.
g.begin();const traffic=g.obstacles;g.age=14.99;step(1);assert.equal(g.phase,'receive');assert.strictEqual(g.obstacles,traffic);
g.begin();g.car=0;g.speed=15;step(50);assert(g.speed>10&&g.speed<15);g.keys.UP.isDown=true;step(100);g.keys.UP.isDown=false;assert(g.speed>60&&g.speed<110);g.keys.DOWN.isDown=true;step(100);g.keys.DOWN.isDown=false;assert.equal(g.speed,0);
g.school();g.schoolFade=0;g.enterRoom(5,220);g.keys.UP.isDown=true;step(36);g.keys.UP.isDown=false;assert.equal(g.room,6);g.enterRoom(5,60);assert.equal(g.interaction().target,1);g.enterRoom(1,105);assert.equal(g.interaction().target,5);console.log('PASS continuous traffic, low speed, acceleration, braking, held stair input, wider door zones');

g.begin();assert.equal(g.notified,false);g.age=14.99;step(1);assert.equal(g.notified,true);g.phase='road';g.road=0;g.speed=180;g.obstacles=[];g.keys.UP.isDown=false;step(50);assert(g.road>48&&g.road<51);const steerDistance=speed=>{g.begin();g.speed=speed;g.notified=true;g.phase="road";g.keys.RIGHT.isDown=true;step(10);g.keys.RIGHT.isDown=false;return g.car;};assert(steerDistance(240)>steerDistance(30)*3);console.log('PASS notification visibility gate, km/h distance conversion, speed-dependent steering');

g.begin();g.speed=40;const low=g.visualSpeed();g.speed=240;assert(g.visualSpeed()/low>8);g.keys.RIGHT.isDown=true;step(10);g.keys.RIGHT.isDown=false;const x=g.car,v=g.steerVelocity;step(1);assert(g.car>x);assert(g.steerVelocity>0&&g.steerVelocity<v);console.log('PASS parking stop, black intervals, key-gated course, speed amplitude, steering inertia');


g.school();g.schoolFade=0;g.enterRoom(4,200);g.bossIntro=0;g.encounterTime=0;const boss=g.enemies[0];boss.x=232;boss.cool=10;const health=boss.hp;press('X');step(9);assert.equal(boss.hp,health);boss.recovery=2;step(20);press('X');step(9);assert(boss.hp<health);g.begin();g.school();g.schoolFade=0;g.enterRoom(1,50);g.enemies[0].hp=1;g.enterRoom(5,50);g.enterRoom(1,50);assert.equal(g.enemies[0].hp,1);console.log('PASS boss guard and recovery opening, enemy persistence across rooms');

// Drive an actual mission and traverse the detour using held controls.
for(const k of Object.values(g.keys)){k.isDown=false;k.just=false;}g.mission=0;g.won=0;g.results=[];g.art={};g.begin();
for(let i=0;i<12000&&g.phase!=='school';i++){driveInput(g);step(1);assert.notEqual(g.phase,'fail');}
assert.equal(g.phase,'school');for(const k of Object.values(g.keys))k.isDown=false;
function walkTo(x){acknowledge();const startRoom=g.room;for(let i=0;i<300&&g.room===startRoom&&(Math.abs(g.px-x)>3||g.py!==159);i++){g.keys.RIGHT.isDown=g.px<x-2;g.keys.LEFT.isDown=g.px>x+2;const gapAhead=g.floorGaps().some(([left,right])=>g.px<x ? g.px>left-35&&g.px<left : g.px>right&&g.px<right+35);if((gapAhead||([3,6].includes(g.room)&&g.enemies[0]?.hp>0&&Math.abs(g.px-g.enemies[0].x)<65))&&g.py===159)g.keys.SPACE.just=true;step(1);}g.keys.RIGHT.isDown=false;g.keys.LEFT.isDown=false;settle();}
walkTo(301);assert.equal(g.room,1);walkTo(80);press('UP');assert.equal(g.room,5);walkTo(230);press('UP');assert.equal(g.room,6);walkTo(301);assert.equal(g.room,7);walkTo(220);press('DOWN');assert.equal(g.room,3);walkTo(301);assert.equal(g.room,30);walkTo(301);assert.equal(g.room,31);walkTo(281);press('UP');assert.equal(g.room,32);walkTo(301);assert.equal(g.room,4);
acknowledge();
// Finish dialogue, dodge telegraphed sweeps, approach only for recovery windows.
for(let i=0;i<5000&&!g.cleared.has(4)&&g.phase==='school';i++){const e=g.enemies[0];const desired=e.x-(e.recovery>.25?60:90);g.keys.RIGHT.isDown=g.px<desired-3;g.keys.LEFT.isDown=g.px>desired+3;if(e.wind>0&&e.wind<.35&&e.pattern%2===0&&g.py===159)g.keys.SPACE.just=true;if(e.recovery>.3&&Math.abs(e.x-g.px)<74&&g.attack===0){g.face=1;g.keys.X.just=true;}step(1);}
g.keys.LEFT.isDown=false;g.keys.RIGHT.isDown=false;assert.equal(g.phase,'school');assert(g.cleared.has(4));walkTo(280);press('UP');assert.equal(g.phase,'opening');console.log('PASS full mission: drive, detour, boss defeated, classroom entered with '+Math.ceil(g.remaining)+' seconds remaining');

g.begin();g.notified=true;g.phase='arrival';g.age=0;g.parkSpeed=150;const cinemaClock=g.remaining;while(g.phase!=='school')step(1);assert.equal(g.remaining,cinemaClock);step(35);assert.equal(g.remaining,cinemaClock);step(2);assert(g.remaining<cinemaClock);g.enterRoom(4,80);const introClock=g.remaining;step(55);assert.equal(g.remaining,introClock);console.log('PASS all forced arrival/fade/boss-intro time excluded');
// Vehicle damage persists, repeated contacts are protected, and only assigned breakdowns fail missions.
g.begin();g.vehicle=100;g.speed=200;g.crash(0,1);assert.equal(g.vehicle,70);g.crash(0,1);assert.equal(g.vehicle,70);g.trafficHit=0;g.crash(0,1);assert.equal(g.vehicle,40);g.begin();assert.equal(g.vehicle,40);g.trafficHit=0;g.crash(0,1);g.trafficHit=0;g.crash(0,1);assert.equal(g.vehicle,0);g.notified=true;g.phase='road';g.obstacles=[];const count=g.results.length;step(1);assert.equal(g.phase,'fail');assert.equal(g.results.length,count+1);g.begin();assert.equal(g.vehicle,65);g.vehicle=0;g.obstacles=[];const beforeTow=g.results.length;step(1);assert.equal(g.phase,'tow');step(151);assert.equal(g.phase,'free');assert.equal(g.results.length,beforeTow);assert.equal(g.vehicle,65);
// The parent's charge damages furniture / itself at the edge, and is jumpable.
g.school();g.schoolFade=0;g.enterRoom(1,100);const parent=g.enemies[0];assert(parent.parent);parent.x=31;parent.chargeTime=.5;parent.chargeDir=-1;const parentHp=parent.hp;g.updateParent(parent,.04);assert.equal(parent.hp,parentHp-1);assert(parent.stun>0);parent.recovery=0;parent.chargeTime=.5;parent.x=100;parent.chargeDir=1;g.py=100;const life=g.hp;g.updateParent(parent,.02);assert.equal(g.hp,life);
// Both gaps require jumps; a controlled run can cross the shortcut without damage.
g.enterRoom(8,25);g.schoolFade=0;g.hitStop=0;const shortcutHealth=g.hp;for(let i=0;i<350&&g.room===8;i++){g.keys.RIGHT.isDown=true;if(g.py===159&&((g.px>70&&g.px<94)||(g.px>166&&g.px<190)))g.keys.SPACE.just=true;step(1);}g.keys.RIGHT.isDown=false;assert.equal(g.room,3);assert.equal(g.hp,shortcutHealth);console.log('PASS vehicle stages/persistence/panne/tow, parent scenery impact, jumpable charge, safe shortcut traversal');
// Regression: speed cap, one-shot approach alert, boss reach.
g.begin();g.obstacles=[];g.keys.UP.isDown=true;step(700);assert(g.speed<=110);g.notified=true;g.phase='road';g.car=0;g.travel=0;step(100);assert(g.speed>110);g.keys.UP.isDown=false;
g.road=2201;step(1);assert(!g.arrivalAlert);g.road=3201;step(1);assert(g.arrivalAlert);assert(g.boardMessage.includes('ARRIVEE IMMINENTE'));g.boardMessage='sentinel';step(1);assert.equal(g.boardMessage,'sentinel');
g.school();g.schoolFade=0;g.enterRoom(4,100);g.bossIntro=0;g.encounterTime=0;const sweep=g.enemies[0];sweep.x=190;sweep.pattern=2;sweep.wind=.01;sweep.recovery=0;g.inv=0;g.hitStop=0;const intact=g.hp;step(1);assert.equal(g.hp,intact);sweep.x=160;sweep.wind=.01;sweep.recovery=0;step(1);assert.equal(g.hp,intact-1);console.log('PASS 110 km/h cap, assignment release, one-shot 1 km warning, 78-unit delivered sweep');

// No-input driving is no longer a protected centre lane.
g.begin();assert(g.obstacles.some(o=>Math.abs(o.x)<.2));g.notified=true;g.phase='road';g.obstacles=[];g.speed=260;g.travel=220*Math.PI/2;g.car=0;g.keys.UP.isDown=true;step(50);assert(Math.abs(g.car)>.05&&Math.abs(g.car)<.16);g.keys.UP.isDown=false;console.log('PASS centre traffic and high-speed curve require steering');

g.speed=260;g.travel=220*Math.PI/2;const rightBend=g.curveForce();g.travel=220*Math.PI*1.5;const leftBend=g.curveForce();assert(rightBend>0&&leftBend<0);assert(Math.abs(rightBend+leftBend)<1e-9);assert(Math.abs(leftBend)<=.14);g.travel=0;assert.equal(g.curveForce(),0);console.log('PASS gentle symmetric curve drift, zero on straight');

g.mission=0;g.begin();assert.equal(g.obstacles.length,12);assert(g.obstacles.slice(1).every((o,i)=>o.z-g.obstacles[i].z>=190));g.mission=1;g.begin();assert.equal(g.obstacles.length,12);g.mission=2;g.begin();assert.equal(g.obstacles.length,12);console.log('PASS equal traffic queue capacity, first mission spaced; actual encounter progression checked in 059');
// Feedback is tied to actual passes and hard braking, with no repeated whoosh.
g.mission=0;g.begin();g.phase='road';g.notified=true;g.speed=180;g.car=0;g.travel=0;g.obstacles=[{z:.1,x:.5,type:0}];let passes=0;g.audio.pass=()=>passes++;step(1);assert.equal(passes,1);step(10);assert.equal(passes,1);g.keys.DOWN.isDown=true;step(2);assert(g.tireMarks.length>0);g.keys.DOWN.isDown=false;step(70);assert.equal(g.tireMarks.length,0);console.log('PASS one-shot passing sound and temporary hard-braking tire marks');
// Audio sequencing without relying on installed voices or speakers.
const audioEvents=[];const ac={speechSynthesis:{getVoices:()=>[{lang:'fr-FR'}],speak:()=>audioEvents.push('speech'),cancel:()=>audioEvents.push('cancel')},SpeechSynthesisUtterance:class {constructor(text){this.text=text;}}};vm.createContext(ac);vm.runInContext(require('node:module').stripTypeScriptTypes(require('./audio-harness.cjs').source)+';globalThis.AudioKit=AudioKit;',ac);const kit=new ac.AudioKit();kit.context={currentTime:0};kit.master={gain:{setTargetAtTime(){}}};kit.noise=()=>{};kit.tone=()=>{};kit.material=(kind)=>audioEvents.push(kind);kit.radio('Bulletin',true);kit.radio('Bulletin',true);assert.equal(audioEvents.filter(x=>x==='speech').length,1);kit.radio('',false);assert(audioEvents.includes('cancel'));kit.scene('course',false,120,.02);assert(audioEvents.includes('chair')&&audioEvents.includes('paper')&&audioEvents.includes('chalk'));console.log('PASS radio once per cruise, interruption, classroom sound sequence');
// Falling is visible over time, costs one health point, and recovers on solid floor.
g.school();g.schoolFade=0;g.enterRoom(8,110);g.inv=0;g.hitStop=0;const beforeFall=g.hp;step(1);assert(g.falling>0);assert.equal(g.hp,beforeFall);step(10);assert(g.py>159);step(35);assert.equal(g.falling,0);assert.equal(g.hp,beforeFall-1);assert.equal(g.px,80);console.log('PASS animated fall and single damage on recovery');

// Character geometry, hands and props must mirror around the foot anchor.
g.phase='school';g.attack=.25;g.keys.LEFT.isDown=false;g.keys.RIGHT.isDown=false;let polygons=[];g.shape=(points)=>polygons.push([...points]);g.face=1;g.person(100,159,0,true);const right=polygons.slice(1);polygons=[];g.face=-1;g.person(100,159,0,true);const left=polygons.slice(1);assert.equal(left.length,right.length);right.forEach((p,i)=>p.forEach((v,j)=>assert(Math.abs(left[i][j]-(j%2?v:200-v))<1e-8)));console.log('PASS mirrored character body, book, arm and satchel');
// Render integration: a bridge must cover distant traffic, but sit behind nearer traffic.
g.phase='road';g.travel=360;g.car=0;g.speed=0;g.tireMarks=[];g.obstacles=[{z:460,x:0,type:0},{z:370,x:0,type:2}];const layers=[];let saved=0,mirrors=0,paintColor=0;g.g=new Proxy({fillStyle(c){paintColor=c;},fillRect(){if(paintColor===0x6e7468&&layers.at(-1)!=='bridge')layers.push('bridge');},save(){saved++;},restore(){saved--;},scaleCanvas(x){if(x===-1)mirrors++;}},{get:(o,k)=>o[k]||(()=>{})});g.rect=(x,y,w,h,color)=>{if(color===0x697266)layers.push('bridge');};g.rearCar=(x,y,w,h,paint,lean,service)=>{if(!service)layers.push(paint===0x854538?'far':'near');};g.roadSky=()=>{};g.vehicleDamage=()=>{};g.drawRoad();assert.deepEqual(layers,['far','bridge','near']);assert.equal(saved,0);assert(mirrors>0);console.log('PASS bridge interleaved with traffic by depth; roadside mirrors restore transforms');
// Full-sized arena: bodies cannot cross, but the book reaches the opponent.
g.art={};g.phase='school';g.room=4;g.brokenRoad=false;g.py=159;g.px=205;g.enemies=[{x:220,hp:6,boss:true,cool:5,wind:0,recovery:1,pattern:1,stun:0}];g.separateFighters(160);assert.equal(g.px,168);g.px=230;g.separateFighters(168);assert.equal(g.px,168);g.px=280;g.enemies[0].x=287;g.separateFighters(280);assert.equal(g.px,235);console.log('PASS full-sized bodies cannot overlap or cross at ground level');
g.px=150;g.enemies[0].x=210;g.enemies[0].recovery=1;g.attack=.36;g.attackHit=false;g.schoolFade=0;g.bossIntro=0;g.encounterTime=0;g.inv=0;g.hitStop=0;g.remaining=240;g.face=1;g.keys.LEFT.isDown=false;g.keys.RIGHT.isDown=false;step(2);assert.equal(g.enemies[0].hp,5);assert.equal(g.impactX,195);assert.equal(g.impactY,90);assert(g.enemies[0].x>210);console.log('PASS full-sized book hit at 60 units, effect records contact before knockback');
g.hitStop=0;g.finish(true);const locked=g.remaining;step(100);assert.equal(g.phase,'opening');step(72);assert.equal(g.phase,'blackBefore');assert.equal(g.remaining,locked);g.art=undefined;console.log('PASS extended classroom entry remains outside mission timer');
// New arrival art shares the frozen cinematic timeline and fits the gate opening.
const arrivalPos=[];const actor={setDepth(){return this;},setScale(){return this;},setAlpha(){return this;}};
g.art={drawTeacher(){return actor;},reactEnemy(){},pose(role,frame,x,y){arrivalPos.push({x,y});return actor;}};
g.arrivalBackdrop={setVisible(){}};g.arrivalGate=new Proxy({},{get:()=>()=>{}});g.carArt={side(){}};g.foreground=g.g;g.txt=()=>{};g.phase='arrival';
for(const t of [0,2.6,4.4,5.8]){g.age=t;g.drawPulpArrival();}
assert.equal(arrivalPos.length,3);assert(arrivalPos[0].x<arrivalPos[1].x);assert.equal(arrivalPos[2].x,220);assert(arrivalPos[2].y<arrivalPos[1].y);console.log('PASS arrival walk reaches gate and recedes into courtyard');
// Courtyard art is isolated from combat rooms and preserves the hall transition.
g.courtBackdrop={setVisible(){}};g.phase='school';g.room=0;g.brokenRoad=false;g.py=159;g.px=80;g.face=-1;g.attack=0;g.inv=0;g.drawCourtyard();assert(g.usesCourtArt());g.room=1;assert(!g.usesCourtArt());g.room=0;g.px=299;g.schoolFade=0;g.enemies=[];g.bossIntro=0;g.encounterTime=0;g.remaining=200;g.arrivalStill=false;g.hitStop=0;edge(299,'RIGHT');assert.equal(g.room,1);console.log('PASS courtyard renderer scope and walking transition into hall');

// Hall artwork follows the existing parent states and keeps the annex accessible.
const hallPos=[];g.hallArt={background:{setVisible(){}},pose(...args){hallPos.push(args);}};
g.phase='school';g.room=1;g.brokenRoad=false;g.px=80;g.py=159;g.attack=0;g.inv=0;
g.enemies=[{parent:true,x:210,hp:3,wind:.4,recovery:0,stun:0,chargeTime:0,chargeDir:-1}];
assert(g.usesHallArt());g.drawHall();assert.deepEqual(hallPos.pop(),[1,210,-1]);
g.enemies[0].wind=0;g.enemies[0].chargeTime=.5;g.drawHall();assert.deepEqual(hallPos.pop(),[2,210,-1]);
g.enemies[0].stun=.5;g.drawHall();assert.equal(hallPos.pop()[0],3);
g.schoolFade=0;g.hitStop=0;g.bossIntro=0;g.encounterTime=0;press('UP');assert.equal(g.room,5);assert(!g.usesHallArt());
console.log('PASS hall parent anticipation/charge/recovery and annex transition');

// Parent speed and warning give the player time to react.
g.phase='school';g.px=80;g.py=100;const slower={parent:true,x:210,hp:3,wind:0,recovery:0,stun:0,chargeTime:1.9,chargeDir:-1,cool:0};g.updateParent(slower,.1);assert.equal(slower.x,200);slower.chargeTime=0;g.updateParent(slower,.01);assert.equal(slower.wind,1);g.updateParent(slower,.99);assert.equal(slower.chargeTime,0);g.updateParent(slower,.02);assert.equal(slower.chargeTime,1.9);console.log('PASS slower parent charge and full one-second warning');

// Central artwork preserves both navigation choices.
g.centralBackdrop={setVisible(){}};g.phase='school';g.room=2;g.brokenRoad=false;g.py=159;g.px=250;g.attack=0;g.inv=0;g.drawCentralStair();assert(g.usesCentralArt());g.schoolFade=0;g.hitStop=0;g.enemies=[];press('UP');assert.equal(g.room,8);assert(!g.usesCentralArt());g.enterRoom(2,9);g.schoolFade=0;edge(10,'LEFT');assert.equal(g.room,1);console.log('PASS central artwork and shortcut / hall transitions');

// Technical renderer is scoped to the room; the WebGL-safe floor crop is tested in check-school.
g.technicalBackdrop={setVisible(){}};g.phase='school';g.room=8;g.brokenRoad=false;g.px=110;g.py=180;g.falling=.3;g.drawTechnical();assert(g.usesTechnicalArt());g.falling=0;g.py=159;g.drawTechnical();g.room=3;assert(!g.usesTechnicalArt());console.log('PASS technical renderer room scope');

// Service landing preserves upward and downward connections.
g.serviceBackdrop={setVisible(){}};g.phase='school';g.room=7;g.brokenRoad=false;g.px=40;g.py=159;g.attack=0;g.inv=0;g.falling=0;g.drawService();assert(g.usesServiceArt());g.schoolFade=0;g.hitStop=0;g.interactLock=0;g.enemies=[];press('UP');assert.equal(g.room,6);g.enterRoom(7,270);g.schoolFade=0;g.interactLock=0;press('DOWN');assert.equal(g.room,3);assert(!g.usesServiceArt());console.log('PASS service landing up/down transitions');

// Guard: wind-up, directional short shove, one hit, recovery and jump evasion.
g.phase='school';g.room=6;g.px=100;g.py=159;g.inv=0;g.hp=5;g.hitStop=0;
const guard={x:150,hp:2,boss:false,cool:0,wind:0,recovery:0,stun:0,pattern:0};
g.updateGuard(guard,.01);assert.equal(guard.wind,.75);g.updateGuard(guard,.5);assert.equal(g.hp,5);g.updateGuard(guard,.26);assert.equal(g.hp,4);assert.equal(g.px,88);assert.equal(guard.recovery,.85);g.updateGuard(guard,.1);assert.equal(g.hp,4);
g.px=100;g.py=115;g.inv=0;guard.wind=.01;guard.recovery=0;guard.facing=-1;g.updateGuard(guard,.02);assert.equal(g.hp,4);
g.py=159;g.px=80;guard.wind=.01;guard.recovery=0;g.updateGuard(guard,.02);assert.equal(g.hp,4);
const guardPos=[];g.bridgeArt={background:{setVisible(){}},pose(...args){guardPos.push(args);}};g.enemies=[guard];guard.wind=.5;guard.recovery=0;g.attack=0;g.drawBridge();assert.equal(guardPos.pop()[0],1);guard.wind=0;guard.recovery=.8;g.drawBridge();assert.equal(guardPos.pop()[0],2);guard.stun=.2;g.drawBridge();assert.equal(guardPos.pop()[0],3);
console.log('PASS guard wind-up, limited directional shove, recovery, jump and pose transitions');

// Student: committed short kick, full anticipation, one damage, jump/back evasion.
g.phase='school';g.room=3;g.px=100;g.py=159;g.inv=0;g.hp=5;g.hitStop=0;
const student={x:144,hp:2,boss:false,cool:0,wind:0,recovery:0,stun:0,pattern:0};
g.updateStudent(student,.01);assert.equal(student.wind,.7);g.updateStudent(student,.5);assert.equal(g.hp,5);g.updateStudent(student,.21);assert.equal(g.hp,4);assert.equal(g.px,91);assert.equal(g.impactY,128);g.updateStudent(student,.1);assert.equal(g.hp,4);
for(const [px,py]of [[100,115],[80,159],[188,159]]){g.px=px;g.py=py;g.inv=0;student.x=144;student.wind=.01;student.recovery=0;student.facing=-1;g.updateStudent(student,.02);assert.equal(g.hp,4);}
const studentPos=[];g.wingArt={background:{setVisible(){}},pose(...args){studentPos.push(args);}};g.enemies=[student];g.attack=0;g.py=159;g.px=100;
student.wind=.4;student.recovery=0;g.drawWing();assert.equal(studentPos.pop()[0],1);
student.wind=0;student.recovery=.8;g.drawWing();assert.equal(studentPos.pop()[0],2);
student.stun=.2;g.drawWing();assert.equal(studentPos.pop()[0],3);
// Two book hits defeat him; contact is recorded at torso height before knockback.
student.stun=0;student.x=145;student.hp=2;student.recovery=0;student.cool=5;g.px=100;g.face=1;g.hp=5;g.inv=0;g.schoolFade=0;g.bossIntro=0;g.encounterTime=0;g.falling=0;g.remaining=200;g.hitStop=0;g.attack=.36;g.attackHit=false;step(2);assert.equal(student.hp,1);assert.equal(g.impactY,104);
student.x=145;g.attack=.36;g.attackHit=false;g.hitStop=0;step(2);assert.equal(student.hp,0);assert(student.downTime>0);
g.enterRoom(3,45);g.schoolFade=0;g.interactLock=0;g.hitStop=0;g.attack=0;press('DOWN');assert.equal(g.room,7);assert(!g.usesWingArt());
g.enterRoom(3,299);g.schoolFade=0;g.interactLock=0;g.hitStop=0;edge(299,'RIGHT');assert.equal(g.room,30);
console.log('PASS student wind-up, short kick, jump/back evasion, poses, two-hit defeat, impact height and both exits');

// A completed bulletin must never enqueue again during the same cruise.
const spoken=[];ac.speechSynthesis.speak=u=>spoken.push(u);ac.speechSynthesis.pause=()=>audioEvents.push('pause');ac.speechSynthesis.resume=()=>audioEvents.push('resume');
kit.radio('Unique',true);const utterance=spoken.at(-1);utterance.onend();assert(kit.radioDone&&!kit.radioPlaying);for(let i=0;i<100;i++)kit.radio('Unique',true);assert.equal(spoken.length,1);
kit.radio('',false);kit.radio('Unique',true);const next=spoken.at(-1);kit.radio('Unique',true,true);kit.radio('Unique',true,false);assert(audioEvents.includes('pause')&&audioEvents.includes('resume'));assert.equal(spoken.length,2);utterance.onend();assert(kit.radioPlaying,'stale callback must not finish next bulletin');next.onerror();assert(kit.radioDone&&!kit.radioPlaying);
kit.radio('',false);kit.radio('Muted',true);kit.muted=true;kit.radio('Muted',true);kit.muted=false;kit.radio('Muted',true);assert.equal(spoken.length,3);assert(kit.radioDone);
g.begin();g.audio.radioPlaying=true;g.audio.radioDone=false;g.age=20;step(1);assert.equal(g.phase,'free');g.audio.radioPlaying=false;g.audio.radioDone=true;step(1);assert.equal(g.phase,'receive');g.audio.radioDone=false;
g.begin();g.audio.radioPlaying=true;g.age=45;step(1);assert.equal(g.phase,'receive');g.audio.radioPlaying=false;
console.log('PASS completed radio is not repeated, pause resumes, stale callbacks ignored, muted bulletin stays consumed, assignment follows end with fallback');

// Enter from either bank, then recover on that bank; jumping must preserve last takeoff.
for(const [start,dir,expected] of [[80,'RIGHT',80],[143,'LEFT',143],[175,'RIGHT',175],[238,'LEFT',238]]) {
  for(const k of Object.values(g.keys)){k.isDown=false;k.just=false;}
  g.begin();g.school();g.schoolFade=0;g.enterRoom(8,start);g.hitStop=0;g.keys[dir].isDown=true;
  for(let i=0;i<30&&!g.falling;i++)step(1);
  assert(g.falling>0);g.keys[dir].isDown=false;assert.equal(g.fallReturn,expected);
  const hp=g.hp;step(45);assert.equal(g.px,expected);assert.equal(g.hp,hp-1);assert.equal(g.falling,0);step(10);assert.equal(g.hp,hp-1);
}
for(const [start,landing,expected]of [[80,112,80],[145,112,143]]){
  g.enterRoom(8,start);g.py=130;g.vy=220;g.px=landing;g.lastGroundX=start;g.hitStop=0;
  for(let i=0;i<20&&!g.falling;i++)step(1);assert(g.falling>0);assert.equal(g.fallReturn,expected);
}
g.falling=0;for(const [room,requested,expected]of [[0,25,42],[8,25,42],[3,30,42],[4,25,42],[1,18,18],[5,301,278]]){g.enterRoom(room,requested);assert.equal(g.px,expected);const x=g.px;g.bossIntro=0;g.encounterTime=0;step(1);assert.equal(g.px,x,'no spawn correction after first frame');}
g.enterRoom(8,150);g.messageTime=0;assert.equal(g.schoolStatus(),'07:00 / PASSAGE TECHNIQUE / DANGER');g.px=45;assert.equal(g.schoolStatus(),'BAS : RETOUR ESCALIER');g.px=150;g.messageTime=1;g.boardMessage='CHUTE';assert.equal(g.schoolStatus(),'CHUTE');g.falling=.2;assert.equal(g.schoolStatus(),'SOL EFFONDRE / CHUTE');g.falling=0;g.messageTime=0;g.enterRoom(5,278);assert.equal(g.schoolStatus(),'HAUT : MONTER AU 2E');
console.log('PASS both fall directions, missed-jump takeoff bank, damage once, stable room entrances and contextual orientation');

// Losing the window must stop both simulation and audio before another frame.
g.begin();g.phase='road';g.notified=true;g.cadreReview=false;g.arrivalStill=false;g.artReview=-1;g.paused=false;
let resetKeys=0;const pauseAudio=[];
g.input={keyboard:{resetKeys(){resetKeys++;for(const k of Object.values(g.keys)){k.isDown=false;k.just=false;}}}};
g.audio.radio=(text,on,paused)=>pauseAudio.push(['radio',paused]);g.audio.scene=(phase,paused)=>pauseAudio.push(['scene',paused]);g.audio.motor=(speed,on)=>pauseAudio.push(['motor',on]);
const clock41=g.remaining,position41=g.travel;g.pauseForFocusLoss();assert(g.paused);assert.equal(resetKeys,1);assert.equal(g.pauseReason,'FENETRE INACTIVE');
assert.deepEqual(pauseAudio.slice(-3),[['radio',true],['scene',true],['motor',false]]);step(100);assert.equal(g.remaining,clock41);assert.equal(g.travel,position41);
g.pauseForFocusLoss();assert.equal(resetKeys,1);g.keys.P.just=true;step(1);assert(!g.paused);assert(g.remaining<clock41);
g.phase='course';g.age=1;g.freshKey=false;
for(const key of ['P','M','F2']){g.handleKeyDown({key,repeat:false});assert(!g.freshKey);}
g.handleKeyDown({key:'ArrowRight',repeat:true});assert(!g.freshKey);
g.setPaused(true);g.handleKeyDown({key:'Enter',repeat:false});assert(!g.freshKey);
g.setPaused(false);step(1);assert.equal(g.phase,'course');g.handleKeyDown({key:'Enter',repeat:false});step(1);assert.equal(g.phase,'blackAfter');
console.log('PASS focus-loss pause, immediate audio silence, explicit resume, course control keys and held-key repeat');

// The contact stays at hand height and a struck parent cannot resume its charge.
g.begin();g.school();g.schoolFade=0;g.enterRoom(1,170);acknowledge();g.inv=0;g.attack=.36;g.attackHit=false;g.face=1;g.py=159;
const parent41=g.enemies[0];parent41.x=210;parent41.wind=.2;parent41.chargeTime=.7;parent41.chargeDir=-1;
step(2);assert.equal(parent41.hp,2);assert.equal(parent41.wind,0);assert.equal(parent41.chargeTime,0);assert(parent41.recovery>0);assert.equal(g.impactX,201);assert.equal(g.impactY,104);
g.face=-1;assert.equal(g.bookContact({x:120}).x,129);
g.enterRoom(5,60);assert.equal(g.impact,0);assert.equal(g.hitStop,0);assert.equal(g.particles.length,0);
g.enterRoom(1,160);g.inv=0;parent41.x=158;parent41.chargeTime=.7;parent41.chargeDir=1;parent41.recovery=0;const health41=g.hp;
g.updateParent(parent41,.02);assert.equal(g.hp,health41-1);assert.equal(g.impactKind,'hurt');assert.equal(g.impactY,116);assert(g.hitStop>0);
console.log('PASS parent/guard-scale contact, attack interruption, directional anchors, parent hit feedback and clean room transitions');

// First meetings leave both speech pages readable before any enemy approach.
for(const room of [1,3,6]) {
  for(const k of Object.values(g.keys)){k.isDown=false;k.just=false;}
  g.begin();g.school();g.schoolFade=0;g.enterRoom(room,100);g.paused=false;
  const e=g.enemies[0],start=e.x,clock=g.remaining,health=g.hp;
  step(445);assert(g.encounterTime>0);assert.equal(e.x,start);assert.equal(e.wind,0);assert.equal(g.hp,health);assert.equal(g.remaining,clock);
  acknowledge();step(75);assert.equal(g.encounterTime,0);assert(e.x!==start||e.wind>0||e.recovery>0,'enemy should resume after speech');
  g.enterRoom(5,100);g.enterRoom(room,100);assert.equal(g.encounterTime,0);
}
g.mission=0;g.begin();g.school();g.enterRoom(4,80);assert(g.enemies[0].female);
g.mission=1;g.begin();g.school();g.enterRoom(4,80);assert(!g.enemies[0].female);
console.log('PASS complete first speeches, resumed aggression, no repeated introductions and female first inspector');
