import type { CinematicSequence } from "./cinematic";

// Unchanged approved stems: independent music / effects gains, one cue clock.
export const CINEMATIC_AUDIO = {
  intro: {
    music: "intro-2026-10-25/Intro-Musique.wav",
    cues: "intro-2026-10-25/Intro-Reperes.wav",
  },
  ending: {
    music: "cinematiques-2026-10-25-v3/Fin-Musique.wav",
    cues: "cinematiques-2026-10-25-v3/Fin-Reperes.wav",
  },
} as const;
export type FilmAudioState = {
  paused: boolean;
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
};
const gain = (v: number) =>
  Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
export class CinematicSoundtrack {
  blocked = false;
  private players?: [HTMLAudioElement, HTMLAudioElement];
  private token = -1;
  private generation = 0;
  private pending = false;
  private started = false;
  private suspended = true;
  private duration = 0;
  constructor(private makePlayer = () => document.createElement("audio")) {}
  sync(sequence: CinematicSequence | null, state: FilmAudioState) {
    if (!sequence) {
      this.stop();
      return;
    }
    if (sequence.token !== this.token) {
      this.stop();
      this.token = sequence.token;
      this.duration = Number.isFinite(sequence.totalSeconds)
        ? sequence.totalSeconds
        : 0;
      const files = CINEMATIC_AUDIO[sequence.kind];
      this.players = [this.makePlayer(), this.makePlayer()];
      this.players.forEach((p, i) => {
        p.loop = false;
        p.preload = "auto";
        p.src = "audio/" + (i === 0 ? files.music : files.cues);
      });
    }
    const [music, cues] = this.players!;
    music.volume = state.muted ? 0 : gain(state.musicVolume);
    cues.volume = state.muted ? 0 : gain(state.effectsVolume) * 0.5;
    this.suspended = state.paused;
    if (this.suspended) {
      if (this.pending) {
        this.generation++;
        this.pending = false;
      }
      music.pause();
      cues.pause();
      return;
    }
    if (
      this.started &&
      music.readyState >= 1 &&
      Math.abs(music.currentTime - cues.currentTime) > 0.08
    )
      music.currentTime = cues.currentTime;
    this.play();
  }
  time() {
    if (!this.started || this.blocked || !this.players) return null;
    // Some native WAV decoders end a few milliseconds before their declared
    // duration. The ended flags finish the montage, never an exact-time guess.
    if (this.duration > 0) {
      if (this.players.every((p) => p.ended)) return this.duration;
      return Math.min(this.players[1].currentTime, this.duration - 1e-6);
    }
    return this.players[1].currentTime;
  }
  private play() {
    if (
      !this.players ||
      this.suspended ||
      this.blocked ||
      this.pending ||
      this.players[1].ended
    )
      return;
    if (this.players.every((p) => !p.paused)) return;
    const token = this.generation,
      players = this.players;
    this.pending = true;
    try {
      Promise.all(players.map((p) => p.play())).then(
        () => {
          if (token !== this.generation) return;
          this.pending = false;
          this.started = true;
          if (this.suspended) players.forEach((p) => p.pause());
        },
        () => {
          if (token !== this.generation) return;
          this.pending = false;
          this.blocked = true;
          players.forEach((p) => p.pause());
        },
      );
    } catch {
      this.pending = false;
      this.blocked = true;
      players.forEach((p) => p.pause());
    }
  }
  retry() {
    if (!this.blocked) return;
    this.blocked = false;
    this.play();
  }
  stop() {
    if (!this.players) return;
    this.generation++;
    this.pending = false;
    this.started = false;
    this.blocked = false;
    this.suspended = true;
    this.token = -1;
    for (const p of this.players) {
      p.pause();
      p.removeAttribute("src");
      p.load();
    }
    this.players = undefined;
  }
  destroy() {
    this.stop();
  }
}
