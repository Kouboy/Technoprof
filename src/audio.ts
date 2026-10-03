export class AudioKit {
  context?: AudioContext;
  engine?: OscillatorNode;
  motorGain?: GainNode;
  master?: GainNode;
  hum?: GainNode;
  noiseBuffer?: AudioBuffer;
  radioPlaying = false;
  radioText = "";
  radioDone = false;
  radioPaused = false;
  radioUtterance?: SpeechSynthesisUtterance;
  classroomNodes: AudioBufferSourceNode[] = [];
  muted = false;
  previous = "";
  pulse = 0;
  seconds = -1;
  unlock() {
    if (!this.context) {
      const c = (this.context = new AudioContext());
      this.master = c.createGain();
      this.master.gain.value = this.muted ? 0 : 0.7;
      this.master.connect(c.destination);
      this.engine = c.createOscillator();
      this.engine.type = "sawtooth";
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 340;
      this.motorGain = c.createGain();
      this.motorGain.gain.value = 0;
      this.engine.connect(filter).connect(this.motorGain).connect(this.master);
      this.engine.start();
      const neon = c.createOscillator();
      neon.type = "sine";
      neon.frequency.value = 100;
      this.hum = c.createGain();
      this.hum.gain.value = 0;
      neon.connect(this.hum).connect(this.master);
      neon.start();
      this.noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    void this.context.resume();
  }
  tone(
    frequency: number,
    duration = 0.08,
    volume = 0.025,
    end = frequency,
    delay = 0,
  ) {
    if (!this.context || !this.master || this.muted) return;
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain();
    const start = c.currentTime + delay;
    o.type = frequency >= 650 ? "sine" : "triangle";
    o.frequency.setValueAtTime(frequency, start);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(20, end),
      start + duration,
    );
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(volume, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    o.connect(g).connect(this.master);
    o.start(start);
    o.stop(start + duration);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
    if (frequency <= 110 && volume >= 0.025)
      this.noise(duration, volume * 0.7, 650);
  }
  noise(duration: number, volume: number, frequency: number) {
    if (!this.context || !this.master || !this.noiseBuffer || this.muted)
      return;
    const c = this.context,
      n = c.createBufferSource(),
      f = c.createBiquadFilter(),
      g = c.createGain();
    n.buffer = this.noiseBuffer;
    f.type = "lowpass";
    f.frequency.value = frequency;
    g.gain.setValueAtTime(volume, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    n.connect(f).connect(g).connect(this.master);
    n.start();
    n.stop(c.currentTime + duration);
    n.onended = () => {
      n.disconnect();
      f.disconnect();
      g.disconnect();
    };
  }
  combat(
    kind: "swing" | "block" | "hit" | "hurt" | "defeat",
    direction: number,
  ) {
    if (!this.context || !this.master || !this.noiseBuffer || this.muted)
      return;
    const c = this.context,
      now = c.currentTime;
    // Paper/air, a hard folder stop, a book's blunt thud, and clothing/body:
    // different spectra and envelopes, all synchronized with actual contact.
    const layers: Record<typeof kind, number[][]> = {
      swing: [[1700, 400, 0.11, 0.018, 0.035]],
      block: [
        [2800, 1200, 0.065, 0.085, 0.002],
        [650, 450, 0.1, 0.035, 0.002],
      ],
      hit: [
        [420, 160, 0.14, 0.12, 0.003],
        [1800, 750, 0.045, 0.055, 0.002],
      ],
      hurt: [
        [240, 85, 0.21, 0.14, 0.004],
        [900, 250, 0.12, 0.055, 0.003],
      ],
      defeat: [
        [360, 95, 0.23, 0.14, 0.003],
        [1600, 350, 0.1, 0.055, 0.002],
      ],
    };
    for (const [from, to, duration, volume, rise] of layers[kind]) {
      const source = c.createBufferSource(),
        filter = c.createBiquadFilter(),
        gain = c.createGain(),
        pan = c.createStereoPanner();
      source.buffer = this.noiseBuffer;
      filter.type = kind === "swing" ? "bandpass" : "lowpass";
      filter.Q.value = 0.7;
      filter.frequency.setValueAtTime(from, now);
      filter.frequency.exponentialRampToValueAtTime(to, now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + rise);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      pan.pan.value = Math.max(-0.25, Math.min(0.25, direction * 0.25));
      source.connect(filter).connect(gain).connect(pan).connect(this.master);
      source.start(now);
      source.stop(now + duration);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
        pan.disconnect();
      };
    }
  }
  pass(side: number, close: boolean, truck: boolean, closing = 45) {
    if (!this.context || !this.master || !this.noiseBuffer || this.muted)
      return;
    const c = this.context,
      n = c.createBufferSource(),
      f = c.createBiquadFilter(),
      g = c.createGain(),
      pan = c.createStereoPanner();
    const rush = Math.max(0, Math.min(1, closing / 100));
    const duration = 0.7 - rush * 0.32,
      now = c.currentTime;
    n.buffer = this.noiseBuffer;
    f.type = "bandpass";
    f.Q.value = 0.7;
    f.frequency.setValueAtTime(truck ? 700 : 1400, now);
    f.frequency.exponentialRampToValueAtTime(truck ? 180 : 350, now + duration);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(
      (close ? 0.065 : 0.023) * (0.6 + rush * 0.4),
      now + 0.12,
    );
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    pan.pan.value = Math.max(-0.85, Math.min(0.85, side));
    n.connect(f).connect(g).connect(pan).connect(this.master);
    n.start();
    n.stop(now + duration);
    n.onended = () => {
      n.disconnect();
      f.disconnect();
      g.disconnect();
      pan.disconnect();
    };
  }
  roadImpact(side: number, truck: boolean) {
    if (!this.context || !this.master || !this.noiseBuffer || this.muted)
      return;
    const c = this.context,
      now = c.currentTime;
    for (const [frequency, duration, volume] of [
      [260, 0.3, truck ? 0.2 : 0.15],
      [2100, 0.09, 0.07],
    ]) {
      const n = c.createBufferSource(),
        f = c.createBiquadFilter(),
        gain = c.createGain(),
        pan = c.createStereoPanner();
      n.buffer = this.noiseBuffer;
      f.type = "lowpass";
      f.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      pan.pan.value = Math.max(-0.7, Math.min(0.7, side));
      n.connect(f).connect(gain).connect(pan).connect(this.master);
      n.start(now);
      n.stop(now + duration);
      n.onended = () => {
        n.disconnect();
        f.disconnect();
        gain.disconnect();
        pan.disconnect();
      };
    }
    // Two loose-metal aftershocks, distinct from the low body thump.
    this.tone(190, 0.055, 0.011, 95, 0.11);
    this.tone(145, 0.045, 0.008, 80, 0.21);
  }
  radio(text: string, on: boolean, paused = false) {
    if (typeof speechSynthesis === "undefined") return;
    if (!on) {
      const playing = this.radioPlaying;
      this.radioUtterance = undefined;
      this.radioPlaying = false;
      this.radioPaused = false;
      this.radioText = "";
      this.radioDone = false;
      if (playing) speechSynthesis.cancel();
      return;
    }
    if (this.muted) {
      if (this.radioPlaying) {
        this.radioUtterance = undefined;
        this.radioPlaying = false;
        this.radioDone = true;
        speechSynthesis.cancel();
      }
      return;
    }
    if (paused) {
      if (this.radioPlaying && !this.radioPaused) {
        speechSynthesis.pause();
        this.radioPaused = true;
      }
      return;
    }
    if (this.radioPaused) {
      speechSynthesis.resume();
      this.radioPaused = false;
    }
    if (!this.context || this.radioText === text) return;
    const voice = speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("fr"));
    if (!voice) return;
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = "fr-FR";
    u.rate = 1.08;
    u.pitch = 0.85;
    u.volume = 0.45;
    this.radioPlaying = true;
    this.radioDone = false;
    this.radioText = text;
    this.radioUtterance = u;
    const finish = () => {
      if (this.radioUtterance !== u) return;
      this.radioPlaying = false;
      this.radioDone = true;
      this.radioUtterance = undefined;
    };
    u.onend = finish;
    u.onerror = finish;
    speechSynthesis.speak(u);
  }
  material(kind: "chair" | "paper" | "chalk", delay: number, side = 0) {
    if (!this.context || !this.master || this.muted) return;
    const c = this.context,
      duration = kind === "chair" ? 0.75 : kind === "paper" ? 0.38 : 0.9;
    const b = c.createBuffer(
        1,
        Math.floor(c.sampleRate * duration),
        c.sampleRate,
      ),
      data = b.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / c.sampleRate,
        noise = Math.random() * 2 - 1;
      brown = (brown + noise * 0.07) / 1.025;
      const pulse =
        0.3 + 0.7 * Math.abs(Math.sin(t * (kind === "chalk" ? 24 : 13)));
      const env = Math.sin((Math.PI * t) / duration) ** 2;
      data[i] =
        env *
        pulse *
        (kind === "chair"
          ? brown * 2 + Math.sin(t * 1100 + Math.sin(t * 70) * 4) * 0.12
          : noise * (kind === "paper" ? 0.35 : 0.18));
    }
    const n = c.createBufferSource(),
      f = c.createBiquadFilter(),
      g = c.createGain(),
      pan = c.createStereoPanner();
    n.buffer = b;
    f.type = "bandpass";
    f.frequency.value = kind === "chair" ? 600 : kind === "paper" ? 1800 : 2900;
    f.Q.value = 0.7;
    g.gain.value = kind === "chair" ? 0.25 : 0.15;
    pan.pan.value = side;
    n.connect(f).connect(g).connect(pan).connect(this.master);
    n.start(c.currentTime + delay);
    this.classroomNodes.push(n);
    n.onended = () => {
      n.disconnect();
      f.disconnect();
      g.disconnect();
      pan.disconnect();
      this.classroomNodes = this.classroomNodes.filter((x) => x !== n);
    };
  }
  scene(phase: string, paused: boolean, remaining: number, dt: number) {
    if (!this.context || !this.master) return;
    this.master.gain.setTargetAtTime(
      this.muted || paused ? 0 : 0.7,
      this.context.currentTime,
      0.025,
    );
    this.hum?.gain.setTargetAtTime(
      phase === "school" && !paused ? 0.006 : 0,
      this.context.currentTime,
      0.08,
    );
    if (paused) return;
    if (phase !== this.previous) {
      if (this.previous === "course") {
        for (const n of this.classroomNodes) n.stop();
        this.classroomNodes = [];
      }
      this.previous = phase;
      this.pulse = 0;
      if (phase === "course") {
        this.material("chair", 0, -0.5);
        this.material("chair", 0.35, 0.6);
        this.material("paper", 1, -0.2);
        this.material("paper", 1.4, 0.3);
        this.material("chalk", 2.1, -0.1);
      }
      if (phase === "receive") {
        this.noise(0.15, 0.018, 2400);
        for (let i = 0; i < 30; i++)
          this.tone(
            i % 3 === 0 ? 2100 : 1200,
            0.045,
            0.009,
            i % 2 ? 1800 : 900,
            i * 0.075,
          );
        [880, 660, 880].forEach((n, i) =>
          this.tone(n, 0.09, 0.02, n, 0.18 + i * 0.15),
        );
      }
      if (phase === "school") {
        this.tone(660, 0.35, 0.012, 658);
        this.tone(520, 0.5, 0.009, 518, 0.35);
      }
      if (phase === "opening") this.noise(0.22, 0.025, 320);
      if (phase === "fail")
        [220, 165, 110].forEach((n, i) =>
          this.tone(n, 0.22, 0.015, n, i * 0.23),
        );
      if (phase === "arrival") this.noise(0.45, 0.012, 1200);
    }
    this.pulse += dt;
    if (phase === "school" && this.pulse > 3.15) {
      this.pulse = 0;
      this.tone(1300, 0.035, 0.003, 650);
      this.noise(0.1, 0.003, 2800);
    }
    const seconds = Math.ceil(remaining);
    if (
      ["road", "school"].includes(phase) &&
      remaining < 30 &&
      seconds !== this.seconds
    )
      this.tone(1050, 0.025, 0.007, 850);
    this.seconds = seconds;
  }
  motor(speed: number, on: boolean) {
    if (!this.context || !this.motorGain || !this.engine) return;
    // Short changes of engine pitch evoke gear shifts while preserving speed feedback.
    const gear = Math.min(4, Math.floor(speed / 55));
    this.engine.frequency.setTargetAtTime(
      32 + speed * 0.38 - gear * 10,
      this.context.currentTime,
      0.09,
    );
    this.motorGain.gain.setTargetAtTime(
      on && !this.muted ? 0.011 + speed * 0.000025 : 0,
      this.context.currentTime,
      0.08,
    );
  }
}
