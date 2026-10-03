import Phaser from "phaser";
import { HALL_DATA } from "./hall-data";
export const PARENT_FRAMES = [
  [20, 160, 372, 620, 157],
  [403, 160, 345, 620, 570],
  [755, 250, 440, 530, 979],
  [1195, 200, 320, 580, 1355],
];
export class HallArt {
  background: Phaser.GameObjects.Image;
  parent: Phaser.GameObjects.Image;
  constructor(scene: Phaser.Scene) {
    const bg = scene.textures.get("hall");
    const img = bg.getSourceImage() as HTMLImageElement;
    bg.add("floor", 0, 0, 0, img.width, Math.round(img.height * 0.75));
    bg.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.background = scene.add
      .image(7, 7, "hall", "floor")
      .setOrigin(0)
      .setDisplaySize(306, 168)
      .setDepth(1);
    const source = scene.textures
      .get("raw-parent")
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
    const texture = scene.textures.addCanvas("parent", canvas)!;
    PARENT_FRAMES.forEach(([x, y, w, h], i) => texture.add(i, 0, x, y, w, h));
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.parent = scene.add.image(0, 0, "parent", 0).setDepth(2);
    this.hide();
  }
  static preload(scene: Phaser.Scene) {
    scene.load.image("hall", HALL_DATA.hall);
    scene.load.image("raw-parent", HALL_DATA.parent);
  }
  hide() {
    this.background.setVisible(false);
    this.parent.setVisible(false);
  }
  pose(frame: number, x: number, facing: number) {
    const [left, top, w, h, anchor] = PARENT_FRAMES[frame];
    this.parent
      .setTexture("parent", frame)
      .setOrigin((anchor - left) / w, (773 - top) / h)
      .setPosition(x, 159)
      .setScale(0.14 * facing, 0.14)
      .setVisible(true);
  }
}
