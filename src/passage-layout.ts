import { withinPassage, type Exit } from "./world";

// Pure layout shared by indicator rendering and pointer hit testing.
export const PASSAGE_UI = { edgeReveal: 62, hitPadding: 6 };
export function passageMarker(exit: Exit, px: number) {
  if (exit.edge && Math.abs(px - exit.hint[0]) >= PASSAGE_UI.edgeReveal)
    return undefined;
  const active = !!exit.edge || withinPassage(exit, px);
  const vertical = !exit.edge;
  // HAUT / BAS are 15 / 11 pixels in the small bitmap font.
  const w =
    vertical && active ? (exit.key === "UP" ? 35 : 31) : active ? 15 : 11;
  return {
    exit,
    active,
    vertical,
    x: Math.max(9, Math.min(311 - w, Math.round(exit.hint[0] - w / 2))),
    y: exit.hint[1],
    w,
    h: active ? 14 : 11,
    center: active ? 7 : 5,
  };
}
export function markerPassage(exits: Exit[], px: number, x: number, y: number) {
  return exits.find((exit) => {
    const marker = passageMarker(exit, px);
    const pad = PASSAGE_UI.hitPadding;
    return (
      marker &&
      x >= marker.x - pad &&
      x <= marker.x + marker.w + pad &&
      y >= marker.y - pad &&
      y <= marker.y + marker.h + pad
    );
  });
}
export function doorwayPassage(exits: Exit[], x: number, y: number) {
  return exits.find(
    (exit) =>
      !exit.edge && x >= exit.from && x <= exit.to && y >= 40 && y < 145,
  );
}
