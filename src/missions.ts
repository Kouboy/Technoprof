import {
  ROOM_NAMES,
  BLOCKED_EDGES,
  roomPassages,
  makeEnemies,
  type Exit,
  type Enemy,
} from "./world";
import { ENCOUNTERS, type Encounter } from "./dialogue";

export type EnemyRole =
  | "inspector"
  | "parent"
  | "student"
  | "guard"
  | "filmer"
  | "influential"
  | "thrower"
  | "security";
export type RoomSpec = {
  id: number;
  name: string;
  frame?: number;
  quietFrame?: number;
  quietMirror?: boolean;
  exits?: Exit[];
  blocked: ("left" | "right")[];
  gaps: number[][];
  role?: EnemyRole;
  boss?: boolean;
  hp?: number;
  encounter?: Encounter;
  signs?: [number, number, number, string[]][];
  labels?: [number, number, string][];
};
export type MissionSpec = {
  id: string;
  school: string;
  hud: [string, string];
  classroom: string;
  seconds: number;
  meters: number;
  start: number;
  arena: number;
  district: "mixed" | "urban" | "industrial";
  rooms: Record<number, RoomSpec>;
};
const edge = (
  key: "LEFT" | "RIGHT",
  target: number,
  spawn: number,
  label: string,
): Exit => ({
  from: key === "LEFT" ? 10 : 298,
  to: key === "LEFT" ? 12 : 302,
  key,
  target,
  spawn,
  label,
  hint: [key === "LEFT" ? 15 : 298, 137],
  edge: true,
});
const door = (
  key: "UP" | "DOWN",
  x: number,
  target: number,
  spawn: number,
  label: string,
): Exit => ({
  from: Math.max(10, x - 30),
  to: Math.min(302, x + 30),
  key,
  target,
  spawn,
  label,
  hint: [x, 62],
});
const room = (
  id: number,
  name: string,
  frame: number,
  exits: Exit[],
  extras: Partial<RoomSpec> = {},
): RoomSpec => ({
  id,
  name,
  frame,
  exits,
  gaps: [],
  blocked: (["left", "right"] as const).filter(
    (side) => !exits.some((e) => e.edge && e.key === side.toUpperCase()),
  ),
  ...extras,
});
const bruelRooms: Record<number, RoomSpec> = {
  10: room(
    10,
    "COUR / LYCEE BRUEL",
    0,
    [edge("RIGHT", 11, 20, "DROITE : VESTIBULE")],
    { signs: [[210, 52, 90, ["ENTREE >"]]] },
  ),
  11: room(
    11,
    "VESTIBULE / RDC",
    1,
    [
      edge("LEFT", 10, 290, "GAUCHE : COUR"),
      edge("RIGHT", 15, 22, "DROITE : RESERVE"),
      door("UP", 60, 12, 65, "HAUT : ESCALIER / B12"),
    ],
    {
      role: "filmer",
      hp: 2,
      encounter: {
        name: "PARENT AU TELEPHONE",
        pages: [
          ["Je filme. Encore un prof", "qui arrive en retard !"],
          ["Une minute hors contexte,", "et tout le monde vous juge."],
        ],
      },
      signs: [[164, 51, 106, ["< B12 / ETAGE", "RESERVE >"]]],
      labels: [[58, 43, "ETAGE"]],
    },
  ),
  12: room(
    12,
    "ESCALIER / AILE B",
    2,
    [
      door("DOWN", 60, 11, 65, "BAS : VESTIBULE"),
      door("UP", 250, 13, 60, "HAUT : GALERIE / B12"),
    ],
    { labels: [[55, 43, "RDC"]], signs: [[179, 50, 105, ["B12 / ETAGE >"]]] },
  ),
  13: room(
    13,
    "GALERIE / AILE B",
    1,
    [
      door("DOWN", 60, 12, 240, "BAS : ESCALIER"),
      edge("RIGHT", 14, 45, "DROITE : SALLE B12"),
    ],
    {
      role: "student",
      hp: 2,
      encounter: {
        name: "ELEVE",
        pages: [
          ["Les remplaçants ?", "On ne les garde jamais."],
          ["Alors votre cours,", "on verra si on le suit."],
        ],
      },
      signs: [[176, 51, 100, ["SALLE B12 >"]]],
      labels: [[58, 43, "ESCALIER"]],
    },
  ),
  14: room(14, "SALLE B12 / AILE B", 3, [], {
    blocked: ["left"],
    boss: true,
    role: "influential",
    hp: 6,
    encounter: {
      name: "PARENT INFLUENT",
      pages: [
        ["Je finance les voyages.", "La direction me reçoit."],
        ["La note de mon fils baisse ?", "Votre contrat suivra."],
        ["Vous voulez passer ?", "Essayez donc."],
      ],
    },
    labels: [[281, 43, "B12"]],
  }),
  15: room(
    15,
    "RESERVE / SOL FRAGILE",
    3,
    [
      edge("LEFT", 11, 285, "GAUCHE : VESTIBULE"),
      door("UP", 281, 13, 95, "HAUT : GALERIE / B12"),
    ],
    {
      gaps: [[139, 174]],
      labels: [[281, 43, "GALERIE"]],
      signs: [[106, 66, 100, ["SOL FRAGILE", "GALERIE >"]]],
    },
  ),
};
const proRooms: Record<number, RoomSpec> = {
  20: room(
    20,
    "PARVIS / LYCEE PROFESSIONNEL",
    0,
    [edge("RIGHT", 21, 20, "DROITE : ATELIER A")],
    { signs: [[202, 52, 105, ["ATELIER A >"]]] },
  ),
  21: room(
    21,
    "ATELIER A / RDC",
    1,
    [
      edge("LEFT", 20, 290, "GAUCHE : PARVIS"),
      edge("RIGHT", 25, 22, "DROITE : RESERVE"),
      door("UP", 60, 22, 60, "HAUT : PASSERELLE / T03"),
    ],
    {
      role: "thrower",
      hp: 2,
      encounter: {
        name: "ELEVE MAJEUR",
        pages: [
          ["Encore un remplacement ?", "L’atelier attend depuis lundi."],
          ["Votre cours tombe mal.", "La colère, elle, ne manque pas."],
        ],
      },
      labels: [[58, 43, "ETAGE"]],
      signs: [[154, 49, 108, ["< T03 / ETAGE", "RESERVE >"]]],
    },
  ),
  22: room(
    22,
    "PASSERELLE / ATELIERS",
    2,
    [
      door("DOWN", 60, 21, 65, "BAS : ATELIER A"),
      edge("RIGHT", 24, 45, "DROITE : LABO T03"),
    ],
    {
      role: "guard",
      hp: 2,
      encounter: ENCOUNTERS[6],
      labels: [[55, 43, "RDC"]],
      signs: [[179, 51, 103, ["LABO T03 >"]]],
    },
  ),
  23: room(
    23,
    "SERVICE / SOL FRAGILE",
    2,
    [
      door("DOWN", 60, 25, 265, "BAS : RESERVE"),
      edge("RIGHT", 24, 45, "DROITE : LABO T03"),
    ],
    {
      gaps: [
        [129, 166],
        [211, 245],
      ],
      labels: [[55, 43, "RESERVE"]],
      signs: [[166, 49, 127, ["T03 > / SOL FRAGILE"]]],
    },
  ),
  24: room(24, "LABO T03 / CONTROLE D’ACCES", 3, [], {
    blocked: ["left"],
    role: "security",
    boss: true,
    hp: 6,
    encounter: {
      name: "RESPONSABLE SECURITE",
      pages: [
        ["Votre badge est provisoire.", "L’accès au labo ne l’est pas."],
        ["Ordre de la direction :", "aucune exception."],
        ["De face, je ne cède pas.", "Essayez de me contourner."],
      ],
    },
    labels: [[281, 43, "T03"]],
  }),
  25: room(
    25,
    "RESERVE / ATELIERS",
    1,
    [
      edge("LEFT", 21, 285, "GAUCHE : ATELIER A"),
      door("UP", 281, 23, 65, "HAUT : SERVICE / T03"),
    ],
    {
      labels: [[281, 43, "SERVICE"]],
      signs: [[161, 49, 119, ["SERVICE >", "SOL FRAGILE"]]],
    },
  ),
};
const collegeRooms = Object.fromEntries(
  ROOM_NAMES.map((name, id) => [
    id,
    {
      id,
      name,
      blocked: BLOCKED_EDGES[id] ?? [],
      gaps:
        id === 1
          ? [[140, 166]]
          : id === 8
            ? [
                [95, 128],
                [190, 223],
              ]
            : [],
      role: (
        { 1: "parent", 3: "student", 4: "inspector", 6: "guard" } as Record<
          number,
          EnemyRole
        >
      )[id],
      boss: id === 4,
      encounter: ENCOUNTERS[id],
    },
  ]),
) as Record<number, RoomSpec>;
// Quiet wings extend both routes without adding encounters or floor hazards.
const extendWing = (
  rooms: Record<number, RoomSpec>,
  approaches: number[],
  first: number,
  arena: number,
  classroom: string,
  classFrame: number,
) => {
  for (const id of approaches) {
    const r = rooms[id];
    r.exits = (r.exits ?? roomPassages(id, false)).map((e) =>
      e.target === arena
        ? {
            ...e,
            target: first,
            spawn: 45,
            label: "DROITE : LIAISON / " + classroom,
          }
        : e,
    );
    r.signs = [[176, 51, 106, [classroom + " / LIAISON >"]]];
  }
  rooms[first] = room(
    first,
    "LIAISON / " + classroom,
    1,
    [
      edge("LEFT", approaches[0], 280, "GAUCHE : RETOUR"),
      edge("RIGHT", first + 1, 45, "DROITE : SALLE D’ETUDE"),
    ],
    { quietFrame: 3, signs: [[164, 51, 126, ["ETUDE > / " + classroom]]] },
  );
  rooms[first + 1] = room(
    first + 1,
    "SALLE D’ETUDE / TRAVERSEE",
    1,
    [
      edge("LEFT", first, 278, "GAUCHE : LIAISON"),
      door("UP", 281, first + 2, 45, "HAUT : HALL / " + classroom),
    ],
    {
      blocked: [],
      quietFrame: classFrame,
      labels: [[281, 43, "HALL"]],
      signs: [[171, 51, 104, ["HALL / " + classroom + " >"]]],
    },
  );
  rooms[first + 2] = room(
    first + 2,
    "HALL / AILE " + classroom,
    1,
    [
      edge("LEFT", first + 1, 260, "GAUCHE : ETUDE"),
      edge("RIGHT", arena, 45, "DROITE : SALLE " + classroom),
    ],
    {
      quietFrame: 3,
      quietMirror: true,
      signs: [[179, 51, 105, ["SALLE " + classroom + " >"]]],
    },
  );
};
extendWing(collegeRooms, [3], 30, 4, "42C", 0);
extendWing(bruelRooms, [13], 16, 14, "B12", 1);
extendWing(proRooms, [22, 23], 26, 24, "T03", 2);

// Minimum complete-route load doubles. Detours can add one room/encounter.
export const DAY_LOAD = [
  { rooms: 9, encounters: 3, roadPasses: 25 },
  { rooms: 18, encounters: 6, roadPasses: 40 },
  { rooms: 36, encounters: 12, roadPasses: 75 },
];
const addWorkload = (
  rooms: Record<number, RoomSpec>,
  from: number,
  first: number,
  count: number,
  arena: number,
  classroom: string,
  classFrame: number,
  threats: Record<number, { role: EnemyRole; name: string; lines: string[] }>,
) => {
  rooms[from].exits = rooms[from].exits!.map((e) =>
    e.target === arena
      ? {
          ...e,
          target: first,
          spawn: 45,
          label: "DROITE : AILES / " + classroom,
        }
      : e,
  );
  rooms[from].signs = [[179, 51, 105, ["AILES / " + classroom + " >"]]];
  for (let i = 0; i < count; i++) {
    const id = first + i,
      last = i === count - 1,
      block = Math.floor(i / 4) + 1;
    const kind =
      i % 4 === 0
        ? "COULOIR"
        : i % 4 === 1
          ? "ETUDE"
          : i % 4 === 2
            ? "HALL"
            : "PALIER";
    const isClass = kind === "ETUDE",
      next = last ? arena : id + 1;
    const exits = [
      edge("LEFT", i === 0 ? from : id - 1, 260, "GAUCHE : RETOUR"),
      isClass
        ? door(
            "UP",
            281,
            next,
            45,
            "HAUT : " + (last ? "SALLE " : "AILE ") + classroom,
          )
        : edge(
            "RIGHT",
            next,
            45,
            "DROITE : " + (last ? "SALLE " : "AILE ") + classroom,
          ),
    ];
    const threat = threats[i];
    rooms[id] = room(
      id,
      kind + " / SECTEUR " + block,
      kind === "PALIER" ? 2 : 1,
      exits,
      {
        ...(isClass
          ? {
              quietFrame: classFrame,
              blocked: [],
              labels: [[281, 43, last ? classroom : "AILE"]],
            }
          : kind === "HALL"
            ? { quietFrame: 3 }
            : {}),
        quietMirror: !isClass && i % 8 >= 4,
        signs: [
          [
            170,
            51,
            111,
            [
              (isClass ? "SORTIE" : kind === "PALIER" ? "ETAGE" : "AILE") +
                " " +
                block +
                " / " +
                classroom +
                " >",
            ],
          ],
        ],
        ...(threat
          ? {
              role: threat.role,
              hp: 2,
              encounter: { name: threat.name, pages: [threat.lines] },
            }
          : {}),
      },
    );
  }
};
addWorkload(bruelRooms, 18, 40, 10, 14, "B12", 1, {
  1: {
    role: "student",
    name: "ELEVE",
    lines: ["Une salle libre ?", "Cherchez l’autre aile."],
  },
  4: {
    role: "filmer",
    name: "PARENT AU TELEPHONE",
    lines: ["J’ai commencé à filmer.", "Justifiez votre retard."],
  },
  7: {
    role: "guard",
    name: "AGENT DE SECURITE",
    lines: ["Votre badge ne suffit pas.", "On m’a dit de contrôler."],
  },
});
// Each branch has an encounter: the reserve cannot bypass the common quota.
proRooms[25].role = "guard";
proRooms[25].hp = 2;
proRooms[25].encounter = {
  name: "AGENT DE SECURITE",
  pages: [["L’accès de service ?", "Il faut aussi un badge."]],
};
addWorkload(proRooms, 28, 60, 29, 24, "T03", 2, {
  1: {
    role: "guard",
    name: "AGENT DE SECURITE",
    lines: ["On manque de personnel.", "Alors je bloque les accès."],
  },
  4: {
    role: "student",
    name: "ELEVE",
    lines: ["Trois profs en deux semaines.", "Vous resterez combien ?"],
  },
  7: {
    role: "guard",
    name: "AGENT DE SECURITE",
    lines: ["Aile fermée depuis lundi.", "Le cours ? Plus loin."],
  },
  10: {
    role: "thrower",
    name: "ELEVE MAJEUR",
    lines: ["Encore déplacés de salle.", "Ça commence à bien faire."],
  },
  13: {
    role: "student",
    name: "ELEVE",
    lines: ["On nous a supprimé l’atelier.", "Votre livre ne le répare pas."],
  },
  16: {
    role: "guard",
    name: "AGENT DE SECURITE",
    lines: ["Une seule personne pour l’aile.", "Je fais avec les consignes."],
  },
  19: {
    role: "student",
    name: "ELEVE",
    lines: ["Le chauffage est en panne.", "Vous venez faire cours ici ?"],
  },
  22: {
    role: "guard",
    name: "AGENT DE SECURITE",
    lines: ["La direction a dit non.", "Moi, je fais appliquer."],
  },
  25: {
    role: "thrower",
    name: "ELEVE MAJEUR",
    lines: ["La salle change tous les jours.", "Et c’est nous qu’on renvoie."],
  },
});

export const MISSIONS: MissionSpec[] = [
  {
    id: "hanouna",
    school: "Collège C. Hanouna",
    hud: ["COLLEGE", "C. HANOUNA"],
    classroom: "42C",
    seconds: 240,
    meters: 4200,
    start: 0,
    arena: 4,
    district: "mixed",
    rooms: collegeRooms,
  },
  {
    id: "bruel",
    school: "Lycée Patrick Bruel",
    hud: ["LYCEE", "P. BRUEL"],
    classroom: "B12",
    seconds: 225,
    meters: 3600,
    start: 10,
    arena: 14,
    district: "urban",
    rooms: bruelRooms,
  },
  {
    id: "tibo",
    school: "Lycée Professionnel Tibo InShape",
    hud: ["LYCEE PRO", "TIBO INSHAPE"],
    classroom: "T03",
    seconds: 210,
    meters: 3900,
    start: 20,
    arena: 24,
    district: "industrial",
    rooms: proRooms,
  },
];
export const missionSpec = (index: number) =>
  MISSIONS[Math.max(0, Math.min(MISSIONS.length - 1, index))];
export const roomSpec = (mission: number, id: number) =>
  missionSpec(mission).rooms[id] ?? collegeRooms[id];
export function missionPassages(
  mission: number,
  id: number,
  cleared: boolean,
): Exit[] {
  const m = missionSpec(mission),
    r = roomSpec(mission, id);
  if (!m.rooms[id] || (m.id === "hanouna" && !r?.exits))
    return roomPassages(id, cleared);
  if (id === m.arena)
    return cleared
      ? [door("UP", 281, -1, 0, "HAUT : OUVRIR " + m.classroom)]
      : [];
  return r?.exits ?? [];
}
export function missionEnemies(mission: number, id: number): Enemy[] {
  const r = roomSpec(mission, id);
  if (id < 10) return makeEnemies(id, mission);
  if (!r?.role) return [];
  return [
    {
      x: r.boss ? 220 : 210,
      hp: r.hp ?? 2,
      boss: !!r.boss,
      role: r.role,
      female: r.role === "filmer",
      parent: r.role === "influential",
      facing: -1,
      cool: 0.7,
      wind: 0,
      recovery: 0,
      pattern: 0,
      stun: 0,
    },
  ];
}
