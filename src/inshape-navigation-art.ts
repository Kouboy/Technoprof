import Phaser from "phaser";
import { INSHAPE_ID as i } from "./inshape-navigation";
import type { RoomSpec } from "./missions";
import { smallPrint, smallWidth } from "./small-lettering";
import { VIEW } from "./presentation";
import { INFIRMARY } from "./bruel-recovery";
import type { SliceArt } from "./slice-art";
import type { NewSchoolArt } from "./new-school-art";

// Layout study: existing pixels recomposed at runtime, no new bitmap payload.
// Final atlases wait for human navigation validation. Every opening is an exit.
export const I1_PATCHES: Record<string, number[]> = {
  wall: [202, 511, 43, 292],
  floor: [14, 843, 807, 80],
  door: [1418, 536, 202, 289],
  window: [263, 538, 290, 172],
  bench: [984, 250, 466, 167],
  cabinet: [1300, 673, 140, 147],
};
export class InshapeNavigationArt {
  background: Phaser.GameObjects.Image;
  nurse: Phaser.GameObjects.Image;
  ink: Phaser.GameObjects.Graphics;
  ground: Phaser.GameObjects.Graphics;
  patches: Phaser.GameObjects.Image[] = [];
  private used = 0;
  constructor(scene: Phaser.Scene) {
    const t = scene.textures.get("pro-backgrounds");
    for (const [key, [x, y, w, h]] of Object.entries(I1_PATCHES))
      t.add("i1-" + key, 0, x, y, w, h);
    this.background = scene.add
      .image(VIEW.x, VIEW.y, "pro-backgrounds", 0)
      .setOrigin(0)
      .setDisplaySize(VIEW.width, VIEW.height)
      .setDepth(1.09);
    // A fixed pool avoids texture/canvas allocation on repeated visits.
    for (let n = 0; n < 20; n++)
      this.patches.push(
        scene.add
          .image(0, 0, "pro-backgrounds", 0)
          .setOrigin(0)
          .setDepth(1.12)
          .setVisible(false),
      );
    this.ink = scene.add.graphics().setDepth(1.88);
    this.ground = scene.add.graphics().setDepth(1.13);
    this.nurse = scene.add
      .image(INFIRMARY.nurseX, VIEW.floor, "infirmary-nurse")
      .setOrigin(0.5, 0.986)
      .setDisplaySize(86, 86)
      .setDepth(2)
      .setVisible(false);
    this.hide();
  }
  hide() {
    this.background.setVisible(false);
    this.nurse.setVisible(false);
    this.ink.clear();
    this.ground.clear();
    for (const p of this.patches) p.setVisible(false);
    this.used = 0;
  }
  patch(frame: string, x: number, y: number, w: number, h: number) {
    this.patches[this.used++]
      .setTexture("pro-backgrounds", "i1-" + frame)
      .setPosition(x, y)
      .setDisplaySize(w, h)
      .setVisible(true);
  }
  fitActors(art: SliceArt, newArt: NewSchoolArt) {
    // NewSchoolArt reconstructs the pose every frame; multiply only its boss poses.
    if (art.teacher.visible && Math.abs(art.teacher.scaleX) > 0.21)
      art.teacher.setScale(art.teacher.scaleX * 0.8, art.teacher.scaleY * 0.8);
    if (newArt.enemy.visible && Math.abs(newArt.enemy.scaleX) > 0.22)
      newArt.enemy.setScale(
        newArt.enemy.scaleX * 0.8,
        newArt.enemy.scaleY * 0.8,
      );
  }
  plate(x: number, y: number, lines: string[], primary = false) {
    const g = this.ink,
      w = Math.max(24, ...lines.map((s) => smallWidth(s) + 8)),
      h = lines.length * 8 + 6;
    x = Math.max(9, Math.min(310 - w, Math.round(x - w / 2)));
    g.fillStyle(0x080d13);
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(primary ? 0xcec1a3 : 0xa6aa99);
    g.fillRect(x, y, w, h);
    for (const dx of [2, w - 3]) {
      g.fillStyle(0x323a3e);
      g.fillRect(x + dx, y + 2, 1, 1);
    }
    lines.forEach((s, n) => smallPrint(g, x + 4, y + 4 + n * 8, s, 0x21302e));
  }
  pipe(x: number) {
    const g = this.ink;
    g.fillStyle(0x151d24);
    g.fillRect(x - 2, 14, 7, 139);
    g.fillRect(x - 2, 17, 24, 7);
    g.fillStyle(0x8b7c35);
    g.fillRect(x, 14, 3, 138);
    g.fillRect(x, 19, 20, 3);
    g.fillStyle(0xc6ac53);
    g.fillRect(x, 14, 1, 138);
    for (const y of [51, 111, 143]) {
      g.fillStyle(0x4d5c58);
      g.fillRect(x - 2, y, 7, 3);
    }
    g.fillStyle(0xc1bca4);
    g.fillRect(x - 1, 119, 5, 6);
  }
  lockers(x: number, y = 68) {
    const g = this.ink;
    for (let n = 0; n < 3; n++) {
      g.fillStyle(0x111b23);
      g.fillRect(x + n * 12, y, 13, 83);
      g.fillStyle(0x865c3a);
      g.fillRect(x + n * 12 + 1, y + 2, 10, 79);
      g.fillStyle(0xb28651);
      g.fillRect(x + n * 12 + 1, y + 2, 1, 79);
      for (let a = 0; a < 3; a++) {
        g.fillStyle(0x263232);
        g.fillRect(x + n * 12 + 3, y + 8 + a * 3, 6, 1);
      }
      g.fillStyle(0xcbc2a6);
      g.fillRect(x + n * 12 + 8, y + 41, 1, 3);
    }
  }
  opening(x: number, kind: "corridor" | "up" | "down", colour = 0x395568) {
    const g = this.ink,
      w = 36,
      left = Math.round(x - w / 2),
      top = 40;
    g.fillStyle(0x071018);
    g.fillRect(left - 3, top - 3, w + 6, 115);
    g.fillStyle(colour);
    g.fillRect(left - 2, top - 2, 2, 114);
    g.fillRect(left + w, top - 2, 2, 114);
    g.fillRect(left - 2, top - 2, w + 4, 3);
    g.fillStyle(0x293638);
    g.fillRect(left + 2, top + 3, w - 4, 109);
    if (kind === "corridor") {
      g.fillStyle(0x121f27);
      g.fillRect(left + 8, top + 12, w - 16, 70);
      g.fillStyle(0x65736a);
      g.fillTriangle(left, 151, left + w, 151, x, 118);
      g.lineStyle(1, 0x85928a);
      g.lineBetween(left, 151, x, 118);
      g.lineBetween(left + w, 151, x, 118);
      g.fillStyle(0xa6b6a0);
      g.fillRect(left + 12, top + 9, 12, 1);
    } else {
      for (let n = 0; n < 9; n++) {
        const y = kind === "up" ? 151 - n * 8 : 89 + n * 7;
        const inset = kind === "up" ? n * 1.5 : (8 - n) * 1.5;
        g.fillStyle(0x89928a);
        g.fillRect(left + inset, y, w - inset * 2, 2);
        g.fillStyle(0x4b5754);
        g.fillRect(left + inset, y + 2, w - inset * 2, 5);
      }
      g.lineStyle(2, colour);
      g.lineBetween(left + 2, 145, left + 12, 72);
      g.lineBetween(left + w - 2, 145, left + w - 12, 72);
    }
  }
  render(r: RoomSpec, openingAge?: number) {
    this.hide();
    const outdoor = r.id === i.parvis || r.id === i.cour;
    if (r.id === i.infirmerie) {
      this.background
        .setTexture("hanouna-h1-infirmerie", 0)
        .setDisplaySize(VIEW.width, VIEW.height)
        .setVisible(true);
      this.nurse.setVisible(true);
      this.plate(55, 34, ["GALERIE T"]);
      return;
    }
    if (outdoor)
      this.background
        .setTexture("pro-backgrounds", 0)
        .setDisplaySize(VIEW.width, VIEW.height)
        .setVisible(true);
    else {
      this.background.setVisible(false);
      for (let n = 0; n < 6; n++) this.patch("wall", 7 + n * 51, 7, 51, 145);
      this.patch("floor", 7, 152, 306, 23);
      const g = this.ink;
      g.fillStyle(0x18262d);
      g.fillRect(7, 147, 306, 5);
      g.fillStyle(0x778780);
      g.fillRect(7, 12, 306, 2);
      g.fillStyle(0x141f27);
      g.fillRect(118, 20, 74, 5);
      g.fillStyle(0xa8b8ac);
      g.fillRect(121, 21, 68, 2);
    }
    if (r.id === i.parvis) {
      this.plate(264, 35, ["ACCUEIL >"], true);
      return;
    }
    if (r.id === i.cour) {
      const g = this.ink;
      // Technical landmarks share shape as well as colour across the network.
      g.fillStyle(0x35454b);
      g.fillRect(116, 10, 5, 27);
      g.fillRect(137, 10, 5, 27);
      g.fillRect(110, 7, 39, 9);
      g.fillStyle(0x6a7d7e);
      g.fillRect(112, 7, 35, 3);
      g.fillStyle(0x18252c);
      g.fillRect(130, 32, 58, 5);
      g.lineStyle(1, 0x7a827b);
      for (let n = 0; n < 8; n++)
        g.lineBetween(131 + n * 8, 32, 133 + n * 8, 37);
      this.pipe(281);
    }
    if ([i.atelier, i.preparation, i.liaison, i.seuil].includes(r.id))
      this.patch("bench", 105, 80, 85, 65);
    if ([i.galerie, i.jonction].includes(r.id)) {
      const g = this.ink;
      g.fillStyle(0x152b3a);
      g.fillRect(122, 12, 8, 140);
      g.fillStyle(0x45627b);
      g.fillRect(123, 12, 2, 140);
      this.patch("window", 198, 52, 51, 39);
      // A first-floor view: shed roofs below the sill, not a ground-floor exit.
      g.fillStyle(0x455557);
      g.fillTriangle(199, 89, 216, 75, 232, 89);
      g.fillTriangle(219, 89, 233, 77, 246, 89);
      g.fillStyle(0x17282b);
      g.fillRect(198, 89, 51, 3);
    }
    if ([i.vestiaire, i.jonction].includes(r.id))
      this.lockers(r.id === i.vestiaire ? 130 : 92);
    if ([i.service, i.palierService, i.galerie].includes(r.id))
      this.pipe(r.id === i.galerie ? 204 : 112);
    if (r.id === i.palierService) {
      // Below the void (1.4) and front lip (2.1), so the hole stays visible.
      const g = this.ground;
      g.fillStyle(0x343f41);
      g.fillRect(7, 152, 306, 23);
      g.lineStyle(1, 0x65716a);
      for (let n = 0; n < 25; n++)
        g.lineBetween(8 + n * 12, 153, 15 + n * 12, 173);
      this.plate(159, 105, ["PLANCHER CORRODE"]);
    }
    if ([i.escalier, i.service, i.jonction, i.preparation].includes(r.id)) {
      // A warning fixed to the wall, above the damaged landing. Floor hole
      // remains the shared physical prop at foot level, not painted on the wall.
      this.plate(159, r.id === i.preparation ? 56 : 112, ["SOL FRAGILE"]);
      const g = this.ink;
      g.fillStyle(0x7c623e);
      for (const x of [126, 182]) {
        g.fillRect(x, 157, 6, 2);
        g.fillRect(x + 3, 161, 3, 2);
      }
    }
    if (r.id === i.accueil) {
      this.patch("window", 88, 59, 54, 42);
      this.plate(113, 109, ["ACCUEIL FERME"]);
      this.plate(265, 14, ["SALLES T / 1ER"], true);
    }
    if (r.id === i.prefab) {
      this.patch("cabinet", 200, 76, 35, 70);
      this.plate(174, 65, ["VIE SCOLAIRE", "LABOS T / 1ER"]);
    }
    for (const e of r.exits ?? []) {
      const x = e.hint![0],
        target = e.target;
      const stairs =
        (r.id === i.escalier && target === i.galerie) ||
        (r.id === i.vestiaire && target === i.jonction) ||
        (r.id === i.service && target === i.palierService);
      const down =
        (r.id === i.galerie && target === i.escalier) ||
        (r.id === i.jonction && target === i.vestiaire) ||
        (r.id === i.palierService && target === i.service);
      const centre = e.edge ? (e.key === "LEFT" ? 22 : 291) : x;
      this.opening(
        centre,
        stairs ? "up" : down ? "down" : "corridor",
        target === i.service || target === i.palierService
          ? 0x8b7c35
          : target === i.vestiaire || r.id === i.vestiaire
            ? 0x865c3a
            : 0x395568,
      );
      const lines = e.label
        .replace(/^(GAUCHE|DROITE|HAUT|BAS) : /, "")
        .split(" / ");
      if (lines[0] === "PASSAGE COUVERT")
        lines.splice(0, lines.length, "PASSAGE COUVERT", "VESTIAIRE");
      if (lines[0] === "BATIMENT PRINCIPAL")
        lines.splice(0, lines.length, "BATIMENT PRINCIPAL", "SALLES T / 1ER");
      // Multiple choices at a junction need separate rows, not stacked labels.
      const signY = e.edge ? 12 : e.key === "DOWN" ? 95 : 31;
      this.plate(
        centre,
        signY,
        lines.slice(0, 2),
        target === i.couloir || target === i.escalier,
      );
    }
    if (r.id === i.seuil) {
      this.patch("door", 260, 40, 43, 112);
      this.plate(281, 26, ["T03"], true);
      this.ink.fillStyle(0x17282b);
      this.ink.fillRect(252, 96, 5, 9);
      this.ink.fillStyle(0xb4a27e);
      this.ink.fillRect(253, 98, 3, 2);
      if (openingAge !== undefined) {
        const open = Math.min(1, openingAge / 0.7);
        this.ink.fillStyle(0x080d13);
        this.ink.fillRect(263, 44, 37, 106);
        this.ink.fillStyle(0x3d4a4a);
        this.ink.fillRect(263, 44, Math.max(2, 37 * (1 - open)), 106);
      }
    }
  }
}
