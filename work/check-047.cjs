const assert=require('assert'),fs=require('fs'),vm=require('vm');
const {createGame}=require('./test-harness.cjs');
const ts=require('node:module').stripTypeScriptTypes;
// A three-outcome day retains reasons, then starts a genuinely fresh service.
{
 const {g,advance,press}=createGame();g.startDay();
 g.phase='road';g.finish(false,'late');assert.equal(g.results[0],'RETARD SUR LA ROUTE');
 advance(2.1);press('ENTER');assert.equal(g.mission,1);assert.equal(g.phase,'free');
 g.phase='school';g.finish(true);g.next();
 g.phase='school';g.finish(false,'exhausted');g.next();
 assert.equal(g.phase,'report');assert.equal(g.won,1);assert.equal(g.results[2],'PROF EPUISE');
 g.startDay();assert.equal(g.mission,0);assert.equal(g.results.length,0);assert.equal(g.vehicle,100);
 assert.equal(g.notified,false);assert.equal(g.remaining,240);assert(!g.paused);
 g.keys.RIGHT.isDown=true;g.setPlayerMenu(true);assert(!g.keys.RIGHT.isDown);assert(!g.input.keyboard.enabled);
 g.setPlayerMenu(false);assert(g.input.keyboard.enabled);assert(!g.keys.RIGHT.isDown);
 g.phase='road';const phase=g.phase;press('F2');assert.equal(g.phase,phase,'test shortcuts must not bypass the normal game');
 g.workshop=true;press('F2');assert.equal(g.phase,'school');
}
console.log('PASS three-outcome day, explicit causes, next mission, report, clean restart and menu key release');
{
 const {g,advance}=createGame();g.begin();g.audio.radioDone=true;g.audio.radioFailed=true;
 advance(5);assert.equal(g.phase,'free','failed speech must leave reading time');
 advance(10.1);assert.equal(g.phase,'receive');
}
console.log('PASS failed speech preserves the 15-second text fallback before assignment');
// Exercise the actual menu handlers against a tiny DOM, without browser state injection.
class Node {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.hidden=false;this.value='';this.checked=false;this.attrs={};this.textContent='';}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 setAttribute(k,v){this.attrs[k]=v;}
 focus(){} matches(selector){return selector.split(',').includes(this.tagName.toLowerCase());}
}
const nodes=Object.fromEntries(['player-panel','player-toolbar','player-help','radio-caption','game','loading'].map(id=>[id,new Node()]));
const storage=new Map(),listeners={};
const doc={getElementById:id=>nodes[id],createElement:tag=>new Node(tag),addEventListener:(type,fn)=>listeners[type]=fn};
const ctx={document:doc,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}};
vm.createContext(ctx);
vm.runInContext(ts(fs.readFileSync('src/player-experience.ts','utf8').replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\r?\n/gm,'').replace(/export /g,'')+'\nglobalThis.api={installPlayerExperience,contextualHelp,resultLine};'),ctx);
const all=(node)=>[node,...node.children.filter(n=>n instanceof Node).flatMap(all)];
const find=(text)=>all(nodes['player-panel']).find(n=>n.tagName==='BUTTON'&&n.textContent===text);
const {g,advance}=createGame();g.audio.effectsVolume=1;g.audio.voiceVolume=1;
g.syncPlayerUI=ctx.api.installPlayerExperience(g);
assert(find('Prendre le service'));assert(g.playerMenu);
find('Réglages').onclick();const sliders=all(nodes['player-panel']).filter(n=>n.type==='range');
sliders[0].value='35';sliders[0].oninput();sliders[1].value='0';sliders[1].oninput();
assert.equal(g.audio.effectsVolume,.35);assert.equal(g.audio.voiceVolume,0);assert.equal(JSON.parse(storage.get('technoprof-player-options')).effects,.35);
assert.equal(sliders.length,3);sliders[2].value='20';sliders[2].oninput();
assert.equal(g.audio.ambienceVolume,.2);assert.equal(JSON.parse(storage.get('technoprof-player-options')).ambience,.2);
find('Retour').onclick();find('Prendre le service').onclick();assert.equal(g.phase,'free');assert(!g.playerMenu);
assert(nodes['radio-caption'].textContent.includes('postes vacants'));assert(!nodes['radio-caption'].hidden);
g.phase='receive';g.syncPlayerUI();assert(nodes['radio-caption'].hidden);assert(nodes['player-help'].textContent.includes('même chronomètre'));
g.setPaused(true);const timer=g.remaining;advance(1);assert.equal(g.remaining,timer);
find('Commandes').onclick();const event=key=>({key,repeat:false,target:new Node(),preventDefault(){},stopImmediatePropagation(){}});
listeners.keydown(event('Escape'));assert(find('Reprendre'));
listeners.keydown(event('m'));assert(g.audio.muted);assert(JSON.parse(storage.get('technoprof-player-options')).muted);
listeners.keydown(event('m'));assert(!g.audio.muted);
listeners.keydown(event('p'));assert(!g.paused);assert(!g.playerMenu);assert(g.input.keyboard.enabled);
g.phase='report';g.won=2;g.results=['COURS ASSURE','PANNE DU VEHICULE','COURS ASSURE'];g.syncPlayerUI();
assert(all(nodes['player-panel']).some(n=>n.textContent==='Maintien en poste'));
assert.equal(all(nodes['player-panel']).filter(n=>n.tagName==='LI').length,3);
find('Nouvelle journée').onclick();assert.equal(g.mission,0);assert.equal(g.results.length,0);
g.phase='school';g.room=1;g.encounterTime=8;g.roomEnteredAt=g.session.elapsed;assert.equal(ctx.api.contextualHelp(g),'','do not compete with first dialogue');
g.phase='course';g.age=1.5;assert(ctx.api.contextualHelp(g).includes('Une touche'));
console.log('PASS real menu actions, persisted separate volumes, captions, help priority, Escape/back, pause/resume and report relaunch');
// No remote voice is selected; audio gain applies the user's effects volume.
const speech=[],gain=[],audioCtx={speechSynthesis:{getVoices:()=>[{lang:'fr-FR',localService:false}],speak:u=>speech.push(u),cancel(){},pause(){},resume(){}},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}}};
vm.createContext(audioCtx);vm.runInContext(ts(require('./audio-harness.cjs').source)+';globalThis.AudioKit=AudioKit;',audioCtx);
const kit=new audioCtx.AudioKit();kit.context={currentTime:0};kit.master={gain:{setTargetAtTime:v=>gain.push(v)}};
kit.radio('Bulletin',true);assert.equal(speech.length,0);
audioCtx.speechSynthesis.getVoices=()=>[{lang:'fr-FR',localService:true}];kit.voiceVolume=.5;kit.radio('Bulletin',true);
assert.equal(speech.length,1);assert.equal(speech[0].volume,.225);speech[0].onerror();assert(kit.radioFailed);
kit.effectsVolume=.4;kit.previous='title';kit.scene('title',false,0,0);assert(Math.abs(gain.at(-1)-.28)<1e-8);
kit.scene('title',true,0,0);assert.equal(gain.at(-1),0);
console.log('PASS local voice only, speech error fallback and independent effects gain/mute on pause');
