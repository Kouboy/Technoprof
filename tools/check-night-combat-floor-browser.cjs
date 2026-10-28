// Read-only scene probe; gameplay and declared presets use native UI/keys.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, ".."),
  dist = path.join(root, "dist"),
  out = path.join(root, "work/checkpoints/night-combat-floors");
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const rel =
    decodeURIComponent(new URL(req.url, "http://local").pathname).slice(1) ||
    "index.html";
  const base = rel.startsWith("audio/") ? root : dist,
    file = path.resolve(base, rel);
  if (
    !file.startsWith(base + path.sep) ||
    !fs.existsSync(file) ||
    !fs.statSync(file).isFile()
  )
    return res.writeHead(404).end();
  res.setHeader(
    "Content-Type",
    {
      ".html": "text/html;charset=utf-8",
      ".js": "text/javascript",
      ".wav": "audio/wav",
      ".png": "image/png",
    }[path.extname(file)] || "application/octet-stream",
  );
  if (file.endsWith(".js")) {
    const code = fs.readFileSync(file, "utf8"),
      marker = /this\.runtime\.mark\((['"`])ready\1\)/g;
    assert.equal([...code.matchAll(marker)].length, 1);
    res.end(code.replace(marker, (m) => m + ",globalThis.__floorQA=this"));
  } else fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const reports = [];
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({
          viewport: { width: 1100, height: 900 },
        }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.setDefaultTimeout(90000);
      await page.goto(`http://127.0.0.1:${server.address().port}/?essai=labo&scenario=home-return&musique=essai`);
      await page.waitForFunction(() => !!window.__floorQA);
      for (const [scenario, room] of [
        ["home-return", null],
        ["bruel-navigation-a3-view-111", 111],
        ["inshape-navigation-i2-view-308", 308],
      ]) {
        if(room) await page.getByRole('combobox',{name:'Scénario',exact:true}).selectOption(scenario);
        await page.bringToFront();
        await page.locator('#game').focus();
        await page.waitForTimeout(180);
        if(await page.evaluate(()=>__floorQA.paused)){
          await page.getByRole('button',{name:'Pause / reprendre',exact:true}).click();
          await page.locator('#game').focus();
        }
        if (room) {
          assert.equal(await page.evaluate(() => __floorQA.room), room);
          assert.deepEqual(await page.evaluate(() => __floorQA.floorGaps()), [
            [126, 156],
          ]);
          for (
            let i = 0;
            i < 12 && (await page.evaluate(() => __floorQA.encounterTime > 0));
            i++
          )
            await page.keyboard.press("f", { delay: 90 });
          if (room === 111) {
            await page.waitForFunction(
              () => __floorQA.enemies[0]?.floorLift >= 10,
              null,
              { timeout: 8000 },
            ).catch(async error=>{
              console.error(await page.evaluate(()=>({phase:__floorQA.phase,paused:__floorQA.paused,reason:__floorQA.pauseReason,encounter:__floorQA.encounterTime,room:__floorQA.room,px:__floorQA.px,enemies:__floorQA.enemies,focus:document.activeElement?.id})));
              await page.screenshot({path:path.join(out,name+'-debug.png')});throw error;
            });
            const state = await page.evaluate(() => ({
              hp: __floorQA.enemies[0].hp,
              lift: __floorQA.enemies[0].floorLift,
            }));
            assert.equal(state.hp, 6);
            assert(state.lift >= 10);
          }
        } else {
          await page.waitForFunction(()=>__floorQA.returnFade===0);
          await page.waitForFunction(
            () => __floorQA.roadArt?.skylineLights?.visible,
          );
          const state = await page.evaluate(() => ({
            phase: __floorQA.phase,
            mission: __floorQA.roadArt.mission,
            windows: __floorQA.roadArt.images.filter(
              (i) => i.visible && i.texture.key.includes("road-windows"),
            ).length,
            lamps: __floorQA.roadArt.lightImages.filter((i) => i.visible)
              .length,
          }));
          assert.equal(state.phase, "home");
          assert.equal(state.mission, 3);
          assert(state.windows > 0);
          assert(state.lamps > 0);
        }
        await page
          .locator("#game")
          .screenshot({ path: path.join(out, name + "-" + scenario + ".png") });
      }
      assert.deepEqual(errors, []);
      reports.push({
        browser: name,
        errors,
        homeLights: true,
        holes: [111, 308],
        visibleEnemyStep: true,
      });
      console.log(
        "PASS " +
          name +
          ": actual night skyline/windows/lamps, two rendered combat holes and live boss step, no JS errors",
      );
    } finally {
      await browser.close();
    }
  }
  fs.writeFileSync(
    path.join(out, "report.json"),
    JSON.stringify(reports, null, 2),
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => server.close());
