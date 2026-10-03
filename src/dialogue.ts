export const ENCOUNTERS: Record<number, { name: string; pages: string[][] }> = {
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
      ["Mon pere preside les parents.", "Il fera sauter votre contrat."],
      ["Retirez ce zero,", "et je vous laisse passer."],
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
export const DIALOGUE = { charactersPerSecond: 34 };
export type DialogueState = { page: number; characters: number };
export function dialogueLength(room: number, state: DialogueState) {
  return ENCOUNTERS[room]?.pages[state.page]?.join("").length ?? 0;
}
export function dialogueReady(room: number, state: DialogueState) {
  return state.characters >= dialogueLength(room, state);
}
export function advanceDialogue(room: number, state: DialogueState) {
  if (!dialogueReady(room, state)) {
    state.characters = dialogueLength(room, state);
    return "revealed";
  }
  if (state.page + 1 < (ENCOUNTERS[room]?.pages.length ?? 0)) {
    state.page++;
    state.characters = 0;
    return "next";
  }
  return "finished";
}
