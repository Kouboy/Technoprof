import Phaser from "phaser";
import { roomPassages, type Exit } from "./world";
import { passageMarker } from "./passage-layout";
import { smallPrint } from "./small-lettering";

// Anchored to doorways/stair landings, never to the moving teacher.
export function passageHints(
  room: number,
  px: number,
  cleared: boolean,
  exits = roomPassages(room, cleared),
) {
  return exits.flatMap((exit) => {
    const marker = passageMarker(exit, px);
    return marker ? [{ ...marker, key: exit.key }] : [];
  });
}
export function drawPassageHints(
  g: Phaser.GameObjects.Graphics,
  room: number,
  px: number,
  cleared: boolean,
  exits?: Exit[],
) {
  for (const hint of passageHints(room, px, cleared, exits)) {
    const vertical = hint.vertical;
    const label = hint.key === "UP" ? "HAUT" : "BAS";
    const { x, y, w, h: height, center } = hint;
    g.fillStyle(0x080d13, 0.95);
    g.fillRect(x - 1, y - 1, w + 2, height + 3);
    g.fillStyle(hint.active ? 0xe5ae60 : 0x758080);
    g.fillRect(x, y, w, height);
    g.fillStyle(0x141e27);
    g.fillRect(x + 1, y + 1, w - 2, height - 2);
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
      if (i === 0) g.moveTo(x + center + dx, y + center + dy);
      else g.lineTo(x + center + dx, y + center + dy);
    });
    g.closePath();
    g.fillPath();
    if (vertical && hint.active) smallPrint(g, x + 17, y + 5, label, 0xe3d4b3);
  }
}
