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
      profile: "bruel-navigation-atelier",
      visits: this.visits.map((v) => ({ ...v, active: { ...v.active } })),
      choices: [...this.choices],
      returns: this.visits.filter((v) => v.visit > 1).length,
      annexeUses: this.choices.filter((c) => c.annexe).length,
      ...(this.end ? { end: { ...this.end } } : {}),
    };
  }
}
