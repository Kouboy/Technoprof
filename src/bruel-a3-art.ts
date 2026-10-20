import Phaser from "phaser";
import { BRUEL_A3_DATA } from "./bruel-a3-data";
import { NAV_ID } from "./bruel-navigation";
import {
  drawSchoolSign,
  type SchoolSign,
  type SchoolSignKind,
} from "./school-signage";
import { VIEW } from "./presentation";

// Explicit crops follow the actual generated dividers. Lower rows have less
// ceiling; trimming excess foreground keeps every wall base near y=144.
export const A3_ATLAS_CROPS = [
  [0, 0, 841, 468],
  [848, 0, 841, 468],
  [0, 475, 841, 410],
  [848, 475, 841, 410],
];
export const A3_ROOM_ART: Record<number, [string, number]> = {
  [NAV_ID.cour]: ["entree", 0],
  [NAV_ID.vestibule]: ["entree", 1],
  [NAV_ID.hall]: ["entree", 2],
  [NAV_ID.principal]: ["entree", 3],
  [NAV_ID.palier]: ["reseau", 0],
  [NAV_ID.annexe]: ["reseau", 1],
  [NAV_ID.galerieA]: ["reseau", 2],
  [NAV_ID.jonction]: ["reseau", 3],
  [NAV_ID.galerieB]: ["aile-b", 0],
  [NAV_ID.palierB]: ["aile-b", 1],
  [NAV_ID.infirmerie]: ["aile-b", 2],
  [NAV_ID.seuil]: ["aile-b", 3],
};

// Signage names neighbours and floor ranges, never adds a route to B12.
export const A3_SIGNS: Record<number, SchoolSign[]> = {
  [NAV_ID.cour]: [[207, 18, ["LYCEE AUGUSTE-BERTHELOT", "ENTREE >"], true]],
  [NAV_ID.vestibule]: [
    [32, 52, ["< COUR"]],
    [260, 52, ["HALL >"]],
    [174, 65, ["B12 / AILE B", "1ER ETAGE"], false, "paper"],
  ],
  [NAV_ID.hall]: [
    [133, 22, ["< GRAND ESCALIER", "AILE B / 1ER"], true],
    [257, 35, ["ANNEXE", "1ER ETAGE"]],
    [13, 39, ["< VESTIBULE"]],
  ],
  [NAV_ID.principal]: [
    [39, 27, ["HALL / RDC"]],
    [236, 41, ["PALIER / 1ER"], true],
  ],
  [NAV_ID.palier]: [
    [26, 42, ["RDC / ESCALIER"]],
    [209, 24, ["ANNEXE", "PASSAGE INTERIEUR"]],
    [252, 60, ["GALERIE A >"]],
    [126, 118, ["1ER ETAGE"], false, "room"],
  ],
  [NAV_ID.annexe]: [
    [33, 39, ["HALL / RDC"]],
    [13, 99, ["< PALIER PRINCIPAL"]],
    [254, 39, ["JONCTION >"]],
    [223, 70, ["ANNEXE / 1ER"], false, "paper"],
  ],
  [NAV_ID.galerieA]: [
    [13, 48, ["< PALIER"]],
    [254, 48, ["JONCTION >"]],
    [136, 96, ["A01-A04"], false, "paper"],
  ],
  [NAV_ID.jonction]: [
    [13, 57, ["< GALERIE A"]],
    [60, 26, ["ANNEXE / 1ER"]],
    [139, 26, ["INFIRMERIE"]],
    [250, 45, ["GALERIE B >", "B08-B14"]],
  ],
  [NAV_ID.galerieB]: [
    [13, 47, ["< JONCTION"]],
    [256, 47, ["PALIER B >"]],
    [119, 69, ["B08-B10"], false, "paper"],
  ],
  [NAV_ID.palierB]: [
    [13, 47, ["< GALERIE B"]],
    [259, 47, ["B11-B14 >"]],
    [126, 55, ["EMPLOIS DU TEMPS"], false, "paper"],
  ],
  [NAV_ID.infirmerie]: [
    [28, 21, ["JONCTION / 1ER"]],
    [107, 59, ["PREMIERS SOINS"], false, "paper"],
  ],
  [NAV_ID.seuil]: [[269, 23, ["B12"], true, "room"]],
};

export class BruelA3Art {
  background: Phaser.GameObjects.Image;
  ink: Phaser.GameObjects.Graphics;
  ambient: Phaser.GameObjects.Graphics;
  static preload(scene: Phaser.Scene) {
    for (const [key, data] of Object.entries(BRUEL_A3_DATA))
      scene.load.image("bruel-a3-" + key, data);
  }
  constructor(scene: Phaser.Scene) {
    for (const key of Object.keys(BRUEL_A3_DATA)) {
      const texture = scene.textures.get("bruel-a3-" + key);
      A3_ATLAS_CROPS.forEach(([x, y, w, h], i) =>
        texture.add(i, 0, x, y, w, h),
      );
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.background = scene.add
      .image(VIEW.x, VIEW.y, "bruel-a3-entree", 0)
      .setOrigin(0)
      .setDisplaySize(VIEW.width, VIEW.height)
      .setDepth(1.08);
    this.ambient = scene.add.graphics().setDepth(1.2);
    this.ink = scene.add.graphics().setDepth(1.88);
    this.hide();
  }
  hide() {
    this.background.setVisible(false);
    this.ambient.clear();
    this.ink.clear();
  }
  plate(
    x: number,
    y: number,
    lines: string[],
    primary = false,
    kind?: SchoolSignKind,
  ) {
    drawSchoolSign(this.ink, "berthelot", x, y, lines, primary, kind);
  }
  render(room: number, clock: number) {
    const view = A3_ROOM_ART[room];
    if (!view) return;
    this.background
      .setTexture("bruel-a3-" + view[0], view[1])
      .setDisplaySize(VIEW.width, VIEW.height)
      .setVisible(true);
    for (const sign of A3_SIGNS[room] ?? []) this.plate(...sign);
    if (room === NAV_ID.jonction) {
      // Tiny leak behind the walking lane; never a gameplay hazard or a RNG call.
      const t = (clock % 1.8) / 1.8;
      this.ambient.fillStyle(0x3b5757, 0.4);
      this.ambient.fillEllipse(211, 146, 13, 2);
      if (t < 0.8) {
        this.ambient.fillStyle(0x809b99, 0.8);
        this.ambient.fillRect(209, 129 + Math.round(t * 19), 1, 2);
      }
    }
  }
}
