"""Independent ZIP reader: payload allowlist, integrity, hashes and original audio."""
import hashlib
import json
from pathlib import Path
import sys
import subprocess
import zipfile

root = Path(__file__).resolve().parents[1]
assert (root / 'tools/Package-Local.ps1').is_file(), 'maintained package tool missing'
archive = Path(sys.argv[1])
build = json.loads((root / 'dist-day/local-build-info.json').read_text('utf-8-sig'))
audio_catalog = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./tools/pages-assets.cjs").musicFiles(process.cwd())))'], cwd=root, text=True))
approved = {'Jouer-Technoprof-Fenetre.html', 'Jouer-Technoprof-Journee-Atelier.html', 'Jouer.cmd', 'Creer-raccourci.cmd', 'Technoprof.ico', 'LIRE-MOI-LOCAL.txt', 'RETOURS-TEST.txt'} | set(audio_catalog)
assert len(approved) == 24 and len(audio_catalog) == 17
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    names = set(z.namelist())
    manifest = json.loads(z.read('Technoprof/BUILD-INFO.json').decode('utf-8-sig'))
    files = manifest['files']
    expected = {'Technoprof/' + name for name in approved} | {'Technoprof/BUILD-INFO.json'}
    assert len(z.infolist()) == len(names) == 25, 'reject duplicate and extra entries'
    assert names == expected, names ^ expected
    assert len(files) == len({f['path'] for f in files}) == 24
    assert {f['path'] for f in files} == approved
    assert len(manifest['commit']) == 40 and manifest['profile'] == 'journee-musicale-locale'
    assert manifest['commit'] == build['commit'], 'package must match the recorded day build'
    assert hashlib.sha256(z.read('Technoprof/Jouer-Technoprof-Journee-Atelier.html')).hexdigest() == build['htmlSha256']
    assert hashlib.sha256(z.read('Technoprof/Jouer-Technoprof-Fenetre.html')).hexdigest() == build['launcherSha256']
    assert hashlib.sha256(z.read('Technoprof/Technoprof.ico')).hexdigest() == build['iconSha256']
    audio = [f for f in files if f['path'].startswith('audio/')]
    assert len(audio) == 17
    assert {f['path'] for f in audio} == set(audio_catalog)
    for f in files:
        content = z.read('Technoprof/' + f['path'])
        assert len(content) == f['bytes']
        assert hashlib.sha256(content).hexdigest() == f['sha256']
        assert content == (root / f['path']).read_bytes(), f['path']
    assert all(not any(x in name for x in ['node_modules', 'work/', '.git/', 'archives/']) for name in names)
    launcher = z.read('Technoprof/Jouer-Technoprof-Fenetre.html').decode('utf-8')
    assert 'musique=essai&fenetre=1' in launcher
    assert len(z.read('Technoprof/Jouer-Technoprof-Journee-Atelier.html')) > 100_000_000
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
checksum = archive.with_suffix(archive.suffix + '.sha256').read_text('utf-8-sig').strip()
assert checksum == digest + '  ' + archive.name
print(f'PASS independent ZIP integrity, exact allowlist, {len(files)} unchanged files, 17 original WAVs, manifest and checksum')
