"""Read-only spectral guide for a supplied mix; estimates, never an exact score."""
import argparse
import json
from pathlib import Path
import subprocess
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("--output", type=Path, default=Path("work/checkpoints/title-reference"))
args = parser.parse_args()
args.output.parent.mkdir(parents=True, exist_ok=True)
sr, size, hop = 11025, 4096, 256
decoded = subprocess.run(["ffmpeg", "-v", "error", "-i", str(args.source), "-f", "f32le", "-ac", "1", "-ar", str(sr), "pipe:1"], check=True, capture_output=True)
x = np.frombuffer(decoded.stdout, dtype="<f4")
frames = np.lib.stride_tricks.sliding_window_view(x, size)[::hop]
spec = np.abs(np.fft.rfft(frames * np.hanning(size), axis=1)).astype(np.float32)
times = (np.arange(len(spec)) * hop + size / 2) / sr
freqs = np.fft.rfftfreq(size, 1 / sr)
smooth = np.apply_along_axis(lambda a: np.convolve(a, np.ones(61) / 61, "same"), 1, spec)
white = spec / np.maximum(smooth, .03)
white = np.minimum(white, 20)
notes = np.arange(28, 89)
salience = []
for midi in notes:
    f = 440 * 2 ** ((midi - 69) / 12)
    values = np.zeros(len(spec), dtype=np.float64)
    for h in range(1, 9):
        b = round(f * h * size / sr)
        if b + 2 >= spec.shape[1]:
            break
        # A pitch must have an actual spectral peak, not just broad-band noise.
        peak = np.max(white[:, max(1, b - 1):b + 2], axis=1)
        values += np.maximum(0, peak - 1.2) / h ** .8
    salience.append(values)
salience = np.array(salience).T
chroma = np.array([salience[:, notes % 12 == p].sum(axis=1) for p in range(12)]).T
flux = np.maximum(0, np.diff(np.log1p(spec), axis=0)).sum(axis=1)
flux = np.r_[0, flux]; flux -= np.mean(flux)
ac = np.fft.irfft(np.abs(np.fft.rfft(flux, n=2 ** int(np.ceil(np.log2(2 * len(flux)))))) ** 2)[:len(flux)]
candidates = []
for lag in range(round(60 * sr / hop / 180), round(60 * sr / hop / 60)):
    if ac[lag] > ac[lag - 1] and ac[lag] >= ac[lag + 1]:
        candidates.append((round(60 * sr / hop / lag, 2), round(float(ac[lag] / ac[0]), 3)))
candidates.sort(key=lambda a: a[1], reverse=True)
names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
def label(n):
    return names[int(n) % 12] + str(int(n) // 12 - 1)
blocks = []
for start in range(0, int(len(x) / sr), 4):
    mask = (times >= start) & (times < start + 4)
    c = chroma[mask].mean(axis=0)
    bass = salience[mask][:, notes < 50].mean(axis=0)
    lead = salience[mask][:, notes >= 55].mean(axis=0)
    blocks.append({"start": start, "rms": round(float(np.sqrt(np.mean(x[start * sr:(start + 4) * sr] ** 2))), 3),
                   "chroma": [names[p] for p in np.argsort(c)[-5:][::-1]],
                   "bass": [label(n) for n in notes[notes < 50][np.argsort(bass)[-4:][::-1]]],
                   "lead": [label(n) for n in notes[notes >= 55][np.argsort(lead)[-5:][::-1]]]})
report = {"source": str(args.source), "duration": len(x) / sr, "tempoCandidates": candidates[:12], "blocks": blocks,
          "warning": "Spectral estimates from a full mix. Notes and boundaries require musical judgement."}
args.output.with_suffix(".json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
np.savez_compressed(args.output.with_suffix(".npz"), times=times, salience=salience, chroma=chroma, notes=notes, flux=flux)
print(json.dumps(report, indent=2))
