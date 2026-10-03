import type Phaser from "phaser";

// Shared presentation contract. Coordinates are logical pixels (output is ×2).
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
    name: "Matin · 08:00",
    background: 0xd4dfdd,
    actor: 0xf0f3ee,
    sky: 0xc9d7e0,
    wash: 0x334957,
    opacity: 0.08,
  },
  {
    name: "Midi · 12:00",
    background: 0xeee4cc,
    actor: 0xfff4df,
    sky: 0xf1e6cb,
    wash: 0xa68c60,
    opacity: 0.045,
  },
  {
    name: "Fin de journée · 17:00",
    background: 0xacb8cb,
    actor: 0xdce3f0,
    sky: 0xa9b1c9,
    wash: 0x27304c,
    opacity: 0.19,
  },
];
export function daylight(mission: number) {
  return DAYLIGHT[Math.max(0, Math.min(2, Math.floor(mission)))];
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
