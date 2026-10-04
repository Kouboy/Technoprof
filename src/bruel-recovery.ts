import {
  advanceDialogue,
  DIALOGUE,
  dialogueLength,
  type DialogueState,
} from "./dialogue";

export const INFIRMARY = {
  teacherX: 116,
  nurseX: 225,
  exitX: 60,
  walk: 60,
  encounter: {
    name: "INFIRMIERE",
    pages: [
      ["Vous avez l'air à bout.", "Venez, posez-vous un instant."],
      ["Vous n'avez pas à tenir", "tout ça tout seul."],
      ["Voilà. Prenez soin de vous.", "Bon courage pour la classe."],
    ],
  },
};
// Usage belongs to NavigationCare. Reserving it on entry prevents reentry or a
// paused transition from replaying the scene. No elapsed-time healing mechanic.
export class InfirmaryRecovery {
  state: "idle" | "enter" | "dialogue" | "leave" = "idle";
  dialogue: DialogueState = { page: 0, characters: 0 };
  healed = false;
  get active() {
    return this.state !== "idle";
  }
  reset() {
    this.state = "idle";
    this.dialogue = { page: 0, characters: 0 };
    this.healed = false;
  }
  start() {
    this.reset();
    this.state = "enter";
  }
  tick(dt: number, action: boolean) {
    if (this.state !== "dialogue") return;
    this.dialogue.characters = Math.min(
      dialogueLength(0, this.dialogue, INFIRMARY.encounter),
      this.dialogue.characters + DIALOGUE.charactersPerSecond * dt,
    );
    if (!action) return;
    const result = advanceDialogue(0, this.dialogue, INFIRMARY.encounter);
    if (result === "finished") this.state = "leave";
    return result;
  }
}

export const PARENT_CYCLE = {
  maxHits: 2,
  openingSeconds: 1.15,
  firstHitOpening: 0.65,
  breakSeconds: 0.38,
  retreat: 34,
  distance: 84,
};
export type ParentCycle = {
  phase: "guard" | "windup" | "charge" | "opening" | "breakaway";
  hits: number;
  elapsed: number;
  fromX?: number;
  targetX?: number;
  playerFrom?: number;
  playerTarget?: number;
};
export function parentCycle(): ParentCycle {
  return { phase: "guard", hits: 0, elapsed: 0 };
}
