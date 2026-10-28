// Standard gamepad API simulated in real browsers. No physical-device claim.
// The in-memory scene probe is read-only; gameplay uses controller inputs only.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, ".."),
  dist = path.join(root, "dist"),
  out = path.join(root, "work/checkpoints/gamepad");
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
  const types = {
    ".html": "text/html;charset=utf-8",
    ".js": "text/javascript",
    ".wav": "audio/wav",
    ".png": "image/png",
    ".json": "application/json",
  };
  res.writeHead(200, {
    "Content-Type": types[path.extname(file)] || "application/octet-stream",
  });
  if (file.endsWith(".js")) {
    let source = fs.readFileSync(file, "utf8");
    const marker = /this\.runtime\.mark\((['"`])ready\1\)/g;
    assert.equal(
      [...source.matchAll(marker)].length,
      1,
      "read-only ready probe",
    );
    source = source.replace(
      marker,
      (match) => match + ",globalThis.__padScene=this",
    );
    res.end(source);
  } else fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/`,
    report = [];
  for (const [name, engine] of [
    ["chromium", chromium],
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
          configurable: true,
        });
      });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(base);
      await page.waitForFunction(() => !!window.__padScene, null, {
        timeout: 90000,
      });
      await page.waitForTimeout(400);
      const snapshot = async (buttons = [], axes = [0, 0], values = {}) => {
        await page.evaluate(
          ({ buttons, axes, values }) => {
            window.__pads = [
              {
                index: 0,
                connected: true,
                mapping: "standard",
                axes,
                buttons: Array.from({ length: 17 }, (_, i) => ({
                  pressed: buttons.includes(i),
                  value: values[i] ?? (buttons.includes(i) ? 1 : 0),
                })),
              },
            ];
          },
          { buttons, axes, values },
        );
      };
      const press = async (button) => {
        await snapshot([button]);
        await page.waitForTimeout(90);
        await snapshot();
        await page.waitForTimeout(90);
      };
      await snapshot([9]);
      await page.waitForTimeout(400);
      assert.equal(
        await page.evaluate(() => __padScene.phase),
        "intro",
        "Start starts without mouse",
      );
      assert(
        await page.evaluate(() => __padScene.cinematic !== null),
        "holding Start cannot skip",
      );
      const audio = await page.evaluate(() => ({
        blocked: __padScene.cinematicAudio.blocked,
        elapsed: __padScene.cinematic.elapsed,
      }));
      console.log(
        name + " audio at controller start: " + JSON.stringify(audio),
      );
      await page.waitForFunction(
        () => __padScene.cinematic?.elapsed > 0.5,
        null,
        { timeout: 15000 },
      );
      await snapshot();
      await page.waitForTimeout(90);
      await press(9);
      assert.equal(
        await page.evaluate(() => __padScene.phase),
        "free",
        "fresh Start skips intro",
      );
      const before = await page.evaluate(() => __padScene.speed);
      await snapshot([7]);
      await page.waitForTimeout(900);
      const accelerated = await page.evaluate(() => __padScene.speed);
      assert(accelerated > before);
      await snapshot([6]);
      await page.waitForTimeout(400);
      assert((await page.evaluate(() => __padScene.speed)) < accelerated - 15);
      for (const button of [1, 2]) {
        const slow = await page.evaluate(() => __padScene.speed);
        await snapshot([0]);
        await page.waitForTimeout(650);
        const fast = await page.evaluate(() => __padScene.speed);
        assert(fast > slow, "held A accelerates in the real browser");
        await snapshot([button]);
        await page.waitForTimeout(350);
        assert(
          (await page.evaluate(() => __padScene.speed)) < fast - 10,
          "held B/X brakes in the real browser",
        );
      }
      await snapshot();
      await press(9);
      assert(await page.evaluate(() => __padScene.paused));
      await page.waitForTimeout(200);
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Reprendre",
        "controller focus starts on resume",
      );
      await press(13);
      await press(13);
      await press(0);
      assert.equal(
        await page.getByRole("slider").count(),
        4,
        "controller reaches settings",
      );
      const volume = await page.evaluate(() =>
        Number(document.activeElement.value),
      );
      await press(14);
      assert.equal(
        await page.evaluate(() => Number(document.activeElement.value)),
        Math.max(0, volume - 5),
      );
      await press(1);
      assert(
        await page
          .getByRole("button", { name: "Reprendre", exact: true })
          .isVisible(),
      );
      await press(9);
      assert(!(await page.evaluate(() => __padScene.paused)));
      await page.evaluate(() => (window.__pads = []));
      await page.waitForTimeout(100);
      assert(await page.evaluate(() => __padScene.paused));
      assert(
        (await page.locator("#player-panel").innerText()).includes(
          "Manette déconnectée",
        ),
      );
      await snapshot();
      await page.waitForTimeout(100);
      await press(9);
      assert(!(await page.evaluate(() => __padScene.paused)));
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(100);
      await page.keyboard.up("ArrowRight");
      assert(
        !(await page.evaluate(() => __padScene.gamepadMode)),
        "keyboard takes over",
      );
      await page.evaluate(() => (window.__pads = []));
      await page.waitForTimeout(100);
      assert(
        !(await page.evaluate(() => __padScene.paused)),
        "idle pad cannot interrupt a keyboard run",
      );
      await page.screenshot({ path: path.join(out, name + ".png") });
      assert.deepEqual(errors, []);
      report.push({
        browser: name,
        input: "simulated standard mapping",
        audioAtControllerStart: audio,
        title: true,
        filmSkip: true,
        drive: true,
        menus: true,
        disconnect: true,
        keyboard: true,
        errors,
      });
      console.log(
        "PASS " +
          name +
          " standard pad: title, movie, RT/LT + held A/B/X pedals, pause, menus/range, reconnect and keyboard",
      );
    } finally {
      await browser.close();
    }
  }
  fs.writeFileSync(
    path.join(out, "report.json"),
    JSON.stringify(report, null, 2),
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => server.close());
