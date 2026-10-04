import Phaser from "phaser";
import { BRUEL_A3_DATA } from "./bruel-a3-data";
import { NAV_ID } from "./bruel-navigation";
import { smallPrint, smallWidth } from "./small-lettering";
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
type Plate = [number, number, string[], boolean?];
const SIGNS: Record<number, Plate[]> = {
  [NAV_ID.cour]: [[237, 25, ["LYCEE P. BRUEL", "ENTREE >"], true]],
  [NAV_ID.vestibule]: [
    [13, 47, ["< COUR"]],
    [262, 47, ["HALL >"]],
    [126, 25, ["B12 / AILE B", "1ER ETAGE"]],
  ],
  [NAV_ID.hall]: [
    [33, 24, ["GRAND ESCALIER", "AILE B / 1ER"], true],
    [257, 35, ["ANNEXE", "1ER ETAGE"]],
    [13, 112, ["< VESTIBULE"]],
  ],
  [NAV_ID.principal]: [
    [30, 39, ["HALL / RDC"]],
    [206, 39, ["PALIER / 1ER"], true],
  ],
  [NAV_ID.palier]: [
    [30, 44, ["RDC / ESCALIER"]],
    [203, 18, ["ANNEXE", "PASSAGE INTERIEUR"]],
    [251, 51, ["GALERIE A >"]],
    [132, 127, ["1ER ETAGE"]],
  ],
  [NAV_ID.annexe]: [
    [32, 44, ["HALL / RDC"]],
    [13, 112, ["< PALIER PRINCIPAL"]],
    [254, 43, ["JONCTION >"]],
    [126, 25, ["ANNEXE / 1ER"]],
  ],
  [NAV_ID.galerieA]: [
    [13, 47, ["< PALIER"]],
    [254, 47, ["JONCTION >"]],
    [136, 116, ["A01-A04"]],
  ],
  [NAV_ID.jonction]: [
    [13, 43, ["< GALERIE A"]],
    [62, 39, ["ANNEXE / 1ER"]],
    [145, 39, ["INFIRMERIE"]],
    [250, 39, ["GALERIE B >", "B08-B14"]],
  ],
  [NAV_ID.galerieB]: [
    [13, 47, ["< JONCTION"]],
    [256, 47, ["PALIER B >"]],
    [119, 77, ["B08-B10"]],
  ],
  [NAV_ID.palierB]: [
    [13, 47, ["< GALERIE B"]],
    [259, 47, ["B11-B14 >"]],
    [126, 29, ["EMPLOIS DU TEMPS"]],
  ],
  [NAV_ID.infirmerie]: [
    [26, 32, ["JONCTION / 1ER"]],
    [163, 31, ["PREMIERS SOINS"]],
  ],
  [NAV_ID.seuil]: [[274, 12, ["B12"], true]],
};

export class BruelA3Art {
  background: Phaser.GameObjects.Image;
  courtView: Phaser.GameObjects.Image;
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
    // Same tree and damaged bench as the actual courtyard, reused in the lower
    // window pane to connect the landing with a place already visited.
    scene.textures
      .get("bruel-a3-entree")
      .add("court-view", 0, 0, 100, 580, 285);
    this.background = scene.add
      .image(VIEW.x, VIEW.y, "bruel-a3-entree", 0)
      .setOrigin(0)
      .setDisplaySize(VIEW.width, VIEW.height)
      .setDepth(1.08);
    this.courtView = scene.add
      .image(126, 85, "bruel-a3-entree", "court-view")
      .setOrigin(0)
      .setDisplaySize(64, 35)
      .setDepth(1.1);
    this.ambient = scene.add.graphics().setDepth(1.2);
    this.ink = scene.add.graphics().setDepth(1.88);
    this.hide();
  }
  hide() {
    this.background.setVisible(false);
    this.courtView.setVisible(false);
    this.ambient.clear();
    this.ink.clear();
  }
  plate(x: number, y: number, lines: string[], primary = false) {
    const g = this.ink,
      w = Math.max(20, ...lines.map((s) => smallWidth(s) + 8)),
      h = lines.length * 8 + 5;
    // Raised enamel, small fixings and chipped corners; lettering stays at
    // integer logical pixels rather than being baked into generated backgrounds.
    g.fillStyle(0x080d13, 0.8);
    g.fillRect(x - 1, y, w + 2, h + 2);
    g.fillStyle(primary ? 0xc7bc99 : 0xaaa991);
    g.fillRect(x, y, w, h);
    g.fillStyle(0x6a746b);
    g.fillRect(x, y + h - 1, w, 1);
    g.fillStyle(0xe0d4b5);
    g.fillRect(x + 1, y, w - 2, 1);
    g.fillStyle(0x3e4945);
    g.fillRect(x + 1, y + 2, 1, 1);
    g.fillRect(x + w - 2, y + h - 3, 1, 1);
    g.fillRect(x, y + h - 2, 2, 1);
    lines.forEach((line, i) =>
      smallPrint(g, x + 4, y + 3 + i * 8, line, 0x21302f),
    );
  }
  render(room: number, clock: number) {
    const view = A3_ROOM_ART[room];
    if (!view) return;
    this.background
      .setTexture("bruel-a3-" + view[0], view[1])
      .setDisplaySize(VIEW.width, VIEW.height)
      .setVisible(true);
    for (const sign of SIGNS[room] ?? []) this.plate(...sign);
    if (room === NAV_ID.palier) {
      this.courtView.setVisible(true);
      this.ambient.lineStyle(1, 0x303c3b);
      this.ambient.strokeRect(125, 84, 66, 37);
      this.ambient.lineBetween(156, 84, 156, 121);
      this.ambient.lineBetween(125, 99, 191, 99);
    }
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
