import { PLAY } from "./gameplay";
// Workshop alternatives only. The normal day always uses reference.
export const GAMEFEEL = {
  reference: { attackBuffer: PLAY.attackBuffer, jumpBuffer: 0 },
  tolerant: { attackBuffer: 0.16, jumpBuffer: 0.09 },
} as const;
export type GamefeelVariant = keyof typeof GAMEFEEL;
export const GAMEFEEL_STATIONS = {
  encounter: {
    label: "1 · Rencontre aux Ormeaux",
    scenario: "hanouna-navigation-h1-view-201",
  },
  parent: {
    label: "2 · Parent influent",
    scenario: "bruel-navigation-a3-parent",
  },
  gaps: {
    label: "3 · Deux trous aux Trois-Ponts",
    scenario: "inshape-navigation-i2-view-317",
  },
} as const;
export type GamefeelStation = keyof typeof GAMEFEEL_STATIONS;
export function gamefeelScenario(name: string) {
  const match =
    /^gamefeel-(reference|tolerant)(?:-(encounter|parent|gaps))?$/.exec(name);
  if (!match) return null;
  return {
    variant: match[1] as GamefeelVariant,
    station: (match[2] || "encounter") as GamefeelStation,
  };
}
