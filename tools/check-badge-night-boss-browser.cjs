// Full game observation through authored workshop scenarios and native keys.
// The injected probe is read-only; all state transitions use existing controls.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, ".."),
  dist = path.join(root, "dist"),
  out = path.join(root, "work/checkpoints/badge-night-boss");
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
    }[path.extname(file)] || "application/octet-stream",
  );
  if (file.endsWith(".js")) {
    const code = fs.readFileSync(file, "utf8"),
      marker = /this\.runtime\.mark\((['"`])ready\1\)/g;
    assert.equal([...code.matchAll(marker)].length, 1);
    res.end(code.replace(marker, (m) => m + ",globalThis.__artQA=this"));
  } else fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
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
      page.setDefaultTimeout(100000);
      await page.goto(
        `http://127.0.0.1:${server.address().port}/?essai=labo&scenario=home-return&musique=essai`,
      );
      await page.waitForFunction(() => !!window.__artQA);
      const resume = async () => {
        if (await page.evaluate(() => __artQA.paused))
          await page
            .getByRole("button", { name: "Pause / reprendre", exact: true })
            .click();
        await page.locator("#game").focus();
      };
      await resume();
      await page.waitForFunction(
        () =>
          __artQA.returnFade === 0 && __artQA.roadArt?.skylineLights?.visible,
      );
      await page
        .locator("#game")
        .screenshot({ path: path.join(out, `${name}-home.png`) });
      const home = await page.evaluate(() => ({
        phase: __artQA.phase,
        mission: __artQA.mission,
        cityLights: __artQA.roadArt.skylineLights.visible,
      }));
      assert.equal(home.phase, "home");
      assert.equal(home.mission, 3);
      assert(home.cityLights);
      const select = async (scenario) => {
        await page
          .getByRole("combobox", { name: "Scénario", exact: true })
          .selectOption(scenario);
        await page.waitForTimeout(200);
        await resume();
      };
      await select("inshape-navigation-i2-boss");
      for (
        let i = 0;
        i < 24 && (await page.evaluate(() => __artQA.encounterTime > 0));
        i++
      ) {
        await resume();
        await page.keyboard.press("f", { delay: 95 });
        // Input sampling must observe release before another action edge.
        await page.waitForTimeout(100);
      }
      await page
        .waitForFunction(
          () => __artQA.newSchoolArt.enemy.texture.key === "pro-pose-1",
          {},
          { timeout: 12000 },
        )
        .catch(async (error) => {
          console.error(
            await page.evaluate(() => ({
              phase: __artQA.phase,
              paused: __artQA.paused,
              reason: __artQA.pauseReason,
              room: __artQA.room,
              encounter: __artQA.encounterTime,
              px: __artQA.px,
              enemies: __artQA.enemies,
              texture: __artQA.newSchoolArt.enemy.texture.key,
            })),
          );
          await page
            .locator("#game")
            .screenshot({ path: path.join(out, `${name}-boss-debug.png`) });
          throw error;
        });
      const boss = await page.evaluate(() => {
        const image = __artQA.newSchoolArt.enemy,
          c = image.texture.getSourceImage(),
          pixels = c
            .getContext("2d")
            .getImageData(384, 300, c.width - 384, c.height - 300).data;
        let strayAlpha = 0;
        for (let i = 3; i < pixels.length; i += 4)
          strayAlpha = Math.max(strayAlpha, pixels[i]);
        return {
          texture: image.texture.key,
          room: __artQA.room,
          hp: __artQA.enemies[0].hp,
          strayAlpha,
        };
      });
      assert.equal(boss.room, 309);
      assert.equal(boss.strayAlpha, 0);
      assert(boss.hp > 0);
      await page
        .locator("#game")
        .screenshot({ path: path.join(out, `${name}-boss-windup.png`) });
      await select("cinematic-ending");
      // A native button gesture starts the real soundtrack; no seeking or clock writes.
      await page.getByRole("button", { name: "Rejouer", exact: true }).click();
      await resume();
      const started = Date.now();
      while (
        !(await page.evaluate(
          () => __artQA.cinematic?.panel?.id === "badge-handover",
        ))
      ) {
        if (Date.now() - started > 90000)
          throw Error("Badge vignette did not arrive at its normal time");
        await page.waitForTimeout(700);
        await resume();
      }
      await page.waitForTimeout(300);
      const badge = await page.evaluate(() => ({
        id: __artQA.cinematic.panel.id,
        elapsed: __artQA.cinematic.elapsed,
        texture: __artQA.cinematicArt.image.texture.key,
        total: __artQA.cinematic.totalSeconds,
      }));
      assert.equal(badge.texture, "cinematic-badge");
      assert.equal(badge.total, 69);
      assert(badge.elapsed >= 50 && badge.elapsed < 56);
      await page
        .locator("#game")
        .screenshot({ path: path.join(out, `${name}-badge.png`) });
      assert.deepEqual(errors, []);
      reports.push({ browser: name, home, boss, badge, errors });
      console.log(
        "PASS full game",
        name,
        JSON.stringify({ home, boss, badge }),
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
