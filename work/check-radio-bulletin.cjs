const assert = require("node:assert/strict");
const { load } = require("./audio-harness.cjs");

const { AudioKit } = load();
const sources = [];
const decodes = [];
const gains = [];
const kit = new AudioKit();
kit.context = {
  state: "running",
  currentTime: 0,
  decodeAudioData(bytes) {
    return new Promise((resolve, reject) => {
      decodes.push({ marker: new Uint8Array(bytes)[0], resolve, reject });
    });
  },
  createBufferSource() {
    const source = {
      context: kit.context,
      connect() {},
      disconnect() {},
      start(_when, offset) {
        this.offset = offset;
      },
      stop() {
        this.stopped = true;
      },
    };
    sources.push(source);
    return source;
  },
  createGain() {
    const gain = { value: 1 };
    gains.push(gain);
    return { gain, connect() {} };
  },
};

(async () => {
  const flush = () => Promise.resolve();
  const sync = (paused = false) => kit.radio(0, true, paused);
  sync();
  sync();
  assert.deepEqual(
    decodes.map((x) => x.marker),
    [1],
    "decode the morning bulletin once",
  );
  decodes[0].resolve({ duration: 10 });
  await flush();
  kit.voiceVolume = 0.4;
  sync();
  assert.equal(sources.length, 1);
  assert(kit.radioPlaying);
  assert.equal(gains[0].value, 0.4);
  kit.muted = true;
  sync();
  assert.equal(gains[0].value, 0);
  kit.muted = false;
  kit.context.currentTime = 2.5;
  const staleEnd = sources[0].onended;
  sync(true);
  assert(sources[0].stopped && !kit.radioPlaying);
  kit.context.currentTime = 7;
  sync();
  assert.equal(sources[1].offset, 2.5, "resume from the position before pause");
  staleEnd();
  assert(
    kit.radioPlaying && !kit.radioDone,
    "a cancelled source cannot end the resumed clip",
  );
  sources[1].onended();
  sync();
  assert(kit.radioDone && !kit.radioPlaying && !kit.radioFailed);
  assert.equal(sources.length, 2, "never repeat a finished bulletin");

  kit.radio(1, true);
  assert.equal(decodes.at(-1).marker, 2);
  kit.radio(0, false);
  decodes.at(-1).resolve({ duration: 11 });
  await flush();
  assert(
    !kit.radioPlaying && !kit.radioDone,
    "decoding after notification cannot restart the radio",
  );
  kit.radio(2, true);
  assert.equal(decodes.at(-1).marker, 3);
  decodes.at(-1).reject(new Error("missing codec"));
  await flush();
  assert(
    kit.radioFailed && !kit.radioPlaying,
    "failed audio leaves the timed notification fallback available",
  );
  console.log(
    "PASS recorded radio once per assignment, independent volume, pause/resume, cancellation and decode failure",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
