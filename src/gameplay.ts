import type { Enemy } from "./world";

// Delivered gameplay: these values never depend on loaded textures.
export const PLAY = {
  floor: 159,
  walk: 85,
  attackWalk: 34,
  jump: 220,
  gravity: 600,
  attackDuration: 0.48,
  attackContact: 0.34,
  attackRecovery: 0.17,
  attackBuffer: 0.1,
  hitStun: 0.22,
  hitStop: 0.055,
  blockStop: 0.04,
  blockContactHold: 0.06,
  hurtStop: 0.065,
  playerRecovery: 0.22,
  recoil: 14,
  defeatSeconds: 1.1,
  impactSeconds: 0.32,
  invulnerability: 1.2,
  interactLock: 0.35,
  openingSeconds: 3.4,
  failContinueSeconds: 2,
  maxStepMs: 20,
  maxFrameMs: 1000,
};
export const COMBAT = {
  hall: {
    bookReach: 44,
    bodyGap: 32,
    jumpClear: 135,
    contactX: 9,
    contactY: 55,
    attackWalk: 34,
  },
  corridor: {
    bookReach: 56,
    bodyGap: 36,
    jumpClear: 135,
    contactX: 9,
    contactY: 55,
    attackWalk: 34,
  },
  student: {
    bookReach: 56,
    bodyGap: 32,
    jumpClear: 135,
    contactX: 9,
    contactY: 55,
    attackWalk: 34,
  },
  arena: {
    bookReach: 74,
    bodyGap: 52,
    jumpClear: 135,
    contactX: 15,
    contactY: 69,
    attackWalk: 0,
  },
};
export const BOSS = {
  approach: 58,
  trigger: 82,
  speed: 27,
  stampReach: 64,
  sweepReach: 78,
  stampWind: 0.55,
  sweepWind: 0.8,
  sweepPose: 0.36,
  stampPose: 0.18,
  recovery: 1.1,
  cooldown: 1.1,
};
export const PARENT = {
  speed: 18,
  chargeSpeed: 100,
  reach: 22,
  wind: 1,
  charge: 1.9,
  recovery: 1.1,
};
export const GUARD = {
  speed: 18,
  approach: 50,
  trigger: 59,
  reach: 54,
  wind: 0.75,
  recovery: 0.85,
  cooldown: 1.1,
};
export const STUDENT = {
  speed: 16,
  approach: 43,
  trigger: 52,
  reach: 48,
  wind: 0.7,
  recovery: 0.85,
  cooldown: 1.15,
};
export function combatProfile(room: number) {
  return room === 4
    ? COMBAT.arena
    : room === 3
      ? COMBAT.student
      : room === 6
        ? COMBAT.corridor
        : COMBAT.hall;
}
export type EnemyPhase =
  | "presentation"
  | "approach"
  | "windup"
  | "strike"
  | "recovery"
  | "hurt"
  | "defeated";
// Timers are the simulation truth. One exclusive state is derived for presentation
// and diagnostics, so it cannot drift out of sync with the collision rules.
export function enemyPhase(e: Enemy, presentation = false): EnemyPhase {
  if (e.hp <= 0) return "defeated";
  if (e.stun > 0) return "hurt";
  if (presentation) return "presentation";
  if (e.wind > 0) return "windup";
  if ((e.chargeTime ?? 0) > 0 || (e.strikeTime ?? 0) > 0) return "strike";
  if (e.recovery > 0) return "recovery";
  return "approach";
}
export type FailureReason = "late" | "exhausted" | "breakdown";
export const FAILURE_LABELS: Record<FailureReason, string> = {
  late: "DELAI DEPASSE",
  exhausted: "PROF EPUISE",
  breakdown: "VEHICULE EN PANNE",
};
export function terminalReason(
  hp: number,
  remaining: number,
  vehicle: number,
  driving: boolean,
): FailureReason | null {
  if (driving && vehicle <= 0) return "breakdown";
  if (!driving && hp <= 0) return "exhausted";
  return remaining <= 0 ? "late" : null;
}
export class SeededRandom {
  private state = 1;
  reset(seed: number) {
    this.state = seed >>> 0 || 1;
  }
  next() {
    let n = this.state;
    n ^= n << 13;
    n ^= n >>> 17;
    n ^= n << 5;
    this.state = n >>> 0;
    return this.state / 4294967296;
  }
}
