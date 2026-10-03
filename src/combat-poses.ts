import { PLAY, enemyPhase } from "./gameplay";
import type { Enemy } from "./world";

// New four-pose actors share the same exclusive state priority as diagnostics.
// Recovery starts at contact, but the active silhouette must remain visible.
export function newEnemyFrame(e: Enemy, presentation = false) {
  const state = enemyPhase(e, presentation);
  if (state === "strike") return 2;
  if (state === "windup") return 1;
  if (["hurt", "defeated", "recovery", "turn"].includes(state)) return 3;
  return 0;
}

export type TeacherState = {
  px: number;
  py: number;
  face: number;
  attack: number;
  walkClock: number;
  inv: number;
  phase: string;
  encounterTime?: number;
  schoolFade?: number;
  roomTransition?: unknown;
  navigationCare?: { active: boolean };
  playerRecovery?: number;
  playerHitDirection?: number;
  bookBlocked?: number;
  keys: Record<string, { isDown: boolean }>;
};

// Presentation reads simulation timers; drawing never advances an animation.
export function teacherPose(s: TeacherState) {
  const hurt = Math.min(1, (s.playerRecovery ?? 0) / PLAY.playerRecovery);
  const blocked = Math.min(1, (s.bookBlocked ?? 0) / PLAY.attackRecovery);
  const moving =
    s.phase === "school" &&
    !(
      s.encounterTime ||
      s.schoolFade ||
      s.roomTransition ||
      s.navigationCare?.active
    ) &&
    (s.keys.LEFT.isDown || s.keys.RIGHT.isDown);
  const frame =
    hurt > 0
      ? 6
      : (s.bookBlocked ?? 0) > PLAY.attackRecovery - PLAY.blockContactHold
        ? 5
        : blocked > 0
          ? 6
          : s.attack > PLAY.attackContact
            ? 4
            : s.attack > PLAY.attackRecovery
              ? 5
              : s.attack > 0
                ? 6
                : s.py < PLAY.floor - 1
                  ? 7
                  : moving
                    ? [1, 2, 3, 2][Math.floor(s.walkClock / 1.5) % 4]
                    : 0;
  const direction = s.playerHitDirection ?? -s.face;
  return {
    frame,
    x: s.px + direction * 2 * hurt - s.face * 2 * blocked,
    y: s.py,
    angle: direction * 9 * hurt - s.face * 4 * blocked,
    // Keep the initial recoil opaque; blink only in the protected recovery afterwards.
    alpha:
      s.encounterTime || hurt > 0
        ? 1
        : s.inv > 0 && Math.floor(s.inv * 12) % 2
          ? 0.55
          : 1,
  };
}

export function enemyPose(e: Enemy, facing: number) {
  const recoil = Math.min(1, (e.recoilTime ?? 0) / PLAY.hitStun);
  const block = Math.min(1, (e.blockTime ?? 0) / 0.14);
  const direction = e.hitDirection ?? -facing;
  const defeated = e.hp <= 0;
  const progress = defeated
    ? Math.min(1, Math.max(0, (PLAY.defeatSeconds - (e.downTime ?? 0)) / 0.4))
    : 0;
  return {
    // The collision body separates immediately. The drawn body travels to it
    // during the recoil, beginning at the exact contact rather than teleporting.
    x: e.x - (e.recoilDistance ?? 0) * recoil + direction * 2 * block,
    y: PLAY.floor + 3 * progress,
    angle: direction * (8 * recoil + 24 * progress + 2 * block),
    alpha: defeated ? Math.min(1, Math.max(0, (e.downTime ?? 0) / 0.4)) : 1,
  };
}
