$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\don_n\Documents\Codex\Technoprof'
Set-Location -LiteralPath $taskRoot
$utf8 = [System.Text.UTF8Encoding]::new($false)
$hash = (Get-FileHash -LiteralPath 'Jouer-Technoprof.html' -Algorithm SHA256).Hash
$baseline = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.50.html' -Algorithm SHA256).Hash
if ($baseline -ne 'B26EE1CB9D834E5079A93F25D9DA65D6488C8ABCF8965D4F026674773E1160E4') { throw '0.50 baseline changed' }
$files = @(Get-ChildItem -File -Filter 'Jouer-*.html' | Where-Object { $_.Name -notmatch '\d\.\d' } | ForEach-Object { $_.FullName })
$files += @('Jouer.cmd','LIRE-MOI-LOCAL.txt','GAMEPLAY-0.43.md','GAMEPLAY-0.44.md','GAMEPLAY-0.45.md','GAMEPLAY-0.46.md','GAMEPLAY-0.47.md','GAMEPLAY-0.48.md','GAMEPLAY-0.49.md','GAMEPLAY-0.50.md','GAMEPLAY-0.51.md')
Compress-Archive -LiteralPath $files -DestinationPath 'Technoprof-0.51-local.zip' -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath 'Jouer-Technoprof.html','Jouer.cmd','LIRE-MOI-TEST.txt','RETOURS-TEST.txt' -DestinationPath 'Technoprof-0.51-testeurs.zip' -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$report = @(
 'TECHNOPROF 0.51 - verification 2026-10-01',
 'npm test: PASS (work/tests-051.txt). TypeScript/Vite build: PASS (work/build-051.txt). Autonomous export and 13 shortcuts: PASS.',
 'HUD: five-pixel secondary labels, narrower 18-pixel clock, separate distance units and service label. Integer drawing, viewport bounds, actual font widths and read-only render verified across all phases.',
 'Behavior: destination hidden before notification, reveal, shared/suspended clock, terminal causes, urgency and strict 1000m/500m distance thresholds preserved.',
 'Browser: radio, reception, route, proximity, college and urgency observed. Both phases checked at native 640x480, then route at viewport 844x390. No warn/error logs.',
 'Captures: work/cadre-college-051.png, work/cadre-route-051.png, work/cadre-mobile-051.png.',
 'Limitation: primary numbers remain identifiable in mobile landscape; secondary labels are small at that scale. Actual-phone legibility and subjective visual preference still require human testing.',
 'Known build warnings: embedded bundle over 500 kB; experimental Node stripTypeScriptTypes.',
 "Standalone SHA256: $hash",
 "0.50 baseline unchanged: $baseline"
)
foreach ($name in @('Technoprof-0.51-local.zip','Technoprof-0.51-testeurs.zip')) {
 $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $taskRoot $name))
 try {
  $entry = $zip.GetEntry('Jouer-Technoprof.html')
  if (!$entry) { throw "Missing game in $name" }
  $stream = $entry.Open()
  $sha = [Security.Cryptography.SHA256]::Create()
  try { $entryHash = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose(); $sha.Dispose() }
  if ($entryHash -ne $hash) { throw "Hash mismatch in $name" }
  $expected = if ($name -like '*local*') { 25 } else { 4 }
  if ($zip.Entries.Count -ne $expected) { throw "Unexpected entry count in $name" }
  $report += "$name : $($zip.Entries.Count) entries, matching game hash, $((Get-Item -LiteralPath $name).Length) bytes"
 } finally { $zip.Dispose() }
}
[IO.File]::WriteAllLines((Join-Path $taskRoot 'work/validation-051.txt'),$report,$utf8)
$report
