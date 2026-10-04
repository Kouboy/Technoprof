import Phaser from "phaser";
import { QUIET_SCHOOL_DATA } from "./quiet-school-data";
import { NEW_SCHOOL_DATA } from "./new-school-data";
import { roomSpec, type RoomSpec } from "./missions";
import { smallPrint, smallWidth } from "./small-lettering";
import type { SliceArt } from "./slice-art";
import { STUDENT_FRAMES } from "./wing-art";
import { GUARD_FRAMES } from "./bridge-art";
import type { CarArt } from "./car-art";
import type { Enemy } from "./world";
import { newEnemyFrame, type TeacherState } from "./combat-poses";
import { SECURITY } from "./gameplay";

type ArtHost = TeacherState & {
  mission: number;
  room: number;
  enemies: Enemy[];
  art?: SliceArt;
  carArt?: CarArt;
  age: number;
  phase: string;
  openingFrom: number;
  projectiles: { x: number; dir: number; life: number }[];
};
// Explicit source rectangles and foot anchors preserve the generated pose sizes.
const FRAMES: Record<string, number[][]> = {
  bruel: [
    [0, 0, 384, 512, 195, 489],
    [384, 0, 456, 512, 610, 489],
    [768, 0, 460, 512, 1070, 489],
    [1152, 0, 384, 512, 1360, 489],
    [0, 512, 384, 512, 185, 985],
    [384, 512, 384, 512, 580, 985],
    [768, 512, 432, 512, 980, 985],
    [1152, 512, 384, 512, 1380, 985],
  ],
  pro: [
    [0, 0, 384, 512, 185, 489],
    [384, 0, 432, 512, 574, 489],
    [768, 0, 432, 512, 962, 489],
    [1152, 0, 384, 512, 1360, 489],
    [0, 512, 384, 512, 185, 985],
    [384, 512, 384, 512, 576, 985],
    [768, 512, 432, 512, 980, 985],
    [1152, 512, 384, 512, 1375, 985],
  ],
};
// Generated panel dividers are not at the same row in the two images.
// Exclude neighbouring floor strips and atlas borders from every playable view.
export const BACKGROUND_FRAMES: Record<string, number[][]> = {
  bruel: [
    [0, 0, 833, 469],
    [840, 0, 832, 469],
    [0, 474, 833, 444],
    [840, 474, 832, 444],
  ],
  pro: [
    [0, 0, 833, 490],
    [840, 0, 832, 490],
    [0, 503, 833, 422],
    [840, 503, 832, 422],
  ],
};
// Rectangles occupied by a neighbouring pose, outside this actor's silhouette.
// Original atlas files stay intact; these are runtime extraction masks.
export function poseExclusions(i: number, width: number, height: number) {
  if (i === 1) return [[410, 300, width - 410, height - 300]];
  if (i === 2) return [[0, 0, 85, 190]];
  if (i === 3 || i === 7) return [[0, 0, 70, height]];
  return [];
}
export class NewSchoolArt {
  background: Phaser.GameObjects.Image;
  enemy: Phaser.GameObjects.Image;
  private door: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene) {
    for (const key of ["bruel", "pro"]) {
      const texture = scene.textures.get(key + "-backgrounds");
      const source = texture.getSourceImage() as HTMLImageElement;
      BACKGROUND_FRAMES[key].forEach(([x, y, w, h], i) =>
        texture.add(i, 0, x, y, w, h),
      );
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      const raw = scene.textures
        .get(key + "-enemies")
        .getSourceImage() as HTMLImageElement;
      FRAMES[key].forEach(([x, y, width, height, anchorX, anchorY], i) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        // One long pointing arm crosses the source grid. Keep its neighbouring
        // actor's leg out, while preserving the complete pointing silhouette.
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        for (const [cx, cy, cw, ch] of poseExclusions(i, width, height))
          if (cw > 0 && ch > 0) ctx.rect(cx, cy, cw, ch);
        ctx.clip("evenodd");
        ctx.drawImage(raw, -x, -y);
        const t = scene.textures.addCanvas(key + "-pose-" + i, canvas)!;
        t.setFilter(Phaser.Textures.FilterMode.NEAREST);
      });
    }
    const quiet = scene.textures.get("quiet-backgrounds");
    [
      [0, 0, 833, 469],
      [840, 0, 832, 469],
      [0, 475, 833, 443],
      [840, 475, 832, 443],
    ].forEach(([x, y, w, h], i) => quiet.add(i, 0, x, y, w, h));
    quiet.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.background = scene.add
      .image(7, 7, "bruel-backgrounds", 0)
      .setOrigin(0)
      .setDisplaySize(306, 168)
      .setDepth(1);
    this.enemy = scene.add.image(0, 0, "bruel-pose-0").setDepth(2);
    this.door = scene.add.graphics().setDepth(1.6);
    this.hide();
  }
  static preload(scene: Phaser.Scene) {
    scene.load.image("quiet-backgrounds", QUIET_SCHOOL_DATA);
    for (const [key, data] of Object.entries(NEW_SCHOOL_DATA))
      scene.load.image(key, data);
  }
  hide() {
    this.background.setVisible(false);
    this.enemy.setVisible(false);
    this.door.clear();
  }
  showBackground(mission: number, frame: number) {
    const key = mission === 1 ? "bruel" : "pro";
    this.background
      .setFlipX(false)
      .setTexture(key + "-backgrounds", frame)
      .setDisplaySize(306, 168)
      .setVisible(true);
  }
  render(s: ArtHost, layout?: RoomSpec) {
    const r = layout ?? roomSpec(s.mission, s.room),
      key = s.mission === 1 ? "bruel" : "pro";
    this.background.setDepth(1);
    this.door.setDepth(1.6);
    if (r.quietFrame !== undefined)
      this.background
        .setTexture("quiet-backgrounds", r.quietFrame)
        .setDisplaySize(306, 168)
        .setVisible(true);
    else this.showBackground(s.mission, r.frame ?? 0);
    this.background.setFlipX(!!r.quietMirror);
    if (s.py < 202) s.art?.drawTeacher(s, r.boss ? 0.225 : 0.18);
    const e = s.enemies[0];
    if (e && (e.hp > 0 || (e.downTime ?? 0) > 0)) {
      if (r.role === "student" || r.role === "guard") {
        const frame =
          e.hp <= 0 || e.stun > 0
            ? 3
            : e.wind > 0
              ? 1
              : (e.strikeTime ?? 0) > 0
                ? 2
                : 0;
        const student = r.role === "student";
        const [left, top, w, h, anchor] = (
          student ? STUDENT_FRAMES : GUARD_FRAMES
        )[frame];
        const scale = student ? 0.11 : 0.14;
        this.enemy
          .setTexture(student ? "student-34" : "guard-33", frame)
          .setOrigin((anchor - left) / w, ((student ? 800 : 770) - top) / h)
          .setPosition(e.x, 159)
          .setScale(scale * (e.facing ?? -1), scale)
          .setAngle(0)
          .setAlpha(1)
          .setVisible(true);
      } else {
        const base = r.boss ? 0 : 4;
        const pose = newEnemyFrame(e, !!s.encounterTime);
        const frame = base + pose,
          [x, y, w, h, anchorX, anchorY] = FRAMES[key][frame];
        const facing =
          e.parent && (e.wind > 0 || (e.chargeTime ?? 0) > 0)
            ? (e.chargeDir ?? -1)
            : (e.facing ?? Math.sign(s.px - e.x)) || -1;
        const scale = r.boss ? 0.235 : 0.18;
        this.enemy
          .setTexture(key + "-pose-" + frame)
          .setOrigin((anchorX - x) / w, (anchorY - y) / h)
          .setPosition(e.x, 159)
          .setScale(scale * facing, scale)
          .setAngle(0)
          .setAlpha(1)
          .setVisible(true);
      }
      s.art?.reactEnemy(
        this.enemy,
        e,
        (e.facing ?? Math.sign(s.px - e.x)) || -1,
      );
    }
    if (s.phase === "opening") {
      const open = Math.min(1, s.age / 0.7),
        walk = Math.max(0, Math.min(1, (s.age - 0.6) / 1.1));
      const doorway =
        r.navigation?.revision === "A3"
          ? { x: 256, y: 31, width: 49, height: 114 }
          : { x: 267, y: 39, width: 32, height: 112 };
      this.door.fillStyle(0x080d13);
      this.door.fillRect(doorway.x, doorway.y, doorway.width, doorway.height);
      this.door.fillStyle(s.mission === 1 ? 0x584b39 : 0x3d4a4a);
      this.door.fillRect(
        doorway.x,
        doorway.y,
        Math.max(2, doorway.width * (1 - open)),
        doorway.height,
      );
      const actor = s.art?.pose(
        "prof",
        [1, 2, 3, 2][Math.floor(s.age * 8) % 4],
        s.openingFrom + (281 - s.openingFrom) * walk,
        159 - 20 * walk,
        1,
      );
      actor
        ?.setScale(0.225 * (1 - 0.13 * walk))
        .setAlpha(1 - Math.max(0, Math.min(1, (s.age - 1.7) / 0.7)));
    }
    const g = this.door;
    if (r.boss && e && !s.encounterTime && s.phase === "school") {
      g.fillStyle(0x080d13, 0.9);
      g.fillRect(108, 14, 104, 15);
      g.fillStyle(0x526064);
      g.fillRect(110, 16, 100, 3);
      g.fillStyle(0xb9aa89);
      g.fillRect(110, 16, (100 * Math.max(0, e.hp)) / (r.hp ?? 6), 3);
      const cue =
        e.parentCycle?.phase === "breakaway"
          ? "REPRISE D'APPUI"
          : e.wind > 0
            ? e.parent
              ? "RUEE !"
              : "POUSSEE !"
            : e.parentCycle?.phase === "opening" || e.recovery > 0 || e.stun > 0
              ? "OUVERTURE"
              : e.role === "security"
                ? e.turnTime
                  ? "RETOURNEMENT"
                  : "GARDE DE FACE"
                : "";
      if (cue)
        smallPrint(
          g,
          160 - smallWidth(cue) / 2,
          22,
          cue,
          e.wind > 0 ? 0xe5ae60 : 0xe3d4b3,
        );
    }
    for (const p of s.projectiles) {
      g.fillStyle(0x080d13);
      g.fillRect(p.x - 3, 128, 6, 5);
      g.fillStyle(0xe3d4b3);
      g.fillRect(p.x - 2, 129, 4, 3);
      g.lineStyle(1, 0xb9aa89);
      g.lineBetween(p.x - p.dir * 10, 131, p.x - p.dir * 4, 131);
    }
    if (e?.role === "security" && e.hp > 0 && !s.encounterTime && !e.stun) {
      // A short ground marker shows the committed front without covering faces.
      // Turning uses broken strokes; it never advertises a solid frontal guard.
      const dir = e.facing ?? -1;
      const turning = (e.turnTime ?? 0) > 0;
      const open = e.recovery > 0;
      const markerY = 169;
      if (!open) {
        g.lineStyle(2, 0x080d13);
        g.lineBetween(e.x + dir * 8, markerY, e.x + dir * 24, markerY);
        g.lineStyle(1, e.wind > 0 || turning ? 0xe5ae60 : 0xb9aa89);
        if (turning) {
          const progress = 1 - e.turnTime! / SECURITY.turn;
          for (let i = 0; i < 3; i++) {
            const x = e.x + dir * (8 + i * 6);
            g.lineBetween(x, markerY - progress * 3, x + dir * 3, markerY);
          }
        } else {
          g.lineBetween(e.x + dir * 8, markerY, e.x + dir * 24, markerY);
          g.lineBetween(e.x + dir * 24, markerY, e.x + dir * 20, markerY - 4);
          g.lineBetween(e.x + dir * 24, markerY, e.x + dir * 20, markerY + 4);
        }
      }
    }
  }
  arrival(s: ArtHost) {
    this.background.setDepth(3.005);
    this.door.setDepth(3.14);
    this.showBackground(s.mission, 0);
    const t = s.phase === "arrivalFade" ? 5.8 : s.age,
      p = Math.min(1, t / 1.8),
      carX = 40 + 71 * (1 - (1 - p) ** 3);
    s.carArt?.side(carX);
    const g = this.door,
      label =
        s.mission === 1 ? "LYCEE PATRICK BRUEL" : "LYCEE PRO / TIBO INSHAPE";
    const w = smallWidth(label) + 10;
    g.fillStyle(0xb9aa89);
    g.fillRect(306 - w, 47, w, 13);
    smallPrint(g, 311 - w, 51, label, 0x24333b);
    if (t > 2.25) {
      const walk = Math.min(1, (t - 2.25) / 2.35),
        recede = Math.max(0, Math.min(1, (t - 4.6) / 1.2));
      s.art
        ?.pose(
          "prof",
          [1, 2, 3, 2][Math.floor(t * 7) % 4],
          129 + (281 - 129) * walk,
          154 - 3 * walk - 14 * recede,
          1,
        )
        .setDepth(3.15)
        .setScale(0.105 * (1 - 0.2 * recede))
        .setAlpha(1 - recede * 0.75);
    }
  }
}
