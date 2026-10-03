$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\don_n\Documents\Codex\Technoprof'
Set-Location -LiteralPath $taskRoot
$utf8 = [System.Text.UTF8Encoding]::new($false)
$hash = (Get-FileHash -LiteralPath 'Jouer-Technoprof.html' -Algorithm SHA256).Hash
$baseline = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.51.html' -Algorithm SHA256).Hash
if ($baseline -ne '18A6E2558E29E7E2545CB9E571CDE037CDA1736CA0215A341546E9A7758ABC60') { throw '0.51 baseline changed' }
Copy-Item -LiteralPath 'Jouer-Technoprof.html' -Destination 'Jouer-Technoprof-0.52.html'
$files = @(Get-ChildItem -File -Filter 'Jouer-*.html' | Where-Object { $_.Name -notmatch '\d\.\d' } | ForEach-Object { $_.FullName })
$files += @('Jouer.cmd','LIRE-MOI-LOCAL.txt','GAMEPLAY-0.43.md','GAMEPLAY-0.44.md','GAMEPLAY-0.45.md','GAMEPLAY-0.46.md','GAMEPLAY-0.47.md','GAMEPLAY-0.48.md','GAMEPLAY-0.49.md','GAMEPLAY-0.50.md','GAMEPLAY-0.51.md','GAMEPLAY-0.52.md')
Compress-Archive -LiteralPath $files -DestinationPath 'Technoprof-0.52-local.zip' -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath 'Jouer-Technoprof.html','Jouer.cmd','LIRE-MOI-TEST.txt','RETOURS-TEST.txt' -DestinationPath 'Technoprof-0.52-testeurs.zip' -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$report = @(
 'TECHNOPROF 0.52 - verification 2026-10-01',
 'npm test: PASS (work/tests-052.txt). TypeScript/Vite build: PASS (work/build-052.txt). Autonomous export and 13 shortcuts: PASS.',
 'Road: six new prop variants; stable identities at district boundaries; shared graphics/sprite depth; bridge continuous across player plane; truck clearance; integer clipped bridge drawing.',
 'Browser: concrete bridge, steel/masonry at evening, underside after crossing, public facilities, trees and workshops observed at native 640x480. No warn/error logs.',
 'Captures: work/route-pont-052.png, route-public-052.png, route-arbres-052.png, route-sous-pont-052.png, route-acier-052.png, route-ateliers-052.png.',
 'Browser limitation: IAB transport cannot load the 69.94MB single HTML (native frame limit). Visual checks used identical Vite source modules on loopback 5174, not the standalone. Export script/dependencies/hash checked; habitual browser and actual driving feel still require user validation.',
 'Generation: original RGBA atlas art/road-52/district.png; final prompt art/road-52/prompts.txt; no source image manipulation.',
 'Radio: shared Radio Educ France name in spoken bulletin and subtitle; CADRE radio label simplified. No sound overhaul in this lot.',
 'Known build warnings: embedded bundle over 500 kB; experimental Node stripTypeScriptTypes.',
 "Standalone SHA256: $hash",
 "0.51 baseline unchanged: $baseline"
)
foreach ($name in @('Technoprof-0.52-local.zip','Technoprof-0.52-testeurs.zip')) {
 $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $taskRoot $name))
 try {
  $entry = $zip.GetEntry('Jouer-Technoprof.html')
  if (!$entry) { throw "Missing game in $name" }
  $stream = $entry.Open()
  $sha = [Security.Cryptography.SHA256]::Create()
  try { $entryHash = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose(); $sha.Dispose() }
  if ($entryHash -ne $hash) { throw "Hash mismatch in $name" }
  $expected = if ($name -like '*local*') { 26 } else { 4 }
  if ($zip.Entries.Count -ne $expected) { throw "Unexpected entry count in $name" }
  $report += "$name : $($zip.Entries.Count) entries, matching game hash, $((Get-Item -LiteralPath $name).Length) bytes"
 } finally { $zip.Dispose() }
}
[IO.File]::WriteAllLines((Join-Path $taskRoot 'work/validation-052.txt'),$report,$utf8)
$report
