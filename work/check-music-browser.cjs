// Real local exports and native media; observes audio elements without replacing playback.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,firefox}=require('C:/Users/don_n/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js');
const root='file:///C:/Users/don_n/Documents/Codex/Technoprof/';
async function observe(context){
 await context.addInitScript(()=>{
  window.__musicAudio=[];const create=document.createElement;
  document.createElement=function(tag,...args){const el=create.call(this,tag,...args);if(String(tag).toLowerCase()==='audio')window.__musicAudio.push(el);return el;};
 });
}
async function playing(page,file){
 await page.waitForFunction(file=>window.__musicAudio.some(a=>a.src.endsWith(file)&&!a.paused&&a.currentTime>.08&&!a.error),file,{timeout:35000});
}
const media=page=>page.evaluate(()=>window.__musicAudio.filter(a=>a.src.includes('/maquettes-2026-10-23/')).map(a=>({src:a.src,paused:a.paused,time:a.currentTime,volume:a.volume,error:a.error?.code})));
(async()=>{
 const report=[];
 for(const [name,engine] of Object.entries({chromium,firefox})){
  const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--mute-audio']}:{firefoxUserPrefs:{'media.volume_scale':'0.0'}})});
  try{
   let context=await browser.newContext({offline:true,viewport:{width:1200,height:1000}});await observe(context);
   let page=await context.newPage();page.setDefaultTimeout(45000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(root+'Jouer-Technoprof-Journee-Atelier.html');
   await page.getByRole('button',{name:'Réglages',exact:true}).click();assert.equal(await page.getByRole('slider').count(),3);assert.equal((await media(page)).length,0);
   await context.close();
   context=await browser.newContext({offline:true,viewport:{width:1200,height:1000}});await observe(context);page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));
   await page.goto(root+'Jouer-Technoprof-Journee-Musique.html');
   await page.getByRole('button',{name:'Réglages',exact:true}).click();assert.equal(await page.getByRole('slider').count(),4);
   const slider=page.getByRole('slider',{name:'Musique',exact:true});await slider.focus();await page.keyboard.press('Home');for(let i=0;i<25;i++)await page.keyboard.press('ArrowRight');assert.equal(await slider.inputValue(),'25');
   await page.getByRole('button',{name:'Retour',exact:true}).click();await page.locator('#game').focus();await page.keyboard.press('Enter');
   await page.waitForTimeout(400);assert.equal((await media(page)).length,0,'bulletin has no instrumental');
   await page.waitForFunction(()=>window.__musicAudio.some(a=>a.src.includes('/maquettes-2026-10-23/')),{},{timeout:35000});
   const retry=page.getByRole('button',{name:'Relancer la musique',exact:true});if(await retry.isVisible())await retry.click();
   await playing(page,'02-autoradio.wav');assert.equal((await media(page))[0].volume,.25);
   await page.getByRole('button',{name:'Pause / aide',exact:true}).click();let before=(await media(page))[0];assert(before.paused);await page.waitForTimeout(200);assert.equal((await media(page))[0].time,before.time);
   await page.getByRole('button',{name:'Reprendre',exact:true}).click();await playing(page,'02-autoradio.wav');assert((await media(page))[0].time>=before.time);
   await page.getByRole('button',{name:/Couper le son/}).click();await page.waitForFunction(()=>window.__musicAudio.filter(a=>a.src.includes('/maquettes-2026-10-23/')).every(a=>a.paused));before=(await media(page))[0];
   await page.getByRole('button',{name:/Activer le son/}).click();await playing(page,'02-autoradio.wav');assert((await media(page))[0].time>=before.time);
   await context.close();
   context=await browser.newContext({offline:true,viewport:{width:1200,height:1000}});await observe(context);page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));
   await page.goto(root+'Jouer-Technoprof.html?essai=labo&scenario=road-slow&musique=essai');
   await page.getByRole('button',{name:'Rejouer',exact:true}).click();await playing(page,'02-autoradio.wav');
   const scenarios=[['hanouna-navigation-h1','03-ormeaux.wav'],['bruel-navigation-a3','04-berthelot.wav'],['inshape-navigation-i2','05-trois-ponts.wav']];
   for(const [scenario,file] of scenarios){await page.getByRole('combobox',{name:'Scénario',exact:true}).selectOption(scenario);await page.getByRole('button',{name:'Rejouer',exact:true}).click();await playing(page,file);}
   for(const scenario of ['hanouna-navigation-h1-view-208','arrival','exhausted']){
    await page.getByRole('combobox',{name:'Scénario',exact:true}).selectOption(scenario);await page.waitForFunction(()=>window.__musicAudio.every(a=>a.paused));
   }
   assert((await media(page)).every(a=>!a.error));assert.deepEqual(errors,[]);
   report.push({browser:name,offline:true,normalHasNoMusic:true,trialFourSliders:true,radioAfterBulletin:true,volume:true,pauseResume:true,muteResume:true,fourActualFilesPlayed:true,careArrivalFailureSilent:true,errors});
   console.log('PASS native local musical trial: '+name);await context.close();
  }finally{await browser.close();}
 }
 fs.writeFileSync('audio/maquettes-2026-10-23/trial-browser-verification.json',JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
