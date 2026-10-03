export type Encounter = { name: string; pages: string[][] };
export const ENCOUNTERS: Record<number, Encounter> = {
  1: {
    name: "PARENT D'ELEVE",
    pages: [
      ["Une semaine sans cours !", "Encore un remplacant ?"],
      ["Vous n'irez pas plus loin", "sans me repondre."],
    ],
  },
  3: {
    name: "ELEVE",
    pages: [
      ["Mon père préside le conseil", "des parents d'élèves."],
      ["Retirez ce zéro,", "ou il fera sauter votre contrat."],
    ],
  },
  6: {
    name: "VIGILE",
    pages: [
      ["Consigne de la direction :", "votre badge est hors liste."],
      ["Titulaire ou remplacant,", "vous faites demi-tour."],
    ],
  },
  4: {
    name: "INSPECTEUR",
    pages: [
      ["Votre retard sera consigne", "dans mon rapport."],
      ["Un avis defavorable,", "et votre poste saute."],
    ],
  },
};

// No timeout: X reveals the current page, then a fresh X advances it.
export const DIALOGUE = { charactersPerSecond: 34, soundInterval: 0.075 };
export type DialogueState = { page: number; characters: number };
export function dialogueLength(
  room: number,
  state: DialogueState,
  data = ENCOUNTERS[room],
) {
  return data?.pages[state.page]?.join("").length ?? 0;
}
// Only newly displayed letters/digits speak. Spaces and punctuation stay silent.
export function dialogueLetters(
  room: number,
  state: DialogueState,
  before: number,
  data = ENCOUNTERS[room],
) {
  const text = data?.pages[state.page]?.join("") ?? "";
  return /[\p{L}\p{N}]/u.test(
    text.slice(Math.floor(before), Math.floor(state.characters)),
  );
}
export function dialogueReady(
  room: number,
  state: DialogueState,
  data = ENCOUNTERS[room],
) {
  return state.characters >= dialogueLength(room, state, data);
}
export function advanceDialogue(
  room: number,
  state: DialogueState,
  data = ENCOUNTERS[room],
) {
  if (!dialogueReady(room, state, data)) {
    state.characters = dialogueLength(room, state, data);
    return "revealed";
  }
  if (state.page + 1 < (data?.pages.length ?? 0)) {
    state.page++;
    state.characters = 0;
    return "next";
  }
  return "finished";
}
