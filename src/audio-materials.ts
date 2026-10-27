import { readSfx } from "./sfx-samples";
// Fixed original 8-bit samples for transients; small continuous generators for beds.
// Gains and durations are authored here; the game only sends semantic events.
export const AUDIO = {
  sampleRate: 22050,
  maxVoices: 24,
  master: 0.7,
  shiftSeconds: 0.18,
  roomWet: 0.08,
  ambient: 0.09,
  engine: 0.17,
  wind: 0.085,
  rolling: 0.045,
  gears: [0, 32, 72, 125, 185, 280],
  gpsNearMeters: 1000,
  gpsCloseMeters: 500,
  gpsNearSeconds: 4,
  gpsCloseSeconds: 2,
  gpsGain: 0.038,
};
export const FOLEY = {
  swing: [0.22, 0.17],
  book: [0.24, 0.65],
  block: [0.2, 0.38],
  body: [0.3, 0.55],
  defeat: [0.5, 0.46],
  stamp: [0.22, 0.37],
  sweep: [0.3, 0.17],
  step: [0.13, 0.12],
  "step-wood": [0.13, 0.12],
  "step-concrete": [0.13, 0.11],
  "step-metal": [0.13, 0.1],
  "step-gravel": [0.13, 0.115],
  stairs: [0.75, 0.17],
  gate: [0.72, 0.26],
  jump: [0.18, 0.22],
  land: [0.27, 0.25],
  crumble: [0.35, 0.24],
  door: [0.85, 0.3],
  "door-passage": [0.65, 0.3],
  "car-door": [0.32, 0.4],
  handle: [0.18, 0.16],
  stall: [0.9, 0.26],
  cloth: [0.65, 0.12],
  "bell-start": [1.15, 0.19],
  "bell-end": [1.35, 0.19],
  chair: [0.85, 0.22],
  paper: [0.5, 0.18],
  talk: [0.043, 0.095],
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
  const recorded = readSfx(kind, sampleRate, seed - 5301);
  if (recorded) return recorded;
  if (!["engine", "wind", "rolling", "room", "hum"].includes(kind))
    throw new Error("Missing authored SFX: " + kind);
  const data = new Float32Array(Math.ceil(sampleRate * FOLEY[kind][0]));
  const tau = Math.PI * 2;
  const lowStep = 1 - Math.exp((-tau * 320) / sampleRate);
  const midStep = 1 - Math.exp((-tau * 2000) / sampleRate);
  let random = seed >>> 0,
    low = 0,
    mid = 0;
  for (let i = 0; i < data.length; i++) {
    random ^= random << 13;
    random ^= random >>> 17;
    random ^= random << 5;
    const n = (random >>> 0) / 2147483648 - 1,
      t = i / sampleRate;
    low += (n - low) * lowStep;
    mid += (n - mid) * midStep;
    const band = mid - low;
    let v = 0;
    if (kind === "engine") {
      const firing = Math.exp(-((t * 40) % 1) * 20);
      v =
        (firing - 0.05) * (0.7 + Math.sin(tau * 7 * t) * 0.08) +
        Math.sin(tau * 40 * t) * 0.24 +
        Math.sin(tau * 80 * t) * 0.1 +
        low * firing * 1.1;
    } else if (kind === "wind") v = low * 2.8 + band * 0.35;
    else if (kind === "rolling") v = low * 3 + band * 0.22;
    else if (kind === "room") v = low * 1.2 + band * 0.15;
    else
      v =
        Math.sin(tau * 100 * t) * 0.3 +
        Math.sin(tau * 50 * t) * 0.15 +
        band * 0.02;
    data[i] = clamp(v, -0.98, 0.98);
  }
  let mean = 0;
  for (const value of data) mean += value;
  mean /= data.length;
  for (let i = 0; i < data.length; i++) data[i] -= mean;
  const tail = Math.floor(sampleRate * 0.015);
  for (let i = 0; i < tail; i++)
    data[data.length - tail + i] =
      data[data.length - tail + i] * (1 - i / tail) + data[i] * (i / tail);
  // Same low-fi bandwidth/depth, no extra noise layer.
  let filtered = 0,
    held = 0;
  const step = 1 - Math.exp((-tau * 4200) / sampleRate);
  for (let i = 0; i < data.length; i++) {
    filtered += (data[i] - filtered) * step;
    if (i % 2 === 0)
      held = Math.round(clamp(filtered, -0.98, 0.98) * 127) / 128;
    data[i] = held;
  }
  return data;
}
