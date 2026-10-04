import Phaser from "phaser";
import { NAV_ID, NAV_CARE, type NavigationCare } from "./bruel-navigation";
import type { RoomSpec } from "./missions";
import { smallPrint, smallWidth } from "./small-lettering";

// Recompose existing raster pieces; keep props and lettering at integer pixels.
export class BruelNavigationArt {
  ink: Phaser.GameObjects.Graphics;
  patches: Phaser.GameObjects.Image[] = [];
  constructor(private scene: Phaser.Scene) {
    const t = scene.textures.get("bruel-backgrounds");
    t.add("nav-stair", 0, 402, 474, 420, 444);
    t.add("nav-door", 0, 890, 40, 150, 405);
    // Include the distinctive broken bench and tree trunk seen at the entrance.
    t.add("nav-court-view", 0, 0, 104, 485, 307);
    this.ink = scene.add.graphics().setDepth(1.88);
    for (let i = 0; i < 3; i++)
      this.patches.push(
        scene.add
          .image(0, 0, "bruel-backgrounds", "nav-door")
          .setOrigin(0)
          .setDepth(1.55)
          .setVisible(false),
      );
  }
  hide() {
    this.ink.clear();
    for (const p of this.patches) p.setVisible(false);
  }
  patch(i: number, frame: string, x: number, y: number, w: number, h: number) {
    this.patches[i]
      .setTexture("bruel-backgrounds", frame)
      .setPosition(x, y)
      .setDisplaySize(w, h)
      .setVisible(true);
  }
  plate(x: number, y: number, lines: string[], primary = false) {
    const w = Math.max(30, ...lines.map((s) => smallWidth(s) + 10)),
      h = lines.length * 8 + 6,
      g = this.ink;
    g.fillStyle(0x080d13);
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(primary ? 0xd0c4a1 : 0x9b9c89);
    g.fillRect(x, y, w, h);
    g.fillStyle(0x657471);
    g.fillRect(x, y, w, 1);
    for (const dx of [2, w - 3]) {
      g.fillStyle(0x343b3c);
      g.fillRect(x + dx, y + 2, 1, 1);
      g.fillRect(x + dx, y + h - 3, 1, 1);
    }
    lines.forEach((line, i) =>
      smallPrint(g, x + 5, y + 4 + i * 8, line, 0x182827),
    );
  }
  copper(x: number) {
    const g = this.ink;
    g.fillStyle(0x080d13);
    g.fillRect(x - 2, 7, 8, 145);
    g.fillRect(x - 2, 13, 20, 8);
    g.fillStyle(0x775044);
    g.fillRect(x, 7, 5, 145);
    g.fillRect(x, 15, 16, 4);
    g.fillStyle(0xce995d);
    g.fillRect(x, 7, 1, 145);
    g.fillRect(x, 15, 16, 1);
    // The same elbow and taped repair make the pipe a repeatable landmark.
    g.fillStyle(0xc1b89c);
    g.fillRect(x - 1, 112, 7, 5);
    for (const y of [34, 87, 142]) {
      g.fillStyle(0x343b3c);
      g.fillRect(x - 3, y, 8, 3);
      g.fillStyle(0x92988b);
      g.fillRect(x - 2, y, 6, 1);
    }
  }
  render(r: RoomSpec, care: NavigationCare, px: number, pointer: boolean) {
    if (!r.navigation) return;
    const id = r.id,
      g = this.ink,
      a2 = r.navigation.revision !== "A1" && !!r.navigation.revision,
      a3 = r.navigation.revision === "A3";
    if (id === NAV_ID.hall) {
      this.patch(0, "nav-stair", 23, 24, 79, 127);
      if (!a3) this.patch(1, "nav-door", 164, 25, 34, 126);
      this.plate(
        16,
        13,
        [a2 ? "AILE B / 1ER" : "B10-B12 / 1ER", "GRAND ESCALIER"],
        true,
      );
      if (a3) {
        // A worn notice board replaces the early care entrance; no false input hint.
        g.fillStyle(0x182827);
        g.fillRect(158, 33, 45, 62);
        g.fillStyle(0x655340);
        g.fillRect(160, 35, 41, 58);
        for (const [x, y] of [
          [163, 39],
          [177, 43],
          [166, 68],
        ]) {
          g.fillStyle(0xb4ac92);
          g.fillRect(x, y, 17, 20);
          g.fillStyle(0x697b74);
          g.fillRect(x + 3, y + 4, 10, 1);
          g.fillRect(x + 3, y + 8, 9, 1);
        }
      } else this.plate(142, 39, ["INFIRMERIE"]);
      if (a2) {
        this.patch(2, "nav-stair", 268, 35, 36, 116);
        this.plate(248, 30, ["ANNEXE", "1ER ETAGE"]);
      } else this.plate(242, 82, ["ANNEXE >", "ESCALIER B"]);
      this.plate(13, 112, ["< COUR"]);
    } else if (id === NAV_ID.annexe) {
      this.copper(209);
      if (a2) {
        // Upper landing: visible descending flight, not the RDC stairs going up.
        this.patch(0, "nav-door", 43, 25, 59, 126);
        g.fillStyle(0x10171c);
        g.fillRect(47, 35, 49, 113);
        for (let i = 0; i < 8; i++) {
          const y = 88 + i * 7,
            x = 92 - i * 6;
          g.fillStyle(0x626b67);
          g.fillRect(x, y, 96 - x, 2);
          g.fillStyle(0x303c3b);
          g.fillRect(x, y + 2, 96 - x, 5);
        }
        g.lineStyle(2, 0x7a8377);
        g.lineBetween(94, 80, 49, 133);
        g.lineBetween(94, 80, 94, 112);
        g.lineBetween(49, 133, 49, 149);
        this.plate(11, 15, ["< PALIER", "PRINCIPAL"]);
        this.plate(125, 15, ["ANNEXE / 1ER"]);
        this.plate(42, 42, ["HALL / RDC"]);
        this.plate(242, 43, ["JONCTION >"]);
      } else {
        this.plate(162, 38, ["AILE B / 1ER", "ESCALIER >"], true);
        this.plate(25, 45, ["HALL / RDC"]);
      }
    } else if (id === NAV_ID.principal) {
      this.plate(159, 41, ["1ER ETAGE >", "AILES A-B"], true);
      this.plate(24, 45, ["HALL / RDC"]);
    } else if (id === NAV_ID.palier) {
      this.patch(0, "nav-court-view", 119, 28, 80, 65);
      g.lineStyle(2, 0x38423f);
      g.strokeRect(118, 27, 82, 67);
      g.lineBetween(157, 28, 157, 93);
      g.lineBetween(119, 62, 199, 62);
      this.plate(17, 44, ["RDC / ESCALIER"]);
      if (a2) {
        this.patch(1, "nav-door", 213, 25, 34, 126);
        this.plate(205, 15, ["ANNEXE"]);
        this.plate(205, 35, ["PASSAGE", "INTERIEUR"]);
        this.plate(254, 35, ["GALERIE A", "TRAVERSEE >"]);
      } else this.plate(216, 47, ["GALERIE A >", "LIAISON B"]);
      this.plate(123, 100, ["1ER ETAGE"], true);
    } else if (id === NAV_ID.jonction) {
      this.patch(0, "nav-door", 74, 27, 33, 124);
      g.fillStyle(0x315a4d, 0.55);
      g.fillRect(77, 28, 25, 113);
      this.copper(209);
      if (a3) {
        this.patch(1, "nav-door", 153, 25, 34, 126);
        this.plate(145, 39, ["INFIRMERIE"]);
      }
      this.plate(13, 45, ["< GALERIE A"]);
      this.plate(59, 77, [a2 ? "ANNEXE / 1ER" : "ANNEXE / RDC"]);
      this.plate(239, 44, a2 ? ["GALERIE B >", "B08-B14"] : ["B10-B12 >"], !a2);
    } else if (id === NAV_ID.infirmerie) {
      this.patch(0, "nav-door", 44, 25, 33, 126);
      this.plate(25, 42, [a3 ? "JONCTION / 1ER" : "HALL / RDC"]);
      // Cot is behind the flat walking plane, with narrow metal feet.
      g.fillStyle(0x080d13);
      g.fillRect(92, 118, 56, 20);
      g.fillRect(95, 134, 3, 20);
      g.fillRect(142, 134, 3, 20);
      g.fillStyle(0x798582);
      g.fillRect(93, 118, 54, 3);
      g.fillRect(95, 136, 2, 16);
      g.fillRect(142, 136, 2, 16);
      g.fillStyle(0xb7b29a);
      g.fillRect(96, 122, 50, 13);
      g.fillStyle(0x687b76);
      g.fillRect(111, 123, 34, 12);
      g.fillStyle(0xe1d4b4);
      g.fillRect(98, 122, 12, 6);
      g.fillStyle(0x435654);
      for (let x = 115; x < 142; x += 9) g.fillRect(x, 130, 2, 4);
      // Enamel first-aid cabinet; its full face is the shared pointer target.
      g.fillStyle(0x080d13);
      g.fillRect(157, 70, 47, 80);
      g.fillStyle(0xa6aea1);
      g.fillRect(159, 72, 42, 76);
      g.fillStyle(0x647873);
      g.fillRect(160, 73, 40, 2);
      g.fillRect(160, 145, 40, 3);
      g.fillStyle(0xe2d6b9);
      g.fillRect(166, 78, 25, 19);
      g.fillStyle(0x426b5c);
      g.fillRect(175, 80, 7, 15);
      g.fillRect(171, 84, 15, 7);
      g.fillStyle(0x343b3c);
      g.fillRect(196, 103, 2, 9);
      g.fillRect(181, 72, 1, 76);
      if (care.used) {
        g.fillStyle(0x141e27);
        g.fillRect(164, 105, 27, 33);
        g.fillStyle(0x647873);
        g.fillRect(164, 120, 27, 2);
        g.fillRect(164, 136, 27, 2);
        this.plate(144, 47, ["SOINS UTILISES"]);
      } else {
        this.plate(136, 47, ["PREMIERS SOINS"]);
        if (care.active) {
          g.fillStyle(0x080d13);
          g.fillRect(158, 153, 44, 4);
          g.fillStyle(0xd0c4a1);
          g.fillRect(
            159,
            154,
            42 * Math.min(1, care.elapsed / NAV_CARE.seconds),
            2,
          );
        } else if (Math.abs(px - NAV_CARE.x) <= NAV_CARE.reach)
          this.plate(
            142,
            29,
            [`${pointer ? "TOUCHER" : "F/X"} : +${care.gain} PV`],
            true,
          );
      }
    } else if (id === NAV_ID.galerieA) {
      this.plate(12, 47, ["< PALIER"]);
      this.plate(234, 47, [a2 ? "JONCTION >" : "B10-B12 >"], !a2);
      for (let i = 0; i < 3; i++) {
        g.fillStyle(0x584b39);
        g.fillRect(118 + i * 25, 54, 21, 25);
        g.fillStyle(0xd0c4a1);
        g.fillRect(120 + i * 25, 56, 17, 21);
        g.fillStyle(0x5d7974);
        g.fillRect(123 + i * 25, 61 + i, 10, 6);
      }
      this.plate(132, 86, ["A01-A04"]);
    } else if (id === NAV_ID.galerieB) {
      this.plate(12, 47, ["< JONCTION"]);
      this.plate(238, 47, [a2 ? "PALIER B >" : "B10-B12 >"], !a2);
      this.plate(133, 77, ["B08-B10"]);
    } else if (id === NAV_ID.palierB) {
      g.fillStyle(0x080d13);
      g.fillRect(125, 44, 61, 46);
      g.fillStyle(0x58675d);
      g.fillRect(127, 46, 57, 42);
      g.fillStyle(0xbeb69d);
      g.fillRect(130, 49, 51, 36);
      g.fillStyle(0x758080);
      for (let y = 58; y < 84; y += 6) g.fillRect(133, y, 44, 1);
      g.lineStyle(1, 0x8f9b9b);
      g.lineBetween(160, 47, 152, 64);
      g.lineBetween(152, 64, 167, 74);
      this.plate(13, 44, ["< GALERIE B"]);
      this.plate(a2 ? 245 : 260, 44, [a2 ? "B11-B14 >" : "B12 >"], !a2);
    } else if (id === NAV_ID.seuil) this.plate(270, 47, ["B12"], true);
    else if (id === NAV_ID.cour) this.plate(239, 47, ["ENTREE >"], true);
    else if (id === NAV_ID.vestibule) {
      this.plate(13, 47, ["< COUR"]);
      this.plate(259, 47, ["HALL >"], true);
      if (a2) this.plate(126, 25, ["B12 / AILE B", "1ER ETAGE"], true);
    }
  }
}
