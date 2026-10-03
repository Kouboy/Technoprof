const fs=require('fs');
for(const file of ['package.json','package-lock.json','index.html','src/session-log.ts','src/workshop.ts']){
 let s=fs.readFileSync(file,'utf8').replaceAll('0.51','0.52');
 if(file==='package.json')s=s.replace('node work/check-049.cjs"','node work/check-049.cjs && node work/check-052.cjs"');
 fs.writeFileSync(file,s);
}
for(const file of ['LIRE-MOI-TEST.txt','RETOURS-TEST.txt'])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('0.51','0.52'));
let readme=fs.readFileSync('README.md','utf8').replace('prototype 0.51','prototype 0.52');
readme=readme.replace('## 0.51',`## 0.52 — Ponts et bords de route

Radio Educ France, deux familles de ponts (béton et maçonnerie/acier), passage continu sous le tablier et six nouveaux sprites : collectif, gymnase, atelier, château d'eau, platane et armoire électrique. Quatre portions de paysage se succèdent avec des espaces ouverts ; les objets gardent leur identité dans le monde et sont orientés vers la chaussée.

Ouvrir **Jouer-Technoprof.html** ou extraire **Technoprof-0.52-testeurs.zip**. La 0.51 est conservée. Voir [GAMEPLAY-0.52.md](GAMEPLAY-0.52.md) et [la planche et son prompt](art/road-52/README.md). La prochaine passe portera sur les effets et ambiances sonores.

## 0.51`);
fs.writeFileSync('README.md',readme);
let local=fs.readFileSync('LIRE-MOI-LOCAL.txt','utf8').replace('TECHNOPROF 0.51','TECHNOPROF 0.52').replace('Version actuelle : 0.51','Version actuelle : 0.52');
local=local.replace('\n\n0.51 :',"\n\n0.52 : Radio Educ France. Ponts beton et maconnerie/acier, passage continu sous le tablier. Six nouveaux sprites repartis entre habitat, equipements publics, talus et ateliers. Identite stable des objets, orientation vers la chaussee. Voir GAMEPLAY-0.52.md. La 0.51 est conservee.\n\n0.51 :");
fs.writeFileSync('LIRE-MOI-LOCAL.txt',local);
let plan=fs.readFileSync('PLAN-VERTICAL-SLICE.md','utf8');
plan=plan.replace('\n\n**CADRE',"\n\n**Route enrichie en 0.52 :** deux familles de ponts, franchissement continu, six props et quartiers déterminés par leur position dans le monde. Radio Educ France harmonisée. Voir `GAMEPLAY-0.52.md`.\n\n**Prochaine passe : effets et ambiances sonores.** Définir une palette cohérente, puis traiter moteur/carlingue, dépassement et frôlement, combat et autorité administrative, ambiance des établissements et entrée en classe. Hiérarchiser alerte, radio et ambiance ; comparer en jeu aux vitesses lente et rapide, avec les volumes séparés existants.\n\n**CADRE");
fs.writeFileSync('PLAN-VERTICAL-SLICE.md',plan);
