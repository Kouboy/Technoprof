const fs=require('fs');
for(const file of ['package.json','package-lock.json','index.html','src/session-log.ts','src/workshop.ts']){
 let s=fs.readFileSync(file,'utf8').replaceAll('0.53','0.54');
 if(file==='package.json')s=s.replace('node work/check-053.cjs"','node work/check-053.cjs && node work/check-054.cjs"');
 fs.writeFileSync(file,s);
}
for(const file of ['LIRE-MOI-TEST.txt','RETOURS-TEST.txt'])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('0.53','0.54'));
let s=fs.readFileSync('README.md','utf8').replace('prototype 0.53','prototype 0.54');
s=s.replace('## 0.53',`## 0.54 — Passages à pied et parole

Maintenir bas ne fait plus rebondir entre l'escalier de service et l'aile C : relâcher la commande avant un nouveau passage. Les sorties latérales nécessitent de marcher vers la sortie, au sol, hors recul/combat. Un fondu de 0,3 seconde couvre décor, personnages et props ; le délai et les acteurs restent suspendus. Les destinations souris/tactile sont consommées à la transition.

Un grain de voix discret accompagne les lettres des bulles, avec un timbre par interlocuteur. Espaces et ponctuation sont silencieux ; afficher la page entière ne lance aucune rafale. Le réglage Effets et moteur, la pause et le silence s'appliquent aussi à ce son.

Ouvrir **Jouer-Technoprof.html**, ou extraire **Technoprof-0.54-testeurs.zip**. La 0.53 est conservée. Choix et validation : [GAMEPLAY-0.54.md](GAMEPLAY-0.54.md). Atelier : « Transitions / escalier ↔ couloir » pour vérifier maintien, retour et souris.

## 0.53`);
fs.writeFileSync('README.md',s);
s=fs.readFileSync('LIRE-MOI-LOCAL.txt','utf8').replace('TECHNOPROF 0.53','TECHNOPROF 0.54').replace('Version actuelle : 0.53','Version actuelle : 0.54');
s=s.replace('\n\n0.53 :',"\n\n0.54 : transitions a pied : maintien bas sans rebond, sorties laterales sur intention de marche, fondu court couvrant tous les assets, delai suspendu. Petit son de parole pendant les lettres des bulles, sans rafale au devoilement complet. Voir GAMEPLAY-0.54.md. La 0.53 est conservee.\n\n0.53 :");
fs.writeFileSync('LIRE-MOI-LOCAL.txt',s);
fs.appendFileSync('PLAN-VERTICAL-SLICE.md',"\n\n**Correction 0.54 : transitions à pied et parole.** Rebond dû au maintien bas corrigé ; sorties latérales avec intention de déplacement ; fondu court, délai suspendu, commandes souris consommées. Petit grain de voix pendant le dévoilement naturel des bulles. Vérifier ce rythme et le confort d'écoute en session humaine ; château d'eau/armoire électrique restent à mieux mettre en valeur. Voir GAMEPLAY-0.54.md.\n");
