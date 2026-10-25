"""Local audition of the approved 57-second ending. Original 8-bit PCM bank.

Four sample voices, timed freely against the picture edit; no game integration.
Requires NumPy. No downloaded recordings or external audio service.
"""
from pathlib import Path
import csv
import hashlib
import importlib.util
import json
import math
import sys
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio/cinematiques-2026-10-25"
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("palette", ROOT / "tools/compose-maquettes.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
SR, RATE, ROOT_NOTE = 22050, m.BASE_RATE, 48
SECONDS, CUT, WAKE = 57.0, 50.0, 51.2
RNG = np.random.default_rng(251026)


def write_wav(path, signal, rate=SR, bits=16):
    pcm = np.rint(np.clip(signal, -1, 1) * (32767 if bits == 16 else 127))
    data = pcm.astype("<i2").tobytes() if bits == 16 else (pcm.astype(np.int16) + 128).astype(np.uint8).tobytes()
    with wave.open(str(path), "wb") as out:
        out.setnchannels(1 if signal.ndim == 1 else signal.shape[1])
        out.setsampwidth(bits // 8)
        out.setframerate(round(rate))
        out.writeframes(data)


def bank():
    samples = {}

    def add(name, signal, loop=False):
        signal = signal - signal.mean()
        if loop:
            edge = 180
            signal[-edge:] = signal[-edge:] * np.linspace(1, 0, edge) + signal[:edge] * np.linspace(0, 1, edge)
        else:
            signal[:16] *= np.linspace(0, 1, 16)
            signal[-150:] *= np.linspace(1, 0, 150)
        signal *= .86 / max(.01, np.max(np.abs(signal)))
        samples[name] = {"pcm": np.rint(signal * 127).astype(np.int8), "loop": loop}

    t = np.arange(round(RATE * 5.5)) / RATE
    f = m.freq(ROOT_NOTE)
    piano = np.zeros_like(t)
    for h in range(1, 23):
        if h * f > RATE * .43:
            break
        partial = np.sin(2 * np.pi * f * h * (1 + .00007 * h * h) * t)
        partial += .38 * np.sin(2 * np.pi * f * h * 1.0023 * t)
        piano += partial * np.exp(-t * (.5 + h * .22)) / h ** 1.7
    piano += RNG.normal(0, .05, len(t)) * np.exp(-t * 150)
    add("piano", m.lowpass(piano, 2400))
    bass = np.sin(2 * np.pi * f * t) + .22 * np.sin(2 * np.pi * f * 2 * t)
    add("bass", m.lowpass(bass, 700), True)
    intervals = {"minor": [0, 3, 7, 10], "major9": [0, 4, 7, 14],
                 "major7": [0, 4, 7, 11], "major6": [0, 4, 7, 9], "dominant": [0, 4, 7, 10]}
    t = np.arange(round(RATE * 2.5)) / RATE
    for quality, notes in intervals.items():
        for family in ["strings", "air"]:
            sound = np.zeros_like(t)
            for i, interval in enumerate(notes):
                hz = m.freq(ROOT_NOTE + interval)
                for h in range(1, 13):
                    if hz * h > RATE * .44:
                        break
                    weight = 1 / h ** (1.7 if family == "strings" else 2.6)
                    detune = 1 + (i - 1.5) * .0014
                    vibrato = .012 * np.sin(2 * np.pi * 4.2 * t + i)
                    sound += weight * np.sin(2 * np.pi * hz * h * detune * t + vibrato)
            sound = m.lowpass(sound, 1700 if family == "strings" else 1100)
            add(family + "-" + quality, sound, True)
    return samples


def score():
    events = []

    def note(at, lane, sample, pitch, duration, gain):
        events.append(dict(at=at, lane=lane, sample=sample, pitch=pitch, duration=duration, gain=gain))

    # Opening recalls the low F / Eb / D / Ab contour used by the title's rebuilt bass.
    # It is a new piano phrase, not a transcription of the supplied title melody.
    for at, pitch, dur, gain in [(0.12, 65, 2.6, .40), (2.7, 63, 2.2, .34), (5.0, 62, 1.6, .31), (6.8, 68, 1.5, .28)]:
        note(at, 1, "piano", pitch, dur, gain)
    note(.1, 0, "bass", 41, 8.25, .10)
    note(.5, 2, "strings-minor", 53, 3.6, .09)
    note(5.2, 2, "strings-minor", 53, 3.1, .07)
    # The doorbell at 8.5 is given a genuinely empty musical breath.
    note(10.8, 1, "piano", 63, 1.7, .24)
    sections = [
        (11, 4, 44, 56, "major9", .15, .16),
        (15, 4, 39, 51, "major6", .16, .20),
        (19, 7, 44, 56, "major9", .19, .26),
        (26, 5, 37, 49, "major7", .19, .28),
        (31, 6, 41, 53, "minor", .18, .29),
        (37, 4, 37, 49, "major6", .20, .31),
        (41, 3, 39, 51, "dominant", .20, .31),
        (44, 6.1, 44, 56, "major6", .20, .33),
    ]
    for at, duration, bass, root, quality, low, chord in sections:
        note(at, 0, "bass", bass, duration + .05, low)
        note(at, 2, "strings-" + quality, root, duration + .05, chord)
    melody = [
        (11.6, 65, 1.5), (13.5, 68, 1.5), (15.4, 67, 1.5), (17.2, 70, 1.8),
        (19.3, 75, 1.6), (21.1, 72, 1.9), (23.2, 70, 1.4), (24.7, 68, 1.3),
        (26.4, 65, 1.2), (27.9, 68, 1.2), (29.4, 72, 1.6),
        (31.3, 72, 1.6), (33.2, 75, 1.7), (35.2, 77, 1.7),
        (37.3, 77, 1.4), (39.0, 75, 1.7), (41.2, 73, 1.2), (42.6, 70, 1.4),
        (44.2, 75, 1.2), (45.6, 72, 1.2), (47.1, 68, 3.2),
    ]
    for at, pitch, duration in melody:
        note(at, 1, "piano", pitch, duration, .34 if at < 19 else .40)
    # Broken chords gradually turn into a sustained, sincerely reassuring texture.
    for at, pitches in [(19.8, [60, 63, 68, 72]), (26.5, [61, 65, 68]), (31.6, [60, 65, 68, 72])]:
        for i, pitch in enumerate(pitches):
            note(at + i * 1.3, 3, "piano", pitch, 1.6, .14)
    note(37, 3, "air-major6", 61, 4, .13)
    note(41, 3, "air-dominant", 63, 3, .13)
    note(44, 3, "air-major6", 68, 6.2, .17)
    return sorted(events, key=lambda e: (e["at"], e["lane"]))


def render(samples, events):
    n = round(SECONDS * SR)
    lanes = np.zeros((n, 4))
    for lane in range(4):
        group = [e for e in events if e["lane"] == lane]
        for i, e in enumerate(group):
            source = samples[e["sample"]]
            pcm = source["pcm"].astype(float) / 128
            next_at = group[i + 1]["at"] if i + 1 < len(group) else CUT + 1
            duration = min(e["duration"], next_at - e["at"], SECONDS - e["at"])
            rate = RATE * 2 ** ((e["pitch"] - ROOT_NOTE) / 12)
            length = max(0, round(duration * SR))
            positions = np.arange(length) * rate / SR
            signal = np.interp(positions % len(pcm) if source["loop"] else positions,
                               np.arange(len(pcm)), pcm, left=0, right=0)
            attack = min(length, round((.16 if source["loop"] else .003) * SR))
            release = min(length, round((.28 if source["loop"] else .018) * SR))
            signal[:attack] *= np.linspace(0, 1, attack)
            signal[-release:] *= np.linspace(1, 0, release)
            start = round(e["at"] * SR)
            lanes[start:start + length, lane] += signal * e["gain"]
    stereo = lanes @ np.array([[.5, .5], [.54, .46], [.43, .57], [.58, .42]])
    dry = stereo.copy()
    time = np.arange(n) / SR
    space = np.interp(time, [0, 8.5, 11, 19, 37, 44, 57], [.12, .12, .18, .48, .72, .8, .8])
    for seconds, gain in [(.071, .20), (.149, .13), (.283, .10), (.431, .07), (.617, .04)]:
        delay = round(seconds * SR)
        stereo[delay:] += dry[:-delay, ::-1] * gain * space[delay:, None]
    # Offline causal filtering, so silence after the hard cut cannot ring backwards.
    a = 1 - math.exp(-2 * math.pi * 4800 / SR)
    for lag in range(1, 7):
        stereo[lag:] += dry[:-lag] * a * (1 - a) ** lag * .08
    active = stereo[:round(CUT * SR)]
    rms = float(np.sqrt(np.mean(active ** 2)))
    gain = min(10 ** (-22 / 20) / max(rms, 1e-9), .76 / max(.001, np.max(np.abs(active))))
    stereo *= gain
    # Only a 2 ms anti-click edge, not an audible warning fade before the bell.
    cut = round(CUT * SR)
    stereo[cut - 44:cut] *= np.linspace(1, 0, 44)[:, None]
    stereo[cut:] = 0
    return stereo


def cues():
    signal = np.zeros((round(SECONDS * SR), 2))

    def tone(at, hz, seconds, gain):
        t = np.arange(round(seconds * SR)) / SR
        s = np.sin(2 * np.pi * hz * t) * gain
        edge = min(len(s) // 2, round(.004 * SR))
        s[:edge] *= np.linspace(0, 1, edge); s[-edge:] *= np.linspace(1, 0, edge)
        start = round(at * SR); signal[start:start + len(s)] += s[:, None]

    tone(8.5, 660, .25, .11); tone(8.74, 523, .4, .09)
    with wave.open(str(ROOT / "audio/sfx-2026-10-24/bell-start-1.wav"), "rb") as inp:
        rate, width = inp.getframerate(), inp.getsampwidth()
        b = inp.readframes(inp.getnframes())
        bell = (np.frombuffer(b, np.uint8).astype(float) - 128) / 128 if width == 1 else np.frombuffer(b, "<i2").astype(float) / 32768
        bell = np.interp(np.arange(round(len(bell) * SR / rate)) * rate / SR, np.arange(len(bell)), bell)
    bell = bell[:round((WAKE - CUT) * SR)]
    start = round(CUT * SR); signal[start:start + len(bell)] += bell[:, None] * .58
    for at in np.arange(WAKE, SECONDS - .1, 1.6):
        for delay in [0, .16, .32]:
            if at + delay + .09 <= SECONDS:
                tone(at + delay, 880, .09, .16)
    # Narrow dry room noise after awakening; no residual harmony.
    start = round(WAKE * SR)
    noise = RNG.normal(0, .00065, (len(signal) - start, 1))
    signal[start:] += noise
    signal[-100:] *= np.linspace(1, 0, 100)[:, None]
    return signal


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "samples").mkdir(exist_ok=True)
    with (ROOT / "docs/cinematiques/timecodes-ending.csv").open(encoding="utf-8") as inp:
        timeline = list(csv.DictReader(inp))
    assert timeline[-2]["start"] == "00:50.000" and timeline[-1]["start"] == "00:51.200"
    samples, events = bank(), score()
    music = render(samples, events)
    effects = cues(); mix = music + effects
    assert np.isfinite(mix).all() and np.max(np.abs(mix)) < .95
    write_wav(OUT / "Fin-Musique.wav", music)
    write_wav(OUT / "Fin-Reperes.wav", effects)
    write_wav(OUT / "Fin-Montage.wav", mix)
    palette = []
    for name, sample in samples.items():
        write_wav(OUT / "samples" / (name + ".wav"), sample["pcm"].astype(float) / 127, RATE, 8)
        palette.append({"name": name, "bits": 8, "sampleRate": round(RATE), "loop": sample["loop"], "frames": len(sample["pcm"])})
    (OUT / "partition.json").write_text(json.dumps({"seconds": SECONDS, "voices": 4, "rootMidi": ROOT_NOTE, "events": events}, indent=2) + "\n", encoding="utf-8")
    manifest = {"status": "audition-v1-not-integrated", "seconds": SECONDS, "musicCut": CUT, "alarmStarts": WAKE,
                "sourceBits": 8, "sampleRate": SR, "voices": 4, "palette": palette, "timeline": timeline,
                "composition": "Original phrase; opening recalls only the approximate rebuilt F/Eb/D/Ab bass contour of the title, not a transcription of its lead",
                "files": []}
    for name, signal in [("Fin-Musique.wav", music), ("Fin-Reperes.wav", effects), ("Fin-Montage.wav", mix)]:
        manifest["files"].append({"file": name, "sha256": hashlib.sha256((OUT / name).read_bytes()).hexdigest(),
                                 "peakDbFS": round(float(20 * np.log10(np.max(np.abs(signal)))), 2),
                                 "rmsDbFS": round(float(20 * np.log10(np.sqrt(np.mean(signal ** 2)))) , 2)})
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"seconds": SECONDS, "samples": len(samples), "files": manifest["files"]}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
