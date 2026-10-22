// Verify what the delivered HTML actually sends to speech synthesis. A fake
// local voice makes the payload observable; this does not judge pronunciation.
const assert = require('node:assert/strict');
const path = require('node:path'), { pathToFileURL } = require('node:url');
const { chromium, firefox } = require(process.argv[2] || 'playwright');
const engineName = process.argv[3] || 'chromium';
if (!['chromium','firefox'].includes(engineName)) throw Error('Unknown browser');
(async () => {
  const browser = await ({ chromium, firefox })[engineName].launch({ headless: true });
  try {
    const context = await browser.newContext({ offline: true });
    await context.addInitScript(() => {
      globalThis.__radioEvidence = [];
      class Utterance { constructor(text) { this.text = text; } }
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: Utterance });
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
        getVoices: () => [{name:'Isolated QA voice',lang:'fr-FR',localService:true}],
        speak: u => __radioEvidence.push({text:u.text,lang:u.lang}),
        cancel() {}, pause() {}, resume() {},
      }});
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve('Jouer-Technoprof-Journee-Atelier.html')).href, {waitUntil:'load',timeout:120000});
    await page.getByRole('button',{name:'Prendre le service',exact:true}).waitFor({timeout:120000});
    await page.getByRole('button',{name:'Prendre le service',exact:true}).click();
    await page.waitForFunction(() => __radioEvidence.length > 0, null, {timeout:15000});
    const spoken = await page.evaluate(() => __radioEvidence);
    assert.equal(spoken.length,1);
    assert(spoken[0].text.startsWith('Radio Éduc France. La rentrée est prête'));
    assert.equal(spoken[0].lang,'fr-FR');
    assert(!/idiotie/i.test(spoken[0].text));
    assert((await page.locator('#radio-caption').textContent()).startsWith("Radio Educ' France — "));
    assert.deepEqual(errors, []);
    console.log('PASS '+engineName+' offline day: actual speech payload '+JSON.stringify(spoken[0])+'; correct caption, no JS error');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
