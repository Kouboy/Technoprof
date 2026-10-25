// Native rendering/audio from authored workshop scenarios. Read-only scene probe.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, ".."),
  dist = path.join(root, "dist"),
  out = path.join(root, "work/checkpoints/flow-native");
fs.mkdirSync(out, { recursive: true });
let instrumented;
const server = http.createServer((req, res) => {
  const relative =
    decodeURIComponent(new URL(req.url, "http://local").pathname).slice(1) ||
    "index.html";
  const base = relative.startsWith("audio/") ? root : dist,
    file = path.resolve(base, relative);
  if (
    !file.startsWith(base + path.sep) ||
    !fs.existsSync(file) ||
    !fs.statSync(file).isFile()
  )
    return res.writeHead(404).end();
  const type =
    {
      ".html": "text/html;charset=utf-8",
      ".js": "text/javascript",
      ".wav": "audio/wav",
      ".png": "image/png",
    }[path.extname(file)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  if (file.endsWith(".js")) {
    if (!instrumented) {
      const source = fs.readFileSync(file, "utf8"),
        marker = /this\.runtime\.mark\((['"`])ready\1\)/g;
      assert.equal([...source.matchAll(marker)].length, 1);
      instrumented = source.replace(
        marker,
        (m) => m + ",globalThis.__flowScene=this",
      );
    }
    res.end(instrumented);
  } else fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/`,
    reports = [];
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    if (process.argv.includes("--chrome-only") && name !== "chromium") continue;
    if (process.argv.includes("--firefox-only") && name !== "firefox") continue;
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({
          viewport: { width: 1100, height: 900 },
        }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.setDefaultTimeout(90000);
      const load = async (scenario) => {
        await page.goto(
          base + `?essai=labo&scenario=${scenario}&musique=essai`,
        );
        await page.waitForFunction(() => !!window.__flowScene);
        await page
          .getByRole("button", { name: "Rejouer", exact: true })
          .click();
        if (await page.evaluate(() => __flowScene.paused))
          await page
            .getByRole("button", { name: "Pause / reprendre", exact: true })
            .click();
        await page.locator("#game").focus();
      };
      if (name === "chromium" && !process.argv.includes("--ending-only")) {
        for (const scenario of [
          "hanouna-navigation-h1-boss",
          "bruel-navigation-a3-parent",
          "inshape-navigation-i2-boss",
        ]) {
          await load(scenario);
          await page.waitForTimeout(600);
          for (
            let n = 0;
            n < 12 &&
            (await page.evaluate(() => __flowScene.encounterTime > 0));
            n++
          )
            await page.keyboard.press("f", { delay: 90 });
          await page.waitForFunction(() => __flowScene.encounterTime === 0);
          const hp = await page.evaluate(() => {
            const e = __flowScene.enemies.find((e) => e.boss);
            return { hp: e.hp, max: e.maxHp };
          });
          assert(hp.max >= hp.hp && hp.max > 0);
          await page
            .locator("#game canvas")
            .screenshot({ path: path.join(out, scenario + ".png") });
        }
      }
      await load("cinematic-ending");
      await page.waitForFunction(
        () => __flowScene.cinematicAudio?.time() > 0.1,
      );
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await page.waitForFunction(
            () => __flowScene.cinematic?.index === 13 || __flowScene.paused,
          );
        } catch (error) {
          console.error(
            await page.evaluate(() => ({
              phase: __flowScene.phase,
              paused: __flowScene.paused,
              reason: __flowScene.pauseReason,
              index: __flowScene.cinematic?.index,
              elapsed: __flowScene.cinematic?.elapsed,
              audio: __flowScene.cinematicAudio.players?.map((p) => ({
                time: p.currentTime,
                ended: p.ended,
                paused: p.paused,
                error: p.error?.code,
              })),
            })),
          );
          throw error;
        }
        const state = await page.evaluate(() => ({
          last: __flowScene.cinematic?.index === 13,
          reason: __flowScene.pauseReason,
        }));
        if (state.last) break;
        assert(
          ["INTERRUPTION LONGUE", "FENETRE INACTIVE"].includes(state.reason),
          JSON.stringify(state),
        );
        console.log(name + " native load/stall pause resumed: " + state.reason);
        await page.bringToFront();
        await page
          .getByRole("button", { name: "Pause / reprendre", exact: true })
          .click();
      }
      await page
        .locator("#game canvas")
        .screenshot({ path: path.join(out, name + "-last.png") });
      try {
        await page.waitForFunction(
          () => __flowScene.endingFade !== null,
          null,
          { timeout: 15000 },
        );
      } catch (error) {
        console.error(
          await page.evaluate(() => ({
            phase: __flowScene.phase,
            paused: __flowScene.paused,
            reason: __flowScene.pauseReason,
            fade: __flowScene.endingFade,
            elapsed: __flowScene.cinematic?.elapsed,
            total: __flowScene.cinematic?.totalSeconds,
            audio: __flowScene.cinematicAudio.players?.map((p) => ({
              time: p.currentTime,
              ended: p.ended,
              paused: p.paused,
              error: p.error?.code,
            })),
          })),
        );
        throw error;
      }
      const end = await page.evaluate(() => ({
        music: __flowScene.cinematicAudio.players[0].currentTime,
        ended: __flowScene.cinematicAudio.players[0].ended,
        cue: __flowScene.cinematicAudio.players[1].currentTime,
        cueEnded: __flowScene.cinematicAudio.players[1].ended,
      }));
      assert(
        end.ended && end.cueEnded,
        "fade begins after both native tracks have ended",
      );
      const fadeStart = Date.now();
      await page.waitForFunction(
        () => __flowScene.endingFade > 1.2 && __flowScene.endingFade < 2.3,
      );
      await page
        .locator("#game canvas")
        .screenshot({ path: path.join(out, name + "-fade.png") });
      let pausedStable = true;
      if (name === "firefox") {
        await page
          .getByRole("button", { name: "Pause / reprendre", exact: true })
          .click();
        const age = await page.evaluate(() => __flowScene.endingFade);
        await page.waitForTimeout(500);
        pausedStable = await page.evaluate(
          (age) => __flowScene.endingFade === age,
          age,
        );
        assert(pausedStable);
        await page
          .getByRole("button", { name: "Pause / reprendre", exact: true })
          .click();
      }
      await page.waitForFunction(() => __flowScene.phase === "title");
      const elapsed = (Date.now() - fadeStart) / 1000;
      assert(elapsed >= 2.8 && elapsed < 8, "three-second fade");
      await page.waitForFunction(
        () =>
          __flowScene.music.current === "title" &&
          !__flowScene.music.player.paused &&
          __flowScene.music.player.currentTime > 0.1,
      );
      await page
        .locator("#game canvas")
        .screenshot({ path: path.join(out, name + "-title.png") });
      assert.equal(await page.evaluate(() => __flowScene.cinematic), null);
      assert.deepEqual(errors, []);
      reports.push({
        browser: name,
        lastImage: true,
        soundtrackEnd: end,
        fadeWallSeconds: elapsed,
        pausedStable,
        automaticTitleMusic: true,
        errors,
      });
      console.log(
        "PASS " +
          name +
          ": real soundtrack -> last-image 3s fade -> title music, pause and no report",
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
