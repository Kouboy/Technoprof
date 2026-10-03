// Road coordinates: x is a lateral offset, z is the scrolling world distance.
// Mission kilometres remain the integral of actual km/h, independent of projection.
export const DRIVE = {
  // World scroll gain, shared by moving vehicles and spawn spacing.
  // Contact projection and mission kilometres remain unchanged.
  motionScale: 2.4,
  lanePixels: 105,
  roadHalfPixels: 125,
  playerWidth: 42,
  focal: 65,
  visibleDistance: 900,
  contactDepth: 4,
  maxOffset: 1.15,
  closeMargin: 0.16,
  steerRise: 0.24,
  steerReturn: 0.18,
  acceleration: 38,
  braking: 95,
};
// One queue capacity across the day: density comes from spacing, not a longer tail.
export const TRAFFIC = { capacity: 12, spacing: [1, 0.64, 0.44] };
export type Traffic = {
  z: number;
  x: number;
  type: number;
  speed?: number;
  sounded?: boolean;
  hit?: boolean;
};
export const TRAFFIC_WIDTHS = [52, 68, 46];
export function trafficWidth(type: number) {
  return TRAFFIC_WIDTHS[type] ?? 52;
}
export function trafficSpeed(o: Traffic) {
  return o.speed ?? [78, 60, 68][o.type] ?? 70;
}
export function contactWidth(type: number) {
  return (DRIVE.playerWidth + trafficWidth(type)) / (2 * DRIVE.lanePixels);
}
export function shoulderAmount(x: number) {
  const tireEdge = Math.abs(x) * DRIVE.lanePixels + DRIVE.playerWidth / 2;
  return Math.max(0, Math.min(1, (tireEdge - DRIVE.roadHalfPixels) / 15));
}
export function shoulderDrag(x: number, speed: number) {
  return shoulderAmount(x) * (18 + speed * 0.5);
}
export function roadProjection(travel: number, distance: number, lane = 0) {
  const scale = DRIVE.focal / (DRIVE.focal + Math.max(0, distance));
  const horizon = 67 + Math.sin(travel / 950) * 3;
  const bend = Math.sin((travel + distance * 0.4) / 220);
  return {
    x: 160 + 54 * bend * (1 - scale) ** 2 + lane * DRIVE.lanePixels * scale,
    y: horizon + (169 - horizon) * scale,
    scale,
  };
}
// Authored spacing: solitary passes, a staggered pair, then an open stretch.
// The queue is continuous across assignment; new cars enter beyond the horizon.
const CUES = [
  { gap: 300, x: 0.62, type: 0, speed: 70 },
  { gap: 550, x: -0.62, type: 1, speed: 62 },
  { gap: 750, x: 0, type: 2, speed: 84 },
  { gap: 260, x: 0.62, type: 0, speed: 84 },
  { gap: 900, x: -0.62, type: 2, speed: 74 },
  { gap: 560, x: 0.62, type: 1, speed: 64 },
  { gap: 620, x: 0, type: 0, speed: 78 },
  { gap: 900, x: -0.62, type: 0, speed: 72 },
];
export function trafficCue(index: number, mission: number, random: number) {
  const cue = CUES[index % CUES.length];
  return {
    ...cue,
    gap:
      DRIVE.motionScale *
      (cue.gap * TRAFFIC.spacing[Math.max(0, Math.min(2, mission))] +
        (index === 0 ? 0 : random * 35)),
  };
}
