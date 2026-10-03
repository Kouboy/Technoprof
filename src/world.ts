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
  hp: number;
  boss: boolean;
  cool: number;
  wind: number;
  recovery: number;
  pattern: number;
  stun: number;
  parent?: boolean;
  facing?: number;
  walk?: number;
  downTime?: number;
  chargeDir?: number;
  chargeTime?: number;
};
export type Exit = {
  from: number;
  to: number;
  key: string;
  label: string;
  target: number;
  spawn: number;
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
    },
    {
      from: 200,
      to: 295,
      key: "UP",
      label: "HAUT : MONTER AU 2E",
      target: 6,
      spawn: 30,
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
    },
    {
      from: 170,
      to: 295,
      key: "DOWN",
      label: "BAS : AILE C AU 1ER",
      target: 3,
      spawn: 30,
    },
  ],
};
export function makeEnemies(room: number, mission: number): Enemy[] {
  return room === 4
    ? [
        {
          x: 235,
          hp: 6 + mission,
          boss: true,
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
