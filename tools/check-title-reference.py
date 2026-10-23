"""Independent technical checks of the reference arrangement; no artistic verdict."""
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import wave
import numpy as np

root = Path(__file__).resolve().parents[1]
out = root / "audio/titre-reference-2026-10-23"
manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
score = json.loads((out / "Technoprof-Titre-Interpretation.score.json").read_text(encoding="utf-8"))
assert [s["id"] for s in manifest["sections"]] == ["A0", "B1", "C2", "D3", "C4", "E5"]
assert sum(s["durationSeconds"] for s in manifest["sections"]) == manifest["seconds"] == 60
assert manifest["sampleBits"] == 8 and manifest["trackerChannels"] == 4
assert manifest["bpm"] == score["bpm"] == 80
assert all(len(row) == 4 for row in score["cells"])
assert len(score["cells"]) == 320
wav = out / manifest["wav"]
assert hashlib.sha256(wav.read_bytes()).hexdigest() == manifest["wavSha256"]
with wave.open(str(wav)) as stream:
    assert stream.getnchannels() == 2 and stream.getsampwidth() == 2 and stream.getframerate() == 22050
    pcm = np.frombuffer(stream.readframes(stream.getnframes()), dtype="<i2").reshape(-1, 2)
assert len(pcm) == 60 * 22050
assert np.max(np.abs(pcm.astype(int))) < 32767
assert np.max(np.abs(pcm[0].astype(int) - pcm[-1].astype(int))) <= 1
for window in [pcm[:2205], pcm[-2205:]]:
    assert np.sqrt(np.mean((window.astype(float) / 32768) ** 2)) > .004
data = (out / manifest["module"]).read_bytes()
assert data[1080:1084] == b"M.K."
lengths = [struct.unpack_from(">H", data, 20 + i * 30 + 22)[0] * 2 for i in range(31)]
assert sum(bool(n) for n in lengths) == manifest["samples"] == 26
assert data[950] == 5 and list(data[952:957]) == [0, 1, 2, 3, 4]
assert len(data) == 1084 + 5 * 1024 + sum(lengths)
used = set()
for pos in range(1084, 1084 + 5 * 1024, 4):
    a, b, c, d = data[pos:pos + 4]
    sample, period = (a & 0xF0) | (c >> 4), ((a & 15) << 8) | b
    if sample:
        assert 1 <= sample <= 26 and lengths[sample - 1] and 113 <= period <= 856
        used.add(sample)
    assert c & 15 in [0, 0xC, 0xF]
decoded = subprocess.run(["ffmpeg", "-v", "error", "-f", "libopenmpt", "-sample_rate", "22050", "-i", str(out / manifest["module"]), "-t", "60", "-f", "f32le", "-ac", "2", "-ar", "22050", "pipe:1"], check=True, capture_output=True)
assert len(used) == len([n for n in lengths if n]), "No unused embedded samples."
independent = np.frombuffer(decoded.stdout, dtype="<f4")
assert len(independent) >= 60 * 22050 * 2 * .99
assert np.isfinite(independent).all() and np.mean(independent ** 2) > .0001
report = {"seconds": 60, "bpm": 80, "sections": [s["id"] for s in manifest["sections"]], "sourceShortenedFromSeconds": manifest["sourceSeconds"],
          "samples8Bit": 26, "usedSamples": len(used), "trackerChannels": 4, "peakDbFS": manifest["peakDbFS"],
          "rmsDbFS": manifest["rmsDbFS"], "clipping": False, "silentLoopSeam": False,
          "loopBoundarySampleDelta": int(np.max(np.abs(pcm[0].astype(int) - pcm[-1].astype(int)))), "independentModuleDecode": "ffmpeg/libopenmpt",
          "artisticListening": "not assessed"}
(out / "verification.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, indent=2)); print("PASS source-form condensation, PCM level/seam and independent MOD decode.")
