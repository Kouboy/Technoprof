# TECHNOPROF 0.57 — Trois établissements, lot 2

Le lot 2 est intégré au jouable local : configurations de mission (2A), Lycée Patrick Bruel (2B), Lycée Professionnel Tibo InShape (2C). L’intégration du troisième lieu suit les parcours techniques réussis du deuxième. La découverte humaine et le téléphone physique restent en attente ; Nicolas a autorisé l’avancement pendant son indisponibilité pour les tests.

## La journée

| Affectation | Destination | Route après notification | Délai partagé | Boss |
|---|---|---:|---:|---|
| 08:00 | Collège C. Hanouna / 42C | 4,2 km | 240 s | Inspectrice : éviter tampon/balayage, frapper dans l’ouverture |
| 12:00 | Lycée Patrick Bruel / B12 | 3,6 km | 225 s | Parent influent : esquiver la ruée, le rejoindre pendant la reprise |
| 17:00 | Lycée Professionnel Tibo InShape / T03 | 3,9 km | 210 s | Responsable sécurité : garde frontale, saut pour passer derrière, retournement lent |

La destination reste cachée avant notification, y compris dans l’aide du cruising. Lecture des répliques, arrivée, fondus et cours restent hors délai. L’échec mène à l’affectation suivante ; dégâts de voiture, bilan et exigence de deux cours assurés sont conservés. La première mission garde sa carte et ses comportements.

## Lieux et parcours

- Bruel : cour de pierre ancienne, vestibule à boiseries, escalier et galerie, puis B12. Une réserve au sol fragile offre une autre montée. Le parent qui filme pousse après sa préparation ; l’élève connu réapparaît dans la galerie. Le boss porte manteau, écharpe et dossier, avec une silhouette et des poses propres.
- Lycée professionnel : façade d’ateliers, établi et machines, passerelle métallique, puis labo T03. L’autre passage traverse une réserve et un accès technique troué. Le nouvel élève majeur lance des boulettes annoncées et sautables ; un vigile connu bloque la passerelle. Le dernier boss porte radio, badge, gilet et porte-documents : il s’engage dans une direction et se retourne en 0,85 seconde.
- Les approches routières privilégient respectivement le tissu urbain et les ateliers. Les objets gardent leurs ancrages dans le monde ; changer de tronçon ne remplace pas soudainement les sprites.

Cartes principales : `cour → vestibule → escalier → galerie → B12` et `parvis → atelier → passerelle → T03`. Variantes : `vestibule → réserve → galerie` et `atelier → réserve → service → T03`. Retour possible avant l’arène ; salle de cours accessible après victoire.

Quatre planches supplémentaires : huit décors (quatre par lieu) et quatre silhouettes (quatre poses chacune). Professeur, voiture, HUD, props et deux ennemis sont réutilisés. Les rectangles et ancrages de pieds sont explicites ; les longues poses sont découpées sans embarquer le personnage voisin. Les sources originales et les prompts sont conservés dans [art/PROMPTS-057.md](art/PROMPTS-057.md).

La passe de contrôle visuel recale les séparations irrégulières des planches, les proportions des acteurs dans les pièces de parcours et les marqueurs d'anticipation au-dessus des nouvelles silhouettes. Les arènes gardent leur cadrage plus rapproché, comme au collège.

## Architecture

[src/missions.ts](src/missions.ts) centralise établissement, salle, délai, distance, quartier, pièces, passages, limites, trous, rencontres et signalétique. Simulation, souris/tactile, panneaux et HUD consultent les mêmes données. [src/gameplay.ts](src/gameplay.ts) porte les profils de collision et les paramètres des nouvelles menaces. [src/new-school-art.ts](src/new-school-art.ts) adapte les nouvelles planches à ces données.

Le responsable de sécurité bloque de face et ouvre son dos ; sa poussée garde la direction annoncée. Les projectiles coûtent un seul point par contact, passent sous un saut et disparaissent à la transition ou après la défaite de leur auteur. Le parent boss ne perd pas de PV en heurtant le mobilier : attendre passivement ses ruées ne suffit pas à ouvrir la classe.

## Vérifications

- `npm test` : 19 scripts passent. Une adaptation du chargeur de tests permet les imports TypeScript sur plusieurs lignes après formatage ; aucune assertion de gameplay historique retirée.
- 60 parcours continus de la première affectation conservés ; **36 journées complètes**, soit **108 affectations**, à 30/60/120 fps simulées, trois seeds, clavier ZQSD/F et contrôle direct, deux itinéraires. Aucun déplacement, PV, chrono, ennemi ou phase forcé après le départ normal de ces journées.
- Les trois cours sont assurés dans ces parcours guidés par automate, sans choc ni chute ; au moins 4/5 PV restants par mission. Réserves au moment de l’entrée en classe : environ 154 s au collège, 145–153 s à Bruel, 132–136 s au lycée professionnel. Ce sont des contrôleurs qui connaissent le chemin, pas des essais de débutant.
- Comptabilité exacte du temps actif ; lecture de 50 secondes sans pénalité ni déplacement ; dernière confirmation sans frappe ; introductions non répétées au retour ; accès de cours verrouillés jusqu’à la victoire ; retard et passage à la mission suivante/bilan.
- Garde de face, frappe dans le dos, retournement retardé, projectile sautable/contact unique et nettoyage ; parent boss sans dégâts automatiques contre le mur.
- Build TypeScript/Vite et export autonome passent. Une seule copie du jeu et 13 petits raccourcis ; ancienne 0.56 conservée et vérifiée par SHA256.
- Observation dans le navigateur compilé via localhost : cour/entrée de Bruel, passage à la souris vers le vestibule, parent au téléphone et bulle ; arènes et plaques des deux lycées ; arrivées et stationnement. Captures et mesures dans `work/`. Cela ne remplace pas une ouverture `file://` sur chaque appareil cible.

Preuves : [work/day-results-057.json](work/day-results-057.json), [work/tests-057.txt](work/tests-057.txt), [work/build-057.txt](work/build-057.txt), [work/resource-budget-057.json](work/resource-budget-057.json).

## Coût et réserves

28 PNG intégrés, 61,58 Mo compressés ; estimation de pixels sources 176,18 Mo, sans les copies/canvas/GPU. HTML autonome d’environ 83,7 Mo. Les deux sources de personnages supplémentaires sont libérées après préparation : 15 textures sources relâchées au total. Aucun gain de mémoire totale du navigateur n’est déduit de ce seul chiffre.

La dernière mesure PC compilée relève environ 5,3 s avant disponibilité, 1,23 s de préparation des textures et des intervalles p50 10 ms / p95 11 ms sur une séquence de parvis et lecture dans l’atelier. Une première interruption de chargement a déclenché la protection de pause dans l’atelier de test. Ce relevé ne mesure ni toute la journée ni un téléphone. Le relevé précédent, antérieur à la correction de l’étiquette de version, est conservé séparément.

À éprouver avec Nicolas : proportions et signalétique dans les nouvelles pièces, personnalité/ton des répliques, compréhension du dos vulnérable, sensation des impacts et ruées. Certaines salles réemploient un même fond architectural avec des passages et plaques différents ; les nouvelles poses ont encore peu de locomotion animée. Les signatures sonores réutilisent la banque de matières. La finition audio, les accents d’animation et la validation extérieure relèvent des lots 3 et 4.

## Essais rapides plus tard

Jouer normalement avec `Jouer-Technoprof.html`. Pour voir directement les ajouts, ouvrir `Jouer-Labo.html` et choisir **Bruel / cour et parcours**, **Bruel / parent influent**, **Lycée pro / parvis et parcours**, **Lycée pro / responsable sécurité**. Les variantes **affectation complète** démarrent en cruising ; elles sont des essais isolés, distincts des journées continues vérifiées.
