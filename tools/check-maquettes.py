"""Technical validation only; musical preference requires human listening."""
import hashlib
import json
from pathlib import Path
import shutil
import struct
import subprocess
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio" / "maquettes-2026-10-23"
manifest = json.loads((OUT / "manifest.json").read_text(encoding="utf-8"))
assert len(manifest["tracks"]) == 5
report = []
for item in manifest["tracks"]:
    wav_path = OUT / item["file"]
    assert hashlib.sha256(wav_path.read_bytes()).hexdigest() == item["sha256"]
    with wave.open(str(wav_path)) as stream:
        assert stream.getnchannels() == 2 and stream.getsampwidth() == 2
        assert stream.getframerate() == manifest["sampleRate"]
        pcm = np.frombuffer(stream.readframes(stream.getnframes()), dtype="<i2").reshape(-1, 2)
    expected = item["bars"] * 4 * 60 / item["bpm"]
    assert abs(len(pcm) / manifest["sampleRate"] - expected) < 1 / manifest["sampleRate"]
    assert np.max(np.abs(pcm.astype(np.int32))) < 32767
    assert np.sqrt(np.mean((pcm.astype(float) / 32768) ** 2)) > .04
    assert np.max(np.abs(pcm[0].astype(int) - pcm[-1].astype(int))) <= 1
    assert np.max(np.abs(np.mean(pcm.astype(float) / 32768, axis=0))) < 1e-4
    # Loop is a rhythmic phrase, not a song with an artificial silent ending.
    for window in [pcm[:2205], pcm[-2205:]]:
        assert np.sqrt(np.mean((window.astype(float) / 32768) ** 2)) > .004
    data = (OUT / item["module"]).read_bytes()
    assert data[1080:1084] == b"M.K."
    patterns = max(data[952:952 + data[950]]) + 1
    assert patterns * 64 == item["bars"] * 16
    lengths = [struct.unpack_from(">H", data, 20 + n * 30 + 22)[0] * 2 for n in range(31)]
    assert len(data) == 1084 + patterns * 1024 + sum(lengths)
    used = set()
    for pos in range(1084, 1084 + patterns * 1024, 4):
        a, b, c, d = data[pos:pos + 4]
        sample = (a & 0xF0) | (c >> 4)
        period = ((a & 15) << 8) | b
        if sample:
            assert 1 <= sample <= 31 and lengths[sample - 1] > 0
            assert 113 <= period <= 856
            used.add(sample)
        assert c & 15 in [0, 0xC, 0xF]
    if shutil.which("ffmpeg"):
        # Independent tracker engine checks every pattern/sample in the MOD.
        decoded = subprocess.run(["ffmpeg", "-v", "error", "-f", "libopenmpt", "-sample_rate", "22050", "-i", str(OUT / item["module"]), "-t", str(expected), "-f", "f32le", "-ac", "2", "-ar", "22050", "pipe:1"], check=True, capture_output=True)
        independent = np.frombuffer(decoded.stdout, dtype="<f4")
        assert len(independent) > expected * 22050 * 2 * .99
        assert np.isfinite(independent).all() and np.mean(independent ** 2) > .0001
    report.append({"id": item["id"], "seconds": round(expected, 3), "samplesUsed": len(used), "peakDbFS": item["peakDbFS"], "rmsDbFS": item["rmsDbFS"], "loopBoundarySampleDelta": int(np.max(np.abs(pcm[0].astype(int) - pcm[-1].astype(int)))), "moduleDecode": "ffmpeg/libopenmpt" if shutil.which("ffmpeg") else "not available"})
assert all((OUT / p).is_file() for item in manifest["tracks"] for p in [item["file"], item["module"]])
print(json.dumps(report, indent=2))
print("PASS five original PCM loops, bounded levels, no silence seam, MOD structure and independent decoding. No claim of human listening.")
(OUT / "verification.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
