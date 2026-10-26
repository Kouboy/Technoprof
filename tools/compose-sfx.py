"""Original pulp/foley samples: deterministic offline PCM, no borrowed recordings.

Requires NumPy. Raw signed 8-bit mono is embedded for file:// standalone play.
WAVs and a listening desk are also emitted for art-direction review.
"""
from pathlib import Path
import base64
import hashlib
import html
import json
import re
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio/sfx-2026-10-24"
SR = 11025
LOOPS = {"engine", "wind", "rolling", "room", "hum"}
EXTRA = {"step-wood": .16, "step-concrete": .16, "step-metal": .16,
         "step-gravel": .16, "gate": .72, "stairs": .5}


def filtered(signal, low=0, high=4200):
    f = np.fft.rfftfreq(len(signal), 1 / SR)
    mask = 1 / np.sqrt(1 + (f / high) ** 8)
    if low:
        mask *= 1 - 1 / np.sqrt(1 + (f / low) ** 6)
    return np.fft.irfft(np.fft.rfft(signal) * mask, n=len(signal))


def sample(kind, seconds, variant):
    rng = np.random.default_rng(241026 + int.from_bytes(hashlib.sha256(f'{kind}:{variant}'.encode()).digest()[:4], 'little'))
    t = np.arange(round(seconds * SR)) / SR
    n = rng.uniform(-1, 1, len(t))
    lo, mid, hi = filtered(n, 0, 500), filtered(n, 450, 2400), filtered(n, 1700, 4700)
    tone = lambda hz: np.sin(2 * np.pi * hz * t + rng.uniform(-.12, .12))
    def exp(start=0, decay=.04):
        u = t - start
        return np.where(u >= 0, np.exp(-np.maximum(u, 0) / decay), 0)
    def puff(start, length):
        return np.sin(np.pi * np.clip((t - start) / length, 0, 1)) ** 2
    def knock(start=0, pitch=100, decay=.045):
        u = np.maximum(t - start, 0)
        phase = 2 * np.pi * (pitch * .58 * u + pitch * .42 * .022 * (1 - np.exp(-u / .022)))
        return (np.sin(phase) * .4 + lo * 3.2 + mid * .3) * exp(start, decay)
    jitter = 1 + (variant - .5) * .075
    if kind in {"book", "body", "defeat", "block", "stamp"}:
        # Trailer-era WHACK: dry palm crack, compressed low body, papery slap.
        heavy = kind in {"body", "defeat"}
        v = knock(.002, (72 if heavy else 116) * jitter, .065 if heavy else .043)
        v += (hi * (1.05 if kind == 'block' else .72) + mid * .9) * exp(.001, .009)
        v += (mid * 1.8 + hi * .4) * puff(.012, .055)
        if kind == 'block':
            v = filtered(n, 900, 4500) * exp(0, .026) * 2.1 + knock(0, 270, .021) * .6
        if kind == 'stamp':
            v += (tone(418) * .22 + tone(887) * .08) * exp(.002, .039)
        if kind == 'defeat':
            v += knock(.105, 64, .075) * .7 + mid * .6 * puff(.19, .16)
    elif kind in {"swing", "jump", "sweep"}:
        length = min(seconds - .02, .24 if kind == 'sweep' else .18)
        glide = np.clip(t / length, 0, 1)
        v = (filtered(n, 500, 1600) * (1 - glide) * 3 + mid * 1.8 * glide + hi * .2) * puff(.004, length)
        if kind == 'jump':
            v += mid * .45 * puff(.002, .035)  # coat and satchel, no rising note
    elif kind.startswith('step') or kind in {'land', 'stairs'}:
        floor = kind.removeprefix('step-') if kind.startswith('step-') else 'tile'
        v = knock(0, (140 if floor == 'wood' else 175) * jitter, .018) * .65
        v += hi * .6 * exp(.001, .005) + mid * .3 * puff(.022, .07)
        if floor == 'wood':
            v = knock(0, 118 * jitter, .034) + (tone(269 * jitter) * .18 + tone(417 * jitter) * .09) * exp(.002, .038)
            v += mid * .45 * puff(.025, .075)
        elif floor == 'metal':
            v += (tone(633 * jitter) * .22 + tone(1191 * jitter) * .13) * exp(0, .035)
        elif floor == 'concrete':
            v = knock(0, 145 * jitter, .023) * .7 + mid * .9 * exp(.002, .012) + hi * .4 * puff(.022, .07)
        elif floor == 'gravel':
            v = knock(0, 125, .023) * .65 + hi * .7 * (puff(.004, .04) + puff(.035, .06) + puff(.08, .05))
        if kind == 'land':
            v = knock(0, 90 * jitter, .047) * 1.2 + mid * .75 * exp(.002, .017) + mid * .4 * puff(.05, .10)
        if kind == 'stairs':
            # A compressed flight of three hard heel contacts, shoe scuffs and
            # the short, hollow stairwell tail. Fits the existing visual fade.
            v = np.zeros_like(t)
            for at, pitch, gain in [(0, 162, 1), (.105, 143, .85), (.22, 127, .75)]:
                v += gain * (knock(at, pitch * jitter, .036) + hi * .65 * exp(at, .008))
                v += mid * .5 * puff(at + .025, .07)
            v += knock(.29, 116, .06) * .26 + knock(.36, 98, .035) * .12
    elif kind in {'door', 'door-passage', 'gate', 'car-door', 'handle'}:
        if kind == 'handle':
            v = (hi + mid) * exp(0, .012) + (tone(920) * .12 + mid * .3) * exp(.04, .018)
        elif kind == 'car-door':
            v = knock(0, 79, .055) * 1.6 + hi * .5 * exp(.001, .007)
            v += (tone(183) * .24 + tone(306) * .13) * exp(.003, .06) + (mid + hi) * exp(.026, .011)
        elif kind == 'gate':
            v = (tone(173) * .2 + tone(481) * .12 + mid * .55) * puff(.02, .53)
            v *= .5 + .5 * np.abs(tone(39))
            v += (mid + hi * .7) * exp(0, .025) + knock(.60, 213, .037)
        elif kind == 'door-passage':
            # Latch, worn hinge, then wooden stop. Unlike the classroom door,
            # the closing transient lands during the 300ms room transition.
            v = (mid + hi * .45) * exp(0, .011)
            v += (tone(216 + variant * 19) * .16 + mid * .55 + lo * .7) * puff(.02, .16)
            v += knock(.205, 94 * jitter, .046) * 1.3 + hi * .4 * exp(.205, .009)
            v += (tone(318) * .15 + mid * .25) * exp(.22, .033)
        else:
            v = mid * .5 * exp(0, .018)
            v += (lo * 1.2 + mid * .3 + tone(241) * .05) * puff(.04, .49)
            v += knock(.64, 98, .04) + hi * .25 * exp(.64, .008)
    elif kind in {'bell-start', 'bell-end'}:
        v = np.zeros_like(t)
        for at in ([0, .32] if kind == 'bell-start' else [0, .22, .48]):
            u = np.maximum(t - at, 0)
            ring = sum(a * np.sin(2 * np.pi * f * u) for a, f in [(.35, 690), (.23, 1051), (.12, 1577), (.04, 2139)])
            v += ring * exp(at, .19)
    elif kind in {'impact', 'rattle', 'crumble'}:
        if kind == 'impact':
            v = knock(0, 67, .105) * 1.4 + hi * .7 * exp(0, .015)
            v += (tone(337) * .2 + mid * 1.3) * (exp(.11, .03) + .6 * exp(.28, .045))
        elif kind == 'rattle':
            v = (tone(317) * .25 + tone(719) * .17 + mid * 1.3 + hi * .25) * (exp(0, .018) + .4 * exp(.065, .025))
        else:
            v = knock(0, 92, .055) + mid * (puff(.002, .06) + puff(.035, .14) + puff(.16, .16)) + hi * .4 * puff(.06, .18)
    elif kind in {'pass', 'truck'}:
        peak = .16 if kind == 'truck' else .13
        env = np.where(t < peak, np.sin(np.pi * np.minimum(1, t / peak) / 2) ** 2, np.exp(-np.maximum(t - peak, 0) / (.25 if kind == 'truck' else .19)))
        phase = 2 * np.pi * ((85 if kind == 'truck' else 160) * (1.35 * t - .325 * t * t / seconds))
        v = (lo * 3 + mid * .7 + np.sin(phase) * .12) * env
    elif kind == 'skid':
        phase = np.cumsum(2 * np.pi * (1130 + 170 * np.sin(2 * np.pi * 27 * t)) / SR)
        v = (np.sin(phase) * .23 + mid * 1.1 + hi * .12) * puff(0, seconds - .008)
    elif kind == 'gravel':
        v = (lo * 2 + mid + hi * .15) * (.25 + .75 * np.abs(tone(37))) * puff(0, seconds - .008)
    elif kind == 'chair':
        v = (mid * 1.4 + lo * 2 + tone(477 + variant * 37) * .13) * puff(.03, .5) * (.4 + .6 * np.abs(tone(19)))
        v += knock(.63, 134, .03) * .7
    elif kind in {'paper', 'cloth', 'chalk'}:
        pulses = ([.01, .16, .30] if kind == 'paper' else [.01, .26] if kind == 'cloth' else [.03, .27, .58, .80])
        v = sum((hi * (.7 if kind == 'paper' else .25) + mid * .7 + lo * (.8 if kind == 'cloth' else 0)) * puff(p, min(.19, seconds - p - .008)) for p in pulses)
    elif kind == 'talk':
        # Tiny worn vocal grain, not a bright electronic character beep.
        v = (tone(162) * .25 + tone(486) * .12 + mid * .20) * puff(0, seconds)
    elif kind == 'drip':
        phase = 2 * np.pi * (1550 * t + 950 * .022 * (1 - np.exp(-t / .022)))
        v = np.sin(phase) * exp(0, .026) * .35 + tone(573) * exp(0, .075) * .16
    elif kind == 'relay':
        v = (hi * .7 + mid + tone(519) * .08) * exp(0, .010)
    elif kind == 'data':
        bits = np.floor(t * 32).astype(int)
        hz = np.where(bits % 5 == 0, 2400, np.where(bits % 2, 1200, 1800))
        v = (np.sin(np.cumsum(2 * np.pi * hz / SR)) * .3 + mid * .12) * ((t * 32) % 1 < .72)
    elif kind == 'stall':
        phase = np.cumsum(2 * np.pi * 62 * np.maximum(.18, 1 - t / .75) / SR)
        v = (np.sin(phase) * .35 + lo * 2 + mid * .12) * exp(0, .26) * (.3 + .7 * np.abs(tone(7)))
    else:
        raise ValueError(kind)
    # A fixed sampled transient, gently saturated then bandwidth/8-bit limited.
    v = filtered(np.tanh(v * 1.7), 25, 4200)
    v -= np.mean(v)
    v *= np.minimum(1, t / .0015) * np.minimum(1, (seconds - t) / .008)
    v -= np.mean(v)
    v *= .88 / max(.001, np.max(np.abs(v)))
    pcm = np.rint(v * 127).astype(np.int8)
    pcm[:1] = 0
    pcm[-1:] = 0
    return pcm


def main():
    source = (ROOT / 'src/audio-materials.ts').read_text(encoding='utf-8').split('export const FOLEY = {')[1].split('} as const')[0]
    durations = {m[0] or m[1]: float(m[2]) for m in re.findall(r'^  (?:(\w+)|"([\w-]+)"): \[([\d.]+),', source, re.M)}
    durations.update(EXTRA)
    OUT.mkdir(parents=True, exist_ok=True)
    bank, manifest, montage = {}, [], []
    for kind, seconds in durations.items():
        if kind in LOOPS:
            continue
        takes = 1 if kind in {'talk', 'bell-start', 'bell-end', 'data', 'gate'} else 3 if kind.startswith('step') or kind == 'book' else 2
        bank[kind] = []
        for variant in range(takes):
            pcm = sample(kind, seconds, variant)
            bank[kind].append(base64.b64encode(pcm.tobytes()).decode())
            name = f'{kind}-{variant + 1}.wav'
            with wave.open(str(OUT / name), 'wb') as wav:
                wav.setparams((1, 1, SR, len(pcm), 'NONE', 'not compressed'))
                wav.writeframes((pcm.astype(np.int16) + 128).astype(np.uint8).tobytes())
            manifest.append({'kind': kind, 'take': variant, 'file': name, 'rate': SR, 'bits': 8, 'frames': len(pcm), 'sha256': hashlib.sha256(pcm.tobytes()).hexdigest()})
        if kind in {'step','step-wood','step-concrete','step-metal','step-gravel','jump','land','swing','book','block','body','defeat','stamp','sweep','car-door','gate','door','stairs','pass','impact'}:
            montage.extend([np.zeros(round(.25 * SR)), sample(kind, seconds, 0).astype(float) / 128 * .68])
    ts = '// Generated by tools/compose-sfx.py. Original signed 8-bit mono PCM; no recordings.\nexport const SFX_RATE = 11025;\nexport const SFX_DATA: Record<string, readonly string[]> = ' + json.dumps(bank, indent=2) + ';\n'
    (ROOT / 'src/sfx-data.ts').write_text(ts, encoding='utf-8')
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    joined = np.concatenate(montage)
    with wave.open(str(OUT / 'Palette-Technoprof.wav'), 'wb') as wav:
        wav.setparams((1, 2, SR, len(joined), 'NONE', 'not compressed'))
        wav.writeframes(np.rint(joined * 32767).astype('<i2').tobytes())
    labels = {'book': 'Coup porté — WHACK', 'body': 'Coup reçu', 'defeat': 'Dernier coup / chute', 'block': 'Garde', 'swing': 'Coup dans le vide', 'jump': 'Saut — woosh', 'land': 'Réception', 'step': 'Pas — carrelage', 'step-wood': 'Pas — plancher', 'step-concrete': 'Pas — béton', 'step-metal': 'Pas — métal', 'step-gravel': 'Pas — gravillons', 'gate': 'Grille', 'door': 'Porte', 'stairs': 'Escalier', 'car-door': 'Portière'}
    rows = ''.join('<section><h2>' + html.escape(labels.get(k, k)) + '</h2>' + ''.join(f'<audio controls preload="none" src="{k}-{i+1}.wav"></audio>' for i in range(len(v))) + '</section>' for k, v in bank.items())
    (OUT / 'Ecouter-SFX.html').write_text('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Technoprof — Palette SFX</title><style>body{background:#111b21;color:#dfceaa;font:16px monospace;max-width:1000px;margin:24px auto;padding:16px}h1{color:#e5ad55}section{border-top:1px solid #52605b;padding:10px 0}h2{font-size:16px}audio{max-width:100%;margin:4px}</style><h1>TECHNOPROF — Palette SFX low-fi</h1><p>Samples originaux mono, 8 bits / 11 025 Hz. Variantes à comparer ; le mix en jeu est plus discret.</p><p>Montage des principales matières :</p><audio controls src="Palette-Technoprof.wav"></audio>' + rows + '<script>document.addEventListener("play",e=>{document.querySelectorAll("audio").forEach(a=>{if(a!==e.target)a.pause()})},true)</script></html>', encoding='utf-8')
    print(f'{len(bank)} materials, {len(manifest)} original takes, {sum(m["frames"] for m in manifest)} PCM bytes; audition {len(joined)/SR:.1f}s')


if __name__ == '__main__':
    main()
