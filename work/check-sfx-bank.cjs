const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const strip = (s) =>
  s
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, "")
    .replace(/export /g, "");
const ctx = { atob };
vm.createContext(ctx);
const source = ["sfx-data", "sfx-samples"]
  .map((n) => strip(fs.readFileSync(`src/${n}.ts`, "utf8")))
  .join("\n");
vm.runInContext(
  require("node:module").stripTypeScriptTypes(source) +
    ";globalThis.bank={SFX_DATA,SFX_RATE,readSfx,sfxTakes};",
  ctx,
);
const b = ctx.bank;
assert.equal(b.SFX_RATE, 11025);
for (const [kind, takes] of Object.entries(b.SFX_DATA))
  for (const [take, base64] of takes.entries()) {
    const bytes = Buffer.from(base64, "base64");
    assert(bytes.length > 100);
    assert.equal(bytes.readInt8(0), 0, kind);
    assert.equal(bytes.readInt8(bytes.length - 1), 0, kind);
    const pcm = b.readSfx(kind, 22050, take);
    assert(pcm.length === bytes.length * 2);
    let power = 0,
      mean = 0;
    for (const v of pcm) {
      assert(Number.isFinite(v) && Math.abs(v) < 0.95, kind);
      power += v * v;
      mean += v;
    }
    assert(Math.sqrt(power / pcm.length) > 0.004, kind + " audible");
    assert(Math.abs(mean / pcm.length) < 0.004, kind + " DC");
  }
for (const kind of [
  "book",
  "body",
  "swing",
  "jump",
  "step",
  "step-wood",
  "step-concrete",
  "step-metal",
  "step-gravel",
]) {
  assert(b.sfxTakes(kind) >= 2, kind + " variants");
  assert.notDeepEqual(
    b.readSfx(kind, 22050, 0),
    b.readSfx(kind, 22050, 1),
    kind + " actually different",
  );
}
assert.equal(b.readSfx("not-a-sound", 22050), null);
assert(b.readSfx("door-passage", 22050)?.length > 9000, "short sampled doorway");
assert(b.readSfx("stairs", 22050).length >= 10000, "three-step stair phrase with tail");
console.log(
  "PASS 8-bit mono SFX bank: 11025 Hz, audible unclipped/DC-free takes, varied impacts/whooshes/floors",
);
