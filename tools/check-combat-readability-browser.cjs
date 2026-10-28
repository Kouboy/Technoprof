// Real game, authored scenarios, standard pad input only. Probe reads never
// relocate actors or change clocks/HP. Full battles are covered separately.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, ".."),
  dist = path.join(root, "dist"),
  out = path.join(root, "work/checkpoints/combat-readability");
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const rel =
      decodeURIComponent(new URL(req.url, "http://local").pathname).slice(1) ||
      "index.html",
    base = rel.startsWith("audio/") ? root : dist,
    file = path.resolve(base, rel);
  if (
    !file.startsWith(base + path.sep) ||
    !fs.existsSync(file) ||
    !fs.statSync(file).isFile()
  )
    return res.writeHead(404).end();
  res.setHeader(
    "Content-Type",
    {
      ".html": "text/html;charset=utf-8",
      ".js": "text/javascript",
      ".wav": "audio/wav",
    }[path.extname(file)] || "application/octet-stream",
  );
  if (file.endsWith(".js")) {
    const code = fs.readFileSync(file, "utf8"),
      marker = /this\.runtime\.mark\((['"`])ready\1\)/g;
    assert.equal([...code.matchAll(marker)].length, 1);
    res.end(code.replace(marker, (m) => m + ",globalThis.__combatQA=this"));
  } else fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const reports = [];
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({
          viewport: { width: 1100, height: 900 },
        }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.setDefaultTimeout(90000);
      await page.addInitScript(() => {
        window.__qaPad = {
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
          value: () => [window.__qaPad],
        });
      });
      await page.goto(
        `http://127.0.0.1:${server.address().port}/?essai=labo&scenario=bruel-navigation-a3-parent`,
      );
      await page.waitForFunction(() => !!window.__combatQA);
      const pad = async (move = 0, attack = false, jump = false) =>
        page.evaluate(
          ({ move, attack, jump }) => {
            __qaPad.axes[0] = move;
            __qaPad.buttons.forEach((b, i) => {
              b.pressed = i === 1 ? attack : i === 0 ? jump : false;
              b.value = b.pressed ? 1 : 0;
            });
          },
          { move, attack, jump },
        );
      const resume = async () => {
        if (await page.evaluate(() => __combatQA.paused))
          await page
            .getByRole("button", { name: "Pause / reprendre", exact: true })
            .click();
        await page.locator("#game").focus();
      };
      const speech = async () => {
        await resume();
        for (
          let n = 0;
          n < 24 && (await page.evaluate(() => __combatQA.encounterTime > 0));
          n++
        ) {
          await page.keyboard.press("f", { delay: 95 });
          await page.waitForTimeout(100);
        }
      };
      await speech();
      let hitSeen = false,
        blockSeen = false,
        firstHit = null,
        firstBlock = null;
      for (let n = 0; n < 1000 && !(hitSeen && blockSeen); n++) {
        const s = await page.evaluate(() => {
          const g = __combatQA,
            e = g.enemies[0];
          return {
            phase: g.phase,
            paused: g.paused,
            px: g.px,
            py: g.py,
            face: g.face,
            attack: g.attack,
            hitStop: g.hitStop,
            hp: g.hp,
            x: e.x,
            wind: e.wind,
            charge: e.chargeTime || 0,
            cycle: e.parentCycle.phase,
            enemyHp: e.hp,
            block: e.blockTime || 0,
            hits: g.session.events.filter((v) => v.kind === "contact").length,
            blocks: g.session.events.filter((v) => v.kind === "blocked").length,
          };
        });
        if (s.paused) {
          await resume();
          continue;
        }
        assert.equal(s.phase, "school", JSON.stringify(s));
        if (s.hits && !hitSeen) {
          hitSeen = true;
          firstHit = s;
          await page
            .locator("#game")
            .screenshot({ path: path.join(out, `${name}-parent-hit.png`) });
        }
        if (s.blocks && !blockSeen) {
          blockSeen = true;
          firstBlock = s;
          await page
            .locator("#game")
            .screenshot({ path: path.join(out, `${name}-parent-block.png`) });
        }
        const dx = s.x - s.px,
          side = Math.sign(dx) || 1;
        let move = 0,
          attack = false,
          jump = false;
        if (s.cycle === "opening") {
          if (Math.abs(dx) > 70) move = side;
          else if (s.face !== side) move = side;
          else attack = s.attack === 0 && !s.hitStop && s.py >= 130;
        } else if (s.charge > 0) {
          jump = Math.abs(dx) < 64 && s.py >= 158;
        } else if (hitSeen && s.cycle === "windup") {
          if (Math.abs(dx) > 72 || s.face !== side) move = side;
          else attack = s.attack === 0 && !s.hitStop;
        }
        await pad(move, attack, jump);
        await page.waitForTimeout(35);
      }
      await pad();
      assert(
        hitSeen && blockSeen,
        "native pad produces a hit and a visually distinct block",
      );
      await page
        .getByRole("combobox", { name: "Scénario", exact: true })
        .selectOption("bruel-navigation-a3-view-101");
      await speech();
      await page.waitForFunction(() => __combatQA.enemies[0].wind > 0.4);
      const hp = await page.evaluate(() => __combatQA.hp);
      await page
        .locator("#game")
        .screenshot({ path: path.join(out, `${name}-filmer-prepare.png`) });
      await page.waitForFunction(
        () =>
          __combatQA.enemies[0].wind > 0 && __combatQA.enemies[0].wind < 0.17,
      );
      await page
        .getByRole("button", { name: "Pause / reprendre", exact: true })
        .click();
      const planted = await page.evaluate(() => ({
        x: __combatQA.enemies[0].x,
        wind: __combatQA.enemies[0].wind,
        hp: __combatQA.hp,
        angle: __combatQA.newSchoolArt.enemy.angle,
      }));
      await page.waitForTimeout(200);
      assert.deepEqual(
        await page.evaluate(() => ({
          x: __combatQA.enemies[0].x,
          wind: __combatQA.enemies[0].wind,
          hp: __combatQA.hp,
          angle: __combatQA.newSchoolArt.enemy.angle,
        })),
        planted,
      );
      assert.equal(planted.hp, hp);
      assert(Math.abs(planted.angle) >= 6);
      await page
        .locator("#game")
        .screenshot({ path: path.join(out, `${name}-filmer-planted.png`) });
      await resume();
      await page.waitForFunction(() => __combatQA.enemies[0].strikeTime > 0);
      await page
        .locator("#game")
        .screenshot({ path: path.join(out, `${name}-filmer-strike.png`) });
      assert.deepEqual(errors, []);
      reports.push({
        browser: name,
        firstHit,
        firstBlock,
        filmingPupil: planted,
        errors,
      });
      console.log(
        "PASS native combat readability",
        name,
        JSON.stringify({
          hit: firstHit.enemyHp,
          block: firstBlock.cycle,
          filmingPupil: planted,
        }),
      );
    } finally {
      await browser.close();
    }
  }
  fs.writeFileSync(
    path.join(out, "report.json"),
    JSON.stringify(reports, null, 2),
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => server.close());
