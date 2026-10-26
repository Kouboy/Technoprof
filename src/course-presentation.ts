import { bitmap, bitmapWidth } from "./cadre";

type Ink = Parameters<typeof bitmap>[0];
// Silent intertitles: the classroom Foley carries the scene, no extra UI frame.
export function drawCourseCard(g: Ink, phase: "course" | "later") {
  g.fillStyle(0x000000);
  g.fillRect(7, 7, 306, 168);
  const line = (text: string, y: number, scale: number) =>
    bitmap(
      g,
      Math.round(160 - bitmapWidth(text, scale) / 2),
      y,
      text,
      0xe3d4b3,
      scale,
    );
  if (phase === "course") {
    line("BON.", 72, 1);
    line("REPRENONS.", 91, 2);
  } else {
    line("UNE HEURE", 72, 1);
    line("PLUS TARD...", 91, 2);
  }
  // Broken chalk rule, deliberately subordinate to the two lines.
  g.fillStyle(0x52605b);
  for (const [x, width] of [
    [137, 17],
    [155, 13],
    [170, 12],
  ])
    g.fillRect(x, 117, width, 1);
}
