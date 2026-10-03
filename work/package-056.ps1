$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\don_n\Documents\Codex\Technoprof'
Set-Location -LiteralPath $taskRoot
$baseline = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.55.html' -Algorithm SHA256).Hash
if ($baseline -ne 'AE9B54B1E59E8428252FA61A362CC4C57CDF4E6F639F99CC0CD9B73485B7AFD9') { throw '0.55 baseline changed' }
$hash = (Get-FileHash -LiteralPath 'Jouer-Technoprof.html' -Algorithm SHA256).Hash
Copy-Item -LiteralPath 'Jouer-Technoprof.html' -Destination 'Jouer-Technoprof-0.56.html'
$files = @(Get-ChildItem -File -Filter 'Jouer-*.html' | Where-Object { $_.Name -notmatch '\d\.\d' } | ForEach-Object { $_.FullName })
$files += @('Jouer.cmd','LIRE-MOI-LOCAL.txt')
foreach ($taskVersion in 43..56) { $files += ('GAMEPLAY-0.' + $taskVersion + '.md') }
Compress-Archive -LiteralPath $files -DestinationPath 'Technoprof-0.56-local.zip' -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath 'Jouer-Technoprof.html','Jouer.cmd','LIRE-MOI-TEST.txt','RETOURS-TEST.txt' -DestinationPath 'Technoprof-0.56-testeurs.zip' -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$report = @(
 'TECHNOPROF 0.56 - lot 1 technical delivery; human discovery and physical-phone validation pending.',
 'npm test: PASS (18 scripts, work/tests-056.txt). Build TypeScript/Vite: PASS (work/build-056.txt). Local export and 13 shortcuts: PASS.',
 '60 continuous keyboard/direct journeys: two paths, five seeds, 30/60/120 synthetic fps. Timer accounting, reading/cinema/fade suspension, real entries, both boss threats, course/ellipse/cruising: PASS.',
 'Slow reading, coast timeout, no-steering damage and naive boss strike costs measured. Swipe against blocked boundary terminates. Runtime histogram bounded; 13 raw source textures removed after independent atlas preparation.',
 'Compiled browser: route, inspector, guard/book impact, normal radio -> DATA -> road, pause/export button observed; actual 1446-byte JSON export parsed. No warn/error console logs observed.',
 'PC sample: 20.45 s simulated, 2095 wall-frame intervals, p50 10 ms / p95 11 ms / p99 11 ms / max 65.3 ms; not full-day or phone validation. Production served via localhost, not standalone file://.',
 'Evidence: work/mission-results-056.json and .csv; work/resource-budget-056.json; work/runtime-compiled-056.json; work/journal-browser-056.json; work/pause-export-056.png.',
 'Known tooling notices: Vite bundle size, Node experimental stripTypeScriptTypes. HTML remains about 70 MB. Reduced source copies do not prove reduced total process heap.',
 "Standalone SHA256: $hash",
 "0.55 baseline unchanged: $baseline"
)
foreach ($name in @('Technoprof-0.56-local.zip','Technoprof-0.56-testeurs.zip')) {
 $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $taskRoot $name))
 try {
  $entry = $zip.GetEntry('Jouer-Technoprof.html')
  if (!$entry) { throw "Missing game in $name" }
  $stream = $entry.Open(); $sha = [Security.Cryptography.SHA256]::Create()
  try { $entryHash = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose(); $sha.Dispose() }
  if ($entryHash -ne $hash) { throw "Hash mismatch in $name" }
  $expected = if ($name -like '*local*') { 30 } else { 4 }
  if ($zip.Entries.Count -ne $expected) { throw "Unexpected entry count in $name" }
  $report += "$name : $($zip.Entries.Count) entries, matching game hash, $((Get-Item -LiteralPath $name).Length) bytes"
 } finally { $zip.Dispose() }
}
[IO.File]::WriteAllLines((Join-Path $taskRoot 'work/validation-056.txt'),$report,[System.Text.UTF8Encoding]::new($false))
$report
