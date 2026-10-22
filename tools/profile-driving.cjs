// Isolated-browser profiling of the real renderer. No game state is rewritten.
const fs = require("node:fs");
const path = require("node:path");
const { chromium, firefox } = require(process.argv[2] || "playwright");
const target =
  process.argv[3] || "work/reports/performance/driving-profile.json";
const duration = Number(process.argv[4] || 5000);
const moving = process.argv[5] === "moving";
const selectedBrowser = process.argv[6];
if (!Number.isFinite(duration) || duration < 1000)
  throw Error("Profile duration must be at least 1000 ms");
if (selectedBrowser && !["firefox", "chromium"].includes(selectedBrowser))
  throw Error("Unknown profile browser");
async function profile(engine, name, scenario) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 900 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      const stats = (window.__drivingProfile = {
        active: false,
        frames: [],
        gaps: [],
        gl: {},
        last: 0,
      });
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = (callback) =>
        raf.call(window, (time) => {
          const active = stats.active;
          const start = performance.now();
          if (active && stats.last) stats.gaps.push(start - stats.last);
          if (active) stats.last = start;
          callback(time);
          if (active) stats.frames.push(performance.now() - start);
        });
      for (const kind of ["WebGLRenderingContext", "WebGL2RenderingContext"]) {
        const prototype = window[kind]?.prototype;
        if (!prototype) continue;
        for (const name of [
          "drawArrays",
          "drawElements",
          "drawArraysInstanced",
          "drawElementsInstanced",
          "bufferData",
          "bufferSubData",
          "texImage2D",
          "texSubImage2D",
        ]) {
          const original = prototype[name];
          if (!original) continue;
          prototype[name] = function (...args) {
            if (stats.active) stats.gl[name] = (stats.gl[name] || 0) + 1;
            return original.apply(this, args);
          };
        }
      }
    });
    const start = Date.now();
    await page.goto(`http://127.0.0.1:4176/?essai=labo&scenario=${scenario}`, {
      waitUntil: "networkidle",
      timeout: 120000,
    });
    await page
      .getByLabel("Scénario", { exact: true })
      .waitFor({ timeout: 120000 });
    const readyMs = Date.now() - start;
    await page.getByLabel("Collisions et portées", { exact: true }).uncheck();
    if (moving) {
      // Wait for the first rendered frames, which can legitimately pause the
      // game after loading. Resume through the same public button as a player.
      for (let attempt = 0; attempt < 2; attempt++) {
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
        const state = await page
          .getByLabel("État de la simulation", { exact: true })
          .textContent();
        if (state.startsWith("PAUSE"))
          await page
            .getByRole("button", { name: "Pause / reprendre", exact: true })
            .click();
      }
      await page.locator("#game canvas").click();
    }
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(300);
    const stateBefore = await page
      .getByLabel("État de la simulation", { exact: true })
      .textContent();
    await page.evaluate(() => {
      window.__drivingProfile.active = true;
    });
    await page.waitForTimeout(duration);
    const stateAfter = await page
      .getByLabel("État de la simulation", { exact: true })
      .textContent();
    const stats = await page.evaluate(() => {
      const s = window.__drivingProfile;
      s.active = false;
      const canvas = document.querySelector("#game canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      const ext = gl?.getExtension("WEBGL_debug_renderer_info");
      return {
        ...s,
        renderer: ext
          ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
          : "unavailable",
      };
    });
    const summarize = (values) => {
      const v = values.slice().sort((a, b) => a - b);
      return {
        count: v.length,
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        p50: v[Math.floor(v.length * 0.5)],
        p95: v[Math.floor(v.length * 0.95)],
        max: v.at(-1),
      };
    };
    const motionObserved =
      !stateBefore.startsWith("PAUSE") &&
      !stateAfter.startsWith("PAUSE") &&
      stateBefore !== stateAfter;
    if (moving && !motionObserved)
      throw Error(
        "Moving profile did not observe an active simulation: " + stateAfter,
      );
    const result = {
      name,
      version: browser.version(),
      scenario,
      readyMs,
      renderer: stats.renderer,
      motionObserved,
      cpu: summarize(stats.frames),
      interval: summarize(stats.gaps),
      glPerFrame: Object.fromEntries(
        Object.entries(stats.gl).map(([k, v]) => [k, v / stats.frames.length]),
      ),
      stateBefore,
      stateAfter,
      errors,
    };
    console.log(JSON.stringify(result));
    return result;
  } finally {
    await browser.close();
  }
}
(async () => {
  const results = [];
  for (const [engine, name] of [
    [chromium, "chromium"],
    [firefox, "firefox"],
  ])
    if (!selectedBrowser || selectedBrowser === name)
      for (const scenario of ["road-fast", "road-dusk-fast"])
        results.push(await profile(engine, name, scenario));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
    JSON.stringify(
      {
        method:
          "Headless isolated browsers; same native game renderer, real inputs, no state skips. Browser/GPU configuration can differ from personal browsers. CPU is RAF callback time, not total GPU time.",
        results,
      },
      null,
      2,
    ),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
