"""Audition V2: a brighter, increasingly lively dream; six-second campus exterior.

Uses the V1 original sample tools without rewriting its outputs or the game.
"""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio/cinematiques-2026-10-25-v2"
ART = ROOT / "art/cinematics-2026-10-25-v2/storyboard-v2.png"
VISITOR_ART = ART.parent / "visitor-coat.png"
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("dream_v1", ROOT / "tools/compose-cinematic-dream.py")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
base.SECONDS, base.CUT, base.WAKE = 63.0, 56.0, 57.2
SR, RATE = base.SR, base.RATE


def palette():
    samples = base.bank()
    t = np.arange(round(RATE * 2.5)) / RATE
    hz = base.m.freq(48)
    flute = (np.sin(2 * np.pi * hz * t) + .24 * np.sin(2 * np.pi * hz * 2 * t)
             + .10 * np.sin(2 * np.pi * hz * 3 * t))
    flute *= 1 + .025 * np.sin(2 * np.pi * 4.4 * t)
    flute += np.random.default_rng(2510262).normal(0, .012, len(t))
    flute = base.m.lowpass(flute, 1900)
    edge = 180
    flute[-edge:] = flute[-edge:] * np.linspace(1, 0, edge) + flute[:edge] * np.linspace(0, 1, edge)
    flute -= flute.mean(); flute *= .84 / np.max(np.abs(flute))
    samples["flute"] = {"pcm": np.rint(flute * 127).astype(np.int8), "loop": True}
    t = np.arange(round(RATE * 3)) / RATE
    harp = base.m.pluck(t, hz, 1.5, True) * base.m.envelope(t, .002, 1.7)
    harp = base.m.lowpass(harp, 2800)
    harp[:12] *= np.linspace(0, 1, 12); harp[-100:] *= np.linspace(1, 0, 100)
    harp -= harp.mean(); harp *= .84 / np.max(np.abs(harp))
    samples["harp"] = {"pcm": np.rint(harp * 127).astype(np.int8), "loop": False}
    return samples


def score():
    events = [dict(e) for e in base.score() if e["at"] < 19]

    def note(at, lane, instrument, pitch, duration, gain):
        events.append(dict(at=round(float(at), 5), lane=lane, sample=instrument, pitch=int(pitch), duration=duration, gain=gain))

    # An audible new world at 19 seconds: major harmony, moving bass, singing wind.
    sections = [
        (19, 6, 44, 56, "major6", [60, 63, 68, 72]),
        (25, 7, 37, 49, "major6", [61, 65, 68, 70]),
        (32, 5, 39, 51, "major9", [63, 67, 70, 72]),
        (37, 6, 44, 56, "major6", [60, 63, 68, 72]),
        (43, 4, 37, 49, "major6", [61, 65, 68, 73]),
        (47, 3, 39, 51, "dominant", [62, 67, 70, 72]),
        (50, 6.1, 44, 56, "major6", [60, 63, 68, 72]),
    ]
    for at, duration, root, chord, quality, arp in sections:
        note(at, 2, "strings-" + quality, chord, duration + .05, .27 if at < 37 else .31)
        # Increasingly light-footed movement, rather than the same held drone.
        bass_step = 1.5 if at < 25 else 1.2 if at < 43 else 1.0
        if at >= 50:
            bass_step = 2.1
        for i, offset in enumerate(np.arange(0, duration - .2, bass_step)):
            note(at + offset, 0, "bass", root + [0, 7, 12, 7][i % 4], bass_step * .8, .17)
        if at < 50:
            step = .75 if at < 25 else .6 if at < 37 else .5
            for i, offset in enumerate(np.arange(.18, duration - .2, step)):
                note(at + offset, 3, "harp", arp[i % 4], .85, .17 if i % 3 else .21)
    phrases = [
        (19.25, .62, [68, 70, 72, 75, 77, 75, 72, 70, 68]),
        (25.25, .69, [65, 68, 72, 70, 68, 65, 63, 65, 68]),
        (32.2, .57, [67, 70, 72, 70, 67, 65, 67, 70]),
        (37.2, .62, [72, 70, 68, 75, 72, 70, 68, 67, 68]),
        (43.2, .52, [77, 75, 73, 72, 68, 70, 73]),
        (47.15, .49, [70, 67, 65, 70, 72, 67]),
    ]
    for at, step, pitches in phrases:
        for i, pitch in enumerate(pitches):
            note(at + i * step, 1, "flute", pitch, step * .94, .37 if at < 37 else .41)
    # The AESH scene settles sincerely in the tonic. No ominous return or warning fade.
    for at, pitch, duration in [(50.15, 75, 1.2), (51.55, 72, 1.2), (53, 68, 3.2)]:
        note(at, 1, "flute", pitch, duration, .39)
    note(50, 3, "air-major6", 68, 6.2, .18)
    return sorted(events, key=lambda e: (e["at"], e["lane"]))


def scenes():
    # atlas 0 is original 4x3; atlas 1 is the corrected full-width 2x4 contact sheet.
    rows = [
        ("grading", "Correction nocturne", 5, 0, 2),
        ("fatigue", "Fatigue", 3.5, 0, 3),
        ("doorbell", "La sonnette", 2.5, 0, 4),
        ("visitor", "Le visiteur", 4, 2, 0),
        ("invitation", "L’invitation", 4, 1, 1),
        ("courtyard", "La cour", 7, 1, 3),
        ("corridor", "Le couloir", 5, 0, 7),
        ("preparation", "Préparer les cours", 6, 1, 4),
        ("classroom", "La classe", 7, 1, 5),
        ("aesh", "L’accompagnement AESH", 6, 1, 6),
        ("exterior", "Le campus, vue d’ensemble", 6, 1, 2),
        ("bell", "La cloche", 1.2, 0, 9),
        ("wake", "6h10, encore la nuit", 5.8, 1, 7),
    ]
    start, result = 0, []
    for ident, label, duration, atlas, frame in rows:
        result.append(dict(id=ident, label=label, at=start, end=start + duration, seconds=duration,
                           atlas=atlas, frame=frame, cut=ident in ["bell", "wake"]))
        start += duration
    assert start == base.SECONDS
    return result


def player(timeline):
    old = (ROOT / "audio/cinematiques-2026-10-25/Voir-La-Fin.html").read_text(encoding="utf-8")
    import re
    page = old.replace("Premier essai musical", "Deuxième essai musical et visuel").replace("57 secondes", "63 secondes")
    page = page.replace("Une école possible", "Une école possible · V2")
    page = page.replace('data-time="44"', 'data-time="50"').replace('44 s</button>', '50 s</button>')
    page = page.replace('L’apaisement · 50 s', 'Le panorama · 50 s')
    page = page.replace('data-time="48"', 'data-time="54"').replace('48 s</button>', '54 s</button>')
    page = re.sub(r"const scenes=\[[\s\S]*?\];", "const scenes=" + json.dumps(timeline, ensure_ascii=False) + ";", page, count=1)
    urls = ["../../art/cinematics-2026-10-24/storyboard-atlas.png", "../../art/cinematics-2026-10-25-v2/storyboard-v2.png", "../../art/cinematics-2026-10-25-v2/visitor-coat.png"]
    page = re.sub(r"const urls=\[[^\n]*\];", "const urls=" + json.dumps(urls) + ";", page, count=1)
    page = page.replace("cols=scene.atlas===0?4:3,rows=scene.atlas===0?3:1", "cols=scene.atlas===0?4:2,rows=scene.atlas===0?3:4")
    layout = json.loads((ART.parent / "layout.json").read_text(encoding="utf-8"))
    page = page.replace("let ready=false", "const atlasFrames=" + json.dumps(layout["frames"]) + ";\nconst atlasFocus=" + json.dumps(layout["focusY"]) + ";\nlet ready=false")
    page = page.replace("const x=Math.round", "let x=Math.round").replace("const w=Math.round", "let w=Math.round")
    page = page.replace("const scale=Math.min(212/w,158/h);", "if(scene.atlas===1){[x,y,w,h]=atlasFrames[scene.frame]}\n  if(scene.atlas===2){x=4;y=4;w=img.width-8;h=img.height-8}\n  const scale=Math.max(212/w,158/h);")
    page = page.replace("ctx.drawImage(img,x,y,w,h,160-w*scale/2,112-h*scale/2,w*scale,h*scale);ctx.globalAlpha=1;", "const focusY=scene.atlas===1?atlasFocus[scene.frame]:.5;ctx.save();ctx.beginPath();ctx.rect(54,33,212,158);ctx.clip();ctx.drawImage(img,x,y,w,h,160-w*scale/2,33-(h*scale-158)*focusY,w*scale,h*scale);ctx.restore();ctx.globalAlpha=1;")
    page = page.replace(" / 57.0 s", " / 63.0 s")
    page = page.replace("../../docs/cinematiques/MONTAGE.md", "MONTAGE-V2.md")
    page = page.replace("Piano mat, basse douce, cordes et nappe légère, avec samples PCM 8 bits.", "Piano fatigué, puis flûte chantante, harpe et basse mobile : un rêve progressivement plus enjoué, en samples PCM 8 bits.")
    (OUT / "Voir-La-Fin-V2.html").write_text(page, encoding="utf-8")
    def tc(seconds):
        return f"{int(seconds // 60):02}:{seconds % 60:06.3f}"
    rows = ["# Montage V2 — 63 secondes", "", "Lecture isolée de la maquette V2, sans modification du montage du jeu.", "", "| Début | Fin | Image |", "| --- | --- | --- |"]
    rows += [f"| {tc(s['at'])} | {tc(s['end'])} | {s['label']} |" for s in timeline]
    rows += ["", "Musique coupée à 56 s ; alarme à 57,2 s. Les trois WAV et les images suivent cette même chronologie."]
    (OUT / "MONTAGE-V2.md").write_text("\n".join(rows) + "\n", encoding="utf-8")


def main():
    assert ART.exists(), "Generate and review the corrected 2x4 atlas first"
    assert VISITOR_ART.exists(), "Generate and review the isolated coat continuity correction first"
    OUT.mkdir(parents=True, exist_ok=True); (OUT / "samples").mkdir(exist_ok=True)
    samples, events, timeline = palette(), score(), scenes()
    music = base.render(samples, events)
    # Make the separation perceptible without trying to achieve it only by level.
    time = np.arange(len(music)) / SR
    curve = np.interp(time, [0, 8.5, 11, 19, 25, 37, 50, 56, 63], [.76, .76, .80, 1.02, 1.10, 1.16, 1.20, 1.20, 1.20])
    music *= curve[:, None]
    effects = base.cues(); mix = music + effects
    assert np.isfinite(mix).all() and np.max(np.abs(mix)) < .95
    files = []
    for name, data in [("Fin-Musique.wav", music), ("Fin-Reperes.wav", effects), ("Fin-Montage.wav", mix)]:
        base.write_wav(OUT / name, data)
        files.append(dict(file=name, sha256=hashlib.sha256((OUT / name).read_bytes()).hexdigest(),
                          peakDbFS=round(float(20 * np.log10(np.max(np.abs(data)))), 2)))
    used = sorted({e["sample"] for e in events})
    for name in used:
        base.write_wav(OUT / "samples" / (name + ".wav"), samples[name]["pcm"].astype(float) / 127, RATE, 8)
    manifest = dict(status="audition-v2-not-integrated", seconds=base.SECONDS, musicCut=base.CUT,
                    alarmStarts=base.WAKE, sourceBits=8, sampleRate=SR, voices=4, usedSamples=used,
                    timeline=timeline, files=files, artwork=str(ART.relative_to(ROOT)).replace("\\", "/"),
                    artworkSha256=hashlib.sha256(ART.read_bytes()).hexdigest(),
                    visitorArtwork=str(VISITOR_ART.relative_to(ROOT)).replace("\\", "/"),
                    visitorArtworkSha256=hashlib.sha256(VISITOR_ART.read_bytes()).hexdigest())
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "partition.json").write_text(json.dumps(dict(seconds=63, voices=4, events=events), indent=2) + "\n", encoding="utf-8")
    player(timeline)
    print(json.dumps(dict(seconds=63, events=len(events), samples=len(used), files=files)), flush=True)


if __name__ == "__main__":
    main()
