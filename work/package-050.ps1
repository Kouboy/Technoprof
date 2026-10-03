$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\don_n\Documents\Codex\Technoprof'
Set-Location -LiteralPath $taskRoot
$utf8 = [System.Text.UTF8Encoding]::new($false)
$hash = (Get-FileHash -LiteralPath 'Jouer-Technoprof.html' -Algorithm SHA256).Hash
$baseline = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.49.html' -Algorithm SHA256).Hash
if ($baseline -ne '3D7095A79CCBD6C5BFCAAF197BBD78B7693C6D87B8E76932FC77BB5AF7235DF3') { throw '0.49 baseline changed' }
$files = @(Get-ChildItem -File -Filter 'Jouer-*.html' | Where-Object { $_.Name -notmatch '\d\.\d' } | ForEach-Object { $_.FullName })
$files += @('Jouer.cmd','LIRE-MOI-LOCAL.txt','GAMEPLAY-0.43.md','GAMEPLAY-0.44.md','GAMEPLAY-0.45.md','GAMEPLAY-0.46.md','GAMEPLAY-0.47.md','GAMEPLAY-0.48.md','GAMEPLAY-0.49.md','GAMEPLAY-0.50.md')
Compress-Archive -LiteralPath $files -DestinationPath 'Technoprof-0.50-local.zip' -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath 'Jouer-Technoprof.html','Jouer.cmd','LIRE-MOI-TEST.txt','RETOURS-TEST.txt' -DestinationPath 'Technoprof-0.50-testeurs.zip' -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$report = @(
 'TECHNOPROF 0.50 - verification 2026-10-01',
 'npm test: PASS (work/tests-050.txt). TypeScript/Vite build: PASS (work/build-050.txt). Autonomous export and 13 shortcuts: PASS.',
 'School feet: shared four-logical-pixel presentation offset; contact shadows, book motion, impacts, particles and fall cropping follow it. Simulation jump height, hitboxes, timings and access rules unchanged.',
 'Dialogue geometry: all four speakers and both pages stay within viewport, bubble border at least six pixels above conservative head bounds, tail at least four pixels above face.',
 'Browser: student, parent, inspectrice and guard conversations observed in their actual rooms. Repeated rendering does not drift the feet. Fall verified at two depths by actual floor click and workshop steps; foreground lip occludes the body. Console warn/error logs empty.',
 'Captures: work/inspectrice-050.png, work/chute-050.png.',
 'Controls regressions: aliases, keyboard/mouse/touch, dialogues and deterministic gesture road pass; first route arrives with vehicle 100%, collisions 0.',
 'Limitation: real-time fluidity, audio and tactile comfort still require human play. No actual phone validation claimed.',
 'Known build warnings: embedded bundle over 500 kB; experimental Node stripTypeScriptTypes.',
 "Standalone SHA256: $hash",
 "0.49 baseline unchanged: $baseline"
)
foreach ($name in @('Technoprof-0.50-local.zip','Technoprof-0.50-testeurs.zip')) {
 $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $taskRoot $name))
 try {
  $entry = $zip.GetEntry('Jouer-Technoprof.html')
  if (!$entry) { throw "Missing game in $name" }
  $stream = $entry.Open()
  $sha = [Security.Cryptography.SHA256]::Create()
  try { $entryHash = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose(); $sha.Dispose() }
  if ($entryHash -ne $hash) { throw "Hash mismatch in $name" }
  $expected = if ($name -like '*local*') { 24 } else { 4 }
  if ($zip.Entries.Count -ne $expected) { throw "Unexpected entry count in $name" }
  $report += "$name : $($zip.Entries.Count) entries, matching game hash, $((Get-Item -LiteralPath $name).Length) bytes"
 } finally { $zip.Dispose() }
}
[IO.File]::WriteAllLines((Join-Path $taskRoot 'work/validation-050.txt'),$report,$utf8)
$report
