"""Validate seven audition pieces independently of their composition script."""
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio/complements-2026-10-23"
manifest = json.loads((OUT / "manifest.json").read_text(encoding="utf-8"))
assert {t["id"] for t in manifest["tracks"]} == {"inspectrice", "parent", "securite", "infirmerie", "bossa", "fusion", "gameover"}
assert manifest["channels"] == 4 and manifest["sourceBits"] == 8
report = []
for track in manifest["tracks"]:
    wav = OUT / track["wav"]
    assert hashlib.sha256(wav.read_bytes()).hexdigest() == track["wavSha256"]
    with wave.open(str(wav)) as stream:
        assert (stream.getnchannels(), stream.getsampwidth(), stream.getframerate()) == (2, 2, 22050)
        pcm = np.frombuffer(stream.readframes(stream.getnframes()), dtype="<i2").reshape(-1, 2)
    expected = track["bars"] * 240 / track["bpm"]
    assert abs(len(pcm) / 22050 - expected) <= 1 / 22050
    assert np.max(np.abs(pcm.astype(int))) < 32767
    signal = pcm.astype(float) / 32768
    rms_db = 20 * np.log10(np.sqrt(np.mean(signal ** 2)))
    assert abs(rms_db - track["rmsDbFS"]) < .02
    assert np.max(np.abs(signal.mean(axis=0))) < .001
    jump = int(np.max(np.abs(pcm[0].astype(int) - pcm[-1].astype(int))))
    if track["loop"]:
        assert jump <= 1
        for window in [signal[:2205], signal[-2205:]]:
            assert np.sqrt(np.mean(window ** 2)) > .002
    else:
        assert track["id"] == "gameover" and expected == 12
        assert np.all(pcm[-64:] == 0), "one-shot ends in silence"
        assert np.sqrt(np.mean(signal[-22050:] ** 2)) < np.sqrt(np.mean(signal[:22050] ** 2)) * .3
    score = json.loads((OUT / (track["file"] + ".score.json")).read_text(encoding="utf-8"))
    assert len(score["cells"]) == track["bars"] * 16
    assert all(len(row) == 4 for row in score["cells"])
    assert score["loop"] == track["loop"]
    data = (OUT / track["module"]).read_bytes()
    assert data[1080:1084] == b"M.K."
    patterns = max(data[952:952 + data[950]]) + 1
    assert patterns * 64 == len(score["cells"])
    lengths = [struct.unpack_from(">H", data, 20 + n * 30 + 22)[0] * 2 for n in range(31)]
    assert sum(bool(n) for n in lengths) == track["samples"]
    assert len(data) == 1084 + patterns * 1024 + sum(lengths)
    assert all(data[20 + n * 30 + 25] <= 64 for n in range(31))
    used = set()
    for pos in range(1084, 1084 + patterns * 1024, 4):
        a, b, c, d = data[pos:pos + 4]
        sample = (a & 0xF0) | (c >> 4)
        period = ((a & 15) << 8) | b
        if sample:
            assert 1 <= sample <= 31 and lengths[sample - 1] and 113 <= period <= 856
            used.add(sample)
        assert c & 15 in [0, 0xC, 0xF]
    assert len(used) == track["samples"], "no unused embedded samples"
    decoded = subprocess.run(["ffmpeg", "-v", "error", "-f", "libopenmpt", "-sample_rate", "22050", "-i", str(OUT / track["module"]), "-t", str(expected), "-f", "f32le", "-ac", "2", "-ar", "22050", "pipe:1"], check=True, capture_output=True)
    independent = np.frombuffer(decoded.stdout, dtype="<f4")
    assert len(independent) > expected * 22050 * 2 * .99
    assert np.isfinite(independent).all() and np.mean(independent ** 2) > .0001
    report.append({"id": track["id"], "seconds": round(expected, 3), "loop": track["loop"], "samples": track["samples"],
                   "peakDbFS": track["peakDbFS"], "rmsDbFS": track["rmsDbFS"], "loopBoundarySampleDelta": jump if track["loop"] else None,
                   "moduleDecode": "ffmpeg/libopenmpt"})
care = next(t for t in manifest["tracks"] if t["id"] == "infirmerie")
assert care["rmsDbFS"] <= -23.9, "care mix is deliberately quieter than combat"
(OUT / "verification.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, indent=2))
print("PASS seven WAV/MOD pieces: four channels, used 8-bit samples, levels, six loop seams, one-shot ending and independent decode. No artistic listening claim.")
