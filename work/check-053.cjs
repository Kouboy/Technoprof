const assert=require('assert/strict');
const {load}=require('./audio-harness.cjs');
class Param {
 constructor(v=0){this.value=v;this.events=[];}
 setValueAtTime(v,t){assert(Number.isFinite(v)&&t>=0);this.value=v;this.events.push(['set',v,t]);}
 setTargetAtTime(v,t,k){assert(k>0);this.setValueAtTime(v,t);}
 linearRampToValueAtTime(v,t){this.setValueAtTime(v,t);}
 exponentialRampToValueAtTime(v,t){assert(v>0);this.setValueAtTime(v,t);}
 cancelScheduledValues(t){this.events=this.events.filter(e=>e[2]<t);}
}
class Node {
 constructor(c,type){this.c=c;this.type=type;this.connections=[];this.gain=new Param();this.frequency=new Param();this.Q=new Param();this.pan=new Param();this.playbackRate=new Param(1);}
 connect(n){assert(n,'disconnected output');this.connections.push(n);return n;}
 disconnect(){this.connections=[];this.disconnected=true;}
 start(t=0,offset=0){assert(t>=this.c.currentTime);this.startAt=t;this.offset=offset;}
 stop(t=this.c.currentTime){this.stopAt=t;}
}
class Context {
 constructor(){this.currentTime=0;this.sampleRate=48000;this.nodes=[];this.destination={};}
 node(type){const n=new Node(this,type);this.nodes.push(n);return n;}
 createGain(){return this.node('gain');} createBufferSource(){return this.node('source');}
 createBiquadFilter(){return this.node('filter');}createStereoPanner(){return this.node('pan');}
 createOscillator(){return this.node('oscillator');}createConvolver(){return this.node('convolver');}
 createDynamicsCompressor(){const n=this.node('compressor');for(const p of ['threshold','knee','ratio','attack','release'])n[p]=new Param();return n;}
 createBuffer(ch,n,sr){const data=Array.from({length:ch},()=>new Float32Array(n));return{duration:n/sr,sampleRate:sr,length:n,getChannelData:i=>data[i]};}
 resume(){return Promise.resolve();}
 advance(t){this.currentTime+=t;for(const n of this.nodes)if(!n.ended&&n.stopAt<=this.currentTime){n.ended=true;n.onended?.();}}
}
const timers=[],ctx=load({AudioContext:Context,setTimeout:fn=>timers.push(fn)}),{bank,AudioKit}=ctx;
const stats=k=>{
 const p=bank.makeMaterial(k,bank.AUDIO.sampleRate);let rms=0,crossings=0,mean=0;
 for(let i=0;i<p.length;i++){assert(Number.isFinite(p[i])&&Math.abs(p[i])<=1.01);rms+=p[i]*p[i];mean+=p[i];if(i&&p[i]*p[i-1]<0)crossings++;}
 return{pcm:p,rms:Math.sqrt(rms/p.length),mean:mean/p.length,crossings:crossings/p.length*bank.AUDIO.sampleRate};
};
for(const kind of Object.keys(bank.FOLEY)){
 const a=stats(kind);assert(a.rms>0.001&&a.rms<0.5,kind);assert(Math.abs(a.mean)<0.003,kind+' DC');
}
assert(stats('block').crossings>stats('book').crossings*2);
assert(stats('body').crossings<stats('block').crossings/2);
const pcm=stats('pass').pcm,energy=(l,r)=>{let v=0;for(let i=Math.floor(l*22050);i<Math.floor(r*22050);i++)v+=pcm[i]**2;return v;};
assert(energy(.09,.17)>energy(.36,.44)*2,'passing peak occurs too late');
const kit=new AudioKit();kit.prepare();assert(!kit.context,'prepare bypassed browser gesture');while(timers.length)timers.shift()();
assert.equal(kit.samples.size,Object.keys(bank.FOLEY).length);
kit.unlock();kit.unlock();const c=kit.context;assert.equal(Object.keys(kit.loops).length,5);assert.equal(c.nodes.filter(n=>n.loop).length,5);
assert.equal(kit.buffer('book'),kit.buffer('book'));assert.equal(kit.buffer('book').sampleRate,22050);
kit.scene('road',false,240,.02);kit.motor(40,true,true);const slow=kit.loops.wind.gain.gain.value;
c.advance(.3);kit.motor(110,true,true);const medium=kit.loops.wind.gain.gain.value;
c.advance(.3);kit.motor(260,true,true);const fast=kit.loops.wind.gain.gain.value;
assert(slow<medium&&medium<fast/4);const full=kit.loops.engine.gain.gain.value;
c.advance(.3);kit.motor(260,true,true);const steady=kit.loops.engine.gain.gain.value;
assert(steady>full,'gear shift did not briefly unload engine');
kit.radioPlaying=true;kit.motor(260,true,true);assert(kit.loops.engine.gain.gain.value<steady*.6);kit.radioPlaying=false;
kit.motor(260,false);assert.equal(kit.loops.engine.gain.gain.value,0);assert.equal(kit.loops.wind.gain.gain.value,0);
kit.pass(-1,false,false,160);const far=[...kit.voices].at(-1),farGain=far.nodes[0].gain.events.find(e=>e[1]>0)[1];assert(far.nodes[1].pan.value<0);
kit.pass(1,true,false,160);const near=[...kit.voices].at(-1),nearGain=near.nodes[0].gain.events.find(e=>e[1]>0)[1];assert(near.nodes[1].pan.value>0);assert(nearGain>farGain*2);
kit.effectsVolume=.4;kit.ambienceVolume=.2;kit.scene('school',false,20,.02,3,true);
assert(Math.abs(kit.master.gain.value-.28)<1e-8);assert(Math.abs(kit.ambience.gain.value-.14)<1e-8);
assert.equal([...kit.voices].filter(v=>v.group==='cue').length,0,'timer beeps during suspended dialogue');
kit.scene('school',false,19,.02,3,false);assert.equal([...kit.voices].filter(v=>v.group==='cue').length,1);
kit.scene('school',false,19,.02,3,false);assert.equal([...kit.voices].filter(v=>v.group==='cue').length,1);
kit.scene('course',false,120,0);assert.equal(kit.voices.size,5);
assert([...kit.voices].every(v=>v.nodes[1].connections.includes(kit.ambience)&&!v.nodes[1].connections.includes(kit.master)),'class sounds bypass ambience volume');
kit.scene('course',false,120,1.3);c.advance(1.3);const age=kit.classroomAge;
kit.scene('course',true,120,0);assert.equal(kit.voices.size,0);assert.equal(kit.master.gain.value,0);
c.advance(10);kit.scene('course',true,120,10);assert.equal(kit.classroomAge,age,'pause consumed class sounds');
kit.scene('course',false,120,0);assert.equal(kit.voices.size,3,'pause replayed old chairs or lost remaining paper/chalk');
assert([...kit.voices].some(v=>v.source.offset>0));
kit.scene('blackAfter',false,120,.02);assert.equal(kit.voices.size,0,'classroom played after ellipse');c.advance(10);
kit.scene('receive',false,120,.02);assert.equal(kit.voices.size,5);
const notificationPriority=kit.duckUntil;kit.pass(1,true,false,200);kit.roadImpact(1,false);
assert.equal(kit.duckUntil,notificationPriority,'short effect stole notification priority');
kit.scene('receive',true,120,0);assert.equal(kit.voices.size,0);
kit.scene('road',false,120,.02);for(let i=0;i<80;i++)kit.combat('hit',i%2?1:-1);
assert.equal(kit.voices.size,bank.AUDIO.maxVoices);c.advance(1);assert.equal(kit.voices.size,0);
assert(c.nodes.filter(n=>n.ended).every(n=>n.disconnected),'ended nodes remain connected');
kit.play('paper',0,1,3);kit.muted=true;kit.scene('road',false,120,.02);assert.equal(kit.voices.size,0);
kit.combat('hit',1);assert.equal(kit.voices.size,0);kit.muted=false;kit.scene('road',false,120,.02);assert.equal(kit.voices.size,0,'old sound returned on unmute');
console.log('PASS 0.53 PCM materials, passing peak, gesture unlock, caches, five loops, speed/load/gear/radio mix, stereo near-pass, independent ambience, dialogue urgency, pause/ellipse cancellation, bounded voices and cleanup');

const {createGame}=require('./test-harness.cjs');
const h=createGame(),events=[];h.g.audio.fx=(...args)=>events.push(args);h.g.loadScenario('gap');events.length=0;
h.press('SPACE');assert(events.some(e=>e[0]==='jump'));h.advance(1.1);assert(events.some(e=>e[0]==='land'));
events.length=0;h.g.px=110;h.g.py=159;h.g.vy=0;h.step();assert(events.some(e=>e[0]==='crumble'));h.advance(1);assert.equal(events.filter(e=>e[0]==='land').length,1);
const boss=createGame(),sounds=[];boss.g.audio.fx=(...args)=>sounds.push(args);boss.g.loadScenario('sweep');boss.g.px=90;boss.advance(.8);assert.equal(sounds.filter(e=>e[0]==='sweep').length,1);
console.log('PASS 0.53 semantic audio follows actual jump, landing, fall recovery and boss attack, once per event');

// Dialogue grains use the existing effects bus, gesture gate and cancellation.
const speech=new AudioKit();speech.talk(1);assert(!speech.context);
speech.unlock();speech.scene('school',false,240,.02,4,true);
speech.talk(4,true,.5);const female=[...speech.voices].at(-1);
speech.talk(4,false,.5);const male=[...speech.voices].at(-1);
assert.equal(female.group,'dialogue');assert(female.source.playbackRate.value>male.source.playbackRate.value);
assert(female.nodes[1].connections.includes(speech.master)&&!female.nodes[1].connections.includes(speech.ambience));
assert.equal(female.source.startAt,speech.context.currentTime,'speech must not accumulate scheduled syllables');
assert(female.source.stopAt-speech.context.currentTime<.06,'speech grain outlives its character');
speech.scene('school',true,240,0,4,true);assert.equal(speech.voices.size,0);speech.talk(4,true);assert.equal(speech.voices.size,0);
speech.scene('school',false,240,0,4,true);speech.muted=true;speech.talk(4,true);assert.equal(speech.voices.size,0);
console.log('PASS 0.54 speech profiles, effects volume routing, short immediate sources, gesture gate, pause and mute');
