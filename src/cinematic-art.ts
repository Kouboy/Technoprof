import type Phaser from "phaser";
import { CINEMATIC_DATA } from "./cinematic-data";
import { CINEMATIC_INTRO_DATA } from "./cinematic-intro-data";
import { CINEMATIC_CAMPUS_DATA } from "./cinematic-campus-data";
import { CINEMATIC, type CinematicSequence } from "./cinematic";
// Provisional storyboard atlas, consumed unchanged. All narration stays in the images.
export class CinematicArt {
  image: Phaser.GameObjects.Image;
  frame: Phaser.GameObjects.Graphics;
  private sizes = new Map<string, { w: number; h: number }>();
  static preload(scene: Phaser.Scene) {
    scene.load.image("cinematic-storyboard", CINEMATIC_DATA);
    scene.load.image("cinematic-intro-v2", CINEMATIC_INTRO_DATA);
    scene.load.image("cinematic-campus-v2", CINEMATIC_CAMPUS_DATA);
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
      this.sizes.set("cinematic-storyboard:" + i, { w: right - x, h: bottom - y });
    }
    texture.setFilter(1);
    const intro = scene.textures.get("cinematic-intro-v2");
    const introSource = intro.getSourceImage() as HTMLImageElement;
    // The generated diptych seam is at x=980/2048, not the geometric midpoint.
    const seam = Math.round(introSource.width * 980 / 2048);
    for (let i = 0; i < 2; i++) {
      const x = i === 0 ? 4 : seam + 4;
      const right = i === 0 ? seam - 4 : introSource.width - 4;
      const w = right - x, h = introSource.height - 8;
      intro.add(String(i), 0, x, 4, w, h);
      this.sizes.set("cinematic-intro-v2:" + i, { w, h });
    }
    intro.setFilter(1);
    const campus = scene.textures.get("cinematic-campus-v2");
    const campusSource = campus.getSourceImage() as HTMLImageElement;
    for (let i = 0; i < 3; i++) {
      const x = Math.round(i * campusSource.width / 3) + 4;
      const right = Math.round((i + 1) * campusSource.width / 3) - 4;
      const w = right - x, h = campusSource.height - 8;
      campus.add(String(i), 0, x, 4, w, h);
      this.sizes.set("cinematic-campus-v2:" + i, { w, h });
    }
    campus.setFilter(1);
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
    const key = sequence.panel.texture;
    const frame = String(sequence.panel.frame);
    const size = this.sizes.get(key + ":" + frame)!;
    const scale = Math.min(212 / size.w, 158 / size.h);
    this.image
      .setTexture(key, frame)
      .setDisplaySize(size.w * scale, size.h * scale)
      .setVisible(true)
      .setAlpha(Math.min(1, sequence.age / CINEMATIC.fadeSeconds));
  }
}
