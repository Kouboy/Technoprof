import Phaser from "phaser";
import type { RoomSpec } from "./missions";
import { HANOUNA_ID as h } from "./hanouna-navigation";
import {
  drawSchoolSign,
  type SchoolSign,
  type SchoolSignKind,
} from "./school-signage";
import { INFIRMARY } from "./bruel-recovery";
import { VIEW } from "./presentation";
import { HANOUNA_H1_DATA } from "./hanouna-h1-data";
import type { SliceArt } from "./slice-art";

// Original sources stay intact: these frames trim dividers and excess foreground.
export const H1_CROPS: Record<string, number[][]> = {
  entree: [
    [0, 110, 832, 357],
    [840, 0, 832, 467],
    [0, 475, 832, 444],
    [840, 475, 832, 444],
  ],
  etage: [
    [0, 0, 832, 430],
    [840, 0, 832, 430],
    [0, 475, 832, 409],
    [840, 475, 832, 409],
  ],
  infirmerie: [[0, 0, 1672, 835]],
};
export const H1_NURSE = { size: 86, soleOrigin: 0.986 };
export const H1_ARENA_SCALE = 0.8;
export const H1_CLASS_DOOR = { x: 241, y: 51, width: 43, height: 98 };
// Decorative leaks only: clock is supplied by the paused simulation. Anchors
// follow the selected buckets, away from passage markers and the walking lane.
export const H1_LEAKS: Record<
  number,
  { x: number; top: number; rim: number; period: number }
> = {
  [h.hall]: { x: 139, top: 24, rim: 134, period: 1.65 },
  [h.palier]: { x: 127, top: 23, rim: 133, period: 1.85 },
};
export const H1_BACKGROUNDS: Record<number, [string, string | number]> = {
  [h.cour]: ["hanouna-h1-entree", 0],
  [h.vestibule]: ["hanouna-h1-entree", 1],
  [h.hall]: ["hanouna-h1-entree", 2],
  [h.escalier]: ["hanouna-h1-entree", 3],
  [h.palier]: ["hanouna-h1-etage", 0],
  [h.galerie]: ["hanouna-h1-etage", 1],
  [h.jonction]: ["hanouna-h1-etage", 2],
  [h.seuil]: ["hanouna-h1-etage", 3],
  [h.infirmerie]: ["hanouna-h1-infirmerie", 0],
};
export const H1_SIGNS: Record<number, SchoolSign[]> = {
  [h.cour]: [[213, 35, ["COLLEGE DES ORMEAUX", "ENTREE >"], true]],
  [h.vestibule]: [
    [44, 49, ["< COUR"]],
    [269, 41, ["HALL >"], true],
  ],
  [h.hall]: [
    [204, 29, ["AILE C / 1ER ETAGE", "C30-C45 / ESCALIER"], true],
    [12, 39, ["< VESTIBULE"]],
  ],
  [h.escalier]: [
    [37, 36, ["HALL / RDC"]],
    [225, 42, ["PALIER C / 1ER"], true],
  ],
  [h.palier]: [
    [37, 32, ["ESCALIER / RDC"]],
    [232, 112, ["C30-C45 >"], true],
    [182, 82, ["1ER ETAGE"], false, "room"],
  ],
  [h.galerie]: [
    [39, 38, ["< PALIER C"]],
    [157, 40, ["C30"], false, "room"],
    [238, 40, ["C31"], false, "room"],
    [265, 75, ["C42-C45 >"], true],
  ],
  [h.jonction]: [
    [38, 43, ["< C30-C41"]],
    [175, 35, ["INFIRMERIE"]],
    [266, 76, ["C42-C45 >"], true],
  ],
  [h.seuil]: [[253, 34, ["42C"], true, "room"]],
  [h.infirmerie]: [
    [28, 34, ["JONCTION C / 1ER"]],
    [166, 41, ["PREMIERS SOINS"], false, "paper"],
  ],
};
export class HanounaNavigationArt {
  background: Phaser.GameObjects.Image;
  nurse: Phaser.GameObjects.Image;
  ink: Phaser.GameObjects.Graphics;
  ambient: Phaser.GameObjects.Graphics;
  static preload(scene: Phaser.Scene) {
    for (const [key, data] of Object.entries(HANOUNA_H1_DATA))
      scene.load.image("hanouna-h1-" + key, data);
  }
  constructor(scene: Phaser.Scene) {
    for (const [key, crops] of Object.entries(H1_CROPS)) {
      const texture = scene.textures.get("hanouna-h1-" + key);
      crops.forEach(([x, y, w, h], index) => texture.add(index, 0, x, y, w, h));
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.background = scene.add
      .image(VIEW.x, VIEW.y, "hanouna-h1-entree", 0)
      .setOrigin(0)
      .setDisplaySize(VIEW.width, VIEW.height)
      .setDepth(1.09);
    this.ink = scene.add.graphics().setDepth(1.89);
    this.ambient = scene.add.graphics().setDepth(1.18);
    this.nurse = scene.add
      .image(INFIRMARY.nurseX, VIEW.floor, "infirmary-nurse")
      .setOrigin(0.5, H1_NURSE.soleOrigin)
      .setDisplaySize(H1_NURSE.size, H1_NURSE.size)
      .setDepth(2);
    this.hide();
  }
  hide() {
    this.background.setVisible(false);
    this.nurse.setVisible(false);
    this.ink.clear();
    this.ambient.clear();
  }
  fitArenaActors(art: SliceArt) {
    // SliceArt rebuilds poses each frame. Apply once after drawing, retaining
    // facing and the classroom walk's depth scaling, never accumulating.
    for (const actor of [art.teacher, art.inspector])
      if (actor.visible)
        actor.setScale(
          actor.scaleX * H1_ARENA_SCALE,
          actor.scaleY * H1_ARENA_SCALE,
        );
  }
  plate(
    x: number,
    y: number,
    lines: string[],
    primary = false,
    kind?: SchoolSignKind,
  ) {
    drawSchoolSign(this.ink, "ormeaux", x, y, lines, primary, kind);
  }
  render(r: RoomSpec, openingAge?: number, clock = 0) {
    this.ink.clear();
    this.ambient.clear();
    const [key, frame] = H1_BACKGROUNDS[r.id];
    this.background
      .setTexture(key, frame)
      .setDisplaySize(VIEW.width, VIEW.height)
      .setVisible(true);
    this.nurse.setVisible(r.id === h.infirmerie);
    this.drawLeak(r.id, clock);
    const g = this.ink;
    if (r.id === h.seuil && openingAge !== undefined) {
      const d = H1_CLASS_DOOR,
        open = Math.min(1, openingAge / 0.7);
      g.fillStyle(0x080d13);
      g.fillRect(d.x, d.y, d.width, d.height);
      g.fillStyle(0x426361);
      g.fillRect(d.x, d.y, Math.max(3, d.width * (1 - open)), d.height);
      g.fillStyle(0xc3c1a4);
      g.fillRect(d.x + Math.max(1, d.width * (1 - open) - 5), 111, 3, 1);
      g.fillStyle(0x8a9b83);
      g.fillRect(d.x + Math.max(3, d.width * (1 - open)) - 1, d.y, 1, d.height);
    }
    for (const sign of H1_SIGNS[r.id]) this.plate(...sign);
  }
  drawLeak(room: number, clock: number) {
    const leak = H1_LEAKS[room];
    if (!leak) return;
    const t =
      (((clock % leak.period) + leak.period) % leak.period) / leak.period;
    const g = this.ambient;
    if (t < 0.72) {
      const fall = t / 0.72;
      const y = Math.round(leak.top + fall * fall * (leak.rim - leak.top - 3));
      g.fillStyle(0x9aaba6, 0.75);
      g.fillRect(leak.x, y, 1, 2);
    } else if (t < 0.87) {
      const spread = 1 + Math.floor((t - 0.72) * 20);
      g.fillStyle(0x859590, 0.65 * (1 - (t - 0.72) / 0.15));
      g.fillRect(leak.x - spread, leak.rim - 1, 1, 1);
      g.fillRect(leak.x + spread, leak.rim - 1, 1, 1);
    }
  }
}
