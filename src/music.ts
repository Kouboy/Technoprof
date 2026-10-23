// Local musical profile; the approved title has its own foreground mix.
export const MUSIC_FILES = {
  title: "titre-reference-2026-10-23/Technoprof-Titre-Interpretation.wav",
  radio: "maquettes-2026-10-23/02-autoradio.wav",
  ormeaux: "maquettes-2026-10-23/03-ormeaux.wav",
  berthelot: "maquettes-2026-10-23/04-berthelot.wav",
  troisPonts: "maquettes-2026-10-23/05-trois-ponts.wav",
} as const;
export const MUSIC_TUNING = { volume: 0.5, titleGain: 1.8, dialogueGain: 0.55 };
export type MusicState = {
  phase: string;
  mission: number;
  paused: boolean;
  muted: boolean;
  care: boolean;
  dialogue: boolean;
  volume: number;
};
type Track = keyof typeof MUSIC_FILES;
export function musicTrack(phase: string, mission: number): Track | null {
  if (phase === "title") return "title";
  // receive includes the DATA notification. The radio starts after it ends.
  if (phase === "road") return "radio";
  if (phase === "school")
    return (["ormeaux", "berthelot", "troisPonts"] as const)[
      Math.max(0, Math.min(2, mission))
    ];
  return null;
}

export class MusicKit {
  blocked = false;
  current: Track | null = null;
  private player?: HTMLAudioElement;
  private pending = false;
  private generation = 0;
  private suspended = true;
  private makePlayer: () => HTMLAudioElement;
  constructor(makePlayer = () => document.createElement("audio")) {
    this.makePlayer = makePlayer;
  }

  sync(state: MusicState) {
    const desired = musicTrack(state.phase, state.mission);
    if (!desired) {
      this.stop();
      return;
    }
    if (desired !== this.current) {
      this.stop();
      const player = (this.player ??= this.makePlayer());
      player.loop = true;
      player.preload = "auto";
      player.src = "audio/" + MUSIC_FILES[desired];
      this.current = desired;
    }
    const volume = Number.isFinite(state.volume)
      ? Math.max(0, Math.min(1, state.volume))
      : MUSIC_TUNING.volume;
    const gain =
      desired === "title"
        ? MUSIC_TUNING.titleGain
        : state.dialogue
          ? MUSIC_TUNING.dialogueGain
          : 1;
    this.player!.volume = Math.min(1, volume * gain);
    this.suspended = state.paused || state.muted || state.care || volume === 0;
    if (this.suspended) {
      if (this.pending || !this.player!.paused) {
        this.generation++;
        this.pending = false;
        this.player!.pause();
      }
      return;
    }
    this.play();
  }

  private play() {
    if (
      !this.player ||
      !this.current ||
      this.suspended ||
      this.pending ||
      this.blocked ||
      !this.player.paused
    )
      return;
    const token = this.generation;
    this.pending = true;
    try {
      this.player.play().then(
        () => {
          if (token === this.generation) this.pending = false;
        },
        () => {
          if (token === this.generation) {
            this.pending = false;
            this.blocked = true;
          }
        },
      );
    } catch {
      this.pending = false;
      this.blocked = true;
    }
  }

  retry() {
    // Called by a real click if browser policy rejected delayed playback.
    this.blocked = false;
    this.play();
  }

  stop() {
    if (!this.current && !this.pending) return;
    this.generation++;
    this.pending = false;
    this.blocked = false;
    this.current = null;
    this.suspended = true;
    this.player?.pause();
    if (this.player) {
      try {
        this.player.currentTime = 0;
      } catch {
        /* Metadata may not be ready. */
      }
    }
  }

  destroy() {
    this.stop();
    this.player?.removeAttribute("src");
    this.player?.load();
    this.player = undefined;
  }
}
