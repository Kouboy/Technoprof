// Real local exported game: native media and normal workshop controls only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE);
const root=path.resolve(__dirname,'..'),out=path.join(root,'work/checkpoints');
const file=name=>pathToFileURL(path.join(root,name)).href;
const state=p=>p.locator('[aria-label="État de la simulation"]').innerText();
const waitPhase=(p,phase)=>p.waitForFunction(phase=>document.querySelector('[aria-label="État de la simulation"]')?.textContent.includes(phase+' /'),phase,{timeout:180000});
const player=p=>p.evaluate(()=>window.__musicAudio.filter(a=>a.src.includes('/retour-maison-2026-10-25/')).map(a=>({time:a.currentTime,paused:a.paused,volume:a.volume,error:a.error?.code,loop:a.loop}))[0]);
async function watch(context){await context.addInitScript(()=>{window.__musicAudio=[];const create=document.createElement;document.createElement=function(tag,...args){const el=create.call(this,tag,...args);if(String(tag).toLowerCase()==='audio')window.__musicAudio.push(el);return el}})}
async function running(p){if((await state(p)).startsWith('PAUSE'))await p.getByRole('button',{name:'Pause / reprendre',exact:true}).click();await p.locator('#game').focus()}
(async()=>{const report=[];
 for(const [name,engine] of Object.entries({chromium,firefox})){
  const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--mute-audio']}:{firefoxUserPrefs:{'media.volume_scale':'0.0'}})});
  try{
   const context=await browser.newContext({offline:true,viewport:{width:1100,height:1000}});await watch(context);
   const p=await context.newPage(),errors=[];p.setDefaultTimeout(45000);p.on('pageerror',e=>errors.push(e.message));
   const scenario=name==='chromium'?'home-return':'home-return-near';
   await p.goto(file('Jouer-Technoprof.html')+'?essai=labo&scenario='+scenario+'&musique=essai');
   await p.getByRole('button',{name:'Rejouer',exact:true}).click();await running(p);await waitPhase(p,'home');
   await p.waitForFunction(()=>window.__musicAudio.some(a=>a.src.includes('/retour-maison-2026-10-25/')&&!a.paused&&a.currentTime>.1&&!a.error));
   assert.equal((await player(p)).loop,true);assert(Math.abs((await player(p)).volume-.5)<.001);
   await p.locator('#game canvas').screenshot({path:path.join(out,'home-'+name+'-night.png')});
   await p.getByRole('button',{name:'Pause / reprendre',exact:true}).click();const paused=await player(p);assert(paused.paused);await p.waitForTimeout(250);assert.equal((await player(p)).time,paused.time);
   await p.getByRole('button',{name:'Pause / reprendre',exact:true}).click();await p.locator('#game').focus();
   await p.keyboard.press('m',{delay:100});await p.waitForFunction(()=>window.__musicAudio.every(a=>a.paused));
   await p.waitForTimeout(180); // Let the physical key release reach the next input sample.
   await p.keyboard.press('m',{delay:100});await p.waitForFunction(()=>window.__musicAudio.some(a=>a.src.includes('/retour-maison-2026-10-25/')&&!a.paused));
   // A held pointer aims at the current lane while accelerating, exactly as a player can.
   const box=await p.locator('#game canvas').boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height*140/240);await p.mouse.down();
   console.log('Native home road running: '+name+' ('+scenario+')');
   await waitPhase(p,'homeArrival');await p.mouse.up();
   const arrivalVolume=(await player(p)).volume;assert(arrivalVolume<=.5,'parking cannot amplify the radio');
   await p.getByRole('button',{name:'Pause / reprendre',exact:true}).click();assert((await player(p)).paused);
   const stopState=await state(p),stopTime=(await player(p)).time;await p.waitForTimeout(300);assert.equal((await player(p)).time,stopTime);assert.equal(await state(p),stopState);
   await p.getByRole('button',{name:'Pause / reprendre',exact:true}).click();await p.locator('#game').focus();
   await p.waitForFunction(()=>{const a=window.__musicAudio.find(a=>a.src.includes('/retour-maison-2026-10-25/'));return a&&a.volume===0});
   assert((await state(p)).includes('homeArrival /'),'black and silence precede ending');
   await p.locator('#game canvas').screenshot({path:path.join(out,'home-'+name+'-black.png')});
   await waitPhase(p,'ending');assert((await player(p)).paused);assert.equal((await player(p)).time,0);
   await p.waitForTimeout(300);await p.locator('#game canvas').screenshot({path:path.join(out,'home-'+name+'-ending.png')});
   assert.deepEqual(errors,[]);report.push({browser:name,offline:true,scenario,nativeMusic:true,pauseMuteResume:true,arrivalPauseStable:true,arrivalVolume,blackBeforeEnding:true,cleanAudioStop:true,errors});
   console.log('PASS '+name+': night, native radio, pause/mute, arrival, black and ending');await context.close();
   if(name==='chromium'){
    const mobile=await browser.newContext({offline:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true});await watch(mobile);
    const q=await mobile.newPage();q.setDefaultTimeout(45000);q.on('pageerror',e=>errors.push(e.message));
    await q.goto(file('Jouer-Technoprof.html')+'?essai=labo&scenario=home-return&musique=essai');await q.getByRole('button',{name:'Rejouer',exact:true}).tap();await running(q);
    const b=await q.locator('#game canvas').boundingBox();await q.touchscreen.tap(b.x+b.width/2,b.y+b.height*.5);
    await q.waitForFunction(()=>window.__musicAudio.some(a=>a.src.includes('/retour-maison-2026-10-25/')&&!a.paused&&a.currentTime>.1));
    await q.locator('#game canvas').screenshot({path:path.join(out,'home-touch.png')});
    assert(await q.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
    report.push({browser:'chromium-touch',nativeMusic:true,noHorizontalOverflow:true,errors:[]});await mobile.close();
   }
  }finally{await browser.close()}
 }
 fs.writeFileSync(path.join(out,'home-browser-verification.json'),JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
