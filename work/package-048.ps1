$ErrorActionPreference = 'Stop'
$root = 'C:\Users\don_n\Documents\Codex\Technoprof'
Set-Location -LiteralPath $root
$utf8 = [System.Text.UTF8Encoding]::new($false)
$readme = [IO.File]::ReadAllText((Join-Path $root 'README.md'))
$readme = $readme.Replace('# Technoprof — prototype 0.47', @'
# Technoprof — prototype 0.48

## 0.48 — Dialogues contrôlés et vitesse ressentie

Le professeur et ses interlocuteurs restent immobiles pendant les premières répliques ; le délai est suspendu. X révèle la page, puis passe à la suivante ou ferme l'échange, sans frapper accidentellement. Le balayage reste visible 360 ms. La route défile 2,4 fois plus vite, avec le rythme du trafic préservé et les kilomètres calculés depuis la vitesse affichée. Le collège porte le nom **Collège C. Hanouna**.

Ouvrir **Jouer-Technoprof.html** ou extraire **Technoprof-0.48-testeurs.zip**. Les essais ciblés restent dans **Jouer-Labo.html**, avec un nouveau scénario de balayage. La 0.47 est conservée. Voir [GAMEPLAY-0.48.md](GAMEPLAY-0.48.md) pour les réglages, les contrôles et les limites de validation du ressenti.
'@)
[IO.File]::WriteAllText((Join-Path $root 'README.md'), $readme, $utf8)
$planPath = Join-Path $root 'PLAN-VERTICAL-SLICE.md'
$plan = [IO.File]::ReadAllText($planPath)
$currentState = @'
**État actuel : retours de test intégrés en 0.48.** Dialogues à progression manuelle, immobilisation et chrono suspendu, balayage prolongé, défilement routier renforcé et Collège C. Hanouna. Voir `GAMEPLAY-0.48.md`. La validation humaine de la nouvelle sensation de vitesse reste à faire. **L'expérience autonome du lot 5 a été préparée en 0.47.**
'@
$plan = $plan.Replace('**État actuel : expérience autonome du lot 5 préparée en 0.47.**',$currentState)
[IO.File]::WriteAllText($planPath, $plan, $utf8)
foreach ($name in @('LIRE-MOI-TEST.txt','RETOURS-TEST.txt')) {
 $path = Join-Path $root $name
 [IO.File]::WriteAllText($path,[IO.File]::ReadAllText($path).Replace('0.47','0.48'),$utf8)
}
$localPath = Join-Path $root 'LIRE-MOI-LOCAL.txt'
$local = [IO.File]::ReadAllText($localPath)
$local = $local.Replace('TECHNOPROF — VERSION LOCALE AUTONOME', @'
TECHNOPROF — VERSION LOCALE AUTONOME

0.48 : X affiche puis poursuit les repliques. Prof, adversaire et delai suspendus pendant les echanges. Balayage de l'inspection plus lisible. Defilement routier renforce, rythme du trafic conserve, kilometres lies a la vitesse affichee. College C. Hanouna.
Voir GAMEPLAY-0.48.md. Jouer-Technoprof.html lance la version actuelle ; Jouer-Labo.html propose les essais, dont Inspectrice / balayage. Archive simplifiee : Technoprof-0.48-testeurs.zip. La 0.47 est conservee. Les descriptions ci-dessous constituent l'historique : la regle de dialogue 0.48 remplace l'attente automatique et les coups pendant les repliques.
'@)
[IO.File]::WriteAllText($localPath,$local,$utf8)
$hash = (Get-FileHash -LiteralPath 'Jouer-Technoprof.html' -Algorithm SHA256).Hash
$baseline = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.47.html' -Algorithm SHA256).Hash
if ($baseline -ne '2C10C953B2DA030F89796903B615C10D53893B9942194421C801A28D06532C0C') { throw '0.47 baseline changed' }
$files = @(Get-ChildItem -File -Filter 'Jouer-*.html' | Where-Object { $_.Name -notmatch '\d\.\d' } | ForEach-Object { $_.FullName })
$files += @('Jouer.cmd','LIRE-MOI-LOCAL.txt','GAMEPLAY-0.43.md','GAMEPLAY-0.44.md','GAMEPLAY-0.45.md','GAMEPLAY-0.46.md','GAMEPLAY-0.47.md','GAMEPLAY-0.48.md')
Compress-Archive -LiteralPath $files -DestinationPath 'Technoprof-0.48-local.zip' -CompressionLevel Optimal -Force
Compress-Archive -LiteralPath 'Jouer-Technoprof.html','Jouer.cmd','LIRE-MOI-TEST.txt','RETOURS-TEST.txt' -DestinationPath 'Technoprof-0.48-testeurs.zip' -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$report = @(
 'TECHNOPROF 0.48 - verification 2026-10-01',
 'npm test: PASS (work/tests-048.txt). TypeScript/Vite build: PASS (work/build-048.txt). Autonomous export and 13 shortcuts: PASS.',
 'Browser: parent reveal/next/reveal/finish, no hit on final confirmation, clock stays 240.00; opaque teacher; updated CADRE; actual sweep observed at contact and 200 ms later. No warn/error logs.',
 'Simulation: four dialogue rooms at 15/30/60/120 fps; pause, held input, room re-entry. Sweep 360 ms, single damage. Six input-driven road runs arrive with no collisions; brake and fixed-edge regressions pass.',
 'Limitation: hidden browser pauses on long frames. Real-time fluidity, audio and subjective speed feeling require a human playthrough.',
 'Known warnings: embedded bundle over 500 kB; experimental Node stripTypeScriptTypes.',
 "Standalone SHA256: $hash",
 "0.47 baseline unchanged: $baseline"
)
foreach($name in @('Technoprof-0.48-local.zip','Technoprof-0.48-testeurs.zip')) {
 $zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $root $name))
 try {
  $entry = $zip.GetEntry('Jouer-Technoprof.html')
  if (!$entry) { throw "Missing game in $name" }
  $stream = $entry.Open()
  try { $sha = [Security.Cryptography.SHA256]::Create(); $entryHash = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose(); $sha.Dispose() }
  if ($entryHash -ne $hash) { throw "Hash mismatch in $name" }
  $report += "$name : $($zip.Entries.Count) entries, matching game hash, $((Get-Item -LiteralPath $name).Length) bytes"
 } finally { $zip.Dispose() }
}
[IO.File]::WriteAllLines((Join-Path $root 'work/validation-048.txt'),$report,$utf8)
$report
