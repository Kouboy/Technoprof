// Real local HTML, native WebAudio, actual keyboard/menu controls. No state writes.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, ".."),
  { bank } = require("./audio-harness.cjs").load();
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "audio/sfx-2026-10-24/manifest.json")),
);
const signature = (p) =>
  p.length +
  ":" +
  [.07, .17, .31, .49, .67, .83].map((f) => p[Math.floor(f*p.length)].toFixed(6)).join(",");
const expected = Object.fromEntries(
  manifest.map((m) => [
    signature(bank.makeMaterial(m.kind, 22050, 5301 + m.take)),
    { kind: m.kind, take: m.take },
  ]),
);
assert.equal(Object.keys(expected).length,manifest.length,'native sample fingerprints must be unique');
async function main() {
  const report = [];
  for (const [name, engine] of Object.entries({ chromium, firefox })) {
    const browser = await engine.launch({ headless: true });
    try {
      const context = await browser.newContext({
        offline: true,
        viewport: { width: 1200, height: 1000 },
      });
      await context.addInitScript((expected) => {
        window.__sfxLog = [];
        const Native = window.AudioContext;
        window.AudioContext = class extends Native {
          createBufferSource() {
            const node = super.createBufferSource(),
              start = node.start.bind(node);
            node.start = (...args) => {
              if (node.buffer?.sampleRate === 22050 && !node.loop) {
                const p = node.buffer.getChannelData(0),
                  key =
                    p.length +
                    ":" +
                [.07, .17, .31, .49, .67, .83]
                  .map((f) => p[Math.floor(f*p.length)].toFixed(6))
                      .join(",");
                if (expected[key])
                  window.__sfxLog.push({
                    ...expected[key],
                    offset: args[1] ?? 0,
                    rate: node.playbackRate.value,
                  });
              }
              return start(...args);
            };
            return node;
          }
        };
      }, expected);
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.setDefaultTimeout(45000);
      await page.goto(
        pathToFileURL(path.join(root, "Jouer-Technoprof.html")).href +
          "?essai=labo&scenario=hit&musique=essai",
      );
      const running = async () => {
        await page.waitForTimeout(300);
        const state=await page.locator('[aria-label="État de la simulation"]').innerText();
        if(state.startsWith('PAUSE')) {
          console.log(name+': resume visible loading pause');
          await page.getByRole('button',{name:'Pause / reprendre',exact:true}).click();
          await page.locator('#game').focus();
          await page.waitForTimeout(150);
        }
      };
      const choose = async (scenario) => {
        console.log(name + " fixture: " + scenario);
        await page
          .getByRole("combobox", { name: "Scénario", exact: true })
          .selectOption(scenario);
        await page
          .getByRole("button", { name: "Rejouer", exact: true })
          .click();
        await page.locator("#game").focus();
        await running();
      };
      const expectSound = async (kind, from = 0) => {
        try {
          await page.waitForFunction(
            ({ kind, from }) =>
              window.__sfxLog.slice(from).some((e) => e.kind === kind),
            { kind, from },
          );
        } catch (error) {
          console.error(
            name,
            kind,
            await page.evaluate(() => ({
              log: window.__sfxLog,
              state: document.querySelector(
                '[aria-label="État de la simulation"]',
              )?.textContent,
            })),
          );
          throw error;
        }
      };
      await page.getByRole("button", { name: "Rejouer", exact: true }).click();
      await page.locator("#game").focus();
      await running();
      await page.keyboard.press("f", { delay: 100 });
      await expectSound("book");
      await choose("whiff");
      await page.keyboard.press("f", { delay: 100 });
      await expectSound("swing");
      await choose("bruel-navigation-a3-view-105");
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(300);
      await page.keyboard.up("ArrowRight");
      await expectSound("step-wood");
      await page.keyboard.press("Space", { delay: 100 });
      await expectSound("jump");
      await expectSound("land");
      await choose("inshape-navigation-i2-view-313");
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(350);
      await page.keyboard.up("ArrowRight");
      await expectSound("step-metal");
      await choose("stairs");
      // This fixture is already free of speech/combat; do not inject stray strikes.
      const stairsFrom = await page.evaluate(() => window.__sfxLog.length);
      await page.keyboard.press("ArrowDown", { delay: 180 });
      await expectSound("stairs", stairsFrom);
      await choose("arrival");
      await expectSound("car-door");
      await expectSound("gate");
      await choose("hanouna-navigation-h1-view-208");
      await expectSound("step");
      await page.waitForFunction(() =>
        document
          .querySelector('[aria-label="État de la simulation"]')
          .textContent.includes("INFIRMERIE / dialogue"),
      );
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press("f", { delay: 100 });
        await page.waitForTimeout(180);
      }
      await page.waitForFunction(
        () =>
          !document
            .querySelector('[aria-label="État de la simulation"]')
            .textContent.includes("INFIRMERIE /"),
      );
      await expectSound("handle");
      await expectSound("door");
      await choose("bruel-navigation-a3-view-105");
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(300);
      await page.keyboard.up("ArrowRight");
      await page.keyboard.press("p", { delay: 100 });
      await page.waitForTimeout(100);
      const paused = await page.evaluate(() => window.__sfxLog.length);
      await page.keyboard.press("f", { delay: 100 });
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.__sfxLog.length), paused);
      await page.keyboard.press("p", { delay: 100 });
      await page.screenshot({
        path: path.join(root, `work/checkpoints/sfx-${name}.png`),
        fullPage: true,
      });
      const log = await page.evaluate(() => window.__sfxLog);
      assert.deepEqual(errors, []);
      report.push({
        browser: name,
        offline: true,
        identifiedNativeSamples: [...new Set(log.map((e) => e.kind))],
        actualKeyboardContacts: true,
        careEntryExit: true,
        pauseSilent: true,
        errors,
      });
      console.log(
        "PASS native SFX " +
          name +
          ": " +
          report.at(-1).identifiedNativeSamples.join(", "),
      );
      await context.close();
    } finally {
      await browser.close();
    }
  }
  fs.writeFileSync(
    path.join(root, "work/checkpoints/sfx-browser.json"),
    JSON.stringify(report, null, 2),
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
