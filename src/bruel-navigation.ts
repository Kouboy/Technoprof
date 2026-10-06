import { MISSIONS, type MissionSpec, type RoomSpec } from "./missions";
import type { Exit } from "./world";

// Workshop only. Neither MISSIONS nor any of its room objects is mutated.
export const NAV_ID = {
  cour: 100,
  vestibule: 101,
  hall: 102,
  principal: 103,
  palier: 104,
  galerieA: 105,
  annexe: 106,
  infirmerie: 107,
  jonction: 108,
  galerieB: 109,
  palierB: 110,
  seuil: 111,
};
export const NAV_CARE = { x: 180, reach: 22, seconds: 1.2, cap: 5 };
export const navExit = (
  key: string,
  x: number,
  target: number,
  spawn: number,
  label: string,
): Exit => {
  const edge = key === "LEFT" || key === "RIGHT";
  return {
    key,
    target,
    spawn,
    label,
    from: edge ? (key === "LEFT" ? 10 : 298) : x - 22,
    to: edge ? (key === "LEFT" ? 12 : 302) : x + 22,
    hint: [x, edge ? 137 : 62],
    edge,
  };
};
const n = NAV_ID;
const navRoom = (
  id: number,
  slug: string,
  name: string,
  floor: number,
  landmark: string,
  frame: number,
  exits: Exit[],
  source?: number,
  quietFrame?: number,
): RoomSpec => {
  const encounter =
    source === undefined ? undefined : MISSIONS[1].rooms[source];
  return {
    id,
    name,
    frame,
    exits,
    gaps: [],
    blocked: (["left", "right"] as const).filter(
      (side) => !exits.some((e) => e.edge && e.key === side.toUpperCase()),
    ),
    ...(encounter === undefined
      ? {}
      : {
          role: encounter.role,
          boss: encounter.boss,
          hp: encounter.hp,
          encounter: encounter.encounter,
        }),
    quietFrame,
    signs: [],
    labels: [],
    navigation: { id: "bruel-" + slug, floor, landmark },
  };
};
export const BRUEL_NAV: MissionSpec = {
  ...MISSIONS[1],
  id: "bruel-navigation-atelier",
  start: n.cour,
  arena: n.seuil,
  rooms: {
    [n.cour]: navRoom(
      n.cour,
      "cour",
      "COUR / ENTREE",
      0,
      "arbre et banc",
      0,
      [navExit("RIGHT", 298, n.vestibule, 20, "DROITE : VESTIBULE")],
      41,
    ),
    [n.vestibule]: navRoom(
      n.vestibule,
      "vestibule",
      "VESTIBULE / RDC",
      0,
      "porte vitree",
      1,
      [
        navExit("LEFT", 10, n.cour, 278, "GAUCHE : COUR"),
        navExit("RIGHT", 298, n.hall, 20, "DROITE : HALL"),
      ],
      11,
    ),
    [n.hall]: navRoom(
      n.hall,
      "hall",
      "HALL DES AILES / RDC",
      0,
      "panneau des ailes",
      1,
      [
        navExit("LEFT", 10, n.vestibule, 278, "GAUCHE : VESTIBULE"),
        navExit("UP", 60, n.principal, 50, "HAUT : GRAND ESCALIER / B12"),
        navExit("UP", 180, n.infirmerie, 55, "HAUT : INFIRMERIE / RDC"),
        navExit("RIGHT", 298, n.annexe, 20, "DROITE : ANNEXE"),
      ],
      undefined,
      3,
    ),
    [n.principal]: navRoom(
      n.principal,
      "escalier-principal",
      "GRAND ESCALIER / RDC",
      0,
      "rampe sombre",
      2,
      [
        navExit("DOWN", 60, n.hall, 65, "BAS : HALL / RDC"),
        navExit("UP", 250, n.palier, 50, "HAUT : 1ER ETAGE / AILES A-B"),
      ],
    ),
    [n.palier]: navRoom(
      n.palier,
      "palier-principal",
      "PALIER PRINCIPAL / 1ER",
      1,
      "vue sur la cour",
      1,
      [
        navExit("DOWN", 60, n.principal, 240, "BAS : GRAND ESCALIER / RDC"),
        navExit("RIGHT", 298, n.galerieA, 20, "DROITE : GALERIE A / LIAISON B"),
      ],
    ),
    [n.galerieA]: navRoom(
      n.galerieA,
      "galerie-a",
      "GALERIE A / 1ER",
      1,
      "travaux eleves",
      1,
      [
        navExit("LEFT", 10, n.palier, 278, "GAUCHE : PALIER"),
        navExit("RIGHT", 298, n.jonction, 20, "DROITE : LIAISON B10-B12"),
      ],
    ),
    [n.annexe]: navRoom(
      n.annexe,
      "escalier-annexe",
      "ESCALIER ANNEXE / RDC",
      0,
      "tuyau cuivre",
      2,
      [
        navExit("DOWN", 60, n.hall, 278, "BAS : HALL / RDC"),
        navExit("UP", 250, n.jonction, 55, "HAUT : 1ER ETAGE / AILE B"),
      ],
    ),
    [n.infirmerie]: {
      ...navRoom(
        n.infirmerie,
        "infirmerie",
        "INFIRMERIE / RDC",
        0,
        "armoire de soins",
        1,
        [navExit("DOWN", 60, n.hall, 180, "BAS : HALL / RDC")],
        undefined,
        3,
      ),
      care: { x: NAV_CARE.x, reach: NAV_CARE.reach },
    },
    [n.jonction]: navRoom(
      n.jonction,
      "jonction-b",
      "JONCTION B / 1ER",
      1,
      "porte verte et cuivre",
      1,
      [
        navExit("LEFT", 10, n.galerieA, 278, "GAUCHE : GALERIE A"),
        navExit("DOWN", 90, n.annexe, 240, "BAS : ANNEXE / RDC"),
        navExit("RIGHT", 298, n.galerieB, 20, "DROITE : B10-B12"),
      ],
      13,
    ),
    [n.galerieB]: navRoom(
      n.galerieB,
      "galerie-b",
      "GALERIE B / 1ER",
      1,
      "radiateur long",
      1,
      [
        navExit("LEFT", 10, n.jonction, 278, "GAUCHE : JONCTION"),
        navExit("RIGHT", 298, n.palierB, 20, "DROITE : B10-B12"),
      ],
      44,
    ),
    [n.palierB]: navRoom(
      n.palierB,
      "palier-b",
      "PALIER B / 1ER",
      1,
      "emploi du temps",
      1,
      [
        navExit("LEFT", 10, n.galerieB, 278, "GAUCHE : GALERIE B"),
        navExit("RIGHT", 298, n.seuil, 45, "DROITE : B12"),
      ],
      47,
      3,
    ),
    [n.seuil]: navRoom(
      n.seuil,
      "seuil-b12",
      "SEUIL B12 / 1ER",
      1,
      "porte B12",
      3,
      [],
      14,
    ),
  },
};

// A2 owns every room/exit object, so switching profile cannot alter the A1 reference.
const a2Room = (id: number, changes: Partial<RoomSpec> = {}): RoomSpec => {
  const base = BRUEL_NAV.rooms[id],
    exits = (changes.exits ?? base.exits ?? []).map((e) => ({ ...e }));
  return {
    ...base,
    ...changes,
    exits,
    blocked: (["left", "right"] as const).filter(
      (side) => !exits.some((e) => e.edge && e.key === side.toUpperCase()),
    ),
    navigation: { ...base.navigation!, revision: "A2" },
  };
};
export const BRUEL_NAV_A2: MissionSpec = {
  ...BRUEL_NAV,
  id: "bruel-navigation-atelier-a2",
  rooms: Object.fromEntries(
    Object.keys(BRUEL_NAV.rooms).map((id) => [Number(id), a2Room(Number(id))]),
  ),
};
BRUEL_NAV_A2.rooms[n.hall] = a2Room(n.hall, {
  exits: [
    navExit("LEFT", 10, n.vestibule, 278, "GAUCHE : VESTIBULE"),
    navExit("UP", 60, n.principal, 50, "HAUT : GRAND ESCALIER"),
    navExit("UP", 180, n.infirmerie, 55, "HAUT : INFIRMERIE / RDC"),
    navExit("UP", 285, n.annexe, 55, "HAUT : ESCALIER ANNEXE / 1ER"),
  ],
});
// The right opening leads into a staircase in depth, rather than a blocked passage.
BRUEL_NAV_A2.rooms[n.hall].blocked = [];
BRUEL_NAV_A2.rooms[n.principal] = a2Room(n.principal, {
  exits: [
    navExit("DOWN", 60, n.hall, 65, "BAS : HALL / RDC"),
    navExit("UP", 250, n.palier, 50, "HAUT : PALIER / 1ER"),
  ],
});
BRUEL_NAV_A2.rooms[n.palier] = a2Room(n.palier, {
  exits: [
    navExit("DOWN", 60, n.principal, 240, "BAS : GRAND ESCALIER / RDC"),
    navExit("RIGHT", 298, n.galerieA, 20, "DROITE : GALERIE A"),
    navExit("UP", 230, n.annexe, 55, "HAUT : PASSAGE INTERIEUR / ANNEXE"),
  ],
});
BRUEL_NAV_A2.rooms[n.annexe] = a2Room(n.annexe, {
  name: "PALIER ANNEXE / 1ER",
  frame: 1,
  exits: [
    navExit("DOWN", 60, n.hall, 278, "BAS : DESCENDRE AU HALL / RDC"),
    navExit("LEFT", 10, n.palier, 230, "GAUCHE : PALIER PRINCIPAL"),
    navExit("RIGHT", 298, n.jonction, 55, "DROITE : JONCTION"),
  ],
});
BRUEL_NAV_A2.rooms[n.annexe].navigation!.floor = 1;
BRUEL_NAV_A2.rooms[n.galerieA] = a2Room(n.galerieA, {
  exits: [
    navExit("LEFT", 10, n.palier, 278, "GAUCHE : PALIER"),
    navExit("RIGHT", 298, n.jonction, 20, "DROITE : TRAVERSEE DES AILES"),
  ],
});
BRUEL_NAV_A2.rooms[n.jonction] = a2Room(n.jonction, {
  exits: [
    navExit("LEFT", 10, n.galerieA, 278, "GAUCHE : GALERIE A"),
    navExit("UP", 90, n.annexe, 240, "HAUT : ANNEXE / 1ER"),
    navExit("RIGHT", 298, n.galerieB, 20, "DROITE : GALERIE B"),
  ],
});
BRUEL_NAV_A2.rooms[n.galerieB] = a2Room(n.galerieB, {
  exits: [
    navExit("LEFT", 10, n.jonction, 278, "GAUCHE : JONCTION"),
    navExit("RIGHT", 298, n.palierB, 20, "DROITE : PALIER B"),
  ],
});
BRUEL_NAV_A2.rooms[n.palierB] = a2Room(n.palierB, {
  exits: [
    navExit("LEFT", 10, n.galerieB, 278, "GAUCHE : GALERIE B"),
    navExit("RIGHT", 298, n.seuil, 45, "DROITE : SALLES B11-B14"),
  ],
});

export const BRUEL_NAV_A3: MissionSpec = {
  ...BRUEL_NAV_A2,
  id: "bruel-navigation-atelier-a3",
  rooms: Object.fromEntries(
    Object.entries(BRUEL_NAV_A2.rooms).map(([id, r]) => [
      id,
      {
        ...r,
        exits: r.exits?.map((e) => ({ ...e })),
        blocked: [...(r.blocked ?? [])],
        navigation: { ...r.navigation!, revision: "A3" },
      },
    ]),
  ),
};
BRUEL_NAV_A3.rooms[n.hall].exits = BRUEL_NAV_A3.rooms[n.hall].exits!.filter(
  (e) => e.target !== n.infirmerie,
);
BRUEL_NAV_A3.rooms[n.jonction].exits!.push(
  navExit("UP", 170, n.infirmerie, 55, "HAUT : INFIRMERIE / 1ER"),
);
BRUEL_NAV_A3.rooms[n.infirmerie] = {
  ...BRUEL_NAV_A3.rooms[n.infirmerie],
  name: "INFIRMERIE / 1ER",
  exits: [navExit("DOWN", 60, n.jonction, 170, "BAS : JONCTION / 1ER")],
};
BRUEL_NAV_A3.rooms[n.infirmerie].navigation!.floor = 1;

// Quiet first-floor traversal only: never mix an opening with an encounter,
// healing scene or doorway. Both directions have room to anticipate the jump.
export const A3_FLOOR_GAPS: Record<number, number[][]> = {
  [n.palier]: [[138, 170]],
  [n.galerieA]: [[145, 177]],
};
for (const [id, gaps] of Object.entries(A3_FLOOR_GAPS))
  BRUEL_NAV_A3.rooms[Number(id)].gaps = gaps.map((g) => [...g]);

export class NavigationCare {
  used = false;
  active = false;
  elapsed = 0;
  gain: 1 | 2 = 1;
  reset(gain: 1 | 2) {
    this.used = false;
    this.active = false;
    this.elapsed = 0;
    this.gain = gain;
  }
  start(hp: number) {
    if (this.used || this.active || hp <= 0 || hp >= NAV_CARE.cap) return false;
    this.active = true;
    this.elapsed = 0;
    return true;
  }
  cancel() {
    this.active = false;
    this.elapsed = 0;
  }
  tick(dt: number, hp: number, remaining: number) {
    if (!this.active) return 0;
    if (hp <= 0 || remaining <= 0) {
      this.cancel();
      return 0;
    }
    this.elapsed += dt;
    if (this.elapsed + 1e-8 < NAV_CARE.seconds) return 0;
    const amount = Math.min(this.gain, NAV_CARE.cap - hp);
    this.active = false;
    this.used = true;
    return amount;
  }
}

export type NavigationVisit = {
  zone: string;
  visit: number;
  hp: number;
  remaining: number;
  active: Record<string, number>;
};
export class NavigationMetrics {
  revision: "A1" | "A2" | "A3" | "H1" | "I1" | "I2" | "I2";
  constructor(revision: "A1" | "A2" | "A3" | "H1" | "I1" | "I2" | "I2" = "A1") {
    this.revision = revision;
  }
  end?: { outcome: string; hp: number; remaining: number; careUsed: boolean };
  visits: NavigationVisit[] = [];
  choices: {
    from: string;
    to: string;
    hp: number;
    remaining: number;
    annexe: boolean;
  }[] = [];
  start(id: string, hp: number, remaining: number) {
    this.visits.push({
      zone: id,
      visit: this.visits.filter((v) => v.zone === id).length + 1,
      hp,
      remaining,
      active: {},
    });
  }
  tick(category: string, dt: number) {
    const v = this.visits.at(-1);
    if (v) v.active[category] = (v.active[category] ?? 0) + dt;
  }
  snapshot() {
    return {
      profile: ["I1", "I2"].includes(this.revision)
        ? "inshape-navigation-atelier-" + this.revision.toLowerCase()
        : this.revision === "H1"
          ? "hanouna-navigation-atelier-h1"
          : this.revision !== "A1"
            ? "bruel-navigation-atelier-" + this.revision.toLowerCase()
            : "bruel-navigation-atelier",
      revision: this.revision,
      visits: this.visits.map((v) => ({ ...v, active: { ...v.active } })),
      choices: [...this.choices],
      returns: this.visits.filter((v) => v.visit > 1).length,
      annexeUses: this.choices.filter((c) => c.annexe).length,
      midcourseUses: this.choices.filter(
        (c) =>
          c.from === "bruel-palier-principal" &&
          c.to === "bruel-escalier-annexe",
      ).length,
      ...(["I1", "I2"].includes(this.revision)
        ? {
            coveredPassageUses: this.choices.filter(
              (c) => c.from === "i-cour" && c.to === "i-vestiaire",
            ).length,
            serviceStairUses: this.choices.filter(
              (c) => c.from === "i-service" && c.to === "i-palier-service",
            ).length,
          }
        : {}),
      ...(this.end ? { end: { ...this.end } } : {}),
    };
  }
}
