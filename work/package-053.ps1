$ErrorActionPreference = 'Stop'
$taskRoot = 'C:\Users\don_n\Documents\Codex\Technoprof'
Set-Location -LiteralPath $taskRoot
$utf8 = [System.Text.UTF8Encoding]::new($false)
$hash = (Get-FileHash -LiteralPath 'Jouer-Technoprof.html' -Algorithm SHA256).Hash
$baseline = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.52.html' -Algorithm SHA256).Hash
if ($baseline -ne 'DF8761406E4E9D3C9D17EF01CB28E8BFB35453D806EAF99B45F5B68C8F8927BF') { throw '0.52 baseline changed' }
Copy-Item -LiteralPath 'Jouer-Technoprof.html' -Destination 'Jouer-Technoprof-0.53.html'
$files = @(Get-ChildItem -File -Filter 'Jouer-*.html' | Where-Object { $_.Name -notmatch '\d\.\d' } | ForEach-Object { $_.FullName })
$files += @('Jouer.cmd','LIRE-MOI-LOCAL.txt','GAMEPLAY-0.43.md','GAMEPLAY-0.44.md','GAMEPLAY-0.45.md','GAMEPLAY-0.46.md','GAMEPLAY-0.47.md','GAMEPLAY-0.48.md','GAMEPLAY-0.49.md','GAMEPLAY-0.50.md','GAMEPLAY-0.51.md','GAMEPLAY-0.52.md','GAMEPLAY-0.53.md')
Compress-Archive -LiteralPath $files -DestinationPath 'Technoprof-0.53-local.zip' -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath 'Jouer-Technoprof.html','Jouer.cmd','LIRE-MOI-TEST.txt','RETOURS-TEST.txt' -DestinationPath 'Technoprof-0.53-testeurs.zip' -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$report = @(
 'TECHNOPROF 0.53 - verification 2026-10-01',
 'npm test: PASS (work/tests-053.txt). TypeScript/Vite build: PASS (work/build-053.txt). Autonomous export and 13 shortcuts: PASS.',
 'Audio: authored local PCM, cached 22050Hz material buffers, cooperative warmup without early context, five loop sources, speed/load/gear model, stereo near-pass, notification/radio priority, independent effects/voice/ambience including classroom.',
 'Audio lifecycle: 24-voice cap, node cleanup, scheduled-source cancellation on pause/mute/phase change, short gain release, class resume at saved offset, silence after ellipse, urgency excluded during suspended dialogue.',
 'Events: actual jump/solid landing/crumbling/fall recovery and boss release, no repeated passing sound. Existing gameplay suite passes.',
 'Browser: three settings, gesture-start, pause, mute/unmute and real book contact observed. No warn/error logs. Capture: work/audio-reglages-053.png.',
 'Browser scope: Vite source modules on loopback 5174. Giant standalone remains beyond IAB transport limit. Startup in hidden workshop triggered long-frame protection; no stable-FPS or subjective-listening claim.',
 'Listening artifact: work/matieres-audio-053.wav, 23s, same PCM and base gains, excludes in-game filters/compression/reverb; montage peak 0.369. Human in-game listening and phone checks remain.',
 'Known build warnings: embedded bundle over 500 kB; experimental Node stripTypeScriptTypes.',
 "Standalone SHA256: $hash",
 "0.52 baseline unchanged: $baseline"
)
foreach ($name in @('Technoprof-0.53-local.zip','Technoprof-0.53-testeurs.zip')) {
 $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $taskRoot $name))
 try {
  $entry = $zip.GetEntry('Jouer-Technoprof.html')
  if (!$entry) { throw "Missing game in $name" }
  $stream = $entry.Open();$sha = [Security.Cryptography.SHA256]::Create()
  try { $entryHash = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose(); $sha.Dispose() }
  if ($entryHash -ne $hash) { throw "Hash mismatch in $name" }
  $expected = if ($name -like '*local*') { 27 } else { 4 }
  if ($zip.Entries.Count -ne $expected) { throw "Unexpected entry count in $name" }
  $report += "$name : $($zip.Entries.Count) entries, matching game hash, $((Get-Item -LiteralPath $name).Length) bytes"
 } finally { $zip.Dispose() }
}
[IO.File]::WriteAllLines((Join-Path $taskRoot 'work/validation-053.txt'),$report,$utf8)
$report
