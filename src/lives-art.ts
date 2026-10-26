import type Phaser from "phaser";
import { bitmap, bitmapWidth } from "./cadre";
import { LIVES, remainingLives } from "./lives";
import { RADIATION_DATA } from "./radiation-data";

type Ink = Parameters<typeof bitmap>[0];
// Hand-placed pixels, like the existing HUD glyphs: hair, glasses, tired face,
// grey stubble and an old coat collar. No generated high-resolution head crop.
const HEAD = [
  "....333.3.......",
  "..33444333......",
  ".33444444333....",
  ".344443333333...",
  "3343355555333...",
  ".333555555553...",
  ".335511511555...",
  ".335171171555...",
  "..35111111155...",
  "..35556555555...",
  "...556665555....",
  "...55322555.....",
  "....523325......",
  "....523335......",
  "...11222211.....",
  "..1881551881....",
  ".188811188881...",
];
const COLORS: Record<string, number> = {
  "1": 0x10171b,
  "2": 0x68675e,
  "3": 0x91918a,
  "4": 0xbcb9a5,
  "5": 0xc39f75,
  "6": 0x956c50,
  "7": 0xb1c7bc,
  "8": 0x66503b,
};
export function drawLifeCount(
  g: Ink,
  x: number,
  y: number,
  count: number,
  scale = 1,
) {
  HEAD.forEach((row, dy) =>
    [...row].forEach((pixel, dx) => {
      if (pixel === ".") return;
      g.fillStyle(COLORS[pixel]);
      g.fillRect(x + dx * scale, y + dy * scale, scale, scale);
    }),
  );
  bitmap(
    g,
    x + 20 * scale,
    y + 5 * scale,
    "X " + remainingLives(count),
    0xe3d4b3,
    scale,
  );
}

export class LivesArt {
  ink: Phaser.GameObjects.Graphics;
  stamp: Phaser.GameObjects.Graphics;
  veil: Phaser.GameObjects.Graphics;
  image: Phaser.GameObjects.Image;
  static preload(scene: Phaser.Scene) {
    scene.load.image("radiation", RADIATION_DATA);
  }
  constructor(scene: Phaser.Scene) {
    scene.textures.get("radiation").setFilter(1);
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
  }
  hide() {
    this.ink.clear();
    this.stamp.clear();
    this.veil.clear();
    this.image.setVisible(false);
  }
  hud(count: number) {
    const g = this.ink;
    g.fillStyle(0x080d13, 0.92);
    g.fillRect(264, 8, 47, 24);
    g.fillStyle(0x52605b);
    g.fillRect(265, 8, 45, 1);
    g.fillStyle(0x24333b);
    g.fillRect(264, 31, 47, 1);
    drawLifeCount(g, 267, 11, count);
  }
  loss(before: number, after: number, age: number) {
    const count = age < LIVES.lossChangeAt ? before : after;
    drawLifeCount(this.ink, 86, 83, count, 4);
    // A brief red cut at the exact decrement makes the loss unambiguous.
    if (age >= LIVES.lossChangeAt && age < LIVES.lossChangeAt + 0.18) {
      this.ink.fillStyle(0xd97561);
      this.ink.fillRect(165, 139, 64, 2);
    }
    const line = after > 0 ? "REPRISE DU TRAJET" : "DERNIERE VIE PERDUE";
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
