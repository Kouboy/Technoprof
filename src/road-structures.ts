import { DRIVE, roadProjection } from "./driving";

// The overpass may keep travelling behind the camera: it leaves the viewport
// through perspective instead of disappearing at the player's contact plane.
export function roadsideProjection(travel: number, distance: number, lane = 0) {
  if (distance >= 0) return roadProjection(travel, distance, lane);
  const scale = DRIVE.focal / Math.max(17, DRIVE.focal + distance);
  const horizon = 67 + Math.sin(travel / 950) * 3;
  const bend = Math.sin((travel + distance * 0.4) / 220);
  const center = 160 + 54 * bend * (1 - scale) ** 2;
  const feet = horizon + (169 - horizon) * scale;
  return { x: center + lane * DRIVE.lanePixels * scale, y: feet, scale };
}
export function bridgeGeometry(travel: number, distance: number) {
  const p = roadsideProjection(travel, distance),
    scale = p.scale,
    feet = p.y,
    center = p.x;
  const half = 1.68 * DRIVE.lanePixels * scale;
  return {
    scale,
    left: center - half,
    right: center + half,
    feet,
    underside: feet - 128 * scale,
  };
}
type Graphics = {
  fillStyle(c: number, a?: number): unknown;
  fillRect(x: number, y: number, w: number, h: number): unknown;
};
export function drawRoadBridge(
  g: Graphics,
  travel: number,
  distance: number,
  variant = 0,
) {
  const b = bridgeGeometry(travel, distance),
    k = b.scale;
  const rect = (x: number, y: number, w: number, h: number, c: number) => {
    const left = Math.max(7, Math.round(x)),
      top = Math.max(7, Math.round(y));
    const right = Math.min(313, Math.round(x + w)),
      bottom = Math.min(175, Math.round(y + h));
    if (right > left && bottom > top) {
      g.fillStyle(c);
      g.fillRect(left, top, right - left, bottom - top);
    }
  };
  const r = (x: number, y: number, w: number, h: number, c: number) =>
    rect(b.left + x * k, b.feet + y * k, w * k, h * k, c);
  const span = 3.36 * DRIVE.lanePixels;
  const masonry = variant === 1,
    concrete = masonry ? 0x665e4a : 0x6e7468;
  // Piers live beyond both shoulders; the highest truck clears the underside.
  r(-18, -128, 18, 128, 0x24333b);
  r(span, -128, 18, 128, 0x24333b);
  r(-16, -125, 12, 125, concrete);
  r(span + 3, -125, 12, 125, concrete);
  r(-4, -124, 4, 124, 0x38494c);
  r(span, -124, 4, 124, 0x38494c);
  r(-23, -5, 27, 5, 0x45443a);
  r(span - 4, -5, 27, 5, 0x45443a);
  r(-22, -151, span + 44, 23, 0x080d13);
  r(-20, -149, span + 40, 16, masonry ? 0x38494c : 0x6e7468);
  r(-20, -149, span + 40, 2, 0x928269);
  r(-20, -132, span + 40, 4, 0x24333b);
  // Underside ribs, expansion seams and drain streaks read before surface wear.
  for (let i = 0; i < 10; i++) {
    const x = 8 + (i * (span - 16)) / 9;
    r(x, -132, 3, 4, 0x080d13);
    if (masonry) {
      r(x, -146, 2, 12, 0x758080);
      r(x - 1, -148, 4, 2, 0x080d13);
      r(x - 1, -136, 4, 2, 0x080d13);
    } else {
      r(x, -148, 1, 13, 0x526064);
      r(x + 2, -145, 2, 8, 0x45443a);
    }
  }
  for (let side = 0; side < 2; side++) {
    const x = side ? span + 3 : -16;
    if (masonry)
      for (let row = 0; row < 16; row++) {
        r(x, -119 + row * 7, 12, 1, 0x38494c);
        r(x + (row % 2 ? 4 : 8), -119 + row * 7, 1, 7, 0x38494c);
      }
    else {
      r(x + 3, -119, 2, 60, 0x526064);
      r(x + 6, -52, 1, 42, 0x928269);
      r(x + 7, -40, 3, 1, 0x45443a);
    }
  }
  r(-18, -162, span + 36, 2, 0x24333b);
  for (let x = 0; x <= span; x += 18) r(x, -161, 1, 10, 0x526064);
  r(-18, -152, span + 36, 1, 0x758080);
  // Small yellowed clearance plate, without fictional readable text.
  r(7, -145, 13, 7, 0x080d13);
  r(8, -144, 11, 5, 0xb9aa89);
  r(10, -142, 7, 1, 0x854538);
}
