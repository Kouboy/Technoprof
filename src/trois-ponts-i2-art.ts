import Phaser from "phaser";
import type { RoomSpec } from "./missions";
import { TROIS_PONTS_I2_DATA, TP_CROPS } from "./trois-ponts-i2-data";
import { VIEW } from "./presentation";
import { INFIRMARY } from "./bruel-recovery";
import { smallPrint, smallWidth } from "./small-lettering";

// One distinct background per room. I1 remains the original layout study.
export const TP_ROOM_ART: Record<number, [string, number]> = {
  300: ["pro-backgrounds", 0],
  301: ["tp-i2-entree", 0],
  302: ["tp-i2-entree", 1],
  303: ["tp-i2-entree", 2],
  304: ["tp-i2-entree", 3],
  305: ["tp-i2-aile-t", 0],
  306: ["tp-i2-aile-t", 1],
  307: ["tp-i2-aile-t", 2],
  308: ["tp-i2-aile-t", 3],
  309: ["tp-i2-annexes", 3],
  310: ["tp-i2-cour", 0],
  311: ["tp-i2-ateliers", 2],
  312: ["tp-i2-ateliers", 1],
  313: ["tp-i2-ateliers", 3],
  314: ["tp-i2-annexes", 0],
  315: ["hanouna-h1-infirmerie", 0],
  316: ["tp-i2-annexes", 1],
  317: ["tp-i2-annexes", 2],
};
export const TP_CLASS_DOOR = { x: 245, y: 49, width: 40, height: 92 };

// Align drawn thresholds with the validated input regions. Door bands retain
// their width; only the quiet wall between them expands or contracts.
export const TP_PORTALS: Record<number, [number, number][]> = {
  301: [[233, 180]],
  303: [
    [68, 60],
    [243, 250],
  ],
  304: [
    [44, 60],
    [188, 180],
  ],
  305: [[94, 70]],
  307: [[214, 191]],
  310: [
    [88, 70],
    [173, 160],
  ],
  311: [[205, 180]],
  312: [
    [107, 70],
    [282, 250],
  ],
  313: [[276, 250]],
  314: [[74, 60]],
  316: [[64, 60]],
  317: [[48, 35]],
};

export class TroisPontsI2Art {
  background: Phaser.GameObjects.Image;
  nurse: Phaser.GameObjects.Image;
  ink: Phaser.GameObjects.Graphics;
  ambient: Phaser.GameObjects.Graphics;
  panels: Phaser.GameObjects.Image[] = [];
  continuation: Phaser.GameObjects.Image;
  private bands: Record<number, { frame: string; x: number; width: number }[]> =
    {};
  static preload(scene: Phaser.Scene) {
    for (const [key, data] of Object.entries(TROIS_PONTS_I2_DATA))
      scene.load.image("tp-i2-" + key, data);
  }
  constructor(scene: Phaser.Scene) {
    for (const [key, crops] of Object.entries(TP_CROPS)) {
      const texture = scene.textures.get("tp-i2-" + key);
      crops.forEach(([x, y, w, h], frame) => texture.add(frame, 0, x, y, w, h));
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    for (const [id, portals] of Object.entries(TP_PORTALS)) {
      const [key, frame] = TP_ROOM_ART[Number(id)],
        crop = TP_CROPS[key.slice(6)][frame];
      const points: [number, number][] = [[0, 0]];
      for (const [source, target] of portals) {
        points.push(
          [source - VIEW.x - 16, target - VIEW.x - 16],
          [source - VIEW.x + 16, target - VIEW.x + 16],
        );
      }
      points.push([VIEW.width, VIEW.width]);
      this.bands[Number(id)] = [];
      for (let n = 0; n < points.length - 1; n++) {
        const [a, b] = points[n],
          [c, d] = points[n + 1];
        const x = Math.round(crop[0] + (a / VIEW.width) * crop[2]),
          end = Math.round(crop[0] + (c / VIEW.width) * crop[2]),
          name = `tp-room-${id}-${n}`;
        scene.textures.get(key).add(name, 0, x, crop[1], end - x, crop[3]);
        this.bands[Number(id)].push({
          frame: name,
          x: VIEW.x + b,
          width: d - b,
        });
      }
    }
    for (let n = 0; n < 6; n++)
      this.panels.push(
        scene.add
          .image(0, 0, "tp-i2-entree", 0)
          .setOrigin(0)
          .setDepth(1.09)
          .setVisible(false),
      );
    scene.textures
      .get("tp-i2-aile-t")
      .add("tp-jonction-right", 0, 1550, 0, 122, 434);
    this.continuation = scene.add
      .image(285, VIEW.y, "tp-i2-aile-t", "tp-jonction-right")
      .setOrigin(0)
      .setDisplaySize(28, VIEW.height)
      .setDepth(1.11)
      .setVisible(false);
    this.background = scene.add
      .image(VIEW.x, VIEW.y, "tp-i2-entree", 0)
      .setOrigin(0)
      .setDisplaySize(VIEW.width, VIEW.height)
      .setDepth(1.09);
    this.nurse = scene.add
      .image(INFIRMARY.nurseX, VIEW.floor, "infirmary-nurse")
      .setOrigin(0.5, 0.986)
      .setDisplaySize(86, 86)
      .setDepth(2);
    this.ink = scene.add.graphics().setDepth(1.88);
    this.ambient = scene.add.graphics().setDepth(1.2);
    this.hide();
  }
  hide() {
    this.background.setVisible(false);
    for (const panel of this.panels) panel.setVisible(false);
    this.continuation.setVisible(false);
    this.nurse.setVisible(false);
    this.ink.clear();
    this.ambient.clear();
  }
  plate(cx: number, y: number, lines: string[], primary = false) {
    const w = Math.max(24, ...lines.map((s) => smallWidth(s) + 10)),
      h = lines.length * 8 + 6;
    const x = Math.max(9, Math.min(310 - w, Math.round(cx - w / 2))),
      g = this.ink;
    g.fillStyle(0x080d13);
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(primary ? 0xcec1a3 : 0xa6aa99);
    g.fillRect(x, y, w, h);
    g.fillStyle(0x526064);
    g.fillRect(x, y + h - 1, w, 1);
    g.fillStyle(0x343c3c);
    g.fillRect(x + 2, y + 2, 1, 1);
    g.fillRect(x + w - 3, y + 2, 1, 1);
    lines.forEach((s, n) => smallPrint(g, x + 5, y + 4 + n * 8, s, 0x21302e));
  }
  render(r: RoomSpec, openingAge?: number, clock = 0) {
    this.hide();
    const view = TP_ROOM_ART[r.id];
    if (!view) return;
    this.background
      .setTexture(...view)
      .setDisplaySize(VIEW.width, VIEW.height)
      .setVisible(true);
    if (this.bands[r.id]) {
      this.background.setVisible(false);
      this.bands[r.id].forEach((band, n) =>
        this.panels[n]
          .setTexture(view[0], band.frame)
          .setPosition(band.x, VIEW.y)
          .setDisplaySize(band.width, VIEW.height)
          .setVisible(true),
      );
    }
    this.nurse.setVisible(!!r.care);
    this.continuation.setVisible(r.id === 305);
    if (r.id === 300)
      this.plate(98, 35, ["LYCEE PROFESSIONNEL", "DES TROIS-PONTS"], true);
    if (r.care) {
      this.plate(55, 34, ["COULOIR DE SOINS"]);
      return;
    }
    const signs = (r.exits ?? []).map((e) => {
      const lines = e.label
        .replace(/^(GAUCHE|DROITE|HAUT|BAS) : /, "")
        .split(" / ")
        .slice(0, 2);
      const cx = e.edge ? (e.key === "LEFT" ? 24 : 291) : e.hint![0];
      const w = Math.max(24, ...lines.map((s) => smallWidth(s) + 10));
      return {
        e,
        lines,
        cx,
        x: Math.max(9, Math.min(310 - w, Math.round(cx - w / 2))),
        w,
      };
    });
    for (const { e, lines, cx, x, w } of signs) {
      let y = e.edge ? 12 : 18;
      if (!e.edge)
        for (const edge of signs.filter((s) => s.e.edge))
          if (x < edge.x + edge.w + 2 && x + w + 2 > edge.x)
            y = Math.max(y, 12 + edge.lines.length * 8 + 9);
      // Stair labels stay above their actual opening; controls retain their markers.
      this.plate(cx, y, lines, e.target === 302 || e.target === 303);
    }
    if (r.gaps.length)
      this.plate(r.id === 307 ? 111 : 158, 112, ["SOL FRAGILE"]);
    if (r.id === 309) this.plate(280, 22, ["T03"], true);
    if (r.id === 316) this.plate(193, 30, ["VIE SCOLAIRE"]);
    if (r.id === 309 && openingAge !== undefined) {
      const d = TP_CLASS_DOOR,
        open = Math.min(1, openingAge / 0.7),
        g = this.ink;
      g.fillStyle(0x080d13);
      g.fillRect(d.x, d.y, d.width, d.height);
      g.fillStyle(0x3d4a4a);
      g.fillRect(d.x, d.y, Math.max(2, d.width * (1 - open)), d.height);
    }
    // Tiny leak and ripples sit behind the walking lane; never a gameplay hazard.
    if (r.id === 313 || r.id === 317) {
      const x = r.id === 313 ? 177 : 145,
        t = (clock % 1.8) / 1.8,
        g = this.ambient;
      if (t < 0.85) {
        g.fillStyle(0x819490, 0.75);
        g.fillRect(x, Math.round(26 + t * 115), 1, 2);
      }
      g.fillStyle(0x526e6c, 0.3);
      g.fillRect(x - 5, 146, 11, 1);
    }
  }
}
