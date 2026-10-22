// Native renderer comparison of the two generated standalone deliveries.
// A temporary, in-memory probe exposes the scene after ready; shipped files
// are never rewritten. Direct state fixtures test art, not human playability.
const fs = require('node:fs'), http = require('node:http');
const assert = require('node:assert/strict');
const { chromium, firefox } = require(process.argv[2] || 'playwright');
const engine = process.argv[3] === 'firefox' ? firefox : chromium;
if (process.argv[3] && !['chromium','firefox'].includes(process.argv[3])) throw Error('Unknown browser');
const output = 'work/checkpoints/day-assets/' + (process.argv[3] || 'chromium');
fs.mkdirSync(output, { recursive: true });
const files = { '/full': 'Jouer-Technoprof.html', '/day': 'Jouer-Technoprof-Journee-Atelier.html' };
const documents = {};
for (const [route, file] of Object.entries(files)) {
  const html = fs.readFileSync(file, 'utf8'), marker = /this\.runtime\.mark\((["'`])ready\1\)/g;
  assert.equal([...html.matchAll(marker)].length, 1, 'exactly one ready probe in ' + file);
  documents[route] = html.replace(marker, match => match + ',globalThis.__qaScene=this');
}
const server = http.createServer((req, res) => {
  const document = documents[new URL(req.url, 'http://localhost').pathname];
  res.writeHead(document ? 200 : 404, { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(document || 'Not found');
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  const report = { browser: process.argv[3] || 'chromium', builds: {}, identicalViews: [], mismatches: [] };
  const references = new Map();
  try {
    browser = await engine.launch({ headless: true });
    for (const profile of ['full', 'day']) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 1 });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (/Texture.*(not found|missing)|Frame.*not found/i.test(m.text())) errors.push(m.text()); });
      await page.goto(origin + '/' + profile + (profile === 'day' ? '?essai=labo&scenario=service' : '?essai=journee'), { timeout: 120000, waitUntil: 'networkidle' });
      await page.waitForFunction(() => !!globalThis.__qaScene, null, { timeout: 120000 });
      assert(await page.evaluate(() => __qaScene.phase === 'title' && __qaScene.validatedDay && !__qaScene.workshop), 'day URL must start the player flow');
      if (profile === 'day') assert(await page.evaluate(() =>
        !document.body.classList.contains('lab') && !document.getElementById('player-feedback').hidden &&
        ['developer-controls','developer-links','legacy-tests','pose-controls'].every(id => document.getElementById(id).hidden)
      ), 'day DOM must ignore workshop URL options and preserve player feedback');
      // Exercise the genuine entry button before deterministic visual fixtures.
      await page.getByRole('button', { name: 'Prendre le service', exact: true }).click();
      assert(await page.evaluate(() => __qaScene.phase === 'free' && __qaScene.validatedDay), 'player starts cruising');
      // Freeze simulation without opening the player pause menu, which correctly
      // hides the canvas. Native rendering continues on the normal engine loop.
      await page.evaluate(() => { __qaScene.sys.sceneUpdate = () => {}; });
      const inventory = await page.evaluate(() => {
        const g = __qaScene, entries = Object.entries(g.textures.list).map(([key, texture]) => {
          const source = texture.getSourceImage();
          return { key, width: source.width || 0, height: source.height || 0 };
        });
        return { textures: entries, rgbaBytes: entries.reduce((sum, e) => sum + e.width * e.height * 4, 0), startup: g.runtime.snapshot() };
      });
      report.builds[profile] = { ...inventory, errors };
      const screenshot = async name => {
        const timing = () => page.evaluate(() => [__qaScene.age, __qaScene.ambienceClock, __qaScene.road, __qaScene.dialogue.characters]);
        const before = await timing();
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        // Capture the framebuffer, not the CSS-scaled canvas rectangle: menu
        // layout can leave the DOM element on fractional screen coordinates.
        const capture = await page.evaluate(() => new Promise((resolve, reject) => {
          __qaScene.game.renderer.snapshot(async image => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = image.width; canvas.height = image.height;
              const context = canvas.getContext('2d');
              context.drawImage(image, 0, 0);
              const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
              const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', pixels)), n => n.toString(16).padStart(2, '0')).join('');
              resolve({ uri: image.src, hash });
            } catch (error) { reject(error); }
          });
        }));
        const png = Buffer.from(capture.uri.split(',')[1], 'base64');
        assert.deepEqual(await timing(), before, 'visual fixture must not tick between snapshots');
        if (profile === 'full') { references.set(name, { png, hash: capture.hash }); return; }
        if (references.get(name).hash === capture.hash) report.identicalViews.push(name);
        else {
          report.mismatches.push(name);
          fs.writeFileSync(output + '/full-' + name + '.png', references.get(name).png);
          fs.writeFileSync(output + '/day-' + name + '.png', png);
        }
      };
      for (let mission = 0; mission < 3; mission++) {
        const rooms = await page.evaluate(mission => {
          const g = __qaScene;
          g.validatedDay = true; g.seed = 4301; g.mission = mission; g.begin();
          g.notified = true; g.school(); g.setPlayerMenu(false);
          g.paused = false; g.pauseReason = ''; g.returnFade = 0; g.schoolFade = 0;
          return Object.keys(g.navigationSpec().rooms).map(Number);
        }, mission);
        for (const room of rooms) {
          await page.evaluate(room => {
            const g = __qaScene;
            g.enterRoom(room, 92); g.phase = 'school'; g.remaining = 123; g.hp = 4;
            g.schoolFade = 0; g.returnFade = 0; g.ambienceClock = 0.5; g.walkClock = 0;
            g.age = 0.5; g.bossIntro = 0; g.dialogue.characters = 12;
            g.draw();
          }, room);
          await screenshot('room-' + room);
        }
        await page.evaluate(() => {
          const g = __qaScene;
          const boss = Object.values(g.navigationSpec().rooms).find(room => room.boss);
          g.enterRoom(boss.id, 270); g.recoveryScene.reset(); g.phase = 'opening';
          for (const enemy of g.enemies) enemy.hp = 0;
          g.cleared.add(g.room); g.openingFrom = 270; g.encounterTime = 0;
          g.age = 1.05; g.schoolFade = 0; g.returnFade = 0; g.draw();
        });
        await screenshot('class-' + mission);
        await page.evaluate(() => {
          const g = __qaScene;
          g.phase = 'road'; g.recoveryScene.reset(); g.road = 1100; g.speed = 180;
          g.age = 0.5; g.ambienceClock = 0.5; g.encounterTime = 0; g.draw();
        });
        await screenshot('road-' + mission);
        await page.evaluate(() => {
          const g = __qaScene; g.phase = 'arrival'; g.age = 3.8; g.draw();
        });
        await screenshot('arrival-' + mission);
      }
      assert.deepEqual(errors, [], profile + ' native renderer errors');
      await page.close();
    }
    const old = ['corridor', 'hall', 'wing-34', 'bridge-33', 'quiet-backgrounds', 'service-stair', 'technical', 'central-stair', 'annex-stair', 'courtyard'];
    const keys = new Set(report.builds.day.textures.map(t => t.key));
    for (const key of old) assert(!keys.has(key), 'day still decodes ' + key);
    for (const key of ['prof', 'inspectrice', 'parent', 'student-34', 'guard-33', 'bruel-backgrounds', 'pro-backgrounds', 'infirmary-nurse'])
      assert(keys.has(key), 'shared texture absent: ' + key);
    assert(report.builds.day.rgbaBytes < report.builds.full.rgbaBytes, 'decoded textures must shrink');
    // Launch the unmodified deliverable directly from disk with networking off.
    const offline = await browser.newContext({ offline: true });
    const local = await offline.newPage(), localErrors = [];
    local.on('pageerror', e => localErrors.push(e.message));
    await local.goto(require('node:url').pathToFileURL(require('node:path').resolve(files['/day'])).href, { waitUntil: 'load', timeout: 120000 });
    await local.getByRole('button', { name: 'Prendre le service', exact: true }).waitFor({ timeout: 120000 });
    await local.getByRole('button', { name: 'Prendre le service', exact: true }).click();
    await local.waitForTimeout(200);
    assert(!await local.locator('#player-feedback').evaluate(element => element.hidden));
    assert.deepEqual(localErrors, [], 'unmodified offline file launch');
    report.offlineFileLaunch = true;
    await offline.close();
    fs.writeFileSync('work/reports/performance/day-assets-' + report.browser + '.json', JSON.stringify(report, null, 2));
    assert.deepEqual(report.mismatches, [], 'visual differences saved in ' + output);
    console.log('PASS ' + report.identicalViews.length + ' identical native views; decoded RGBA ' + report.builds.full.rgbaBytes + ' -> ' + report.builds.day.rgbaBytes);
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
