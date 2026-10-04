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
  roomFadeOut: 0.12,
  roomFadeIn: 0.18,
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
export const NEW_COMBAT = {
  influential: { ...COMBAT.arena, bodyGap: 40, bookReach: 67, contactY: 62 },
  security: {
    ...COMBAT.corridor,
    bodyGap: 24,
    jumpClear: 146,
    bookReach: 56,
    contactY: 61,
  },
};
export const SECURITY = {
  turn: 0.85,
  activePose: 0.28,
  wind: 0.85,
  reach: 49,
  recovery: 1.05,
  speed: 19,
  approach: 40,
  trigger: 62,
  cooldown: 1.2,
};
export const THROWER = {
  activePose: 0.25,
  wind: 1,
  recovery: 1.25,
  cooldown: 1.6,
  speed: 115,
  reach: 190,
  height: 130,
};
export const FILMER = {
  windAdvance: 12,
  activePose: 0.22,
};
// A3 is a controlled workshop comparison. Range, damage and player inputs stay
// unchanged; preparation remains visible and a hit still cancels the attack.
export const NORMAL_ENEMY = {
  student: { ...STUDENT, windAdvance: 0 },
  guard: GUARD,
  parent: PARENT,
  boss: BOSS,
  security: SECURITY,
  thrower: THROWER,
  filmer: FILMER,
  initialCooldown: 0.7,
  hitStun: PLAY.hitStun,
  hitRecovery: 0.35,
  parentCooldown: 1.8,
  wallStun: 1.1,
  wallRecovery: 0.5,
};
export const PRESSURE_ENEMY = {
  ...NORMAL_ENEMY,
  student: {
    ...STUDENT,
    speed: 38,
    approach: 38,
    trigger: 58,
    wind: 0.34,
    recovery: 0.3,
    cooldown: 0.24,
    windAdvance: 22,
  },
  guard: {
    ...GUARD,
    speed: 40,
    approach: 44,
    trigger: 63,
    wind: 0.38,
    recovery: 0.38,
    cooldown: 0.3,
  },
  parent: { ...PARENT, speed: 34, chargeSpeed: 140, wind: 0.5, recovery: 0.65 },
  boss: {
    ...BOSS,
    speed: 42,
    stampWind: 0.4,
    sweepWind: 0.55,
    recovery: 0.65,
    cooldown: 0.5,
  },
  security: {
    ...SECURITY,
    speed: 36,
    wind: 0.45,
    recovery: 0.65,
    cooldown: 0.45,
  },
  thrower: { ...THROWER, wind: 0.55, recovery: 0.65, cooldown: 0.55 },
  filmer: { ...FILMER, windAdvance: 34 },
  initialCooldown: 0.18,
  hitStun: 0.08,
  hitRecovery: 0,
  parentCooldown: 0.55,
  wallStun: 0.65,
  wallRecovery: 0.3,
};
// First-school boss: ordinary encounters retain A3 pressure. The Inspector's
// full strike pose leaves ~1 second to read recovery, return and hit afterwards.
export const HANOUNA_ENEMY = {
  ...PRESSURE_ENEMY,
  boss: {
    ...PRESSURE_ENEMY.boss,
    stampWind: BOSS.stampWind,
    sweepWind: BOSS.sweepWind,
    recovery: 1.35,
    cooldown: 0.65,
  },
};
export function enemyTuning(pressure = false, firstSchool = false) {
  return firstSchool ? HANOUNA_ENEMY : pressure ? PRESSURE_ENEMY : NORMAL_ENEMY;
}
export function combatProfile(room: number, role?: string) {
  if (role === "inspector") return COMBAT.arena;
  if (role === "influential") return NEW_COMBAT.influential;
  if (role === "security") return NEW_COMBAT.security;
  if (role === "student") return COMBAT.student;
  if (role === "guard" || role === "thrower") return COMBAT.corridor;
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
  | "turn"
  | "hurt"
  | "defeated";
// Timers are the simulation truth. One exclusive state is derived for presentation
// and diagnostics, so it cannot drift out of sync with the collision rules.
export function enemyPhase(e: Enemy, presentation = false): EnemyPhase {
  if (e.hp <= 0) return "defeated";
  if (e.stun > 0) return "hurt";
  if (presentation) return "presentation";
  if (e.parentCycle?.phase === "breakaway") return "recovery";
  if (e.wind > 0) return "windup";
  if ((e.chargeTime ?? 0) > 0 || (e.strikeTime ?? 0) > 0) return "strike";
  if (e.recovery > 0) return "recovery";
  if ((e.turnTime ?? 0) > 0) return "turn";
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
