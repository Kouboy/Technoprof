// Read-only inventory. Does not equate old files with unused dependencies.
const fs = require("node:fs"),
  path = require("node:path");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const tracked = execFileSync(
  "git",
  ["-c", "safe.directory=" + root.replaceAll("\\", "/"), "ls-files", "-z"],
  { cwd: root, maxBuffer: 20e6 },
)
  .toString()
  .split("\0")
  .filter(Boolean);
const files = [
  ...new Set([
    ...tracked,
    ...fs
      .readdirSync(path.join(root, "src"))
      .filter((f) => f.endsWith(".ts"))
      .map((f) => "src/" + f),
  ]),
].filter(
  (f) =>
    fs.existsSync(path.join(root, f)) &&
    fs.statSync(path.join(root, f)).isFile(),
);
const imports = (file) =>
  [
    ...fs
      .readFileSync(path.join(root, file), "utf8")
      .matchAll(/(?:from\s*|import\s*\(|import\s*)["'](\.[^"']+)["']/g),
  ]
    .map((m) =>
      path.posix.normalize(path.posix.join(path.posix.dirname(file), m[1])),
    )
    .map((p) => [p, p + ".ts", p + "/index.ts"].find((p) => files.includes(p)))
    .filter(Boolean);
const visited = new Set();
function visit(file) {
  if (visited.has(file)) return;
  visited.add(file);
  imports(file).forEach(visit);
}
visit("src/main.ts");
const unreachableModules = files
  .filter(
    (f) => /^src\/.*\.ts$/.test(f) && !f.endsWith(".d.ts") && !visited.has(f),
  )
  .map((file) => ({ file, bytes: fs.statSync(path.join(root, file)).size }));
const totals = {};
for (const file of files) {
  const group = file.includes("/") ? file.split("/")[0] : "root";
  const entry = (totals[group] ??= { files: 0, bytes: 0 });
  entry.files++;
  entry.bytes += fs.statSync(path.join(root, file)).size;
}
const generated = fs
  .readdirSync(root)
  .filter((f) => /^Jouer-.*\.html$/.test(f))
  .map((file) => ({
    file,
    bytes: fs.statSync(path.join(root, file)).size,
    tracked: tracked.includes(file),
  }));
const report = {
  method:
    "Read-only tracked-file inventory and conservative static relative-import reachability from src/main.ts. Unreachable is a review candidate, not permission to delete. Does not follow dynamic computed imports.",
  tracked: totals,
  reachableModules: visited.size,
  unreachableModules,
  generated,
};
if (process.argv[2]) {
  const out = path.resolve(root, process.argv[2]);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
}
console.log(
  JSON.stringify(
    {
      tracked: totals,
      reachableModules: visited.size,
      unreachableModules,
      generatedBytes: generated.reduce((n, f) => n + f.bytes, 0),
    },
    null,
    2,
  ),
);
