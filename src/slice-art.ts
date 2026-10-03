import Phaser from "phaser";
import { ART_DATA } from "./art-data";
import { INSPECTRICE_DATA } from "./inspectrice-data";
import { INSPECTRICE_OUTLINES } from "./inspectrice-mask";
import type { Enemy } from "./world";
import { teacherPose, enemyPose, type TeacherState } from "./combat-poses";

// Source rectangles deliberately follow the drawn silhouettes rather than an
// assumed regular grid: the extended book crosses the generated cell boundary.
export const POSES = {
  prof: [
    [40, 20, 260, 480, 176, 489],
    [390, 20, 330, 480, 558, 489],
    [805, 20, 270, 480, 949, 489],
    [1170, 20, 350, 480, 1350, 489],
    [25, 515, 330, 490, 199, 985],
    [378, 560, 460, 445, 552, 985],
    [840, 550, 280, 455, 970, 985],
    [1195, 515, 315, 405, 1360, 970],
  ],
  inspecteur: [
    [35, 20, 330, 480, 202, 488],
    [420, 20, 330, 480, 582, 488],
    [815, 20, 335, 480, 970, 488],
    [1195, 20, 330, 480, 1355, 488],
    [20, 520, 335, 485, 194, 985],
    [360, 585, 410, 420, 555, 985],
    [780, 545, 390, 460, 887, 985],
    [1220, 555, 295, 450, 1370, 985],
  ],
};

export class SliceArt {
  backdrop: Phaser.GameObjects.Image;
  door: Phaser.GameObjects.Graphics;
  teacher: Phaser.GameObjects.Image;
  inspector: Phaser.GameObjects.Image;
  inspectorFemale = false;
  constructor(private scene: Phaser.Scene) {
    for (const role of ["prof", "inspecteur", "inspectrice"] as const) {
      const source = scene.textures
        .get(`raw-${role}`)
        .getSourceImage() as HTMLImageElement;
      const atlas = document.createElement("canvas");
      atlas.width = source.width;
      atlas.height = source.height;
      const ctx = atlas.getContext("2d", { willReadFrequently: true })!;
      if (role === "inspectrice") {
        ctx.beginPath();
        for (const points of INSPECTRICE_OUTLINES) {
          ctx.moveTo(points[0][0], points[0][1]);
          for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
          ctx.closePath();
        }
        ctx.clip();
      }
      ctx.drawImage(source, 0, 0);
      const pixels = ctx.getImageData(0, 0, atlas.width, atlas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const [r, g, b] = pixels.data.subarray(i, i + 3);
        // Runtime colour key. No altered source image is written to disk.
        if (r > 110 && b > 100 && r > g * 1.6 && b > g * 1.6)
          pixels.data[i + 3] = 0;
      }
      ctx.putImageData(pixels, 0, 0);
      const texture = scene.textures.addCanvas(role, atlas)!;
      POSES[role === "inspectrice" ? "inspecteur" : role].forEach(
        ([x, y, w, h], index) => texture.add(index, 0, x, y, w, h),
      );
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.backdrop = scene.add
      .image(7, 7, "corridor")
      .setOrigin(0)
      .setDisplaySize(306, 168)
      .setDepth(1);
    this.door = scene.add.graphics().setDepth(1.5);
    this.teacher = scene.add.image(0, 0, "prof", 0).setDepth(2);
    this.inspector = scene.add.image(0, 0, "inspecteur", 0).setDepth(2);
    this.hide();
  }
  static preload(scene: Phaser.Scene) {
    scene.load.image("corridor", ART_DATA.corridor);
    scene.load.image("raw-prof", ART_DATA.prof);
    scene.load.image("raw-inspecteur", ART_DATA.inspecteur);
    scene.load.image("raw-inspectrice", INSPECTRICE_DATA);
  }
  hide() {
    this.door?.clear();
    this.backdrop.setVisible(false);
    this.teacher.setVisible(false).setDepth(2);
    this.inspector.setVisible(false);
  }
  pose(
    role: "prof" | "inspecteur",
    frame: number,
    x: number,
    y: number,
    facing: number,
  ) {
    const sprite = role === "prof" ? this.teacher : this.inspector;
    const [left, top, width, height, anchorX, anchorY] = POSES[role][frame];
    // Inspector's first generated guard faces left; all other frames face right.
    const flip = role === "inspecteur" && frame === 0 ? facing > 0 : facing < 0;
    sprite
      .setTexture(
        role === "inspecteur" && this.inspectorFemale ? "inspectrice" : role,
        frame,
      )
      .setOrigin((anchorX - left) / width, (anchorY - top) / height)
      .setPosition(x, y)
      .setScale(
        (role === "prof" ? 0.225 : 0.238) * (flip ? -1 : 1),
        role === "prof" ? 0.225 : 0.238,
      )
      .setFlipX(false)
      .setAngle(0)
      .setVisible(true);
    return sprite;
  }
  drawTeacher(state: TeacherState, scale = 0.225) {
    const p = teacherPose(state);
    return this.pose("prof", p.frame, p.x, p.y, state.face)
      .setScale(scale * state.face, scale)
      .setAngle(p.angle)
      .setAlpha(p.alpha);
  }
  reactEnemy(sprite: Phaser.GameObjects.Image, enemy: Enemy, facing: number) {
    const p = enemyPose(enemy, facing);
    sprite.setPosition(p.x, p.y).setAngle(p.angle).setAlpha(p.alpha);
  }
  render(state: {
    px: number;
    py: number;
    face: number;
    attack: number;
    walkClock: number;
    ambienceClock: number;
    inv: number;
    phase: string;
    age: number;
    openingFrom?: number;
    playerRecovery?: number;
    playerHitDirection?: number;
    bookBlocked?: number;
    keys: Record<string, { isDown: boolean }>;
    enemies: Enemy[];
  }) {
    this.backdrop.setVisible(true);
    this.drawTeacher(state);
    for (const enemy of state.enemies)
      if (enemy.boss && (enemy.hp > 0 || (enemy.downTime ?? 0) > 0)) {
        this.inspectorFemale = !!enemy.female;
        const movingEnemy =
          state.phase === "school" &&
          enemy.stun <= 0 &&
          enemy.recovery <= 0 &&
          enemy.wind <= 0 &&
          Math.abs(state.px - enemy.x) > 58;
        const frame =
          enemy.hp <= 0 || enemy.stun > 0
            ? 7
            : enemy.wind > 0
              ? 4
              : (enemy.strikeTime ?? 0) > 0
                ? enemy.pattern % 2 === 0
                  ? 6
                  : 5
                : enemy.recovery > 0
                  ? 7
                  : movingEnemy
                    ? [1, 2, 3, 2][Math.floor((enemy.walk ?? 0) / 8) % 4]
                    : 0;
        const facing =
          enemy.wind > 0 ||
          enemy.recovery > 0 ||
          enemy.stun > 0 ||
          enemy.hp <= 0
            ? (enemy.facing ?? (state.px < enemy.x ? -1 : 1))
            : state.px < enemy.x
              ? -1
              : 1;
        this.pose("inspecteur", frame, enemy.x, 159, facing);
        this.reactEnemy(this.inspector, enemy, facing);
      }
    if (state.phase === "opening") {
      const t = state.age;
      const open = Math.min(1, t / 0.7);
      this.door.fillStyle(0x080d13);
      this.door.fillRect(258, 25, 49, 112);
      this.door.fillStyle(0x66523a);
      this.door.fillRect(258, 25, Math.max(3, 49 * (1 - open)), 112);
      const walk = Math.max(0, Math.min(1, (t - 0.6) / 1.1));
      const direction = (state.openingFrom ?? state.px) > 281 ? -1 : 1;
      const actor = this.pose(
        "prof",
        walk > 0 && walk < 1 ? [1, 2, 3, 2][Math.floor(t * 8) % 4] : 0,
        (state.openingFrom ?? state.px) +
          (281 - (state.openingFrom ?? state.px)) * walk,
        159 - 22 * walk,
        direction,
      );
      const depth = 1 - 0.13 * walk;
      actor
        .setScale(actor.scaleX * depth, actor.scaleY * depth)
        .setAlpha(1 - Math.max(0, Math.min(1, (t - 1.7) / 0.7)));
    }
  }
}
