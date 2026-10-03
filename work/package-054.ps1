$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\don_n\Documents\Codex\Technoprof'
Set-Location -LiteralPath $taskRoot
$utf8 = [System.Text.UTF8Encoding]::new($false)
$hash = (Get-FileHash -LiteralPath 'Jouer-Technoprof.html' -Algorithm SHA256).Hash
$baseline = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.53.html' -Algorithm SHA256).Hash
if ($baseline -ne 'B6CCA44EA69C7B00E3D90DCA4D35BB482088CB25FD957EC1604F25C2ECE441CB') { throw '0.53 baseline changed' }
Copy-Item -LiteralPath 'Jouer-Technoprof.html' -Destination 'Jouer-Technoprof-0.54.html'
$files = @(Get-ChildItem -File -Filter 'Jouer-*.html' | Where-Object { $_.Name -notmatch '\d\.\d' } | ForEach-Object { $_.FullName })
$files += @('Jouer.cmd','LIRE-MOI-LOCAL.txt')
foreach ($taskVersion in 43..54) { $files += ('GAMEPLAY-0.' + $taskVersion + '.md') }
Compress-Archive -LiteralPath $files -DestinationPath 'Technoprof-0.54-local.zip' -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath 'Jouer-Technoprof.html','Jouer.cmd','LIRE-MOI-TEST.txt','RETOURS-TEST.txt' -DestinationPath 'Technoprof-0.54-testeurs.zip' -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$report = @(
 'TECHNOPROF 0.54 - verification 2026-10-02',
 'npm test: PASS (work/tests-054.txt), including targeted 054 transitions/speech suite. TypeScript/Vite: PASS (work/build-054.txt). Autonomous export and 13 shortcuts: PASS.',
 'Reproduction 0.53: held DOWN across service/wing yielded room sequence 7 -> 3 -> 7 -> 3 -> 7. Fixed by release gate; lateral position alone no longer exits.',
 'Transitions: all 8 lateral/9 explicit links and spawns; player direction, landing/recovery gates; old/new 120ms/180ms fade, frozen mission clock and CADRE, rejected attack/jump, pause, restart, mouse/touch command cancellation.',
 'Speech: natural letters/digits only, 75ms minimum spacing, four profiles and female inspector, silent punctuation/pause/instant reveal, no queued backlog; short immediate sources, gesture gate, effects bus, pause/mute cancellation.',
 'Browser: real pointer passage 7 -> 3, full black above actors/props with CADRE visible, stable arrival, deliberate 3 -> 7 return, parent typewriter and full-page reveal. No warn/error console logs.',
 'Captures: work/transition-noir-054.png, work/transition-arrivee-054.png, work/dialogue-054.png. Browser used Vite source modules on local loopback 5174; giant standalone exceeds IAB transport limit.',
 'Human subjective audio and phone testing remain. Known warnings: embedded bundle over 500kB and experimental Node stripTypeScriptTypes.',
 "Standalone SHA256: $hash",
 "0.53 baseline unchanged: $baseline"
)
foreach ($name in @('Technoprof-0.54-local.zip','Technoprof-0.54-testeurs.zip')) {
 $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $taskRoot $name))
 try {
  $entry = $zip.GetEntry('Jouer-Technoprof.html')
  if (!$entry) { throw "Missing game in $name" }
  $stream = $entry.Open(); $sha = [Security.Cryptography.SHA256]::Create()
  try { $entryHash = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose(); $sha.Dispose() }
  if ($entryHash -ne $hash) { throw "Hash mismatch in $name" }
  $expected = if ($name -like '*local*') { 28 } else { 4 }
  if ($zip.Entries.Count -ne $expected) { throw "Unexpected entry count in $name" }
  $report += "$name : $($zip.Entries.Count) entries, matching game hash, $((Get-Item -LiteralPath $name).Length) bytes"
 } finally { $zip.Dispose() }
}
[IO.File]::WriteAllLines((Join-Path $taskRoot 'work/validation-054.txt'),$report,$utf8)
$report
