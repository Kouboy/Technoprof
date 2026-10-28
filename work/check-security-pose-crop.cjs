const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { stripTypeScriptTypes } = require("node:module");
const playwrightPath =
  process.env.PLAYWRIGHT_MODULE ||
  "C:/Users/don_n/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";
const { chromium } = require(playwrightPath);
const out = path.resolve("work/checkpoints/security-pose-crop");
fs.mkdirSync(out, { recursive: true });
const strip = (source) =>
  source
    .replace(/import[\s\S]*?from\s+["'][^"']+["'];?/g, "")
    .replace(/export /g, "");
const sources = new Function(
  strip(fs.readFileSync("src/new-school-data.ts", "utf8")) +
    ";return NEW_SCHOOL_DATA;",
)();
const code = stripTypeScriptTypes(
  strip(fs.readFileSync("src/new-school-art.ts", "utf8")),
  { mode: "transform" },
);

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1150, height: 850 },
    });
    const result = await page.evaluate(
      async ({ sources, code }) => {
        const raw = {},
          poses = {};
        for (const key of [
          "bruel-backgrounds",
          "pro-backgrounds",
          "bruel-enemies",
          "pro-enemies",
        ]) {
          const image = new Image();
          image.src = sources[key];
          await image.decode();
          raw[key] = image;
        }
        const object = new Proxy(
          {},
          { get: (target, key) => (key === "then" ? undefined : () => object) },
        );
        const scene = {
          textures: {
            get: (key) => ({
              getSourceImage: () => raw[key],
              add() {},
              setFilter() {},
            }),
            addCanvas: (key, canvas) => {
              poses[key] = canvas;
              return { setFilter() {} };
            },
          },
          add: { image: () => object, graphics: () => object },
        };
        const Renderer = new Function(
          "Phaser",
          "prepareCatchupStudent",
          "addPreparedTexture",
          code + ";return NewSchoolArt;",
        )(
          { Textures: { FilterMode: { NEAREST: 0 } } },
          () => {},
          (scene, key, canvas) => scene.textures.addCanvas(key, canvas),
        );
        new Renderer(scene, false);
        const windup = poses["pro-pose-1"],
          context = windup.getContext("2d");
        const alpha = (x, y) => context.getImageData(x, y, 1, 1).data[3];
        const margin = context.getImageData(
          384,
          300,
          windup.width - 384,
          windup.height - 300,
        ).data;
        let marginAlpha = 0;
        for (let i = 3; i < margin.length; i += 4)
          marginAlpha = Math.max(marginAlpha, margin[i]);
        // Display every extracted pose in both facings using real canvas pixels.
        document.body.style =
          "margin:0;background:#202b31;color:#f2eadb;font:14px monospace";
        for (const key of ["pro", "bruel"]) {
          const heading = document.createElement("h3");
          heading.textContent = key + " / poses 0–7 / both facings";
          document.body.append(heading);
          for (const facing of [1, -1]) {
            const row = document.createElement("div");
            row.style = "display:flex;gap:4px";
            for (let frame = 0; frame < 8; frame++) {
              const source = poses[key + "-pose-" + frame],
                canvas = document.createElement("canvas");
              canvas.width = 136;
              canvas.height = 168;
              const ctx = canvas.getContext("2d");
              ctx.imageSmoothingEnabled = false;
              ctx.fillStyle = "#667b7d";
              ctx.fillRect(0, 0, 136, 168);
              ctx.save();
              ctx.translate(facing < 0 ? 136 : 0, 0);
              ctx.scale(facing, 1);
              ctx.drawImage(
                source,
                0,
                0,
                source.width * 0.29,
                source.height * 0.29,
              );
              ctx.restore();
              ctx.fillStyle = "white";
              ctx.fillText(String(frame), 4, 163);
              row.append(canvas);
            }
            document.body.append(row);
          }
        }
        return {
          marginAlpha,
          boot: alpha(290, 470),
          palm: alpha(370, 130),
          face: alpha(200, 100),
          count: Object.keys(poses).length,
        };
      },
      { sources, code },
    );
    await page.screenshot({
      path: path.join(out, "contact-sheet.png"),
      fullPage: true,
    });
    assert.equal(
      result.marginAlpha,
      0,
      "windup must exclude the neighbouring strike pose's boot, including local x384–409",
    );
    assert(
      result.boot > 240 && result.palm > 240 && result.face > 240,
      "own boot, extended palm and face stay intact",
    );
    assert.equal(result.count, 16, "both complete actor atlases extracted");
    console.log(
      "PASS security extraction: no neighbouring boot; own boot/palm/face intact; 16 poses rendered in both facings (32 views). Contact sheet: work/checkpoints/security-pose-crop/contact-sheet.png",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
