import { smallPrint, smallWidth } from "./small-lettering";
import { ENCOUNTER_SECONDS } from "./world";
import Phaser from "phaser";
import { WARNINGS_DATA } from "./warnings-data";
import { SCHOOL_PROPS_DATA } from "./school-props-data";
import { bitmap, bitmapWidth } from "./cadre";
import { BLOCKED_EDGES } from "./world";
// Source images are untouched. Outlines exclude the generator's opaque backdrop.
export const PROP_FRAMES = [
  [50, 68, 510, 870],
  [713, 140, 692, 165],
  [582, 520, 918, 422],
];
export const PROP_OUTLINES = [
  [
    [80, 69],
    [113, 69],
    [118, 86],
    [497, 86],
    [498, 69],
    [530, 69],
    [532, 203],
    [545, 203],
    [560, 230],
    [532, 257],
    [532, 731],
    [548, 760],
    [530, 780],
    [546, 884],
    [546, 936],
    [64, 936],
    [64, 888],
    [78, 854],
    [78, 788],
    [50, 758],
    [77, 724],
    [78, 491],
    [67, 481],
    [69, 458],
    [79, 453],
    [80, 249],
    [61, 225],
    [79, 199],
  ],
  [
    [731, 142],
    [1387, 142],
    [1403, 157],
    [1403, 289],
    [1390, 301],
    [728, 301],
    [715, 289],
    [715, 157],
  ],
  [
    [651, 521],
    [1414, 521],
    [1431, 558],
    [1498, 704],
    [1470, 708],
    [1497, 856],
    [1465, 856],
    [1489, 916],
    [1388, 915],
    [1385, 938],
    [847, 939],
    [848, 919],
    [762, 919],
    [761, 886],
    [635, 887],
    [634, 831],
    [596, 831],
    [626, 739],
    [582, 728],
    [606, 668],
  ],
];
export const SIGNS: Record<number, [number, number, number, string[]][]> = {
  0: [[234, 72, 74, ["BATIMENT C >"]]],
  1: [[170, 35, 83, ["ESCALIERS >"]]],
  2: [
    [22, 48, 99, ["< ANNEXE", "42C PAR LE 2E"]],
    [118, 116, 76, ["ACCES FERME"]],
  ],
  3: [[202, 55, 103, ["SALLE 42C >"]]],
  5: [[165, 75, 93, ["2E ETAGE >", "VERS AILE C"]]],
  6: [[162, 47, 121, ["SERVICE / 1ER >", "BADGE OBLIGATOIRE"]]],
  7: [[90, 47, 126, ["< PASSERELLE / 2E", "AILE C / 1ER >"]]],
  8: [[228, 58, 79, ["AILE C >", "SOL FRAGILE"]]],
};
export const DOOR_LABELS: Record<number, [number, number, string][]> = {
  1: [[54, 43, "ANNEXE"]],
  2: [[252, 43, "TECHNIQUE"]],
  3: [
    [41, 43, "SERVICE"],
    [168, 43, "40C"],
    [257, 43, "41C"],
  ],
  4: [[291, 43, "42C"]],
  5: [[47, 40, "HALL"]],
  6: [[53, 43, "ANNEXE"]],
  7: [
    [32, 40, "2E"],
    [276, 40, "1ER"],
  ],
  8: [[53, 43, "RETOUR"]],
};
// The patch lies wholly on the visible floor strip (feet 159, backdrop ends 175).
// Its rear tiles begin at the feet; its front lip is farther DOWN the screen.
export const HOLE_BACK_Y = 159;
export const HOLE_DEPTH = 16;
export const HOLE_FRONT_Y = HOLE_BACK_Y + (305 / 422) * HOLE_DEPTH;
export function holeLayout(left: number, right: number) {
  const scale = (right - left) / 500;
  return {
    x: left - (790 - 582) * scale,
    y: HOLE_BACK_Y,
    w: 918 * scale,
    h: HOLE_DEPTH,
  };
}
export function fallingCrop(
  frameHeight: number,
  originY: number,
  scale: number,
  feet: number,
) {
  return Math.max(
    0,
    Math.min(
      frameHeight,
      originY * frameHeight + (HOLE_FRONT_Y - feet) / Math.abs(scale),
    ),
  );
}
export class SchoolProps {
  sprites: Phaser.GameObjects.Image[] = [];
  used = 0;
  lettering: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    const raw = scene.textures
      .get("raw-school-props-36")
      .getSourceImage() as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = raw.width;
    canvas.height = raw.height;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    for (const outline of PROP_OUTLINES) {
      ctx.moveTo(outline[0][0], outline[0][1]);
      for (const [x, y] of outline.slice(1)) ctx.lineTo(x, y);
      ctx.closePath();
    }
    ctx.clip();
    ctx.drawImage(raw, 0, 0);
    const texture = scene.textures.addCanvas("school-props-36", canvas)!;
    PROP_FRAMES.forEach(([x, y, w, h], i) => texture.add(i, 0, x, y, w, h));
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const warningSource = scene.textures
      .get("raw-warnings-37")
      .getSourceImage() as HTMLImageElement;
    const warningCanvas = document.createElement("canvas");
    warningCanvas.width = warningSource.width;
    warningCanvas.height = warningSource.height;
    const wc = warningCanvas.getContext("2d")!;
    const outlines = [
      [
        [111, 891],
        [116, 851],
        [202, 772],
        [309, 94],
        [331, 87],
        [390, 91],
        [401, 114],
        [495, 780],
        [560, 800],
        [575, 845],
        [476, 938],
        [453, 941],
        [119, 902],
      ],
      [
        [843, 880],
        [971, 246],
        [979, 192],
        [990, 171],
        [1040, 165],
        [1060, 160],
        [1193, 168],
        [1211, 179],
        [1272, 180],
        [1293, 202],
        [1418, 864],
        [1414, 879],
        [1363, 876],
        [1338, 870],
        [1324, 827],
        [1260, 817],
        [1257, 934],
        [1244, 946],
        [1150, 932],
        [1137, 854],
        [954, 826],
        [929, 901],
        [915, 907],
        [850, 897],
      ],
      [
        [1067, 211],
        [1197, 222],
        [1190, 262],
        [1070, 253],
      ],
      [
        [1266, 754],
        [1307, 772],
        [1297, 701],
        [1270, 570],
      ],
    ];
    wc.beginPath();
    for (const points of outlines) {
      wc.moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) wc.lineTo(x, y);
      wc.closePath();
    }
    wc.clip("evenodd");
    wc.drawImage(warningSource, 0, 0);
    const warnings = scene.textures.addCanvas("warnings-37", warningCanvas)!;
    warnings.add(0, 0, 108, 85, 470, 860);
    warnings.add(1, 0, 840, 158, 582, 790);
    warnings.setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (let i = 0; i < 24; i++)
      this.sprites.push(
        scene.add
          .image(0, 0, "school-props-36", 0)
          .setOrigin(0)
          .setVisible(false),
      );
    this.lettering = scene.add.graphics().setDepth(1.85);
    this.hide();
  }
  static preload(scene: Phaser.Scene) {
    scene.load.image("raw-school-props-36", SCHOOL_PROPS_DATA);
    scene.load.image("raw-warnings-37", WARNINGS_DATA);
  }
  hide() {
    this.used = 0;
    this.sprites.forEach((s) => s.setVisible(false));
    this.lettering.clear();
  }
  prop(
    frame: number,
    x: number,
    y: number,
    w: number,
    h: number,
    depth: number,
    flip = false,
  ) {
    return this.sprites[this.used++]
      .setTexture(
        frame >= 3 ? "warnings-37" : "school-props-36",
        frame >= 3 ? frame - 3 : frame,
      )
      .setCrop()
      .setTint(0xffffff)
      .setPosition(x, y)
      .setDisplaySize(w, h)
      .setDepth(depth)
      .setFlipX(flip)
      .setVisible(true);
  }
  render(
    room: number,
    gaps: number[][],
    teacher?: Phaser.GameObjects.Image,
    falling = false,
    feet = 159,
  ) {
    for (const side of BLOCKED_EDGES[room] ?? []) {
      this.prop(
        0,
        side === "left" ? 7 : 287,
        52,
        26,
        108,
        1.8,
        side === "right",
      );
      const left = side === "left";
      this.prop(3, left ? 9 : 298, 133, 15, 27, 2.2);
      this.prop(4, left ? 22 : 278, 132, 20, 28, 2.2);
    }
    if (room === 2) this.prop(4, 145, 131, 21, 29, 2.2);
    for (const [left, right] of gaps) {
      const p = holeLayout(left, right);
      this.prop(2, p.x, p.y, p.w, p.h, 1.4);
      // The front rubble lip occludes the falling body; the void itself stays behind it.
      this.prop(2, p.x, p.y, p.w, p.h, 2.1).setCrop(0, 305, 918, 117);
    }
    if (teacher && falling) {
      const h = fallingCrop(
        teacher.frame.height,
        teacher.originY,
        teacher.scaleY,
        feet,
      );
      teacher.setCrop(0, 0, teacher.frame.width, h);
    }
    for (const [x, y, w, lines] of SIGNS[room] ?? []) {
      const plateW = Math.max(
        44,
        ...lines.map((line) => smallWidth(line) + 14),
      );
      const h = lines.length > 1 ? 20 : 13;
      const left = Math.round(x + (w - plateW) / 2);
      this.prop(1, left, y, plateW, h, 1.7).setTint(0xbdb8a5);
      lines.forEach((line, i) =>
        smallPrint(
          this.lettering,
          left + Math.floor((plateW - smallWidth(line)) / 2),
          y + 4 + i * 8,
          line,
          0x343931,
        ),
      );
    }
    for (const [x, y, label] of DOOR_LABELS[room] ?? [])
      bitmap(
        this.lettering,
        x,
        y,
        label,
        room === 4 ? 0xe3d4b3 : 0x141e27,
        0.5,
        48,
      );
  }
}
export const ENCOUNTERS: Record<number, { name: string; pages: string[][] }> = {
  1: {
    name: "PARENT D'ELEVE",
    pages: [
      ["Une semaine sans cours !", "Encore un remplacant ?"],
      ["Vous n'irez pas plus loin", "sans me repondre."],
    ],
  },
  3: {
    name: "ELEVE",
    pages: [
      ["Mon pere preside les parents.", "Il fera sauter votre contrat."],
      ["Retirez ce zero,", "et je vous laisse passer."],
    ],
  },
  6: {
    name: "VIGILE",
    pages: [
      ["Consigne de la direction :", "votre badge est hors liste."],
      ["Titulaire ou remplacant,", "vous faites demi-tour."],
    ],
  },
  4: {
    name: "INSPECTEUR",
    pages: [
      ["Votre retard sera consigne", "dans mon rapport."],
      ["Un avis defavorable,", "et votre poste saute."],
    ],
  },
};
export function dialogueLayout(
  room: number,
  remaining: number,
  speakerX: number,
) {
  const data = ENCOUNTERS[room];
  if (!data) return;
  const page = remaining > ENCOUNTER_SECONDS / 2 ? 0 : 1,
    lines = data.pages[page];
  const w = Math.max(112, ...lines.map((l) => smallWidth(l) + 20));
  const x = Math.max(12, Math.min(308 - w, speakerX - w * 0.6));
  return {
    name: data.name,
    lines,
    x,
    y: room === 4 ? 4 : 15,
    w,
    h: 32,
    tail: Math.max(x + 14, Math.min(x + w - 14, speakerX)),
    mouthX: Math.max(15, Math.min(305, speakerX - 9)),
    mouthY: room === 4 ? 62 : room === 3 ? 90 : 80,
  };
}
export function drawDialogue(
  g: Phaser.GameObjects.Graphics,
  room: number,
  remaining: number,
  speakerX: number,
) {
  const b = dialogueLayout(room, remaining, speakerX);
  if (!b) return;
  const poly = (points: number[], color: number) => {
    g.fillStyle(color);
    g.beginPath();
    g.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2)
      g.lineTo(points[i], points[i + 1]);
    g.closePath();
    g.fillPath();
  };
  const { x, y, w, h } = b;
  poly(
    [
      x + 7,
      y - 2,
      x + w - 5,
      y - 2,
      x + w + 2,
      y + 5,
      x + w + 2,
      y + h - 5,
      x + w - 5,
      y + h + 2,
      b.tail + 7,
      y + h + 2,
      b.mouthX,
      b.mouthY,
      b.tail - 6,
      y + h + 2,
      x + 5,
      y + h + 2,
      x - 2,
      y + h - 6,
      x - 2,
      y + 5,
    ],
    0x080d13,
  );
  poly(
    [
      x + 7,
      y,
      x + w - 5,
      y,
      x + w,
      y + 6,
      x + w,
      y + h - 6,
      x + w - 6,
      y + h,
      b.tail + 5,
      y + h,
      b.mouthX,
      b.mouthY - 4,
      b.tail - 4,
      y + h,
      x + 6,
      y + h,
      x,
      y + h - 6,
      x,
      y + 6,
    ],
    0xe3d4b3,
  );
  bitmap(g, x + 10, y + 5, b.name, 0x854538, 0.5, w - 20);
  b.lines.forEach((line, i) =>
    smallPrint(g, x + 10, y + 14 + i * 8, line, 0x141e27),
  );
}
