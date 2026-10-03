const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {createGame}=require('./test-harness.cjs');
const strip=s=>s.replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\r?\n/gm,'').replace(/export /g,'');
const scope={roomSpec:()=>scope.room,smallPrint:(...a)=>scope.labels.push(a[3]),smallWidth:s=>s.length*4};
vm.createContext(scope);
const source=['gameplay','combat-poses','new-school-art'].map(n=>strip(fs.readFileSync('src/'+n+'.ts','utf8'))).join('\n');
vm.runInContext(require('node:module').stripTypeScriptTypes(source,{mode:'transform'})+';this.api={NewSchoolArt,newEnemyFrame,enemyPhase,SECURITY,THROWER,FILMER,poseExclusions};',scope);
function sprite(){const s={};for(const k of ['setDepth','setTexture','setOrigin','setPosition','setScale','setAngle','setAlpha','setVisible','setDisplaySize','setFlipX'])s[k]=(...a)=>{s[k+'Args']=a;return s;};return s;}
const art=Object.create(scope.api.NewSchoolArt.prototype);art.background=sprite();art.enemy=sprite();
art.door=new Proxy({}, {get:()=>()=>{}});
function render(g){scope.room=g.roomSpec();scope.labels=[];art.render({...g,art:{drawTeacher(){},reactEnemy(){}}});return art.enemy.setTextureArgs[0];}
function ready(mission,id){const h=createGame();h.g.mission=mission;h.g.begin();h.g.school();h.g.schoolFade=0;h.g.enterRoom(id,80);for(let i=0;h.g.encounterTime&&i<12;i++)h.press('X');assert.equal(h.g.encounterTime,0);return h;}
for(const [mission,id,role] of [[1,11,'filmer'],[1,14,'influential'],[2,21,'thrower'],[2,24,'security']]){
 for(const fps of [30,60,120]){
  const h=ready(mission,id),g=h.g,e=g.enemies[0],events=[];
  g.audio.enemyGesture=(...a)=>events.push(a);
  g.px=e.x-(role==='thrower'?90:45);e.cool=0;e.facing=-1;
  h.step(1000/fps);assert(e.wind>0,role);assert(render(g).endsWith('pose-'+(e.boss?1:5)),role+' preparation pose');
  let active=false,activeSeconds=0;
  for(let i=0;i<400;i++){
   h.step(1000/fps);
   const state=scope.api.enemyPhase(e);
   if(state==='strike'){
    active=true;activeSeconds+=1/fps;
    assert(render(g).endsWith('pose-'+(e.boss?2:6)),role+' recovery masks attack');
   }else if(active){assert(['recovery','hurt'].includes(state),role+' unexpected exit '+state);assert(render(g).endsWith('pose-'+(e.boss?3:7)));break;}
  }
  assert(active,role+' never showed release');
  const minimum=role==='security'?.2:role==='thrower'?.18:role==='filmer'?.15:.9;
  assert(activeSeconds>=minimum,role+' active pose too brief');
  assert.equal(events.filter(a=>a[1]==='windup').length,1,role+' repeated preparation sound');
  assert.equal(events.filter(a=>a[1]==='release').length,1,role+' repeated release sound');
  assert(events.every(a=>a[0]===role&&Number.isFinite(a[2])));
 }
 const h=ready(mission,id),g=h.g,e=g.enemies[0],sounds=[];
 g.audio.enemyGesture=(...a)=>sounds.push(a);e.wind=.8;e.cool=3;g.px=e.x-38;g.face=1;
 // A boss can only be interrupted through its legal opening; ordinary threats are exposed.
 if(e.boss){e.recovery=.5;e.wind=0;}
 h.press('X');h.advance(.2);assert(e.hp<(e.boss?6:2));
 assert.equal(e.wind,0);assert.equal(e.strikeTime,0);assert.equal(e.chargeTime,0);
 assert.equal(scope.api.newEnemyFrame(e),3);assert(!sounds.some(a=>a[1]==='release'),'cancelled attack made a release sound');
 g.setPaused(true);const count=sounds.length;h.advance(1);assert.equal(sounds.length,count);
}
{
 const h=ready(2,24),g=h.g,e=g.enemies[0];g.px=e.x+45;e.facing=-1;e.cool=5;
 h.step();assert.equal(scope.api.enemyPhase(e),'turn');assert.equal(scope.api.newEnemyFrame(e),3);
 render(g);assert(scope.labels.includes('RETOURNEMENT'));assert.equal(e.facing,-1);
 h.advance(.4);assert.equal(e.facing,-1);h.advance(.5);assert.equal(e.facing,1);
 render(g);assert(scope.labels.includes('GARDE DE FACE'));
}
{
 const {load}=require('./audio-harness.cjs'),{AudioKit}=load();const kit=new AudioKit(),calls=[];kit.play=(...args)=>calls.push(args);
 for(const role of ['filmer','influential','thrower','security']) for(const stage of ['windup','release']){
  calls.length=0;kit.enemyGesture(role,stage,80);assert(calls.length>=1&&calls.length<=2);
  for(const [kind,pan,gain,delay,group,rate] of calls){assert.equal(delay,0);assert.equal(group,'fx');assert(pan<0&&pan>=-.5);assert(gain>0&&gain<=1.1&&rate>=.8&&rate<=1.45);assert.notEqual(kind,'jump');}
 }
 calls.length=0;kit.enemyGesture('security','release',270);assert(calls.every(a=>a[1]>0));
}
console.log('PASS 058 actual render at 30/60/120 fps: preparation/active/recovery for four new actors, no pose hidden by recovery; hits cancel attacks and sound, pause remains silent');
console.log('PASS 058 security turn diagnostic, committed front, one semantic audio event per preparation/release, four gesture signatures on effects bus, no delayed playback or extra samples');
// The neighbour's arm at source-local (30,130) must not survive either recovery extraction.
for(const i of [3,7]){
 const masks=scope.api.poseExclusions(i,384,512);
 const excluded=(px,py)=>masks.some(([x,y,w,h])=>px>=x&&px<x+w&&py>=y&&py<y+h);
 assert(excluded(30,130));assert(!excluded(100,130));assert(!excluded(200,490));
}
console.log('PASS 058 atlas recovery masks exclude neighbouring hands, preserve body and foot anchors');
