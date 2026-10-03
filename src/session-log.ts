export type LogEvent = {
  at: number;
  kind: string;
  mission: number;
  room: number;
  data?: unknown;
};
export class SessionLog {
  elapsed = 0;
  phaseSeconds: Record<string, number> = {};
  events: LogEvent[] = [];
  falls = 0;
  missionTiming: Record<
    string,
    { seconds: Record<string, number>; clock: Record<string, number> }
  > = {};
  measure(mission: number, category: string, dt: number, charged = false) {
    const timing = (this.missionTiming[mission + 1] ??= {
      seconds: {},
      clock: {},
    });
    const bucket = charged ? timing.clock : timing.seconds;
    bucket[category] = (bucket[category] ?? 0) + dt;
  }
  record(kind: string, mission: number, room: number, data?: unknown) {
    this.events.push({
      at: +this.elapsed.toFixed(3),
      kind,
      mission: mission + 1,
      room,
      data,
    });
    if (this.events.length > 2000) this.events.shift();
  }
  tick(phase: string, dt: number) {
    this.elapsed += dt;
    this.phaseSeconds[phase] = (this.phaseSeconds[phase] ?? 0) + dt;
  }
  snapshot(
    seed: number,
    collisions: number,
    punches: number,
    results: string[],
    runtime?: unknown,
  ) {
    return {
      version: "0.59",
      seed,
      simulationSeconds: +this.elapsed.toFixed(3),
      phaseSeconds: { ...this.phaseSeconds },
      missionTiming: Object.fromEntries(
        Object.entries(this.missionTiming).map(([mission, timing]) => [
          mission,
          {
            seconds: rounded(timing.seconds),
            clock: rounded(timing.clock),
          },
        ]),
      ),
      runtime,
      collisions,
      punches,
      falls: this.falls,
      results: [...results],
      events: [...this.events],
    };
  }
}

function rounded(values: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, +v.toFixed(3)]),
  );
}

// Wall frame intervals, never simulation substeps. A bounded histogram avoids
// growing the journal during a long session. Menus, pauses and workshop steps
// are excluded by the caller; interruptions are counted separately.
export class RuntimeLog {
  startup: Record<string, number> = {};
  frames = new Map<number, number>();
  samples = 0;
  interruptions = 0;
  maxMs = 0;
  releasedSources = { count: 0, rgbaBytes: 0 };
  mark(name: string) {
    if (typeof performance !== "undefined")
      this.startup[name] = +performance.now().toFixed(2);
  }
  resetFrames() {
    this.frames.clear();
    this.samples = 0;
    this.interruptions = 0;
    this.maxMs = 0;
  }
  frame(ms: number) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    if (ms > 1000) {
      this.interruptions++;
      return;
    }
    const bucket = Math.ceil(ms);
    this.frames.set(bucket, (this.frames.get(bucket) ?? 0) + 1);
    this.samples++;
    this.maxMs = Math.max(this.maxMs, ms);
  }
  snapshot() {
    const ordered = [...this.frames].sort((a, b) => a[0] - b[0]);
    const percentile = (q: number) => {
      let count = 0;
      for (const [ms, n] of ordered) {
        count += n;
        if (count >= this.samples * q) return ms;
      }
      return null;
    };
    const heap =
      typeof performance === "undefined"
        ? undefined
        : (
            performance as Performance & {
              memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
            }
          ).memory;
    return {
      startupMillisecondsSinceNavigation: { ...this.startup },
      texturePreparationMs:
        this.startup.ready === undefined || this.startup.create === undefined
          ? null
          : +(this.startup.ready - this.startup.create).toFixed(2),
      releasedSourceTextures: { ...this.releasedSources },
      frameIntervalsMs: {
        samples: this.samples,
        p50: percentile(0.5),
        p95: percentile(0.95),
        p99: percentile(0.99),
        max: +this.maxMs.toFixed(2),
        interruptionsOver1s: this.interruptions,
      },
      // Chromium's JS heap is optional and excludes GPU texture memory.
      jsHeapBytes: heap
        ? { used: heap.usedJSHeapSize, allocated: heap.totalJSHeapSize }
        : null,
    };
  }
}
