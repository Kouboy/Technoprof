export const ENCOUNTER_SECONDS = 9;
export const TUNING = {
  cruiseSeconds: 15,
  missionSeconds: 240,
  missionStep: 15,
  routeMeters: 4200,
  maxSpeed: 260,
};
export type Enemy = {
  x: number;
  role?: import("./missions").EnemyRole;
  turnTime?: number;
  hp: number;
  boss: boolean;
  female?: boolean;
  actor?: "catchup-student";
  catchupAttack?: "kick" | "book";
  retreatTime?: number;
  retreatDir?: number;
  securityCycle?: {
    phase:
      | "approach"
      | "push-windup"
      | "push"
      | "advance-windup"
      | "advance"
      | "opening"
      | "reset";
    time: number;
    dir: number;
    hits: number;
    contact: boolean;
  };
  cool: number;
  wind: number;
  recovery: number;
  pattern: number;
  stun: number;
  parent?: boolean;
  facing?: number;
  walk?: number;
  downTime?: number;
  strikeTime?: number;
  recoilTime?: number;
  recoilDistance?: number;
  hitDirection?: number;
  blockTime?: number;
  chargeDir?: number;
  chargeTime?: number;
  parentCycle?: import("./bruel-recovery").ParentCycle;
};
export type Exit = {
  from: number;
  to: number;
  key: string;
  label: string;
  target: number;
  spawn: number;
  hint: [number, number];
  edge?: boolean;
};
export const ROOM_NAMES = [
  "COUR / BATIMENT C",
  "HALL / RDC",
  "ESCALIER CENTRAL",
  "1ER / AILE C",
  "SALLE 42C",
  "ANNEXE / RDC",
  "2E / PASSERELLE",
  "ESCALIER DE SERVICE",
  "PASSAGE TECHNIQUE / DANGER",
];
export const EXITS: Record<number, Exit[]> = {
  1: [
    {
      from: 48,
      to: 112,
      key: "UP",
      label: "HAUT : ANNEXE / DETOUR",
      target: 5,
      spawn: 50,
      hint: [62, 62],
    },
  ],
  2: [
    {
      from: 205,
      to: 295,
      key: "UP",
      label: "HAUT : RACCOURCI / SOL FRAGILE",
      target: 8,
      spawn: 25,
      hint: [272, 62],
    },
  ],
  8: [
    {
      from: 10,
      to: 65,
      key: "DOWN",
      label: "BAS : RETOUR ESCALIER",
      target: 2,
      spawn: 220,
      hint: [61, 62],
    },
  ],
  3: [
    {
      from: 10,
      to: 70,
      key: "DOWN",
      label: "BAS : ESCALIER DE SERVICE",
      target: 7,
      spawn: 240,
      hint: [52, 62],
    },
  ],
  5: [
    {
      from: 10,
      to: 80,
      key: "DOWN",
      label: "BAS : REVENIR AU HALL",
      target: 1,
      spawn: 80,
      hint: [58, 59],
    },
    {
      from: 200,
      to: 295,
      key: "UP",
      label: "HAUT : MONTER AU 2E",
      target: 6,
      spawn: 30,
      hint: [247, 92],
    },
  ],
  6: [
    {
      from: 10,
      to: 65,
      key: "DOWN",
      label: "BAS : ANNEXE",
      target: 5,
      spawn: 230,
      hint: [60, 62],
    },
  ],
  7: [
    {
      from: 10,
      to: 70,
      key: "UP",
      label: "HAUT : PASSERELLE DU 2E",
      target: 6,
      spawn: 280,
      hint: [43, 59],
    },
    {
      from: 170,
      to: 295,
      key: "DOWN",
      label: "BAS : AILE C AU 1ER",
      target: 3,
      spawn: 30,
      hint: [264, 59],
    },
  ],
};
function edgeExit(key: "LEFT" | "RIGHT", target: number, spawn: number): Exit {
  return {
    from: key === "LEFT" ? 10 : 298,
    to: key === "LEFT" ? 12 : 302,
    key,
    label: (key === "LEFT" ? "GAUCHE : " : "DROITE : ") + ROOM_NAMES[target],
    target,
    spawn,
    hint: [key === "LEFT" ? 15 : 298, 137],
    edge: true,
  };
}
export const EDGE_EXITS: Record<number, Exit[]> = {
  0: [edgeExit("RIGHT", 1, 18)],
  1: [edgeExit("LEFT", 0, 290), edgeExit("RIGHT", 2, 20)],
  2: [edgeExit("LEFT", 1, 290)],
  3: [edgeExit("RIGHT", 4, 25)],
  6: [edgeExit("RIGHT", 7, 28)],
  7: [edgeExit("LEFT", 6, 280)],
  8: [edgeExit("RIGHT", 3, 100)],
};
export const CLASSROOM_EXIT: Exit = {
  from: 245,
  to: 302,
  key: "UP",
  label: "HAUT : OUVRIR 42C",
  target: -1,
  spawn: 0,
  hint: [281, 62],
};
export function roomPassages(room: number, cleared: boolean): Exit[] {
  return [
    ...(room === 4 ? (cleared ? [CLASSROOM_EXIT] : []) : (EXITS[room] ?? [])),
    ...(EDGE_EXITS[room] ?? []),
  ];
}
export function withinPassage(exit: Exit, px: number) {
  if (exit.edge)
    return exit.key === "LEFT"
      ? px >= exit.from && px < exit.to
      : px > exit.from && px <= exit.to;
  return px >= exit.from && px <= exit.to;
}
export function makeEnemies(room: number, mission: number): Enemy[] {
  return room === 4
    ? [
        {
          x: 235,
          hp: 6 + mission,
          boss: true,
          female: mission === 0,
          cool: 0.5,
          wind: 0,
          recovery: 0,
          pattern: 0,
          stun: 0,
        },
      ]
    : [1, 3, 6].includes(room)
      ? [
          {
            x: 210,
            hp: room === 1 ? 3 : 2,
            parent: room === 1,
            chargeDir: 0,
            chargeTime: 0,
            boss: false,
            cool: 0.5,
            wind: 0,
            recovery: 0,
            pattern: 0,
            stun: 0,
          },
        ]
      : [];
}

// Only screen edges without a walk-through exit get a physical closure.
export const BLOCKED_EDGES: Record<number, ("left" | "right")[]> = {
  0: ["left"],
  2: ["right"],
  3: ["left"],
  4: ["left"],
  5: ["left", "right"],
  6: ["left"],
  7: ["right"],
  8: ["left"],
};

export function walkBounds(room: number) {
  const blocked = BLOCKED_EDGES[room] ?? [];
  return {
    min: blocked.includes("left") ? 42 : 10,
    max: blocked.includes("right") ? 278 : 302,
  };
}
export function recoveryBank(left: number, right: number, lastGroundX: number) {
  return lastGroundX <= (left + right) / 2 ? left - 15 : right + 15;
}
