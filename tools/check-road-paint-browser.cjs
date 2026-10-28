// Actual source atlas QA: continuous body paint, preserved glazing/hardware and
// alpha. Compare all paints at approximately their on-road display size.
const fs = require("node:fs"),
  path = require("node:path"),
  { execFileSync } = require("node:child_process"),
  { stripTypeScriptTypes } = require("node:module"),
  assert = require("node:assert/strict");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, "..");
const out = path.join(root, "work/checkpoints/traffic-paint-cohesion");
fs.mkdirSync(out, { recursive: true });
const source = fs.readFileSync(path.join(root, "src/road-art.ts"), "utf8");
const previous = execFileSync(
  "git",
  [
    "-c",
    `safe.directory=${root.replaceAll("\\", "/")}`,
    "show",
    `${process.env.TRAFFIC_REFERENCE || "f8004fb"}:src/road-art.ts`,
  ],
  { cwd: root, encoding: "utf8" },
);
const prepare = (s) =>
  stripTypeScriptTypes(
    s
      .slice(0, s.indexOf("// Glazing interiors"))
      .replace(/^import[^\n]+\n/gm, "")
      .replaceAll("export ", ""),
    { mode: "transform" },
  ) + ";return {recolorRoadTraffic,ROAD_FRAMES};";
const data = fs
  .readFileSync(path.join(root, "src/road-data.ts"), "utf8")
  .match(/traffic:\s*["'](data:image\/png;base64,[^"']+)/)[1];
(async () => {
  const reports = [];
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({
        viewport: { width: 1100, height: 810 },
      });
      const report = await page.evaluate(
        async ({ data, current, previous }) => {
          const now = new Function(current)(),
            old = new Function(previous)();
          const img = new Image();
          img.src = data;
          await img.decode();
          const raw = document.createElement("canvas");
          raw.width = img.width;
          raw.height = img.height;
          const c = raw.getContext("2d");
          c.drawImage(img, 0, 0);
          const original = c.getImageData(0, 0, raw.width, raw.height);
          for (let i = 0; i < original.data.length; i += 4) {
            const [r, g, b] = original.data.slice(i, i + 3);
            if (r > 110 && b > 100 && r > g * 1.6 && b > g * 1.6)
              original.data[i + 3] = 0;
          }
          const sheet = document.createElement("canvas");
          sheet.width = 1100;
          sheet.height = 810;
          document.body.style.margin = "0";
          document.body.append(sheet);
          const ink = sheet.getContext("2d");
          ink.imageSmoothingEnabled = false;
          ink.fillStyle = "#202d35";
          ink.fillRect(0, 0, sheet.width, sheet.height);
          ink.font = "14px monospace";
          ink.fillStyle = "#e4d6b5";
          ink.fillText(
            "Chaque case : AVANT en haut / APRES en bas — aucune seconde voiture superposee",
            12,
            21,
          );
          const pixel = (p, x, y) =>
            Array.from(
              p.slice((y * raw.width + x) * 4, (y * raw.width + x) * 4 + 4),
            );
          const body = [
            [55, 710],
            [90, 660],
            [440, 690],
            [135, 595],
            [600, 695],
            [940, 700],
            [1112, 600],
          ];
          const details = [
            [220, 540],
            [250, 647],
            [100, 621],
            [70, 780],
            [767, 618],
            [760, 550],
            [1085, 410],
            [1250, 201],
          ];
          for (let variant = 0; variant < 5; variant++) {
            for (const [version, api] of [
              [0, old],
              [1, now],
            ]) {
              const copy = new Uint8ClampedArray(original.data);
              api.recolorRoadTraffic(copy, raw.width, raw.height, variant);
              if (version === 1) {
                for (let i = 3; i < copy.length; i += 4)
                  if (copy[i] !== original.data[i])
                    throw Error("alpha changed");
                for (const [x, y] of details)
                  if (
                    pixel(copy, x, y).join() !=
                    pixel(original.data, x, y).join()
                  )
                    throw Error(`detail changed ${x},${y}`);
                if (variant)
                  for (const [x, y] of body)
                    if (
                      pixel(copy, x, y).join() ===
                      pixel(original.data, x, y).join()
                    )
                      throw Error(`unpainted body ${x},${y}`);
              }
              c.putImageData(new ImageData(copy, raw.width, raw.height), 0, 0);
              for (let frame = 0; frame < 3; frame++) {
                const [x, y, w, h] = api.ROAD_FRAMES.traffic[frame],
                  dw = frame === 2 ? 86 : 146;
                const dx = variant * 220 + (220 - dw) / 2,
                  dy = 46 + frame * 250 + version * 119;
                ink.drawImage(raw, x, y, w, h, dx, dy, dw, (dw * h) / w);
                if (version === 0) {
                  ink.fillStyle = "#e4d6b5";
                  ink.fillText(
                    ["Origine", "Vert", "Bordeaux", "Sable", "Ardoise"][
                      variant
                    ],
                    variant * 220 + 12,
                    dy - 5,
                  );
                }
              }
            }
          }
          return {
            paints: 5,
            frames: 3,
            alphaPreserved: true,
            detailsPreserved: true,
            bodySeamsCovered: true,
          };
        },
        { data, current: prepare(source), previous: prepare(previous) },
      );
      await page
        .locator("canvas")
        .screenshot({ path: path.join(out, `${name}.png`) });
      assert.equal(report.bodySeamsCovered, true);
      reports.push({ browser: name, ...report });
      console.log("PASS", name, report);
    } finally {
      await browser.close();
    }
  }
  fs.writeFileSync(
    path.join(out, "report.json"),
    JSON.stringify(reports, null, 2),
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
