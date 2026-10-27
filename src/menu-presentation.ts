import { GLYPHS } from "./cadre";

const menuGlyphs: Record<string, string[]> = {
  ...GLYPHS,
  "(": ["001", "010", "100", "100", "100", "010", "001"],
  ")": ["100", "010", "001", "001", "001", "010", "100"],
};
const paintedLabels = new WeakMap<
  HTMLElement,
  { text: string; canvas: HTMLCanvasElement }
>();

// Presentation only: retain native text, accessible names and button handlers.
// This uses the exact CADRE glyphs, without a downloaded font or texture atlas.
export function paintMenuLabel(node: HTMLElement) {
  const text = node.textContent ?? "";
  const previous = paintedLabels.get(node);
  if (previous?.text === text && previous.canvas.parentNode === node) return;
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replaceAll("’", "'")
    .replaceAll("—", "-");
  const glyphs = [...normalized].map((ch) => menuGlyphs[ch] ?? GLYPHS["?"]);
  const width = Math.max(
    1,
    glyphs.reduce((n, rows) => n + rows[0].length + 1, -1),
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = 7;
  const g = canvas.getContext?.("2d");
  if (!g) return;
  canvas.className = "menu-lettering";
  canvas.setAttribute("aria-hidden", "true");
  const scale = node.tagName === "H1" ? 3 : 2;
  canvas.style.width = width * scale + "px";
  g.fillStyle = "#dfd0ad";
  let x = 0;
  for (const rows of glyphs) {
    rows.forEach((row, y) =>
      [...row].forEach((pixel, i) => {
        if (pixel === "1") g.fillRect(x + i, y, 1, 1);
      }),
    );
    x += rows[0].length + 1;
  }
  node.setAttribute("aria-label", text);
  node.className = [
    ...new Set(((node.className || "") + " menu-bitmap").trim().split(/\s+/)),
  ].join(" ");
  node.append(canvas);
  paintedLabels.set(node, { text, canvas });
}
