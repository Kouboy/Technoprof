const fs=require('fs');
for(const file of ['package.json','package-lock.json','index.html','src/session-log.ts','src/workshop.ts']){
 let s=fs.readFileSync(file,'utf8').replaceAll('0.52','0.53');
 if(file==='package.json')s=s.replace('node work/check-052.cjs"','node work/check-052.cjs && node work/check-053.cjs"');
 fs.writeFileSync(file,s);
}
for(const file of ['LIRE-MOI-TEST.txt','RETOURS-TEST.txt'])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('0.52','0.53'));
let readme=fs.readFileSync('README.md','utf8').replace('prototype 0.52','prototype 0.53');
readme=readme.replace('## 0.52',`## 0.53 — Matières et mixage audio

Moteur à impulsions, régimes et changements de rapport, roulement et air avec la vitesse ; tôle, pneus, passages stéréo et frôlements. À pied : livre, dossier, tampon, corps, chaussures et chute ont des signatures distinctes. Porte, chaises, cahiers et craie accompagnent l'entrée en classe ; air, tubes et fuites restent discrets dans le collège. Les ambiances disposent d'un réglage séparé des effets/moteur et de la radio.

La radio et les alertes prennent la priorité sur le moteur. Pause, silence et changement de phase coupent les sources en attente ; les sons de classe reprennent à leur position après une pause et s'arrêtent à l'ellipse. Banque synthétisée localement, préparée en petites tâches pendant le chargement. Les règles de jeu sont conservées.

Ouvrir **Jouer-Technoprof.html** ou extraire **Technoprof-0.53-testeurs.zip**. La 0.52 est conservée. Voir [GAMEPLAY-0.53.md](GAMEPLAY-0.53.md) pour les choix, les essais et les limites d'écoute.

## 0.52`);
fs.writeFileSync('README.md',readme);
let local=fs.readFileSync('LIRE-MOI-LOCAL.txt','utf8').replace('TECHNOPROF 0.52','TECHNOPROF 0.53').replace('Version actuelle : 0.52','Version actuelle : 0.53');
local=local.replace('\n\n0.52 :',"\n\n0.53 : passe audio. Moteur, air, roulement, tole, pneus, depassements/frôlements ; livre, dossier, tampon, pas, chutes ; porte, chaises, cahiers et craie. Reglage separe des ambiances. Sons en attente coupes aux transitions et pauses. Synthese locale sans fichiers a telecharger. Voir GAMEPLAY-0.53.md. La 0.52 est conservee.\n\n0.52 :");
fs.writeFileSync('LIRE-MOI-LOCAL.txt',local);
let plan=fs.readFileSync('PLAN-VERTICAL-SLICE.md','utf8');
plan=plan.replace('**Prochaine passe : effets et ambiances sonores.** Définir une palette cohérente, puis traiter moteur/carlingue, dépassement et frôlement, combat et autorité administrative, ambiance des établissements et entrée en classe. Hiérarchiser alerte, radio et ambiance ; comparer en jeu aux vitesses lente et rapide, avec les volumes séparés existants.',"**Passe audio 0.53 implémentée :** banque de matières, moteur/régimes, air/roulement, alertes prioritaires, gestes administratifs, classe et ambiances par lieu. Réglage séparé des ambiances ; sources coupées à la pause et aux transitions. Voir `GAMEPLAY-0.53.md`.\n\n**Prochaine validation : écoute en jeu.** Comparer 40/110/260 km/h, dépassement distant/frôlement/choc, livre/garde/coup reçu, tampon/balayage et ellipse de classe. Juger le naturel et la fatigue auditive ; ajuster les timbres et gains à partir de cette écoute. Les contrôles de graphe et les métriques PCM ne remplacent pas cette appréciation.");
fs.writeFileSync('PLAN-VERTICAL-SLICE.md',plan);
