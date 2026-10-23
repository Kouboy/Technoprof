const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,firefox}=require('C:/Users/don_n/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js');
const directory='audio/complements-2026-10-23';
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(directory+'/manifest.json','utf8')),report=[];
 for(const [name,engine] of Object.entries({chromium,firefox})){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({offline:true,viewport:{width:1050,height:950}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file:///C:/Users/don_n/Documents/Codex/Technoprof/'+directory+'/Ecouter-Complements-Technoprof.html');
   assert.equal(await page.locator('audio').count(),7);assert.equal(await page.locator('article').count(),7);assert.equal(await page.locator('a[download]').count(),14);
   await page.locator('audio').evaluateAll(as=>as.forEach(a=>a.muted=true));
   for(let i=0;i<7;i++){
    const audio=page.locator('audio').nth(i);await audio.scrollIntoViewIfNeeded();const box=await audio.boundingBox();await page.mouse.click(box.x+18,box.y+box.height/2);
    await page.waitForFunction(i=>{const a=document.querySelectorAll('audio')[i];return !a.paused&&a.currentTime>.08&&!a.error},i);
    const states=await page.locator('audio').evaluateAll(as=>as.map(a=>({duration:a.duration,paused:a.paused,loop:a.loop,error:a.error?.code})));
    assert.equal(states.filter(a=>!a.paused).length,1);assert(states.every(a=>!a.error));
    assert(Math.abs(states[i].duration-manifest.tracks[i].seconds)<.01);assert.equal(states[i].loop,manifest.tracks[i].loop);
    await audio.evaluate(a=>a.currentTime=a.duration-.12);
    if(manifest.tracks[i].loop){
     await page.waitForFunction(i=>{const a=document.querySelectorAll('audio')[i];return !a.paused&&a.currentTime<1.5},i);
    }else{
     await page.waitForFunction(i=>document.querySelectorAll('audio')[i].ended,i);
     await page.waitForTimeout(250);assert(await audio.evaluate(a=>a.paused&&a.ended&&!a.loop),'game over stays ended');
    }
   }
   await page.getByRole('button',{name:'Tout arrêter',exact:true}).click();assert(await page.locator('audio').evaluateAll(as=>as.every(a=>a.paused&&a.currentTime===0)));
   for(const size of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(size);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
   assert.deepEqual(errors,[]);report.push({browser:name,offline:true,played:7,oneAtATime:true,sixActualLoopWraps:true,gameOverEndsOnce:true,stopAndReset:true,mobileWidths:true,errors});await context.close();
  }finally{await browser.close();}
 }
 fs.writeFileSync(directory+'/browser-verification.json',JSON.stringify(report,null,2)+'\n');console.log(report);
})().catch(e=>{console.error(e);process.exitCode=1;});
