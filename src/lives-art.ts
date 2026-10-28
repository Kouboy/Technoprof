import { addPreparedTexture } from "./prepared-texture";
import Phaser from "phaser";
import { bitmap, bitmapWidth } from "./cadre";
import { LIVES, remainingLives } from "./lives";
import { RADIATION_DATA } from "./radiation-data";

type Ink = Parameters<typeof bitmap>[0];
// Four cardinal silhouette copies give the already-transparent profile a thin
// dark edge. Both displays reuse the teacher atlas prepared by SliceArt.
const OUTLINE = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
function drawLifeNumber(
  g: Ink,
  x: number,
  y: number,
  count: number,
  scale = 1,
) {
  const text = "X " + remainingLives(count);
  for (const [dx, dy] of OUTLINE)
    bitmap(g, x + dx, y + dy, text, 0x080d13, scale);
  bitmap(g, x, y, text, 0xe3d4b3, scale);
}

export class LivesArt {
  ink: Phaser.GameObjects.Graphics;
  stamp: Phaser.GameObjects.Graphics;
  veil: Phaser.GameObjects.Graphics;
  image: Phaser.GameObjects.Image;
  face: Phaser.GameObjects.Image;
  outlines: Phaser.GameObjects.Image[];
  static preload(scene: Phaser.Scene) {
    scene.load.image("radiation", RADIATION_DATA);
  }
  constructor(scene: Phaser.Scene) {
    scene.textures.get("radiation").setFilter(1);
    if (!scene.textures.exists("life-profile")) {
      const canvas = document.createElement("canvas");
      canvas.width = 94;
      canvas.height = 99;
      const context = canvas.getContext("2d", { willReadFrequently: true })!;
      context.drawImage(
        scene.textures.get("prof").getSourceImage() as HTMLCanvasElement,
        163,
        32,
        94,
        99,
        0,
        0,
        94,
        99,
      );
      const pixels = context.getImageData(0, 0, 94, 99);
      // Remove the muted chroma fringe too, without touching the actor atlas.
      for (let i = 0; i < pixels.data.length; i += 4) {
        const r = pixels.data[i],
          g = pixels.data[i + 1],
          b = pixels.data[i + 2];
        if (r > 24 && b > 35 && r > g * 1.12 && b > g * 1.12 && b > r * 0.8)
          pixels.data[i + 3] = 0;
      }
      context.putImageData(pixels, 0, 0);
      const texture = addPreparedTexture(scene, "life-profile", canvas)!;
      texture.add("life-head", 0, 0, 0, 94, 99);
      texture.setFilter(1);
    }
    this.image = scene.add
      .image(0, 0, "radiation")
      .setOrigin(0)
      .setDisplaySize(320, 240)
      .setDepth(4.05)
      .setVisible(false);
    this.ink = scene.add.graphics().setDepth(4.12);
    this.stamp = scene.add
      .graphics()
      .setDepth(4.16)
      .setPosition(160, 148)
      .setAngle(-8);
    this.veil = scene.add.graphics().setDepth(4.19);
    this.outlines = OUTLINE.map(() =>
      scene.add
        .image(0, 0, "life-profile", "life-head")
        .setOrigin(0)
        .setTint(0x080d13)
        .setTintMode(Phaser.TintModes.FILL)
        .setDepth(4.115)
        .setVisible(false),
    );
    this.face = scene.add
      .image(0, 0, "life-profile", "life-head")
      .setOrigin(0)
      .setDepth(4.12)
      .setVisible(false);
  }
  hide() {
    this.ink.clear();
    this.stamp.clear();
    this.veil.clear();
    this.image.setVisible(false);
    this.face.setVisible(false);
    for (const outline of this.outlines) outline.setVisible(false);
  }
  portrait(x: number, y: number, width: number) {
    const height = Math.round((width * 99) / 94);
    this.face
      .setPosition(x, y)
      .setDisplaySize(width, height)
      .setAlpha(1)
      .setVisible(true);
    this.outlines.forEach((outline, i) =>
      outline
        .setPosition(x + OUTLINE[i][0], y + OUTLINE[i][1])
        .setDisplaySize(width, height)
        .setVisible(true),
    );
  }
  hud(count: number) {
    this.portrait(275, 10, 14);
    drawLifeNumber(this.ink, 294, 14, count);
  }
  loss(before: number, after: number, age: number, school = false) {
    const count = age < LIVES.lossChangeAt ? before : after;
    this.portrait(110, 96, 42);
    drawLifeNumber(this.ink, 164, 108, count, 3);
    // Keep the existing decrement beat, sized to the smaller central counter.
    if (age >= LIVES.lossChangeAt && age < LIVES.lossChangeAt + 0.18) {
      this.ink.fillStyle(0xd97561);
      this.ink.fillRect(164, 138, 45, 2);
    }
    const line =
      after > 0
        ? school
          ? "REPRISE ETABLISSEMENT - 2:00"
          : "REPRISE DU TRAJET"
        : "DERNIERE VIE PERDUE";
    bitmap(
      this.ink,
      Math.round(160 - bitmapWidth(line) / 2),
      174,
      line,
      0x82908b,
    );
  }
  radiation(age: number) {
    this.image.setVisible(true).setAlpha(Math.min(1, age / 0.35));
    if (age >= LIVES.stampAt) {
      const g = this.stamp;
      g.setScale(1 + 0.12 * Math.max(0, 1 - (age - LIVES.stampAt) / 0.13));
      g.fillStyle(0x080d13, 0.82);
      g.fillRect(-115, -33, 230, 66);
      g.fillStyle(0xb94e3c);
      g.fillRect(-112, -30, 224, 3);
      g.fillRect(-112, 27, 224, 3);
      g.fillRect(-112, -30, 3, 60);
      g.fillRect(109, -30, 3, 60);
      g.fillRect(-106, -24, 212, 1);
      g.fillRect(-106, 23, 212, 1);
      bitmap(
        g,
        Math.round(-bitmapWidth("RADIE", 5) / 2),
        -17,
        "RADIE",
        0xd25d47,
        5,
      );
      // Acute accent over the final E, placed on the same pixel grid.
      g.fillStyle(0xd25d47);
      g.fillRect(56, -25, 5, 3);
      g.fillRect(52, -22, 5, 3);
      g.fillStyle(0x080d13, 0.45);
      for (const [x, y, w] of [
        [-98, -28, 11],
        [-58, 5, 16],
        [24, -6, 12],
        [81, 27, 9],
      ])
        g.fillRect(x, y, w, 1);
    }
    const fade = Math.max(
      0,
      (age - (LIVES.radiationSeconds - LIVES.fadeSeconds)) / LIVES.fadeSeconds,
    );
    if (fade > 0) {
      this.veil.fillStyle(0x000000, Math.min(1, fade));
      this.veil.fillRect(0, 0, 320, 240);
    }
  }
}
