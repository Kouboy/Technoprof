/// <reference types="vite/client" />
import morning from "../audio/bulletins/matin.mp3?inline";
import noon from "../audio/bulletins/midi.mp3?inline";
import evening from "../audio/bulletins/soir.mp3?inline";

const recordings = [morning, noon, evening];

export class RadioBulletin {
  private mission: number | null = null;
  private request?: Promise<AudioBuffer>;
  private buffer?: AudioBuffer;
  private source?: AudioBufferSourceNode;
  private gain?: GainNode;
  private startedAt = 0;
  private offset = 0;
  done = false;
  failed = false;

  get playing() {
    return !!this.source && this.source.context.state === "running";
  }

  sync(
    context: AudioContext | undefined,
    mission: number | null,
    paused: boolean,
    volume: number,
  ) {
    if (mission !== this.mission) {
      this.stop();
      this.mission = mission;
      this.request = this.buffer = undefined;
      this.offset = 0;
      this.done = this.failed = false;
    }
    if (mission === null || !context || this.done) return;
    if (paused) {
      if (this.source)
        this.offset += Math.max(0, context.currentTime - this.startedAt);
      this.stop();
      return;
    }
    if (this.gain) this.gain.gain.value = volume;
    if (!this.request) {
      const recording = recordings[mission];
      try {
        const base64 = recording.slice(recording.indexOf(",") + 1);
        const bytes = Uint8Array.from(atob(base64), (char) =>
          char.charCodeAt(0),
        );
        const request = (this.request = context.decodeAudioData(bytes.buffer));
        void request.then(
          (buffer) => {
            if (this.request === request) this.buffer = buffer;
          },
          () => {
            if (this.request === request) this.done = this.failed = true;
          },
        );
      } catch {
        this.done = this.failed = true;
      }
      return;
    }
    if (!this.buffer || this.source || context.state !== "running") return;
    if (this.offset >= this.buffer.duration) {
      this.done = true;
      return;
    }
    if (!this.gain) {
      this.gain = context.createGain();
      this.gain.connect(context.destination);
    }
    this.gain.gain.value = volume;
    const source = (this.source = context.createBufferSource());
    source.buffer = this.buffer;
    source.connect(this.gain);
    source.onended = () => {
      if (this.source !== source) return;
      this.source = undefined;
      source.disconnect();
      this.done = true;
    };
    this.startedAt = context.currentTime;
    source.start(0, this.offset);
  }

  private stop() {
    const source = this.source;
    if (!source) return;
    this.source = undefined;
    source.onended = null;
    source.stop();
    source.disconnect();
  }
}
