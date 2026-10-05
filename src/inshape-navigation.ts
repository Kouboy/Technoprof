import {
  MISSIONS,
  missionEnemies,
  type MissionSpec,
  type RoomSpec,
} from "./missions";
import { navExit } from "./bruel-navigation";
import type { Exit } from "./world";

// I1 is an isolated workshop, following the approved graph rather than DAY_LOAD.
export const INSHAPE_ID = {
  parvis: 300,
  accueil: 301,
  couloir: 302,
  escalier: 303,
  galerie: 304,
  jonction: 305,
  liaison: 306,
  preparation: 307,
  sas: 308,
  seuil: 309,
  cour: 310,
  atelier: 311,
  vestiaire: 312,
  service: 313,
  palierService: 314,
  infirmerie: 315,
  prefab: 316,
};
const i = INSHAPE_ID;
function zone(
  id: number,
  slug: string,
  name: string,
  floor: number,
  landmark: string,
  exits: Exit[],
  source?: number,
): RoomSpec {
  const original = source === undefined ? undefined : MISSIONS[2].rooms[source];
  const enemy = source === undefined ? undefined : missionEnemies(2, source)[0];
  return {
    id,
    name,
    frame: id === i.parvis || id === i.cour ? 0 : id === i.seuil ? 3 : 1,
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
    navigation: { id: "i-" + slug, floor, landmark, revision: "I1" },
  };
}
export const INSHAPE_NAV: MissionSpec = {
  ...MISSIONS[2],
  id: "inshape-navigation-atelier-i1",
  start: i.parvis,
  arena: i.seuil,
  rooms: {
    [i.parvis]: zone(
      i.parvis,
      "parvis",
      "PARVIS / ACCUEIL",
      0,
      "grille et facade ateliers",
      [navExit("RIGHT", 298, i.accueil, 20, "DROITE : ACCUEIL")],
      61,
    ),
    [i.accueil]: zone(
      i.accueil,
      "accueil",
      "ACCUEIL / RDC",
      0,
      "guichet ferme et pilier bleu",
      [
        navExit("LEFT", 10, i.parvis, 278, "GAUCHE : PARVIS"),
        navExit("RIGHT", 298, i.couloir, 20, "DROITE : BATIMENT PRINCIPAL"),
        navExit("UP", 180, i.cour, 60, "HAUT : COUR / ATELIERS"),
      ],
    ),
    [i.couloir]: zone(
      i.couloir,
      "couloir",
      "COULOIR PRINCIPAL / RDC",
      0,
      "bureaux et neons incomplets",
      [
        navExit("LEFT", 10, i.accueil, 278, "GAUCHE : ACCUEIL"),
        navExit("RIGHT", 298, i.escalier, 60, "DROITE : ESCALIER PRINCIPAL"),
      ],
      64,
    ),
    [i.escalier]: {
      ...zone(
        i.escalier,
        "escalier",
        "ESCALIER PRINCIPAL / RDC",
        0,
        "rampe bleue",
        [
          navExit("DOWN", 60, i.couloir, 278, "BAS : COULOIR / RDC"),
          navExit("UP", 250, i.galerie, 60, "HAUT : GALERIE T / 1ER"),
        ],
      ),
      gaps: [[143, 175]],
    },
    [i.galerie]: zone(
      i.galerie,
      "galerie",
      "GALERIE T01-T02 / 1ER",
      1,
      "pilier bleu et toits ateliers",
      [
        navExit("DOWN", 60, i.escalier, 250, "BAS : PRINCIPAL / RDC"),
        navExit("RIGHT", 298, i.jonction, 20, "DROITE : LIAISON T03-T06"),
        navExit("UP", 180, i.palierService, 278, "HAUT : PALIER SERVICE / 1ER"),
      ],
      67,
    ),
    [i.jonction]: zone(
      i.jonction,
      "jonction",
      "JONCTION T / 1ER",
      1,
      "pilier bleu et casiers orange dans descente",
      [
        navExit("LEFT", 10, i.galerie, 278, "GAUCHE : GALERIE T01-T02"),
        navExit("DOWN", 70, i.vestiaire, 250, "BAS : ATELIERS / RDC"),
        navExit("UP", 180, i.infirmerie, 60, "HAUT : INFIRMERIE"),
        navExit("RIGHT", 298, i.liaison, 20, "DROITE : LABORATOIRES T03-T06"),
      ],
      73,
    ),
    [i.liaison]: zone(
      i.liaison,
      "liaison",
      "LIAISON LABORATOIRES / 1ER",
      1,
      "vitrages armes et radiateur froid",
      [
        navExit("LEFT", 10, i.jonction, 278, "GAUCHE : JONCTION T"),
        navExit("RIGHT", 298, i.preparation, 20, "DROITE : PREPARATION T"),
      ],
      70,
    ),
    [i.preparation]: zone(
      i.preparation,
      "preparation",
      "PREPARATION T / 1ER",
      1,
      "paillasse et placard condamne",
      [
        navExit("LEFT", 10, i.liaison, 278, "GAUCHE : LIAISON"),
        navExit("RIGHT", 298, i.sas, 20, "DROITE : SALLES T03-T04"),
      ],
      76,
    ),
    [i.sas]: {
      ...zone(
        i.sas,
        "sas",
        "SAS T03-T04 / 1ER",
        1,
        "porte coupe feu et badge",
        [
          navExit("LEFT", 10, i.preparation, 278, "GAUCHE : PREPARATION"),
          navExit("RIGHT", 298, i.seuil, 45, "DROITE : T03"),
        ],
        79,
      ),
      actor: "catchup-student",
      encounter: {
        name: "ELEVE DE TERMINALE",
        pages: [
          ["Monsieur, vous partez pas !", "On a perdu des mois de cours."],
          ["Pas de remplaçant. Et moi,", "j'ai Parcoursup à préparer."],
          ["Vous allez nous faire", "rattraper. Je vous lâche pas."],
        ],
      },
    },
    [i.seuil]: zone(
      i.seuil,
      "seuil",
      "SEUIL T03 / 1ER",
      1,
      "lecteur badge et porte labo",
      [],
      24,
    ),
    [i.cour]: zone(
      i.cour,
      "cour",
      "COUR TECHNIQUE / RDC",
      0,
      "chateau eau et auvent tole",
      [
        navExit("LEFT", 10, i.accueil, 180, "GAUCHE : ACCUEIL"),
        navExit("UP", 70, i.atelier, 20, "HAUT : ATELIER A"),
        navExit(
          "UP",
          160,
          i.vestiaire,
          70,
          "HAUT : PASSAGE COUVERT / VESTIAIRE",
        ),
        navExit("UP", 255, i.service, 20, "HAUT : SERVICE"),
      ],
    ),
    [i.atelier]: zone(
      i.atelier,
      "atelier",
      "ATELIER A / RDC",
      0,
      "etabli et machines entretenues",
      [
        navExit("LEFT", 10, i.cour, 70, "GAUCHE : COUR TECHNIQUE"),
        navExit("RIGHT", 298, i.vestiaire, 20, "DROITE : VESTIAIRE"),
        navExit("UP", 180, i.prefab, 60, "HAUT : VIE SCOLAIRE / PREFABRIQUE"),
      ],
      21,
    ),
    [i.vestiaire]: zone(
      i.vestiaire,
      "vestiaire",
      "VESTIAIRE / RDC",
      0,
      "casiers orange et escalier ateliers",
      [
        navExit("LEFT", 10, i.atelier, 278, "GAUCHE : ATELIER A"),
        navExit("DOWN", 70, i.cour, 160, "BAS : COUR / PASSAGE COUVERT"),
        navExit("UP", 250, i.jonction, 70, "HAUT : AILE T / 1ER"),
      ],
      25,
    ),
    [i.service]: {
      ...zone(
        i.service,
        "service",
        "PASSAGE SERVICE / RDC",
        0,
        "tuyau jaune et escalier metal",
        [
          navExit("LEFT", 10, i.cour, 255, "GAUCHE : COUR TECHNIQUE"),
          navExit(
            "UP",
            250,
            i.palierService,
            60,
            "HAUT : PALIER SERVICE / 1ER",
          ),
        ],
      ),
      gaps: [[143, 175]],
    },
    [i.palierService]: {
      ...zone(
        i.palierService,
        "palier-service",
        "PALIER SERVICE / 1ER",
        1,
        "tuyau jaune et grille corrodee",
        [
          navExit("DOWN", 60, i.service, 250, "BAS : SERVICE / RDC"),
          navExit("RIGHT", 298, i.galerie, 180, "DROITE : GALERIE T"),
        ],
      ),
      gaps: [[143, 175]],
    },
    [i.infirmerie]: {
      ...zone(
        i.infirmerie,
        "infirmerie",
        "INFIRMERIE / 1ER",
        1,
        "lit et linge propre",
        [navExit("DOWN", 60, i.jonction, 180, "BAS : JONCTION T / 1ER")],
      ),
      care: { x: 180, reach: 22 },
    },
    [i.prefab]: zone(
      i.prefab,
      "prefab",
      "VIE SCOLAIRE / RDC",
      0,
      "bardage et planning scolaire",
      [navExit("DOWN", 60, i.atelier, 180, "BAS : ATELIER A / RDC")],
    ),
  },
};
