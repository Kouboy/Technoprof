import Phaser from "phaser";
import { CAR_DATA } from "./car-data";
import { CAR_RIGHT_DATA } from "./car-right-data";

// Hand-picked bounds preserve the antenna and tires in all four source views.
export const CAR_FRAMES = [
  [40, 318, 355, 334],
  [450, 318, 410, 338],
  [890, 334, 620, 314],
  [430, 232, 660, 526],
];
export const CAR_BODY_HEIGHTS = [288, 292, 266, 458];
export const CAR_FEET = [646, 650, 641, 752];
export const CAR_ATTACHMENTS = [
  [
    [88, 544],
    [343, 544],
    [123, 613],
  ],
  [
    [587, 546],
    [819, 547],
    [609, 615],
  ],
  [],
  [
    [498, 585],
    [887, 589],
    [556, 695],
  ],
];
// Runtime silhouette excludes the generated backdrop; the source remains intact.
export const RIGHT_OUTLINE = [
  [740, 236],
  [747, 236],
  [746, 289],
  [879, 294],
  [929, 298],
  [966, 307],
  [982, 324],
  [1037, 401],
  [1074, 401],
  [1086, 409],
  [1085, 435],
  [1064, 442],
  [1074, 464],
  [1080, 514],
  [1088, 524],
  [1088, 552],
  [1080, 560],
  [1081, 632],
  [1075, 650],
  [1060, 668],
  [1037, 675],
  [1018, 669],
  [995, 649],
  [991, 691],
  [986, 736],
  [969, 751],
  [924, 754],
  [907, 744],
  [897, 694],
  [845, 700],
  [592, 692],
  [566, 704],
  [539, 702],
  [537, 729],
  [521, 744],
  [486, 746],
  [465, 735],
  [458, 707],
  [454, 662],
  [437, 652],
  [432, 638],
  [433, 615],
  [445, 604],
  [445, 543],
  [450, 519],
  [461, 487],
  [529, 349],
  [538, 329],
  [554, 316],
  [584, 306],
  [619, 301],
  [702, 295],
  [736, 294],
];
export class CarArt {
  sprite: Phaser.GameObjects.Image;
  turn = 0;
  rearFrame = 0;
  drawX = 160;
  drawY = 170;
  lean = 0;
  constructor(scene: Phaser.Scene) {
    const source = scene.textures
      .get("raw-service")
      .getSourceImage() as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const [r, g, b] = pixels.data.subarray(i, i + 3);
      if (r > 110 && b > 100 && r > g * 1.6 && b > g * 1.6)
        pixels.data[i + 3] = 0;
    }
    ctx.putImageData(pixels, 0, 0);
    const texture = scene.textures.addCanvas("service", canvas)!;
    CAR_FRAMES.slice(0, 3).forEach(([x, y, w, h], i) =>
      texture.add(i, 0, x, y, w, h),
    );
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const rightSource = scene.textures
      .get("raw-service-right")
      .getSourceImage() as HTMLImageElement;
    const rightCanvas = document.createElement("canvas");
    rightCanvas.width = rightSource.width;
    rightCanvas.height = rightSource.height;
    const rc = rightCanvas.getContext("2d")!;
    rc.beginPath();
    rc.moveTo(RIGHT_OUTLINE[0][0], RIGHT_OUTLINE[0][1]);
    for (const [x, y] of RIGHT_OUTLINE.slice(1)) rc.lineTo(x, y);
    rc.closePath();
    rc.clip();
    rc.drawImage(rightSource, 0, 0);
    const rt = scene.textures.addCanvas("service-right", rightCanvas)!;
    const [rx, ry, rw, rh] = CAR_FRAMES[3];
    rt.add(3, 0, rx, ry, rw, rh);
    rt.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.sprite = scene.add
      .image(0, 0, "service", 0)
      .setOrigin(0.5, 1)
      .setDepth(3.1)
      .setVisible(false);
  }
  static preload(scene: Phaser.Scene) {
    scene.load.image("raw-service", CAR_DATA);
    scene.load.image("raw-service-right", CAR_RIGHT_DATA);
  }
  hide() {
    this.sprite.setVisible(false);
  }
  rear(
    x: number,
    speed: number,
    steering: number,
    clock: number,
    damage: number,
  ) {
    // Hysteresis avoids changing views repeatedly around the steering threshold.
    if (Math.abs(steering) > 0.28) this.turn = Math.sign(steering);
    else if (Math.abs(steering) < 0.12) this.turn = 0;
    const frame = this.turn === 0 ? 0 : this.turn < 0 ? 1 : 3;
    this.rearFrame = frame;
    const [, , w, h] = CAR_FRAMES[frame];
    const bounce =
      speed > 5
        ? Math.sin(clock * (9 + speed * 0.025)) * (damage < 40 ? 0.65 : 0.25)
        : 0;
    this.drawX = x;
    this.drawY = 170 + bounce;
    this.lean = Math.max(-1.5, Math.min(1.5, steering * 1.2));
    this.sprite
      .setTexture(frame === 3 ? "service-right" : "service", frame)
      .setVisible(true)
      .setFlipX(false)
      .setOrigin(0.5, (CAR_FEET[frame] - CAR_FRAMES[frame][1]) / h)
      .setPosition(x, 170 + bounce)
      .setDisplaySize(
        (w * 34) / CAR_BODY_HEIGHTS[frame],
        (h * 34) / CAR_BODY_HEIGHTS[frame],
      )
      .setAngle(this.lean)
      .setAlpha(1);
  }
  anchor(kind: "leftLamp" | "rightLamp" | "exhaust") {
    const index = kind === "leftLamp" ? 0 : kind === "rightLamp" ? 1 : 2;
    const f = this.rearFrame,
      [sx, sy] = CAR_ATTACHMENTS[f][index];
    const [fx, , fw] = CAR_FRAMES[f],
      scale = 34 / CAR_BODY_HEIGHTS[f];
    const dx = (sx - fx - fw / 2) * scale,
      dy = (sy - CAR_FEET[f]) * scale;
    const angle = (this.lean * Math.PI) / 180;
    return {
      x: this.drawX + dx * Math.cos(angle) - dy * Math.sin(angle),
      y: this.drawY + dx * Math.sin(angle) + dy * Math.cos(angle),
    };
  }
  side(x: number) {
    this.sprite
      .setTexture("service", 2)
      .setVisible(true)
      .setFlipX(false)
      .setOrigin(0.5, (CAR_FEET[2] - CAR_FRAMES[2][1]) / CAR_FRAMES[2][3])
      .setPosition(x, 153)
      .setDisplaySize(
        (620 * 40) / CAR_BODY_HEIGHTS[2],
        (314 * 40) / CAR_BODY_HEIGHTS[2],
      )
      .setAngle(0)
      .setAlpha(1);
  }
}
