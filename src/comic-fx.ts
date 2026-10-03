import Phaser from "phaser";
import { bitmap, bitmapWidth } from "./cadre";
type Fighter = {
  x: number;
  hp: number;
  wind: number;
  chargeTime?: number;
  chargeDir?: number;
  facing?: number;
  boss: boolean;
  stun?: number;
};
type State = {
  room: number;
  px: number;
  py: number;
  face: number;
  attack: number;
  falling: number;
  impact: number;
  impactX: number;
  impactY: number;
  impactKind: string;
  enemies: Fighter[];
  bossIntro: number;
};
export function drawComicFX(g: Phaser.GameObjects.Graphics, s: State) {
  const ink = 0x080d13,
    paper = 0xe3d4b3,
    amber = 0xe5ae60;
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));
  const poly = (p: number[], c: number) => {
    g.fillStyle(c);
    g.beginPath();
    g.moveTo(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]);
    g.closePath();
    g.fillPath();
  };
  const stroke = (p: number[], width: number, c: number) => {
    g.lineStyle(width, c);
    for (let i = 2; i < p.length; i += 2)
      g.lineBetween(p[i - 2], p[i - 1], p[i], p[i + 1]);
  };
  // Short paired strokes follow the real book's striking side, not screen direction.
  if (!s.falling && s.attack > 0.16 && s.attack < 0.35) {
    const y = s.py - (s.room === 4 ? 69 : 43),
      dir = s.face,
      scale = s.room === 4 ? 1 : 0.66;
    for (let i = 0; i < 3; i++) {
      const points = [
        s.px + dir * (25 + i * 2) * scale,
        y + (-10 + i * 3) * scale,
        s.px + dir * (35 + i * 2) * scale,
        y + (-13 + i * 3) * scale,
        s.px + dir * (45 + i) * scale,
        y + (-5 + i * 3) * scale,
      ];
      stroke(points, 2.5, ink);
      stroke(points, 0.8, paper);
    }
  }
  for (const e of s.enemies) {
    if (e.hp <= 0 || (e.stun ?? 0) > 0 || s.bossIntro > 0) continue;
    if (e.wind > 0) {
      const x = clamp(e.x - 3, 18, 297),
        y = s.room === 4 ? 50 : s.room === 3 ? 75 : 64;
      poly(
        [
          x - 4,
          y + 1,
          x - 1,
          y - 6,
          x + 3,
          y - 2,
          x + 8,
          y - 5,
          x + 11,
          y + 5,
          x + 7,
          y + 17,
          x - 3,
          y + 14,
        ],
        ink,
      );
      bitmap(g, x + 1, y, "!", amber, 1.5, 8);
      stroke([x - 8, y + 2, x - 13, y - 3], 1.5, paper);
      stroke([x + 13, y + 2, x + 18, y - 3], 1.5, paper);
    }
    if ((e.chargeTime ?? 0) > 0) {
      const dir = e.chargeDir ?? e.facing ?? 1;
      for (let i = 0; i < 3; i++) {
        const x = e.x - dir * 22,
          y = 113 + i * 6;
        stroke(
          [clamp(x - dir * (18 - i * 3), 9, 310), y, clamp(x, 9, 310), y - 2],
          2.5,
          ink,
        );
        stroke(
          [clamp(x - dir * (18 - i * 3), 9, 310), y, clamp(x, 9, 310), y - 2],
          0.8,
          paper,
        );
      }
    }
  }
  if (s.impact <= 0) return;
  const blocked = s.impactKind === "block",
    hurt = s.impactKind === "hurt";
  const x = clamp(s.impactX, 23, 296),
    y = clamp(s.impactY, 50, 153),
    r = (blocked ? 9 : 13) * (s.room === 4 ? 1 : 0.7);
  const burst = (size: number) => {
    const p: number[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8,
        rr = (i % 2 ? 0.43 : 1) * size;
      p.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    return p;
  };
  poly(burst(r + 2), ink);
  poly(burst(r), hurt ? 0xbf6648 : blocked ? 0x758080 : amber);
  poly(burst(r * 0.46), paper);
  const word = blocked ? "CLAC!" : hurt ? "AIE!" : "PAF!",
    w = bitmapWidth(word);
  const tx = clamp(x - w / 2 - s.face * 6, 12, 307 - w),
    ty = clamp(y - (s.room === 4 ? 43 : 47), 12, 144);
  // Uneven paper lozenge, heavy black edge and slightly staggered lettering.
  poly(
    [tx - 5, ty - 3, tx + w + 5, ty - 5, tx + w + 7, ty + 9, tx - 4, ty + 11],
    ink,
  );
  poly(
    [tx - 3, ty - 2, tx + w + 3, ty - 3, tx + w + 4, ty + 7, tx - 2, ty + 9],
    paper,
  );
  let cursor = tx;
  [...word].forEach((c, i) => {
    bitmap(g, cursor, ty + (i % 2 ? 0 : 1), c, ink, 1, 8);
    cursor += bitmapWidth(c) + 1;
  });
}
