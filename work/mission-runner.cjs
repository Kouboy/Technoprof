// Continuous first assignment, using physical aliases or DirectInput gestures.
// State is observed to choose actions; no position, health, timer, enemy or phase writes.
const {createGame}=require('./test-harness.cjs');
const {driveInput}=require('./drive-bot.cjs');
exports.runMission=({seed=4301,fps=60,mode='keyboard',path='detour',boss='read',driveStyle='avoid',readingDelay=.7}={})=>{
 const {g,step,api}=createGame();
 g.workshop=true;g.seed=seed; // deterministic entry; no workshop scenarios.
 g.controls=new api.ActionInput();g.keys=g.controls.keys;
 g.physicalKeys=Object.fromEntries(Object.values(api.BINDINGS).flat().map(k=>[k,{isDown:false,just:false}]));
 g.direct=new api.DirectInput(g);g.startDay();g.direct.tick(0);
 const dt=1/fps, rooms=[],categories={},threats=new Set();
 let lastRoom=-1,dialogueWait=0,courseWait=0,tapWait=0,elapsed=0,notificationClock=null,arrivalClock=null,schoolClock=null;
 const aliases={LEFT:'Q',RIGHT:'D',UP:'Z',DOWN:'S',X:'F',SPACE:'SPACE',ENTER:'ENTER'};
 const key=(a)=>{g.physicalKeys[aliases[a]].isDown=true;};
 const pulse=(a)=>{g.physicalKeys[aliases[a]].just=true;g.handleKeyDown({key:aliases[a],repeat:false});};
 const tap=(x,y)=>{g.direct.down(1,x,y);g.direct.up(1,x,y);};
 const walk=(x)=>{if(mode==='keyboard'){if(Math.abs(x-g.px)>1)key(x>g.px?'RIGHT':'LEFT');}else if(!g.direct.intent||g.direct.intent.kind!=='walk'||Math.abs(g.direct.intent.x-x)>3)tap(x-g.cam,164);};
 const strike=()=>{if(g.attack||g.hitStop||g.playerRecovery||tapWait>0)return;if(mode==='keyboard')pulse('X');else {tap(g.enemies[0].x-g.cam,110);tapWait=.06;}};
 const jump=(dir=0)=>{if(mode==='keyboard'){pulse('SPACE');if(dir)key(dir>0?'RIGHT':'LEFT');}else{g.direct.down(1,150,153);g.direct.move(1,150+dir*25,124);g.direct.up(1,150+dir*25,124);}};
 const exit=(target)=>{const e=g.pointerExits().find(e=>e.target===target);if(!e)throw Error('Missing exit '+g.room+' -> '+target);
  if(mode==='keyboard'){if(e.edge)key(e.key);else if(g.px<e.from+2)walk(e.from+3);else if(g.px>e.to-2)walk(e.to-3);else key(e.key);}
  else if(g.direct.intent?.kind!=='exit'){if(e.edge&&Math.abs(g.px-(e.key==='LEFT'?12:300))>60)walk(e.key==='LEFT'?15:297);else {const m=api.passageMarker(e,g.px);if(m)tap(m.x+m.w/2-g.cam,m.y+m.h/2);}}
 };
 for(let i=0;i<fps*500&&g.mission===0&&!['fail','report'].includes(g.phase);i++){
  for(const raw of Object.values(g.physicalKeys))raw.isDown=false;
  tapWait=Math.max(0,tapWait-dt);
  const category=g.phase==='school'?(g.encounterTime?'dialogue':g.roomTransition||g.schoolFade?'transition':g.room===4?'boss':g.enemies.some(e=>e.hp>0)&&[3,6].includes(g.room)?'ordinary':'orientation'):g.phase;
  categories[category]=(categories[category]||0)+dt;
  if(g.phase==='receive'&&notificationClock===null)notificationClock=g.remaining;
  if(g.phase==='arrival'&&arrivalClock===null)arrivalClock=g.remaining;
  if(g.phase==='school'&&schoolClock===null)schoolClock=g.remaining;
  if(['free','receive','road'].includes(g.phase)){
   // Use the same visible-traffic lane driver, then translate into actual controls.
   const probe={...g,keys:Object.fromEntries(['LEFT','RIGHT','UP','DOWN'].map(k=>[k,{isDown:false}]))};
   driveInput(probe,1);g.botTarget=probe.botTarget;
   if(driveStyle==='coast'){}
   else if(mode==='keyboard')for(const a of driveStyle==='straight'?['UP']:['LEFT','RIGHT','UP','DOWN']){if(probe.keys[a].isDown)key(a);}
   else {if(!g.direct.gesture)g.direct.down(1,160,140);g.direct.move(1,160+(driveStyle==='straight'?0:probe.botTarget*105),probe.keys.DOWN.isDown&&driveStyle!=='straight'?160:140);}
  }else if(g.phase==='school'&&!g.roomTransition&&!g.schoolFade){
   if(g.room!==lastRoom){rooms.push(g.room);lastRoom=g.room;dialogueWait=0;}
   if(g.encounterTime){dialogueWait+=dt;if(g.dialogue.characters>=api.dialogueLength(g.room,g.dialogue)&&dialogueWait>readingDelay){if(mode==='keyboard')pulse('X');else tap(160,162);dialogueWait=0;}}
   else if(g.falling||g.playerRecovery||g.hitStop){}
   else {
    const e=g.enemies.find(e=>e.hp>0);
    if(e&&(g.room===3||g.room===6||g.room===4)){
     if(e.wind>0)threats.add(g.room+':'+e.pattern);
     const d=e.x-g.px,side=Math.sign(d)||1;
     if(g.room===4&&boss==='read'){
      if(e.wind>0){if(e.wind<.23&&g.py===159)jump();}
      else if(e.recovery>.18||e.stun>0){if(Math.abs(d)>68)walk(e.x-side*62);else if(g.py>=130)strike();}
      else if(Math.abs(d)>70)walk(e.x-side*65);
     }else {if(Math.abs(d)>(g.room===4?70:45))walk(e.x-side*40);else strike();}
    }else if(g.room===4)exit(-1);
    else {
     const next=path==='detour'?{0:1,1:5,5:6,6:7,7:3,3:30,30:31,31:32,32:4}:{0:1,1:2,2:8,8:3,3:30,30:31,31:32,32:4};
     // Jump from the near bank, rather than moving the avatar into a hole.
     const gap=g.room===1?[140,166]:g.room===8?(g.px<150?[95,128]:[190,223]):null;
     if(gap&&g.px>=gap[0]-18&&g.px<gap[1]&&g.py===159)jump(1);
     else exit(next[g.room]);
    }
   }
  }else if(g.phase==='course'){courseWait+=dt;if(courseWait>1){if(mode==='keyboard')pulse('X');else tap(160,100);}}
  step(1000/fps);elapsed+=dt;
 }
 const journal=g.journalSnapshot(),result=journal.events.find(e=>['success','failure'].includes(e.kind));
 return {seed,fps,mode,path,driveStyle,outcome:g.results[0]??g.phase,remaining:result?.data?.remaining??+g.remaining.toFixed(2),nextRemaining:g.remaining,hp:result?.data?.hp??g.hp,vehicle:+(result?.data?.vehicle??g.vehicle).toFixed(2),collisions:g.collisions,falls:g.session.falls,punches:g.punches,rooms,threats:[...threats],notificationClock,arrivalClock,schoolClock,elapsed:+elapsed.toFixed(2),categories:Object.fromEntries(Object.entries(categories).map(([k,v])=>[k,+v.toFixed(2)])),journal,end:{phase:g.phase,room:g.room,x:g.px,enemy:g.enemies[0],intent:g.direct.intent?.kind}};
};
if(require.main===module){for(const mode of ['keyboard','direct'])for(const path of ['detour','shortcut']){const r=exports.runMission({mode,path});console.log(JSON.stringify({...r,journal:undefined}));}}
