// Exercise the launcher's actual PowerShell without opening a browser.
const fs = require("node:fs"),
  path = require("node:path"),
  cp = require("node:child_process"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const batch = fs.readFileSync(path.join(root, "Jouer.cmd"), "utf8");
const command = batch
  .split(/\r?\n/)
  .filter((line) => /^  "/.test(line))
  .map((line) =>
    line
      .trim()
      .replace(/\s*\^$/, "")
      .slice(1, -1),
  )
  .join(" ");
assert(command.includes("Start-Process"));
assert(!command.includes("%~dp0"), "paths are data in the environment");
assert(batch.includes("if not errorlevel 1 exit /b 0"));
assert(batch.includes("Jouer-Technoprof-Fenetre.html"));
const fixture = path.join(
  root,
  "work/checkpoints/launcher",
  "Été & repos! 100% # professeur's",
);
fs.mkdirSync(fixture, { recursive: true });
fs.writeFileSync(
  path.join(fixture, "Jouer-Technoprof-Journee-Atelier.html"),
  "<title>test</title>",
);
const mock =
  "function Start-Process { param($FilePath,$ArgumentList,$WindowStyle) [ordered]@{exe=$FilePath;args=$ArgumentList;style=$WindowStyle} | ConvertTo-Json -Compress }; ";
const run = (overrides, missingChrome = false) => {
  const env = { ...process.env };
  for (const [key, value] of Object.entries({
    TECHNOPROF_GAME_DIR: fixture,
    ...overrides,
  })) {
    for (const existing of Object.keys(env))
      if (existing.toLowerCase() === key.toLowerCase()) delete env[existing];
    env[key] = value;
  }
  const hideChrome = missingChrome
    ? "function Test-Path { param($LiteralPath,$PathType) if ($LiteralPath -like '*chrome.exe') { return $false }; Microsoft.PowerShell.Management\\Test-Path -LiteralPath $LiteralPath -PathType $PathType }; "
    : "";
  return cp.spawnSync(
    "powershell.exe",
    ["-NoProfile", "-Command", mock + hideChrome + command],
    { encoding: "utf8", env },
  );
};
const result = run({});
assert.equal(result.status, 0, result.stderr);
const launch = JSON.parse(result.stdout.trim());
assert(
  launch.exe.toLowerCase().endsWith("google\\chrome\\application\\chrome.exe"),
);
assert.equal(launch.style, "Normal");
assert.equal(launch.args.length, 2);
assert.equal(launch.args[1], "--window-size=1024,800");
const url = new URL(launch.args[0].slice("--app=".length));
assert.equal(url.protocol, "file:");
assert.equal(url.searchParams.get("musique"), "essai");
assert.equal(url.searchParams.get("fenetre"), "1");
assert.equal(url.hash, "");
assert(
  decodeURIComponent(url.pathname).endsWith(
    fixture.replaceAll("\\", "/") + "/Jouer-Technoprof-Journee-Atelier.html",
  ),
);
assert.equal(
  run({ TECHNOPROF_GAME_DIR: path.join(fixture, "absent") }).status,
  1,
  "missing day falls back",
);
assert.equal(run({}, true).status, 1, "missing Chrome falls back");
console.log(
  "PASS Chrome launch arguments, encoded special-character path, music, window mode and missing Chrome/day fallback",
);
