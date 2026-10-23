// Native UI / actual exported game. No injected gameplay state.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium,firefox}=require('C:/Users/don_n/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js');
const offline=process.argv.includes('--offline');
const base=offline?pathToFileURL(require('node:path').resolve('Jouer-Technoprof-Atelier-Gamefeel.html')).href:'http://127.0.0.1:4173/?essai=labo&scenario=gamefeel-reference-encounter';
fs.mkdirSync('work/checkpoints',{recursive:true});
(async()=>{
 const results=[];
 for(const [name,engine] of Object.entries({chromium,firefox})){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1300,height:1000},offline,hasTouch:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base,{waitUntil:'load',timeout:120000});
   await page.waitForSelector('#loading[hidden]',{state:'attached',timeout:120000});
   const variant=page.getByLabel('Variante de tolérance',{exact:true});
   const station=page.getByLabel('Situation gamefeel',{exact:true});
   const status=page.getByLabel('État de la simulation',{exact:true});
   await variant.waitFor();assert.equal(await variant.inputValue(),'reference');
   assert.match(await status.textContent(),/pièce 201/);
   await variant.selectOption('tolerant');
   await page.waitForFunction(()=>document.querySelector('[aria-label="État de la simulation"]').textContent.includes('COMPARAISON B'));
   await station.selectOption('gaps');
   await page.waitForFunction(()=>document.querySelector('[aria-label="État de la simulation"]').textContent.includes('pièce 317'));
   // Real tap while playing: inputs consumed in pause intentionally do not queue.
   await page.keyboard.press('Space');
   await page.waitForFunction(()=>document.querySelector('[aria-label="État de la simulation"]').textContent.includes('jump → accepted'));
   await page.getByRole('button',{name:'Un pas (20 ms)',exact:true}).click();
   const downloadPromise=page.waitForEvent('download');
   await page.getByRole('button',{name:'Exporter le journal',exact:true}).click();
   const download=await downloadPromise;
   const dest=`work/checkpoints/gamefeel-${name}-${offline?'offline':'dev'}.json`;
   await download.saveAs(dest);const journal=JSON.parse(fs.readFileSync(dest,'utf8'));
   assert.equal(journal.gamefeel.variant,'tolerant');assert.equal(journal.gamefeel.station,'gaps');
   assert.equal(journal.gamefeel.tuning.jumpBuffer,.09);
   assert(journal.events.some(e=>e.kind==='control'&&e.data.outcome==='accepted'));
   await page.getByRole('button',{name:'Rejouer',exact:true}).click();
   await page.waitForFunction(()=>!document.querySelector('[aria-label="État de la simulation"]').textContent.includes('jump → accepted'));
   await variant.selectOption('reference');
   await station.selectOption('parent');
   await page.waitForFunction(()=>document.querySelector('[aria-label="État de la simulation"]').textContent.includes('pièce 111'));
   await page.screenshot({path:`work/checkpoints/gamefeel-lab-${name}-${offline?'offline':'dev'}.png`,fullPage:true});
   await page.getByLabel('Scénario',{exact:true}).selectOption('journee-validee');
   await page.waitForFunction(()=>document.querySelector('[aria-label="Variante de tolérance"]').closest('div').hidden);
   assert(!(await status.textContent()).includes('COMPARAISON'));
   assert.deepEqual(errors,[]);results.push({name,offline,nativeAB:true,threeStations:true,keyboardTrace:true,download:true,cleanReplay:true,normalDay:true,errors});
   await context.close();
  }finally{await browser.close();}
 }
 fs.writeFileSync(`work/checkpoints/gamefeel-browser-${offline?'offline':'dev'}.json`,JSON.stringify(results,null,2));
 console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exitCode=1;});
