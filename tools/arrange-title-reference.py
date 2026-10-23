"""Short four-channel Amiga-style arrangement of a supplied composition.

Melodic/harmonic phrase samples come from the supplied mix; bass and kit are
rebuilt with generated 8-bit samples. This is not note-for-note transcription.
No game assets, previous auditions or the source file are overwritten.
"""
import argparse
import hashlib
import html
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("maquettes", ROOT / "tools/compose-maquettes.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
BPM, BARS = 80, 20
SECTIONS = [
    {"id": "A0", "bar": 0, "bars": 2, "source": 0, "role": "Menace initiale, entrée abrégée"},
    {"id": "B1", "bar": 2, "bars": 4, "source": 24, "role": "Installation de la pulsation"},
    {"id": "C2", "bar": 6, "bars": 4, "source": 48, "role": "Première exposition du thème"},
    {"id": "D3", "bar": 10, "bars": 2, "source": 96, "role": "Respiration, basse et percussion allégées"},
    {"id": "C4", "bar": 12, "bars": 4, "source": 144, "role": "Retour du thème, batterie plus présente"},
    {"id": "E5", "bar": 16, "bars": 4, "source": 168, "role": "Retombée et raccord vers A ; phrase de six secondes reprise"},
]


def harmonic_bands(x, sr):
    """Soft median masks reduce attacks; these are spectral bands, not true stems."""
    size, hop, radius = 2048, 256, 15
    padded = np.pad(x, (size, size))
    frames = np.lib.stride_tricks.sliding_window_view(padded, size)[::hop]
    win = np.hanning(size)
    spectrum = np.fft.rfft(frames * win, axis=1)
    magnitude = np.abs(spectrum).astype(np.float32)
    temporal = np.pad(magnitude, ((radius, radius), (0, 0)), mode="edge")
    harmonic = np.empty_like(magnitude)
    for start in range(0, len(magnitude), 96):
        count = min(96, len(magnitude) - start)
        windows = np.lib.stride_tricks.sliding_window_view(temporal[start:start + count + 2 * radius], 2 * radius + 1, axis=0)
        harmonic[start:start + count] = np.median(windows, axis=-1)
    windows = np.lib.stride_tricks.sliding_window_view(np.pad(magnitude, ((0, 0), (radius, radius)), mode="edge"), 2 * radius + 1, axis=1)
    percussion = np.median(windows, axis=-1)
    mask = harmonic ** 2 / (harmonic ** 2 + percussion ** 2 + 1e-9)
    f = np.fft.rfftfreq(size, 1 / sr)
    # Leave room for the rebuilt bass and keep the sampled lead in a separate lane.
    high_pass = f ** 4 / (f ** 4 + 175 ** 4)
    split = 1 / np.sqrt(1 + (f / 680) ** 8)
    ceiling = 1 / np.sqrt(1 + (f / 3500) ** 8)
    bands = []
    for eq in (high_pass * split, high_pass * (1 - split) * ceiling):
        audio = np.zeros(len(padded), dtype=np.float64)
        norm = np.zeros_like(audio)
        rendered = np.fft.irfft(spectrum * mask * eq, axis=1, n=size) * win
        for index, frame in enumerate(rendered):
            start = index * hop
            audio[start:start + size] += frame
            norm[start:start + size] += win ** 2
        audio /= np.maximum(norm, 1e-9)
        bands.append(audio[size:size + len(x)])
    return bands


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "audio/titre-reference-2026-10-23")
    args = parser.parse_args()
    source_hash = hashlib.sha256(args.source.read_bytes()).hexdigest()
    args.output.mkdir(parents=True, exist_ok=True)
    print("Décodage de la référence et réduction des attaques du mix…", flush=True)
    rate = 11025
    data = subprocess.run(["ffmpeg", "-v", "error", "-i", str(args.source), "-f", "f32le", "-ac", "1", "-ar", str(rate), "pipe:1"], capture_output=True, check=True)
    source = np.frombuffer(data.stdout, dtype="<f4")
    assert len(source) / rate >= 174, "The arranged phrase markers require at least 174 seconds."
    bands = harmonic_bands(source, rate)
    print("Création des phrases PCM 8 bits et des quatre pistes…", flush=True)
    base, base_ids = m.bank()
    dark, dark_ids = m.title_bank(base, base_ids)
    samples, ids = [], {}
    # Seven generated samples, plus twenty short phrase samples: within MOD's 31.
    for name in ["weight", "weightkick", "snarehat", "hat", "tom", "crash", "iron"]:
        samples.append(dark[dark_ids[name] - 1]); ids[name] = len(samples)
    cells = [[[0, 0, 0, 0, 0] for _ in range(4)] for _ in range(BARS * 16)]

    def note(bar, row, channel, sample, pitch=48, volume=32):
        assert 0 <= volume <= 64
        m.period(pitch)
        cells[bar * 16 + row][channel] = [sample, pitch, volume, 0xC, volume]

    maxes = [np.percentile(np.abs(b), 99.85) for b in bands]
    phrase_count = 0
    for section in SECTIONS:
        section["startSeconds"] = section["bar"] * 240 / BPM
        section["durationSeconds"] = section["bars"] * 240 / BPM
        for local in range(0, section["bars"], 2):
            source_start = section["source"] + (local * 3 if section["id"] != "E5" else 0)
            for channel, band in enumerate(bands, start=1):
                positions = (source_start + np.arange(round(6 * m.BASE_RATE)) / m.BASE_RATE) * rate
                signal = np.interp(positions, np.arange(len(band)), band)
                # A common lane gain retains the quieter D/E sections; no per-phrase boost.
                signal = .65 * signal / max(maxes[channel - 1], .01)
                signal -= np.mean(signal)
                edge = round(.006 * m.BASE_RATE)
                signal[:edge] *= np.linspace(0, 1, edge)
                signal[-edge:] *= np.linspace(1, 0, edge)
                pcm = np.rint(np.clip(signal, -.92, .92) * 127).astype(np.int8)
                if len(pcm) % 2:
                    pcm = np.r_[pcm, np.int8(0)]
                assert len(pcm) <= 65534
                samples.append({"name": f"{section['id']} {'BODY' if channel == 1 else 'THEME'} {source_start}s", "pcm": pcm, "volume": 36})
                gain = 34 if channel == 1 else 39
                note(section["bar"] + local, 0, channel, len(samples), volume=gain)
                phrase_count += 1
        for local in range(section["bars"]):
            bar = section["bar"] + local
            chorus = section["id"] in ["C2", "C4"]
            sparse = section["id"] in ["A0", "D3", "E5"]
            # Low-register contour inferred from the mix; not an asserted exact transcription.
            root = [41, 39, 38, 44][local % 4] if chorus else 41
            for row in ([0, 8] if sparse else [0, 3, 6, 8, 11, 14]):
                note(bar, row, 0, ids["weight"], root, 34 if sparse else 39)
            if sparse:
                note(bar, 0, 3, ids["weightkick"], volume=36)
                if section["id"] != "D3":
                    note(bar, 8, 3, ids["iron"], volume=23)
            else:
                for row in range(0, 16, 2):
                    name = "weightkick" if row in [0, 6, 8] else "snarehat" if row in [4, 12] else "hat"
                    volume = 43 if name == "weightkick" else 32 if name == "snarehat" else 13
                    if section["id"] == "C4":
                        volume += 3
                    note(bar, row, 3, ids[name], volume=volume)
                if local == section["bars"] - 1:
                    note(bar, 14, 3, ids["tom"], 46, 31)
                    note(bar, 15, 3, ids["tom"], 43, 29)
    # Leave the end suspended; no cymbal flourish that promises a victory.
    cells[0][2][3:] = [0xF, 6]
    cells[0][3][3:] = [0xF, BPM]
    assert len(samples) == 27 and phrase_count == 20
    used = sorted({cell[0] for row in cells for cell in row if cell[0]})
    remap = {old: new for new, old in enumerate(used, start=1)}
    samples = [samples[old - 1] for old in used]
    for row in cells:
        for cell in row:
            if cell[0]:
                cell[0] = remap[cell[0]]
    assert len(samples) == 26  # Drop the unused crash; no victory flourish.
    module = args.output / "Technoprof-Titre-Interpretation.mod"
    m.write_mod(module, "TECHNOPROF ref V1", cells, samples)
    mix = m.render(cells, samples, BPM, "titre")
    wav = args.output / "Technoprof-Titre-Interpretation.wav"
    pcm = np.rint(mix * 32767).astype("<i2")
    with wave.open(str(wav), "wb") as output:
        output.setnchannels(2); output.setsampwidth(2); output.setframerate(m.SR); output.writeframes(pcm.tobytes())
    score = {"bpm": BPM, "rowsPerBeat": 4, "channels": ["basse reconstruite", "phrases corps harmonique", "phrases thème", "batterie reconstruite"], "sections": SECTIONS, "cells": cells}
    (args.output / "Technoprof-Titre-Interpretation.score.json").write_text(json.dumps(score, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    manifest = {"version": "interpretation-1", "sourceFile": args.source.name, "sourceSha256": source_hash,
                "sourceSeconds": len(source) / rate, "bpm": BPM, "seconds": len(mix) / m.SR,
                "wav": wav.name, "module": module.name, "sampleBits": 8, "trackerChannels": 4,
                "samples": len(samples), "sections": SECTIONS, "wavSha256": hashlib.sha256(wav.read_bytes()).hexdigest(),
                "peakDbFS": float(20 * np.log10(np.max(np.abs(mix)))), "rmsDbFS": float(20 * np.log10(np.sqrt(np.mean(mix ** 2))))}
    (args.output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    rows = "".join(f"<tr><td>{html.escape(s['id'])}</td><td>{s['startSeconds']:.0f}–{s['startSeconds']+s['durationSeconds']:.0f} s</td><td>{html.escape(s['role'])}</td></tr>" for s in SECTIONS)
    (args.output / "Ecouter-Titre-Interpretation.html").write_text(f'''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TECHNOPROF — Interprétation titre</title><style>:root{{color-scheme:dark}}body{{background:#10171c;color:#ddd1b3;font:17px/1.6 system-ui,sans-serif;max-width:850px;margin:auto;padding:25px}}h1,a{{color:#e8b369}}audio{{width:100%}}td,th{{padding:9px;text-align:left;border-bottom:1px solid #48545a}}table{{width:100%;font-size:15px}}a{{margin-right:20px}}button{{padding:12px;background:#273840;color:inherit;border:1px solid #8b8b7c}}@media(max-width:500px){{body{{padding:16px}}td{{padding:6px}}}}</style><h1>TECHNOPROF — Titre, interprétation 01</h1><p>60 secondes · 80 BPM · quatre pistes · samples PCM 8 bits</p><p>Version courte de ta composition : A → B → C → D → C → E. Phrases mélodiques et harmoniques rééchantillonnées depuis ton enregistrement ; basse et percussions reconstruites.</p><audio controls loop preload="metadata" src="{wav.name}"></audio><p><label><input id="loop" type="checkbox" checked> Écouter en boucle</label> <button id="stop">Arrêter</button></p><p><a download href="{wav.name}">WAV</a><a download href="{module.name}">Source MOD</a></p><table><thead><tr><th>Section</th><th>Dans cette version</th><th>Traitement</th></tr></thead><tbody>{rows}</tbody></table><p>Maquette d’arrangement par échantillonnage de phrases, pas transcription note à note. Le titre précédent et le jeu sont conservés pour comparaison.</p><script>const a=document.querySelector('audio');document.querySelector('#loop').onchange=e=>a.loop=e.target.checked;document.querySelector('#stop').onclick=()=>{{a.pause();a.currentTime=0}};</script></html>''', encoding="utf-8")
    assert hashlib.sha256(args.source.read_bytes()).hexdigest() == source_hash
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
