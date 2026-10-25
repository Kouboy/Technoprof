import type Phaser from "phaser";
import { CINEMATIC_DATA } from "./cinematic-data";
import { CINEMATIC_INTRO_DATA } from "./cinematic-intro-data";
import { CINEMATIC_APPROVED_DATA } from "./cinematic-approved-data";
import { CINEMATIC, type CinematicSequence } from "./cinematic";
// Approved illustration bytes and audition framing. All narration stays in the images.
export class CinematicArt {
  image: Phaser.GameObjects.Image;
  frame: Phaser.GameObjects.Graphics;
  private sizes = new Map<string, { w: number; h: number }>();
  static preload(scene: Phaser.Scene) {
    scene.load.image("cinematic-storyboard", CINEMATIC_DATA);
    scene.load.image("cinematic-intro-v2", CINEMATIC_INTRO_DATA);
    scene.load.image("cinematic-campus-approved", CINEMATIC_APPROVED_DATA.campus);
    scene.load.image("cinematic-visitor", CINEMATIC_APPROVED_DATA.visitor);
    scene.load.image("cinematic-car", CINEMATIC_APPROVED_DATA.car);
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
    const introFrames = [[4,4,968,760],[990,4,1054,760]];
    introFrames.forEach(([x,y,w,h], i) => {
      intro.add(String(i),0,x,y,w,h);
      this.sizes.set("cinematic-intro-v2:"+i,{w,h});
    });
    intro.setFilter(1);
    const campus = scene.textures.get("cinematic-campus-approved");
    const campusFrames = [[4,4,504,334],[516,4,504,334],[4,346,504,342],[516,346,504,342],
      [4,696,504,374],[516,696,504,374],[4,1078,504,454],[516,1078,504,454]];
    campusFrames.forEach(([x,y,w,h],i) => {
      campus.add(String(i),0,x,y,w,h);
      this.sizes.set("cinematic-campus-approved:"+i,{w,h});
    });
    campus.setFilter(1);
    for(const key of ["cinematic-visitor","cinematic-car"]) {
      const t=scene.textures.get(key), source=t.getSourceImage() as HTMLImageElement;
      const w=source.width-8,h=source.height-8;
      t.add("0",0,4,4,w,h);t.setFilter(1);this.sizes.set(key+":0",{w,h});
    }
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
    g.fillStyle(0x000000);
    g.fillRect(54, 33, 212, 158);
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
    const scale = Math.max(212 / size.w, 158 / size.h);
    const focusY = key === "cinematic-campus-approved" && sequence.frame === 6 ? 0 : 0.5;
    const cropW=212/scale,cropH=158/scale;
    this.image
      .setTexture(key, frame)
      .setDisplaySize(size.w * scale, size.h * scale)
      .setPosition(160,33+size.h*scale/2-(size.h*scale-158)*focusY)
      .setCrop((size.w-cropW)/2,(size.h-cropH)*focusY,cropW,cropH)
      .setVisible(true)
      .setAlpha(sequence.panel.cut ? 1 : Math.min(1, sequence.age / (sequence.kind === "intro" && sequence.index === 0 ? CINEMATIC.openingFadeSeconds : CINEMATIC.fadeSeconds)));
  }
}
