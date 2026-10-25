const fs=require('fs');
const doc=`# TECHNOPROF 0.60 — Montée en charge de la journée

La progression suit désormais un doublement du nombre minimum de tableaux et de rencontres. Le collège conserve son parcours accessible ; les deux lycées prennent une autre ampleur.

| Affectation | Tableaux minimum, entrée et boss inclus | Adversaires croisés, boss inclus | Dépassements visés |
|---|---:|---:|---:|
| 07:00 — Collège C. Hanouna | 9 | 3 | environ 10 |
| 12:00 — Lycée Patrick Bruel | 18 | 6 | environ 20 |
| 18:30 — Lycée Professionnel Tibo InShape | 36 | 12 | environ 40 |

Le détour du collège ajoute un tableau et un vigile. L'accès de service du lycée professionnel ajoute un tableau : 37 au lieu de 36, avec toujours 12 adversaires. Ce sont des rencontres, pas des éliminations obligatoires : les règles existantes permettent toujours d'éviter certains ennemis.

## Parcours et rythme

Dix nouveaux tableaux à Bruel, vingt-neuf au lycée professionnel. Couloirs, études, halls et paliers alternent ; les panneaux indiquent le secteur et la salle recherchée. Chaque passage conserve un retour et le contrôle clavier/souris/tactile. Les neuf pièces calmes de la 0.59 restent sans adversaire ni trou. Le dernier tableau du lycée professionnel ménage une respiration avant son boss.

Les rencontres supplémentaires réutilisent les élèves, agents de sécurité, parent au téléphone et lanceur de boulettes. Chaque première entrée a une réplique courte, avec immobilisation des acteurs, révélation puis confirmation manuelle, chrono suspendu. Une revisite ne répète pas l'introduction. Une seule opposition par tableau conserve la lisibilité et le fonctionnement des sprites actuels.

Les délais restent à 240 / 225 / 210 secondes ; la voiture garde ses dommages entre missions. Les ennemis ordinaires restent à 2 PV, les boss à 6. La difficulté vient de la quantité, de la circulation et de l'accumulation, sans augmenter simultanément la puissance des coups.

## Circulation

Une réserve continue de 32 véhicules, avec intervalles relatifs 1 / 0,36 / 0,16. Les voitures restent en place lors de l'affectation ; les remplacements arrivent au-delà de l'horizon. Le premier trajet conserve ses grands intervalles. La réserve de véhicules n'est pas le nombre d'obstacles effectivement rencontrés.

Sur les parcours continus de référence, on mesure environ 10 / 20–22 / 35–40 dépassements réussis avec le conducteur automatique simple. Les chocs ne sont pas comptés comme dépassements. La densité, la vitesse choisie et la seed font varier cette exposition. Deux essais anticipant le trafic visible terminent également le trajet du soir sans choc et avec 42 dépassements.

## Vérification et limites

- TypeScript, Vite, export HTML autonome et suite de 22 scripts.
- 60 premières affectations ; 36 journées complètes à trois écoles, deux branches, clavier/gestes, trois seeds, 30/60/120 fps simulés. Six journées d'exposition et quatre journées ciblant la nouvelle progression.
- Graphe : minima 9/18/36 et rencontres 3/6/12 ; toutes les pièces accessibles, passages valides, retours, arènes fermées avant victoire.
- Nouvelles introductions : immobilisation, délai suspendu, révélation/confirmation distinctes, aucun coup involontaire, aucune répétition au retour.
- Vérification réelle du rendu compilé dans le navigateur : nouvelle rencontre de Bruel, traversée du couloir 60, passage vers l'étude 61, ambiance du soir et commandes de dialogue.

Le conducteur simple peut subir jusqu'à quatre chocs sur les journées testées, principalement au troisième trajet. Ce test vérifie la possibilité de finir, pas la sensation humaine. Les essais anticipatoires démontrent deux routes propres ; ils ne garantissent pas une conduite facile pour toutes les seeds. Les pauses de lecture, fondus et cinématiques restent exclus du délai.

La troisième mission offre nettement moins de marge. La longueur, la répétition des pièces et l'équilibre sur téléphone nécessitent maintenant une session humaine. Cette livraison augmente la charge avec les assets existants : pas de nouveaux décors uniques pour chacun des 39 tableaux ajoutés. Les secteurs et les mélanges de pièces distinguent le parcours ; l'enrichissement artistique peut suivre après validation du rythme.

29 PNG inchangés, aucun nouvel asset : la taille du jouable reste proche de 87,6 Mo. Le warning Vite sur le gros paquet et celui de Node sur son interprétation TypeScript restent connus. Les fichiers figés 0.57, 0.58 et 0.59 sont conservés.

## Essais directs

Ouvrir Jouer-Technoprof.html pour la journée complète. Dans Jouer-Labo.html : « Midi / ailes supplémentaires », « Midi / nouvelle rencontre », « Crépuscule / ailes supplémentaires », « Crépuscule / nouvelle rencontre », « Crépuscule / fin de parcours ». Les raccourcis utilisent le même HTML autonome.
`;
fs.writeFileSync('GAMEPLAY-0.60.md',doc);
let s=fs.readFileSync('README.md','utf8');s=s.replace('— 0.59','— 0.60');s=s.replace('\n0.59 :', '\n0.60 : progression proche du doublement : 9 / 18 / 36 tableaux minimum, 3 / 6 / 12 adversaires et environ 10 / 20 / 40 dépassements. Délais inchangés ; 39 tableaux supplémentaires avec les assets existants. Ouvrir Jouer-Technoprof.html ou extraire Technoprof-0.60-testeurs.zip. Voir [GAMEPLAY-0.60.md](GAMEPLAY-0.60.md). La 0.59 reste conservée.\n\n## 0.59 — Extensions et ambiances\n\n0.59 :');fs.writeFileSync('README.md',s);
s=fs.readFileSync('LIRE-MOI-LOCAL.txt','utf8').replace('TECHNOPROF 0.59','TECHNOPROF 0.60');s=s.replace('\n0.59 :','\n0.60 : 9 / 18 / 36 tableaux minimum ; 3 / 6 / 12 adversaires ; environ 10 / 20 / 40 depassements. Delais inchanges. 39 tableaux ajoutes avec les assets existants. Voir GAMEPLAY-0.60.md. La 0.59 reste conservee.\n\n0.59 :');fs.writeFileSync('LIRE-MOI-LOCAL.txt',s);
fs.writeFileSync('LIRE-MOI-TEST.txt',fs.readFileSync('LIRE-MOI-TEST.txt','utf8').replace('Version de test 0.59','Version de test 0.60'));
