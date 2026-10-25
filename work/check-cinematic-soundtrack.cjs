const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('src/cinematic-audio.ts','utf8').replace(/import[^;]+;/g,'').replace(/export /g,'');
const c={};vm.createContext(c);vm.runInContext(require('node:module').stripTypeScriptTypes(src,{mode:'transform'})+';this.Kit=CinematicSoundtrack;',c);
class Player{constructor(){this.paused=true;this.currentTime=0;this.readyState=4;this.ended=false;this.volume=1;this.calls=0}play(){this.paused=false;this.calls++;return Promise.resolve()}pause(){this.paused=true}removeAttribute(){this.src='';this.currentTime=0}load(){}}
const state=()=>({paused:false,muted:false,musicVolume:.4,effectsVolume:.6});
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve()};
(async()=>{
 const players=[],kit=new c.Kit(()=>{const p=new Player();players.push(p);return p}),s=state(),seq={token:1,kind:'intro'};
 kit.sync(seq,s);assert.equal(kit.time(),null);await flush();assert.equal(kit.time(),0);assert.equal(players.length,2);assert(players[0].src.endsWith('Intro-Musique.wav'));assert(players[1].src.endsWith('Intro-Reperes.wav'));
 assert.equal(players[0].volume,.4);assert.equal(players[1].volume,.3);players.forEach(p=>p.currentTime=3);
 s.paused=true;kit.sync(seq,s);assert(players.every(p=>p.paused));assert.equal(kit.time(),3);s.paused=false;kit.sync(seq,s);await flush();assert.equal(kit.time(),3);
 s.muted=true;kit.sync(seq,s);assert(players.every(p=>p.volume===0&&!p.paused),'mute is silent without freezing film');s.muted=false;s.musicVolume=0;kit.sync(seq,s);assert.equal(players[0].volume,0);assert.equal(players[1].volume,.3);assert(players.every(p=>!p.paused));
 players[1].currentTime=8;players[0].currentTime=7;kit.sync(seq,s);assert.equal(players[0].currentTime,8,'music follows cue master');assert.equal(kit.time(),8);
 players[1].ended=true;players[1].currentTime=10;const n=players[1].calls;kit.sync(seq,s);assert.equal(players[1].calls,n);assert.equal(kit.time(),10);kit.sync(null,s);assert(players.every(p=>p.paused));assert.equal(kit.time(),null);
 kit.sync({token:2,kind:'ending'},s);await flush();assert(players[2].src.endsWith('Fin-Musique.wav'));assert(players[3].src.endsWith('Fin-Reperes.wav'));kit.destroy();assert(players.every(p=>p.paused));
 const bad=[],b=new c.Kit(()=>{const p=new Player();p.play=()=>Promise.reject(Error('blocked'));bad.push(p);return p});b.sync(seq,state());await flush();assert(b.blocked);assert.equal(b.time(),null);assert(bad.every(p=>p.paused));bad.forEach(p=>p.play=Player.prototype.play);b.retry();await flush();assert(!b.blocked);assert.equal(b.time(),0);
 let reject;const delayed=[],d=new c.Kit(()=>{const p=new Player();p.play=()=>new Promise((_r,r)=>reject=r);delayed.push(p);return p});d.sync(seq,state());d.stop();reject(Error('old failure'));await flush();assert(!d.blocked,'stale failure cannot poison next film');
 console.log('PASS cinematic stems: independent gains, cue-master clock, pause/mute/zero music, source replacement, natural end, blocked retry and stale-play cleanup');
})().catch(e=>{console.error(e);process.exitCode=1});
