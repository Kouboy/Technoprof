const fs=require('fs');
function edit(p,f){fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));}
edit('README.md',s=>s.replace(/^#.*\r?\n/, '# TECHNOPROF — Physique appliquée — 0.58\n').replace(/\n\n/, '\n\n0.58 : début du lot 3, poses actives des nouveaux adversaires corrigées, garde directionnelle lisible et signatures sonores des gestes. 20 scripts et 36 journées techniques passent. Les tests humains et l’écoute du mixage en jeu restent à faire. Voir [GAMEPLAY-0.58.md](GAMEPLAY-0.58.md).\n\n'));
edit('PLAN-APRES-REVIEW-0.54.md',s=>s.replace('le prochain chantier est la finition ciblée du lot 3.','le lot 3 commence en 0.58 par les poses actives, la garde directionnelle et les gestes sonores. Voir [GAMEPLAY-0.58.md](GAMEPLAY-0.58.md). L’écoute en situation, les repères routiers et le téléphone restent ouverts.'));
edit('LIRE-MOI-LOCAL.txt',s=>s.replace('TECHNOPROF 0.57 - VERSION LOCALE AUTONOME','TECHNOPROF 0.58 - VERSION LOCALE AUTONOME').replace(/\r?\n\r?\n/, '\n\n0.58 : preparation, attaque et reprise des nouveaux adversaires plus lisibles ; garde directionnelle de la securite ; sons de gestes differencies. Quatre essais courts dans Jouer-Labo.html. Voir GAMEPLAY-0.58.md. La 0.57 reste conservee.\n\n'));
for(const p of ['LIRE-MOI-TEST.txt','RETOURS-TEST.txt']) edit(p,s=>s.replaceAll('0.57','0.58'));
// Keep the packaging structure and all historical files, with a new frozen game.
edit('work/package-058.ps1',s=>s);
