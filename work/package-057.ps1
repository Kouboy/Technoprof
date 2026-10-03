$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\don_n\Documents\Codex\Technoprof'
Set-Location -LiteralPath $taskRoot
$baseline = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.56.html' -Algorithm SHA256).Hash
if ($baseline -ne '7B7C5FC4F42C8B9B75961136851674FC8B67B917178ADA96D7E245814EC32894') { throw '0.56 baseline changed' }
$hash = (Get-FileHash -LiteralPath 'Jouer-Technoprof.html' -Algorithm SHA256).Hash
Copy-Item -LiteralPath 'Jouer-Technoprof.html' -Destination 'Jouer-Technoprof-0.57.html'
$files = @(Get-ChildItem -File -Filter 'Jouer-*.html' | Where-Object { $_.Name -notmatch '\d\.\d' } | ForEach-Object { $_.FullName })
$files += @('Jouer.cmd','LIRE-MOI-LOCAL.txt')
foreach ($taskVersion in 43..57) { $files += ('GAMEPLAY-0.' + $taskVersion + '.md') }
Compress-Archive -LiteralPath $files -DestinationPath 'Technoprof-0.57-local.zip' -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath 'Jouer-Technoprof.html','Jouer.cmd','LIRE-MOI-TEST.txt','RETOURS-TEST.txt' -DestinationPath 'Technoprof-0.57-testeurs.zip' -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$report = @(
 'TECHNOPROF 0.57 - lot 2 integrated: three schools; human discovery and physical-phone tests pending.',
 'npm test PASS (19 scripts). TypeScript/Vite build PASS. Single autonomous HTML and 13 lightweight shortcuts PASS.',
 '36 full continuous days / 108 assignments: 2 paths, keyboard/direct, 3 seeds, 30/60/120 synthetic fps. No post-start position/HP/timer/phase/enemy writes. Three wins, no falls/chocs, exact charged-clock accounting.',
 'New introductions, locked classroom, failure-to-next, frontal/back security guard, slow turn, projectile dodge/contact/cleanup and non-self-defeating parent boss PASS.',
 'Compiled browser observed via localhost: Bruel courtyard -> vestibule by mouse, female phone parent and complete bubble; both arenas/targets and different arrivals. This is not standalone file:// or phone validation.',
 '28 PNG, 61580909 compressed bytes, 176182848 estimated source RGBA bytes. Original sheets conserved. Runtime releases 15 prepared sources. No claim of overall process/GPU memory reduction.',
 'Known tooling notices: Vite large bundle, Node experimental TypeScript stripper. Game is about 83.7 MB.',
 "Standalone SHA256: $hash",
 "0.56 unchanged: $baseline"
)
foreach ($name in @('Technoprof-0.57-local.zip','Technoprof-0.57-testeurs.zip')) {
 $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $taskRoot $name))
 try {
  $entry = $zip.GetEntry('Jouer-Technoprof.html')
  if (!$entry) { throw "Missing game in $name" }
  $stream = $entry.Open(); $sha = [Security.Cryptography.SHA256]::Create()
  try { $entryHash = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose(); $sha.Dispose() }
  if ($entryHash -ne $hash) { throw "Hash mismatch in $name" }
  $expected = if ($name -like '*local*') { 31 } else { 4 }
  if ($zip.Entries.Count -ne $expected) { throw "Unexpected entry count in $name" }
  $report += "$name : $($zip.Entries.Count) entries, matching game hash, $((Get-Item -LiteralPath $name).Length) bytes"
 } finally { $zip.Dispose() }
}
[IO.File]::WriteAllLines((Join-Path $taskRoot 'work/validation-057.txt'),$report,[System.Text.UTF8Encoding]::new($false))
$report
