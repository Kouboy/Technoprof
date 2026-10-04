import {
  MISSIONS,
  missionEnemies,
  type MissionSpec,
  type RoomSpec,
} from "./missions";
import { navExit } from "./bruel-navigation";
import type { Exit } from "./world";

// Isolated workshop graph: never mutate the published mission or Bruel A3.
export const HANOUNA_ID = {
  cour: 200,
  vestibule: 201,
  hall: 202,
  escalier: 203,
  palier: 204,
  galerie: 205,
  jonction: 206,
  seuil: 207,
  infirmerie: 208,
};
const h = HANOUNA_ID;
function hRoom(
  id: number,
  slug: string,
  name: string,
  floor: number,
  landmark: string,
  exits: Exit[],
  source?: number,
): RoomSpec {
  const original = source === undefined ? undefined : MISSIONS[0].rooms[source];
  const enemy = source === undefined ? undefined : missionEnemies(0, source)[0];
  return {
    id,
    name,
    gaps: [],
    exits,
    blocked: (["left", "right"] as const).filter(
      (side) => !exits.some((e) => e.edge && e.key === side.toUpperCase()),
    ),
    ...(original
      ? {
          role: original.role,
          boss: original.boss,
          hp: enemy?.hp,
          encounter: original.encounter,
        }
      : {}),
    signs: [],
    labels: [],
    navigation: { id: "h-" + slug, floor, landmark, revision: "H1" },
  };
}
export const HANOUNA_NAV: MissionSpec = {
  ...MISSIONS[0],
  id: "hanouna-navigation-atelier-h1",
  start: h.cour,
  arena: h.seuil,
  rooms: {
    [h.cour]: hRoom(h.cour, "cour", "COUR / ENTREE", 0, "preau et bouleau", [
      navExit("RIGHT", 298, h.vestibule, 20, "DROITE : VESTIBULE"),
    ]),
    [h.vestibule]: hRoom(
      h.vestibule,
      "vestibule",
      "VESTIBULE / RDC",
      0,
      "porte vitree rafistolee",
      [
        navExit("LEFT", 10, h.cour, 278, "GAUCHE : COUR"),
        navExit("RIGHT", 298, h.hall, 20, "DROITE : HALL"),
      ],
      1,
    ),
    [h.hall]: hRoom(
      h.hall,
      "hall",
      "HALL / RDC",
      0,
      "panneau aile C et escalier",
      [
        navExit("LEFT", 10, h.vestibule, 278, "GAUCHE : VESTIBULE"),
        navExit("UP", 250, h.escalier, 60, "HAUT : GRAND ESCALIER / AILE C"),
      ],
    ),
    [h.escalier]: hRoom(
      h.escalier,
      "escalier",
      "GRAND ESCALIER / RDC",
      0,
      "rampe tubulaire",
      [
        navExit("DOWN", 60, h.hall, 250, "BAS : HALL / RDC"),
        navExit("UP", 250, h.palier, 60, "HAUT : PALIER C / 1ER"),
      ],
    ),
    [h.palier]: hRoom(
      h.palier,
      "palier",
      "PALIER C / 1ER",
      1,
      "vue sur le preau en contrebas",
      [
        navExit("DOWN", 60, h.escalier, 250, "BAS : GRAND ESCALIER / RDC"),
        navExit("RIGHT", 298, h.galerie, 20, "DROITE : GALERIE C30-C41"),
      ],
    ),
    [h.galerie]: hRoom(
      h.galerie,
      "galerie",
      "GALERIE C30-C41 / 1ER",
      1,
      "casiers verts et affiches",
      [
        navExit("LEFT", 10, h.palier, 278, "GAUCHE : PALIER C"),
        navExit("RIGHT", 298, h.jonction, 20, "DROITE : C42-C45"),
      ],
      3,
    ),
    [h.jonction]: hRoom(
      h.jonction,
      "jonction",
      "JONCTION C42-C45 / 1ER",
      1,
      "porte claire de l'infirmerie",
      [
        navExit("LEFT", 10, h.galerie, 278, "GAUCHE : GALERIE C30-C41"),
        navExit("RIGHT", 298, h.seuil, 45, "DROITE : C42-C45"),
        navExit("UP", 180, h.infirmerie, 60, "HAUT : INFIRMERIE"),
      ],
    ),
    [h.seuil]: hRoom(
      h.seuil,
      "seuil",
      "SEUIL 42C / 1ER",
      1,
      "porte 42C",
      [],
      4,
    ),
    [h.infirmerie]: {
      ...hRoom(
        h.infirmerie,
        "infirmerie",
        "INFIRMERIE / 1ER",
        1,
        "lit et linge propre",
        [navExit("DOWN", 60, h.jonction, 180, "BAS : JONCTION C / 1ER")],
      ),
      care: { x: 180, reach: 22 },
    },
  },
};
HANOUNA_NAV.rooms[h.seuil].encounter = {
  ...HANOUNA_NAV.rooms[h.seuil].encounter!,
  name: "INSPECTRICE",
};
