import { SFX_DATA, SFX_RATE } from "./sfx-data";
export function sfxTakes(kind: string) {
  return SFX_DATA[kind]?.length ?? 1;
}
export function readSfx(kind: string, sampleRate: number, take = 0) {
  const takes = SFX_DATA[kind];
  if (!takes) return null;
  const raw = atob(takes[Math.abs(take) % takes.length]);
  const pcm = new Float32Array(
    Math.round((raw.length * sampleRate) / SFX_RATE),
  );
  const value = (i: number) => {
    if (i >= raw.length) return 0;
    const n = raw.charCodeAt(i);
    return (n > 127 ? n - 256 : n) / 128;
  };
  for (let i = 0; i < pcm.length; i++) {
    const at = (i * SFX_RATE) / sampleRate,
      left = Math.floor(at),
      mix = at - left;
    pcm[i] = value(left) * (1 - mix) + value(left + 1) * mix;
  }
  return pcm;
}
