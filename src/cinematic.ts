export type CinematicKind = "intro" | "ending";
export type CinematicCue = "alarm" | "doorbell" | "bell";
export type CinematicTexture = "cinematic-storyboard" | "cinematic-intro-v2" | "cinematic-campus-v2";
type CinematicPanel = { id: string; texture: CinematicTexture; frame: number; seconds: number; cue?: CinematicCue; cut?: boolean };
const original = (id: string, frame: number, seconds: number, cue?: CinematicCue, cut = false): CinematicPanel =>
  ({ id, texture: "cinematic-storyboard", frame, seconds, cue, cut });
const campus = (id: string, frame: number, seconds: number): CinematicPanel =>
  ({ id, texture: "cinematic-campus-v2", frame, seconds });
export const CINEMATIC_PANELS: Record<CinematicKind, readonly CinematicPanel[]> = {
  intro: [
    { id: "wake-in-bed", texture: "cinematic-intro-v2", frame: 0, seconds: 5.5, cue: "alarm" },
    { id: "departure", texture: "cinematic-intro-v2", frame: 1, seconds: 4.5 },
  ],
  ending: [
    original("grading", 2, 5), original("fatigue", 3, 3.5), original("doorbell", 4, 2.5, "doorbell"),
    original("visitor", 5, 4), original("invitation", 6, 4), campus("courtyard", 0, 7),
    original("corridor", 7, 5), campus("preparation", 1, 6), original("classroom", 8, 7),
    campus("aesh", 2, 6), original("bell", 9, 1.2, "bell", true), original("wake", 10, 5.8, "alarm", true),
  ],
};
export const CINEMATIC = { fadeSeconds: 0.18 };
export function cinematicTimecodes(kind: CinematicKind) {
  let start = 0;
  return CINEMATIC_PANELS[kind].map(panel => {
    const entry = { id: panel.id, start, end: start + panel.seconds, seconds: panel.seconds, cue: panel.cue ?? "" };
    start = entry.end;
    return entry;
  });
}
export class CinematicSequence {
  private static serial = 0;
  readonly token = ++CinematicSequence.serial;
  index = 0;
  age = 0;
  elapsed = 0;
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
  get totalSeconds() {
    return CINEMATIC_PANELS[this.kind].reduce((sum, p) => sum + p.seconds, 0);
  }
  tick(dt: number, paused: boolean) {
    if (paused || this.done || !Number.isFinite(dt) || dt < 0) return;
    this.elapsed = Math.min(this.totalSeconds, this.elapsed + dt);
    let start = 0;
    for (let i = 0; i < this.count; i++) {
      const end = start + CINEMATIC_PANELS[this.kind][i].seconds;
      if (this.elapsed + 1e-9 < end) {
        this.index = i;
        this.age = Math.max(0, this.elapsed - start);
        return;
      }
      start = end;
    }
    this.elapsed = this.totalSeconds;
    this.index = this.count - 1;
    this.age = this.panel.seconds;
    this.done = true;
  }
  skip() {
    this.done = true;
  }
}
