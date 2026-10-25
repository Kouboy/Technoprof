"""Original smooth-jazz return-home loop, four sample voices, no external audio."""
from pathlib import Path
import importlib.util
import hashlib
import json
import sys
import wave
import numpy as np

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio/retour-maison-2026-10-25"
spec = importlib.util.spec_from_file_location("expansion", ROOT / "tools/compose-music-expansion.py")
expansion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(expansion)
m = expansion.m
BPM, BARS = 76, 16


def score(ids):
    cells = [[[0, 0, 0, 0, 0] for _ in range(4)] for _ in range(BARS * 16)]
    def note(bar, row, lane, instrument, pitch, volume, length=None):
        m.period(pitch)
        at = bar * 16 + row
        cells[at][lane] = [ids[instrument], pitch, volume, 0xC, volume]
        if length and at + length < len(cells):
            cells[at + length][lane] = [0, 0, 0, 0xC, 0]
    # D minor ninth -> G ninth -> C major seventh -> A minor ninth.
    # Second half turns through F major seventh / E suspended before returning.
    harmony = [(38, "epm9"), (38, "epm9"), (43, "epdom9"), (43, "epdom9"),
               (36, "epmaj7"), (36, "epmaj7"), (45, "epm9"), (45, "epm9"),
               (41, "epmaj7"), (41, "epmaj7"), (40, "epsus"), (40, "epsus"),
               (45, "epm9"), (43, "epdom9"), (38, "epm9"), (45, "epsus")]
    phrases = {
        1: [(2, 57, 7), (10, 60, 4)], 3: [(1, 59, 5), (8, 57, 7)],
        5: [(3, 55, 6), (11, 52, 4)], 7: [(0, 55, 6), (9, 57, 6)],
        9: [(2, 57, 4), (8, 60, 6)], 11: [(1, 59, 6), (10, 57, 5)],
        12: [(6, 55, 7)], 13: [(5, 53, 6)], 14: [(2, 52, 9)],
    }
    for bar, (root, chord) in enumerate(harmony):
        note(bar, 0, 0, "bass", root, 34)
        note(bar, 9, 0, "bass", root + 7, 24, 6)
        note(bar, 1, 2, chord, root + 12, 21, 11)
        if bar % 2 == 0:
            note(bar, 13, 2, chord, root + 12, 14)
        for row, pitch, length in phrases.get(bar, []):
            note(bar, row, 1, "reed", pitch, 19 if row > 7 else 21, length)
        for row in [0, 2, 4, 6, 8, 10, 12, 14]:
            instrument = "kick" if row in [0, 8] else "rim" if row in [4, 12] else "hat"
            note(bar, row, 3, instrument, 48, 17 if instrument == "kick" else 13 if instrument == "rim" else 7, 2)
    cells[0][2][3:] = [0xF, 6]
    cells[0][3][3:] = [0xF, BPM]
    return cells


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    samples, ids = expansion.bank()
    cells = score(ids)
    chosen = expansion.prune(cells, samples)
    m.write_mod(OUT / "13-retour-maison.mod", "Maison - apres cours", cells, chosen)
    mix = m.render(cells, chosen, BPM, "radio") * 10 ** (-2 / 20)
    assert np.isfinite(mix).all() and np.max(np.abs(mix)) < .95
    pcm = np.rint(mix * 32767).astype("<i2")
    wav = OUT / "13-retour-maison.wav"
    with wave.open(str(wav), "wb") as out:
        out.setnchannels(2); out.setsampwidth(2); out.setframerate(m.SR); out.writeframes(pcm.tobytes())
    manifest = dict(title="Maison — Après les cours", bpm=BPM, bars=BARS, voices=4, sourceBits=8,
                    sampleRate=m.SR, seconds=len(mix)/m.SR, loop=True, samples=len(chosen),
                    peakDbFS=float(20*np.log10(np.max(np.abs(mix)))),
                    rmsDbFS=float(20*np.log10(np.sqrt(np.mean(mix**2)))),
                    seamDelta=float(np.max(np.abs(mix[0]-mix[-1]))),
                    wavSha256=hashlib.sha256(wav.read_bytes()).hexdigest())
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    (OUT / "partition.json").write_text(json.dumps(dict(bpm=BPM,bars=BARS,rowsPerBeat=4,cells=cells),separators=(",", ":"))+"\n")
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == "__main__":
    main()
