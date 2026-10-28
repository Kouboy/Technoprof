// One run, three assignments, three lives shared by road and school.
export const LIVES = {
  initial: 3,
  schoolRetrySeconds: 120,
  lossChangeAt: 0.8,
  lossSeconds: 2.6,
  lossSkipAfter: 1.2,
  radiationSeconds: 6,
  radiationSkipAfter: 2,
  stampAt: 0.65,
  fadeSeconds: 1,
};
export function remainingLives(value: number) {
  return Math.max(0, Math.min(LIVES.initial, Math.floor(value)));
}
export function loseLife(value: number) {
  return remainingLives(value - 1);
}
