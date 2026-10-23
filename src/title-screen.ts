import { GLYPHS } from "./cadre";
import { TITLE_DATA } from "./interface-data";

// Lowercase letters are intentional: preserve the approved publisher/start copy.
const TITLE_GLYPHS = {
  ...GLYPHS,
  ...Object.fromEntries(
    Object.entries({
      a: "00000/00000/01110/00001/01111/10001/01111",
      c: "00000/00000/01111/10000/10000/10000/01111",
      e: "00000/00000/01110/10001/11111/10000/01111",
      f: "00110/01001/01000/11100/01000/01000/01000",
      h: "10000/10000/10110/11001/10001/10001/10001",
      i: "1/0/1/1/1/1/1",
      n: "00000/00000/10110/11001/10001/10001/10001",
      o: "00000/00000/01110/10001/10001/10001/01110",
      r: "0000/0000/1011/1100/1000/1000/1000",
      s: "00000/00000/01111/10000/01110/00001/11110",
      t: "0100/0100/1110/0100/0100/0101/0010",
      v: "00000/00000/10001/10001/10001/01010/00100",
      w: "00000/00000/10001/10001/10101/10101/01010",
      "(": "001/010/100/100/100/010/001",
      ")": "100/010/001/001/001/010/100",
    }).map(([key, rows]) => [key, rows.split("/")]),
  ),
};

function titleLabel(
  text: string,
  width: number,
  height: number,
  y: number,
  color: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.setAttribute("aria-hidden", "true");
  const g = canvas.getContext?.("2d");
  if (!g) return canvas;
  const glyph = (ch: string) => TITLE_GLYPHS[ch] ?? TITLE_GLYPHS["?"];
  const size = [...text].reduce(
    (n, ch) => n + (glyph(ch)[0].length + 1) * 2,
    -2,
  );
  const paint = (dx: number, dy: number, ink: string) => {
    let x = Math.floor((width - size) / 2);
    g.fillStyle = ink;
    for (const ch of text) {
      const rows = glyph(ch);
      rows.forEach((row, j) =>
        [...row].forEach((bit, i) => {
          if (bit === "1") g.fillRect(x + i * 2 + dx, y + j * 2 + dy, 2, 2);
        }),
      );
      x += (rows[0].length + 1) * 2;
    }
  };
  paint(2, 2, "#080d13");
  for (const [x, y] of [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ])
    paint(x, y, "#080d13");
  paint(0, 0, color);
  return canvas;
}

// Native button semantics; the illustration and its raster lettering never own input.
export function mountTitleArt(start: HTMLButtonElement) {
  const art = document.createElement("div");
  art.className = "title-art";
  const image = document.createElement("img");
  image.src = TITLE_DATA;
  image.alt =
    "TECHNOPROF — Physique appliquée. Le professeur et son manuel, sa vieille voiture de service et un collège en décrépitude.";
  image.draggable = false;
  const publisher = titleLabel(
    "(c) 2026 Brainrot Interactive Software",
    640,
    480,
    458,
    "#d9c798",
  );
  publisher.className = "title-publisher";
  publisher.setAttribute("role", "img");
  publisher.setAttribute("aria-hidden", "false");
  publisher.setAttribute(
    "aria-label",
    "(c) 2026 Brainrot Interactive Software",
  );
  start.className = "title-start";
  start.setAttribute("aria-label", "Prendre le service");
  start.setAttribute("title", "Prendre le service — Entrée ou Espace");
  const prompt = titleLabel("<Press Start to Teach>", 320, 32, 9, "#fff0b2");
  start.append(prompt);
  art.append(image, publisher, start);
  return art;
}
