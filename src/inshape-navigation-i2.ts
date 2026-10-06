import { INSHAPE_ID, INSHAPE_NAV } from "./inshape-navigation";
import type { MissionSpec, RoomSpec } from "./missions";

// Combat comparison only: every exit, floor break, care rule and deadline is
// copied from I1. A deep copy keeps subsequent I2 tuning out of the I1 control.
export const INSHAPE_NAV_I2: MissionSpec = structuredClone(INSHAPE_NAV);
INSHAPE_NAV_I2.id = "inshape-navigation-atelier-i2";

function pair(
  id: number,
  formation: NonNullable<RoomSpec["formation"]>,
  lines: string[],
) {
  const room = INSHAPE_NAV_I2.rooms[id];
  room.formation = formation;
  if (room.encounter) room.encounter.pages.push(lines);
}

pair(
  INSHAPE_ID.couloir,
  [
    { role: "student", x: 165, hp: 2 },
    { role: "thrower", x: 235, hp: 2 },
  ],
  ["Mon pote vous attend au fond.", "Il a ses bouquins prêts."],
);
pair(
  INSHAPE_ID.liaison,
  [
    { role: "guard", x: 165, hp: 2 },
    { role: "thrower", x: 235, hp: 2 },
  ],
  ["Au fond, l'élève veut ses cours.", "Et il lance déjà ses livres."],
);
// The guard now speaks first; the inherited I1 speech belonged to the thrower.
INSHAPE_NAV_I2.rooms[INSHAPE_ID.liaison].encounter = {
  name: "AGENT DE SECURITE",
  pages: [
    ["Consigne : accès interdit.", "Remplaçant ? Même chose."],
    ["Au fond, l'élève veut ses cours.", "Et il lance déjà ses livres."],
  ],
};
