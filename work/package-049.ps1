$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\don_n\Documents\Codex\Technoprof'
Set-Location -LiteralPath $taskRoot
$utf8 = [System.Text.UTF8Encoding]::new($false)
$hash = (Get-FileHash -LiteralPath 'Jouer-Technoprof.html' -Algorithm SHA256).Hash
$baseline = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.48.html' -Algorithm SHA256).Hash
if ($baseline -ne 'CE66E8A6E9F353C87FFB24FFE85E6C3059D22438512788BFA3FF5D6F481616AF') { throw '0.48 baseline changed' }
$files = @(Get-ChildItem -File -Filter 'Jouer-*.html' | Where-Object { $_.Name -notmatch '\d\.\d' } | ForEach-Object { $_.FullName })
$files += @('Jouer.cmd','LIRE-MOI-LOCAL.txt','GAMEPLAY-0.43.md','GAMEPLAY-0.44.md','GAMEPLAY-0.45.md','GAMEPLAY-0.46.md','GAMEPLAY-0.47.md','GAMEPLAY-0.48.md','GAMEPLAY-0.49.md')
Compress-Archive -LiteralPath $files -DestinationPath 'Technoprof-0.49-local.zip' -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath 'Jouer-Technoprof.html','Jouer.cmd','LIRE-MOI-TEST.txt','RETOURS-TEST.txt' -DestinationPath 'Technoprof-0.49-testeurs.zip' -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$report = @(
 'TECHNOPROF 0.49 - verification 2026-10-01',
 'npm test: PASS (work/tests-049.txt). TypeScript/Vite build: PASS (work/build-049.txt). Autonomous export and 13 shortcuts: PASS.',
 'Controls: ZQSD/F aliases, short presses, overlapping inputs, dialogue reveal/next/close without final strike, pause and keyboard takeover verified.',
 'Direct input: walk, diagonal swipe jump, approach and single strike, guard, doors/stairs, course, failure, road steering/gas/brake, cancellation and focus loss verified. Real Pointer Events adapter tested with mouse/touch events.',
 'Gesture-driven deterministic first route arrives: vehicle 100%, collisions 0, remaining 177.92 seconds.',
 'Browser: actual scene clicks advance a conversation without moving actors or clock; controls menu and welcome checked at 844x390 and 375x812. Latest standalone reloaded and mobile game captured with no virtual pad/buttons over the scene.',
 'Limitation: hidden browser pauses on long frames. Real-time fluidity, audio and control comfort require human testing, especially on an actual phone. No actual phone validation claimed.',
 'Known warnings: embedded bundle over 500 kB; experimental Node stripTypeScriptTypes.',
 "Standalone SHA256: $hash",
 "0.48 baseline unchanged: $baseline"
)
foreach ($name in @('Technoprof-0.49-local.zip','Technoprof-0.49-testeurs.zip')) {
 $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $taskRoot $name))
 try {
  $entry = $zip.GetEntry('Jouer-Technoprof.html')
  if (!$entry) { throw "Missing game in $name" }
  $stream = $entry.Open()
  $sha = [Security.Cryptography.SHA256]::Create()
  try { $entryHash = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose(); $sha.Dispose() }
  if ($entryHash -ne $hash) { throw "Hash mismatch in $name" }
  $expected = if ($name -like '*local*') { 23 } else { 4 }
  if ($zip.Entries.Count -ne $expected) { throw "Unexpected entry count in $name" }
  $report += "$name : $($zip.Entries.Count) entries, matching game hash, $((Get-Item -LiteralPath $name).Length) bytes"
 } finally { $zip.Dispose() }
}
[IO.File]::WriteAllLines((Join-Path $taskRoot 'work/validation-049.txt'),$report,$utf8)
$report
