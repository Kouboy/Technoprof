const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http");
const assert = require("node:assert/strict");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, ".."),
  dist = path.join(root, "dist");
const output = path.join(root, "work/checkpoints/window");
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.resolve(
    dist,
    decodeURIComponent(new URL(req.url, "http://localhost").pathname).slice(
      1,
    ) || "index.html",
  );
  if (
    !file.startsWith(dist + path.sep) ||
    !fs.existsSync(file) ||
    !fs.statSync(file).isFile()
  )
    return res.writeHead(404).end();
  const mime = {
    ".html": "text/html;charset=utf-8",
    ".js": "text/javascript",
    ".wav": "audio/wav",
    ".png": "image/png",
    ".json": "application/json",
  };
  res.writeHead(200, {
    "Content-Type": mime[path.extname(file)] || "application/octet-stream",
  });
  fs.createReadStream(file).pipe(res);
});
async function bounds(page) {
  const b = await page.evaluate(() => {
    const shell = document.getElementById("game-shell").getBoundingClientRect();
    const toolbar = document
      .getElementById("player-toolbar")
      .getBoundingClientRect();
    const panel = document
      .getElementById("player-panel")
      .getBoundingClientRect();
    return {
      width: shell.width,
      height: shell.height,
      bottom: shell.bottom,
      toolbarBottom: toolbar.bottom,
      panelBottom: panel.bottom,
      toolbarInMenu: !!document
        .getElementById("player-toolbar")
        .closest("#player-panel"),
      viewport: innerHeight,
      scroll: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      clientWidth: document.documentElement.clientWidth,
      parentStyle: document.getElementById("game").style.cssText,
      parentHeight: getComputedStyle(document.getElementById("game")).height,
      variable: document.body.style.getPropertyValue("--window-game-width"),
    };
  });
  assert(
    Math.abs(b.width / b.height - 4 / 3) < 0.005,
    "4:3 frame " + JSON.stringify(b),
  );
  assert(
    (b.toolbarInMenu ? b.panelBottom : b.toolbarBottom) <= b.viewport + 1,
    "controls visible " + JSON.stringify(b),
  );
  assert(
    b.scroll <= b.viewport + 1 && b.scrollWidth <= b.viewportWidth + 1,
    "no overflow " + JSON.stringify(b),
  );
  assert(
    b.width <= b.clientWidth + 0.1,
    "frame must not widen the mobile layout viewport",
  );
  return b;
}
async function openPause(page) {
  if (
    !(await page
      .getByRole("button", { name: "Reprendre", exact: true })
      .isVisible())
  )
    await page
      .getByRole("button", { name: "Pause / aide", exact: true })
      .click();
}
async function skipFilm(page) {
  await openPause(page);
  await page
    .getByRole("button", { name: "Passer la cinématique", exact: true })
    .click();
}
async function canvasBounds(page) {
  const b = await page.evaluate(() => {
    const frame = document.getElementById("game").getBoundingClientRect();
    const canvas = document
      .querySelector("#game canvas")
      .getBoundingClientRect();
    return {
      frame: { x: frame.x, y: frame.y, w: frame.width, h: frame.height },
      canvas: { x: canvas.x, y: canvas.y, w: canvas.width, h: canvas.height },
    };
  });
  for (const key of ["x", "y", "w", "h"])
    assert(
      Math.abs(b.frame[key] - b.canvas[key]) < 1.1,
      "canvas must fill frame after resizing/captions: " + JSON.stringify(b),
    );
}
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const report = [];
  for (const [name, engine, touch] of [
    ["chromium", chromium, false],
    ["firefox", firefox, false],
    ["touch", chromium, true],
  ]) {
    const browser = await engine.launch({ headless: true });
    try {
      const ctx = await browser.newContext({
        viewport: touch
          ? { width: 390, height: 844 }
          : { width: 1100, height: 950 },
        ...(touch ? { isMobile: true, hasTouch: true } : {}),
      });
      const page = await ctx.newPage(),
        errors = [];
      ctx.on("page", (p) => p.on("pageerror", (e) => errors.push(e.message)));
      page.on("pageerror", (e) => errors.push(e.message));
      const checkMaskWarning = (message) => {
        if (/setMask:.*not supported/.test(message.text()))
          errors.push(message.text());
      };
      page.on("console", checkMaskWarning);
      ctx.on("page", (p) => p.on("console", checkMaskWarning));
      await page.goto(url + (touch ? "?fenetre=1" : ""));
      await page
        .getByRole("button", { name: "Prendre le service", exact: true })
        .waitFor({ timeout: 90000 });
      let game = page;
      if (!touch) {
        await page
          .getByRole("button", { name: "Prendre le service", exact: true })
          .click();
        await skipFilm(page);
        await openPause(page);
        [game] = await Promise.all([
          page.waitForEvent("popup"),
          page
            .getByRole("button", {
              name: "Ouvrir dans une fenêtre",
              exact: true,
            })
            .click(),
        ]);
        await game
          .getByRole("button", { name: "Prendre le service", exact: true })
          .waitFor({ timeout: 90000 });
        assert(game.url().includes("fenetre=1"));
        assert(
          await page
            .getByRole("button", { name: "Reprendre", exact: true })
            .isVisible(),
          "source run is paused before opening",
        );
      }
      const dimensions = [];
      for (const size of touch
        ? [
            { width: 390, height: 844 },
            { width: 844, height: 390 },
          ]
        : [
            { width: 960, height: 800 },
            { width: 1280, height: 720 },
            { width: 1920, height: 1080 },
            { width: 640, height: 700 },
          ]) {
        await game.setViewportSize(size);
        await game.waitForTimeout(250);
        dimensions.push(await bounds(game));
      }
      await game.screenshot({ path: path.join(output, name + "-title.png") });
      await game.getByRole("button", { name: "Réglages", exact: true }).click();
      assert.equal(await game.locator("input[type=range]").count(), 4);
      await bounds(game);
      await game.getByRole("button", { name: "Retour", exact: true }).click();
      await game
        .getByRole("button", { name: "Prendre le service", exact: true })
        .click();
      await skipFilm(game);
      await game.waitForTimeout(400);
      await game
        .getByRole("button", { name: "Pause / aide", exact: true })
        .click();
      await bounds(game);
      await game
        .getByRole("button", { name: "Reprendre", exact: true })
        .click();
      await game.waitForTimeout(300);
      await bounds(game);
      await canvasBounds(game);
      // The live caption area changes height independently from the window.
      await game.setViewportSize(
        touch ? { width: 390, height: 844 } : { width: 850, height: 680 },
      );
      await game.waitForTimeout(300);
      await bounds(game);
      await canvasBounds(game);
      assert(
        await game.locator("#player-feedback").isHidden(),
        "no external messages while playing",
      );
      assert(
        await game.locator("#player-toolbar").isHidden(),
        "controls live inside pause",
      );
      const pauseBox = await game.locator("#cadre-pause").boundingBox();
      assert(
        pauseBox.width >= 44 && pauseBox.height >= 44,
        "discreet icon keeps a usable touch target",
      );
      await game.screenshot({ path: path.join(output, name + "-road.png") });
      if (!touch) {
        await game.setViewportSize({ width: 1920, height: 1080 });
        await game.waitForTimeout(250);
        const full = await bounds(game);
        assert.equal(full.width, 1440);
        assert.equal(full.height, 1080);
      }
      await game
        .locator("#game canvas")
        .screenshot({ path: path.join(output, name + "-frame.png") });
      // Mobile element screenshots may use the layout viewport's wrong offset.
      // Capture the real viewport and retain the actual canvas bounds instead.
      const frameBox = await game.locator("#game canvas").boundingBox();
      const viewport = await game.evaluate(() => ({
        width: innerWidth,
        height: innerHeight,
      }));
      await game.screenshot({
        path: path.join(output, name + "-frame-page.png"),
      });
      fs.writeFileSync(
        path.join(output, name + "-frame-box.json"),
        JSON.stringify({ frameBox, viewport }),
      );
      if (!touch) {
        await game.keyboard.press("Escape");
        await page.bringToFront();
        await page
          .getByRole("button", { name: "Ouvrir dans une fenêtre", exact: true })
          .click();
        assert.equal(ctx.pages().length, 2, "reuse existing popup");
        assert(
          await game
            .getByRole("button", { name: "Reprendre", exact: true })
            .isVisible(),
          "reusing window must retain the existing paused run",
        );
        const fullscreen = game.getByRole("button", {
          name: "Plein écran",
          exact: true,
        });
        if (await fullscreen.count()) {
          await fullscreen.click();
          await game.waitForTimeout(200);
          if (await game.evaluate(() => !!document.fullscreenElement)) {
            await bounds(game);
            await game
              .getByRole("button", {
                name: "Quitter le plein écran",
                exact: true,
              })
              .click();
          }
          assert(
            await game
              .locator("body")
              .evaluate((b) => b.classList.contains("dedicated-window")),
          );
        }
      }
      assert.deepEqual(errors, []);
      if (!touch) {
        const offline = await browser.newContext({ offline: true });
        const launcher = await offline.newPage();
        await launcher.goto(
          require("node:url").pathToFileURL(
            path.join(root, "Jouer-Technoprof-Fenetre.html"),
          ).href,
        );
        const [localGame] = await Promise.all([
          launcher.waitForEvent("popup"),
          launcher
            .getByRole("button", {
              name: "Ouvrir le jeu dans sa fenêtre",
              exact: true,
            })
            .click(),
        ]);
        localGame.on("pageerror", (e) => errors.push(e.message));
        await localGame
          .getByRole("button", { name: "Prendre le service", exact: true })
          .waitFor({ timeout: 90000 });
        assert(
          await localGame
            .locator("body")
            .evaluate((b) => b.classList.contains("dedicated-window")),
        );
        await bounds(localGame);
        await offline.close();
      }
      assert.deepEqual(errors, []);
      if (name === "chromium") {
        await ctx.close();
        const blocked = await browser.newContext();
        await blocked.addInitScript(() => {
          window.open = () => null;
          window.__windowAudio = [];
          const create = document.createElement.bind(document);
          document.createElement = function (tag, ...args) {
            const element = create(tag, ...args);
            if (tag.toLowerCase() === "audio")
              window.__windowAudio.push(element);
            return element;
          };
        });
        const retry = await blocked.newPage();
        retry.on("pageerror", (e) =>
          console.error("Blocked-popup page error: " + e.message),
        );
        await retry.goto(url);
        await retry
          .getByRole("button", { name: "Réglages", exact: true })
          .waitFor({ timeout: 90000 });
        await retry
          .getByRole("button", { name: "Réglages", exact: true })
          .click();
        await retry
          .getByRole("button", { name: "Ouvrir dans une fenêtre", exact: true })
          .waitFor({ timeout: 90000 });
        await retry
          .getByRole("button", { name: "Ouvrir dans une fenêtre", exact: true })
          .click();
        assert(
          (await retry.locator("#window-status").textContent()).includes(
            "bloqué",
          ),
        );
        await retry
          .getByRole("button", { name: "Adapter cet onglet", exact: true })
          .click();
        await retry
          .getByRole("button", { name: "Retour", exact: true })
          .click();
        await retry
          .getByRole("button", { name: "Prendre le service", exact: true })
          .click();
        // The large local art preparation can trigger the intentional long-frame
        // pause on its first live frame. Resume through the player's own control.
        await retry.waitForTimeout(500);
        const resume = retry.getByRole("button", {
          name: "Reprendre",
          exact: true,
        });
        if (await resume.isVisible()) await resume.click();
        try {
          await retry.waitForFunction(
            () =>
              window.__windowAudio.some(
                (a) =>
                  a.src.includes("Intro-Musique") &&
                  !a.paused &&
                  a.currentTime > 0.2,
              ),
            null,
            { timeout: 15000 },
          );
        } catch (error) {
          console.error(
            await retry.evaluate(() => ({
              focus: document.hasFocus(),
              panel: document.getElementById("player-panel").innerText,
              sequence: document
                .getElementById("game")
                .getAttribute("data-sequence"),
              audio: window.__windowAudio.map((a) => ({
                src: a.src.split("/").pop(),
                paused: a.paused,
                time: a.currentTime,
                ready: a.readyState,
                error: a.error?.code,
              })),
            })),
          );
          throw error;
        }
        await blocked.close();
      }
      report.push({
        browser: name,
        dimensions,
        errors,
        offlineLauncher: !touch,
      });
      console.log(
        "PASS " + name + " popup/viewport, menus, captions, pause and controls",
      );
    } finally {
      await browser.close();
    }
  }
  fs.writeFileSync(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => server.close());
