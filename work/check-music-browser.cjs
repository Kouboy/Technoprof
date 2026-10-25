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
const media=page=>page.evaluate(()=>window.__musicAudio.filter(a=>/\/(maquettes|titre-reference|complements)-2026-10-23\//.test(a.src)).map(a=>({src:a.src,paused:a.paused,time:a.currentTime,volume:a.volume,error:a.error?.code})));
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
   await playing(page,'Technoprof-Titre-Interpretation.wav');assert.equal((await media(page))[0].volume,.9,'foreground title volume');
   const slider=page.getByRole('slider',{name:'Musique',exact:true});await slider.focus();await page.keyboard.press('Home');for(let i=0;i<25;i++)await page.keyboard.press('ArrowRight');assert.equal(await slider.inputValue(),'25');
   await page.waitForFunction(()=>window.__musicAudio.some(a=>a.src.endsWith('Technoprof-Titre-Interpretation.wav')&&a.volume===.45));
   await page.getByRole('button',{name:/Couper le son/}).click();await page.waitForFunction(()=>window.__musicAudio.every(a=>a.paused));const titleOffset=(await media(page))[0].time;
   await page.getByRole('button',{name:/Activer le son/}).click();await playing(page,'Technoprof-Titre-Interpretation.wav');assert((await media(page))[0].time>=titleOffset);
   await page.getByRole('button',{name:'Retour',exact:true}).click();await page.locator('#game').focus();await page.keyboard.press('Enter');
   await page.waitForTimeout(400);assert((await media(page)).every(a=>a.paused&&a.time===0),'title stops before the bulletin');
   const introSkip=page.getByRole('button',{name:/^Passer (la cinématique|l’introduction)$/});if(await introSkip.isVisible())await introSkip.click();
   await page.waitForFunction(()=>window.__musicAudio.some(a=>a.src.endsWith('02-autoradio.wav')),{},{timeout:35000});
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
   const extra=[['bruel-navigation-a3-road','10-autoradio-midi.wav'],['road-dusk-fast','11-autoradio-soir.wav'],
    ['hanouna-navigation-h1-boss','06-boss-inspectrice.wav'],['bruel-navigation-a3-parent','07-boss-parent.wav'],['inshape-navigation-i2-boss','08-boss-securite.wav']];
   for(const [scenario,file] of extra){await page.getByRole('combobox',{name:'Scénario',exact:true}).selectOption(scenario);await page.getByRole('button',{name:'Rejouer',exact:true}).click();await playing(page,file);}
   console.log('PASS native route and boss selections: '+name);
   // Enter care through a real passage, advance the nurse dialogue, and return.
   await page.getByRole('combobox',{name:'Scénario',exact:true}).selectOption('hanouna-navigation-h1-view-206');await page.getByRole('button',{name:'Rejouer',exact:true}).click();await playing(page,'03-ormeaux.wav');
   await page.waitForFunction(()=>window.__musicAudio.some(a=>a.src.endsWith('03-ormeaux.wav')&&a.currentTime>3));const schoolOffset=(await media(page))[0].time;
   await page.keyboard.down('ArrowRight');await page.waitForTimeout(1450);await page.keyboard.up('ArrowRight');await page.keyboard.press('ArrowUp',{delay:100});
   await playing(page,'09-infirmerie.wav');
   await page.waitForFunction(()=>document.querySelector('[aria-label="État de la simulation"]').textContent.includes('INFIRMERIE / dialogue'));
   for(let i=0;i<6;i++){await page.keyboard.press('f',{delay:100});await page.waitForTimeout(180);}
   await playing(page,'03-ormeaux.wav');assert((await media(page))[0].time>=schoolOffset,'actual care exit resumes the school offset');
   console.log('PASS native care dialogue and offset return: '+name);
   for(const scenario of ['arrival','sequence-class-h1']){
    await page.getByRole('combobox',{name:'Scénario',exact:true}).selectOption(scenario);await page.waitForFunction(()=>window.__musicAudio.every(a=>a.paused));
   }
   await page.getByRole('combobox',{name:'Scénario',exact:true}).selectOption('sequence-fail-foot');await page.getByRole('button',{name:'Pause / reprendre',exact:true}).click();await playing(page,'12-gameover.wav');
   assert(await page.evaluate(()=>window.__musicAudio.filter(a=>a.src.endsWith('12-gameover.wav')).every(a=>!a.loop)));
   await page.evaluate(()=>{const a=window.__musicAudio.find(a=>a.src.endsWith('12-gameover.wav'));a.currentTime=a.duration-.12});
   await page.waitForFunction(()=>window.__musicAudio.some(a=>a.src.endsWith('12-gameover.wav')&&a.ended));await page.waitForTimeout(600);
   assert(await page.evaluate(()=>window.__musicAudio.filter(a=>a.src.endsWith('12-gameover.wav')).every(a=>a.ended&&a.paused)),'game over stays ended across live frames');
   assert((await media(page)).every(a=>!a.error));assert.deepEqual(errors,[]);
   report.push({browser:name,offline:true,normalHasNoMusic:true,trialFourSliders:true,titleForegroundGain:true,titleMenuPlayback:true,titleMuteResume:true,titleStopsBeforeBulletin:true,radioAfterBulletin:true,volume:true,pauseResume:true,muteResume:true,twelveActualFilesPlayed:true,careActualEntryDialogueExit:true,schoolOffsetRestored:true,arrivalAndClassSilent:true,gameOverEndsOnce:true,errors});
   console.log('PASS native local musical trial: '+name);await context.close();
  }finally{await browser.close();}
 }
 fs.writeFileSync('audio/complements-2026-10-23/flow-browser-verification.json',JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
