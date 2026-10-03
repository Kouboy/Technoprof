// Integer-grid lettering and metalwork stay sharp at the game's logical resolution.
// This module only reads game state; rendering cannot start or reset a mission.
export const GLYPHS: Record<string, string[]> = Object.fromEntries(
  Object.entries({
    A: "01110/10001/10001/11111/10001/10001/10001",
    B: "11110/10001/10001/11110/10001/10001/11110",
    C: "01111/10000/10000/10000/10000/10000/01111",
    D: "11110/10001/10001/10001/10001/10001/11110",
    E: "11111/10000/10000/11110/10000/10000/11111",
    F: "11111/10000/10000/11110/10000/10000/10000",
    G: "01111/10000/10000/10111/10001/10001/01111",
    H: "10001/10001/10001/11111/10001/10001/10001",
    I: "111/010/010/010/010/010/111",
    J: "00111/00010/00010/00010/10010/10010/01100",
    K: "10001/10010/10100/11000/10100/10010/10001",
    L: "10000/10000/10000/10000/10000/10000/11111",
    M: "10001/11011/10101/10101/10001/10001/10001",
    N: "10001/11001/11001/10101/10011/10011/10001",
    O: "01110/10001/10001/10001/10001/10001/01110",
    P: "11110/10001/10001/11110/10000/10000/10000",
    Q: "01110/10001/10001/10001/10101/10010/01101",
    R: "11110/10001/10001/11110/10100/10010/10001",
    S: "01111/10000/10000/01110/00001/00001/11110",
    T: "11111/00100/00100/00100/00100/00100/00100",
    U: "10001/10001/10001/10001/10001/10001/01110",
    V: "10001/10001/10001/10001/10001/01010/00100",
    W: "10001/10001/10001/10101/10101/10101/01010",
    X: "10001/10001/01010/00100/01010/10001/10001",
    Y: "10001/10001/01010/00100/00100/00100/00100",
    Z: "11111/00001/00010/00100/01000/10000/11111",
    "0": "01110/10001/10011/10101/11001/10001/01110",
    "1": "00100/01100/00100/00100/00100/00100/01110",
    "2": "01110/10001/00001/00010/00100/01000/11111",
    "3": "11110/00001/00001/01110/00001/00001/11110",
    "4": "00010/00110/01010/10010/11111/00010/00010",
    "5": "11111/10000/10000/11110/00001/00001/11110",
    "6": "01110/10000/10000/11110/10001/10001/01110",
    "7": "11111/00001/00010/00100/01000/01000/01000",
    "8": "01110/10001/10001/01110/10001/10001/01110",
    "9": "01110/10001/10001/01111/00001/00001/01110",
    ":": "0/1/1/0/1/1/0",
    ".": "0/0/0/0/0/1/1",
    ",": "00/00/00/00/00/01/10",
    "-": "000/000/000/111/000/000/000",
    "/": "00001/00010/00010/00100/01000/01000/10000",
    "%": "11001/11010/00010/00100/01000/01011/10011",
    "'": "1/1/0/0/0/0/0",
    "!": "1/1/1/1/1/0/1",
    ">": "100/010/001/000/001/010/100",
    "<": "001/010/100/000/100/010/001",
    " ": "000/000/000/000/000/000/000",
    "?": "01110/10001/00001/00010/00100/00000/00100",
  }).map(([k, v]) => [k, v.split("/")]),
);
export const cleanText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replaceAll("—", "-")
    .replaceAll("’", "'");
export function bitmapWidth(value: string, scale = 1) {
  return Math.max(
    0,
    [...cleanText(value)].reduce(
      (w, c) => w + ((GLYPHS[c] ?? GLYPHS["?"])[0].length + 1) * scale,
      0,
    ) - scale,
  );
}
type Graphics = {
  fillStyle: (color: number, alpha?: number) => unknown;
  fillRect: (x: number, y: number, w: number, h: number) => unknown;
};
export function bitmap(
  g: Graphics,
  x: number,
  y: number,
  value: string,
  color: number,
  scale = 1,
  maxWidth = 320,
) {
  let cursor = Math.round(x);
  const end = cursor + maxWidth;
  g.fillStyle(color);
  for (const c of cleanText(value)) {
    const glyph = GLYPHS[c] ?? GLYPHS["?"],
      w = glyph[0].length * scale;
    if (cursor + w > end) break;
    glyph.forEach((row, dy) =>
      [...row].forEach((pixel, dx) => {
        if (pixel === "1")
          g.fillRect(
            cursor + dx * scale,
            Math.round(y) + dy * scale,
            scale,
            scale,
          );
      }),
    );
    cursor += w + scale;
  }
}
export type CadreState = {
  paused: boolean;
  phase: string;
  notified: boolean;
  remaining: number;
  vehicle: number;
  speed: number;
  road: number;
  mission: number;
  hp: number;
  age: number;
  ambienceClock: number;
  boardMessage: string;
  messageTime: number;
  brokenRoad: boolean;
  schoolFade: number;
  bossIntro: number;
  encounterTime: number;
  failureReason?: "late" | "exhausted" | "breakdown" | null;
};
export function cadreModel(s: CadreState, routeMeters: number) {
  const driving =
    ["free", "receive", "road", "arrival", "arrivalFade", "tow"].includes(
      s.phase,
    ) ||
    (s.phase === "fail" && s.brokenRoad);
  const assigned = s.notified && !["title", "report", "tow"].includes(s.phase);
  const meters = Math.max(0, routeMeters - s.road);
  const near =
    assigned && ["receive", "road"].includes(s.phase) && meters < 1000;
  const seconds = Math.max(0, Math.ceil(s.remaining));
  const terminal = s.phase === "fail" || s.phase === "report";
  const suspended =
    terminal ||
    (assigned &&
      (s.paused ||
        [
          "arrival",
          "arrivalFade",
          "opening",
          "blackBefore",
          "course",
          "blackAfter",
          "later",
        ].includes(s.phase) ||
        (s.phase === "school" && (s.schoolFade > 0 || s.bossIntro > 0))));
  const urgent = assigned && !suspended && s.remaining <= 30;
  const status =
    s.phase === "fail"
      ? "ECHEC"
      : s.phase === "report"
        ? "TERMINE"
        : suspended
          ? "SUSPENDU"
          : urgent
            ? "RETARD IMMINENT"
            : assigned
              ? "EN COURS"
              : "EN ATTENTE";
  const failureLabels: Record<string, string> = {
    late: "ECHEC - DELAI DEPASSE",
    exhausted: "ECHEC - PROF EPUISE",
    breakdown: "ECHEC - VOITURE HORS SERVICE",
  };
  const failureCause =
    s.phase !== "fail"
      ? ""
      : failureLabels[s.failureReason ?? ""] ||
        "ECHEC - AFFECTATION INTERROMPUE";
  return {
    driving,
    assigned,
    near,
    veryNear: near && meters < 500,
    suspended,
    terminal,
    status,
    failureCause,
    time: assigned
      ? String(Math.floor(seconds / 60)).padStart(2, "0") +
        ":" +
        String(seconds % 60).padStart(2, "0")
      : "--:--",
    distance: assigned
      ? (meters / 1000).toFixed(2).replace(".", ",") + " KM"
      : "",
    urgent,
    reveal: s.phase === "receive" ? Math.max(0, Math.min(1, s.age / 3)) : 1,
  };
}
export function drawCadre(g: Graphics, s: CadreState, routeMeters: number) {
  const m = cadreModel(s, routeMeters);
  const ink = 0x080d13,
    metal = 0x24333b,
    edge = 0x758080,
    paper = 0xe3d4b3,
    amber = 0xe5ae60,
    red = 0xd97561,
    dim = 0x647577;
  const r = (x: number, y: number, w: number, h: number, c: number) => {
    g.fillStyle(c);
    g.fillRect(x, y, w, h);
  };
  const t = (
    x: number,
    y: number,
    v: string,
    c = paper,
    scale = 1,
    width = 300,
  ) => bitmap(g, x, y, v, c, scale, width);
  const centered = (
    left: number,
    width: number,
    y: number,
    v: string,
    c = paper,
    scale = 1,
  ) =>
    t(
      left + Math.floor((width - bitmapWidth(v, scale)) / 2),
      y,
      v,
      c,
      scale,
      width,
    );
  r(0, 179, 320, 61, ink);
  r(1, 180, 318, 59, metal);
  r(2, 180, 316, 1, edge);
  r(3, 181, 314, 1, 0x38494c);
  for (const [x, w] of [
    [7, 103],
    [116, 90],
    [212, 101],
  ]) {
    r(x - 2, 184, w + 4, 48, ink);
    r(x - 1, 184, w + 2, 1, dim);
    r(x, 185, w, 45, 0x0d171c);
    r(x, 194, w, 1, 0x38494c);
    r(x, 230, w, 1, edge);
  }
  for (const x of [3, 111, 207, 315])
    for (const y of [184, 228]) {
      r(x, y, 3, 3, ink);
      r(x, y, 2, 2, edge);
      r(x, y + 1, 2, 1, 0x38494c);
    }
  // Chipped paint stays at the frame edges, away from the instruments.
  for (const [x, y, w] of [
    [23, 181, 8],
    [77, 231, 5],
    [181, 181, 6],
    [288, 231, 9],
  ]) {
    r(x, y, w, 1, dim);
    r(x + 2, y, 2, 1, 0x928269);
  }
  t(12, 185, m.assigned ? "AFFECTATION" : "RECEPTION", paper, 1, 95);
  centered(118, 86, 185, "DELAIS", paper);
  t(217, 185, m.driving ? "AUTO" : "PERSONNEL", paper, 1, 91);
  if (m.assigned) {
    // Wired-glass door, enamel number plate, handle and battered threshold.
    r(12, 198, 22, 31, dim);
    r(14, 200, 18, 29, 0x928269);
    r(16, 201, 14, 27, 0x665e4a);
    r(18, 203, 10, 12, ink);
    r(19, 204, 8, 10, 0x38494c);
    for (let y = 205; y < 214; y += 3) r(19, y, 8, 1, dim);
    r(21, 204, 1, 10, dim);
    r(25, 204, 1, 10, dim);
    r(28, 218, 2, 1, paper);
    r(28, 219, 1, 2, edge);
    r(16, 226, 14, 2, edge);
    r(17, 222, 2, 1, 0xb9aa89);
    if (m.reveal < 1) {
      const h = Math.round(31 * (1 - m.reveal));
      r(12, 198, 22, h, 0x0d171c);
      r(12, 198 + h, 22, 1, amber);
    }
    t(40, 197, "ST-HANOUNA", paper, 1, 67);
    t(40, 207, "SALLE", dim, 1, 67);
    t(40, 216, "42C", paper, 2, 67);
  } else if (s.phase === "free") {
    t(14, 199, "RADIO :", dim);
    t(14, 211, "EDUC FRANCE", paper, 1, 91);
    for (let i = 0; i < 18; i++) {
      const h =
        1 + Math.floor((Math.sin(s.ambienceClock * 3 + i * 0.8) + 1) * 2);
      r(15 + i * 5, 228 - h, 2, h, dim);
    }
  } else {
    t(14, 200, "RESEAU", dim);
    t(14, 211, "RECTORAL", paper);
    t(14, 223, "EN ATTENTE", dim);
  }
  const clockColor = m.urgent ? red : m.assigned ? amber : dim;
  centered(118, 86, 199, m.time, clockColor, 3);
  centered(118, 86, 224, m.status, s.phase === "fail" || m.urgent ? red : dim);
  if (m.urgent && Math.floor(s.ambienceClock * 3) % 2 === 0) {
    r(117, 196, 88, 1, red);
    r(117, 231, 88, 1, red);
  }
  if (m.driving) {
    t(
      268,
      185,
      Math.round(s.vehicle) + "%",
      s.vehicle <= 40 ? red : paper,
      1,
      42,
    );
    r(217, 227, 90, 2, 0x38494c);
    r(
      217,
      227,
      Math.round((90 * Math.max(0, Math.min(100, s.vehicle))) / 100),
      2,
      s.vehicle <= 40 ? red : dim,
    );
    if (m.assigned) {
      t(218, 197, Math.round(s.speed) + " KM/H", paper, 1, 88);
      t(218, 209, m.distance, m.veryNear ? red : m.near ? amber : paper, 2, 90);
      if (m.near) {
        r(213, 195, 2, 31, m.veryNear ? red : amber);
        r(310, 195, 2, 31, m.veryNear ? red : amber);
      }
    } else {
      t(218, 199, "VITESSE", dim);
      t(218, 212, Math.round(s.speed) + " KM/H", paper, 2, 90);
    }
  } else {
    t(218, 199, "ETAT DU PROF", dim, 1, 89);
    for (let i = 0; i < 5; i++) {
      r(218 + i * 18, 212, 14, 9, 0x38494c);
      if (i < s.hp) {
        r(219 + i * 18, 213, 12, 7, s.hp <= 2 ? red : paper);
        r(219 + i * 18, 213, 12, 1, s.hp <= 2 ? amber : 0xb9aa89);
      }
    }
    t(
      218,
      224,
      Math.max(0, s.hp) + "/5  SERVICE " + Math.min(3, s.mission + 1) + "/3",
      dim,
      1,
      90,
    );
  }
  const service =
    ["08:00", "12:00", "17:00"][Math.min(s.mission, 2)] +
    " / SERVICE " +
    Math.min(s.mission + 1, 3) +
    "/3";
  const line =
    s.phase === "fail"
      ? m.failureCause
      : s.phase === "report"
        ? "RESEAU RECTORAL - JOURNEE TERMINEE"
        : s.phase === "receive"
          ? "RESEAU RECTORAL - AFFECTATION RECUE"
          : m.near
            ? "ARRIVEE IMMINENTE - " + m.distance
            : s.messageTime > 0
              ? s.boardMessage
              : s.phase === "free"
                ? service + " / FM"
                : m.assigned
                  ? "RESEAU RECTORAL - " + service
                  : "CADRE / " + service;
  r(7, 233, 306, 7, ink);
  t(
    11,
    233,
    line,
    s.phase === "fail" || m.veryNear
      ? red
      : m.near || s.phase === "receive"
        ? amber
        : dim,
    1,
    298,
  );
  if (s.phase === "receive") {
    r(7, 193, Math.round(103 * m.reveal), 1, amber);
    if (Math.floor(s.age * 6) % 2 === 0) {
      r(5, 183, 107, 1, amber);
      r(5, 231, 107, 1, amber);
    }
  }
}
