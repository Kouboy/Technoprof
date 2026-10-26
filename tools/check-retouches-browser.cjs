// Native renders and sample playback. Scene probe is read-only; actions use keys/pad.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, ".."),
  dist = path.join(root, "dist"),
  out = path.join(root, "work/checkpoints/retouches-1");
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.resolve(
    dist,
    decodeURIComponent(new URL(req.url, "http://local").pathname).slice(1) ||
      "index.html",
  );
  if (
    !file.startsWith(dist + path.sep) ||
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
      ".json": "application/json",
    }[path.extname(file)] || "application/octet-stream",
  );
  if (file.endsWith(".js")) {
    const source = fs.readFileSync(file, "utf8"),
      marker = /this\.runtime\.mark\((['"`])ready\1\)/g;
    assert.equal([...source.matchAll(marker)].length, 1);
    res.end(
      source.replace(marker, (m) => m + ",globalThis.__retoucheScene=this"),
    );
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
      const context = await browser.newContext({
        viewport: { width: 1000, height: 800 },
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
        await page.waitForFunction(() => !!window.__retoucheScene);
        await page.evaluate(() => {
          window.__sounds = [];
          const audio = __retoucheScene.audio,
            play = audio.play.bind(audio);
          audio.play = (...args) => {
            window.__sounds.push(args);
            return play(...args);
          };
        });
        await page
          .getByRole("button", { name: "Rejouer", exact: true })
          .click();
        if (await page.evaluate(() => __retoucheScene.paused))
          await page
            .getByRole("button", { name: "Pause / reprendre", exact: true })
            .click();
        await page.locator("#game").focus();
      };
      const pad = async (buttons) =>
        page.evaluate((buttons) => {
          window.__pads = [
            {
              index: 0,
              connected: true,
              mapping: "standard",
              axes: [0, 0],
              buttons: Array.from({ length: 17 }, (_, i) => ({
                pressed: buttons.includes(i),
                value: buttons.includes(i) ? 1 : 0,
              })),
            },
          ];
        }, buttons);
      const press = async (b) => {
        await pad([b]);
        await page.waitForTimeout(100);
        await pad([]);
        await page.waitForTimeout(100);
      };
      const waitScene = async (condition) => {
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            await page.waitForFunction(condition, null, { timeout: 8000 });
            return;
          } catch (error) {
            const state = await page.evaluate(() => ({
              room: __retoucheScene.room,
              phase: __retoucheScene.phase,
              paused: __retoucheScene.paused,
              reason: __retoucheScene.pauseReason,
              px: __retoucheScene.px,
              recovery: __retoucheScene.recoveryScene.state,
              transition: __retoucheScene.roomTransition,
            }));
            console.log(name + " wait state", state);
            if (
              !state.paused ||
              !/INTERRUPTION LONGUE|FOCUS|FENETRE/.test(state.reason)
            )
              throw error;
            await page
              .getByRole("button", { name: "Pause / reprendre", exact: true })
              .click();
          }
        }
        throw new Error("too many protected long-frame pauses");
      };
      await load("bruel-navigation-a3-view-107");
      await page.waitForFunction(
        () => __retoucheScene.recoveryScene.state === "dialogue",
      );
      await press(2);
      const actors = await page.evaluate(() => ({
        teacher: __retoucheScene.art.teacher.displayHeight,
        nurse: __retoucheScene.navigationArt.nurse.displayHeight,
        teacherY: __retoucheScene.art.teacher.y,
        nurseY: __retoucheScene.navigationArt.nurse.y,
        clock: __retoucheScene.remaining,
      }));
      assert(actors.teacher > 97 && actors.teacher < 105);
      assert.equal(actors.nurse, 99);
      assert.equal(actors.teacherY, actors.nurseY);
      await page
        .locator("#game canvas")
        .screenshot({ path: path.join(out, `${name}-infirmerie.png`) });
      await pad([2]);
      await page.waitForTimeout(350);
      const held = await page.evaluate(() => ({
        page: __retoucheScene.recoveryScene.dialogue.page,
        clock: __retoucheScene.remaining,
      }));
      await page.waitForTimeout(350);
      assert.equal(
        await page.evaluate(() => __retoucheScene.recoveryScene.dialogue.page),
        held.page,
        "held X cannot chain pages",
      );
      assert.equal(held.clock, actors.clock, "care suspends timer");
      await pad([]);
      await page.waitForTimeout(100);
      for (
        let i = 0;
        i < 8 &&
        (await page.evaluate(
          () => __retoucheScene.recoveryScene.state === "dialogue",
        ));
        i++
      )
        await press(i % 2 ? 1 : 2);
      console.log(
        name + " after care dialogue",
        await page.evaluate(() => ({
          room: __retoucheScene.room,
          state: __retoucheScene.recoveryScene.state,
          page: __retoucheScene.recoveryScene.dialogue.page,
          chars: __retoucheScene.recoveryScene.dialogue.characters,
          paused: __retoucheScene.paused,
          reason: __retoucheScene.pauseReason,
        })),
      );
      await waitScene(
        () => __retoucheScene.room === 108 && !__retoucheScene.roomTransition,
      );
      const exit = await page.evaluate(() => ({
        scale: __retoucheScene.art.teacher.scaleY,
        hp: __retoucheScene.hp,
        sounds: window.__sounds
          .filter((a) => ["handle", "door-passage"].includes(a[0]))
          .map((a) => a[0]),
      }));
      assert.equal(exit.scale, 0.18, "corridor scale restored");
      assert.equal(exit.hp, 5);
      assert(exit.sounds.includes("door-passage"));
      await load("bruel-navigation-a3-view-103");
      await page.waitForTimeout(400);
      await page.keyboard.press("ArrowDown", { delay: 100 });
      await waitScene(
        () => __retoucheScene.room === 102 && !__retoucheScene.roomTransition,
      );
      assert(
        await page.evaluate(() =>
          window.__sounds.some((a) => a[0] === "stairs"),
        ),
      );
      await load("bruel-navigation-a3-view-105");
      await page.waitForTimeout(400);
      await page.keyboard.down("ArrowLeft");
      await waitScene(() => __retoucheScene.room !== 105);
      await page.keyboard.up("ArrowLeft");
      await page.waitForTimeout(250);
      assert(
        await page.evaluate(() =>
          window.__sounds.some(
            (a) => a[0] === "step-wood" && a[4] === "movement",
          ),
        ),
      );
      await load("sequence-class-a3");
      await waitScene(
        () => __retoucheScene.phase === "course" && __retoucheScene.age > 0.4,
      );
      await page
        .locator("#game canvas")
        .screenshot({ path: path.join(out, `${name}-cours.png`) });
      await press(2);
      await waitScene(() => __retoucheScene.phase === "later");
      await page.keyboard.press("p", { delay: 100 });
      await page
        .locator("#game canvas")
        .screenshot({ path: path.join(out, `${name}-ellipse.png`) });
      await page.setViewportSize({ width: 390, height: 844 });
      // Resize returns before Phaser's next render; capture the completed frame.
      await page.waitForTimeout(250);
      await page
        .locator("#game canvas")
        .screenshot({ path: path.join(out, `${name}-ellipse-mobile.png`) });
      assert.deepEqual(errors, []);
      reports.push({
        name,
        actors,
        exit,
        stairs: true,
        woodPassage: true,
        xDialogue: true,
        xCourse: true,
        errors,
      });
      console.log(
        "PASS " +
          name +
          ": nurse/teacher scale, X/B dialogue, care clock/heal/exit scale, three native passage samples, bitmap course/ellipse, phone layout",
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
