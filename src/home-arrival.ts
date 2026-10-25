// One timeline for the automatic homecoming, its Foley and its black transition.
export const HOME_ARRIVAL = {
  parkingSeconds: 1.8,
  exitAt: 2.25,
  doorSlamAt: 2.65,
  walkAt: 2.95,
  walkSeconds: 6.5,
  doorstepSeconds: 0.5,
  fadeSeconds: 2,
  blackSeconds: 0.25,
  carFrom: 40,
  carTo: 111,
  teacherFrom: 130,
  teacherTo: 246,
  feetFrom: 146,
  feetTo: 134,
  stepSeconds: 0.54,
};
export function homeArrivalFrame(age: number) {
  const t = Number.isFinite(age) ? Math.max(0, age) : 0;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const h = HOME_ARRIVAL;
  const park = clamp(t / h.parkingSeconds);
  const walk = clamp((t - h.walkAt) / h.walkSeconds);
  const fadeAt = h.walkAt + h.walkSeconds + h.doorstepSeconds;
  return {
    park,
    walk,
    carX: h.carFrom + (h.carTo - h.carFrom) * (1 - (1 - park) ** 3),
    teacherVisible: t >= h.exitAt,
    teacherX: h.teacherFrom + (h.teacherTo - h.teacherFrom) * walk,
    teacherY: h.feetFrom + (h.feetTo - h.feetFrom) * walk,
    teacherScale: 0.105 * (1 - 0.06 * walk),
    teacherAlpha: clamp((t - h.exitAt) / 0.3),
    teacherFrame: walk > 0 && walk < 1 ? [1, 2, 3, 2][Math.floor((t - h.walkAt) * 4) % 4] : 0,
    radioGain: clamp((h.exitAt - t) / (h.exitAt - h.parkingSeconds)),
    fade: clamp((t - fadeAt) / h.fadeSeconds),
    done: t >= fadeAt + h.fadeSeconds + h.blackSeconds,
  };
}
