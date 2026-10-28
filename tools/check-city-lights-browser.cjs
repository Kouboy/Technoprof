// Native RoadArt render at the protected home-return horizon; no game state edits.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "work/checkpoints/city-lights");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(
  path.join(out, "index.html"),
  '<style>body{margin:0;background:#10151d}canvas{image-rendering:pixelated}</style><script type="module" src="./scene.ts"></script>',
);
fs.writeFileSync(
  path.join(out, "scene.ts"),
  `
import Phaser from "phaser";
import { RoadArt } from "../../../src/road-art";
class SkyProbe extends Phaser.Scene {
  preload() { RoadArt.preload(this); }
  create() { this.art = new RoadArt(this); window.probe = this; this.mission = 3; this.lit = true; this.horizon=67; }
  update() { if (this.art) { this.art.sky(this.horizon, 0, 0, this.mission); if(!this.lit) this.art.skylineLights.setVisible(false); } }
}
new Phaser.Game({ type: Phaser.WEBGL, width:320, height:180, backgroundColor:'#10151d', pixelArt:true, roundPixels:true,
 render:{preserveDrawingBuffer:true}, scale:{mode:Phaser.Scale.NONE,zoom:3}, scene:SkyProbe });
window.capturePixels = () => { const native=document.querySelector('canvas'), copy=document.createElement('canvas'); copy.width=320; copy.height=180;
 const ctx=copy.getContext('2d'); ctx.drawImage(native,0,0); return Array.from(ctx.getImageData(0,0,320,180).data); };
`,
);
(async () => {
  const { createServer } = await import("vite");
  const server = await createServer({
    root,
    server: { host: "127.0.0.1", port: 0 },
    logLevel: "error",
  });
  await server.listen();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        viewport: { width: 960, height: 540 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      `http://127.0.0.1:${server.httpServer.address().port}/work/checkpoints/city-lights/index.html`,
    );
    await page.waitForFunction(() => window.probe?.art?.skylineLights?.visible);
    const capture = async (lit, mission = 3) => {
      await page.evaluate(
        ({ lit, mission }) => {
          probe.lit = lit;
          probe.mission = mission;
        },
        { lit, mission },
      );
      await page.waitForTimeout(100);
      return page.evaluate(() => capturePixels());
    };
    const reports = [];
    for (const horizon of [64, 67, 70]) {
      await page.evaluate((horizon) => (probe.horizon = horizon), horizon);
      const dark = await capture(false),
        lit = await capture(true),
        changed = [];
      for (let i = 0; i < lit.length; i += 4)
        if (lit[i] > dark[i] + 12 && lit[i + 1] > dark[i + 1] + 8)
          changed.push([(i / 4) % 320, Math.floor(i / 4 / 320)]);
      if (horizon === 67)
        await page.screenshot({ path: path.join(out, "night-skyline.png") });
      const day = await capture(false, 1),
        dayLit = await capture(true, 1);
      assert.deepEqual(day, dayLit, "no city light pixels in daytime");
      const bounds = changed.length
        ? {
            left: Math.min(...changed.map((p) => p[0])),
            right: Math.max(...changed.map((p) => p[0])),
            top: Math.min(...changed.map((p) => p[1])),
            bottom: Math.max(...changed.map((p) => p[1])),
          }
        : null;
      const sectors = Array.from(
        { length: 6 },
        (_, n) =>
          changed.filter(([x]) => x >= (n * 320) / 6 && x < ((n + 1) * 320) / 6)
            .length,
      );
      const report = {
        horizon,
        visibleWindowPixels: changed.length,
        bounds,
        sectors,
        errors,
      };
      reports.push(report);
      console.log(JSON.stringify(report));
      assert(
        changed.length >= 45,
        "city windows must remain visibly numerous at the native return horizon",
      );
      assert(
        sectors.every((n) => n >= 3),
        "lights distributed across the inhabited skyline",
      );
      assert(
        changed.every(([, y]) => y >= horizon - 10 && y < horizon),
        "lights stay on building façades, below the sky and above the ground",
      );
      assert.deepEqual(errors, []);
    }
    fs.writeFileSync(
      path.join(out, "report.json"),
      JSON.stringify(reports, null, 2),
    );
    console.log(
      "PASS native city lights: visible occupied skyline, façade bounds and night-only display",
    );
  } finally {
    await browser?.close();
    await server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
