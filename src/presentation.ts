import type Phaser from "phaser";

// Recessed metal instrument, shared by every boss presentation.
export function drawBossHealth(
  g: Phaser.GameObjects.Graphics,
  hp: number,
  maximum: number,
) {
  const box = (x: number, y: number, w: number, h: number, color: number) => {
    g.fillStyle(color);
    g.fillRect(x, y, w, h);
  };
  box(99, 14, 122, 12, 0x080d13);
  box(100, 15, 120, 10, 0x38494c);
  box(101, 15, 118, 1, 0x758080);
  box(101, 24, 118, 1, 0x17242c);
  box(105, 17, 110, 6, 0x080d13);
  const capacity = Math.max(1, Math.floor(maximum));
  const width = Math.floor((104 - (capacity - 1) * 2) / capacity);
  const start = Math.floor(160 - (capacity * width + (capacity - 1) * 2) / 2);
  for (let i = 0; i < capacity; i++) {
    const x = start + i * (width + 2);
    box(x, 18, width, 4, 0x24333b);
    box(x, 22, width, 1, 0x526064);
    if (i < Math.max(0, Math.min(capacity, hp))) {
      box(x, 18, width, 4, 0x9c4c3e);
      box(x, 18, width, 1, 0xd78a67);
      box(x, 21, width, 1, 0x61382f);
    }
  }
  for (const x of [101, 217]) {
    box(x, 18, 2, 3, 0x080d13);
    box(x, 18, 2, 1, 0x929f9a);
    box(x, 19, 1, 1, 0x38494c);
  }
  box(133, 15, 3, 1, 0x9d8b68);
  box(188, 24, 2, 1, 0x725538);
}

// Shared presentation contract. Coordinates are logical pixels (output is ×2).
export const INFIRMARY_VIEW = { teacherScale: 0.21, nurseSize: 99 };
export const VIEW = {
  x: 7,
  y: 7,
  width: 306,
  height: 168,
  floor: 163,
  // Simulation stays on y=159; drawn feet sit four pixels into the floor strip.
  actorOffsetY: 4,
  hud: 179,
};
export const DAYLIGHT = [
  {
    name: "Aube · 07:00",
    background: 0xa7bacd,
    actor: 0xd7e3ee,
    sky: 0x8297b5,
    wash: 0x25364b,
    opacity: 0.11,
  },
  {
    name: "Midi · 12:00",
    background: 0xfff1d3,
    actor: 0xfff4df,
    sky: 0xf5edd6,
    wash: 0xa68c60,
    opacity: 0.045,
  },
  {
    name: "Crépuscule · 18:30",
    background: 0x9292ac,
    actor: 0xddc9c0,
    sky: 0x715a7c,
    wash: 0x2b203d,
    opacity: 0.23,
  },
  {
    name: "Nuit · 21:30",
    background: 0x536b83,
    actor: 0x9bafc2,
    sky: 0x263b5c,
    wash: 0x080e25,
    opacity: 0.38,
  },
];
export function daylight(mission: number) {
  return DAYLIGHT[Math.max(0, Math.min(3, Math.floor(mission)))];
}

// Decorative events stay behind actors and away from passage markers / hazards.
// No random calls here: render frequency must not affect the gameplay seed.
export const SCHOOL_WEAR = { dripPeriod: 1.7, bucketY: 153, litterY: 153 };
export function drawSchoolWear(
  g: Phaser.GameObjects.Graphics,
  room: number,
  mission: number,
  clock: number,
  gaps: number[][] = [],
  quietFrame?: number,
  mirrored = false,
) {
  g.clear();
  if ([0, 10, 20].includes(room)) return;
  const safe = (preferred: number, half: number) =>
    [preferred, 52, 258].find((x) =>
      gaps.every(([l, r]) => x + half < l || x - half > r),
    ) ?? 52;
  const x =
      quietFrame === 0
        ? 56
        : quietFrame === 1
          ? 82
          : quietFrame === 3
            ? mirrored
              ? 160
              : 163
            : safe(room % 2 ? 111 : 201, 8),
    y = quietFrame === 0 ? 142 : quietFrame === 3 ? 142 : SCHOOL_WEAR.bucketY;
  const polygon = (points: number[], color: number) => {
    g.fillStyle(color);
    g.beginPath();
    g.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2)
      g.lineTo(points[i], points[i + 1]);
    g.closePath();
    g.fillPath();
  };
  // Inked galvanised pail, damp plaster and a thin descending drip.
  if (quietFrame === undefined) {
    polygon([x - 8, y - 11, x + 8, y - 11, x + 6, y, x - 6, y], 0x141e27);
    polygon([x - 6, y - 9, x + 6, y - 9, x + 4, y - 2, x - 4, y - 2], 0x677873);
    g.lineStyle(1, 0x929f9a);
    g.lineBetween(x - 7, y - 11, x - 5, y - 17);
    g.lineBetween(x - 5, y - 17, x + 5, y - 17);
    g.lineBetween(x + 5, y - 17, x + 7, y - 11);
    g.fillStyle(0xa2b1a8);
    g.fillRect(x - 7, y - 12, 14, 1);
    g.fillStyle(0x111b20);
    g.fillRect(x - 5, y - 11, 10, 2);
    g.fillStyle(0x354d56);
    g.fillRect(x - 4, y - 10, 8, 1);
  }
  if (quietFrame !== 2) {
    g.fillStyle(0x73908d, 0.35);
    g.fillRect(x - 3, 12, 6, 5);
    g.fillRect(x - 2, 17, 4, 7);
    const t =
      ((clock + room * 0.31) % SCHOOL_WEAR.dripPeriod) / SCHOOL_WEAR.dripPeriod;
    g.fillStyle(0xa4c6cc, 0.85);
    g.fillRect(x, 27 + t * (y - 38), 1, 3);
    if (t > 0.9) {
      g.fillStyle(0xa4c6cc, 0.7);
      g.fillRect(x - 4, y - 9, 2, 1);
      g.fillRect(x + 2, y - 9, 2, 1);
    }
  }
  // Full tied bin bags, separate folds and a little paper, on the back floor.
  const bx = safe(room % 3 === 0 ? 76 : 239, 31);
  for (let i = 0; quietFrame === undefined && i < 3; i++) {
    const b = bx + i * 8,
      top = 133 + (i % 2) * 4;
    polygon(
      [
        b - 2,
        top,
        b + 2,
        top,
        b + 2,
        top + 3,
        b + 6,
        top + 5,
        b + 9,
        top + 11,
        b + 8,
        153,
        b - 7,
        153,
        b - 9,
        top + 12,
        b - 7,
        top + 6,
        b - 2,
        top + 3,
      ],
      0x10171c,
    );
    polygon(
      [b - 2, top, b - 4, top - 3, b, top - 2, b + 4, top - 4, b + 3, top],
      0x10171c,
    );
    g.lineStyle(1, 0x384244);
    g.lineBetween(b, top + 4, b + 2, 150);
    g.lineBetween(b - 3, top + 9, b - 4, 151);
  }
  g.fillStyle(0xb9ad8d);
  g.fillTriangle(bx + 25, 149, bx + 30, 150, bx + 26, 153);
  for (let i = 0; i < 5; i++) {
    g.fillStyle(i % 2 ? 0x756951 : 0xaaa084);
    g.fillRect(bx - 18 + i * 5, 151 + (i % 2), 2 + (i % 3), 1);
  }
  // Two tiny flies stay near refuse. An occasional draught moves a scrap there.
  for (let i = 0; i < 2; i++) {
    const f = clock * (i + 1) * 2 + room;
    g.fillStyle(0x141e27);
    g.fillRect(bx + Math.sin(f) * 7, 130 + i * 5 + Math.cos(f) * 3, 1, 1);
  }
  if (mission !== 1) {
    const drift = (clock * 0.24 + room) % 1;
    g.fillStyle(0xbcb49e, 0.7);
    g.fillRect(bx - 13 + drift * 24, 148 - Math.sin(drift * Math.PI) * 4, 3, 1);
  }
  // Cold / twilight falls on the architecture, below all gameplay silhouettes.
  const light = daylight(mission);
  if (mission !== 1) {
    g.fillStyle(light.wash, mission === 2 ? 0.13 : 0.07);
    g.fillRect(7, 7, 306, 168);
  }
}

// A rectangular opaque surround replaces the old Canvas-only road masks.
// It is drawn above world layers, below no gameplay information, in both renderers.
export function drawSurround(g: Phaser.GameObjects.Graphics) {
  g.clear();
  g.fillStyle(0x141e27);
  g.fillRect(0, 0, 320, VIEW.y);
  g.fillRect(0, VIEW.y, VIEW.x, VIEW.hud - VIEW.y);
  g.fillRect(VIEW.x + VIEW.width, VIEW.y, 7, VIEW.hud - VIEW.y);
  g.fillRect(0, VIEW.y + VIEW.height, 320, VIEW.hud - VIEW.y - VIEW.height);
  g.fillStyle(0x080d13);
  g.fillRect(6, 6, 308, 1);
  g.fillRect(6, 7, 1, 168);
  g.fillRect(313, 7, 1, 168);
  g.fillRect(6, 175, 308, 1);
  g.fillStyle(0x526064);
  g.fillRect(7, 177, 306, 1);
  // A single static metalwork pass; every mark stays outside VIEW and the CADRE.
  const ink = (x: number, y: number, w: number, h: number, color: number) => {
    g.fillStyle(color);
    g.fillRect(x, y, w, h);
  };
  ink(1, 1, 318, 1, 0x758080);
  ink(7, 3, 306, 1, 0x38494c);
  ink(7, 5, 306, 1, 0x080d13);
  ink(1, 7, 1, 168, 0x526064);
  ink(4, 7, 1, 168, 0x24333b);
  ink(315, 7, 1, 168, 0x38494c);
  ink(318, 7, 1, 168, 0x080d13);
  for (const x of [1, 314])
    for (const y of [1, 51, 111, 170]) {
      ink(x, y, 5, 5, 0x080d13);
      ink(x, y, 4, 4, 0x38494c);
      ink(x + 1, y, 2, 1, 0x929f9a);
      ink(x, y + 1, 1, 2, 0x758080);
      ink(x + 1, y + 2, 3, 1, 0x080d13);
    }
  for (const x of [31, 98, 222, 281]) {
    ink(x, 1, 6, 1, 0x665e4a);
    ink(x + 2, 2, 2, 1, 0x928269);
    ink(x + 1, 176, 8, 1, 0x38494c);
    ink(x + 4, 177, 3, 1, 0x928269);
  }
  ink(147, 1, 15, 4, 0x38494c);
  ink(148, 1, 12, 1, 0x758080);
  ink(150, 4, 9, 1, 0x080d13);
}

// Cut shadows at the real gaps: neither feet nor their shadow bridge the void.
export function shadowSpans(
  x: number,
  feet: number,
  width: number,
  gaps: number[][],
) {
  const height = Math.max(0, VIEW.floor - feet);
  const half = (width * (1 - Math.min(0.55, height / 100))) / 2;
  let spans = [[Math.max(8, x - half), Math.min(312, x + half)]].filter(
    ([left, right]) => right > left,
  );
  for (const [left, right] of gaps) {
    spans = spans.flatMap(([a, b]) =>
      b <= left || a >= right
        ? [[a, b]]
        : [
            [a, Math.min(b, left)],
            [Math.max(a, right), b],
          ].filter(([l, r]) => r > l),
    );
  }
  return { spans, opacity: 0.3 * (1 - Math.min(0.7, height / 90)) };
}
export function drawContactShadow(
  g: Phaser.GameObjects.Graphics,
  x: number,
  feet: number,
  width: number,
  gaps: number[][],
  opacity = 1,
) {
  const shadow = shadowSpans(x, feet, width, gaps);
  for (const [a, b] of shadow.spans) {
    const left = Math.ceil(a),
      right = Math.floor(b);
    if (right <= left) continue;
    g.fillStyle(0x080d13, shadow.opacity * opacity * 0.5);
    g.fillRect(left, VIEW.floor - 1, right - left, 4);
    g.fillStyle(0x080d13, shadow.opacity * opacity);
    g.fillRect(left + 1, VIEW.floor, Math.max(0, right - left - 2), 2);
  }
}

export function wearAnchors(travel: number) {
  const marks: { z: number; lane: number; kind: number; id: number }[] = [];
  for (
    let id = Math.max(0, Math.floor(travel / 13));
    id <= Math.floor(travel / 13) + 32;
    id++
  ) {
    const z = id * 13 + 6;
    if (z < travel || z - travel > 420) continue;
    // Integer world IDs keep the repairs fixed while the camera moves.
    marks.push({ z, lane: (((id * 37) % 17) - 8) / 11, kind: id % 4, id });
  }
  return marks;
}
export function drawRoadWear(
  g: Phaser.GameObjects.Graphics,
  travel: number,
  project: (
    d: number,
    lane?: number,
  ) => { x: number; y: number; scale: number },
) {
  const poly = (points: number[], color: number, alpha: number) => {
    g.fillStyle(color, alpha);
    g.beginPath();
    g.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2)
      g.lineTo(points[i], points[i + 1]);
    g.closePath();
    g.fillPath();
  };
  for (const mark of wearAnchors(travel).reverse()) {
    const d = mark.z - travel,
      p = project(d, mark.lane),
      far = project(d + 9, mark.lane);
    if (p.scale < 0.18) continue;
    const w = (mark.kind === 0 ? 25 : 13) * p.scale;
    if (mark.kind < 2) {
      poly(
        [
          p.x - w,
          p.y,
          p.x + w,
          p.y - 1,
          far.x + w * 0.6,
          far.y,
          far.x - w * 0.8,
          far.y + 1,
        ],
        mark.kind === 0 ? 0x252e33 : 0x526064,
        mark.kind === 0 ? 0.65 : 0.22,
      );
      g.lineStyle(Math.max(0.5, p.scale), 0x151d22, 0.65);
      g.lineBetween(p.x - w, p.y, far.x - w * 0.8, far.y + 1);
    } else {
      g.lineStyle(Math.max(0.5, p.scale), 0x18232b, 0.65);
      g.lineBetween(p.x - w, p.y, p.x, p.y - 2 * p.scale);
      g.lineBetween(p.x, p.y - 2 * p.scale, far.x + w * 0.3, far.y);
    }
    // One worn joint and a small gravel cluster at the same world position.
    for (const side of [-1, 1]) {
      const edge = project(d, side * 1.34);
      for (let i = 0; i < 3; i++) {
        g.fillStyle(i % 2 ? 0x38494c : 0xb9aa89, 0.4);
        g.fillRect(
          Math.round(edge.x + side * i * 3 * p.scale),
          Math.round(edge.y - i * p.scale),
          Math.max(1, Math.round(2 * p.scale)),
          1,
        );
      }
    }
  }
}

export const REFERENCE_SCENES: Record<string, string> = {
  road: "Route",
  "road-housing": "Route / habitat",
  "road-civic": "Route / équipements publics",
  "road-green": "Route / talus et arbres",
  "road-workshops": "Route / ateliers",
  "road-bridge": "Pont / béton",
  "road-steel": "Pont / maçonnerie et acier",
  "road-under": "Pont / passage sous le tablier",
  "road-publicite": "Route / publicité Excellence",
  "road-lights": "Route / éclairage des véhicules",
  "road-publicite-ecole": "Route / publicité École de demain",
  "road-publicite-gauche": "Route / publicité côté gauche",
  "road-publicite-facade": "Route / publicité sur façade d’atelier",
  "road-affiches": "Route / petites affiches",
  "road-graffiti": "Route / graffiti",
  arrival: "Arrivée au collège",
  "0": "Cour",
  "1": "Hall",
  "2": "Escalier central",
  "3": "Aile C",
  "4": "Salle 42C",
  "5": "Annexe",
  "6": "Passerelle",
  "7": "Service",
  "8": "Passage technique",
};
export function installPresentation(s: {
  loadPresentation(scene: string, mission: number): void;
  presentationHideHud: boolean;
  scale: { refresh(): unknown };
}) {
  const root = document.getElementById("presentation-controls");
  if (!root) return;
  root.hidden = false;
  const row = document.createElement("div");
  row.className = "workshop-controls";
  const select = (name: string, entries: Record<string, string>) => {
    const label = document.createElement("label");
    label.textContent = name + " ";
    const input = document.createElement("select");
    input.setAttribute("aria-label", name);
    for (const [value, text] of Object.entries(entries)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      input.append(option);
    }
    label.append(input);
    row.append(label);
    return input;
  };
  const scene = select("Scène de référence", REFERENCE_SCENES);
  scene.value = "1";
  const moment = select(
    "Moment de la journée",
    Object.fromEntries(DAYLIGHT.map((d, i) => [String(i), d.name])),
  );
  const refresh = () => {
    s.loadPresentation(scene.value, Number(moment.value));
  };
  scene.onchange = refresh;
  moment.onchange = refresh;
  const checkbox = (text: string, callback: (v: boolean) => void) => {
    const label = document.createElement("label"),
      input = document.createElement("input");
    input.type = "checkbox";
    input.onchange = () => callback(input.checked);
    label.append(input, " " + text);
    row.append(label);
  };
  checkbox("Masquer le CADRE", (value) => {
    s.presentationHideHud = value;
  });
  checkbox("Taille réelle 640 × 480", (value) => {
    document.body.classList.toggle("reference-size", value);
    requestAnimationFrame(() => s.scale.refresh());
  });
  const note = document.createElement("p");
  note.textContent =
    "PLANCHE DE RÉFÉRENCE — mêmes poses et cadrages aux trois heures. Scènes figées, rendues par le jeu. Pour juger le mouvement et les contrôles, ouvrir l’atelier ou jouer une journée.";
  root.append(row, note);
  refresh();
}
