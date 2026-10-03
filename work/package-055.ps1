$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\don_n\Documents\Codex\Technoprof'
Set-Location -LiteralPath $taskRoot
$baseline = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.54.html' -Algorithm SHA256).Hash
if ($baseline -ne '5F348A49B65CE73161F8E34A1D4454D51C7E3A2CAF6924A608086E0CD6335256') { throw '0.54 baseline changed' }
$hash = (Get-FileHash -LiteralPath 'Jouer-Technoprof.html' -Algorithm SHA256).Hash
Copy-Item -LiteralPath 'Jouer-Technoprof.html' -Destination 'Jouer-Technoprof-0.55.html'
$files = @(Get-ChildItem -File -Filter 'Jouer-*.html' | Where-Object { $_.Name -notmatch '\d\.\d' } | ForEach-Object { $_.FullName })
$files += @('Jouer.cmd','LIRE-MOI-LOCAL.txt')
foreach ($taskVersion in 43..55) { $files += ('GAMEPLAY-0.' + $taskVersion + '.md') }
Compress-Archive -LiteralPath $files -DestinationPath 'Technoprof-0.55-local.zip' -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath 'Jouer-Technoprof.html','Jouer.cmd','LIRE-MOI-TEST.txt','RETOURS-TEST.txt' -DestinationPath 'Technoprof-0.55-testeurs.zip' -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$report = @(
 'TECHNOPROF 0.55 - lot 0 validation',
 'npm test: PASS (17 scripts, work/tests-055.txt). Build TypeScript/Vite: PASS (work/build-055.txt). Local export and 13 shortcuts: PASS.',
 '055: all eight lateral arrows via visible centres at 15/30/60/120 fps; nine vertical exits and classroom; matching bitmap bounds; passage consumption and frozen fade.',
 'Keyboard directions, opposed input, recoil/attack/airborne gates, closed edges, pause/hurt cancellation, explicit marker priority and keyboard takeover: PASS.',
 'Actual Pointer Events adapter: mouse and touch at desktop/phone-scale canvas sizes, capture release and transition: PASS. Physical-phone testing pending.',
 'Browser: arrow cour -> hall -> cour -> hall, door indicator -> annexe, movement/fade/stop observed at workshop steps; no warn/error console logs. Vite source preview, giant standalone not played through IAB.',
 'Captures: work/passages-hall-055.png, work/passages-retour-055.png, work/passages-annexe-055.png.',
 'Known tooling notices: Vite bundle size and Node experimental stripTypeScriptTypes. First-mission calibration, continuous human play and phone performance remain lot 1.',
 "Standalone SHA256: $hash",
 "0.54 baseline unchanged: $baseline"
)
foreach ($name in @('Technoprof-0.55-local.zip','Technoprof-0.55-testeurs.zip')) {
 $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $taskRoot $name))
 try {
  $entry = $zip.GetEntry('Jouer-Technoprof.html')
  if (!$entry) { throw "Missing game in $name" }
  $stream = $entry.Open(); $sha = [Security.Cryptography.SHA256]::Create()
  try { $entryHash = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose(); $sha.Dispose() }
  if ($entryHash -ne $hash) { throw "Hash mismatch in $name" }
  $expected = if ($name -like '*local*') { 29 } else { 4 }
  if ($zip.Entries.Count -ne $expected) { throw "Unexpected entry count in $name" }
  $report += "$name : $($zip.Entries.Count) entries, matching game hash, $((Get-Item -LiteralPath $name).Length) bytes"
 } finally { $zip.Dispose() }
}
[IO.File]::WriteAllLines((Join-Path $taskRoot 'work/validation-055.txt'),$report,[System.Text.UTF8Encoding]::new($false))
$report
