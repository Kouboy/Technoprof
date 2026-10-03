// Small deterministic PCM bank: physical transients, no remote files or worklet.
// Gains and durations are authored here; the game only sends semantic events.
export const AUDIO = {
  sampleRate: 22050,
  maxVoices: 24,
  master: 0.7,
  shiftSeconds: 0.18,
  roomWet: 0.13,
  ambient: 0.09,
  engine: 0.17,
  wind: 0.085,
  rolling: 0.045,
  gears: [0, 32, 72, 125, 185, 280],
};
export const FOLEY = {
  swing: [0.22, 0.11],
  book: [0.24, 0.48],
  block: [0.2, 0.38],
  body: [0.3, 0.44],
  defeat: [0.5, 0.46],
  stamp: [0.22, 0.37],
  sweep: [0.3, 0.17],
  step: [0.16, 0.16],
  jump: [0.18, 0.12],
  land: [0.27, 0.25],
  crumble: [0.35, 0.24],
  door: [0.85, 0.3],
  chair: [0.85, 0.22],
  paper: [0.5, 0.18],
  chalk: [1.05, 0.12],
  rattle: [0.2, 0.14],
  impact: [0.62, 0.62],
  skid: [0.24, 0.19],
  gravel: [0.2, 0.14],
  pass: [0.8, 0.22],
  truck: [1.05, 0.28],
  drip: [0.38, 0.085],
  relay: [0.14, 0.07],
  data: [2.25, 0.08],
  engine: [1, AUDIO.engine],
  wind: [2, AUDIO.wind],
  rolling: [2, AUDIO.rolling],
  room: [2, AUDIO.ambient],
  hum: [2, 0.02],
} as const;
export type Material = keyof typeof FOLEY;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export function engineState(speed: number, throttle: boolean) {
  const v = clamp(speed, 0, 260);
  let gear = 0;
  while (gear < 4 && v >= AUDIO.gears[gear + 1]) gear++;
  const load = clamp(
    (v - AUDIO.gears[gear]) / (AUDIO.gears[gear + 1] - AUDIO.gears[gear]),
  );
  return {
    gear,
    rate: v < 4 ? 0.68 : 0.85 + load * 1.8,
    engine: AUDIO.engine * (v < 4 ? 0.65 : throttle ? 1 : 0.72),
    wind: AUDIO.wind * (v / 260) ** 2,
    rolling: AUDIO.rolling * (v / 260) ** 0.8,
  };
}
export function passState(close: boolean, truck: boolean, closing: number) {
  // closing is visual world units/sec, not the speed displayed on the CADRE.
  const rush = clamp(closing / 260);
  return {
    rate: (truck ? 0.8 : 0.92) + rush * 0.3,
    gain: (close ? 1 : 0.42) * (0.65 + rush * 0.35),
  };
}
export function makeMaterial(kind: Material, sampleRate: number, seed = 5301) {
  const duration = FOLEY[kind][0],
    data = new Float32Array(Math.ceil(sampleRate * duration));
  let random = seed >>> 0,
    low = 0,
    mid = 0,
    phase = 0;
  const tau = Math.PI * 2;
  const lowStep = 1 - Math.exp((-tau * 320) / sampleRate),
    midStep = 1 - Math.exp((-tau * 2000) / sampleRate);
  const tone = (f: number, t: number) => Math.sin(tau * f * t);
  const decay = (t: number, seconds: number) => Math.exp(-t / seconds);
  const burst = (t: number, start: number, length: number) => {
    const x = t - start;
    return x < 0 || x > length ? 0 : Math.sin((Math.PI * x) / length) ** 2;
  };
  for (let i = 0; i < data.length; i++) {
    random ^= random << 13;
    random ^= random >>> 17;
    random ^= random << 5;
    const n = (random >>> 0) / 2147483648 - 1,
      t = i / sampleRate;
    // Rate-independent one-pole low bands, used as excitation rather than a hiss.
    low += (n - low) * lowStep;
    mid += (n - mid) * midStep;
    const high = n - mid,
      band = mid - low;
    let v = 0,
      env = Math.min(1, t / 0.0015) * Math.min(1, (duration - t) / 0.009);
    switch (kind) {
      case "engine": {
        // Combustion pulses + irregular exhaust texture, rather than a sawtooth note.
        const cycle = (t * 40) % 1;
        const firing = Math.exp(-cycle * 20);
        v =
          (firing - 0.05) * (0.7 + tone(7, t) * 0.08) +
          tone(40, t) * 0.24 +
          tone(80, t) * 0.1 +
          low * firing * 1.1;
        env = 1;
        break;
      }
      case "wind":
        v = low * 2.8 + band * 0.35;
        env = 1;
        break;
      case "rolling":
        v = low * 3 + band * 0.22;
        env = 1;
        break;
      case "room":
        v = low * 1.2 + band * 0.15;
        env = 1;
        break;
      case "hum":
        v = tone(100, t) * 0.3 + tone(50, t) * 0.15 + band * 0.02;
        env = 1;
        break;
      case "swing":
        v = (band * 1.2 + high * 0.16) * burst(t, 0.015, 0.18);
        break;
      case "book":
        v =
          (tone(112, t) * 0.68 + tone(237, t) * 0.2 + low * 2.1) *
            decay(t, 0.047) +
          high * 0.45 * decay(t, 0.008) +
          band * 0.24 * burst(t, 0.026, 0.09);
        break;
      case "block":
        v =
          (tone(480, t) * 0.36 + tone(910, t) * 0.18 + band * 1.8) *
            decay(t, 0.025) +
          high * 0.6 * decay(t, 0.006) +
          band * 0.28 * burst(t, 0.045, 0.08);
        break;
      case "body":
        v =
          (tone(74, t) * 0.7 + low * 2.4) * decay(t, 0.058) +
          band * 0.48 * decay(t, 0.014);
        break;
      case "defeat":
        v =
          (tone(68, t) * 0.65 + low * 2) * decay(t, 0.074) +
          band * (burst(t, 0.075, 0.13) + burst(t, 0.24, 0.15)) * 0.55;
        break;
      case "stamp":
        v =
          (tone(165, t) * 0.7 + tone(660, t) * 0.18 + low * 1.7) *
            decay(t, 0.026) +
          high * 0.6 * decay(t, 0.004) +
          band * 0.5 * burst(t, 0.045, 0.07);
        break;
      case "sweep":
        v = (band * 1.6 + high * 0.22) * burst(t, 0.02, 0.23);
        break;
      case "step":
        v =
          (tone(170, t) * 0.28 + low * 1.4 + band * 0.75) * decay(t, 0.018) +
          high * 0.15 * burst(t, 0.025, 0.08);
        break;
      case "jump":
        v =
          (band * 0.6 + high * 0.18) * burst(t, 0, 0.1) +
          low * burst(t, 0.055, 0.11);
        break;
      case "land":
        v = (tone(110, t) * 0.55 + low * 2.5 + band * 0.55) * decay(t, 0.036);
        break;
      case "crumble":
        v =
          band *
            (burst(t, 0, 0.09) + burst(t, 0.035, 0.17) + burst(t, 0.16, 0.17)) +
          low * 1.8 * decay(t, 0.09);
        break;
      case "rattle":
        v =
          (tone(315, t) * 0.32 + tone(713, t) * 0.16 + tone(1189, t) * 0.11) *
            decay(t, 0.042) +
          high * (decay(t, 0.006) + burst(t, 0.07, 0.04)) * 0.42;
        break;
      case "impact":
        v =
          (tone(72, t) * 0.52 + low * 2.1) * decay(t, 0.09) +
          (tone(321, t) * 0.15 + tone(827, t) * 0.1 + high * 0.5) *
            decay(t, 0.03) +
          (band + tone(713, t) * 0.15) *
            (burst(t, 0.13, 0.065) + burst(t, 0.29, 0.08)) *
            0.6;
        break;
      case "skid":
        phase += (tau * (1100 + tone(27, t) * 160 + band * 70)) / sampleRate;
        v = (Math.sin(phase) * 0.3 + band * 0.5) * burst(t, 0, 0.235);
        break;
      case "gravel":
        v =
          (low * 2 + band) *
          (0.3 + 0.7 * Math.abs(tone(37, t))) *
          burst(t, 0, 0.195);
        break;
      case "pass":
      case "truck": {
        // Trigger arrives 120 ms before crossing: put the peak at the mirror,
        // then let the displaced air fall away behind the player.
        const u = t / duration,
          peak = kind === "truck" ? 0.16 : 0.13;
        const envelope =
          t < peak
            ? Math.sin((Math.PI * t) / (2 * peak)) ** 2
            : decay(t - peak, kind === "truck" ? 0.25 : 0.19);
        phase +=
          (tau * ((kind === "truck" ? 85 : 160) * (1.35 - u * 0.65))) /
          sampleRate;
        v =
          (low * 3 +
            band * (kind === "truck" ? 0.6 : 0.9) +
            Math.sin(phase) * 0.17) *
          envelope;
        break;
      }
      case "chair": {
        const drag =
          burst(t, 0.04, 0.52) * (0.45 + 0.55 * Math.abs(tone(17, t)));
        phase += (tau * (520 + tone(23, t) * 65)) / sampleRate;
        v =
          (low * 2 + band * 0.65 + Math.sin(phase) * 0.18) * drag +
          (tone(140, t) * 0.4 + band) * burst(t, 0.62, 0.075);
        break;
      }
      case "paper":
        v =
          (high * 0.75 + band) *
          (burst(t, 0, 0.18) +
            burst(t, 0.14, 0.14) * 0.8 +
            burst(t, 0.29, 0.19) * 0.6);
        break;
      case "chalk":
        v =
          (high * 0.28 + band * 0.5) *
          (burst(t, 0.03, 0.17) +
            burst(t, 0.27, 0.23) +
            burst(t, 0.58, 0.18) +
            burst(t, 0.8, 0.19));
        break;
      case "door":
        v =
          (tone(350, t) * 0.22 + band) * decay(t, 0.024) +
          (low + tone(180, t) * 0.1) * burst(t, 0.08, 0.5) +
          (tone(93, t) * 0.6 + low * 2 + band) * burst(t, 0.64, 0.075);
        break;
      case "drip":
        phase += (tau * (1800 + 1100 * decay(t, 0.03))) / sampleRate;
        v =
          Math.sin(phase) * 0.35 * decay(t, 0.035) +
          tone(610, t) * 0.2 * decay(t, 0.09);
        break;
      case "relay":
        v = (band + high * 0.4 + tone(540, t) * 0.2) * decay(t, 0.012);
        break;
      case "data": {
        const bit = Math.floor(t * 32),
          gate = (t * 32) % 1 < 0.72 ? 1 : 0;
        const freq = bit % 5 === 0 ? 2400 : bit % 2 ? 1200 : 1800;
        v = (tone(freq, t) * 0.25 + band * 0.15) * gate;
        env *= Math.min(1, (duration - t) / 0.12);
        break;
      }
    }
    data[i] = clamp(v * env, -0.98, 0.98);
  }
  // DC removal and short loop crossfade prevent a tick at the wrap.
  let mean = 0;
  for (const v of data) mean += v;
  mean /= data.length;
  for (let i = 0; i < data.length; i++) data[i] -= mean;
  if (["engine", "wind", "rolling", "room", "hum"].includes(kind)) {
    const tail = Math.floor(sampleRate * 0.015);
    for (let i = 0; i < tail; i++)
      data[data.length - tail + i] =
        data[data.length - tail + i] * (1 - i / tail) + data[i] * (i / tail);
  }
  return data;
}
