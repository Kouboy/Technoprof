import { daylight } from "./presentation";
import { SKY_DATA } from "./sky-data";
import Phaser from "phaser";
import { ROAD_DATA } from "./road-data";
import { VERGE_DATA } from "./verge-data";
import { smallPrint } from "./small-lettering";
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
// Atlas-space bulb centres, shared by both sides and all perspective scales.
const ROAD_BULBS = {
  traffic: [
    [
      [110, 622],
      [407, 622],
    ],
    [
      [620, 615],
      [912, 615],
    ],
    [
      [1100, 669],
      [1425, 669],
    ],
  ],
  district: [[], [], [[436, 580]], []],
};
export const ROAD_LIGHT = {
  trailStart: 110,
  trailMax: 4,
  duskTint: 0xabb0c8,
  beamColor: 0xf2dfb2,
  beamAlpha: 0.045,
  beamReach: 95,
  tail: 0xff573d,
  street: 0xffdfa0,
  haloAlpha: [0, 0.34, 0.13, 0.05],
};
export function roadLightTrail(speed: number) {
  return Math.max(
    0,
    Math.min(ROAD_LIGHT.trailMax, (speed - ROAD_LIGHT.trailStart) / 45),
  );
}
export function roadLightPlacement(
  key: "traffic" | "district",
  frame: number,
  width: number,
  flip = false,
) {
  const [sx, sy, w, h] = ROAD_FRAMES[key][frame];
  return ROAD_BULBS[key][frame].map(([bx, by]) => ({
    dx: ((bx - sx) / w - 0.5) * width * (flip ? -1 : 1),
    dy: (((by - sy) / h - roadSpriteOrigin(key, frame)) * width * h) / w,
    radius: Math.max(0.35, width * (key === "traffic" ? 0.055 : 0.16)),
  }));
}
export function drawRoadLamp(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  trail = 0,
  drift = 0,
) {
  // A tiny stepped halo keeps pixel silhouettes sharp; only light leaves a trail.
  for (let shell = 3; shell >= 1; shell--) {
    g.fillStyle(color, ROAD_LIGHT.haloAlpha[shell]);
    g.fillEllipse(x, y, radius * shell * 2, radius * shell * 1.2);
  }
  if (trail > 0)
    for (let i = 3; i >= 1; i--) {
      g.fillStyle(color, 0.13 / i);
      g.fillRect(
        x - radius * 0.35 - (drift * i) / 3,
        y - (trail * i) / 3,
        Math.max(0.6, radius * 0.7),
        Math.max(0.6, trail / 3),
      );
    }
  g.fillStyle(color, 0.9);
  g.fillRect(x - radius * 0.45, y - 0.4, Math.max(0.7, radius * 0.9), 0.8);
}
export const ROAD_VIEWS: Record<string, number> = {
  road: 140,
  "road-housing": 240,
  "road-civic": 780,
  "road-green": 1450,
  "road-workshops": 2250,
  "road-bridge": 340,
  "road-steel": 1070,
  "road-under": 408,
  "road-lights": 140,
  "road-publicite": 317,
  "road-publicite-ecole": 5957,
  "road-publicite-gauche": 8717,
  "road-publicite-facade": 2168,
  "road-affiches": 947,
  "road-graffiti": 578,
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
// Tiny local atlas: surface details, not replacement buildings. Wordmarks remain
// upright on both sides of the road; only their mounting position is reflected.
export const ROAD_PATCH_FRAMES: Record<
  string,
  [number, number, number, number]
> = {
  ad0: [0, 0, 96, 48],
  ad1: [100, 0, 96, 48],
  poster0: [0, 52, 32, 34],
  poster1: [36, 52, 32, 34],
  graffiti0: [0, 90, 72, 22],
  graffiti1: [76, 90, 72, 22],
};
const ROAD_PATCH_SLOTS: Record<
  string,
  Record<string, [number, number, number, number]>
> = {
  // Centre, bottom, maximum width/height in the source frame. Keep doors,
  // windows, drainpipes and the building's outer silhouette intact.
  "district/0": {
    poster: [0.44, 0.89, 0.11, 0.23],
    graffiti: [0.39, 0.97, 0.17, 0.08],
  },
  "district/3": {
    ad: [0.46, 0.92, 0.65, 0.84],
    poster: [0.28, 0.9, 0.16, 0.53],
    graffiti: [0.58, 0.91, 0.47, 0.4],
  },
  "verge/0": {
    poster: [0.57, 0.65, 0.11, 0.18],
    graffiti: [0.81, 0.94, 0.17, 0.1],
  },
  "verge/1": {
    poster: [0.22, 0.86, 0.16, 0.23],
    graffiti: [0.8, 0.94, 0.2, 0.12],
  },
  "verge/2": {
    ad: [0.63, 0.81, 0.4, 0.4],
    poster: [0.12, 0.72, 0.13, 0.21],
    graffiti: [0.64, 0.84, 0.4, 0.14],
  },
};
export function roadDecoration(
  id: number | undefined,
  key: string,
  frame: number,
) {
  const slots = ROAD_PATCH_SLOTS[`${key}/${frame}`];
  if (id === undefined || !slots) return undefined;
  let h =
    Math.imul(id + 17, 0x45d9f3b) ^
    Math.imul(frame + (key === "verge" ? 13 : 1), 0x27d4eb2d);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  const bucket = h % 100,
    variant = (h >>> 12) % 2;
  if (slots.ad && bucket < 9) return "ad" + variant;
  if (bucket >= 12 && bucket < 28) return "poster" + variant;
  if (bucket >= 31 && bucket < 43) return "graffiti" + variant;
  return undefined;
}
export function roadPatchPlacement(
  key: string,
  frame: number,
  tag: string,
  width: number,
  flip: boolean,
) {
  const kind = tag.replace(/[01]$/, ""),
    slot = ROAD_PATCH_SLOTS[`${key}/${frame}`][kind];
  const source = ROAD_FRAMES[key as "district" | "verge"][frame];
  const patch = ROAD_PATCH_FRAMES[tag],
    height = (width * source[3]) / source[2];
  const scale = Math.min(
    (width * slot[2]) / patch[2],
    (height * slot[3]) / patch[3],
  );
  return {
    dx: (slot[0] - 0.5) * width * (flip ? -1 : 1),
    bottom: (slot[1] - roadSpriteOrigin(key, frame)) * height,
    width: patch[2] * scale,
    height: patch[3] * scale,
  };
}
export function roadSpriteOrigin(key: string, frame: number) {
  const source = ROAD_FRAMES[key as keyof typeof ROAD_FRAMES][frame];
  return key === "traffic"
    ? (806 - source[1]) / source[3]
    : key === "verge"
      ? ([488, 485, 490, 985, 993, 977][frame] - source[1]) / source[3]
      : 1;
}
export function paintRoadPatch(
  g: Parameters<typeof smallPrint>[0],
  tag: string,
) {
  const r = (x: number, y: number, w: number, h: number, c: number) => {
    g.fillStyle(c);
    g.fillRect(x, y, w, h);
  };
  const text = (x: number, y: number, s: string, c: number, scale = 1) =>
    smallPrint(
      {
        fillStyle: (v) => g.fillStyle(v),
        fillRect: (a, b, w, h) =>
          g.fillRect(x + a * scale, y + b * scale, w * scale, h * scale),
      },
      0,
      0,
      s,
      c,
    );
  if (tag.startsWith("ad")) {
    r(1, 2, 95, 46, 0x272e2c);
    r(0, 0, 95, 46, 0x747264);
    r(2, 2, 91, 42, 0xb4aa8b);
    r(2, 2, 91, 2, 0xd1c09c);
    r(2, 41, 91, 3, 0x8a826c);
    if (tag === "ad0") {
      text(8, 3, "L'ECOLE DE", 0x303f3a, 2);
      text(20, 13, "DEMAIN", 0x303f3a, 2);
      text(12, 24, "LIVRAISON", 0x6d493f, 2);
      text(16, 34, "REPORTEE", 0x6d493f, 2);
    } else {
      text(8, 6, "EXCELLENCE", 0x4e4a39, 2);
      text(18, 23, "A CREDIT", 0x795347, 2);
      r(12, 38, 70, 1, 0x807660);
      r(19, 40, 58, 1, 0x9c9277);
    }
    for (const x of [3, 90]) {
      r(x, 3, 2, 2, 0x444c44);
      r(x, 41, 2, 2, 0x444c44);
    }
    r(0, 32, 2, 6, 0x6f624e);
    r(86, 44, 6, 2, 0x5a594b);
  } else if (tag.startsWith("poster")) {
    r(1, 3, 22, 28, 0x6e7060);
    r(0, 2, 21, 27, 0xa79f84);
    r(10, 7, 22, 27, 0xbfb294);
    r(11, 8, 20, 1, 0xd0c4a1);
    r(9, 6, 6, 2, 0x938c70);
    r(25, 6, 5, 2, 0xc1b38d);
    if (tag === "poster0") {
      text(12, 11, "UN", 0x4b584d);
      text(12, 18, "PROF", 0x4b584d);
    } else {
      r(1, 7, 30, 25, 0xbfb294);
      text(3, 11, "BUDGET", 0x4b584d);
      text(3, 18, "GELE", 0x4b584d);
    }
    r(13, 26, 15, 1, 0x8b896e);
    r(13, 29, 10, 1, 0x8b896e);
    r(26, 32, 6, 2, 0x6e7060);
  } else {
    const c = tag === "graffiti0" ? 0x38483e : 0x443b32;
    text(2, 2, tag === "graffiti0" ? "DES PROFS" : "TOUT VA BIEN", c);
    text(4, 10, tag === "graffiti0" ? "PAS DES PROMESSES" : "SUR LE PAPIER", c);
    r(4, 17, 52, 1, c);
    r(7, 18, 40, 1, c);
    r(56, 18, 1, 3, c);
  }
}
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
  lightImages: Phaser.GameObjects.Image[] = [];
  lightIndex = 0;
  viewportMask?: Phaser.Display.Masks.GeometryMask;
  world?: Phaser.GameObjects.Container;
  index = 0;
  depth = 3.01;
  mission = 0;
  installViewportMask() {
    // Phaser 4 ignores geometry masks in WebGL. Keep the existing Canvas
    // clipping, without allocating a hidden shape or invoking an unsupported
    // API on the normal WebGL path. Its rendered output is unchanged.
    if (this.scene.game.renderer.type !== Phaser.CANVAS) return;
    this.viewportMask = this.scene.add
      .graphics()
      .fillStyle(0xffffff)
      .fillRect(7, 7, 306, 168)
      .setVisible(false)
      .createGeometryMask();
    this.world?.setMask(this.viewportMask);
  }
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
    // Children retain one shared world and their exact depth order.
    // The player car and the CADRE remain outside this depth band.
    this.world = scene.add.container(0, 0).setDepth(3.01);
    this.installViewportMask();
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
    const marks = document.createElement("canvas");
    marks.width = 196;
    marks.height = 112;
    const ctx = marks.getContext("2d")!;
    const ink = {
      fillStyle(c: number) {
        ctx.fillStyle = "#" + c.toString(16).padStart(6, "0");
      },
      fillRect(x: number, y: number, w: number, h: number) {
        ctx.fillRect(x, y, w, h);
      },
    };
    for (const [tag, [x, y, w, h]] of Object.entries(ROAD_PATCH_FRAMES)) {
      ctx.save();
      ctx.translate(x, y);
      paintRoadPatch(ink, tag);
      ctx.restore();
    }
    const marksTexture = scene.textures.addCanvas("road-patches", marks)!;
    for (const [tag, [x, y, w, h]] of Object.entries(ROAD_PATCH_FRAMES))
      marksTexture.add(tag, 0, x, y, w, h);
    marksTexture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    // The three halo rings and street pool are immutable. Rasterise once instead
    // of tessellating separate masked Graphics for every lamp on every frame.
    const lights = document.createElement("canvas");
    lights.width = 96;
    lights.height = 116;
    const lc = lights.getContext("2d")!;
    for (let shell = 3; shell >= 1; shell--) {
      lc.fillStyle = `rgba(255,255,255,${ROAD_LIGHT.haloAlpha[shell]})`;
      lc.beginPath();
      lc.ellipse(16, 10, shell * 5, shell * 3, 0, 0, Math.PI * 2);
      lc.fill();
    }
    lc.fillStyle = "white";
    lc.fillRect(34, 0, 1, 1);
    lc.save();
    lc.translate(64, 108);
    const bulb = roadLightPlacement("district", 2, 29)[0];
    lc.fillStyle = "rgba(255,255,255,0.035)";
    lc.beginPath();
    lc.moveTo(bulb.dx, bulb.dy);
    lc.lineTo(bulb.dx + 29 * 0.24 - 29 * 0.4, 0);
    lc.lineTo(bulb.dx + 29 * 0.24 + 29 * 0.4, 0);
    lc.closePath();
    lc.fill();
    lc.fillStyle = "rgba(255,255,255,0.1)";
    lc.beginPath();
    lc.ellipse(bulb.dx + 29 * 0.24, -0.5, 29 / 2, 29 * 0.08, 0, 0, Math.PI * 2);
    lc.fill();
    lc.restore();
    const lighting = scene.textures.addCanvas("road-lights", lights)!;
    lighting.add("halo", 0, 0, 0, 32, 20);
    lighting.add("pixel", 0, 34, 0, 1, 1);
    lighting.add("pool", 0, 32, 20, 64, 96);
    lighting.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  static preload(scene: Phaser.Scene) {
    scene.load.image("sky", SKY_DATA);
    for (const key of ["traffic", "district"] as const)
      scene.load.image("raw-" + key, ROAD_DATA[key]);
    scene.load.image("raw-verge", VERGE_DATA);
  }
  sky(horizon: number, bend: number, clock: number, mission = 0) {
    this.mission = mission;
    const glow = this.horizonLight;
    glow?.clear();
    if (glow) {
      for (let y = 7; y < horizon; y++) {
        const p = (y - 7) / (horizon - 7);
        glow.fillStyle(
          mission === 3 ? 0x496075 : mission === 2 ? 0xd68a66 : mission === 0 ? 0xd7b786 : 0xf9e4b1,
          (mission === 3 ? 0.07 : mission === 1 ? 0.1 : 0.38) * p * p,
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
    this.world?.setVisible(false);
    this.horizonLight?.clear();
    this.clouds?.setVisible(false);
    this.skyline?.setVisible(false);
    this.index = 0;
    this.images.forEach((s) => s.setVisible(false));
    this.layers.forEach((g) => g.clear());
    this.lightIndex = 0;
    this.lightImages?.forEach((s) => s.setVisible(false));
  }
  lights(
    key: "traffic" | "district",
    frame: number,
    x: number,
    y: number,
    width: number,
    flip: boolean,
    mission: number,
    speed: number,
  ) {
    if (mission < 2 || (key === "district" && frame !== 2)) return;
    const bulbs = roadLightPlacement(key, frame, width, flip);
    if (!bulbs.length) return;
    if (key === "district")
      this.lightImage(
        "pool",
        x,
        y,
        (64 * width) / 29,
        (96 * width) / 29,
        ROAD_LIGHT.street,
        1,
        flip,
        0.5,
        88 / 96,
      );
    for (const bulb of bulbs) {
      const bx = x + bulb.dx,
        by = y + bulb.dy,
        color = key === "traffic" ? ROAD_LIGHT.tail : ROAD_LIGHT.street,
        r = bulb.radius;
      this.lightImage("halo", bx, by, r * 6.4, r * 4, color);
      const trail = roadLightTrail(speed) * Math.min(1, width / 29);
      const drift = ((bx - 160) * trail) / 130;
      if (trail > 0)
        for (let i = 3; i >= 1; i--)
          this.lightImage(
            "pixel",
            bx - r * 0.35 - (drift * i) / 3,
            by - (trail * i) / 3,
            Math.max(0.6, r * 0.7),
            Math.max(0.6, trail / 3),
            color,
            0.13 / i,
            false,
            0,
            0,
          );
      this.lightImage(
        "pixel",
        bx - r * 0.45,
        by - 0.4,
        Math.max(0.7, r * 0.9),
        0.8,
        color,
        0.9,
        false,
        0,
        0,
      );
    }
  }
  private lightImage(
    frame: string,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    alpha = 1,
    flip = false,
    ox = 0.5,
    oy = 0.5,
  ) {
    const s =
      this.lightImages[this.lightIndex] ??
      (this.lightImages[this.lightIndex] = this.newImage("road-lights", frame));
    this.lightIndex++;
    s.setTexture("road-lights", frame)
      .setPosition(x, y)
      .setDisplaySize(w, h)
      .setOrigin(ox, oy)
      .setFlipX(flip)
      .setTint(color)
      .setAlpha(alpha)
      .setDepth(this.depth + 0.0003)
      .setVisible(true);
  }
  layer(order: number) {
    this.depth = 3.01 + order * 0.001;
    const g = this.layers[order] ?? (this.layers[order] = this.newGraphics());
    return g.setDepth(this.depth);
  }
  private newGraphics() {
    const g = this.scene.add.graphics();
    this.world?.add(g);
    return g;
  }
  private newImage(key: string, frame: number | string) {
    const image = this.scene.add.image(0, 0, key, frame);
    this.world?.add(image);
    return image;
  }
  finishFrame() {
    this.world?.sort("depth");
    this.world?.setVisible(true);
  }
  draw(
    key: "traffic" | "district" | "verge",
    frame: number,
    x: number,
    y: number,
    width: number,
    flip = false,
    id?: number,
  ) {
    const s =
      this.images[this.index] ??
      (this.images[this.index] = this.newImage(key, frame).setOrigin(0.5, 1));
    this.index++;
    const [, , w, h] = ROAD_FRAMES[key][frame];
    s.setTexture(key, frame)
      .setOrigin(0.5, roadSpriteOrigin(key, frame))
      .setPosition(x, y)
      .setDisplaySize(width, (width * h) / w)
      .setFlipX(flip)
      .setTint(this.mission === 3 ? 0x8094ad : this.mission === 2 ? ROAD_LIGHT.duskTint : 0xffffff)
      .setDepth(this.depth + 0.0001)
      .setVisible(true);
    const tag = roadDecoration(id, key, frame);
    if (tag) {
      const p = roadPatchPlacement(key, frame, tag, width, flip);
      const patch =
        this.images[this.index] ??
        (this.images[this.index] = this.newImage("road-patches", tag));
      this.index++;
      patch
        .setTexture("road-patches", tag)
        .setOrigin(0.5, 1)
        .setPosition(x + p.dx, y + p.bottom)
        .setDisplaySize(p.width, p.height)
        .setFlipX(false)
        .setTint(this.mission === 3 ? 0x8094ad : this.mission === 2 ? ROAD_LIGHT.duskTint : 0xffffff)
        .setDepth(this.depth + 0.0002)
        .setVisible(true);
    }
  }
}
