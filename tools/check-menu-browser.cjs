// Production file:// UI only; synthetic standard pad inputs, no gameplay writes.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const output = path.resolve("work/checkpoints/menu-2026-10-27");
fs.mkdirSync(output, { recursive: true });
(async () => {
  const reports = [];
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch({ headless: true });
    try {
      const context = await browser.newContext({
        offline: true,
        viewport: { width: 1000, height: 850 },
        hasTouch: true,
      });
      await context.addInitScript(() => {
        window.__pad = {
          index: 0,
          connected: true,
          mapping: "standard",
          axes: [0, 0],
          buttons: Array.from({ length: 17 }, () => ({
            pressed: false,
            value: 0,
          })),
        };
        Object.defineProperty(navigator, "getGamepads", {
          value: () => [window.__pad],
        });
      });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.setDefaultTimeout(90000);
      await page.goto(
        pathToFileURL(path.resolve("Jouer-Technoprof-Journee-Atelier.html"))
          .href + "?musique=essai&fenetre=1",
        { timeout: 120000 },
      );
      const button = (text) =>
        page.getByRole("button", { name: text, exact: true });
      const panel = page.locator("#player-panel");
      await button("Prendre le service").waitFor();
      await page.screenshot({ path: path.join(output, name + "-titre.png") });
      await button("Commandes").click();
      assert((await panel.getAttribute("class")).includes("cadre-menu"));
      assert((await panel.locator(".menu-lettering").count()) > 3);
      await button("Retour").click();
      await button("Réglages").click();
      const sliders = panel.locator("input[type=range]");
      assert.equal(await sliders.count(), 4);
      await sliders.nth(0).focus();
      await page.keyboard.press("Home");
      for (let i = 0; i < 35; i++) await page.keyboard.press("ArrowRight");
      assert.equal(await sliders.nth(0).inputValue(), "35");
      const shake = panel.getByRole("checkbox", { name: "Secousses réduites", exact: true });
      await shake.check();
      assert(await shake.isChecked(), "styled checkbox retains native state");
      await page.screenshot({
        path: path.join(output, name + "-reglages.png"),
      });
      await button("Retour").click();
      await button("Prendre le service").click();
      const pad = async (i) => {
        await page.evaluate(
          (i) =>
            __pad.buttons.forEach((b, j) => {
              b.pressed = j === i;
              b.value = j === i ? 1 : 0;
            }),
          i,
        );
        await page.waitForTimeout(160);
        await page.evaluate(() =>
          __pad.buttons.forEach((b) => {
            b.pressed = false;
            b.value = 0;
          }),
        );
        await page.waitForTimeout(160);
      };
      await pad(9); // Skip intro after a fresh press; title click has consumed itself.
      await pad(9); // Pause cruising.
      await button("Reprendre").waitFor();
      assert.equal(await panel.getAttribute("aria-modal"), "true");
      assert.equal(
        await page.locator(":focus").getAttribute("aria-label"),
        "Reprendre",
        "pad focus starts on resume",
      );
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press("Tab");
        assert(
          await page
            .locator(":focus")
            .evaluate((n) => !!n.closest("#player-panel")),
          "Tab stays in the menu",
        );
      }
      await button("Reprendre").focus();
      await page.screenshot({ path: path.join(output, name + "-pause.png") });
      await pad(13); // Next item: Commandes, by D-pad.
      assert.equal(
        await page.locator(":focus").getAttribute("aria-label"),
        "Commandes",
      );
      await pad(0);
      assert.equal(await panel.locator("h1").textContent(), "Commandes");
      await pad(1);
      await button("Reprendre").waitFor(); // B returns one menu level.
      await pad(0);
      await panel.waitFor({ state: "hidden" }); // A resumes without reaching gameplay action.
      await page.keyboard.down("p");
      await page.waitForTimeout(120);
      await page.keyboard.up("p");
      await button("Reprendre").waitFor();
      for (const [w, h] of [
        [844, 390],
        [390, 844],
        [640, 480],
      ]) {
        await page.setViewportSize({ width: w, height: h });
        const shell = await page.locator("#game-shell").boundingBox(),
          box = await panel.boundingBox();
        assert(
          box.x >= shell.x &&
            box.y >= shell.y &&
            box.x + box.width <= shell.x + shell.width + 1 &&
            box.y + box.height <= shell.y + shell.height + 1,
          "menu inside 4:3 frame",
        );
        const overflow = await panel.evaluate(
          (n) => n.scrollWidth - n.clientWidth,
        );
        assert(overflow <= 1, "no horizontal menu overflow");
        await button("Réglages").click();
        await sliders.nth(0).focus();
        await page.keyboard.press("ArrowRight");
        await button("Retour").click();
        await button("Reprendre").waitFor();
        await page.screenshot({
          path: path.join(output, `${name}-${w}x${h}.png`),
        });
      }
      await button("Reprendre").click();
      await panel.waitFor({ state: "hidden" });
      assert.deepEqual(errors, []);
      reports.push({
        browser: name,
        offline: true,
        settings: 4,
        gamepad: true,
        smallScreens: true,
        errors,
      });
      console.log(
        "PASS " +
          name +
          " offline menu/pause: bitmap, settings, standard pad navigation/Start/A/B, native keyboard, 3 compact sizes and no errors",
      );
    } finally {
      await browser.close();
    }
  }
  fs.writeFileSync(
    path.join(output, "report.json"),
    JSON.stringify(reports, null, 2),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
