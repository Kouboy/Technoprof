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
  ) {
    return {
      version: "0.51",
      seed,
      simulationSeconds: +this.elapsed.toFixed(3),
      phaseSeconds: { ...this.phaseSeconds },
      collisions,
      punches,
      falls: this.falls,
      results: [...results],
      events: [...this.events],
    };
  }
}
