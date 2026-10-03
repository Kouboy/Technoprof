import { daylight } from "./presentation";
import { SKY_DATA } from "./sky-data";
import Phaser from "phaser";
import { ROAD_DATA } from "./road-data";
export const ROAD_FRAMES = {
  traffic: [
    [28, 450, 473, 362],
    [558, 450, 420, 362],
    [1010, 181, 508, 631],
  ],
  district: [
    [42, 10, 746, 540],
    [830, 124, 642, 424],
    [265, 556, 210, 452],
    [602, 660, 911, 323],
  ],
};
export function openAddress(id: number) {
  return id % 10 >= 6;
}
export function districtAnchors(travel: number) {
  const result: { d: number; lane: number; kind: number }[] = [];
  const add = (z: number, lane: number, kind: number) => {
    const d = z - travel;
    if (d >= 0 && d <= 540) result.push({ d, lane, kind });
  };
  for (
    let id = Math.max(0, Math.floor(travel / 30) - 2);
    id <= Math.floor(travel / 30) + 18;
    id++
  ) {
    const z = id * 30 + 18;
    const side = Math.floor(id / 3) % 2 === 0 ? -1 : 1;
    if (!openAddress(id) && id % 7 !== 3) add(z, side * 1.95, 1);
    if (!openAddress(id)) add(z + 8, -side * 1.8, 5);
    if (id % 2 === 0) add(z + 12, id % 4 === 0 ? -1.25 : 1.25, 4);
    if (id % 8 === 3) add(z + 15, side * 1.38, 2);
    if (id % 18 === 12) add(z + 10, 0, 6);
  }
  return result;
}
export class RoadArt {
  images: Phaser.GameObjects.Image[] = [];
  clouds: Phaser.GameObjects.Image;
  skyline: Phaser.GameObjects.Image;
  layers: Phaser.GameObjects.Graphics[] = [];
  index = 0;
  depth = 3.01;
  constructor(private scene: Phaser.Scene) {
    const sky = scene.textures.get("sky");
    const sourceSky = sky.getSourceImage() as HTMLImageElement;
    const split = Math.floor(sourceSky.height * 0.82);
    sky.add("clouds", 0, 0, 0, sourceSky.width, split);
    sky.add("skyline", 0, 0, split, sourceSky.width, sourceSky.height - split);
    sky.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.clouds = scene.add
      .image(0, 0, "sky", "clouds")
      .setOrigin(0)
      .setDepth(3.001)

      .setVisible(false);
    this.skyline = scene.add
      .image(0, 0, "sky", "skyline")
      .setOrigin(0)
      .setDepth(3.002)

      .setVisible(false);
    for (const key of ["traffic", "district"] as const) {
      const source = scene.textures
        .get("raw-" + key)
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
      const texture = scene.textures.addCanvas(key, canvas)!;
      ROAD_FRAMES[key].forEach(([x, y, w, h], i) =>
        texture.add(i, 0, x, y, w, h),
      );
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }
  static preload(scene: Phaser.Scene) {
    scene.load.image("sky", SKY_DATA);
    for (const key of ["traffic", "district"] as const)
      scene.load.image("raw-" + key, ROAD_DATA[key]);
  }
  sky(horizon: number, bend: number, clock: number, mission = 0) {
    const cloudHeight = (horizon - 7) * 0.82;
    this.clouds
      .setTint(daylight(mission).sky)
      .setPosition(-10 + Math.sin(clock / 90) * 6 - bend * 0.025, 7)
      .setDisplaySize(340, cloudHeight)
      .setVisible(true);
    this.skyline
      .setTint(daylight(mission).background)
      .setPosition(-10 - bend * 0.1, 7 + cloudHeight)
      .setDisplaySize(340, horizon - 7 - cloudHeight + 1)
      .setVisible(true);
  }
  hide() {
    this.clouds?.setVisible(false);
    this.skyline?.setVisible(false);
    this.index = 0;
    this.images.forEach((s) => s.setVisible(false));
    this.layers.forEach((g) => g.clear());
  }
  layer(order: number) {
    this.depth = 3.01 + order * 0.001;
    const g =
      this.layers[order] ?? (this.layers[order] = this.scene.add.graphics());
    return g.setDepth(this.depth);
  }
  draw(
    key: "traffic" | "district",
    frame: number,
    x: number,
    y: number,
    width: number,
    flip = false,
  ) {
    const s =
      this.images[this.index] ??
      (this.images[this.index] = this.scene.add
        .image(0, 0, key, frame)
        .setOrigin(0.5, 1));
    this.index++;
    const [, , w, h] = ROAD_FRAMES[key][frame];
    s.setTexture(key, frame)
      // Reused images can change atlas dimensions between district and traffic.
      // Re-anchor after changing the frame, at the tires rather than transparent padding.
      .setOrigin(
        0.5,
        key === "traffic" ? (806 - ROAD_FRAMES.traffic[frame][1]) / h : 1,
      )
      .setPosition(x, y)
      .setDisplaySize(width, (width * h) / w)
      .setFlipX(flip)
      .setDepth(this.depth + 0.0001)
      .setVisible(true);
  }
}
