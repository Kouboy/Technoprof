$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $taskRoot
if ((Get-Content -LiteralPath 'package.json' -Raw | ConvertFrom-Json).version -ne '0.61.0') { throw 'Expected source version 0.61.0' }
$baselinePath = Join-Path $taskRoot 'Jouer-Technoprof-0.60.html'
if (Test-Path -LiteralPath $baselinePath) {
  if ((Get-FileHash -LiteralPath $baselinePath -Algorithm SHA256).Hash -ne 'EF98F0F98C6EB73BAE83B15313756BBA63D6538002EB4AEF78216FEC9E4E90AF') { throw 'Frozen 0.60 changed' }
}
$hash = (Get-FileHash -LiteralPath 'Jouer-Technoprof.html' -Algorithm SHA256).Hash
$frozenPath = Join-Path $taskRoot 'Jouer-Technoprof-0.61.html'
if ((Test-Path -LiteralPath $frozenPath) -and ((Get-FileHash -LiteralPath $frozenPath -Algorithm SHA256).Hash -ne $hash)) { throw 'Existing 0.61 differs; preserve before replacing' }
Copy-Item -LiteralPath 'Jouer-Technoprof.html' -Destination $frozenPath
$files = @(Get-ChildItem -File -Filter 'Jouer-*.html' | Where-Object { $_.Name -notmatch '\d\.\d' } | ForEach-Object { $_.FullName })
$files += @('Jouer.cmd','LIRE-MOI-LOCAL.txt')
foreach ($taskVersion in 43..61) { $files += ('GAMEPLAY-0.' + $taskVersion + '.md') }
Compress-Archive -LiteralPath $files -DestinationPath 'Technoprof-0.61-local.zip' -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath 'Jouer-Technoprof.html','Jouer.cmd','LIRE-MOI-TEST.txt','RETOURS-TEST.txt' -DestinationPath 'Technoprof-0.61-testeurs.zip' -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$report = @('TECHNOPROF 0.61: former second journey density on first road, then x1/x2/x4 nominal density. Alternating two-lane waves at midi/twilight.',
 'TypeScript/Vite/export and 23-script suite PASS. 60 first assignments, 36 full three-school days and 9 confirmed clean roads; synthetic controls/FPS do not replace human testing.',
 'Confirmed clean road crossings: 22-24 / 39 / 73-75. No vehicle respawn at assignment. Anticipatory driver used on the two dense roads; delayed simple driver can fail.',
 'Compiled workshop observed: first road and twilight cruising, reveal after fade at 1.3s, no console errors in inspected trial. Full human high-speed/audio/phone validation pending.',
 "Autonomous HTML SHA256: $hash")
foreach ($name in @('Technoprof-0.61-local.zip','Technoprof-0.61-testeurs.zip')) {
 $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $taskRoot $name))
 try {
  $entry = $zip.GetEntry('Jouer-Technoprof.html'); if (!$entry) { throw "Missing game in $name" }
  $stream=$entry.Open(); $sha=[Security.Cryptography.SHA256]::Create()
  try { $entryHash=[Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose();$sha.Dispose() }
  if ($entryHash -ne $hash) { throw "HTML hash mismatch in $name" }
  $expected = if ($name -like '*local*') { 35 } else { 4 }
  if ($zip.Entries.Count -ne $expected) { throw "Entry count mismatch in $name" }
  $report += "$name : $($zip.Entries.Count) entries, matching game, $((Get-Item -LiteralPath $name).Length) bytes"
 } finally { $zip.Dispose() }
}
[IO.File]::WriteAllLines((Join-Path $taskRoot 'work/validation-061.txt'),$report,[Text.UTF8Encoding]::new($false))
$checksumLines = @('Technoprof-0.61-local.zip','Technoprof-0.61-testeurs.zip') | ForEach-Object { "$((Get-FileHash -LiteralPath $_ -Algorithm SHA256).Hash.ToLower())  $_" }
[IO.File]::WriteAllLines((Join-Path $taskRoot 'work/SHA256SUMS-0.61.txt'),$checksumLines,[Text.UTF8Encoding]::new($false))
$report
