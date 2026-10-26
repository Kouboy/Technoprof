// Native visual QA; scene probe is read-only. All gameplay actions use real UI/keys.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, ".."),
  dist = path.join(root, "dist"),
  out = path.join(root, "work/checkpoints/profile-counter");
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
    const src = fs.readFileSync(file, "utf8"),
      marker = /this\.runtime\.mark\((['"`])ready\1\)/g;
    assert.equal([...src.matchAll(marker)].length, 1);
    res.end(src.replace(marker, (m) => m + ",globalThis.__profileScene=this"));
  } else fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const reports = [];
  for (const [name, engine] of [
    ["chrome", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({
          viewport: { width: 1000, height: 800 },
        }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.setDefaultTimeout(90000);
      const load = async (scenario) => {
        await page.goto(
          `http://127.0.0.1:${server.address().port}/?essai=labo&scenario=${scenario}&musique=essai`,
        );
        await page.waitForFunction(() => !!window.__profileScene);
        await page
          .getByRole("button", { name: "Rejouer", exact: true })
          .click();
        if (await page.evaluate(() => __profileScene.paused))
          await page
            .getByRole("button", { name: "Pause / reprendre", exact: true })
            .click();
        await page.locator("#game").focus();
      };
      const wait = async (condition) => {
        for (let n = 0; n < 4; n++)
          try {
            await page.waitForFunction(condition, null, { timeout: 12000 });
            return;
          } catch (e) {
            const paused = await page.evaluate(
              () =>
                __profileScene.paused &&
                __profileScene.pauseReason === "INTERRUPTION LONGUE",
            );
            if (!paused) {
              console.log(
                await page.evaluate(() => ({
                  phase: __profileScene.phase,
                  room: __profileScene.room,
                  paused: __profileScene.paused,
                  reason: __profileScene.pauseReason,
                  dialogue: __profileScene.dialogue,
                  encounter: __profileScene.encounterTime,
                  schoolFade: __profileScene.schoolFade,
                })),
              );
              throw e;
            }
            await page
              .getByRole("button", { name: "Pause / reprendre", exact: true })
              .click();
          }
        throw Error("repeated frame interruption");
      };
      const shot = async (file) =>
        page
          .locator("#game canvas")
          .screenshot({ path: path.join(out, name + "-" + file + ".png") });
      await load("lives-road-first");
      await wait(() => __profileScene.age > 2.1);
      await page.keyboard.press("f", { delay: 100 });
      await wait(
        () => __profileScene.phase === "lifeLost" && __profileScene.age > 0.9,
      );
      await shot("perte-2");
      assert.equal(
        await page.evaluate(() => __profileScene.livesArt.face.frame.name),
        "life-head",
      );
      assert.equal(
        await page.evaluate(() => __profileScene.livesArt.face.displayWidth),
        42,
      );
      await wait(
        () => __profileScene.phase === "free" && __profileScene.returnFade <= 0,
      );
      await shot("hud-route");
      const head = await page.evaluate(() => {
        const s = __profileScene,
          a = s.livesArt,
          rgba = s.textures
            .get("life-profile")
            .getSourceImage()
            .getContext("2d")
            .getImageData(0, 0, 94, 99).data;
        let clear = 0,
          magenta = 0;
        for (let i = 0; i < rgba.length; i += 4) {
          if (rgba[i + 3] === 0) clear++;
          else if (
            rgba[i] > 110 &&
            rgba[i + 2] > 100 &&
            rgba[i] > rgba[i + 1] * 1.6 &&
            rgba[i + 2] > rgba[i + 1] * 1.6
          )
            magenta++;
        }
        return {
          key: a.face.texture.key,
          frame: a.face.frame.name,
          width: a.face.displayWidth,
          height: a.face.displayHeight,
          x: a.face.x,
          y: a.face.y,
          clear,
          magenta,
        };
      });
      assert.deepEqual(
        [head.key, head.frame, head.width, head.height],
        ["life-profile", "life-head", 14, 15],
      );
      assert(head.clear > 100);
      assert.equal(head.magenta, 0);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(250);
      await shot("hud-mobile");
      await page.setViewportSize({ width: 1000, height: 800 });
      await load("inshape-navigation-i2-boss");
      await page.waitForTimeout(500);
      for (
        let n = 0;
        n < 16 && (await page.evaluate(() => __profileScene.encounterTime > 0));
        n++
      ) {
        await page.keyboard.press("f", { delay: 110 });
        await page.waitForTimeout(120);
      }
      await wait(() => __profileScene.encounterTime === 0);
      await page.waitForTimeout(400);
      await page
        .getByRole("button", { name: "Pause / reprendre", exact: true })
        .click();
      await shot("boss");
      assert(
        await page.evaluate(() =>
          __profileScene.enemies.some((e) => e.boss && e.role === "security"),
        ),
      );
      assert.deepEqual(errors, []);
      reports.push({ name, head, loss: true, boss: true, errors });
      console.log(
        "PASS " +
          name +
          ": real transparent profile, smaller unboxed HUD, central decrement, mobile scale and final boss render",
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
