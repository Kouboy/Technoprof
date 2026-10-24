export type CinematicKind = "intro" | "ending";
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
    this.count = kind === "intro" ? 2 : 9;
  }
  get frame() {
    return this.index + (this.kind === "intro" ? 0 : 2);
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
