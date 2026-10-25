export type CinematicKind = "intro" | "ending";
export type CinematicCue = "alarm" | "doorbell" | "bell";
export type CinematicTexture = "cinematic-storyboard" | "cinematic-intro-v2" | "cinematic-campus-v2";
type CinematicPanel = { id: string; texture: CinematicTexture; frame: number; cue?: CinematicCue };
const original = (id: string, frame: number, cue?: CinematicCue): CinematicPanel =>
  ({ id, texture: "cinematic-storyboard", frame, cue });
const campus = (id: string, frame: number): CinematicPanel =>
  ({ id, texture: "cinematic-campus-v2", frame });
export const CINEMATIC_PANELS: Record<CinematicKind, readonly CinematicPanel[]> = {
  intro: [
    { id: "wake-in-bed", texture: "cinematic-intro-v2", frame: 0, cue: "alarm" },
    { id: "departure", texture: "cinematic-intro-v2", frame: 1 },
  ],
  ending: [
    original("grading", 2), original("fatigue", 3), original("doorbell", 4, "doorbell"),
    original("visitor", 5), original("invitation", 6), campus("courtyard", 0),
    original("corridor", 7), campus("preparation", 1), original("classroom", 8),
    campus("aesh", 2), original("bell", 9, "bell"), original("wake", 10, "alarm"),
  ],
};
export const CINEMATIC = { minimumSeconds: 0.45, fadeSeconds: 0.18 };
export class CinematicSequence {
  private static serial = 0;
  readonly token = ++CinematicSequence.serial;
  index = 0;
  age = 0;
  done = false;
  readonly count: number;
  readonly kind: CinematicKind;
  constructor(kind: CinematicKind) {
    this.kind = kind;
    this.count = CINEMATIC_PANELS[kind].length;
  }
  get panel() {
    return CINEMATIC_PANELS[this.kind][this.index];
  }
  get cue() {
    return this.panel.cue;
  }
  get frame() {
    return this.panel.frame;
  }
  get ready() {
    return !this.done && this.age >= CINEMATIC.minimumSeconds;
  }
  tick(dt: number, paused: boolean) {
    if (!paused && !this.done) this.age += dt;
  }
  advance() {
    if (!this.ready) return false;
    if (this.index + 1 === this.count) this.done = true;
    else {
      this.index++;
      this.age = 0;
    }
    return true;
  }
  skip() {
    if (this.kind === "intro") this.done = true;
  }
}
