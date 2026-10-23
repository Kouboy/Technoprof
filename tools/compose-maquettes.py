"""Original four-track sketches; generated 8-bit samples, editable MOD + WAV.

Requires NumPy. No borrowed audio, soundfont, recording or model service.
This is an audition pack, not a change to the game's audio engine.
"""
from pathlib import Path
import hashlib
import html
import json
import math
import struct
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio" / "maquettes-2026-10-23"
SR = 22050
PAL = 3546894.6
BASE_RATE = PAL / 428
ROOT_NOTE = 48  # Audible C3: every tonal sample is recorded at this root.
RNG = np.random.default_rng(231026)


def freq(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def lowpass(signal, cutoff, order=4):
    # Zero-phase spectral rolloff; used in sample design / offline audition mix.
    f = np.fft.rfftfreq(len(signal), 1 / BASE_RATE)
    return np.fft.irfft(np.fft.rfft(signal) / np.sqrt(1 + (f / cutoff) ** (2 * order)), n=len(signal))


def envelope(t, attack=.003, decay=.5):
    a = np.minimum(1, t / attack) * np.exp(-t / decay)
    tail = min(len(t), max(8, round(BASE_RATE * .015)))
    a[-tail:] *= np.linspace(1, 0, tail)
    return a


def pluck(t, f, decay=.6, dark=False):
    signal = np.zeros_like(t)
    for harmonic in range(1, 24):
        if harmonic * f > BASE_RATE * .44:
            break
        signal += (np.sin(2 * np.pi * f * harmonic * t + .14 * harmonic)
                   * np.exp(-t * (1 + harmonic ** .64) / decay)
                   / harmonic ** (1.5 if dark else 1.15))
    return signal


def guitar(t, chord=(0, 7, 12), clean=False):
    signal = np.zeros_like(t)
    for index, interval in enumerate(chord):
        offset = index * .011
        local = np.maximum(0, t - offset)
        signal += pluck(local, freq(ROOT_NOTE + interval), .8 if clean else .65) * (t >= offset)
    # A dry picked string body, pre-recorded as PCM rather than a live oscillator.
    signal += RNG.normal(0, .025, len(t)) * np.exp(-t * 190)
    signal = np.tanh(signal * (1.15 if clean else 3.2))
    return lowpass(signal, 2900 if clean else 2500) * envelope(t, .0015, 1.0)


def drum(kind, t):
    noise = RNG.normal(0, 1, len(t))
    bright = noise - lowpass(noise, 1800)
    kick_phase = 2 * np.pi * (47 * t + 7.5 * (1 - np.exp(-t * 32)))
    kick = np.sin(kick_phase) * np.exp(-t * 19) + .1 * bright * np.exp(-t * 280)
    hat = bright * np.exp(-t * (105 if kind != "open" else 18)) * .27
    snare = .48 * lowpass(noise, 3200) * np.exp(-t * 22) + .4 * np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30)
    if kind == "kick":
        signal = kick
    elif kind == "kickhat":
        signal = kick + hat
    elif kind == "snarehat":
        signal = snare + hat
    elif kind == "tom":
        signal = np.sin(2 * np.pi * (95 * t + 2 * (1 - np.exp(-t * 25)))) * np.exp(-t * 14) + hat * .4
    elif kind == "crash":
        signal = bright * np.exp(-t * 4.6)
    else:
        signal = hat
    signal[:12] *= np.linspace(0, 1, 12)
    signal[-80:] *= np.linspace(1, 0, 80)
    return signal


def bank():
    samples = []

    def add(name, signal, volume):
        signal = signal - np.mean(signal)
        signal /= max(.01, np.max(np.abs(signal))) / .9
        signal[:8] *= np.linspace(0, 1, 8)
        signal[-24:] *= np.linspace(1, 0, 24)
        # The PCM source really is signed 8-bit. It is stored as such in MOD.
        pcm = np.rint(np.clip(signal, -1, 1) * 127).astype(np.int8)
        if len(pcm) % 2:
            pcm = np.append(pcm, np.int8(0))
        assert len(pcm) <= 65534
        samples.append({"name": name, "pcm": pcm, "volume": volume})
        return len(samples)

    t = np.arange(round(BASE_RATE * 1.5)) / BASE_RATE
    bass = pluck(t, freq(ROOT_NOTE), 1.4, True)
    bass += .12 * np.sin(2 * np.pi * freq(ROOT_NOTE) * t) * np.exp(-t * 3)
    ids = {"bass": add("BASS worn finger", lowpass(bass, 1150) * envelope(t, .002, 1.3), 44)}
    for name, chord, clean in [("power", (0, 7, 12), False), ("gmajor", (0, 7, 12, 16), True), ("gminor", (0, 7, 12, 15), True), ("pluck", (0,), True)]:
        ids[name] = add("GTR " + name, guitar(t, chord, clean), 35)
    lead = sum(np.sin(2 * np.pi * freq(ROOT_NOTE) * h * t) / h ** 1.25 for h in range(1, 16))
    lead += .17 * np.sin(2 * np.pi * freq(ROOT_NOTE) * 1.004 * t)
    ids["brass"] = add("SYN brass tape", lowpass(np.tanh(lead * 1.4), 2300) * envelope(t, .008, .8), 34)
    for name, intervals in [("minor", (0, 3, 7, 12)), ("major", (0, 4, 7, 12)), ("sus", (0, 5, 7, 12))]:
        long = np.arange(round(BASE_RATE * 2.5)) / BASE_RATE
        pad = np.zeros_like(long)
        for index, interval in enumerate(intervals):
            f = freq(ROOT_NOTE + interval)
            for harmonic in range(1, 10):
                if f * harmonic < BASE_RATE * .43:
                    pad += np.sin(2 * np.pi * f * harmonic * (1 + (index - 1.5) * .001) * long) / harmonic ** 1.5
        pad = lowpass(pad, 1900) * envelope(long, .07, 1.7)
        ids[name] = add("STR " + name, pad, 25)
    bell = (np.sin(2 * np.pi * freq(ROOT_NOTE) * t) * np.exp(-t * 4)
            + .38 * np.sin(2 * np.pi * freq(ROOT_NOTE) * 2.76 * t) * np.exp(-t * 10))
    ids["bell"] = add("MET tube glass", bell * envelope(t, .001, 1.0), 26)
    for name, seconds in [("kick", .34), ("kickhat", .34), ("snarehat", .3), ("hat", .12), ("open", .45), ("tom", .5), ("crash", .9)]:
        td = np.arange(round(BASE_RATE * seconds)) / BASE_RATE
        ids[name] = add("KIT " + name, drum(name, td), 46 if name != "hat" else 22)
    return samples, ids


def period(midi):
    value = round(428 / 2 ** ((midi - ROOT_NOTE) / 12))
    assert 113 <= value <= 856, midi
    return value


def title_bank(base_samples, base_ids):
    """Dedicated dark samples; never consume the RNG used by the approved radio."""
    samples, ids = list(base_samples), dict(base_ids)
    rng = np.random.default_rng(23102602)

    def add(name, signal, volume):
        signal -= np.mean(signal)
        signal *= .9 / max(.01, np.max(np.abs(signal)))
        signal[:8] *= np.linspace(0, 1, 8)
        signal[-80:] *= np.linspace(1, 0, 80)
        pcm = np.rint(np.clip(signal, -1, 1) * 127).astype(np.int8)
        if len(pcm) % 2:
            pcm = np.append(pcm, np.int8(0))
        samples.append({"name": name, "pcm": pcm, "volume": volume})
        return len(samples)

    t = np.arange(round(BASE_RATE * 2.5)) / BASE_RATE
    f = freq(ROOT_NOTE)
    tired = (.55 * np.sin(2 * np.pi * f * t) + .27 * np.sin(2 * np.pi * f * .5 * t)
             + .22 * np.sin(2 * np.pi * f * 2.002 * t) + .12 * np.sin(2 * np.pi * f * 3.001 * t))
    tired = lowpass(np.tanh(tired * 1.8), 750) * envelope(t, .012, 2.4)
    ids["weight"] = add("LOW exhausted pedal", tired, 49)
    horn = (np.sin(2 * np.pi * f * t) + .38 * np.sin(2 * np.pi * f * 1.004 * t)
            + .23 * np.sin(2 * np.pi * f * 2 * t) + .16 * np.sin(2 * np.pi * f * 3 * t))
    horn *= 1 + .025 * np.sin(2 * np.pi * .7 * t)
    ids["lowhorn"] = add("LOW rusted horn", lowpass(horn, 1200) * envelope(t, .055, 1.45), 36)
    cluster = np.zeros_like(t)
    # Open fifth plus a flat ninth: suspended pressure, no major-chord lift.
    for interval, gain in [(0, .55), (7, .24), (13, .17), (12, .2)]:
        tone = freq(ROOT_NOTE + interval)
        cluster += gain * (np.sin(2 * np.pi * tone * t) + .25 * np.sin(2 * np.pi * tone * 2.002 * t))
    ids["dread"] = add("STR unresolved fatigue", lowpass(cluster, 1450) * envelope(t, .16, 2.1), 25)
    impact = sum(gain * np.sin(2 * np.pi * hz * t) * np.exp(-t * decay)
                 for hz, gain, decay in [(51, .5, 8), (79, .32, 4), (119, .23, 5), (163, .18, 7), (247, .14, 9), (401, .08, 12)])
    impact += .055 * lowpass(rng.normal(0, 1, len(t)), 1700) * np.exp(-t * 17)
    ids["iron"] = add("MET heavy door", impact * envelope(t, .002, 1.8), 45)
    phase = 2 * np.pi * (43 * t + 2.6 * (1 - np.exp(-t * 29)))
    kick = np.sin(phase) * np.exp(-t * 10) + .14 * np.sin(2 * np.pi * 91 * t) * np.exp(-t * 19)
    ids["weightkick"] = add("KIT slow pressure", kick * envelope(t, .0015, 1.5), 48)
    return samples, ids


def score(key, bpm, bars, ids):
    # One cell = sample, audible MIDI note, Cxx volume, effect, parameter.
    cells = [[[0, 0, 0, 0, 0] for _ in range(4)] for _ in range(bars * 16)]

    def note(bar, row, channel, instrument, pitch=48, volume=None):
        if bar >= bars:
            return
        default = 22 if instrument == "hat" else 46 if instrument in ["kick", "kickhat", "snarehat", "open", "tom", "crash"] else 35
        volume = default if volume is None else volume
        period(pitch)
        cells[bar * 16 + row][channel] = [ids[instrument], pitch, volume, 0xC, volume]

    def stop(bar, row, channel):
        cells[bar * 16 + row][channel] = [0, 0, 0, 0xC, 0]

    chords = {
        "titre": [(36, "minor")],
        "radio": [(43, "major"), (50, "major"), (52, "minor"), (48, "major")],
        "ormeaux": [(38, "minor"), (38, "minor"), (46, "major"), (45, "sus")],
        "berthelot": [(41, "minor"), (41, "minor"), (37, "major"), (44, "major"), (46, "minor"), (46, "minor"), (48, "sus"), (48, "major")],
        "trois-ponts": [(40, "minor"), (40, "minor"), (41, "major"), (38, "minor"), (40, "minor"), (43, "major"), (41, "major"), (47, "major")],
    }[key]
    for bar in range(bars):
        root, quality = chords[bar % len(chords)]
        if key == "titre":
            # Slow, unrelieved pedal. No octave-bouncing bass or bright hook.
            note(bar, 0, 0, "weight", 36, 48)
            note(bar, 8, 0, "weight", 36 if bar % 4 != 3 else 37, 40)
            if bar % 2 == 0:
                note(bar, 0, 2, "dread", 48 if bar % 8 < 4 else 47, 23)
            hook = {0: [(0, 48, 35)], 1: [(4, 47, 30), (11, 42, 25)],
                    2: [(0, 48, 36), (10, 49, 20)], 3: [(4, 42, 28), (12, 47, 24)]}[bar % 4]
            for row, pitch, volume in hook:
                note(bar, row, 1, "lowhorn", pitch, volume + (2 if bar >= 8 else 0))
            note(bar, 0, 3, "weightkick", 48, 48)
            note(bar, 8, 3, "weightkick", 48, 39)
            if bar % 2:
                note(bar, 12, 3, "iron", 48, 36 if bar < 8 else 41)
            elif bar in [0, 4, 8, 12]:
                note(bar, 4, 3, "iron", 48, 41)
        elif key == "radio":
            for row, interval in [(0, 0), (3, 0), (6, 7), (8, 12), (10, 7), (14, 2 if bar % 4 == 3 else 0)]:
                note(bar, row, 0, "bass", root + interval, 40)
            for row in [0, 3, 6, 8, 11, 14]:
                note(bar, row, 1, "power", root, 27 if row in [3, 11] else 32)
            # Clean answering guitar, no vocal or sampled speech.
            third = 3 if quality == "minor" else 4
            melody = [12, 19, 16 if quality == "major" else 15, 14, 12, 7]
            for row, interval in zip([1, 4, 7, 9, 12, 15], melody if bar < 8 else [third + 12, 14, 19, 12, third + 12, 14]):
                note(bar, row, 2, "pluck", min(71, root + interval), 31 if bar >= 8 else 26)
            for row in range(0, 16, 2):
                instrument = "snarehat" if row in [4, 12] else "kickhat" if row in [0, 8] or (bar % 2 and row == 10) else "hat"
                note(bar, row, 3, instrument, volume=42 if instrument != "hat" else 19)
            if bar % 4 == 3:
                note(bar, 15, 3, "snarehat", 48, 23)
        else:
            busy = key == "trois-ponts"
            bass_rows = [(0, 0), (6, 7), (8, 0), (14, 12)] if key == "ormeaux" else [(0, 0), (3, 0), (6, 7), (8, 12), (11, 0), (14, 1 if busy else 7)]
            for row, interval in bass_rows:
                note(bar, row, 0, "bass", root + interval, 36 if key == "ormeaux" else 40)
            for row in ([0, 10] if busy else [0]):
                note(bar, row, 2, "power" if busy else quality, root + (0 if busy else 12), 20 if key == "ormeaux" else 24)
            # Family resemblance through a short/short/long motif; sparse enough
            # to leave impacts, dialogue clicks and navigation cues perceptible.
            transpose = root - 38 - (12 if root > 43 else 0)
            motif = [(2, 62), (5, 65), (10, 64)] if bar % 4 in [0, 2] else [(3, 57), (11, 60)]
            if key == "berthelot":
                motif = [(1, 62), (4, 60), (9, 65), (13, 64)] if bar % 2 == 0 else [(3, 57), (11, 61)]
            if busy:
                motif = [(1, 62), (4, 63), (7, 57), (11, 62), (14, 60)] if bar % 2 == 0 else [(2, 57), (6, 60), (10, 63)]
            for row, pitch in motif:
                note(bar, row, 1, "bell" if key == "ormeaux" else "brass" if busy else "pluck", min(71, pitch + transpose), 18 if key == "ormeaux" else 22)
                if row + 2 < 16:
                    stop(bar, row + 2, 1)
            for row in range(0, 16, 2):
                instrument = "snarehat" if row in [4, 12] else "kickhat" if row in ([0, 6, 8, 14] if busy else [0, 8]) else "hat"
                note(bar, row, 3, instrument, volume=(39 if busy else 33) if instrument != "hat" else 14)
            if busy and bar % 4 == 3:
                note(bar, 13, 3, "tom", 50, 34)
                note(bar, 15, 3, "tom", 47, 31)
    # MOD global defaults are 125 BPM / speed 6; encode both explicitly.
    cells[0][2][3:] = [0xF, 6]
    cells[0][3][3:] = [0xF, bpm]
    return cells


def write_mod(path, title, cells, samples):
    patterns = len(cells) // 64
    data = bytearray(title.encode("ascii")[:20].ljust(20, b"\0"))
    for index in range(31):
        if index < len(samples):
            s = samples[index]
            data += s["name"].encode("ascii")[:22].ljust(22, b"\0")
            data += struct.pack(">HBBHH", len(s["pcm"]) // 2, 0, s["volume"], 0, 1)
        else:
            data += bytes(22) + struct.pack(">HBBHH", 0, 0, 0, 0, 1)
    data += bytes([patterns, 0]) + bytes(range(patterns)).ljust(128, b"\0") + b"M.K."
    assert len(data) == 1084
    for row in cells:
        for sample, midi, volume, effect, param in row:
            p = period(midi) if sample else 0
            data += bytes([(sample & 0xF0) | (p >> 8), p & 255, ((sample & 15) << 4) | effect, param])
    for s in samples:
        data += s["pcm"].tobytes()
    path.write_bytes(data)


def render(cells, samples, bpm, key):
    row_seconds = 15 / bpm
    n = round(len(cells) * row_seconds * SR)
    channels = np.zeros((n, 4), dtype=np.float64)
    for channel in range(4):
        events = [(row, cell[channel]) for row, cell in enumerate(cells) if cell[channel][0] or cell[channel][3] == 0xC]
        for index, (row, event) in enumerate(events):
            sample, midi, volume, effect, param = event
            if not sample:
                continue
            s = samples[sample - 1]
            volume = volume if effect == 0xC else s["volume"]
            rate = PAL / period(midi)
            next_row = events[(index + 1) % len(events)][0] + (len(cells) if index + 1 == len(events) else 0)
            length = min(round((next_row - row) * row_seconds * SR), math.ceil(len(s["pcm"]) * SR / rate))
            positions = np.arange(length) * rate / SR
            values = np.interp(positions, np.arange(len(s["pcm"])), s["pcm"].astype(float) / 128, left=0, right=0) * volume / 64
            # Only one active sample per channel. Three-sample ramps avoid a
            # digital click at a forced retrigger without softening the drums.
            if len(values) > 8:
                values[:3] *= np.linspace(0, 1, 3)
                values[-3:] *= np.linspace(1, 0, 3)
            start = round(row * row_seconds * SR)
            positions_out = (start + np.arange(length)) % n
            channels[positions_out, channel] += values
    # Keep the two musical tracks slightly apart, bass / kit centred for mono.
    stereo = channels @ np.array([[.5, .5], [.38, .62], [.62, .38], [.5, .5]])
    frequencies = np.fft.rfftfreq(n, 1 / SR)
    if key == "radio":
        eq = (frequencies / np.sqrt(frequencies ** 2 + 170 ** 2)) / np.sqrt(1 + (frequencies / 3400) ** 6)
    elif key == "titre":
        eq = (frequencies / np.sqrt(frequencies ** 2 + 22 ** 2)) / np.sqrt(1 + (frequencies / 3200) ** 6)
    else:
        eq = (frequencies / np.sqrt(frequencies ** 2 + 35 ** 2)) / np.sqrt(1 + (frequencies / 6500) ** 6)
    for c in range(2):
        stereo[:, c] = np.fft.irfft(np.fft.rfft(stereo[:, c]) * eq, n=n)
    if key != "radio":
        # Low-level cyclic early reflections: tails are retained across the loop.
        dry = stereo.copy()
        for delay, gain in [(.047, .065), (.093, .035), (.139, .02)]:
            stereo += np.roll(dry[:, ::-1], round(delay * SR), axis=0) * gain
    else:
        hiss = RNG.normal(0, .0015, (n, 2))
        stereo += hiss
    stereo -= stereo.mean(axis=0)
    rms = float(np.sqrt(np.mean(stereo ** 2)))
    gain = min(10 ** (-19 / 20) / max(rms, 1e-9), .86 / np.max(np.abs(stereo)))
    stereo *= gain
    # Ensure a bounded wrap discontinuity while retaining the rhythmic downbeat.
    # A 32-sample correction stays below 1.5ms; no fade-out or silent loop seam.
    for c in range(2):
        delta = stereo[0, c] - stereo[-1, c]
        stereo[-32:, c] += np.linspace(0, delta, 32)
    assert np.isfinite(stereo).all() and np.max(np.abs(stereo)) < 1
    return stereo


TRACKS = [
    ("01-titre", "titre", "Danger et fatigue V2", 80, 16, "Titre — Danger et fatigue · V2", "48 secondes à 80 BPM : pédale grave, cuivres bas, impacts métalliques espacés et cordes sans résolution. Une menace qui pèse, sans montée héroïque."),
    ("02-autoradio", "radio", "Educ-a Rock", 112, 16, "Autoradio — Service continu", "Pop-rock instrumental : accords de guitare saturée, petite réponse en guitare claire, basse et batterie sèche. Filtre de poste et léger souffle."),
    ("03-ormeaux", "ormeaux", "Ormeaux 07h00", 104, 16, "Ormeaux — Première sonnerie", "Pulsation retenue, cordes ternes et petits impacts de verre. Motif espacé pour laisser de la place au jeu."),
    ("04-berthelot", "berthelot", "Berthelot 12h00", 116, 16, "Berthelot — Quatre couches de beige", "Cordes échantillonnées, motif pincé et rythme plus nerveux. Une solennité usée plutôt qu’un grand thème héroïque."),
    ("05-trois-ponts", "trois-ponts", "Trois Ponts 18h30", 128, 16, "Trois-Ponts — Dernier service", "Basse plus insistante, ponctuations métalliques, guitares sourdes et batterie plus serrée. La même famille de motifs sous davantage de pression."),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    samples, ids = bank()
    manifest = {"version": "maquettes-2-titre", "sampleRate": SR, "sourceSampleRate": BASE_RATE, "sourceBits": 8, "channels": 4, "tracks": []}
    for stem, key, title, bpm, bars, label, description in TRACKS:
        current_samples, current_ids = title_bank(samples, ids) if key == "titre" else (samples, ids)
        cells = score(key, bpm, bars, current_ids)
        module = OUT / (stem + ".mod")
        write_mod(module, title, cells, current_samples)
        audio = render(cells, current_samples, bpm, key)
        wav_path = OUT / (stem + ".wav")
        pcm = np.rint(audio * 32767).astype("<i2")
        with wave.open(str(wav_path), "wb") as output:
            output.setnchannels(2)
            output.setsampwidth(2)
            output.setframerate(SR)
            output.writeframes(pcm.tobytes())
        entry = {"id": key, "label": label, "description": description, "bpm": bpm, "bars": bars, "duration": round(len(audio) / SR, 4), "file": wav_path.name, "module": module.name, "peakDbFS": round(20 * np.log10(np.max(np.abs(audio))), 2), "rmsDbFS": round(20 * np.log10(np.sqrt(np.mean(audio ** 2))), 2), "loopJump": float(np.max(np.abs(audio[0] - audio[-1]))), "sha256": hashlib.sha256(wav_path.read_bytes()).hexdigest()}
        manifest["tracks"].append(entry)
        (OUT / (stem + ".score.json")).write_text(json.dumps({"bpm": bpm, "rowsPerBeat": 4, "channels": ["bass", "motif/guitar", "chord/guitar", "kit"], "cells": cells}, separators=(",", ":")) + "\n", encoding="utf-8")
        print(f"{stem}: {entry['duration']:.2f}s, {entry['peakDbFS']}dBFS, {module.stat().st_size} bytes MOD")
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_player(manifest)


def write_player(manifest):
    cards = []
    for entry in manifest["tracks"]:
        cards.append(f'''<article><header><h2>{html.escape(entry['label'])}</h2><span>{entry['bpm']} BPM · {entry['duration']:.1f} s</span></header>
<p>{html.escape(entry['description'])}</p>
<audio controls preload="none" loop aria-label="{html.escape(entry['label'])}" src="{entry['file']}"></audio>
<footer><a href="{entry['file']}" download>WAV</a><a href="{entry['module']}" download>Source tracker MOD</a></footer></article>''')
    document = '''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TECHNOPROF — Atelier musical</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#10171c;color:#ddd1b3;font:16px/1.55 system-ui,sans-serif}main{max-width:890px;margin:0 auto;padding:34px 20px 55px}h1{font:700 clamp(30px,6vw,48px)/1.15 monospace;color:#e5ad59;margin:12px 0}h2{font-size:20px;margin:0}p{color:#b7b8ad;margin:12px 0}small,.label{font-family:monospace;color:#98a7a7}article{padding:24px;margin:18px 0;border:1px solid #465658;border-left:4px solid #997442;background:#1b272e;box-shadow:0 3px 0 #080f13}article header{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap}article header span{font:14px monospace;color:#d8b987}audio{width:100%;margin:8px 0}footer{display:flex;gap:24px}a{color:#e7b569;text-underline-offset:4px}button{background:#26383f;border:1px solid #738584;color:#e7dfc9;padding:12px 18px;font:inherit;cursor:pointer}button:focus-visible,a:focus-visible{outline:3px solid #e7b569;outline-offset:4px}.controls{display:flex;align-items:center;flex-wrap:wrap;gap:20px;margin:22px 0}.timeline{padding:15px 18px;border:1px solid #58625c;background:#202c2c}input{accent-color:#e7b569}.playing{border-left-color:#e7b569;box-shadow:inset 0 0 0 1px #997442}details{margin-top:24px}summary{cursor:pointer;color:#e7b569}@media(max-width:500px){article{padding:18px}main{padding:22px 12px}}
</style><main><div class="label">BRAINROT INTERACTIVE SOFTWARE / TECHNOPROF</div><h1>Physique appliquée<br>Atelier musical</h1>
<p>Le titre V2 reprend la direction danger et fatigue : plus lent, plus bas, plus pesant. Les quatre autres morceaux sont conservés pour l’essai en jeu. Quatre pistes tracker et samples courts en 8 bits.</p><p><a href="../../Jouer-Technoprof-Journee-Musique.html">Essayer la journée avec l’autoradio et les trois établissements</a> · Le titre V2 reste proposé à l’écoute ici.</p>
<div class="timeline"><strong>Autoradio : le déroulé retenu</strong><br>Bulletin → affectation et sons de notification → départ du morceau → boucle pendant le trajet → arrêt à la cinématique d’arrivée ou au Game Over.</div>
<div class="controls"><button id="stop" type="button">Tout arrêter</button><label><input id="loop" type="checkbox" checked> Écouter en boucle</label></div>
''' + "\n".join(cards) + '''
<details><summary>À propos de ces maquettes</summary><p>Compositions originales et samples fabriqués pour cet essai : aucun extrait de musique, aucune voix et aucun enregistrement emprunté. Les WAV servent à l’écoute ; les MOD contiennent les quatre pistes et les samples 8 bits éditables dans un tracker. Le mix d’écoute resserre la stéréo et conserve les queues de notes à la jonction des boucles.</p><p>Le lancement habituel conserve son audio actuel. La journée musicale séparée ajoute les quatre morceaux retenus pour essai, avec un volume Musique dans les réglages. Le ton du titre V2 reste à valider à l’oreille.</p></details><p><small>Titre V2 / autres morceaux V1 · 23 octobre 2026 · <a href="README.md">Notes et reconstruction</a></small></p></main>
<script>
const players=[...document.querySelectorAll('audio')];
players.forEach(player=>{player.volume=.8;player.addEventListener('play',()=>{players.forEach(other=>{if(other!==player){other.pause();other.closest('article').classList.remove('playing')}});player.closest('article').classList.add('playing')});player.addEventListener('pause',()=>player.closest('article').classList.remove('playing'));player.addEventListener('ended',()=>player.closest('article').classList.remove('playing'))});
document.querySelector('#stop').onclick=()=>players.forEach(player=>{player.pause();if(player.readyState)player.currentTime=0});
document.querySelector('#loop').onchange=event=>players.forEach(player=>player.loop=event.target.checked);
</script></html>'''
    (OUT / "Ecouter-Technoprof.html").write_text(document, encoding="utf-8")


if __name__ == "__main__":
    main()
