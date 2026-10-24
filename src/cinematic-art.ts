import type Phaser from "phaser";
import { CINEMATIC_DATA } from "./cinematic-data";
import { CINEMATIC, type CinematicSequence } from "./cinematic";
// Provisional storyboard atlas, consumed unchanged. All narration stays in the images.
export class CinematicArt {
  image: Phaser.GameObjects.Image;
  frame: Phaser.GameObjects.Graphics;
  static preload(scene: Phaser.Scene) {
    scene.load.image("cinematic-storyboard", CINEMATIC_DATA);
  }
  constructor(scene: Phaser.Scene) {
    const texture = scene.textures.get("cinematic-storyboard");
    const source = texture.getSourceImage() as HTMLImageElement;
    for (let i = 0; i < 11; i++) {
      const x = Math.round(((i % 4) * source.width) / 4) + 4,
        y = Math.round((Math.floor(i / 4) * source.height) / 3) + 4;
      const right = Math.round((((i % 4) + 1) * source.width) / 4) - 4,
        bottom = Math.round(((Math.floor(i / 4) + 1) * source.height) / 3) - 4;
      texture.add(String(i), 0, x, y, right - x, bottom - y);
    }
    texture.setFilter(1);
    this.frame = scene.add.graphics().setDepth(4.18);
    this.image = scene.add
      .image(160, 112, "cinematic-storyboard", "0")
      .setDepth(4.2)
      .setDisplaySize(212, 158)
      .setVisible(false);
  }
  hide() {
    this.image.setVisible(false);
    this.frame.clear();
  }
  render(sequence: CinematicSequence) {
    const g = this.frame;
    g.fillStyle(0x080d13);
    g.fillRect(48, 27, 224, 170);
    g.fillStyle(0x38494c);
    g.fillRect(50, 29, 220, 166);
    g.fillStyle(0x17242c);
    g.fillRect(52, 31, 216, 162);
    for (const x of [51, 267])
      for (const y of [30, 192]) {
        g.fillStyle(0x080d13);
        g.fillRect(x, y, 3, 3);
        g.fillStyle(0x929f9a);
        g.fillRect(x + 1, y + 1, 1, 1);
      }
    this.image
      .setFrame(String(sequence.frame))
      .setDisplaySize(212, 158)
      .setVisible(true)
      .setAlpha(Math.min(1, sequence.age / CINEMATIC.fadeSeconds));
  }
}
