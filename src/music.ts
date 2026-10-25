// Local musical profile; the approved title has its own foreground mix.
export const MUSIC_FILES = {
  title: "titre-reference-2026-10-23/Technoprof-Titre-Interpretation.wav",
  radio: "maquettes-2026-10-23/02-autoradio.wav",
  ormeaux: "maquettes-2026-10-23/03-ormeaux.wav",
  berthelot: "maquettes-2026-10-23/04-berthelot.wav",
  troisPonts: "maquettes-2026-10-23/05-trois-ponts.wav",
  radioMidi: "complements-2026-10-23/10-autoradio-midi.wav",
  radioSoir: "complements-2026-10-23/11-autoradio-soir.wav",
  radioHome: "retour-maison-2026-10-25/13-retour-maison.wav",
  bossInspectrice: "complements-2026-10-23/06-boss-inspectrice.wav",
  bossParent: "complements-2026-10-23/07-boss-parent.wav",
  bossSecurite: "complements-2026-10-23/08-boss-securite.wav",
  care: "complements-2026-10-23/09-infirmerie.wav",
  gameOver: "complements-2026-10-23/12-gameover.wav",
} as const;
export const MUSIC_TUNING = {
  volume: 0.5,
  titleGain: 1.8,
  dialogueGain: 0.55,
  failureDelay: 0.45,
};
export type SchoolMusic = "exploration" | "boss" | "care" | "cleared";
export type MusicState = {
  phase: string;
  mission: number;
  paused: boolean;
  muted: boolean;
  schoolContext: SchoolMusic;
  age: number;
  dialogue: boolean;
  volume: number;
};
type Track = keyof typeof MUSIC_FILES;
export function musicTrack(
  phase: string,
  mission: number,
  schoolContext: SchoolMusic = "exploration",
  age = Infinity,
): Track | null {
  const index = Math.max(0, Math.min(2, mission));
  if (phase === "title") return "title";
  if (phase === "home" || phase === "homeArrival") return "radioHome";
  if (phase === "fail")
    return age >= MUSIC_TUNING.failureDelay ? "gameOver" : null;
  // receive includes the DATA notification. The radio starts after it ends.
  if (phase === "road")
    return (["radio", "radioMidi", "radioSoir"] as const)[index];
  if (phase === "school") {
    if (schoolContext === "care") return "care";
    if (schoolContext === "cleared") return null;
    if (schoolContext === "boss")
      return (["bossInspectrice", "bossParent", "bossSecurite"] as const)[
        index
      ];
    return (["ormeaux", "berthelot", "troisPonts"] as const)[index];
  }
  return null;
}

export class MusicKit {
  blocked = false;
  current: Track | null = null;
  private player?: HTMLAudioElement;
  private pending = false;
  private generation = 0;
  private sourceGeneration = 0;
  private schoolResume?: { track: Track; time: number };
  private cancelResume?: () => void;
  private suspended = true;
  private makePlayer: () => HTMLAudioElement;
  constructor(makePlayer = () => document.createElement("audio")) {
    this.makePlayer = makePlayer;
  }

  sync(state: MusicState) {
    const desired = musicTrack(
      state.phase,
      state.mission,
      state.schoolContext,
      state.age,
    );
    if (!desired) {
      this.stop();
      return;
    }
    if (desired !== this.current) {
      const previous = this.current;
      const resume =
        previous === "care" && this.schoolResume?.track === desired
          ? this.schoolResume.time
          : 0;
      const save =
        desired === "care" &&
        previous &&
        (["ormeaux", "berthelot", "troisPonts"] as Track[]).includes(previous)
          ? { track: previous, time: this.player?.currentTime ?? 0 }
          : undefined;
      this.stop(false);
      if (save) this.schoolResume = save;
      if (desired !== "care") this.schoolResume = undefined;
      const player = (this.player ??= this.makePlayer());
      player.loop = desired !== "gameOver";
      player.preload = "auto";
      player.src = "audio/" + MUSIC_FILES[desired];
      this.current = desired;
      if (resume > 0) this.resumePosition(resume);
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
    this.suspended = state.paused || state.muted || volume === 0;
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

  private resumePosition(time: number) {
    const player = this.player!,
      token = this.sourceGeneration;
    const seek = () => {
      if (token !== this.sourceGeneration || player !== this.player) return;
      try {
        player.currentTime = time;
      } catch {
        /* Retry after metadata. */
      }
    };
    seek();
    if (player.readyState < 1) {
      const loaded = () => {
        if (token !== this.sourceGeneration || player !== this.player) return;
        seek();
        this.cancelResume = undefined;
      };
      player.addEventListener("loadedmetadata", loaded, { once: true });
      this.cancelResume = () =>
        player.removeEventListener("loadedmetadata", loaded);
    }
  }

  private play() {
    if (
      !this.player ||
      !this.current ||
      this.suspended ||
      this.pending ||
      this.blocked ||
      (this.current === "gameOver" && this.player.ended) ||
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

  finished(track: Track) {
    return this.current === track && !!this.player?.ended;
  }

  retry() {
    // Called by a real click if browser policy rejected delayed playback.
    this.blocked = false;
    this.play();
  }

  stop(clearResume = true) {
    if (clearResume) this.schoolResume = undefined;
    if (!this.current && !this.pending) return;
    this.generation++;
    this.sourceGeneration++;
    this.cancelResume?.();
    this.cancelResume = undefined;
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
