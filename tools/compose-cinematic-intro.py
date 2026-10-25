"""Ten-second opening audition, original sampled music and local Foley.

Reuses the ending's instrument bank and phone alarm without modifying it.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import re
import sys
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio/intro-2026-10-25"
ART = ROOT / "art/intro-2026-10-25/intro-night.png"
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("dream_v3", ROOT / "tools/compose-cinematic-dream-v3.py")
v3 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v3)
base = v3.base
base.SECONDS, base.CUT = 10.0, 10.0
SR, RATE = base.SR, base.RATE
RNG = np.random.default_rng(25102610)


def palette():
    samples = v3.palette()
    t = np.arange(round(RATE * .25)) / RATE
    pulse = np.sin(2 * np.pi * (93 * t + 2 * (1 - np.exp(-t * 32)))) * np.exp(-t * 26)
    pulse += RNG.normal(0, .13, len(t)) * np.exp(-t * 80)
    pulse = base.m.lowpass(pulse, 1800)
    pulse[:10] *= np.linspace(0, 1, 10); pulse[-80:] *= np.linspace(1, 0, 80)
    pulse -= pulse.mean(); pulse *= .82 / np.max(np.abs(pulse))
    samples["dry-pulse"] = {"pcm": np.rint(pulse * 127).astype(np.int8), "loop": False}
    return samples


def score():
    events = []
    def note(at, lane, sample, pitch, duration, gain):
        events.append(dict(at=at, lane=lane, sample=sample, pitch=pitch, duration=duration, gain=gain))
    note(.05, 0, "office-pedal", 41, 5.5, .17)
    note(.4, 2, "strings-minor", 41, 5.2, .10)
    for at, pitch, duration in [(.25, 53, 1.8), (2.25, 51, 1.4), (3.9, 50, 1.4)]:
        note(at, 1, "piano", pitch, duration, .30)
    for at in [.55, 2.05, 3.55]:
        note(at, 3, "dry-pulse", 48, .22, .13)
    # Six beats at 80 BPM exactly fit the 4.5-second departure image.
    for i, (bass, melody) in enumerate(zip([41, 41, 39, 39, 38, 44], [53, 55, 56, 53, 51, 50])):
        at = 5.5 + i * .75
        note(at, 0, "bass", bass, .57, .24)
        note(at + .05, 1, "piano", melody, .57, .33)
        note(at, 3, "dry-pulse", 48, .22, .16)
    note(5.5, 2, "strings-minor", 41, 5.1, .15)
    return sorted(events, key=lambda e: (e["at"], e["lane"]))


def read_alarm():
    path = ROOT / "audio/cinematiques-2026-10-25-v3/samples/alarm-dry.wav"
    with wave.open(str(path), "rb") as inp:
        rate, width = inp.getframerate(), inp.getsampwidth()
        assert width == 1
        data = (np.frombuffer(inp.readframes(inp.getnframes()), np.uint8).astype(float) - 128) / 128
    return np.interp(np.arange(round(len(data) * SR / rate)) * rate / SR, np.arange(len(data)), data)


def cues():
    effects = np.zeros((10 * SR, 2))
    event_log = []
    def place(at, sample, gain, kind):
        start = round(at * SR); count = min(len(sample), len(effects) - start)
        effects[start:start + count] += sample[:count, None] * gain
        event_log.append(dict(at=at, kind=kind, gain=gain))
    alarm = read_alarm()
    for at in np.arange(0, 5.5, 1.6):
        for delay in [0, .16, .32]:
            if at + delay + .09 <= 5.5:
                place(float(at + delay), alarm, .82, "phone-alarm")
    place(.7, v3.read_sfx("cloth-2.wav"), .055, "bedding")
    place(3.15, v3.read_sfx("cloth-1.wav"), .04, "bedding")
    place(5.55, v3.read_sfx("cloth-1.wav"), .10, "coat")
    place(5.5, v3.read_sfx("handle-1.wav"), .08, "door-handle")
    t = np.arange(round(.42 * 11025)) / 11025
    keys = np.zeros_like(t)
    for i, at in enumerate([0, .055, .13, .22]):
        u = np.maximum(t - at, 0)
        ring = sum(g * np.sin(2 * np.pi * hz * u + i * .7)
                   for hz, g in [(1750, .085), (2387, .045), (3010, .025), (3881, .012)])
        keys += ring * np.exp(-u * 30) * (t >= at)
    keys += RNG.normal(0, .018, len(t)) * np.exp(-t * 20)
    keys[:12] *= np.linspace(0, 1, 12); keys[-100:] *= np.linspace(1, 0, 100)
    keys_pcm = np.rint(keys * 127).astype(np.int8)
    sample = np.interp(np.arange(round(len(keys_pcm) * SR / 11025)) * 11025 / SR,
                       np.arange(len(keys_pcm)), keys_pcm.astype(float) / 128)
    place(6.25, sample, 1, "keys")
    place(7.2, v3.read_sfx("step-wood-1.wav"), .13, "step-wood")
    place(7.85, v3.read_sfx("step-wood-2.wav"), .12, "step-wood")
    place(8.55, v3.read_sfx("step-concrete-1.wav"), .12, "step-outside")
    effects += RNG.normal(0, .0005, (len(effects), 1))
    effects[-80:] *= np.linspace(1, 0, 80)[:, None]
    return effects, keys_pcm, event_log


def main():
    assert ART.exists(), "Review the lighting continuity of the introduction first"
    OUT.mkdir(parents=True, exist_ok=True); (OUT / "samples").mkdir(exist_ok=True)
    samples, events = palette(), score()
    music = base.render(samples, events)
    mid, side = music.mean(axis=1), (music[:, 0] - music[:, 1]) * .5
    width = np.interp(np.arange(len(music)) / SR, [0, 5.5, 10], [.3, .3, .55])
    music = np.column_stack([mid + side * width, mid - side * width])
    effects, keys, effect_log = cues(); mix = music + effects
    assert np.isfinite(mix).all() and np.max(np.abs(mix)) < .95
    files = []
    for name, data in [("Intro-Musique.wav", music), ("Intro-Reperes.wav", effects), ("Intro-Montage.wav", mix)]:
        base.write_wav(OUT / name, data)
        files.append(dict(file=name, sha256=hashlib.sha256((OUT / name).read_bytes()).hexdigest(),
                          peakDbFS=round(float(20 * np.log10(np.max(np.abs(data)))), 2)))
    used = sorted({e["sample"] for e in events})
    for name in used:
        base.write_wav(OUT / "samples" / (name + ".wav"), samples[name]["pcm"].astype(float) / 127, RATE, 8)
    base.write_wav(OUT / "samples/keys.wav", keys.astype(float) / 127, 11025, 8)
    timeline = [dict(id="wake-in-bed", label="6h10 — Le réveil", at=0, end=5.5, seconds=5.5, frame=0),
                dict(id="departure", label="Le départ", at=5.5, end=10, seconds=4.5, frame=1)]
    manifest = dict(status="intro-audition-v1-not-integrated", seconds=10, sampleRate=SR, sourceBits=8,
                    voices=4, departureBpm=80, usedSamples=used, timeline=timeline, files=files,
                    artwork=str(ART.relative_to(ROOT)).replace("\\", "/"), artworkSha256=hashlib.sha256(ART.read_bytes()).hexdigest(),
                    alarmSource="audio/cinematiques-2026-10-25-v3/samples/alarm-dry.wav", effectEvents=effect_log)
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "partition.json").write_text(json.dumps(dict(seconds=10, voices=4, events=events), indent=2) + "\n", encoding="utf-8")
    player = OUT / "Voir-Introduction.html"
    if player.exists():
        layout = json.loads((ART.parent / "layout.json").read_text(encoding="utf-8"))
        html = player.read_text(encoding="utf-8")
        values = {"scenes": timeline, "frames": layout["frames"],
                  "imageUrl": "../../" + manifest["artwork"] + "?v=" + manifest["artworkSha256"][:12]}
        for name, value in values.items():
            html, count = re.subn(r"const " + name + r"=.*?;", lambda m: "const " + name + "=" + json.dumps(value, ensure_ascii=False) + ";", html, count=1)
            assert count == 1, "Missing player source: " + name
        player.write_text(html, encoding="utf-8")
    print(json.dumps(dict(seconds=10, events=len(events), samples=len(used), files=files)), flush=True)


if __name__ == "__main__":
    main()
