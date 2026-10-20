import { smallPrint, smallWidth } from "./small-lettering";

export type SchoolSignStyle = "ormeaux" | "berthelot" | "trois-ponts";
export type SchoolSignKind = "direction" | "room" | "paper" | "warning";
// Top-left wall anchor, wording, visual priority, physical support.
export type SchoolSign = [number, number, string[], boolean?, SchoolSignKind?];
type SignInk = Parameters<typeof smallPrint>[0];

export function schoolSignBounds(x: number, y: number, lines: string[]) {
  const width = Math.max(24, ...lines.map((s) => smallWidth(s) + 12));
  const height = lines.length * 8 + 6;
  return {
    x: Math.max(9, Math.min(311 - width, Math.round(x))),
    y: Math.max(9, Math.min(140 - height, Math.round(y))),
    width,
    height,
  };
}

// Presentation only: no clock, input or gameplay randomness. Keep every scar
// outside the lettering inset, so a worn sign still fulfils its wayfinding role.
export function drawSchoolSign(
  g: SignInk,
  style: SchoolSignStyle,
  anchorX: number,
  anchorY: number,
  lines: string[],
  primary = false,
  kind: SchoolSignKind = "direction",
) {
  const b = schoolSignBounds(anchorX, anchorY, lines);
  const { x, y, width: w, height: h } = b;
  const metal = style === "trois-ponts",
    old = style === "berthelot";
  const paper = kind === "paper",
    warning = kind === "warning";
  const dark = !paper && (metal || (old && kind !== "room"));
  const face = paper
    ? 0xbfb597
    : warning
      ? 0xb79b58
      : dark
        ? primary
          ? 0x344f4b
          : 0x354442
        : primary
          ? 0xbdb797
          : 0xa5a58f;
  const textColor =
    dark && !warning ? (primary ? 0xd4c7a1 : 0xc0b898) : 0x293532;
  const rect = (
    color: number,
    dx: number,
    dy: number,
    width: number,
    height: number,
  ) => {
    g.fillStyle(color);
    g.fillRect(x + dx, y + dy, width, height);
  };
  // A narrow contact shadow, never a floating HUD outline.
  g.fillStyle(0x10191b, 0.55);
  g.fillRect(x + 1, y + 2, w + 1, h + 1);
  if (paper) {
    rect(0x797765, 0, 0, w, h);
    rect(face, 1, 1, w - 2, h - 2);
    rect(0xd1c5a1, 2, -1, 6, 2);
    rect(0xaaa180, w - 8, -1, 6, 2);
    rect(0x8e8a75, w - 4, h - 3, 3, 2); // folded lower corner
    rect(0x777d70, 2, h - 1, 3, 1);
  } else {
    // Different constructions: plastic in a rail, repainted board, folded metal.
    rect(old ? 0x6b6251 : 0x3c4b48, -1, -1, w + 2, h + 2);
    rect(face, 0, 0, w, h);
    rect(dark ? 0x65736a : 0xccc3a3, 1, 0, w - 2, 1);
    rect(dark ? 0x253331 : 0x697369, 0, h - 1, w, 1);
    if (old) {
      // A previous coat peeks through at the edge and old mounting holes remain.
      rect(0x9f9271, -1, 2, 2, 3);
      rect(0x8d8265, w - 4, h - 1, 3, 1);
      rect(0x3e4036, -2, h - 3, 1, 1);
      rect(0x9c9a7e, 1, 1, 1, 1);
    } else if (metal) {
      rect(0x75817a, -1, 1, 2, h - 2);
      rect(0x795d40, w - 3, h - 2, 3, 2);
      rect(0x202d2c, w - 1, 1, 1, h - 2);
    } else {
      rect(0x53615b, -1, h, w + 2, 1); // old extruded plastic rail
      rect(0xc6bd9d, 2, 1, 3, 1);
      rect(0x807f67, w - 5, h - 2, 3, 1);
    }
    // Slotted screws stay outside the text inset.
    for (const sx of [2, w - 3]) {
      rect(dark ? 0x8a9180 : 0x697469, sx, 2, 1, 2);
      rect(0x303d39, sx, 3, 1, 1);
    }
    if (kind === "room") {
      rect(0x747869, 1, h - 3, w - 2, 1); // replaceable door-name strip
    }
    if (warning) {
      for (let dy = 1; dy < h - 1; dy += 4) rect(0x313b35, 0, dy, 2, 2);
      rect(0x313b35, w - 2, 1, 2, h - 2);
      rect(0x313b35, 3, 4, 1, 3);
      rect(0x313b35, 3, 8, 1, 1);
    }
  }
  lines.forEach((s, i) => smallPrint(g, x + 6, y + 4 + i * 8, s, textColor));
  return { ...b, textColor };
}
