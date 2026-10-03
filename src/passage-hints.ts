import Phaser from "phaser";
import { EXITS } from "./world";
import { smallPrint, smallWidth } from "./small-lettering";

// Anchored to doorways/stair landings, never to the moving teacher.
const MOUNTS: Record<number, [number, number][]> = {
  1: [[62, 62]],
  2: [[272, 62]],
  3: [[52, 62]],
  4: [[281, 62]],
  5: [
    [58, 59],
    [247, 92],
  ],
  6: [[60, 62]],
  7: [
    [43, 59],
    [264, 59],
  ],
  8: [[61, 62]],
};
const EDGE_KEYS: Record<number, [number, string][]> = {
  0: [[298, "RIGHT"]],
  1: [
    [15, "LEFT"],
    [298, "RIGHT"],
  ],
  2: [[15, "LEFT"]],
  3: [[298, "RIGHT"]],
  6: [[298, "RIGHT"]],
  7: [[15, "LEFT"]],
  8: [[298, "RIGHT"]],
};
export function passageHints(room: number, px: number, cleared: boolean) {
  const exits =
    room === 4
      ? cleared
        ? [{ from: 245, to: 302, key: "UP" }]
        : []
      : (EXITS[room] ?? []);
  const hints = exits.map((exit, i) => ({
    x: MOUNTS[room][i][0],
    y: MOUNTS[room][i][1],
    key: exit.key,
    active: px >= exit.from && px <= exit.to,
  }));
  for (const [x, key] of EDGE_KEYS[room] ?? [])
    if (Math.abs(px - x) < 62) hints.push({ x, y: 137, key, active: true });
  return hints;
}
export function drawPassageHints(
  g: Phaser.GameObjects.Graphics,
  room: number,
  px: number,
  cleared: boolean,
) {
  for (const hint of passageHints(room, px, cleared)) {
    const vertical = hint.key === "UP" || hint.key === "DOWN";
    const label = hint.key === "UP" ? "HAUT" : "BAS";
    const w = vertical && hint.active ? 20 + smallWidth(label) : 15;
    const x = Math.max(9, Math.min(311 - w, Math.round(hint.x - w / 2))),
      y = hint.y;
    g.fillStyle(0x080d13, 0.95);
    g.fillRect(x - 1, y - 1, w + 2, 17);
    g.fillStyle(hint.active ? 0xe5ae60 : 0x758080);
    g.fillRect(x, y, w, 14);
    g.fillStyle(0x141e27);
    g.fillRect(x + 1, y + 1, w - 2, 12);
    const arrow = [
      [0, -4],
      [-3, -1],
      [-1, -1],
      [-1, 4],
      [1, 4],
      [1, -1],
      [3, -1],
    ];
    g.fillStyle(hint.active ? 0xe3d4b3 : 0x928269);
    g.beginPath();
    arrow.forEach(([dx, dy], i) => {
      if (hint.key === "DOWN") {
        dx = -dx;
        dy = -dy;
      } else if (hint.key === "RIGHT") {
        const a = dx;
        dx = -dy;
        dy = a;
      } else if (hint.key === "LEFT") {
        const a = dx;
        dx = dy;
        dy = -a;
      }
      if (i === 0) g.moveTo(x + 7 + dx, y + 7 + dy);
      else g.lineTo(x + 7 + dx, y + 7 + dy);
    });
    g.closePath();
    g.fillPath();
    if (vertical && hint.active) smallPrint(g, x + 17, y + 5, label, 0xe3d4b3);
  }
}
