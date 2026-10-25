const fs=require('fs');
const p=JSON.parse(fs.readFileSync('package-lock.json','utf8'));p.version='0.56.0';p.packages[''].version='0.56.0';fs.writeFileSync('package-lock.json',JSON.stringify(p,null,2)+'\n');
for(const file of ['LIRE-MOI-LOCAL.txt','LIRE-MOI-TEST.txt','RETOURS-TEST.txt']){
 let s=fs.readFileSync(file,'utf8');
 s=s.replace('TECHNOPROF 0.55','TECHNOPROF 0.56').replace('Version de test 0.55','Version de test 0.56').replace('Version actuelle : 0.55','Version actuelle : 0.56');
 if(file==='LIRE-MOI-LOCAL.txt')s=s.replace('\n\n','\n\n0.56 : premiere affectation mesuree en parcours continu clavier/controle direct ; journal accessible depuis Pause / aide ou le bilan (Exporter mon essai). Atelier : Premiere affectation / parcours complet et Mesures de cet essai. Copies sources inutilisees liberees ; saut tactile borne aux acces ouverts. Voir GAMEPLAY-0.56.md. La 0.55 est conservee.\n\n');
 else if(file==='LIRE-MOI-TEST.txt')s+='\nPour documenter un probleme : Pause / aide > Exporter mon essai. Un petit fichier JSON est sauvegarde localement. Il contient temps, incidents, seed et mesures techniques ; rien n\'est transmis. Vous pouvez le joindre aux retours.\n';
 else s+='\nEn cas de souci, joignez si possible le fichier obtenu avec Pause / aide > Exporter mon essai. Pour le chargement : indiquez le temps ressenti avant l\'accueil, et les saccades constatees pendant le jeu. Le journal ne mesure pas votre comprehension du chemin : vos mots restent essentiels.\n';
 fs.writeFileSync(file,s);
}
