const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,firefox}=require('C:/Users/don_n/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js');
(async()=>{
 const report=[];
 for(const [name,engine] of Object.entries({chromium,firefox})){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({offline:true,viewport:{width:1050,height:950}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file:///C:/Users/don_n/Documents/Codex/Technoprof/audio/titre-reference-2026-10-23/Ecouter-Titre-Interpretation.html');
   assert.equal(await page.locator('audio').count(),1);assert.equal(await page.locator('tbody tr').count(),6);assert.equal(await page.locator('a[download]').count(),2);
   const audio=page.locator('audio');await audio.evaluate(a=>a.muted=true);const box=await audio.boundingBox();await page.mouse.click(box.x+18,box.y+box.height/2);
   await page.waitForFunction(()=>{const a=document.querySelector('audio');return a.currentTime>.1&&!a.error});
   assert.equal(await audio.evaluate(a=>a.duration),60);
   await audio.evaluate(a=>a.currentTime=a.duration-.12);await page.waitForFunction(()=>{const a=document.querySelector('audio');return !a.paused&&a.currentTime<1.5;});
   await page.getByRole('checkbox',{name:'Écouter en boucle'}).uncheck();assert.equal(await audio.evaluate(a=>a.loop),false);
   await page.getByRole('button',{name:'Arrêter',exact:true}).click();assert(await audio.evaluate(a=>a.paused&&a.currentTime===0));
   for(const size of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(size);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
   assert.deepEqual(errors,[]);report.push({browser:name,offline:true,nativePlay:true,duration:60,actualLoopWrap:true,toggleAndStop:true,mobileWidths:true,errors});await context.close();
  }finally{await browser.close();}
 }
 fs.writeFileSync('audio/titre-reference-2026-10-23/browser-verification.json',JSON.stringify(report,null,2)+'\n');console.log(report);
})().catch(e=>{console.error(e);process.exitCode=1;});
