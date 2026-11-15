// Test the standalone with no network and no platform speech API.
// Keep real Chromium decoding and scheduling, recording only long source starts.
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium, firefox } = require(process.argv[2] || "playwright");
const engine = process.argv[3] === "firefox" ? firefox : chromium;

(async () => {
  const browser = await engine.launch();
  try {
    const context = await browser.newContext({
      offline: true,
      viewport: { width: 900, height: 480 },
      hasTouch: true,
      ...(engine === chromium ? { isMobile: true } : {}),
    });
    await context.addInitScript(() => {
      for (const property of ["speechSynthesis", "SpeechSynthesisUtterance"])
        Object.defineProperty(window, property, {
          configurable: true,
          get() {
            throw new Error("The recorded bulletin must not use system TTS");
          },
        });
      globalThis.radioStarts = [];
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args) {
        if (
          this.buffer?.duration > 5 &&
          this.buffer?.duration < 12 &&
          !this.loop
        )
          globalThis.radioStarts.push({
            duration: this.buffer.duration,
            offset: args[1] || 0,
          });
        return start.apply(this, args);
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (event) => errors.push(event.message));
    await page.goto(
      pathToFileURL(path.resolve("Jouer-Technoprof-Journee-Atelier.html")).href,
      {
        waitUntil: "load",
        timeout: 120000,
      },
    );
    await page
      .getByRole("button", { name: "Prendre le service", exact: true })
      .click({ timeout: 90000 });
    const skip = page.getByRole("button", {
      name: "Passer la cinématique",
      exact: true,
    });
    if (await skip.isVisible()) await skip.click();
    await page.waitForFunction(() => radioStarts.length > 0, null, {
      timeout: 18000,
    });
    const caption = page.locator("#radio-caption");
    assert.match(
      await caption.textContent(),
      /Radio Educa France.*les postes vacants/,
    );
    const starts = await page.evaluate(() => radioStarts);
    assert.equal(starts.length, 1);
    assert(starts[0].duration > 6 && starts[0].duration < 7);
    assert.equal(starts[0].offset, 0);
    await caption.waitFor({ state: "hidden", timeout: 12000 });
    assert.equal(await page.evaluate(() => radioStarts.length), 1);
    assert.deepEqual(errors, []);
    console.log(
      `PASS ${engine.name()} standalone, offline: real MP3 decode, Radio Educa France caption, one read, automatic assignment, zero TTS calls`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
