const assert = require("node:assert/strict");
const { createGame } = require("./test-harness.cjs");
const { audit: a } = createGame();
const cues = [
  [300, 0.62, 0, 70],
  [550, -0.62, 1, 62],
  [750, 0, 2, 84],
  [260, 0.62, 0, 84],
  [900, -0.62, 2, 74],
  [560, 0.62, 1, 64],
  [620, 0, 0, 78],
  [900, -0.62, 0, 72],
];
for (let mission = 0; mission < 3; mission++)
  for (let i = 0; i < 64; i++)
    for (const random of [0, 0.5, 0.99]) {
      const cue = a.trafficCue(i, mission, random),
        old =
          (a.DRIVE.motionScale *
            (cues[i % 8][0] * 0.36 + (i ? random * 35 : 0))) /
          (2 ** mission * [1.12, 1.12, 1][mission]);
      assert(
        Math.abs(cue.gap * 1.125 - old) < 1e-8,
        "exactly 12.5% more vehicles on every mission",
      );
    }
console.log("PASS uniform +12.5% traffic density on all three assignments");
