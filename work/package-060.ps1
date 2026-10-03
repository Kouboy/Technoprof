$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\don_n\Documents\Codex\Technoprof'
Set-Location -LiteralPath $taskRoot
$baseline = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.57.html' -Algorithm SHA256).Hash
if ($baseline -ne '17065A1E836764ED03F641F1A39B3C02AF0229C683818F1D220C2DF7E9F7D1FE') { throw '0.57 baseline changed' }
$previous = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.58.html' -Algorithm SHA256).Hash
if ($previous -ne '8015A00054DCB11450F8D6C14CC73E9CA5A6E5B393E28BA2539E36C42FC0F196') { throw '0.58 baseline changed' }
$recent = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.59.html' -Algorithm SHA256).Hash
if ($recent -ne '21486F80BFB19166CFB2D31AEA859EF37C9E23B8AC098EEE49EFF3555B183744') { throw '0.59 baseline changed' }
$hash = (Get-FileHash -LiteralPath 'Jouer-Technoprof.html' -Algorithm SHA256).Hash
Copy-Item -LiteralPath 'Jouer-Technoprof.html' -Destination 'Jouer-Technoprof-0.60.html'
$files = @(Get-ChildItem -File -Filter 'Jouer-*.html' | Where-Object { $_.Name -notmatch '\d\.\d' } | ForEach-Object { $_.FullName })
$files += @('Jouer.cmd','LIRE-MOI-LOCAL.txt')
foreach ($taskVersion in 43..60) { $files += ('GAMEPLAY-0.' + $taskVersion + '.md') }
Compress-Archive -LiteralPath $files -DestinationPath 'Technoprof-0.60-local.zip' -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath 'Jouer-Technoprof.html','Jouer.cmd','LIRE-MOI-TEST.txt','RETOURS-TEST.txt' -DestinationPath 'Technoprof-0.60-testeurs.zip' -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$report = @(
 'TECHNOPROF 0.60 - exponential workload: minimum rooms 9/18/36, encounters 3/6/12, actual traffic about 10/20/40.',
 'npm test PASS (22 scripts). TypeScript/Vite build and autonomous HTML with 13 lightweight shortcuts PASS.',
 '60 first assignments and 36 full days plus 6 exposure and 4 progression runs: keyboard/direct, both paths, synthetic 30/60/120 fps. Human difficulty and physical-phone tests pending.',
 'Measured passing exposure: about 10 / 20-22 / 35-40 in continuous reference days; two clean anticipatory third-road runs reach 42. No notification respawn.',
 'Compiled browser observed via localhost: new Bruel encounter, reveal/confirm without attack, twilight corridor 60 -> classroom 61 through direct input, frozen speech clock, no browser errors. Not file:// or physical-phone validation.',
 '29 PNG assets, about 87.6 MB autonomous HTML; Vite large-chunk and Node experimental TypeScript notices remain known.',
 "Standalone SHA256: $hash",
 "0.59 unchanged: $recent",
 "0.58 unchanged: $previous",
 "0.57 unchanged: $baseline"
)
foreach ($name in @('Technoprof-0.60-local.zip','Technoprof-0.60-testeurs.zip')) {
 $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $taskRoot $name))
 try {
  $entry = $zip.GetEntry('Jouer-Technoprof.html')
  if (!$entry) { throw "Missing game in $name" }
  $stream = $entry.Open(); $sha = [Security.Cryptography.SHA256]::Create()
  try { $entryHash = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose(); $sha.Dispose() }
  if ($entryHash -ne $hash) { throw "Hash mismatch in $name" }
  $expected = if ($name -like '*local*') { 34 } else { 4 }
  if ($zip.Entries.Count -ne $expected) { throw "Unexpected entry count in $name" }
  $report += "$name : $($zip.Entries.Count) entries, matching game hash, $((Get-Item -LiteralPath $name).Length) bytes"
 } finally { $zip.Dispose() }
}
[IO.File]::WriteAllLines((Join-Path $taskRoot 'work/validation-060.txt'),$report,[System.Text.UTF8Encoding]::new($false))
$report

