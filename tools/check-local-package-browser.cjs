const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const folder = path.resolve(process.argv[2]);
const manifest = JSON.parse(
  fs.readFileSync(path.join(folder, "BUILD-INFO.json"), "utf8"),
);
const output = path.resolve("work/checkpoints/release-browser");
fs.mkdirSync(output, { recursive: true });
(async () => {
  const report = [];
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch({ headless: true });
    try {
      const context = await browser.newContext({
        offline: true,
        viewport: { width: 1000, height: 850 },
      });
      await context.addInitScript(() => {
        window.__localAudio = [];
        const create = document.createElement;
        document.createElement = function (tag, ...args) {
          const node = create.call(this, tag, ...args);
          if (String(tag).toLowerCase() === "audio")
            window.__localAudio.push(node);
          return node;
        };
      });
      const errors = [];
      context.on("page", (p) =>
        p.on("pageerror", (e) => errors.push(e.message)),
      );
      const launcher = await context.newPage();
      await launcher.goto(
        pathToFileURL(path.join(folder, manifest.launch)).href,
      );
      const [game] = await Promise.all([
        launcher.waitForEvent("popup"),
        launcher
          .getByRole("button", {
            name: "Ouvrir le jeu dans sa fenêtre",
            exact: true,
          })
          .click(),
      ]);
      await game
        .getByRole("button", { name: "Prendre le service", exact: true })
        .waitFor({ timeout: 90000 });
      await game.waitForLoadState("load");
      await game.bringToFront();
      assert(game.url().startsWith("file:"));
      // Firefox file popups can replace the initial document after the context
      // init hook. Attach the audio observer to the final loaded document too.
      await game.evaluate(() => {
        const create = document.createElement;
        document.createElement = function (tag, ...args) {
          const node = create.call(this, tag, ...args);
          if (
            String(tag).toLowerCase() === "audio" &&
            !window.__localAudio.includes(node)
          )
            window.__localAudio.push(node);
          return node;
        };
      });
      await game
        .getByRole("button", { name: "Prendre le service", exact: true })
        .click();
      await game.waitForTimeout(600);
      const resume = game.getByRole("button", {
        name: "Reprendre",
        exact: true,
      });
      if (await resume.isVisible()) await resume.click();
      try {
        await game.waitForFunction(
          () =>
            window.__localAudio.some(
              (a) =>
                a.src.includes("Intro-Musique") &&
                !a.paused &&
                a.currentTime > 0.2,
            ),
          null,
          { timeout: 15000 },
        );
      } catch (e) {
        console.error(
          await game.evaluate(() => ({
            url: location.href,
            focus: document.hasFocus(),
            menuHidden: document.getElementById("player-panel").hidden,
            panel: document.getElementById("player-panel").innerText,
            sequence: document
              .getElementById("game")
              .getAttribute("data-sequence"),
            audio: window.__localAudio.map((a) => ({
              src: a.src,
              paused: a.paused,
              time: a.currentTime,
              ready: a.readyState,
              error: a.error?.code,
            })),
          })),
        );
        throw e;
      }
      await game
        .getByRole("button", { name: "Pause / aide", exact: true })
        .click();
      await game
        .getByRole("button", { name: "Passer la cinématique", exact: true })
        .click();
      assert(await game.locator("#player-feedback").isHidden());
      assert(await game.locator("#game canvas").isVisible());
      await game
        .getByRole("button", { name: "Pause / aide", exact: true })
        .click();
      await game.getByRole("button", { name: "Réglages", exact: true }).click();
      assert.equal(await game.locator("input[type=range]").count(), 4);
      await game.screenshot({ path: path.join(output, name + ".png") });
      assert.deepEqual(errors, []);
      report.push({
        browser: name,
        commit: manifest.commit,
        offline: true,
        introAudio: true,
        cruising: true,
        settings: true,
        errors,
      });
      console.log(
        "PASS extracted ZIP: " +
          name +
          " offline launcher, intro music, cruising and settings",
      );
    } finally {
      await browser.close();
    }
  }
  fs.writeFileSync(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
