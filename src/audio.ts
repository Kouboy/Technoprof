import {
  AUDIO,
  FOLEY,
  makeMaterial,
  engineState,
  passState,
  type Material,
} from "./audio-materials";
import { DRIVE } from "./driving";
import { sfxTakes } from "./sfx-samples";
import { WALK_SOUND, type FloorSound, type PassageAudio } from "./soundscape";
type Voice = {
  source: AudioBufferSourceNode | OscillatorNode;
  nodes: AudioNode[];
  group: string;
};
type Loop = {
  source: AudioBufferSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode;
};
const clamp = (v: number, a = -1, b = 1) => Math.max(a, Math.min(b, v));
const CLASSROOM: ["chair" | "paper" | "chalk", number, number][] = [
  ["chair", 0, -0.55],
  ["chair", 0.38, 0.6],
  ["paper", 0.95, -0.25],
  ["paper", 1.45, 0.35],
  ["chalk", 2.15, -0.15],
];
export type SceneSoundContext = {
  age?: number;
  care?: boolean;
  road?: boolean;
  reason?: string | null;
  distance?: number;
  surface?: FloorSound;
  outdoor?: boolean;
  arrivalEntry?: "gate" | "door";
  transition?: PassageAudio | null;
  cinematic?: {
    kind: string;
    index: number;
    age: number;
    token?: number;
  } | null;
};
type SceneCue = [Material, number, number, string?];
export const OPENING_CUES: SceneCue[] = [
  ["handle", 0, 0.8],
  ["door", 0.12, 0.7],
  ["step", 0.7, 0.55],
  ["step", 1.02, 0.48],
  ["step", 1.34, 0.35],
];
export function sceneCues(
  phase: string,
  context: SceneSoundContext,
): SceneCue[] {
  if (phase === "opening") return OPENING_CUES;
  if (phase === "arrival")
    return [
      ["car-door", DRIVE.teacherExitSeconds, 0.95],
      ...Array.from({ length: 10 }, (_, i): SceneCue => [
        "step",
        2.48 + i * (2 / 7),
        0.65 - i * 0.035,
      ]),
      [
        context.arrivalEntry === "gate" ? "gate" : "door",
        context.arrivalEntry === "gate" ? 3.65 : 4.55,
        0.6,
      ],
    ];
  if (phase === "course") return [["bell-start", 0, 0.75, "classroom"]];
  if (phase === "later") return [["bell-end", 0, 0.75, "classroom"]];
  if (phase !== "fail") return [];
  return [
    ...(context.road
      ? context.reason === "breakdown"
        ? [
            ["stall", 0, 1],
            ["rattle", 0.4, 0.5],
          ]
        : [
            ["skid", 0, 0.45],
            ["rattle", 0.45, 0.3],
          ]
      : context.reason === "exhausted"
        ? [
            ["cloth", 0, 0.9],
            ["body", 0.4, 0.24],
          ]
        : [["paper", 0, 0.35]]),
    ["relay", 0.86, 0.65],
  ] as SceneCue[];
}
// Existing materials, tuned per gesture: no extra sample downloads or timers.
export const ENEMY_GESTURES = {
  influential: {
    windup: [["step", 0.65, 0.9]],
    release: [
      ["step", 1.1, 0.9],
      ["sweep", 0.55, 0.85],
    ],
  },
  security: {
    windup: [["relay", 0.6, 0.85]],
    release: [
      ["sweep", 0.75, 0.8],
      ["step", 0.65, 0.85],
    ],
  },
  thrower: {
    windup: [["paper", 0.55, 1.25]],
    release: [["swing", 0.45, 1.45]],
  },
  filmer: {
    windup: [["paper", 0.3, 1.1]],
    release: [["sweep", 0.5, 1.15]],
  },
} satisfies Record<string, Record<string, [Material, number, number][]>>;
export class AudioKit {
  context?: AudioContext;
  master?: GainNode;
  ambience?: GainNode;
  roomSend?: GainNode;
  ambienceSend?: GainNode;
  loops: Partial<Record<Material, Loop>> = {};
  buffers = new Map<string, AudioBuffer>();
  samples = new Map<string, Float32Array>();
  takes = new Map<Material, number>();
  surface: FloorSound = "tile";
  passage?: PassageAudio;
  passagePlayed = new Set<number>();
  storyKey = "";
  storyPulse = -1;
  preparing = false;
  voices = new Set<Voice>();
  muted = false;
  effectsVolume = 1;
  ambienceVolume = 1;
  voiceVolume = 1;
  musicVolume = 0.5;
  paused = false;
  wasMuted = false;
  previous = "";
  seconds = -1;
  pulse = 0;
  ambientDelay = 6.5;
  room = -1;
  classroomAge = 0;
  sequenceAge = 0;
  sequencePlayed = new Set<number>();
  careRoom = false;
  approachPulse = 0;
  approachInterval = 0;
  gear = -1;
  shiftUntil = 0;
  duckUntil = 0;
  serial = 0;
  radioPlaying = false;
  radioText = "";
  radioDone = false;
  radioPaused = false;
  radioFailed = false;
  radioUtterance?: SpeechSynthesisUtterance;
  prepare() {
    if (this.preparing || typeof setTimeout === "undefined") return;
    this.preparing = true;
    const kinds = Object.keys(FOLEY) as Material[];
    const next = () => {
      const kind = kinds.shift();
      if (!kind) return;
      if (!this.samples.has(kind))
        this.samples.set(kind, makeMaterial(kind, AUDIO.sampleRate));
      setTimeout(next, 0);
    };
    // One small material per task while graphics load. No context before input.
    next();
  }
  unlock() {
    if (!this.context) {
      const c = (this.context = new AudioContext());
      const limiter = c.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.knee.value = 10;
      limiter.ratio.value = 5;
      limiter.attack.value = 0.004;
      limiter.release.value = 0.16;
      const dc = c.createBiquadFilter();
      dc.type = "highpass";
      dc.frequency.value = 35;
      dc.connect(limiter).connect(c.destination);
      this.master = c.createGain();
      this.ambience = c.createGain();
      this.master.gain.value =
        this.muted || this.paused ? 0 : AUDIO.master * this.effectsVolume;
      this.ambience.gain.value =
        this.muted || this.paused ? 0 : AUDIO.master * this.ambienceVolume;
      this.master.connect(dc);
      this.ambience.connect(dc);
      const impulse = c.createBuffer(
        2,
        Math.ceil(c.sampleRate * 0.28),
        c.sampleRate,
      );
      for (let ch = 0; ch < 2; ch++) {
        const out = impulse.getChannelData(ch);
        let seed = 5303 + ch;
        for (let i = Math.floor(c.sampleRate * 0.013); i < out.length; i++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          out[i] =
            (seed / 2147483648 - 1) * Math.exp((-i / c.sampleRate) * 24) * 0.16;
        }
      }
      const roomReturn = (output: GainNode) => {
        const reverb = c.createConvolver(),
          send = c.createGain();
        reverb.buffer = impulse;
        reverb.normalize = false;
        send.gain.value = AUDIO.roomWet;
        send.connect(reverb).connect(output);
        return send;
      };
      this.roomSend = roomReturn(this.master);
      this.ambienceSend = roomReturn(this.ambience);
      this.loop("engine", this.master, 1500);
      for (const [kind, cutoff] of [
        ["wind", 1600],
        ["rolling", 700],
        ["room", 550],
        ["hum", 500],
      ] as [Material, number][])
        this.loop(kind, this.ambience, cutoff);
    }
    void this.context.resume().catch(() => {});
  }
  buffer(kind: Material, take = 0) {
    const c = this.context!;
    const key = take ? kind + ":" + take : kind;
    let b = this.buffers.get(key);
    if (!b) {
      const pcm =
        this.samples.get(key) ??
        makeMaterial(kind, AUDIO.sampleRate, 5301 + take);
      this.samples.set(key, pcm);
      b = c.createBuffer(1, pcm.length, AUDIO.sampleRate);
      b.getChannelData(0).set(pcm);
      this.buffers.set(key, b);
    }
    return b;
  }
  loop(kind: Material, output: AudioNode, cutoff: number) {
    const c = this.context!,
      source = c.createBufferSource(),
      gain = c.createGain(),
      filter = c.createBiquadFilter();
    source.buffer = this.buffer(kind);
    source.loop = true;
    source.loopStart = 0.015;
    source.loopEnd = source.buffer.duration;
    gain.gain.value = 0;
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    source.connect(filter).connect(gain).connect(output);
    source.start(c.currentTime, 0.015);
    this.loops[kind] = { source, gain, filter };
  }
  track(source: Voice["source"], nodes: AudioNode[], group: string) {
    while (this.voices.size >= AUDIO.maxVoices)
      this.stopVoice(this.voices.values().next().value!);
    const voice = { source, nodes, group };
    this.voices.add(voice);
    source.onended = () => {
      this.voices.delete(voice);
      source.disconnect();
      for (const n of nodes) n.disconnect();
    };
  }
  stopVoice(voice: Voice) {
    this.voices.delete(voice);
    const gain = (voice.nodes[0] as GainNode).gain;
    if (gain && this.context) {
      const now = this.context.currentTime;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      gain.linearRampToValueAtTime(0, now + 0.012);
    }
    try {
      voice.source.stop((this.context?.currentTime ?? 0) + 0.014);
    } catch {
      /* Already ended. */
    }
  }
  stopGroup(group?: string) {
    for (const v of [...this.voices])
      if (!group || v.group === group) this.stopVoice(v);
  }
  play(
    kind: Material,
    side = 0,
    weight = 1,
    delay = 0,
    group = "fx",
    rate = 1,
    offset = 0,
  ) {
    if (!this.context || !this.master || this.muted || this.paused) return;
    const take = this.takes.get(kind) ?? 0;
    this.takes.set(kind, take + 1);
    const c = this.context,
      buffer = this.buffer(kind, take % sfxTakes(kind)),
      start = c.currentTime + Math.max(0, delay);
    if (offset >= buffer.duration) return;
    const source = c.createBufferSource(),
      gain = c.createGain(),
      pan = c.createStereoPanner();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const peak = FOLEY[kind][1] * clamp(weight, 0, 2),
      duration = (buffer.duration - offset) / rate;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.002);
    gain.gain.setValueAtTime(peak, start + Math.max(0.002, duration - 0.014));
    gain.gain.linearRampToValueAtTime(0, start + Math.max(0.004, duration));
    pan.pan.value = clamp(side, -0.8, 0.8);
    source
      .connect(gain)
      .connect(pan)
      .connect(
        group === "ambient" || group === "classroom"
          ? this.ambience!
          : this.master,
      );
    if (
      this.roomSend &&
      !this.careRoom &&
      (this.previous === "course" ||
        this.previous === "opening" ||
        (this.previous === "school" && this.room !== 0))
    )
      pan.connect(
        group === "ambient" || group === "classroom"
          ? this.ambienceSend!
          : this.roomSend,
      );
    this.track(source, [gain, pan], group);
    source.start(start, offset);
    source.stop(start + duration + 0.004);
  }
  fx(kind: Material, side = 0, weight = 1) {
    if (kind === "step" && this.surface !== "tile")
      kind = ("step-" + this.surface) as Material;
    if (kind.startsWith("step") && this.careRoom) weight *= WALK_SOUND.quiet;
    this.play(
      kind,
      side,
      weight,
      0,
      "fx",
      1 + ((this.serial++ % 5) - 2) * 0.012,
    );
    if (
      ["book", "body", "defeat", "impact", "stamp"].includes(kind) &&
      this.context
    )
      this.attention(0.22);
  }
  attention(seconds: number) {
    if (this.context)
      this.duckUntil = Math.max(
        this.duckUntil,
        this.context.currentTime + seconds,
      );
  }
  talk(room: number, female = false, side = 0, gentle = false) {
    const rate =
      room === 3
        ? 1.4
        : room === 6
          ? 0.82
          : room === 4
            ? female
              ? 1.2
              : 0.95
            : 1.05;
    this.play(
      "talk",
      side * 0.3,
      gentle ? 0.42 : 1,
      0,
      "dialogue",
      (gentle ? 1 : rate) + ((this.serial++ % 5) - 2) * 0.025,
    );
  }
  tone(
    frequency: number,
    duration = 0.08,
    volume = 0.025,
    end = frequency,
    delay = 0,
  ) {
    if (!this.context || !this.master || this.muted || this.paused) return;
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain(),
      start = c.currentTime + delay;
    o.type = "sine";
    o.frequency.setValueAtTime(frequency, start);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(20, end),
      start + duration,
    );
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(volume, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    o.connect(g).connect(this.master);
    this.track(o, [g], "cue");
    o.start(start);
    o.stop(start + duration);
  }
  noise(duration: number, volume: number, frequency: number) {
    this.play(
      frequency > 1500 ? "paper" : "gravel",
      0,
      volume / 0.14,
      0,
      "fx",
      0.2 / Math.max(0.05, duration),
    );
  }
  combat(
    kind: "swing" | "block" | "hit" | "hurt" | "defeat",
    direction: number,
  ) {
    const material: Record<typeof kind, Material> = {
      swing: "swing",
      block: "block",
      hit: "book",
      hurt: "body",
      defeat: "defeat",
    };
    this.fx(material[kind], clamp(direction) * 0.25);
    if (kind === "defeat") this.play("book", clamp(direction) * 0.25, 0.7);
  }
  enemyGesture(
    role: keyof typeof ENEMY_GESTURES,
    stage: "windup" | "release",
    x: number,
  ) {
    for (const [material, gain, rate] of ENEMY_GESTURES[role][stage])
      this.play(material, clamp((x - 160) / 190) * 0.5, gain, 0, "fx", rate);
  }
  pass(side: number, close: boolean, truck: boolean, closing = 45) {
    const mix = passState(close, truck, closing);
    this.play(
      truck ? "truck" : "pass",
      clamp(side) * 0.75,
      mix.gain,
      0,
      "fx",
      mix.rate,
    );
    if (close) this.attention(0.24);
  }
  roadImpact(side: number, truck: boolean) {
    this.fx("impact", clamp(side) * 0.65, truck ? 1.15 : 1);
  }
  material(
    kind: "chair" | "paper" | "chalk",
    delay: number,
    side = 0,
    offset = 0,
  ) {
    this.play(kind, side, 1, delay, "classroom", 1, offset);
  }
  classroom() {
    for (const [kind, start, side] of CLASSROOM)
      if (start + FOLEY[kind][0] > this.classroomAge)
        this.material(
          kind,
          Math.max(0, start - this.classroomAge),
          side,
          Math.max(0, this.classroomAge - start),
        );
  }
  scene(
    phase: string,
    paused: boolean,
    remaining: number,
    dt: number,
    room = 0,
    dialogue = false,
    context: SceneSoundContext = {},
  ) {
    if (!this.context || !this.master) return;
    const c = this.context,
      wasPaused = this.paused;
    this.surface =
      phase === "arrival" ? "concrete" : (context.surface ?? "tile");
    this.paused = paused;
    this.master.gain.setTargetAtTime(
      this.muted || paused ? 0 : AUDIO.master * this.effectsVolume,
      c.currentTime,
      0.025,
    );
    this.ambience?.gain.setTargetAtTime(
      this.muted || paused ? 0 : AUDIO.master * this.ambienceVolume,
      c.currentTime,
      0.025,
    );
    if (this.muted && !this.wasMuted) this.stopGroup();
    this.wasMuted = this.muted;
    if (paused) {
      if (!wasPaused) this.stopGroup();
      return;
    }
    const entered = phase !== this.previous;
    const care = phase === "school" && !!context.care;
    if (care !== this.careRoom) {
      this.stopGroup("ambient");
      this.pulse = 0;
      this.careRoom = care;
    }
    if (entered) {
      this.stopGroup();
      this.previous = phase;
      this.pulse = 0;
      this.seconds = -1;
      this.room = room;
      this.classroomAge = 0;
      this.sequenceAge = 0;
      this.sequencePlayed.clear();
      this.passage = undefined;
      this.passagePlayed.clear();
      if (phase === "course") this.classroom();
      if (phase === "receive") {
        this.play("relay", 0, 1);
        this.play("data", 0, 1, 0.09, "cue");
        [880, 660, 880].forEach((f, i) =>
          this.tone(f, 0.08, 0.034, f, 2.35 + i * 0.13),
        );
        this.attention(3);
      }
      if (phase === "arrival") this.fx("gravel", 0.5, 0.8);
    } else if (wasPaused && phase === "course") this.classroom();
    if (!entered) this.sequenceAge += dt;
    const age = context.age ?? this.sequenceAge;
    sceneCues(phase, context).forEach(([kind, at, weight, group], index) => {
      const offset = Math.max(0, age - at);
      if (
        age >= at &&
        (!this.sequencePlayed.has(index) ||
          (wasPaused &&
            phase !== "arrival" &&
            !["car-door", "step", "gate"].includes(kind)))
      ) {
        this.sequencePlayed.add(index);
        const sample: Material =
          kind === "step" && this.surface !== "tile"
            ? (("step-" + this.surface) as Material)
            : kind;
        if (offset < FOLEY[sample][0])
          this.play(sample, 0.2, weight, 0, group ?? "fx", 1, offset);
      }
    });
    const transition = phase === "school" ? context.transition : null;
    if (transition) {
      if (transition !== this.passage) {
        this.stopGroup("movement");
        this.passage = transition;
        this.passagePlayed.clear();
      }
      const cues: SceneCue[] =
        transition.sound === "stairs"
          ? [["stairs", 0, 0.8]]
          : transition.sound === "door"
            ? [
                ["handle", 0, 0.55],
                ["door", 0.035, 0.38],
              ]
            : [
                ["step", 0.025, 0.55],
                ["step", 0.17, 0.48],
              ];
      cues.forEach(([kind, at, gain], i) => {
        if (transition.age >= at && !this.passagePlayed.has(i)) {
          this.passagePlayed.add(i);
          const offset = transition.age - at;
          const sample: Material =
            kind === "step" && transition.surface !== "tile"
              ? (("step-" + transition.surface) as Material)
              : kind;
          if (offset < FOLEY[sample][0])
            this.play(
              sample,
              0,
              gain * (care ? WALK_SOUND.quiet : 1),
              0,
              "movement",
              1,
              offset,
            );
        }
      });
    }
    if (phase === "course") this.classroomAge += dt;
    const story = context.cinematic;
    const storyKey = story
      ? (story.token ?? 0) + ":" + story.kind + ":" + story.index
      : "";
    if (storyKey !== this.storyKey) {
      this.stopGroup("cue");
      this.stopGroup("fx");
      this.storyKey = storyKey;
      this.storyPulse = -1;
    }
    if (story && (phase === "intro" || phase === "ending")) {
      const alarm =
        (story.kind === "intro" && story.index === 0) ||
        (story.kind === "ending" && story.index === 8);
      const pulse = alarm ? Math.floor(story.age / 1.6) : 0;
      if (pulse !== this.storyPulse) {
        this.storyPulse = pulse; // Muted/paused events are never queued for later.
        if (!this.muted) {
          if (alarm && story.age % 1.6 < 0.18) {
            [0, 0.16, 0.32].forEach((delay) =>
              this.tone(880, 0.09, 0.035, 880, delay),
            );
          } else if (
            story.kind === "ending" &&
            story.index === 2 &&
            story.age < 0.18
          ) {
            this.tone(660, 0.25, 0.045, 660);
            this.tone(523, 0.4, 0.035, 523, 0.24);
          } else if (
            story.kind === "ending" &&
            story.index === 7 &&
            story.age < 0.18
          ) {
            this.play("bell-start", 0, 0.9, 0, "cue");
          }
        }
      }
    }
    const distance = context.distance ?? Infinity;
    const interval =
      ["receive", "road"].includes(phase) &&
      distance > 0 &&
      distance < AUDIO.gpsNearMeters
        ? distance < AUDIO.gpsCloseMeters
          ? AUDIO.gpsCloseSeconds
          : AUDIO.gpsNearSeconds
        : 0;
    if (!interval) {
      this.approachPulse = 0;
      this.approachInterval = 0;
    } else {
      const changed = interval !== this.approachInterval;
      this.approachInterval = interval;
      this.approachPulse = changed ? 0 : this.approachPulse + dt;
      if (changed || this.approachPulse + 1e-8 >= interval) {
        this.approachPulse = 0;
        // Quiet GPS identity; phase changes and pause cancel pending note tails.
        // Muted intervals are consumed, never queued for playback on unmute.
        if (!this.muted) {
          this.tone(660, 0.075, AUDIO.gpsGain, 660);
          this.tone(880, 0.13, AUDIO.gpsGain * 0.85, 880, 0.105);
          this.attention(0.28);
        }
      }
    }
    const school = phase === "school";
    if (this.room !== room) {
      this.stopGroup("ambient");
      this.room = room;
      this.pulse = 0;
    }
    const outdoor = context.outdoor ?? room === 0;
    this.loops.room?.gain.gain.setTargetAtTime(
      school
        ? care
          ? 0.009
          : (outdoor ? 0.016 : AUDIO.ambient) * (dialogue ? 0.55 : 1)
        : 0,
      c.currentTime,
      0.16,
    );
    this.loops.hum?.gain.gain.setTargetAtTime(
      school && !outdoor && !care ? 0.018 : 0,
      c.currentTime,
      0.16,
    );
    this.loops.room?.filter.frequency.setTargetAtTime(
      care ? 220 : 550,
      c.currentTime,
      0.3,
    );
    this.loops.room?.source.playbackRate.setTargetAtTime(
      care ? 0.78 : 1,
      c.currentTime,
      0.3,
    );
    this.pulse += dt;
    if (
      school &&
      (!dialogue || care) &&
      this.pulse > this.ambientDelay + (room % 3) * 0.5
    ) {
      this.pulse = 0;
      this.ambientDelay = 5.5 + ((this.serial++ * 17) % 23) / 4;
      if (care)
        this.play(this.serial % 2 ? "cloth" : "paper", 0.2, 0.16, 0, "ambient");
      else if ([3, 5, 8].includes(room))
        this.play("drip", room % 2 ? 0.45 : -0.5, 1, 0, "ambient");
      else if (!outdoor) this.play("relay", -0.45, 0.45, 0, "ambient");
    }
    const seconds = Math.ceil(remaining);
    if (
      ["road", "school"].includes(phase) &&
      !care &&
      !dialogue &&
      remaining > 0 &&
      remaining < 30 &&
      seconds !== this.seconds
    ) {
      this.tone(1050, 0.035, 0.018, 850);
      this.attention(0.12);
    }
    this.seconds = seconds;
  }
  motor(speed: number, on: boolean, throttle = false) {
    if (!this.context || !this.loops.engine) return;
    const c = this.context,
      model = engineState(speed, throttle);
    if (on && this.gear >= 0 && model.gear !== this.gear)
      this.shiftUntil = c.currentTime + AUDIO.shiftSeconds;
    this.gear = on ? model.gear : -1;
    const duck = Math.min(
      this.radioPlaying ? 0.5 : 1,
      c.currentTime < this.duckUntil ? 0.4 : 1,
    );
    const shifted = c.currentTime < this.shiftUntil ? 0.55 : 1,
      engine = this.loops.engine;
    engine.source.playbackRate.setTargetAtTime(
      model.rate,
      c.currentTime,
      0.075,
    );
    engine.gain.gain.setTargetAtTime(
      on && !this.muted ? model.engine * duck * shifted : 0,
      c.currentTime,
      0.05,
    );
    engine.filter.frequency.setTargetAtTime(
      throttle ? 1500 : 900,
      c.currentTime,
      0.09,
    );
    for (const [kind, volume] of [
      ["wind", model.wind],
      ["rolling", model.rolling],
    ] as [Material, number][])
      this.loops[kind]?.gain.gain.setTargetAtTime(
        on && !this.muted ? volume * duck : 0,
        c.currentTime,
        0.12,
      );
    this.loops.wind?.filter.frequency.setTargetAtTime(
      450 + Math.max(0, speed) * 5,
      c.currentTime,
      0.12,
    );
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
      this.radioFailed = false;
      if (playing) speechSynthesis.cancel();
      return;
    }
    if (this.muted || this.voiceVolume === 0) {
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
      .find((v) => v.lang.startsWith("fr") && v.localService !== false);
    if (!voice) return;
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = "fr-FR";
    u.rate = 1.08;
    u.pitch = 0.85;
    u.volume = 0.45 * this.voiceVolume;
    this.radioPlaying = true;
    this.radioDone = false;
    this.radioFailed = false;
    this.radioText = text;
    this.radioUtterance = u;
    const finish = () => {
      if (this.radioUtterance !== u) return;
      this.radioPlaying = false;
      this.radioDone = true;
      this.radioUtterance = undefined;
    };
    u.onend = finish;
    u.onerror = () => {
      if (this.radioUtterance !== u) return;
      this.radioFailed = true;
      finish();
    };
    speechSynthesis.speak(u);
  }
}
