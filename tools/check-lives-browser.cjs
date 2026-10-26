// Read-only probe, native presentation/audio; commands use keyboard, pad or touch.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, ".."),
  dist = path.join(root, "dist"),
  out = path.join(root, "work/checkpoints/three-lives");
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const rel =
      decodeURIComponent(new URL(req.url, "http://local").pathname).slice(1) ||
      "index.html",
    base = rel.startsWith("audio/") ? root : dist,
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
    const source = fs.readFileSync(file, "utf8"),
      marker = /this\.runtime\.mark\((['"`])ready\1\)/g;
    assert.equal([...source.matchAll(marker)].length, 1);
    res.end(source.replace(marker, (m) => m + ",globalThis.__lifeScene=this"));
  } else fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const reports = [];
  for (const [name, engine] of [
    ["chrome", chromium],
    ["firefox", firefox],
  ]) {
    if(process.argv.includes('--firefox-only') && name!=='firefox')continue;
    if(process.argv.includes('--chrome-only') && name!=='chrome')continue;
    const browser = await engine.launch({ headless: true });
    try {
      const context = await browser.newContext({
        viewport: { width: 1000, height: 800 },
        hasTouch: true,
      });
      await context.addInitScript(() => {
        window.__pads = [];
        Object.defineProperty(navigator, "getGamepads", {
          value: () => window.__pads,
        });
      });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.setDefaultTimeout(90000);
      const load = async (scenario) => {
        await page.goto(
          `http://127.0.0.1:${server.address().port}/?essai=labo&scenario=${scenario}&musique=essai`,
        );
        await page.waitForFunction(() => !!window.__lifeScene);
        await page.evaluate(() => {
          window.__sounds = [];
          const a = __lifeScene.audio,
            p = a.play.bind(a);
          a.play = (...v) => {
            window.__sounds.push(v);
            return p(...v);
          };
        });
        await page
          .getByRole("button", { name: "Rejouer", exact: true })
          .click();
        if (await page.evaluate(() => __lifeScene.paused))
          await page
            .getByRole("button", { name: "Pause / reprendre", exact: true })
            .click();
        await page.locator("#game").focus();
      };
      const wait = async (condition) => {
        for (let n = 0; n < 5; n++)
          try {
            await page.waitForFunction(condition, null, { timeout: 20000 });
            return;
          } catch (e) {
            const s = await page.evaluate(() => ({
              phase: __lifeScene.phase,
              age: __lifeScene.age,
              paused: __lifeScene.paused,
              reason: __lifeScene.pauseReason,
            }));
            console.log(name, s);
            if (!s.paused || !/INTERRUPTION LONGUE|FENETRE/.test(s.reason))
              throw e;
            await page
              .getByRole("button", { name: "Pause / reprendre", exact: true })
              .click();
          }
        throw Error("repeated long-frame pauses");
      };
      const snap = async (file) =>
        page
          .locator("#game canvas")
          .screenshot({ path: path.join(out, name + "-" + file + ".png") });
      const pad = async (button) => {
        await page.evaluate((b) => {
          window.__pads = [
            {
              index: 0,
              connected: true,
              mapping: "standard",
              axes: [0, 0],
              buttons: Array.from({ length: 17 }, (_, i) => ({
                pressed: i === b,
                value: i === b ? 1 : 0,
              })),
            },
          ];
        }, button);
        await page.waitForTimeout(120);
        await page.evaluate(() =>
          window.__pads[0].buttons.forEach((b) => {
            b.pressed = false;
            b.value = 0;
          }),
        );
        await page.waitForTimeout(100);
      };
      await load("lives-road-first");
      await pad(-1); // connected controller at rest before any transition/input
      assert.equal(await page.evaluate(() => __lifeScene.lives), 2);
      await wait(() => __lifeScene.phase === "lifeLost"); // real one-shot Game Over theme ends
      await snap("perte-3");
      await wait(() => __lifeScene.age > 1 && __lifeScene.phase === "lifeLost");
      await snap("perte-2");
      await pad(9);
      assert(
        await page.evaluate(() => __lifeScene.paused),
        "Start pauses the loss card",
      );
      const frozen = await page.evaluate(() => __lifeScene.age);
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => __lifeScene.age), frozen);
      await pad(9);
      await wait(() => __lifeScene.phase === "free");
      const retry = await page.evaluate(() => ({
        mission: __lifeScene.mission,
        won: __lifeScene.won,
        lives: __lifeScene.lives,
        hp: __lifeScene.hp,
        car: __lifeScene.vehicle,
        timer: __lifeScene.remaining,
        notified: __lifeScene.notified,
      }));
      assert.deepEqual(retry, {
        mission: 0,
        won: 0,
        lives: 2,
        hp: 5,
        car: 100,
        timer: 180,
        notified: false,
      });
      await snap("hud-2");
      await load("lives-foot-second");
      await pad(-1);
      await wait(() => __lifeScene.age > 2.1);
      // Touch is deliberately exercised on a school defeat, including stale fade cleanup.
      const box = await page.locator("#game canvas").boundingBox();
      await page.touchscreen.tap(
        box.x + box.width * 0.5,
        box.y + box.height * 0.4,
      );
      await wait(() => __lifeScene.phase === "lifeLost");
      await wait(() => __lifeScene.phase === "free");
      assert.equal(await page.evaluate(() => __lifeScene.mission), 1);
      assert.equal(await page.evaluate(() => __lifeScene.won), 1);
      assert.equal(await page.evaluate(() => __lifeScene.remaining), 195);
      await load("lives-final");
      await pad(-1);
      await wait(() => __lifeScene.age > 2.1);
      await pad(2);
      await wait(() => __lifeScene.phase === "lifeLost" && __lifeScene.age > 1);
      await snap("perte-0");
      await wait(() => __lifeScene.phase === "radiated" && __lifeScene.age > 1);
      await snap("radie");
      assert.equal(await page.evaluate(() => __lifeScene.lives), 0);
      assert.equal(
        await page.evaluate(
          () => window.__sounds.filter((v) => v[0] === "stamp").length,
        ),
        1,
      );
      await page.getByRole("button", {name:"Pause / reprendre",exact:true}).click();
      assert(await page.evaluate(()=>__lifeScene.paused),'pause freezes radiation');
      const age = await page.evaluate(() => __lifeScene.age);
      await page.waitForTimeout(250);
      assert.equal(await page.evaluate(() => __lifeScene.age), age);
      await page
        .getByRole("button", { name: "Pause / reprendre", exact: true })
        .click();
      await page.waitForTimeout(100);
      assert.equal(
        await page.evaluate(
          () => window.__sounds.filter((v) => v[0] === "stamp").length,
        ),
        1,
        "no duplicate stamp on resume",
      );
      await wait(() => __lifeScene.phase === "title");
      assert.equal(await page.evaluate(() => __lifeScene.cinematic), null);
      assert.equal(
        await page.evaluate(() => __lifeScene.music.current),
        "title",
      );
      assert.deepEqual(errors, []);
      reports.push({
        name,
        naturalGameOver: true,
        retry,
        schoolTouchRetry: true,
        thirdPadLoss: true,
        radiation: true,
        pause: true,
        titleMusic: true,
        errors,
      });
      console.log(
        "PASS " +
          name +
          ": native Game Over -> 3/2 counter -> restored road, school touch retry retaining success, pad X last life -> 0/RADIE, pause/stamp once and automatic title/music",
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
