const assert = require("node:assert/strict");
module.exports = function assertWallSigns(scope, signs, room, exits = []) {
  const boxes = signs.map(([x, y, lines]) =>
    scope.schoolSignBounds(x, y, lines),
  );
  boxes.forEach((a, i) => {
    assert(
      a.x >= 9 && a.y >= 9 && a.x + a.width <= 311 && a.y + a.height <= 140,
      `room ${room}: sign inside wall`,
    );
    boxes.slice(i + 1).forEach((b) => {
      const overlap =
        a.x - 1 < b.x + b.width + 2 &&
        a.x + a.width + 2 > b.x - 1 &&
        a.y - 1 < b.y + b.height + 3 &&
        a.y + a.height + 3 > b.y - 1;
      assert(!overlap, `room ${room}: signs overlap (${signs[i][2]})`);
    });
    for (const exit of exits) {
      const w = exit.edge ? 15 : exit.key === "UP" ? 35 : 31;
      const x = Math.max(
        9,
        Math.min(311 - w, Math.round(exit.hint[0] - w / 2)),
      );
      const y = exit.hint[1];
      assert(
        !(
          a.x - 2 < x + w + 1 &&
          a.x + a.width + 2 > x - 1 &&
          a.y - 1 < y + 15 &&
          a.y + a.height + 3 > y - 1
        ),
        `room ${room}: sign (${signs[i][2]}) covers ${exit.key} interaction hint`,
      );
    }
  });
};
