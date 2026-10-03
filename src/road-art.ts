import { daylight } from "./presentation";
import { SKY_DATA } from "./sky-data";
import Phaser from "phaser";
import { ROAD_DATA } from "./road-data";
import { VERGE_DATA } from "./verge-data";
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
  verge: [
    [40, 10, 460, 480],
    [515, 152, 553, 338],
    [1074, 46, 452, 447],
    [88, 502, 360, 490],
    [512, 506, 542, 501],
    [1062, 698, 460, 290],
  ],
};
export const VERGE = { zoneLength: 720, visible: 720, bridgeBehind: 48 };
export const ROAD_VIEWS: Record<string, number> = {
  road: 140,
  "road-housing": 240,
  "road-civic": 780,
  "road-green": 1450,
  "road-workshops": 2250,
  "road-bridge": 340,
  "road-steel": 1070,
  "road-under": 408,
};
export function vergeZone(z: number) {
  return Math.floor(Math.max(0, z) / VERGE.zoneLength) % 4;
}
export function openAddress(id: number) {
  return vergeZone(id * 30 + 18) === 2 || id % 10 >= 8;
}
export type Scenery = {
  d: number;
  lane: number;
  kind: number;
  variant?: number;
  z?: number;
  id?: number;
};
export function districtAnchors(travel: number, district = "mixed") {
  const result: Scenery[] = [];
  const add = (z: number, lane: number, kind: number, variant = 0, id = 0) => {
    const d = z - travel;
    if (d >= (kind === 6 ? -VERGE.bridgeBehind : -30) && d <= VERGE.visible)
      result.push({ d, lane, kind, variant, z, id });
  };
  for (
    let id = Math.max(0, Math.floor(travel / 30) - 3);
    id <= Math.floor(travel / 30) + 25;
    id++
  ) {
    const z = id * 30 + 18;
    const side = Math.floor(id / 3) % 2 === 0 ? -1 : 1;
    const zone =
      district === "urban" ? 1 : district === "industrial" ? 3 : vergeZone(z);
    if (id % 2 === 0 && !openAddress(id)) {
      if (zone === 0 && id % 6 !== 2) add(z, side * 2.05, 1, 0, id);
      else
        add(
          z,
          side * (zone === 1 ? 2.5 : 2.1),
          7,
          zone === 1 ? (id % 6 === 0 ? 0 : 1) : 2,
          id,
        );
      if (id % 4 === 0) add(z + 9, -side * 1.95, 5, 0, id);
    }
    if (zone === 2 && id % 3 !== 1) add(z + 4, side * 1.85, 7, 4, id);
    if (zone !== 2 && id % 7 === 5) add(z + 4, side * 2.35, 7, 4, id);
    if (id % 4 === 0) add(z + 12, id % 8 === 0 ? -1.4 : 1.4, 4, 0, id);
    if (zone !== 2 && id % 14 === 3) add(z + 15, side * 1.75, 2, 0, id);
    if (id % 11 === 6) add(z + 7, -side * 1.7, 7, 5, id);
    if (id % 60 === 38) add(z + 8, -side * 3.1, 7, 3, id);
    if (id % 24 === 12) add(z + 10, 0, 6, Math.floor(id / 24) % 2, id);
  }
  return result;
}
export class RoadArt {
  images: Phaser.GameObjects.Image[] = [];
  clouds: Phaser.GameObjects.Image;
  skyline: Phaser.GameObjects.Image;
  horizonLight?: Phaser.GameObjects.Graphics;
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
    this.horizonLight = scene.add.graphics().setDepth(3.0015);
    for (const key of ["traffic", "district", "verge"] as const) {
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
    scene.load.image("raw-verge", VERGE_DATA);
  }
  sky(horizon: number, bend: number, clock: number, mission = 0) {
    const glow = this.horizonLight;
    glow?.clear();
    if (glow) {
      for (let y = 7; y < horizon; y++) {
        const p = (y - 7) / (horizon - 7);
        glow.fillStyle(
          mission === 2 ? 0xd68a66 : mission === 0 ? 0xd7b786 : 0xf9e4b1,
          (mission === 1 ? 0.1 : 0.38) * p * p,
        );
        glow.fillRect(7, y, 306, 1);
      }
    }
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
    this.horizonLight?.clear();
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
    key: "traffic" | "district" | "verge",
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
        key === "traffic"
          ? (806 - ROAD_FRAMES.traffic[frame][1]) / h
          : key === "verge"
            ? ([488, 485, 490, 985, 993, 977][frame] -
                ROAD_FRAMES.verge[frame][1]) /
              h
            : 1,
      )
      .setPosition(x, y)
      .setDisplaySize(width, (width * h) / w)
      .setFlipX(flip)
      .setDepth(this.depth + 0.0001)
      .setVisible(true);
  }
}
