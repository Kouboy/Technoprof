import { INSHAPE_ID, INSHAPE_NAV } from "./inshape-navigation";
import type { MissionSpec, RoomSpec } from "./missions";

// Combat comparison only: every exit, floor break, care rule and deadline is
// copied from I1. A deep copy keeps subsequent I2 tuning out of the I1 control.
export const INSHAPE_NAV_I2: MissionSpec = structuredClone(INSHAPE_NAV);
INSHAPE_NAV_I2.id = "inshape-navigation-atelier-i2";

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
