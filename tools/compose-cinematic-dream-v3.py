"""69-second audition: illustrated car journey, heavier office, harder awakening.

Original 8-bit samples; reuse V1/V2 tools, preserve their artifacts and the game.
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
OUT = ROOT / "audio/cinematiques-2026-10-25-v3"
ART = ROOT / "art/cinematics-2026-10-25-v3/car-ride.png"
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("dream_v2", ROOT / "tools/compose-cinematic-dream-v2.py")
v2 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v2)
V2_TIMELINE = v2.scenes()
base = v2.base
base.SECONDS, base.CUT, base.WAKE = 69.0, 62.0, 63.2
SR, RATE = base.SR, base.RATE


def palette():
    samples = v2.palette()
    t = np.arange(round(RATE * 2.5)) / RATE
    f = base.m.freq(48)
    pedal = np.sin(2 * np.pi * f * t) + .48 * np.sin(2 * np.pi * f * .5 * t)
    for h in range(2, 9):
        pedal += .27 * np.sin(2 * np.pi * f * h * t) / h ** 1.7
    pedal *= 1 + .035 * np.sin(2 * np.pi * .8 * t)
    pedal = base.m.lowpass(pedal, 850); pedal -= pedal.mean()
    edge = 180
    pedal[-edge:] = pedal[-edge:] * np.linspace(1, 0, edge) + pedal[:edge] * np.linspace(0, 1, edge)
    pedal *= .84 / np.max(np.abs(pedal))
    samples["office-pedal"] = {"pcm": np.rint(pedal * 127).astype(np.int8), "loop": True}
    return samples


def score():
    events = []
    for original in v2.score():
        e = dict(original)
        if e["at"] >= 19:
            e["at"] += 6
        elif e["at"] < 8.5:
            if e["lane"] == 0:
                e.update(sample="office-pedal", gain=.27)
            elif e["lane"] == 1:
                e["pitch"] -= 12
                e["gain"] *= 1.08
            elif e["lane"] == 2:
                e["pitch"] -= 12
                e["gain"] *= 1.65
        events.append(e)

    def note(at, lane, sample, pitch, duration, gain):
        events.append(dict(at=at, lane=lane, sample=sample, pitch=pitch, duration=duration, gain=gain))

    for at in [.3, 1.55, 2.8, 4.05, 5.3, 6.55, 7.8]:
        note(at, 3, "piano", 41, .34, .18)
    # Six-second bridge: dawn, a clean car, the guide's warmth and a tired passenger.
    note(19, 0, "bass", 39, 2.8, .14); note(22, 0, "bass", 46, 2.9, .12)
    note(19, 2, "strings-major6", 51, 6.05, .19)
    for at, pitch in [(19.4, 63), (20.4, 65), (21.4, 67), (22.6, 70), (23.8, 68)]:
        note(at, 1, "piano", pitch, .95, .31)
    for i, pitch in enumerate([63, 67, 70, 72]):
        note(19.25 + i * 1.35, 3, "harp", pitch, 1.3, .14)
    # Hold the final sustained voices beyond the bell: their release envelopes
    # must never warn the listener that the dream is about to be cut off.
    for e in events:
        if e["at"] >= 56 and e["duration"] >= 3:
            e["duration"] = max(e["duration"], base.CUT - e["at"] + .6)
    return sorted(events, key=lambda e: (e["at"], e["lane"]))


def scenes():
    rows = []
    for old in V2_TIMELINE:
        e = dict(old)
        if e["at"] >= 19:
            e["at"] += 6; e["end"] += 6
        rows.append(e)
    rows.insert(5, dict(id="car-ride", label="Le trajet au lever du jour", at=19, end=25,
                        seconds=6, atlas=3, frame=0, cut=False))
    assert rows[-3]["id"] == "exterior" and rows[-3]["at"] == 56
    assert rows[-2]["at"] == 62 and rows[-1]["at"] == 63.2 and rows[-1]["end"] == 69
    return rows


def read_sfx(name):
    with wave.open(str(ROOT / "audio/sfx-2026-10-24" / name), "rb") as inp:
        rate, width, channels = inp.getframerate(), inp.getsampwidth(), inp.getnchannels()
        data = inp.readframes(inp.getnframes())
        sample = (np.frombuffer(data, np.uint8).astype(float) - 128) / 128 if width == 1 else np.frombuffer(data, "<i2").astype(float) / 32768
        sample = sample.reshape(-1, channels).mean(axis=1)
    return np.interp(np.arange(round(len(sample) * SR / rate)) * rate / SR, np.arange(len(sample)), sample)


def cues():
    fx = base.cues()
    start = round(base.WAKE * SR)
    fx[start:] = 0
    source_rate = 11025
    t = np.arange(round(.09 * source_rate)) / source_rate
    alarm = (.20 * np.sin(2 * np.pi * 880 * t) + .055 * np.sin(2 * np.pi * 1760 * t)
             + .025 * np.sin(2 * np.pi * 2640 * t))
    edge = round(.002 * source_rate)
    alarm[:edge] *= np.linspace(0, 1, edge); alarm[-edge:] *= np.linspace(1, 0, edge)
    pcm = np.rint(alarm * 127).astype(np.int8)
    alarm = np.interp(np.arange(round(len(pcm) * SR / source_rate)) * source_rate / SR,
                      np.arange(len(pcm)), pcm.astype(float) / 128)

    def place(at, sample, gain=1):
        s = round(at * SR); length = min(len(sample), len(fx) - s)
        fx[s:s + length] += sample[:length, None] * gain

    for at in np.arange(base.WAKE, base.SECONDS - .1, 1.6):
        for delay in [0, .16, .32]:
            if at + delay + .09 <= base.SECONDS:
                place(at + delay, alarm)
    paper, chair = read_sfx("paper-1.wav"), read_sfx("chair-1.wav")
    place(.35, paper, .045); place(5.4, paper, .035)
    place(base.WAKE + .025, chair, .18); place(base.WAKE + .16, paper, .15)
    noise = np.random.default_rng(2510263).normal(0, .0011, (len(fx) - start, 1))
    fx[start:] += noise
    fx[-100:] *= np.linspace(1, 0, 100)[:, None]
    return fx, pcm, source_rate


def player(timeline):
    page = (ROOT / "audio/cinematiques-2026-10-25-v2/Voir-La-Fin-V2.html").read_text(encoding="utf-8")
    page = page.replace("Deuxième essai musical et visuel", "Troisième essai musical et visuel")
    page = page.replace("· V2", "· V3").replace("63 secondes", "69 secondes").replace(" / 63.0 s", " / 69.0 s")
    page = page.replace("MONTAGE-V2.md", "MONTAGE-V3.md")
    page = page.replace("Le campus · 19 s", "Le trajet · 19 s")
    page = page.replace('data-time="50"', 'data-time="56"').replace("Le panorama · 50 s", "Le panorama · 56 s")
    page = page.replace('data-time="54"', 'data-time="60"').replace("La rupture · 54 s", "La rupture · 60 s")
    page = re.sub(r"const scenes=\[[\s\S]*?\];", "const scenes=" + json.dumps(timeline, ensure_ascii=False) + ";", page, count=1)
    urls = ["../../art/cinematics-2026-10-24/storyboard-atlas.png", "../../art/cinematics-2026-10-25-v2/storyboard-v2.png",
            "../../art/cinematics-2026-10-25-v2/visitor-coat.png",
            "../../art/cinematics-2026-10-25-v3/car-ride.png?v=" + hashlib.sha256(ART.read_bytes()).hexdigest()[:12]]
    page = re.sub(r"const urls=\[[^\n]*\];", "const urls=" + json.dumps(urls) + ";", page, count=1)
    page = page.replace("if(scene.atlas===2)", "if(scene.atlas>=2)")
    page = page.replace("Piano fatigué, puis flûte chantante, harpe et basse mobile : un rêve progressivement plus enjoué, en samples PCM 8 bits.",
                        "Bureau plus pesant, transition en voiture au lever du jour, rêve lumineux puis retour sec au fauteuil, aux papiers et à l’alarme. Samples PCM 8 bits.")
    (OUT / "Voir-La-Fin-V3.html").write_text(page, encoding="utf-8")
    def tc(t):
        return f"{int(t // 60):02}:{t % 60:06.3f}"
    rows = ["# Montage V3 — 69 secondes", "", "Maquette d’écoute isolée ; le jeu reste inchangé.", "", "| Début | Fin | Image |", "| --- | --- | --- |"]
    rows += [f"| {tc(e['at'])} | {tc(e['end'])} | {e['label']} |" for e in timeline]
    rows += ["", "Musique et réverbération coupées à 62 s. Alarme, fauteuil et papiers à partir de 63,2 s."]
    (OUT / "MONTAGE-V3.md").write_text("\n".join(rows) + "\n", encoding="utf-8")


def main():
    assert ART.exists(), "Generate and review the two front-seat characters and driver position first"
    OUT.mkdir(parents=True, exist_ok=True); (OUT / "samples").mkdir(exist_ok=True)
    samples, events, timeline = palette(), score(), scenes()
    music = base.render(samples, events)
    time = np.arange(len(music)) / SR
    curve = np.interp(time, [0, 8.5, 11, 19, 25, 31, 43, 56, 62, 69], [1.02, 1.02, .80, .90, 1.02, 1.10, 1.16, 1.20, 1.20, 1.20])
    music *= curve[:, None]
    mid, side = music.mean(axis=1), (music[:, 0] - music[:, 1]) * .5
    width = np.interp(time, [0, 8.5, 11, 19, 25, 43, 62, 69], [.28, .28, .4, .65, 1, 1.15, 1.2, 1.2])
    music = np.column_stack([mid + side * width, mid - side * width])
    effects, alarm, alarm_rate = cues(); mix = music + effects
    assert np.isfinite(mix).all() and np.max(np.abs(mix)) < .95
    files = []
    for name, data in [("Fin-Musique.wav", music), ("Fin-Reperes.wav", effects), ("Fin-Montage.wav", mix)]:
        base.write_wav(OUT / name, data)
        files.append(dict(file=name, sha256=hashlib.sha256((OUT / name).read_bytes()).hexdigest(),
                          peakDbFS=round(float(20 * np.log10(np.max(np.abs(data)))), 2)))
    used = sorted({e["sample"] for e in events})
    for name in used:
        base.write_wav(OUT / "samples" / (name + ".wav"), samples[name]["pcm"].astype(float) / 127, RATE, 8)
    base.write_wav(OUT / "samples/alarm-dry.wav", alarm.astype(float) / 127, alarm_rate, 8)
    manifest = dict(status="audition-v3-not-integrated", seconds=69, musicCut=62, alarmStarts=63.2,
                    sourceBits=8, sampleRate=SR, voices=4, usedSamples=used, timeline=timeline, files=files,
                    carArtwork=str(ART.relative_to(ROOT)).replace("\\", "/"), carArtworkSha256=hashlib.sha256(ART.read_bytes()).hexdigest(),
                    effectEvents=[dict(id="doorbell", at=8.5), dict(id="bell", at=62), dict(id="alarm", at=63.2),
                                  dict(id="chair", at=63.225), dict(id="paper", at=63.36)],
                    cueSources=["audio/sfx-2026-10-24/bell-start-1.wav", "audio/sfx-2026-10-24/paper-1.wav", "audio/sfx-2026-10-24/chair-1.wav"])
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "partition.json").write_text(json.dumps(dict(seconds=69, voices=4, events=events), indent=2) + "\n", encoding="utf-8")
    player(timeline)
    print(json.dumps(dict(seconds=69, musicCut=62, alarm=63.2, events=len(events), samples=len(used), files=files)), flush=True)


if __name__ == "__main__":
    main()
