import { smallPrint, smallWidth } from "./small-lettering";
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
  destinationHUD?: [string, string];
  classroom?: string;
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
  roomTransition?: unknown;
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
        (s.phase === "school" &&
          (s.schoolFade > 0 ||
            s.bossIntro > 0 ||
            s.encounterTime > 0 ||
            !!s.roomTransition))));
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
// Taller, narrower instrument digits: 18px high instead of the old 21px clock.
export const CADRE_DIGITS: Record<string, string[]> = Object.fromEntries(
  Object.entries({
    "0": "01110/10001/10001/10001/10001/10001/10001/10001/01110",
    "1": "00100/01100/00100/00100/00100/00100/00100/00100/01110",
    "2": "01110/10001/00001/00001/00110/01000/10000/10000/11111",
    "3": "11110/00001/00001/00001/01110/00001/00001/00001/11110",
    "4": "00010/00110/01010/10010/11111/00010/00010/00010/00010",
    "5": "11111/10000/10000/10000/11110/00001/00001/00001/11110",
    "6": "01110/10000/10000/10000/11110/10001/10001/10001/01110",
    "7": "11111/00001/00001/00010/00100/00100/01000/01000/01000",
    "8": "01110/10001/10001/10001/01110/10001/10001/10001/01110",
    "9": "01110/10001/10001/10001/01111/00001/00001/00001/01110",
    ":": "0/0/1/1/0/1/1/0/0",
    "-": "00000/00000/00000/00000/11111/00000/00000/00000/00000",
  }).map(([key, rows]) => [key, rows.split("/")]),
);
export function clockWidth(value: string) {
  return [...value].reduce(
    (width, c) => width + (CADRE_DIGITS[c][0].length + 1) * 2,
    -2,
  );
}
export function drawCadre(g: Graphics, s: CadreState, routeMeters: number) {
  const m = cadreModel(s, routeMeters);
  const ink = 0x080d13,
    metal = 0x24333b,
    edge = 0x647577,
    paper = 0xe3d4b3,
    amber = 0xe5ae60,
    red = 0xd97561,
    dim = 0x82908b;
  const r = (x: number, y: number, w: number, h: number, c: number) => {
    g.fillStyle(c);
    g.fillRect(x, y, w, h);
  };
  const compact = (
    x: number,
    y: number,
    text: string,
    c = paper,
    width = 300,
  ) => {
    let fitted = text;
    if (smallWidth(fitted) > width) {
      while (fitted.length && smallWidth(fitted + "...") > width)
        fitted = fitted.slice(0, -1);
      fitted += "...";
    }
    smallPrint(g, x, y, fitted, c);
  };
  const centerSmall = (
    x: number,
    w: number,
    y: number,
    text: string,
    c = paper,
  ) => compact(x + Math.floor((w - smallWidth(text)) / 2), y, text, c, w);
  const t = (
    x: number,
    y: number,
    text: string,
    c = paper,
    scale = 1,
    width = 300,
  ) => bitmap(g, x, y, text, c, scale, width);

  // Folded steel surround. Grain and wear are confined to the metal gutters.
  r(0, 179, 320, 61, ink);
  r(1, 180, 318, 59, metal);
  r(2, 180, 316, 1, 0x758080);
  r(3, 181, 314, 1, 0x526064);
  r(2, 182, 316, 1, 0x38494c);
  r(1, 182, 1, 57, 0x526064);
  r(318, 181, 1, 58, 0x141e27);
  for (const x of [5, 112, 208, 314]) {
    r(x, 184, 1, 47, 0x38494c);
    r(x + 1, 184, 1, 47, 0x141e27);
    for (let y = 195; y < 226; y += 9) r(x, y, 1, 2, 0x526064);
  }
  for (const [x, w] of [
    [8, 101],
    [118, 86],
    [213, 99],
  ]) {
    r(x - 1, 184, w + 2, 48, ink);
    r(x, 185, w, 1, edge);
    r(x, 186, w, 7, 0x38494c);
    r(x + 1, 187, w - 2, 5, 0x24333b);
    r(x, 193, w, 1, 0x526064);
    r(x, 194, w, 36, 0x0d171c);
    r(x + 1, 195, w - 2, 1, 0x080d13);
    r(x, 230, w, 1, 0x526064);
    r(x + 1, 231, w - 2, 1, 0x141e27);
  }
  // Recessed screws, slots, oxidised drips and a few exposed paint layers.
  for (const x of [3, 111, 207, 315])
    for (const y of [184, 228]) {
      r(x - 1, y - 1, 4, 4, ink);
      r(x, y, 2, 2, 0x758080);
      r(x, y + 1, 2, 1, 0x38494c);
      r(x + 1, y, 1, 1, 0x141e27);
      if (y === 184) r(x, y + 4, 1, 3, 0x665e4a);
    }
  for (const [x, y, w] of [
    [24, 181, 9],
    [76, 231, 5],
    [180, 181, 7],
    [282, 231, 10],
  ]) {
    r(x, y, w, 1, edge);
    r(x + 2, y, 3, 1, 0x928269);
    r(x + 3, y + 1, 1, 1, 0x665e4a);
  }
  compact(12, 187, m.assigned ? "AFFECTATION" : "RECEPTION", paper, 88);
  centerSmall(120, 82, 187, "DELAIS");
  compact(217, 187, m.driving ? "AUTO" : "PERSONNEL", paper, 62);
  const clockColor = m.urgent ? red : m.assigned ? amber : dim;
  // Small signal lamps carry state; no ornamental flashing in ordinary play.
  r(102, 187, 3, 3, ink);
  r(103, 188, 1, 1, m.assigned ? amber : dim);
  r(196, 187, 3, 3, ink);
  r(197, 188, 1, 1, m.suspended ? dim : clockColor);

  if (m.assigned) {
    // Destination card: wired glazing, worn latch and a dented lower plate.
    r(12, 198, 22, 30, 0x526064);
    r(13, 199, 20, 28, ink);
    r(15, 200, 16, 26, 0x928269);
    r(16, 201, 14, 24, 0x665e4a);
    r(18, 202, 10, 12, ink);
    r(19, 203, 8, 10, 0x38494c);
    for (let y = 204; y < 213; y += 3) r(19, y, 8, 1, 0x647577);
    r(21, 203, 1, 10, 0x647577);
    r(25, 203, 1, 10, 0x647577);
    r(28, 217, 2, 1, paper);
    r(28, 218, 1, 2, edge);
    r(16, 224, 14, 2, edge);
    r(17, 221, 2, 1, 0xb9aa89);
    if (m.reveal < 1) {
      const h = Math.round(30 * (1 - m.reveal));
      r(12, 198, 22, h, 0x0d171c);
      r(12, 198 + h, 22, 1, amber);
    }
    compact(
      40,
      199,
      (s.destinationHUD ?? ["COLLEGE", "C. HANOUNA"])[0],
      dim,
      65,
    );
    compact(
      40,
      207,
      (s.destinationHUD ?? ["COLLEGE", "C. HANOUNA"])[1],
      paper,
      65,
    );
    compact(40, 220, "SALLE", dim, 27);
    t(70, 214, s.classroom ?? "42C", paper, 2, 37);
  } else if (s.phase === "free") {
    compact(14, 199, "RADIO", dim, 90);
    t(14, 209, "EDUC FRANCE", paper, 1, 91);
    r(14, 221, 83, 1, 0x38494c);
    for (let i = 0; i < 16; i++) {
      const h =
        1 + Math.floor((Math.sin(s.ambienceClock * 3 + i * 0.8) + 1) * 1.5);
      r(15 + i * 5, 228 - h, 2, h, 0x82908b);
    }
  } else {
    compact(14, 200, "RESEAU", dim, 90);
    t(14, 210, "RECTORAL", paper, 1, 90);
    compact(14, 223, "EN ATTENTE", dim, 90);
  }

  // Instrument numerals have their own narrower stencil; labels use the same
  // five-pixel lettering as the physical signs elsewhere in the school.
  const clockX = 118 + Math.floor((86 - clockWidth(m.time)) / 2);
  let cursor = clockX;
  g.fillStyle(clockColor);
  for (const c of m.time) {
    const glyph = CADRE_DIGITS[c];
    glyph.forEach((row, y) =>
      [...row].forEach((pixel, x) => {
        if (pixel === "1") g.fillRect(cursor + x * 2, 200 + y * 2, 2, 2);
      }),
    );
    cursor += (glyph[0].length + 1) * 2;
  }
  r(125, 221, 72, 1, 0x24333b);
  centerSmall(
    120,
    82,
    224,
    m.status,
    s.phase === "fail" || m.urgent ? red : dim,
  );
  if (m.urgent && Math.floor(s.ambienceClock * 3) % 2 === 0) {
    r(117, 196, 88, 1, red);
    r(117, 231, 88, 1, red);
  }
  if (m.driving) {
    const healthColor = s.vehicle <= 40 ? red : dim;
    const health = Math.max(0, Math.min(100, s.vehicle));
    compact(281, 187, Math.round(health) + "%", healthColor, 28);
    for (let i = 0; i < 10; i++) {
      r(218 + i * 9, 227, 7, 2, 0x24333b);
      if (health > i * 10) r(218 + i * 9, 227, 7, 2, healthColor);
    }
    if (m.assigned) {
      t(218, 198, Math.round(s.speed) + " KM/H", paper, 1, 88);
      compact(218, 206, "RESTE", dim, 30);
      const digits = m.distance.replace(" KM", "");
      const distanceColor = m.veryNear ? red : m.near ? amber : paper;
      t(218, 212, digits, distanceColor, 2, 75);
      compact(222 + bitmapWidth(digits, 2), 221, "KM", distanceColor, 20);
      if (m.near) {
        r(213, 195, 2, 31, m.veryNear ? red : amber);
        r(310, 195, 2, 31, m.veryNear ? red : amber);
      }
    } else {
      compact(218, 199, "VITESSE", dim, 89);
      const digits = String(Math.round(s.speed));
      t(218, 210, digits, paper, 2, 75);
      compact(222 + bitmapWidth(digits, 2), 219, "KM/H", paper, 27);
    }
  } else {
    compact(218, 199, "ETAT DU PROF", dim, 89);
    for (let i = 0; i < 5; i++) {
      r(218 + i * 18, 210, 14, 8, 0x38494c);
      r(219 + i * 18, 211, 12, 6, 0x141e27);
      if (i < s.hp) {
        r(220 + i * 18, 211, 10, 5, s.hp <= 2 ? red : 0xb9aa89);
        r(220 + i * 18, 211, 10, 1, s.hp <= 2 ? amber : paper);
      }
    }
    t(218, 222, Math.max(0, s.hp) + "/5", s.hp <= 2 ? red : paper, 1, 24);
    compact(251, 224, "SERVICE " + Math.min(3, s.mission + 1) + "/3", dim, 58);
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
            : s.phase === "school" && s.encounterTime > 0
              ? "ECHANGE EN COURS / DELAI SUSPENDU"
              : s.messageTime > 0
                ? s.boardMessage
                : s.phase === "free"
                  ? service + " / FM"
                  : m.assigned
                    ? "RESEAU RECTORAL - " + service
                    : "CADRE / " + service;
  r(7, 233, 306, 7, ink);
  r(7, 233, 306, 1, 0x38494c);
  compact(
    11,
    235,
    line,
    s.phase === "fail" || m.veryNear
      ? red
      : m.near || s.phase === "receive"
        ? amber
        : dim,
    298,
  );
  if (s.phase === "receive") {
    r(8, 193, Math.round(101 * m.reveal), 1, amber);
    if (Math.floor(s.age * 6) % 2 === 0) {
      r(7, 184, 103, 1, amber);
      r(7, 231, 103, 1, amber);
    }
  }
}
