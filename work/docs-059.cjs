const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('README.md',s=>s.replace('# TECHNOPROF — Physique appliquée — 0.58','# TECHNOPROF — Physique appliquée — 0.59').replace('0.58 : début du lot 3', '0.59 : trafic réellement croissant, neuf nouveaux tableaux sans ennemis, délabrement animé et ambiances 07:00 / 12:00 / 18:30. Voir [GAMEPLAY-0.59.md](GAMEPLAY-0.59.md). Ouvrir Jouer-Technoprof.html ou extraire Technoprof-0.59-testeurs.zip. La 0.58 reste conservée.\n\n## 0.58 — Gestes des nouveaux adversaires\n\n0.58 : début du lot 3'));
edit('LIRE-MOI-LOCAL.txt',s=>s.replace('TECHNOPROF 0.58','TECHNOPROF 0.59').replace('\n\n0.58 :','\n\n0.59 : circulation plus dense a chaque trajet ; trois pieces sans ennemis par etablissement ; fuites, froid, dechets ; matin 07:00, midi 12:00, crepuscule 18:30. Voir GAMEPLAY-0.59.md. Dans Jouer-Labo.html, essais Matin / Midi / Crepuscule. La 0.58 reste conservee.\n\n0.58 :'));
edit('LIRE-MOI-TEST.txt',s=>s.replace('Version de test 0.58','Version de test 0.59'));
edit('RETOURS-TEST.txt',s=>'ESSAI 0.59 : comparer la circulation des trois trajets, la longueur des parcours calmes et la lecture matin / midi / crepuscule. Exporter le journal apres la journee.\n\n'+s);
edit('PLAN-APRES-REVIEW-0.54.md',s=>s.replace('## Objectif','**Retour utilisateur intégré en 0.59 :** file de trafic corrigée et exposition mesurée, neuf tableaux sans combat, décors de manque d’entretien et périodes de la journée plus explicites. Voir [GAMEPLAY-0.59.md](GAMEPLAY-0.59.md). La difficulté perçue, le rythme des nouvelles traversées et le téléphone restent à confirmer en essai humain.\n\n## Objectif'));
const source=fs.readFileSync('work/package-058.ps1','utf8');
let pack=source.replaceAll('0.58','0.59').replaceAll('058','059').replace('43..58','43..59').replace('{ 32 }','{ 33 }');
// Keep both previous frozen deliveries intact.
pack=pack.replace('$hash =',"$previous = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.58.html' -Algorithm SHA256).Hash\nif ($previous -ne '8015A00054DCB11450F8D6C14CC73E9CA5A6E5B393E28BA2539E36C42FC0F196') { throw '0.58 baseline changed' }\n$hash =");
const start=pack.indexOf('$report = @('),end=pack.indexOf('foreach ($name',start);
pack=pack.slice(0,start)+`$report = @(
 'TECHNOPROF 0.59 - traffic progression, nine quiet rooms, decay and morning/noon/twilight.',
 'npm test PASS (21 scripts). TypeScript/Vite build and autonomous HTML with 13 lightweight shortcuts PASS.',
 '60 first assignments and 36 full days plus 6 exposure runs: keyboard/direct, both paths, synthetic 30/60/120 fps. Human difficulty and physical-phone tests pending.',
 'Measured passing exposure: 10 / 12 / 18 on the continuous simulated days; same queue capacity, progressively shorter spacing, no notification respawn.',
 'Compiled browser observed via localhost: three classes and lighting periods, route at twilight, hall passage. Not standalone file:// or phone validation.',
 '29 PNG assets, about 87.6 MB autonomous HTML; Vite large-chunk and Node experimental TypeScript notices remain known.',
 "Standalone SHA256: $hash",
 "0.58 unchanged: $previous",
 "0.57 unchanged: $baseline"
)
`+pack.slice(end);
fs.writeFileSync('work/package-059.ps1',pack);
