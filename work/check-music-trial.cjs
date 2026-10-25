const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const strip=s=>s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
const scope={};vm.createContext(scope);
vm.runInContext(require('node:module').stripTypeScriptTypes(strip(fs.readFileSync('src/music.ts','utf8')))+';globalThis.MusicKit=MusicKit;',scope);
class Player {
 constructor(){this.src='';this.paused=true;this.currentTime=0;this.volume=1;this.playCalls=0;this.pauseCalls=0;this.loop=false;this.preload='';this.ended=false;this.readyState=4;this.listeners=new Map();}
 set src(v){this._src=v;this.currentTime=0;this.ended=false;}get src(){return this._src;}
 play(){this.paused=false;this.playCalls++;return Promise.resolve();}
 pause(){this.paused=true;this.pauseCalls++;}
 removeAttribute(name){if(name==='src')this.src='';}load(){}
 addEventListener(name,fn){this.listeners.set(name,fn);}removeEventListener(name,fn){if(this.listeners.get(name)===fn)this.listeners.delete(name);}
 emit(name){const fn=this.listeners.get(name);this.listeners.delete(name);fn?.();}
}
const state=()=>({phase:'free',mission:0,paused:false,muted:false,schoolContext:'exploration',age:0,dialogue:false,volume:.5});
const player=new Player(),music=new scope.MusicKit(()=>player),s=state();
for(const phase of ['free','receive']){s.phase=phase;music.sync(s);assert.equal(player.playCalls,0);}
s.phase='road';music.sync(s);assert(player.src.endsWith('02-autoradio.wav'));assert(player.loop);assert.equal(player.playCalls,1);
player.currentTime=10;for(let n=0;n<50;n++)music.sync(s);assert.equal(player.playCalls,1);assert.equal(player.currentTime,10);
s.paused=true;music.sync(s);assert(player.paused);assert.equal(player.currentTime,10);
s.paused=false;music.sync(s);assert.equal(player.playCalls,2);assert.equal(player.currentTime,10);
s.muted=true;music.sync(s);assert(player.paused);s.muted=false;music.sync(s);assert(!player.paused);assert.equal(player.currentTime,10);
for(const phase of ['arrival','arrivalFade','opening','blackBefore','course','blackAfter','ellipse','report']){
 s.phase='road';music.sync(s);player.currentTime=5;s.phase=phase;music.sync(s);assert(player.paused);assert.equal(player.currentTime,0,phase+' discards the road music');
}
for(const mission of [0,1,2]){
 s.mission=mission;s.phase='school';music.sync(s);assert(player.src.includes(['03-ormeaux','04-berthelot','05-trois-ponts'][mission]));
 player.currentTime=7;s.schoolContext='care';music.sync(s);assert(!player.paused);assert(player.src.endsWith('09-infirmerie.wav'));
 s.schoolContext='exploration';music.sync(s);assert(!player.paused);assert.equal(player.currentTime,7);
 s.dialogue=true;music.sync(s);assert(player.volume<.5);s.dialogue=false;music.sync(s);assert.equal(player.volume,.5);
 s.volume=.25;music.sync(s);assert.equal(player.volume,.25);s.volume=.5;
}
music.destroy();assert(player.paused);assert.equal(player.src,'');
// Exploration seeks survive metadata arriving during pause; obsolete seeks do not.
{
 const p=new Player(),m=new scope.MusicKit(()=>p),s=state();s.phase='school';m.sync(s);p.currentTime=9;
 s.schoolContext='care';m.sync(s);p.readyState=0;s.schoolContext='exploration';m.sync(s);
 p.currentTime=0;s.paused=true;m.sync(s);p.readyState=4;p.emit('loadedmetadata');assert.equal(p.currentTime,9);assert(p.paused);
 s.paused=false;m.sync(s);assert(!p.paused);assert.equal(p.currentTime,9);
 s.schoolContext='care';m.sync(s);p.readyState=0;s.schoolContext='exploration';m.sync(s);
 const stale=p.listeners.get('loadedmetadata');assert(stale);
 s.phase='arrival';m.sync(s);s.phase='school';s.mission=1;m.sync(s);p.currentTime=5;
 s.schoolContext='care';m.sync(s);s.schoolContext='exploration';m.sync(s);assert(p.listeners.has('loadedmetadata'));
 stale();m.stop();assert.equal(p.listeners.size,0,'old metadata must not detach the current seek cleanup');
 m.sync(s);assert.equal(p.currentTime,0,'reset discards any care offset');
 console.log('PASS care offsets: delayed metadata during pause, stale seek and clean reset');
}
// Every context has its own theme; failure is a one-shot rather than a frame trigger.
{
 const p=new Player(),m=new scope.MusicKit(()=>p),s=state();
 for(const mission of [0,1,2]){
  s.mission=mission;s.phase='road';m.sync(s);assert(p.src.endsWith(['02-autoradio.wav','10-autoradio-midi.wav','11-autoradio-soir.wav'][mission]));
  s.phase='school';s.schoolContext='boss';s.dialogue=true;m.sync(s);assert(p.src.endsWith(['06-boss-inspectrice.wav','07-boss-parent.wav','08-boss-securite.wav'][mission]));assert(p.volume<.5);
  s.dialogue=false;m.sync(s);assert.equal(p.volume,.5);assert(p.loop);
  s.schoolContext='cleared';m.sync(s);assert(p.paused,'boss KO silences the arena');
 }
 s.phase='fail';s.age=.4;m.sync(s);assert(p.paused,'failure SFX lead the music');
 s.age=.5;m.sync(s);assert(p.src.endsWith('12-gameover.wav'));assert(!p.loop);assert(!p.paused);
 const calls=p.playCalls;p.currentTime=12;p.ended=true;p.paused=true;
 for(let n=0;n<50;n++)m.sync(s);m.retry();assert.equal(p.playCalls,calls,'ended game over cannot restart');
 s.paused=true;m.sync(s);s.paused=false;s.muted=true;m.sync(s);s.muted=false;m.sync(s);assert.equal(p.playCalls,calls);
 m.stop();m.sync(s);assert.equal(p.playCalls,calls+1,'a new failure can play after reset');
 s.phase='free';m.sync(s);assert(p.paused);assert.equal(p.currentTime,0);
 console.log('PASS three radios, three bosses, cleared arena, delayed one-shot game over and reset');
}
// The approved title leads the mix, remains audible in title menus and respects volume.
{
 const p=new Player(),m=new scope.MusicKit(()=>p),s=state();s.phase='title';m.sync(s);
 assert(p.src.endsWith('titre-reference-2026-10-23/Technoprof-Titre-Interpretation.wav'));
 assert(!p.paused);assert.equal(p.volume,.9,'title gain above the in-game mix');
 s.dialogue=true;m.sync(s);assert.equal(p.volume,.9,'stale dialogue cannot duck the title');
 s.volume=1;m.sync(s);assert.equal(p.volume,1,'bounded title gain');
 p.currentTime=8;s.muted=true;m.sync(s);assert(p.paused);assert.equal(p.currentTime,8);
 s.muted=false;m.sync(s);assert(!p.paused);assert.equal(p.currentTime,8);
 s.phase='free';m.sync(s);assert(p.paused);assert.equal(p.currentTime,0,'title stops before the bulletin');
 const {createGame}=require('./test-harness.cjs');const {g}=createGame();const q=new Player();
 g.music=new scope.MusicKit(()=>q);g.audio.musicVolume=.5;g.phase='title';g.playerMenu=true;g.syncMusic();
 assert(!q.paused,'the title menu must not silence its own music');
 q.currentTime=4;g.pauseForFocusLoss();assert(q.paused);assert.equal(q.currentTime,4);
 g.restoreMusicFocus();assert(!q.paused);assert.equal(q.currentTime,4);
 g.setPlayerMenu(true);assert(!q.paused,'settings stay in the foreground title mix');
 g.startDay();assert(q.paused);assert.equal(q.currentTime,0);
 console.log('PASS title: approved asset, foreground gain, clamp, title menus, mute, focus and service start');
}
// The game adapter uses real phases/care state and stops on a focus pause.
{
 const {createGame}=require('./test-harness.cjs');
 const t=createGame(),g=t.g,p=new Player();g.music=new scope.MusicKit(()=>p);g.audio.musicVolume=.35;
 g.draw=()=>g.syncMusic();g.validatedDay=true;g.startDay();g.audio.radioDone=true;
 t.advance(3.1);assert.equal(g.phase,'receive');assert.equal(p.playCalls,0,'no music over DATA');
 t.advance(3.1);assert.equal(g.phase,'road');assert.equal(p.playCalls,1);assert.equal(p.volume,.35);
 p.currentTime=4;g.setPaused(true,'FENETRE INACTIVE');assert(p.paused);assert.equal(p.currentTime,4);
 g.setPaused(false);assert(!p.paused);assert.equal(p.currentTime,4);
 g.road=g.missionSpec().meters; t.step();assert.equal(g.phase,'arrival');assert(p.paused);assert.equal(p.currentTime,0);
 g.school();g.draw();assert(p.src.includes('03-ormeaux'));
 p.currentTime=6;g.enterRoom(208,60);g.draw();assert(!p.paused);assert(p.src.endsWith('09-infirmerie.wav'));
 g.enterRoom(206,60);g.draw();assert(!p.paused);assert.equal(p.currentTime,6);
 g.loadScenario('road-slow');g.draw();p.currentTime=12;
 g.loadScenario('road-slow');g.draw();assert.equal(p.currentTime,0,'replay starts a fresh soundtrack');
 p.currentTime=9;g.startDay();assert(p.paused);assert.equal(p.currentTime,0,'fresh day stops the previous soundtrack immediately');
 g.finish(false,'exhausted');g.draw();assert(p.paused);assert.equal(p.currentTime,0);
 console.log('PASS real game adapter: free/receive/road, arrival, focus pause, school/care return and game over');
}
// A complete adapter pass through all three validated missions and their actual rooms.
{
 const {createGame}=require('./test-harness.cjs'),t=createGame(),g=t.g,p=new Player();
 g.music=new scope.MusicKit(()=>p);g.draw=()=>g.syncMusic();g.audio.musicVolume=.4;g.validatedDay=true;g.startDay();
 for(const mission of [0,1,2]){
  g.mission=mission;g.begin();g.audio.radioDone=true;t.advance(3.1);assert.equal(g.phase,'receive');assert(p.paused);
  t.advance(3.1);assert.equal(g.phase,'road');assert(p.src.endsWith(['02-autoradio.wav','10-autoradio-midi.wav','11-autoradio-soir.wav'][mission]));
  g.road=g.missionSpec().meters;t.step();assert.equal(g.phase,'arrival');assert(p.paused);t.advance(7);assert.equal(g.phase,'school');
  const schoolFile=['03-ormeaux.wav','04-berthelot.wav','05-trois-ponts.wav'][mission];assert(p.src.endsWith(schoolFile));
  const care=Object.values(g.navigationSpec().rooms).find(r=>r.care);assert(care);p.currentTime=6+mission;
  g.enterRoom(care.id,60);g.draw();assert(p.src.endsWith('09-infirmerie.wav'));assert(g.recoveryScene.active);
  const remaining=g.remaining;t.advance(1.2);assert.equal(g.remaining,remaining,'care clock unchanged');
  for(let n=0;n<12&&g.recoveryScene.active;n++){t.press('X');t.advance(.3);}t.advance(1.2);
  assert(!g.recoveryScene.active);assert.notEqual(g.room,care.id);assert(p.src.endsWith(schoolFile));assert.equal(p.currentTime,6+mission);
  g.enterRoom(g.missionSpec().arena,150);g.draw();assert(p.src.endsWith(['06-boss-inspectrice.wav','07-boss-parent.wav','08-boss-securite.wav'][mission]));assert(p.volume<.4);
  g.encounterTime=0;g.bossIntro=0;g.draw();assert.equal(p.volume,.4);
  g.enemies.filter(e=>e.boss).forEach(e=>e.hp=0);g.draw();assert(p.paused);assert.equal(g.music.current,null);
  g.finish(true);g.draw();assert.equal(g.phase,'opening');assert(p.paused);
 }
 g.loadScenario('exhausted');g.finish(false,'exhausted');g.draw();assert(p.paused);t.advance(.5);assert(p.src.endsWith('12-gameover.wav'));assert(!p.paused);
 p.currentTime=2;g.setPaused(true);assert(p.paused);g.setPaused(false);assert.equal(p.currentTime,2);
 const calls=p.playCalls;p.currentTime=12;p.ended=true;p.paused=true;t.advance(1);assert.equal(p.playCalls,calls);
 console.log('PASS real three-mission flow: roads, arrival silence, exploration, complete care and offset return, boss intro/combat/KO, opening and one-shot failure');
}
// The protected return keeps a single loop through parking, fades, then stops.
{
 const {createGame}=require('./test-harness.cjs'),t=createGame({policy:'three-required'}),g=t.g,p=new Player();
 g.music=new scope.MusicKit(()=>p);g.audio.musicVolume=.4;g.draw=()=>g.syncMusic();g.mission=g.won=3;g.startHomeReturn();g.draw();
 assert(p.src.endsWith('13-retour-maison.wav'));assert(p.loop);assert.equal(p.volume,.4);
 p.currentTime=12;g.setPaused(true);assert(p.paused);g.setPaused(false);assert.equal(p.currentTime,12);
 g.phase='homeArrival';g.age=0;g.draw();assert.equal(p.volume,.4,'parking cannot amplify the radio before its fade');
 g.age=2.025;g.draw();assert(Math.abs(p.volume-.2)<1e-8);assert.equal(p.currentTime,12);
 g.setPaused(true);assert(p.paused);g.setPaused(false);assert(Math.abs(p.volume-.2)<1e-8);
 g.age=2.25;g.draw();assert.equal(p.volume,0);g.completeHomeReturn();g.draw();assert(p.paused);assert.equal(g.music.current,null);
 console.log('PASS home radio: dedicated loop, pause offset, parking fade, silence before ending');
}
(async()=>{
 let reject;
 const delayed=new Player();delayed.play=function(){this.playCalls++;return new Promise((resolve,rejectFn)=>reject=rejectFn);};
 const m=new scope.MusicKit(()=>delayed),s=state();s.phase='road';m.sync(s);m.sync(s);assert.equal(delayed.playCalls,1,'one pending play');
 s.phase='fail';m.sync(s);reject({name:'NotAllowedError'});await Promise.resolve();await Promise.resolve();assert(!m.blocked,'stale rejection cannot affect new scene');assert(delayed.paused);
 const rejections=[];const replaced=new Player();replaced.play=function(){this.playCalls++;return new Promise((resolve,rejectFn)=>rejections.push(rejectFn));};
 const r=new scope.MusicKit(()=>replaced),next=state();next.phase='road';r.sync(next);next.phase='school';r.sync(next);
 rejections[0]({name:'NotAllowedError'});await Promise.resolve();await Promise.resolve();assert(!r.blocked,'old track rejection cannot block the replacement');
 r.sync(next);assert.equal(replaced.playCalls,2,'replacement still has its own pending play');
 rejections[1]({name:'NotAllowedError'});await Promise.resolve();await Promise.resolve();assert(r.blocked,'current track rejection remains actionable');
 const blocked=new Player();blocked.play=function(){this.playCalls++;return Promise.reject({name:'NotAllowedError'});};
 const b=new scope.MusicKit(()=>blocked),live=state();live.phase='road';b.sync(live);await Promise.resolve();await Promise.resolve();assert(b.blocked);
 b.sync(live);assert.equal(blocked.playCalls,1,'do not retry every frame');
 blocked.play=Player.prototype.play;b.retry();assert.equal(blocked.playCalls,2);assert(!b.blocked);assert(!blocked.paused);
 console.log('PASS four optional themes, after-notification radio, phase cuts, pause/mute/care offsets, dialogue ducking, volume, pending-play cancellation and gesture retry');
})().catch(e=>{console.error(e);process.exitCode=1;});
