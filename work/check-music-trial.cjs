const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const strip=s=>s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
const scope={};vm.createContext(scope);
vm.runInContext(require('node:module').stripTypeScriptTypes(strip(fs.readFileSync('src/music.ts','utf8')))+';globalThis.MusicKit=MusicKit;',scope);
class Player {
 constructor(){this.src='';this.paused=true;this.currentTime=0;this.volume=1;this.playCalls=0;this.pauseCalls=0;this.loop=false;this.preload='';}
 play(){this.paused=false;this.playCalls++;return Promise.resolve();}
 pause(){this.paused=true;this.pauseCalls++;}
 removeAttribute(name){if(name==='src')this.src='';}load(){}
}
const state=()=>({phase:'free',mission:0,paused:false,muted:false,care:false,dialogue:false,volume:.5});
const player=new Player(),music=new scope.MusicKit(()=>player),s=state();
for(const phase of ['title','free','receive']){s.phase=phase;music.sync(s);assert.equal(player.playCalls,0);}
s.phase='road';music.sync(s);assert(player.src.endsWith('02-autoradio.wav'));assert(player.loop);assert.equal(player.playCalls,1);
player.currentTime=10;for(let n=0;n<50;n++)music.sync(s);assert.equal(player.playCalls,1);assert.equal(player.currentTime,10);
s.paused=true;music.sync(s);assert(player.paused);assert.equal(player.currentTime,10);
s.paused=false;music.sync(s);assert.equal(player.playCalls,2);assert.equal(player.currentTime,10);
s.muted=true;music.sync(s);assert(player.paused);s.muted=false;music.sync(s);assert(!player.paused);assert.equal(player.currentTime,10);
for(const phase of ['arrival','arrivalFade','fail','opening','blackBefore','course','blackAfter','ellipse','report']){
 s.phase='road';music.sync(s);player.currentTime=5;s.phase=phase;music.sync(s);assert(player.paused);assert.equal(player.currentTime,0,phase+' discards the road music');
}
for(const mission of [0,1,2]){
 s.mission=mission;s.phase='school';music.sync(s);assert(player.src.includes(['03-ormeaux','04-berthelot','05-trois-ponts'][mission]));
 player.currentTime=7;s.care=true;music.sync(s);assert(player.paused);assert.equal(player.currentTime,7);
 s.care=false;music.sync(s);assert(!player.paused);assert.equal(player.currentTime,7);
 s.dialogue=true;music.sync(s);assert(player.volume<.5);s.dialogue=false;music.sync(s);assert.equal(player.volume,.5);
 s.volume=.25;music.sync(s);assert.equal(player.volume,.25);s.volume=.5;
}
music.destroy();assert(player.paused);assert.equal(player.src,'');
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
 p.currentTime=6;g.enterRoom(208,60);g.draw();assert(p.paused);assert.equal(p.currentTime,6);
 g.enterRoom(206,60);g.draw();assert(!p.paused);assert.equal(p.currentTime,6);
 g.loadScenario('road-slow');g.draw();p.currentTime=12;
 g.loadScenario('road-slow');g.draw();assert.equal(p.currentTime,0,'replay starts a fresh soundtrack');
 p.currentTime=9;g.startDay();assert(p.paused);assert.equal(p.currentTime,0,'fresh day stops the previous soundtrack immediately');
 g.finish(false,'exhausted');g.draw();assert(p.paused);assert.equal(p.currentTime,0);
 console.log('PASS real game adapter: free/receive/road, arrival, focus pause, school/care return and game over');
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
