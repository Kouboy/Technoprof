import Phaser from "phaser";
import { bitmap, bitmapWidth, GLYPHS } from "./cadre";
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
    const sweep = (0.35 - s.attack) / 0.19;
    for (let i = 0; i < 2; i++) {
      const points = [
        s.px + dir * (25 + i * 2) * scale,
        y + (-10 + i * 3) * scale,
        s.px + dir * (35 + i * 2) * scale,
        y + (-13 + i * 3) * scale,
        s.px + dir * (36 + sweep * 12 + i) * scale,
        y + (-12 + sweep * 12 + i * 3) * scale,
      ];
      stroke(points, 3, ink);
      stroke(points, 1.2, paper);
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
  const elapsed = clamp(1 - s.impact / 0.32, 0, 1);
  const alpha = Math.min(1, s.impact / 0.07);
  const x = clamp(s.impactX, 23, 296),
    y = clamp(s.impactY, 50, 153),
    r = (blocked ? 12 : 18) * (s.room === 4 ? 1 : 0.72) * (1 - elapsed * 0.65);
  const burst = (size: number) => {
    const p: number[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8,
        rr = (i % 2 ? 0.28 : 0.7 + (i % 3) * 0.25) * size;
      p.push(
        Math.round(x + Math.cos(a) * rr * 1.2),
        Math.round(y + Math.sin(a) * rr * 0.85),
      );
    }
    return p;
  };
  // The contact flash collapses quickly; separated ink splinters carry the recoil.
  if (elapsed < 0.65) {
    poly(burst(r + 2), ink);
    poly(burst(r), hurt ? 0xbf6648 : blocked ? 0x758080 : amber);
    poly(burst(r * 0.6), paper);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.2,
      near = 10 + elapsed * 20,
      far = near + 5 * (1 - elapsed);
    const points = [
      x + Math.cos(a) * near,
      y + Math.sin(a) * near * 0.65,
      x + Math.cos(a) * far,
      y + Math.sin(a) * far * 0.65,
    ];
    if (
      points.every((v, j) => (j % 2 ? v > 10 && v < 172 : v > 9 && v < 310))
    ) {
      stroke(points, 3, ink);
      stroke(points, 1, paper);
    }
  }
  const word = blocked ? "CLAC!" : hurt ? "AIE!" : "PAF!",
    size = (s.room === 4 ? 1.75 : 1.45) * (1 + Math.max(0, 0.2 - elapsed)),
    w = bitmapWidth(word) * size + 3;
  const tx = clamp(x - w / 2 - s.face * 9, 14, 303 - w),
    ty = clamp(y - (s.room === 4 ? 43 : 47) - elapsed * 4, 14, 140);
  // Hand-lettered feel: leaning, staggered letters with a heavy ink outline, no box.
  const lettering = (ox: number, oy: number, color: number) => {
    let cursor = tx;
    g.fillStyle(color, alpha);
    [...word].forEach((c, i) => {
      const glyph = GLYPHS[c];
      glyph.forEach((row, gy) =>
        [...row].forEach((v, gx) => {
          if (v === "1")
            g.fillRect(
              Math.round(cursor + gx * size + (6 - gy) * 0.42 + ox),
              Math.round(ty + gy * size + (i % 2 ? -1 : 1) + oy),
              Math.ceil(size),
              Math.ceil(size),
            );
        }),
      );
      cursor += (glyph[0].length + 1) * size;
    });
  };
  for (const [ox, oy] of [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
    [-1, -1],
    [1, 1],
    [2, 3],
  ])
    lettering(ox, oy, ink);
  lettering(0, 0, blocked ? paper : amber);
}
