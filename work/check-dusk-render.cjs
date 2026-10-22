// Optional native WebGL smoke check; accepts the installed Playwright module path.
const { chromium } = require(process.argv[2] || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1100, height: 1000 },
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:4176/?essai=presentation", {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await page
      .getByLabel("Scène de référence", { exact: true })
      .selectOption("road-lights");
    await page.getByLabel("Taille réelle 640 × 480", { exact: true }).check();
    for (const [moment, name] of [
      ["1", "midi"],
      ["2", "crepuscule"],
    ]) {
      await page
        .getByLabel("Moment de la journée", { exact: true })
        .selectOption(moment);
      await page.waitForTimeout(500);
      await page
        .locator("#game canvas")
        .screenshot({ path: `work/route-lumieres-${name}.png` });
    }
    await page
      .getByLabel("Scène de référence", { exact: true })
      .selectOption("road-under");
    await page.waitForTimeout(500);
    await page
      .locator("#game canvas")
      .screenshot({ path: "work/route-lumieres-pont.png" });
    await page.goto(
      "http://127.0.0.1:4176/?essai=labo&scenario=road-dusk-fast",
      { waitUntil: "networkidle", timeout: 90000 },
    );
    await page.getByLabel("Scénario", { exact: true }).waitFor();
    // Render deterministic real simulation steps: headless long frames can
    // legitimately invoke the game's automatic pause; never disable that guard.
    for (let i = 0; i < 20; i++)
      await page
        .getByRole("button", { name: "Un pas (20 ms)", exact: true })
        .click();
    await page
      .locator("#game canvas")
      .screenshot({ path: "work/route-lumieres-mouvement.png" });
    const status = page.getByLabel("État de la simulation", { exact: true });
    if (!(await status.textContent()).startsWith("PAUSE"))
      await page
        .getByRole("button", { name: "Pause / reprendre", exact: true })
        .click();
    await page.waitForTimeout(100);
    assert((await status.textContent()).startsWith("PAUSE"));
    const paused = await page.locator("#game canvas").screenshot();
    await page.waitForTimeout(350);
    assert(
      paused.equals(await page.locator("#game canvas").screenshot()),
      "no light accumulation or movement during pause",
    );
    await page
      .getByRole("button", { name: "Pause / reprendre", exact: true })
      .click();
    await page.waitForTimeout(150);
    assert.deepEqual(errors, [], "native renderer has no runtime errors");
    console.log(
      "PASS native WebGL road at midday/dusk and beneath bridge; screenshots saved",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
