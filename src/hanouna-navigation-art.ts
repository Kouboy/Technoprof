import Phaser from "phaser";
import type { RoomSpec } from "./missions";
import { HANOUNA_ID as h } from "./hanouna-navigation";
import { smallPrint, smallWidth } from "./small-lettering";
import { INFIRMARY } from "./bruel-recovery";
import { VIEW } from "./presentation";

// Spatial workshop using existing textures. Final panoramas follow the human test.
export const H1_BACKGROUNDS: Record<number, [string, string | number]> = {
  [h.cour]: ["courtyard", "playable"],
  [h.vestibule]: ["hall", "floor"],
  [h.hall]: ["annex-stair", "playable"],
  [h.escalier]: ["annex-stair", "playable"],
  [h.palier]: ["hall", "floor"],
  [h.galerie]: ["wing-34", "floor"],
  [h.jonction]: ["hall", "floor"],
  [h.seuil]: ["corridor", "__BASE"],
  [h.infirmerie]: ["bruel-a3-aile-b", 2],
};
type Plate = [number, number, string[], boolean?];
export const H1_SIGNS: Record<number, Plate[]> = {
  [h.cour]: [[216, 27, ["COLLEGE C. HANOUNA", "ENTREE >"], true]],
  [h.vestibule]: [
    [12, 28, ["< COUR"]],
    [257, 28, ["HALL >"], true],
  ],
  [h.hall]: [
    [180, 17, ["AILE C / 1ER ETAGE", "C30-C45 / ESCALIER"], true],
    [12, 32, ["< VESTIBULE"]],
  ],
  [h.escalier]: [
    [18, 28, ["HALL / RDC"]],
    [211, 28, ["PALIER C / 1ER"], true],
  ],
  [h.palier]: [
    [16, 27, ["ESCALIER / RDC"]],
    [232, 27, ["C30-C45 >"], true],
    [138, 108, ["1ER ETAGE"]],
  ],
  [h.galerie]: [
    [12, 27, ["< PALIER C"]],
    [132, 27, ["C30-C41"]],
    [234, 27, ["C42-C45 >"], true],
  ],
  [h.jonction]: [
    [12, 27, ["< C30-C41"]],
    [151, 15, ["INFIRMERIE"]],
    [245, 27, ["C42-C45 >"], true],
  ],
  [h.seuil]: [[274, 12, ["42C"], true]],
  [h.infirmerie]: [
    [26, 32, ["JONCTION C / 1ER"]],
    [163, 31, ["PREMIERS SOINS"]],
  ],
};
export class HanounaNavigationArt {
  background: Phaser.GameObjects.Image;
  nurse: Phaser.GameObjects.Image;
  ink: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    this.background = scene.add
      .image(VIEW.x, VIEW.y, "hall", "floor")
      .setOrigin(0)
      .setDisplaySize(VIEW.width, VIEW.height)
      .setDepth(1.09);
    this.ink = scene.add.graphics().setDepth(1.89);
    this.nurse = scene.add
      .image(INFIRMARY.nurseX, VIEW.floor, "infirmary-nurse")
      .setOrigin(0.5, 0.97)
      .setDisplaySize(77, 77)
      .setDepth(2);
    this.hide();
  }
  hide() {
    this.background.setVisible(false);
    this.nurse.setVisible(false);
    this.ink.clear();
  }
  plate(x: number, y: number, lines: string[], primary = false) {
    const w = Math.max(20, ...lines.map((s) => smallWidth(s) + 8)),
      height = lines.length * 8 + 5,
      g = this.ink;
    g.fillStyle(0x080d13);
    g.fillRect(x - 1, y - 1, w + 2, height + 2);
    g.fillStyle(primary ? 0xc7bc99 : 0xaaa991);
    g.fillRect(x, y, w, height);
    g.fillStyle(0x53625c);
    g.fillRect(x, y + height - 1, w, 1);
    g.fillStyle(0x343b3c);
    g.fillRect(x + 1, y + 2, 1, 1);
    g.fillRect(x + w - 2, y + height - 3, 1, 1);
    lines.forEach((line, i) =>
      smallPrint(g, x + 4, y + 3 + i * 8, line, 0x21302f),
    );
  }
  render(r: RoomSpec) {
    const [key, frame] = H1_BACKGROUNDS[r.id];
    this.background
      .setTexture(key, frame)
      .setDisplaySize(VIEW.width, VIEW.height)
      .setVisible(true);
    this.nurse.setVisible(r.id === h.infirmerie);
    const g = this.ink;
    if (r.id === h.jonction) {
      // Real care door behind the trigger, separate from the class corridor.
      g.fillStyle(0x111b1e);
      g.fillRect(158, 33, 44, 121);
      g.fillStyle(0x768580);
      g.fillRect(162, 37, 36, 116);
      g.fillStyle(0xbcbda9);
      g.fillRect(166, 44, 28, 19);
      g.fillStyle(0x45665b);
      g.fillRect(178, 47, 4, 13);
      g.fillRect(173, 51, 14, 4);
      g.fillStyle(0x293638);
      g.fillRect(163, 139, 34, 13);
      g.fillStyle(0xb7b6a6);
      g.fillRect(191, 101, 5, 2);
    }
    if (r.id === h.palier) {
      // Schematic elevated view for H1: no ground-level photo pasted upstairs.
      g.fillStyle(0x182b30);
      g.fillRect(113, 30, 84, 72);
      g.fillStyle(0x64716d);
      g.fillRect(116, 33, 78, 66);
      g.fillStyle(0x3f4a47);
      g.fillRect(117, 69, 76, 29);
      g.fillStyle(0x24343a);
      g.fillRect(123, 73, 31, 7);
      g.fillRect(125, 80, 2, 12);
      g.fillRect(149, 80, 2, 12);
      g.lineStyle(2, 0xa7a58d);
      g.lineBetween(176, 84, 178, 39);
      g.lineBetween(178, 53, 167, 40);
      g.lineBetween(178, 58, 188, 43);
      g.lineStyle(2, 0x354744);
      g.strokeRect(113, 30, 84, 72);
      g.lineBetween(155, 31, 155, 101);
    }
    if (!r.boss)
      for (const side of r.blocked) {
        g.fillStyle(0x263938);
        g.fillRect(side === "left" ? 7 : 299, 35, 14, 118);
      }
    for (const [x, y, lines, primary] of H1_SIGNS[r.id])
      this.plate(x, y, lines, primary);
  }
}
