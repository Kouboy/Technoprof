// Real local builds and inputs. No writing gameplay state from the browser.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'work/checkpoints');
const file=name=>pathToFileURL(path.join(root,name)).href;
async function main(){
 const reports=[];
 for(const [name,engine] of Object.entries({chromium,firefox})){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({offline:true,viewport:{width:1100,height:1000}}),errors=[];
   let page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));
   await page.goto(file('Jouer-Technoprof-Journee-Musique.html'));
   await page.getByRole('button',{name:'Prendre le service',exact:true}).click();
   const seq=()=>page.locator('#game').getAttribute('data-sequence');
   await page.waitForFunction(()=>document.querySelector('#game').getAttribute('data-sequence')==='intro:0');
   const skip=page.getByRole('button',{name:'Passer la cinématique',exact:true});await skip.waitFor();
   assert.equal(await page.getByRole('button',{name:'Continuer',exact:true}).count(),0);
   await page.waitForTimeout(600);
   if(await page.getByRole('button',{name:'Reprendre',exact:true}).isVisible())await page.getByRole('button',{name:'Reprendre',exact:true}).click();
   await page.locator('#game canvas').screenshot({path:path.join(out,`cinematic-${name}-intro-0.png`)});
   assert(await page.locator('#radio-caption').isHidden());assert(await page.locator('#dialogue-caption').isHidden());
   await page.getByRole('button',{name:'Pause / aide',exact:true}).click();await page.waitForTimeout(7000);assert.equal(await seq(),'intro:0');
   await page.getByRole('button',{name:'Reprendre',exact:true}).click();
   await page.locator('#game').focus();await page.keyboard.down('f');await page.waitForTimeout(650);await page.keyboard.down('f');await page.waitForTimeout(200);
   assert.equal(await seq(),'intro:0','held/repeated F cannot advance automatic montage');await page.keyboard.up('f');
   await page.waitForFunction(()=>document.querySelector('#game').getAttribute('data-sequence')==='intro:1');
   await page.locator('#game canvas').screenshot({path:path.join(out,`cinematic-${name}-intro-1.png`)});
   await page.keyboard.press('Enter',{delay:100});assert.equal(await seq(),'intro:1');
   await page.waitForFunction(()=>document.querySelector('#game').getAttribute('data-sequence')==='');
   assert(await skip.isHidden());
   await page.close();
   page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));
   await page.goto(file('Jouer-Technoprof.html')+'?essai=labo&scenario=cinematic-ending&musique=essai');
   await page.getByRole('button',{name:'Rejouer',exact:true}).click();await page.locator('#game').focus();
   const status=page.getByRole('generic',{name:'État de la simulation',exact:true});
   const state=()=>page.locator('[aria-label="État de la simulation"]').innerText();
   await page.waitForFunction(()=>document.querySelector('[aria-label="État de la simulation"]').textContent.includes('image 1/12'));
   await page.waitForTimeout(600);
   if((await state()).startsWith('PAUSE'))await page.getByRole('button',{name:'Pause / reprendre',exact:true}).click();
   for(let i=0;i<12;i++){
    assert((await state()).includes(`image ${i+1}/12`));await page.waitForTimeout(250);
    await page.locator('#game canvas').screenshot({path:path.join(out,`cinematic-${name}-ending-${i}.png`)});
    await page.waitForFunction(index=>{const t=document.querySelector('[aria-label="État de la simulation"]').textContent;return index===11?t.includes('report /'):t.includes(`image ${index+2}/12`);},i);
   }
   assert((await state()).includes('report /'));assert.deepEqual(errors,[]);
   reports.push({browser:name,offline:true,intro:2,ending:12,automatic:true,pausedStable:true,inertActionInput:true,readableScreenshots:true,noCaptions:true,errors});
   console.log('PASS automatic silent montage '+name+': 10/57s sequences, seven-second pause, inert inputs and clean report');
   await context.close();
   if(name==='chromium'){
    const mobile=await browser.newContext({offline:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const p=await mobile.newPage();p.setDefaultTimeout(45000);p.on('pageerror',e=>errors.push(e.message));
    await p.goto(file('Jouer-Technoprof-Journee-Musique.html'));await p.getByRole('button',{name:'Prendre le service',exact:true}).tap();
    await p.getByRole('button',{name:'Passer la cinématique',exact:true}).waitFor();await p.waitForTimeout(650);
    const box=await p.locator('#game canvas').boundingBox(),tap=()=>p.touchscreen.tap(box.x+box.width/2,box.y+box.height*.45);
    await tap();await tap();assert.equal(await p.locator('#game').getAttribute('data-sequence'),'intro:0','touches do not change timing');
    await p.getByRole('button',{name:'Passer la cinématique',exact:true}).tap();
    await p.waitForFunction(()=>document.querySelector('#game').getAttribute('data-sequence')==='');
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]);
    reports.push({browser:'chromium-touch',inertTouch:true,explicitSkip:true,noHorizontalOverflow:true});
    console.log('PASS mobile montage: inert touch, explicit whole-sequence skip and layout');await mobile.close();
   }
  }finally{await browser.close();}
 }
 fs.writeFileSync(path.join(out,'cinematic-browser.json'),JSON.stringify(reports,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
