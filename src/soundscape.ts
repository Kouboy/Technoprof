import type { RoomSpec } from "./missions";
export type FloorSound = "tile" | "wood" | "concrete" | "metal" | "gravel";
export type PassageSound = "passage" | "door" | "stairs";
export type PassageAudio = {
  age: number;
  sound: PassageSound;
  surface: FloorSound;
};
type Place = Pick<RoomSpec, "name" | "frame" | "navigation" | "care">;
export const WALK_SOUND = { phasePerSecond: 13, contactPeriod: 6, quiet: 0.42 };
export function floorSound(mission: number, room?: Place): FloorSound {
  if (!room || room.care) return "tile";
  if (
    room.frame === 0 ||
    (room.frame === undefined && /^(COUR|PARVIS)\b/.test(room.name))
  )
    return "concrete";
  if (mission === 2 && /SERVICE|PALIER TECHNIQUE/i.test(room.name))
    return "metal";
  if (mission === 2 && /ATELIER|TECHNIQUE/i.test(room.name)) return "concrete";
  if (mission === 1 && (room.navigation?.floor ?? 0) > 0) return "wood";
  return "tile";
}
export function passageSound(
  from: Place,
  to: Place,
  edge: boolean,
): PassageSound {
  if ((from.navigation?.floor ?? 0) !== (to.navigation?.floor ?? 0))
    return "stairs";
  if (!edge && /ESCALIER/i.test(from.name + to.name)) return "stairs";
  if (from.care || to.care || !edge || (from.frame === 0) !== (to.frame === 0))
    return "door";
  return "passage";
}
export function walkContacts(before: number, after: number) {
  return Math.min(
    1,
    Math.max(
      0,
      Math.floor((after + 1e-8) / WALK_SOUND.contactPeriod) -
        Math.floor((before + 1e-8) / WALK_SOUND.contactPeriod),
    ),
  );
}
