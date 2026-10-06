import { INSHAPE_ID, INSHAPE_NAV } from "./inshape-navigation";
import type { MissionSpec, RoomSpec } from "./missions";
import { navExit } from "./bruel-navigation";

// A deep copy keeps I2 combat and navigation changes out of the I1 control.
export const INSHAPE_NAV_I2: MissionSpec = structuredClone(INSHAPE_NAV);
INSHAPE_NAV_I2.id = "inshape-navigation-atelier-i2";
export const INSHAPE_I2_CARE = { corridor: 317, entranceX: 191 };
const rooms = INSHAPE_NAV_I2.rooms;
// Move the single existing infirmary; the gallery no longer offers care.
rooms[INSHAPE_ID.galerie].exits = rooms[INSHAPE_ID.galerie].exits!.filter(
  (e) => e.target !== INSHAPE_ID.infirmerie,
);
rooms[INSHAPE_ID.preparation].exits!.push({
  ...navExit(
    "UP",
    INSHAPE_I2_CARE.entranceX,
    INSHAPE_I2_CARE.corridor,
    20,
    "HAUT : INFIRMERIE / COULOIR DE SOINS",
  ),
  // The branch sits on the landing between the second and third floor breaks.
  from: 177,
  to: 205,
});
rooms[INSHAPE_I2_CARE.corridor] = {
  id: INSHAPE_I2_CARE.corridor,
  name: "COULOIR DE SOINS / 1ER",
  frame: 1,
  gaps: [
    [108, 132],
    [195, 219],
  ],
  exits: [
    navExit(
      "DOWN",
      35,
      INSHAPE_ID.preparation,
      INSHAPE_I2_CARE.entranceX,
      "BAS : PREPARATION T / RETOUR",
    ),
    navExit("RIGHT", 298, INSHAPE_ID.infirmerie, 60, "DROITE : INFIRMERIE"),
  ],
  blocked: ["left"],
  signs: [],
  labels: [],
  navigation: {
    id: "i2-couloir-soins",
    floor: 1,
    landmark: "tuyau clair et fenetre sur les toits ateliers",
    revision: "I1",
  },
};
rooms[INSHAPE_ID.infirmerie].exits = [
  navExit(
    "DOWN",
    60,
    INSHAPE_I2_CARE.corridor,
    278,
    "BAS : COULOIR DE SOINS / 1ER",
  ),
];

function pair(id: number, formation: NonNullable<RoomSpec["formation"]>) {
  const room = INSHAPE_NAV_I2.rooms[id];
  room.formation = formation;
}

pair(INSHAPE_ID.couloir, [
  { role: "student", x: 165, hp: 2 },
  { role: "thrower", x: 235, hp: 2 },
]);
pair(INSHAPE_ID.liaison, [
  { role: "guard", x: 165, hp: 2 },
  { role: "thrower", x: 235, hp: 2 },
]);
// The guard now speaks first; the inherited I1 speech belonged to the thrower.
INSHAPE_NAV_I2.rooms[INSHAPE_ID.liaison].encounter = structuredClone(
  INSHAPE_NAV.rooms[INSHAPE_ID.parvis].encounter!,
);
