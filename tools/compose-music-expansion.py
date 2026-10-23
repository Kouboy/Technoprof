"""Seven original four-channel tracker sketches; generated PCM 8-bit samples.

Audition only: does not modify the game or any previously accepted audio file.
Requires NumPy; no recording, downloaded samples or external generation API.
"""
from pathlib import Path
import hashlib
import html
import importlib.util
import json
import sys
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio/complements-2026-10-23"
sys.dont_write_bytecode = True
module = importlib.util.spec_from_file_location("maquettes", ROOT / "tools/compose-maquettes.py")
m = importlib.util.module_from_spec(module)
module.loader.exec_module(m)
RNG = np.random.default_rng(23102677)
TRACKS = [
    {"id": "inspectrice", "file": "06-boss-inspectrice", "title": "Evaluation froide", "label": "Inspectrice — Évaluation froide", "bpm": 124, "bars": 16, "loop": True, "description": "Ostinato sec, notes pincées et ponctuations métalliques. Une mécanique administrative qui ne lâche pas."},
    {"id": "parent", "file": "07-boss-parent", "title": "Poids du reseau", "label": "Parent influent — Le poids du réseau", "bpm": 132, "bars": 16, "loop": True, "description": "Cuivres bas, accords coupés et basse insistante. Une autorité sociale pesante, avec des phrases qui laissent respirer les attaques."},
    {"id": "securite", "file": "08-boss-securite", "title": "Acces refuse", "label": "Responsable sécurité — Accès refusé", "bpm": 144, "bars": 16, "loop": True, "description": "Basse saturée, guitare étouffée et coups métalliques. Le dernier affrontement gagne en densité sans masquer tous les silences."},
    {"id": "infirmerie", "file": "09-infirmerie", "title": "Asseyez vous", "label": "Infirmerie — Asseyez-vous un instant", "bpm": 72, "bars": 16, "loop": True, "description": "Piano électrique feutré, accords suspendus et souffle de cordes. Une présence humaine calme, sans batterie ni gag sonore."},
    {"id": "bossa", "file": "10-autoradio-midi", "title": "Pause reglementaire", "label": "Autoradio 2 — Pause réglementaire", "bpm": 108, "bars": 16, "loop": True, "description": "Bossa nova électro instrumentale : guitare nylon syncopée, basse ronde, rimshot et petites réponses de piano électrique. Son de poste radio."},
    {"id": "fusion", "file": "11-autoradio-soir", "title": "Derniere correspond", "label": "Autoradio 3 — Dernière correspondance", "bpm": 120, "bars": 16, "loop": True, "description": "Jazz fusion instrumental : basse claquante, accords de piano électrique et phrases de cuivre synthétique, avec une batterie sèche. Son de poste radio au crépuscule."},
    {"id": "gameover", "file": "12-gameover", "title": "Service interrompu", "label": "Game Over — Service interrompu", "bpm": 80, "bars": 4, "loop": False, "description": "Douze secondes de retombée : notes descendantes, grave qui s'affaisse et accord sans consolation. Une seule lecture, puis le silence."},
]


def bank():
    base, base_ids = m.bank()
    samples, ids = m.title_bank(base, base_ids)

    def add(name, signal, volume=32):
        signal = signal - np.mean(signal)
        signal *= .88 / max(.01, np.max(np.abs(signal)))
        signal[:10] *= np.linspace(0, 1, 10)
        signal[-60:] *= np.linspace(1, 0, 60)
        pcm = np.rint(np.clip(signal, -1, 1) * 127).astype(np.int8)
        if len(pcm) % 2:
            pcm = np.r_[pcm, np.int8(0)]
        assert len(pcm) <= 65534
        samples.append({"name": name, "pcm": pcm, "volume": volume})
        return len(samples)

    t = np.arange(round(3 * m.BASE_RATE)) / m.BASE_RATE
    f = m.freq(m.ROOT_NOTE)

    def ep(intervals):
        result = np.zeros_like(t)
        for i, interval in enumerate(intervals):
            hz = m.freq(m.ROOT_NOTE + interval)
            body = np.sin(2 * np.pi * hz * t) * np.exp(-t * 1.0)
            tine = .19 * np.sin(2 * np.pi * 2.002 * hz * t + 1.3 * np.exp(-t * 10)) * np.exp(-t * 4.5)
            result += (body + tine) * (1 + .035 * np.sin(2 * np.pi * 4.7 * t + i))
        return m.lowpass(result, 2600) * m.envelope(t, .004, 2.6)

    def nylon(intervals):
        result = np.zeros_like(t)
        for i, interval in enumerate(intervals):
            delay = i * .009
            local = np.maximum(0, t - delay)
            hz = m.freq(m.ROOT_NOTE + interval)
            voice = m.pluck(local, hz, .9, True)
            voice += .1 * np.sin(2 * np.pi * hz * 2 * local) * np.exp(-local * 12)
            result += voice * (t >= delay)
        return m.lowpass(result, 2600) * m.envelope(t, .002, 1.4)

    for name, intervals in [("ep", (0,)), ("epm9", (0, 3, 7, 10, 14)), ("epmaj7", (0, 4, 7, 11)), ("epdom9", (0, 4, 10, 14)), ("epsus", (0, 5, 7, 10))]:
        ids[name] = add("KEY " + name, ep(intervals))
    for name, intervals in [("nylm7", (0, 3, 7, 10)), ("nylmaj7", (0, 4, 7, 11)), ("nyldom9", (0, 4, 10, 14))]:
        ids[name] = add("NYL " + name, nylon(intervals))
    slap = m.pluck(t, f, 1.15)
    slap += .15 * RNG.normal(0, 1, len(t)) * np.exp(-t * 130)
    ids["slap"] = add("BASS thumb fret", m.lowpass(np.tanh(slap * 1.8), 2700) * m.envelope(t, .001, 1.0), 42)
    reed = sum(np.sin(2 * np.pi * f * h * t + .014 * np.sin(2 * np.pi * 5.2 * t) * h) / h ** 1.35 for h in range(1, 12))
    reed += .028 * RNG.normal(0, 1, len(t))
    ids["reed"] = add("REED sampled breath", m.lowpass(reed, 2300) * m.envelope(t, .025, 1.25), 30)
    soft = ep((0, 7, 14)) + .25 * np.sin(2 * np.pi * f * 1.002 * t) * np.exp(-t * .5)
    ids["soft"] = add("PAD quiet room", m.lowpass(soft, 1400) * m.envelope(t, .14, 3.0), 24)
    distorted = np.tanh((np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2 * t)) * 2.8)
    ids["grit"] = add("LOW worn drive", m.lowpass(distorted, 1300) * m.envelope(t, .002, 1.0), 44)

    td = np.arange(round(.35 * m.BASE_RATE)) / m.BASE_RATE
    noise = RNG.normal(0, 1, len(td))
    rim = .65 * np.sin(2 * np.pi * 1680 * td) * np.exp(-td * 95) + .2 * noise * np.exp(-td * 130)
    ids["rim"] = add("KIT dry rim", rim * m.envelope(td, .001, .12), 34)
    clave = np.sin(2 * np.pi * 2220 * td) * np.exp(-td * 120) + .25 * np.sin(2 * np.pi * 3050 * td) * np.exp(-td * 100)
    ids["clave"] = add("KIT clave wood", clave * m.envelope(td, .001, .1), 26)
    stamp = m.lowpass(noise, 2500) * np.exp(-td * 28) + .35 * np.sin(2 * np.pi * 122 * td) * np.exp(-td * 35)
    ids["stamp"] = add("KIT desk stamp", stamp * m.envelope(td, .001, .25), 38)
    return samples, ids


def score(track, ids):
    key, bars = track["id"], track["bars"]
    cells = [[[0, 0, 0, 0, 0] for _ in range(4)] for _ in range(bars * 16)]

    def note(bar, row, lane, instrument, pitch=48, volume=32, length=None):
        assert 0 <= bar < bars and 0 <= row < 16
        m.period(pitch)
        cells[bar * 16 + row][lane] = [ids[instrument], pitch, volume, 0xC, volume]
        if length is not None and bar * 16 + row + length < len(cells):
            cells[bar * 16 + row + length][lane] = [0, 0, 0, 0xC, 0]

    for bar in range(bars):
        phrase = bar % 4
        strong = bar >= 8
        if key == "inspectrice":
            root = [41, 41, 42, 40][phrase]
            for row in [0, 3, 6, 8, 11, 14]:
                note(bar, row, 0, "bass", root if row != 14 else root + 7, 42)
            motif = [(0, 53), (3, 52), (8, 53), (11, 48)] if phrase % 2 == 0 else [(2, 53), (6, 54), (10, 52), (14, 48)]
            for row, pitch in motif:
                note(bar, row, 1, "pluck", pitch, 27 + 2 * strong, 2)
            if phrase in [0, 2]:
                note(bar, 0, 2, "dread", root + 12, 22)
                note(bar, 10, 2, "lowhorn", root + 11, 23, 4)
            for row in range(0, 16, 2):
                inst = "weightkick" if row in [0, 8] else "stamp" if row in [4, 12] else "hat"
                note(bar, row, 3, inst, volume=42 if inst == "weightkick" else 33 if inst == "stamp" else 12)
        elif key == "parent":
            root = [38, 38, 39, 37][phrase]
            for row in [0, 3, 6, 10, 14]:
                note(bar, row, 0, "weight", root + (7 if row == 10 else 0), 44)
            for row, interval in [(0, 12), (6, 11), (10, 7)]:
                note(bar, row, 1, "lowhorn", root + interval, 33, 3)
            note(bar, 2, 2, "gminor", root + 12, 22, 3)
            note(bar, 11, 2, "gminor", root + 12, 19, 3)
            for row in range(0, 16, 2):
                inst = "weightkick" if row in [0, 6, 10] else "snarehat" if row in [4, 12] else "hat"
                note(bar, row, 3, inst, volume=41 if inst == "weightkick" else 33 if inst == "snarehat" else 12)
        elif key == "securite":
            root = [40, 40, 41, 38][phrase]
            for row in [0, 2, 5, 8, 10, 14]:
                note(bar, row, 0, "grit", root, 43, 2)
            for row in [0, 5, 8, 14]:
                note(bar, row, 1, "power", root, 27, 2)
            for row, interval in ([(0, 12), (10, 13)] if phrase % 2 == 0 else [(4, 7), (12, 11)]):
                note(bar, row, 2, "lowhorn", root + interval, 28, 3)
            for row in range(0, 16, 2):
                inst = "weightkick" if row in [0, 6, 8, 14] else "iron" if row in [4, 12] else "hat"
                note(bar, row, 3, inst, volume=43 if inst == "weightkick" else 35 if inst == "iron" else 13)
            if strong and phrase == 3:
                note(bar, 13, 3, "tom", 47, 31)
                note(bar, 15, 3, "tom", 44, 34)
        elif key == "infirmerie":
            root, chord = [(41, "epm9"), (37, "epmaj7"), (44, "epmaj7"), (39, "epsus")][phrase]
            note(bar, 0, 0, "bass", root, 22)
            note(bar, 0, 2, chord, root + 12, 26)
            if phrase % 2 == 0:
                note(bar, 0, 3, "soft", root + 12, 17)
            melody = [[(4, 60), (11, 56)], [(7, 58)], [(3, 60), (10, 63)], [(5, 58), (12, 55)]][phrase]
            for row, pitch in melody:
                note(bar, row, 1, "ep", pitch, 25 if strong else 22)
        elif key == "bossa":
            # Minor-seven / dominant-nine / major-seven movement, two-bar bossa accents.
            root, chord = [(45, "nylm7"), (50, "nyldom9"), (43, "nylmaj7"), (48, "nylmaj7"),
                           (42, "nylm7"), (47, "nyldom9"), (40, "nylm7"), (40, "nylm7")][bar % 8]
            for row, interval in [(0, 0), (6, 7), (8, 0), (14, 7)]:
                note(bar, row, 0, "bass", root + interval, 37 if row in [0, 8] else 30)
            for row in ([0, 3, 6, 10, 13] if bar % 2 == 0 else [2, 5, 8, 11, 14]):
                note(bar, row, 2, chord, root + 12, 25 if row in [0, 8] else 21, 2)
            response = [[(7, 64), (11, 67), (14, 66)], [(3, 64), (10, 62)], [(6, 62), (12, 59)], [(4, 60), (11, 59)]][phrase]
            if bar % 8 >= 2:
                for row, pitch in response:
                    note(bar, row, 1, "ep", pitch, 22, 2)
            for row in range(0, 16, 2):
                inst = "kick" if row in [0, 8] else "rim" if row in [4, 10, 14] else "hat"
                note(bar, row, 3, inst, volume=31 if inst == "kick" else 25 if inst == "rim" else 10)
            if bar % 2:
                note(bar, 7, 3, "clave", volume=18)
        elif key == "fusion":
            root, chord = [(40, "epm9"), (45, "epdom9"), (38, "epm9"), (43, "epdom9"),
                           (36, "epmaj7"), (42, "epsus"), (47, "epsus"), (47, "epdom9")][bar % 8]
            for row, interval in [(0, 0), (3, 12), (6, 7), (8, 0), (11, 10), (14, 7)]:
                note(bar, row, 0, "slap", root + interval, 40 if row in [0, 8] else 34, 2)
            for row in [1, 6, 10, 14]:
                note(bar, row, 2, chord, root + 12, 26 if row in [1, 10] else 22, 2)
            motifs = [[(2, 64), (5, 67), (9, 66), (12, 62)], [(3, 61), (7, 64), (13, 67)],
                      [(1, 65), (4, 64), (10, 62), (14, 60)], [(3, 62), (7, 64), (11, 59)]]
            for row, pitch in motifs[phrase]:
                note(bar, row, 1, "reed" if bar % 8 < 4 else "ep", pitch, 25, 2)
            for row in range(0, 16, 2):
                inst = "kickhat" if row in [0, 6, 8, 14] else "snarehat" if row in [4, 12] else "hat"
                note(bar, row, 3, inst, volume=38 if inst != "hat" else 13)
            if phrase == 3:
                note(bar, 13, 3, "snarehat", volume=18)
                note(bar, 15, 3, "tom", 47, 26)
        else:
            if bar == 0:
                note(bar, 0, 0, "weight", 41, 43)
                note(bar, 0, 3, "iron", 43, 29)
                note(bar, 0, 2, "epm9", 53, 28)
                note(bar, 4, 1, "lowhorn", 53, 29)
                note(bar, 12, 1, "lowhorn", 52, 25)
            elif bar == 1:
                note(bar, 0, 0, "weight", 40, 34)
                note(bar, 4, 1, "lowhorn", 48, 24)
                note(bar, 0, 2, "dread", 52, 22)
            elif bar == 2:
                note(bar, 0, 0, "weight", 36, 28)
                note(bar, 0, 1, "lowhorn", 47, 20)
                note(bar, 0, 2, "epsus", 48, 20)
            elif bar == 3:
                note(bar, 0, 0, "weight", 36, 16)
                note(bar, 0, 2, "soft", 48, 15)
                for lane in range(4):
                    cells[bar * 16 + 14][lane] = [0, 0, 0, 0xC, 0]
    cells[0][2][3:] = [0xF, 6]
    cells[0][3][3:] = [0xF, track["bpm"]]
    return cells


def prune(cells, samples):
    used = sorted({c[0] for row in cells for c in row if c[0]})
    remap = {old: new for new, old in enumerate(used, 1)}
    for row in cells:
        for cell in row:
            if cell[0]:
                cell[0] = remap[cell[0]]
    result = [dict(samples[old - 1]) for old in used]
    # Fxx occupies the first row's effect slots; retain those voices' intended
    # gain through their sample defaults, in both the WAV and the real MOD.
    for cell in cells[0]:
        if cell[0] and cell[3] == 0xF:
            result[cell[0] - 1]["volume"] = cell[2]
    assert 0 < len(result) <= 31
    return result


def render(track, cells, samples):
    mix = m.render(cells, samples, track["bpm"], "radio" if track["id"] in ["bossa", "fusion"] else "titre")
    if track["id"] == "infirmerie":
        mix *= 10 ** (-5 / 20)
    if not track["loop"]:
        # Remove cyclic early-reflection spill before the one-shot's first attack.
        edge = round(.008 * m.SR)
        mix[:edge] *= np.linspace(0, 1, edge)[:, None]
        tail = round(2.2 * m.SR)
        mix[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 1.6
        mix[-64:] = 0
    return mix


def write_player(manifest):
    cards = []
    for track in manifest["tracks"]:
        loop = "loop" if track["loop"] else ""
        cards.append(f'''<article><h2>{html.escape(track['label'])}</h2><p class="meta">{track['bpm']} BPM · {track['seconds']:.1f} s · {'boucle' if track['loop'] else 'lecture unique'}</p><p>{html.escape(track['description'])}</p><audio controls {loop} preload="metadata" src="{track['wav']}"></audio><p><a download href="{track['wav']}">WAV</a><a download href="{track['module']}">MOD éditable</a></p></article>''')
    (OUT / "Ecouter-Complements-Technoprof.html").write_text('''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TECHNOPROF — Compléments musicaux</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{background:#10171c;color:#ded3b8;font:16px/1.6 system-ui,sans-serif;margin:0}main{max-width:890px;margin:auto;padding:30px 20px 55px}h1,h2,a{color:#e6b16b}h2{font-size:21px;margin:0}.meta{font:14px monospace;color:#aebbb9}article{margin:22px 0;padding:23px;background:#1b282e;border:1px solid #516067;border-left:4px solid #687c7d}article.playing{border-left-color:#edb86f}audio{width:100%}a{margin-right:22px}button{padding:13px 20px;background:#2c3c40;color:inherit;border:1px solid #8b8b7e;font:inherit;cursor:pointer}a:focus-visible,button:focus-visible{outline:3px solid #edb86f;outline-offset:4px}small{color:#aebbb9}@media(max-width:500px){main{padding:20px 12px}article{padding:17px}}</style><main><h1>TECHNOPROF — Sept nouvelles maquettes</h1><p>Trois boss, une respiration à l’infirmerie, deux nouvelles stations d’autoradio et une fin de service. Compositions instrumentales, quatre pistes de tracker et samples PCM 8 bits.</p><p>Ces maquettes sont proposées à l’écoute avant intégration au jeu. Un seul morceau joue à la fois. Les six thèmes bouclent ; le Game Over se termine une fois.</p><button id="stop">Tout arrêter</button>''' + "".join(cards) + '''<p><a href="../titre-reference-2026-10-23/Ecouter-Titre-Interpretation.html">Titre validé</a><a href="../maquettes-2026-10-23/Ecouter-Technoprof.html">Premières maquettes</a></p><p><small>Samples synthétisés localement puis quantifiés en 8 bits, sans enregistrement instrumental externe. Le mix WAV conserve une stéréo plus resserrée que le MOD brut.</small></p><script>const players=[...document.querySelectorAll('audio')];for(const a of players){a.onplay=()=>{for(const b of players)if(a!==b)b.pause();for(const b of players)b.closest('article').classList.toggle('playing',a===b)};a.onpause=()=>a.closest('article').classList.remove('playing');a.onended=()=>a.closest('article').classList.remove('playing')}document.querySelector('#stop').onclick=()=>{for(const a of players){a.pause();a.currentTime=0}};</script></main></html>''', encoding="utf-8")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    samples, ids = bank()
    manifest = {"version": "complements-1", "sampleRate": m.SR, "sourceBits": 8, "channels": 4, "tracks": []}
    for track in TRACKS:
        cells = score(track, ids)
        chosen = prune(cells, samples)
        mod = OUT / (track["file"] + ".mod")
        m.write_mod(mod, track["title"], cells, chosen)
        mix = render(track, cells, chosen)
        pcm = np.rint(mix * 32767).astype("<i2")
        wav = OUT / (track["file"] + ".wav")
        with wave.open(str(wav), "wb") as out:
            out.setnchannels(2); out.setsampwidth(2); out.setframerate(m.SR); out.writeframes(pcm.tobytes())
        entry = {**track, "wav": wav.name, "module": mod.name, "seconds": round(len(mix) / m.SR, 5), "samples": len(chosen),
                 "peakDbFS": round(float(20 * np.log10(np.max(np.abs(mix)))), 3), "rmsDbFS": round(float(20 * np.log10(np.sqrt(np.mean(mix ** 2)))) , 3),
                 "wavSha256": hashlib.sha256(wav.read_bytes()).hexdigest()}
        manifest["tracks"].append(entry)
        score_data = {"bpm": track["bpm"], "bars": track["bars"], "rowsPerBeat": 4, "loop": track["loop"], "channels": ["basse", "motif", "harmonie", "rythme/texture"], "cells": cells}
        (OUT / (track["file"] + ".score.json")).write_text(json.dumps(score_data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        print(f"{wav.name}: {entry['seconds']:.2f}s / {len(chosen)} samples / {entry['peakDbFS']} dBFS", flush=True)
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_player(manifest)


if __name__ == "__main__":
    main()
