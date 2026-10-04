# TECHNOPROF — Physique appliquée — 0.61

Jeu d'action arcade rétro satirique français : un professeur remplaçant rejoint
son affectation en voiture, traverse un établissement dégradé et tente de faire
cours avant la fin du délai. Trois missions rythment la journée, du matin au soir.

**Jouer dans le navigateur, sur ordinateur ou téléphone :**
[ouvrir TECHNOPROF](https://kouboy.github.io/Technoprof/).
Les contrôles tactiles sont disponibles ; l'aide du jeu décrit les gestes.
Le premier chargement peut prendre un moment : le prototype contient encore
environ 88 Mo de programme et d'images. Le téléphone physique reste à tester.

**Jouer hors connexion :** télécharger et extraire
[Technoprof-0.61-testeurs.zip](https://github.com/Kouboy/Technoprof/releases/tag/v0.61),
puis ouvrir `Jouer-Technoprof.html`. Le jeu fonctionne localement hors connexion.

## Développer et tester

Prérequis : Node.js 24 (les diagnostics utilisent le support natif TypeScript de
Node) et npm. Après clonage :

```sh
npm ci
npm run dev
```

Ouvrir l'adresse locale indiquée par Vite. Pour vérifier les sources et produire
le HTML autonome, puis exécuter les tests :

```sh
npm run build
npm test
```

Le build génère `Jouer-Technoprof.html` et les raccourcis d'atelier. Les exports,
`dist/` et `node_modules/` restent hors de Git ; les sources et les assets sont
inclus. Les tests automatisés vérifient les règles, sans remplacer une session
de découverte humaine, l'écoute ou l'essai sur téléphone physique.

GitHub Pages est construit et publié automatiquement après un envoi sur `main`.
Le workflow [pages.yml](.github/workflows/pages.yml) utilise Node.js 24 et
`npm run build:pages` pour publier uniquement `dist/`, avec des chemins relatifs
compatibles avec l'adresse du projet. Les exports HTML locaux restent séparés.

**Commandes :** flèches ou ZQSD pour se déplacer ; Espace pour sauter ; F/X pour
frapper ou avancer les dialogues. La souris et le toucher permettent aussi de
jouer directement dans la scène. L'aide en jeu détaille les gestes.

## Versions et suivi

Sur la branche `atelier-navigation-bruel-a3`, [Bruel A3](ATELIER-BRUEL-A3.md)
reprend le réseau validé, l'infirmerie comme scène de récupération et le
Parent limité à deux coups par ouverture. Les [douze décors adaptés](RENDU-BRUEL-A3.md)
remplacent sa composition provisoire : plancher usé au premier étage,
carrelage au RDC, vues extérieures corrigées en hauteur et affiches scolaires
déchirées. Deux trous sont actifs dans les pièces de l'étage sans ennemi.
Lancer `npm run build:atelier`, puis
ouvrir `Jouer-Technoprof-Atelier-Bruel-A3.html` (environ 101 Mo). Cet atelier
reste séparé de la 0.61 publiée ; A1/A2 restent sélectionnables.

Sur la branche `atelier-navigation-bruel`, [l’atelier de navigation Bruel A1](ATELIER-BRUEL-NAVIGATION.md)
implémente le [graphe validé](CONCEPTION-BRUEL-NAVIGATION.md). Lancer `npm run build:atelier`
puis ouvrir `Jouer-Technoprof-Atelier-Bruel.html`. Cet essai reste séparé de la
journée 0.61 publiée ; sa navigation doit encore être évaluée en découverte humaine.

La branche `main` contient l'état courant. Voir [l'historique importé](HISTORIQUE.md)
pour distinguer les sauvegardes partielles et les jalons plus complets. Les tags
`snapshot-0.40` à `snapshot-0.59` conservent les fichiers disponibles ; `v0.60`
désigne l'état de l'import. La version actuelle est `v0.61`. Les évolutions sont enregistrées par commits.

## 0.61 — Circulation dès le premier trajet

Le matin reprend la densité de l'ancien deuxième trajet, puis la densité double
à chaque affectation. Les groupes des deux derniers trajets gardent une ouverture
qui alterne entre gauche et droite. Neuf essais anticipatoires mesurent environ
22–24 / 39 / 73–75 dépassements confirmés, sans choc ; la difficulté humaine reste
à tester. Voir [GAMEPLAY-0.61.md](GAMEPLAY-0.61.md). La 0.60 reste conservée.

## 0.60 — Historique de la progression


Revue actualisée : [audit 0.60](AUDIT-0.60.md) et [plan après revue](PLAN-APRES-REVIEW-0.60.md).

0.60 : progression proche du doublement : 9 / 18 / 36 tableaux minimum, 3 / 6 / 12 adversaires et environ 10 / 20 / 40 dépassements. Délais inchangés ; 39 tableaux supplémentaires avec les assets existants. Ouvrir Jouer-Technoprof.html ou extraire Technoprof-0.60-testeurs.zip. Voir [GAMEPLAY-0.60.md](GAMEPLAY-0.60.md). La 0.59 reste conservée.

## 0.59 — Extensions et ambiances

0.59 : trafic réellement croissant, neuf nouveaux tableaux sans ennemis, délabrement animé et ambiances 07:00 / 12:00 / 18:30. Voir [GAMEPLAY-0.59.md](GAMEPLAY-0.59.md). Ouvrir Jouer-Technoprof.html ou extraire Technoprof-0.59-testeurs.zip. La 0.58 reste conservée.

## 0.58 — Gestes des nouveaux adversaires

0.58 : début du lot 3, poses actives des nouveaux adversaires corrigées, garde directionnelle lisible et signatures sonores des gestes. 20 scripts et 36 journées techniques passent. Les tests humains et l’écoute du mixage en jeu restent à faire. Voir [GAMEPLAY-0.58.md](GAMEPLAY-0.58.md).

## 0.57 — Trois établissements, lot 2

La journée relie le Collège C. Hanouna (42C), le Lycée Patrick Bruel (B12) et le Lycée Professionnel Tibo InShape (T03). Cartes, approches routières et arrivées distinctes ; nouveaux décors, parent qui filme et élève majeur lanceur de boulettes. Le parent influent charge ; le responsable de sécurité protège sa face et se retourne lentement. Professeur, contrôles, CADRE, props et certains ennemis sont partagés.

Ouvrir **Jouer-Technoprof.html** ou extraire **Technoprof-0.57-testeurs.zip**. La 0.56 reste conservée. Dans **Jouer-Labo.html**, choisir Bruel ou Lycée pro pour voir directement les nouvelles scènes. [GAMEPLAY-0.57.md](GAMEPLAY-0.57.md) décrit les parcours, les essais et les réserves : découverte humaine, écoute et téléphone physique restent à réaliser.

## 0.56 — Première affectation mesurée, lot 1

60 parcours continus réussis, clavier et contrôle direct, détour et couloir technique. Journal exportable depuis la pause/bilan ; temps actifs et suspendus séparés ; mesures de chargement/rendu. Les copies de 13 planches sources sont libérées après préparation ; le saut diagonal respecte les limites accessibles.

Ouvrir **Jouer-Technoprof.html**, ou extraire **Technoprof-0.56-testeurs.zip**. La 0.55 est conservée. Voir [GAMEPLAY-0.56.md](GAMEPLAY-0.56.md) pour la grille, les mesures PC et leurs limites. Le lot 1 reste ouvert pour la découverte humaine et la mesure sur téléphone physique. L'atelier propose « Première affectation / parcours complet » et « Mesures de cet essai ».

## 0.55 — Passages fiables, lot 0

Cliquer ou toucher une flèche de passage fait marcher le professeur jusqu'au seuil et changer de tableau. Sorties latérales, portes, escaliers et indicateurs partagent leurs données ; les déplacements automatiques s'arrêtent après la transition. Les accès condamnés et les protections pendant les coups, reculs, sauts et fondus sont conservés.

Ouvrir **Jouer-Technoprof.html**, ou extraire **Technoprof-0.55-testeurs.zip**. La 0.54 est conservée. Voir [GAMEPLAY-0.55.md](GAMEPLAY-0.55.md). L'atelier propose « Passages / cour ↔ hall ». Suite : [lot 1 du plan actuel](PLAN-APRES-REVIEW-0.54.md), puis trois établissements dont Lycée Patrick Bruel et Lycée Professionnel Tibo InShape.

## 0.54 — Passages à pied et parole

Maintenir bas ne fait plus rebondir entre l'escalier de service et l'aile C : relâcher la commande avant un nouveau passage. Les sorties latérales nécessitent de marcher vers la sortie, au sol, hors recul/combat. Un fondu de 0,3 seconde couvre décor, personnages et props ; le délai et les acteurs restent suspendus. Les destinations souris/tactile sont consommées à la transition.

Un grain de voix discret accompagne les lettres des bulles, avec un timbre par interlocuteur. Espaces et ponctuation sont silencieux ; afficher la page entière ne lance aucune rafale. Le réglage Effets et moteur, la pause et le silence s'appliquent aussi à ce son.

Ouvrir **Jouer-Technoprof.html**, ou extraire **Technoprof-0.54-testeurs.zip**. La 0.53 est conservée. Choix et validation : [GAMEPLAY-0.54.md](GAMEPLAY-0.54.md). Atelier : « Transitions / escalier ↔ couloir » pour vérifier maintien, retour et souris.

## 0.53 — Matières et mixage audio

Moteur à impulsions, régimes et changements de rapport, roulement et air avec la vitesse ; tôle, pneus, passages stéréo et frôlements. À pied : livre, dossier, tampon, corps, chaussures et chute ont des signatures distinctes. Porte, chaises, cahiers et craie accompagnent l'entrée en classe ; air, tubes et fuites restent discrets dans le collège. Les ambiances disposent d'un réglage séparé des effets/moteur et de la radio.

La radio et les alertes prennent la priorité sur le moteur. Pause, silence et changement de phase coupent les sources en attente ; les sons de classe reprennent à leur position après une pause et s'arrêtent à l'ellipse. Banque synthétisée localement, préparée en petites tâches pendant le chargement. Les règles de jeu sont conservées.

Ouvrir **Jouer-Technoprof.html** ou extraire **Technoprof-0.53-testeurs.zip**. La 0.52 est conservée. Voir [GAMEPLAY-0.53.md](GAMEPLAY-0.53.md) pour les choix, les essais et les limites d'écoute.

## 0.52 — Ponts et bords de route

Radio Educ France, deux familles de ponts (béton et maçonnerie/acier), passage continu sous le tablier et six nouveaux sprites : collectif, gymnase, atelier, château d'eau, platane et armoire électrique. Quatre portions de paysage se succèdent avec des espaces ouverts ; les objets gardent leur identité dans le monde et sont orientés vers la chaussée.

Ouvrir **Jouer-Technoprof.html** ou extraire **Technoprof-0.52-testeurs.zip**. La 0.51 est conservée. Voir [GAMEPLAY-0.52.md](GAMEPLAY-0.52.md) et [la planche et son prompt](art/road-52/README.md). La prochaine passe portera sur les effets et ambiances sonores.

## 0.51 — Le CADRE, pupitre administratif

Textes secondaires plus petits, chiffres du délai plus fins, distance et unités séparées. Panneau repris avec plaques encastrées, tôle, vis fendues, peinture écaillée et oxydation ; surfaces de lecture dégagées. Jauges, témoins et carte de destination raccordés à cette présentation commune à la route et au collège.

Ouvrir **Jouer-Technoprof.html** ou extraire **Technoprof-0.51-testeurs.zip**. La 0.50 est conservée. Voir [GAMEPLAY-0.51.md](GAMEPLAY-0.51.md) pour les tailles, les règles conservées et les vérifications visuelles.

## 0.50 — Pieds au sol et bulles dégagées

Personnages descendus légèrement dans la bande de sol, avec ombres et effets raccordés. Bulles plus compactes, placées au-dessus des visages, queues raccourcies. L'élève invoque désormais le conseil des parents d'élèves présidé par son père. Les règles et contrôles sont conservés.

Ouvrir **Jouer-Technoprof.html** ou extraire **Technoprof-0.50-testeurs.zip**. La 0.49 est conservée. Voir [GAMEPLAY-0.50.md](GAMEPLAY-0.50.md) pour le réglage et les vérifications.

## 0.49 — Clavier, souris et toucher

ZQSD et F complètent les flèches et X ; Espace conserve le saut. Souris et toucher partagent les mêmes interactions dans la scène : sol pour marcher, adversaire pour approcher et frapper une fois, accès pour l'emprunter, glissement vers le haut pour sauter. Sur route, maintenir accélère, glisser dirige, glisser vers le bas freine. Les dialogues se révèlent et avancent par clic ou toucher. Un petit repère confirme les ordres.

Les menus s'adaptent aux petits écrans et les répliques y disposent aussi d'un texte lisible sous le jeu. Ouvrir **Jouer-Technoprof.html** ou extraire **Technoprof-0.49-testeurs.zip**. La 0.48 reste conservée. Voir [GAMEPLAY-0.49.md](GAMEPLAY-0.49.md) pour les gestes et les vérifications ; le confort sur un vrai téléphone reste à tester.

## 0.48 — Dialogues contrôlés et vitesse ressentie

Le professeur et ses interlocuteurs restent immobiles pendant les premières répliques ; le délai est suspendu. X révèle la page, puis passe à la suivante ou ferme l'échange, sans frapper accidentellement. Le balayage reste visible 360 ms. La route défile 2,4 fois plus vite, avec le rythme du trafic préservé et les kilomètres calculés depuis la vitesse affichée. Le collège porte le nom **Collège C. Hanouna**.

Ouvrir **Jouer-Technoprof.html** ou extraire **Technoprof-0.48-testeurs.zip**. Les essais ciblés restent dans **Jouer-Labo.html**, avec un nouveau scénario de balayage. La 0.47 est conservée. Voir [GAMEPLAY-0.48.md](GAMEPLAY-0.48.md) pour les réglages, les contrôles et les limites de validation du ressenti.

## 0.47 — Une découverte autonome

Accueil, pause, commandes, volumes séparés, rappels contextuels et sous-titres radio. Le bilan distingue les causes de carence et propose une nouvelle journée. La partie normale ne présente plus les outils de développement. Les trois services existants restent le parcours de référence.

Ouvrir **Jouer-Technoprof.html**. Pour une découverte extérieure, utiliser **Technoprof-0.47-testeurs.zip** : jeu autonome, lanceur et notes courtes. Les essais restent dans **Jouer-Labo.html** ; les aperçus de bilans sont dans ses galeries. Voir [GAMEPLAY-0.47.md](GAMEPLAY-0.47.md) pour les règles, vérifications et limites. La 0.46 est conservée ; compréhension, fluidité et appréciation des sons attendent la session humaine.
## 0.46 — Harmonisation de la présentation

Lumière commune selon l'heure, ombres de contact, sols moins brillants, plaques bitmap et indications de passage hiérarchisées. Raccords de bitume fixes dans le monde et remplacement des masques routiers WebGL par un cadrage commun.

Ouvrir **Jouer-Technoprof.html** pour jouer, **Jouer-Presentation.html** pour comparer les onze scènes aux trois heures, ou **Jouer-Labo.html** pour les essais animés. La 0.45 reste conservée. Voir [GAMEPLAY-0.46.md](GAMEPLAY-0.46.md) pour le contrat visuel, les vérifications et les limites. Suite : retour visuel humain, puis accueil, audio et journée représentative.
## 0.45 — Le livre et les corps

Lot 3 intégré : réactions orientées, rebond du livre sur la garde, recul animé et défaites lisibles pour les quatre adversaires. Impacts alignés sur le livre, onomatopées secondaires, sons distincts au contact, tolérance de 100 ms pour une frappe suivante et option de secousses réduites. L'atelier comporte 25 scénarios et permet de masquer les onomatopées. La 0.44 est conservée.

Ouvrir **Jouer-Technoprof.html**, ou **Jouer-Labo.html** pour les essais. Voir [GAMEPLAY-0.45.md](GAMEPLAY-0.45.md) pour les timings, les tests et les limites de validation. Prochaine étape : lot 4, cohérence visuelle ; ressenti et sons encore à valider pendant une session humaine.

## 0.44 — Conduite et trajet

Collisions élargies selon les carrosseries, accotements progressifs, perspective plus lisible à distance, séquence de trafic espacée et continue, sons de passage pilotés par la vitesse relative et choc de carrosserie retravaillé. L'atelier ajoute 40/260 km/h, freinage et accotement (18 scénarios au total). La 0.43 est conservée.

Voir [GAMEPLAY-0.44.md](GAMEPLAY-0.44.md) pour les règles, les résultats et les limites de validation. Le lot 3 (combat et mouvement) devient le prochain chantier.

## 0.43 — Référence, atelier et règles cohérentes

Les lots 0 et 1 du plan sont livrés. Ouvrir **Jouer-Technoprof.html** pour la journée ou **Jouer-Labo.html** pour les quatorze scénarios animés : pause, ralenti, pas à pas, collisions et journal local. La 0.42 reste sauvegardée.

Collision active pendant les répliques ; une frappe qui touche coupe la présentation. Blessure et chute annulent le coup. Les interactions attendent la fin de frappe et l'atterrissage. Les échecs indiquent leur cause dans le CADRE. Les profils de combat ne dépendent plus des textures ; les images lentes sont subdivisées sans perte silencieuse de temps. Une interruption supérieure à une seconde suspend explicitement la partie.

Voir [GAMEPLAY-0.43.md](GAMEPLAY-0.43.md) pour les règles, scénarios, réglages et preuves de validation, avec leurs limites. La composition routière reste le prochain lot.

## 0.42 — Accès, impacts et inspectrice

Les passages ouverts portent une touche fléchée, soulignée en ambre lorsque le professeur est dans leur zone d'interaction. La porte 42C propose Haut après la victoire. Les adversaires ordinaires attendent les deux pages de leur première présentation (9 secondes) avant d'approcher ou d'attaquer ; le joueur reste libre de ses mouvements. L'introduction du boss conserve son chrono suspendu.

Nouvelle inspectrice au premier établissement, avec huit poses, lunettes, carré gris, tailleur et dossier. L'inspecteur reste présent aux affectations suivantes. Sprite créé avec l'outil intégré de génération d'images ; source, prompt et notes de détourage dans `art/inspectrice-42/`.

Les coups ont des traînées à l'encre, un éclat irrégulier bref, des projections radiales et des onomatopées inclinées, animées et sans cartouche. La galerie Retouches ajoute les poses tampon, pied et recul de l'inspectrice. Régressions : introductions complètes, reprise de l'agression, touches des passages, portes fermées et choix des sprites.

Jeu d'arcade satirique : route en fausse 3D, affectation, recherche de salle dans un collège délabré, combat au livre, cours et bilan administratif.

## Jouer

`npm install`, puis `npm run dev`. Ouvrir l'adresse locale affichée.

- ZQSD ou flèches : accélérer/freiner, diriger ; à pied, marcher et utiliser portes/escaliers.
- Espace : saut. F ou X : livre et dialogue. P : pause. M : son.
- Souris/tactile : interactions directes dans la scène, détaillées dans le menu Commandes.
- Entrée : commencer ou continuer après échec.
- Après « Bon. Reprenons. », une nouvelle touche poursuit l'ellipse.
- Liens sous le jeu : chocs, parent, raccourci, collège, inspecteur, arrivée, journée complète. F2/F3/F4 fournissent les mêmes essais.

## Première affectation

L'escalier central est condamné. Un panneau indique le détour par l'annexe, la passerelle du deuxième étage et l'escalier de service pour redescendre au premier. La salle 42C est gardée par l'inspecteur.

Le boss protège son corps avec un dossier. Il alterne tampon de proximité et balayage : reculer ou sauter, puis frapper pendant sa récupération. Le livre a une anticipation, un impact et une récupération. Les ennemis conservent leur état lors des retours entre tableaux.

## Règles temporelles

15 secondes de cruising sans destination. Chrono notifié de 4:00 / 3:45 / 3:30 ; route de 4,20 km ; deux affectations réussies requises sur trois. Distance mission en mètres issue des km/h, défilement et distance en mètres, proportionnels aux km/h. Maximum 260 km/h, direction amortie.

Le chrono ne baisse que pendant le jeu contrôlable. Stationnement, sortie de voiture, fondu d'arrivée, fondu d'entrée, introduction imposée de l'inspecteur et pause sont exclus. Après le cours : noir seul, phrase attendant une touche, noir seul, ellipse, retour au cruising. La dernière mission mène au bilan.

## Structure

- src/main.ts : scène, logique et dessin du prototype.
- src/world.ts : réglages, sorties, noms et création des ennemis.
- src/audio.ts : premiers sons synthétiques et moteur.
- work/check.cjs : tests de logique et parcours simulé complet.
- work/checkpoints : sauvegardes avant/après cette passe.

`npm test` vérifie navigation, chrono, transitions, conduite, garde et récupération du boss, ainsi qu'une mission complète par commandes simulées. `npm run build` vérifie les types et produit dist. `npm run format` met le code en forme.

## Limites et suite

Dessins procéduraux encore provisoires ; les trois missions réutilisent le même collège. Les tests simulés ne remplacent pas l'audit humain du rythme. Le trajet guidé laisse volontairement une marge importante. Premiers sons à régler à l'écoute ; aucune musique. Le relief et les virages restent une évocation arcade. Aucune publication effectuée.

## Passe 0.7

- Collisions routières : secousse, perte de vitesse, déport, débris, jauge et détérioration visuelle. Les dégâts persistent entre affectations ; une panne pendant une mission la fait échouer. Le dépannage remet la voiture à 65 %.
- Coups de livre : bref arrêt sur impact, particules et retour sonore. Cet arrêt ne consomme pas le chrono.
- Parent en colère dans le hall : charge annoncée, saut pour esquiver, collision contre le mobilier qui le sonne.
- Choix de parcours : détour par les étages ou passage technique plus court avec deux brèches à sauter.
- CADRE : révélation progressive de la porte, messages administratifs et bilan avec kilomètres, chocs et coups.
- Tests ajoutés : dégâts persistants, panne et dépannage, charge du parent et traversée du raccourci.

## Passe 0.8 — ambiance

Palette béton humide / néons / ambre administratif. Écran titre illustré, façades urbaines et ciel selon la journée, détails de voiture et feux de freinage, murs écaillés et briques, portes à panneaux, néons intermittents, cour meublée. Respiration, pas et traînée du livre renforcent les animations. Le CADRE affiche une attente sans destination, des messages satiriques et une jauge du personnel.

Audio synthétique sans fichier externe : moteur filtré avec changements de régime, chocs bruités, signal rectoral, sonnerie, bourdonnement et gouttes, porte, avertissement des trente dernières secondes. M coupe tous les sons, P les atténue pendant la pause. Les ellipses restent silencieuses. Le son se débloque à la première touche. Équilibre sonore à auditer à l’écoute sur le poste joueur.


## Passe 0.9

Cruising plafonné à 110 km/h avant notification. Trajet de 4,2 km et alerte unique sous 3 km avec son associé. Chargement DATA et cadre lumineux à la réception. Trafic espacé irrégulièrement, vitesses distinctes, camions à portes arrière, voitures de plusieurs couleurs. Maisons, panneaux, rochers et arbres répartis sur les bas-côtés. Textes scolaires sur supports contrastés et positions arrondies. Inspecteur en costume, parent élargi avec téléphone. Balayage ramené de 90 à 42 pixels, jambe visible. Tests de régression ajoutés pour vitesse, alerte et portée.


## Passe 0.10

Rendu 640 x 480 avec monde logique 320 x 240, zoom 2 et textes à résolution 2. Accélération visuelle progressive au-dessus de 110 km/h (facteur 2,7 à 260), distance mission toujours calculée en km/h. Alerte unique sous 1 km, grand encart de distance avec progression, affichage en mètres et bordure animée à proximité. Détails supplémentaires du parent, de l’inspecteur et de la voiture. Tests de seuil et mission complète validés ; cadrage et netteté contrôlés dans le navigateur.


## Passe 0.11

Les virages déportent la voiture vers l’extérieur selon la vitesse et demandent de contre-braquer. Du trafic occupe désormais le centre de la chaussée. L’affichage de distance devient une progression relative du trajet, suivie de TOUT PROCHE, adaptée au défilement arcade. Alternance de secteurs bâtis et boisés, façades plus détaillées, accotements texturés. Galerie chargée sur la voiture, également présente à l’arrivée ; lunettes et détails du prof ; panneaux, fenêtres, tuyaux, portrait institutionnel et panier abîmé dans la cour. CADRE enrichi de détails matériels. Tests : déport sans commande, circulation centrale et mission complète.


## Passe 0.12 — sensations et première direction pulp

Traces temporaires sous freinage ou braquage brusque, crissement, carrosserie qui résonne davantage si abîmée. Souffles de dépassement stéréo, plus forts pour un frôlement et plus graves pour un camion, déclenchés une fois au passage. École assombrie : verts sales, portes sombres, ombres architecturales et hachures, contours des personnages encrés. Lisibilité contrôlée visuellement ; équilibre sonore à auditer à l’écoute. Inclut les corrections de déport doux et le trafic progressif 5/8/11.


## Passe 0.13

Radio FM pendant le cruising : trois bulletins satiriques fictifs sous-titrés, synthèse vocale française du navigateur si disponible, interruption dès notification, coupure avec M ou pause. Bruitages procéduraux de chaises, papier et craie sur le noir de Bon. Reprenons., arrêt à la sortie de cette phase. Timbres électroniques adoucis. Palette routière sombre, bitume usé, voitures désaturées, visages et vêtements ombrés. Escaliers avec marches contrastées, rampe et indication de direction. Retour des kilomètres calculés à partir des km/h ; amplification visuelle à haute vitesse réduite de 2,7 à 1,65. Audit visuel effectué, sons synthétiques et voix dépendante du poste encore à auditer à l’écoute.

## Jouable local autonome
Ouvrir Jouer-Technoprof.html par double-clic, ou Jouer.cmd. Aucun serveur nécessaire. Technoprof-0.13-local.zip contient le jouable et les instructions. Les prochaines compilations régénèrent automatiquement le HTML autonome.


## Passe 0.14
Radio Educ France intégrée au CADRE, reprise du bulletin à sa fin jusqu’à notification. Signalétique allégée. Chutes animées avec disparition sous le sol, récupération au bord et dégât unique ; brèches balisées. Contours et hachures supplémentaires sur véhicules. Jouable autonome régénéré.


## Passe 0.15
Décors ancrés dans le monde, sans changement de type au passage de quartier. Lampadaires, ponts, châteaux d’eau, façades et accotements variés. Voitures à toit étroit et vitrage incliné. Présentation des adversaires et de leur motif ; inspecteur : rapport d’aptitude et menace sur le poste, introduction hors chrono. Jouable local actualisé.


## 0.16 — Direction graphique commune
Palette de quinze pigments (encre, ardoise, tabac, papier, rouille), partagée par les scènes. Silhouettes humaines allongées, manteau et visages anguleux, costumes des adversaires adaptés. Voitures polygonales communes au joueur et au trafic, profil de la cinématique redessiné. Ciel stratifié, végétation irrégulière, matériaux des bas-côtés, ombres de façades, briques, hachures et portes usées. CADRE en métal sombre et papier. Gameplay inchangé ; compilation et tests de boucle validés. Export HTML autonome régénéré.

## 0.19 — Première tranche graphique jouable
Salle 42C : décor issu de la référence validée, deux personnages en sprites avec huit poses et ancrages explicites. Galerie de poses et retournement. Bibliothèque générée par imagegen, fond magenta supprimé au chargement. Les images sont embarquées dans les HTML locaux. Lancer Jouer-Salle42C.html pour le combat ou Jouer-Technoprof.html pour la journée. Bible : art/BIBLE-GRAPHIQUE.md. Les autres salles et la conduite restent à décliner après cet audit.

## 0.20 — Combat des sprites et entrée en classe
Séparation au sol (52 unités), portées adaptées à 42C, direction des attaques verrouillée pendant leur préparation, retournement autour des ancrages. Impacts enregistrés avant le recul, hauteur distincte pour livre/tampon, feedback de garde et de blessure. Marche adverse pilotée par distance parcourue, disparition après défaite. Porte sur une couche derrière le prof ; déplacement vers la classe et fondu hors chrono. Tests de séparation, contact, sprites et séquence de sortie ajoutés.


## 0.21 — Voiture de service
Sprite dessiné en trois vues : arrière, virage et profil pour le stationnement. Roues, lunette, sacoche, livres, rouille et pare-chocs rafistolé. Inclinaison légère, suspension, feux stop et dégâts raccordés au nouveau gabarit. Les effets et fondus passent devant le sprite. Le trafic et les décors conservent leur rendu précédent pour la prochaine étape.

Source : art/car-21/service.png. Prompt : art/car-21/prompt.txt. Génération avec imagegen intégré ; fond magenta supprimé au chargement, sans modifier le PNG source. Sprite embarqué dans le HTML autonome.

## 0.22 - Premier quartier routier
Trois sprites de trafic : berline, citadine et camion. Facades, abri de bus, lampadaires et mur cloture avec trottoirs projetes. Les accessoires sont ancres dans le monde, independamment de la notification et du segment courant. Tri commun en profondeur pour sprites et ponts ; masquage aux limites de la fenetre de jeu. Le premier quartier se repete sur le parcours ; ciel et arrivee restent a harmoniser.
Assets : art/road-22/traffic.png et district.png ; prompts dans art/road-22/prompts.txt. Images produites avec imagegen integre, fond magenta retire au chargement. Tests de geometrie, permanence des objets et ordre des couches, plus tests existants. Export HTML autonome verifie via serveur local.


0.22.1 : facades, murs et abribus repartis des deux cotes par groupes de trois adresses, miroir selon le cote. Gabarits du trafic agrandis : citadine 46, berline 52, camion 68 unites au premier plan (voiture du joueur 42).

## 0.23 - Ciel et chaussee
Panorama genere avec imagegen integre (art/sky-23/horizon.png ; prompt.txt), embarque dans le HTML. Nuages et ligne urbaine decoupes en deux plans au chargement, deplacement lent et faible parallaxe de virage. Quatre adresses sur dix sont ouvertes pour casser la repetition ; trottoirs, acces, herbes, caniveaux et patches sont positionnes selon la distance dans le monde. Arrivee et variations horaires restent pour la suite. Compilation et tests passes, export autonome inspecte via serveur local.

Correctif 0.23 : retrait de la passe historique des bas-cotes qui recouvrait les trottoirs ; couleurs des raccords, caniveaux et acces choisies directement dans la palette finale pour eviter leur fusion. Verification visuelle de l export et tests reussis.

## 0.24 - Arrivee au college
Facade dessinee, grille a deux battants animee, portiere, professeur issu de la planche de sprites. Stationnement puis marche vers l entree et recul en profondeur avant fondu ; durees preservees, hors chronometre. Essai autonome Jouer-Arrivee.html. Parametre essai=arrivee&instant=4.4 pour arret sur image de verification. Les autres salles a pied conservent leur rendu precedent, sauf 42C.
Decor produit avec imagegen integre : art/arrival-24/college.png ; prompt dans le meme dossier. Verification visuelle du cadrage et passage vers la cour ; compilation et tests reussis.


## 0.25 - Cour jouable
Cour coherente avec la facade d arrivee, banc, jardiniere et seuil raccorde a la ligne de marche. Professeur dessine, animation et retournement, signaletique fixee a l entree. La sortie a droite mene toujours au hall ; les autres tableaux gardent leur rendu precedent. Essai autonome Jouer-Cour.html. Tests et controle visuel passes.
Imagegen integre : art/court-25/cour.png ; prompt.txt. Recadrage du fond au chargement pour aligner le seuil, source conservee.


A FAIRE (retour utilisateur) : remplacer le miroir du virage droit par une vraie vue droite ; conserver la position des livres, sacoche et panneaux de carrosserie asymetriques. Retouche reportee volontairement.

## 0.26 - Hall et parent d eleve
Hall dessine, guichet, porte d annexe et passage vers les escaliers. Parent avec quatre poses raccordees aux etats existants : interpellation, preparation, charge et recul. Professeur anime, pieds ancres au sol, trou aligne avec la collision ; acces annexe conserve. Essai autonome Jouer-Hall.html. Les autres couloirs et escaliers restent a harmoniser.
Images produites avec imagegen integre : art/hall-26/hall.png et parent.png ; prompts.txt. Recadrage et suppression du fond magenta au chargement, sources conservees.

## 0.27 - Hall decrepit et charge lisible
Charge du parent : 100 unites/s au lieu de 190 ; preparation 1 s, charge 1,9 s, recuperation 1,1 s hors choc. Hall revise avec imagegen (art/hall-27/hall.png) : cloison de vie scolaire, vitrage casse et rafistole, luminaire hors service, fissures, sol mat use et dalles manquantes. Disposition et collisions conservees. Ancienne image conservee dans hall-26.
Direction pour les prochains decors : college public francais ordinaire des annees 1960-1980, materiaux modestes, reparations visibles, deterioration localisee aux objets ; eviter les conventions de high school americain et les symboles touristiques. Les autres decors restent a reprendre progressivement.

## 0.28 - Cour harmonisee
Revision du decor uniquement : vitrages casses et rafistoles, panneau de contreplaque, store tordu, enduit fissure, descente d eau reparee, banc abime, corbeille metallique et bitume mat rapiece. Eclairage du porche partiellement hors service. Cadrage, seuil, ligne de marche et acces au hall conserves. Source precedente conservee. Imagegen : art/court-28/cour.png, prompt.txt.

## 0.29 - Escalier de l annexe
Decor dessine avec marches et rampe lisibles, vitrage rafistole, peinture ecaillee et sol mat. Professeur a l echelle du hall. Plaques fixes et aide contextuelle aux deux acces. Geometrie du parcours conservee, changement de tableau par Haut/Bas. Escalier central et escalier de service restent a harmoniser. Imagegen : art/stair-29/annexe.png ; prompt.txt.

## 0.29.1 - Gabarit interieur commun
Annexe recadree sans regenerer les objets : porte environ 55 x 108 unites logiques, comme celle du hall (55 x 107), seuil y159, professeur echelle .18 dans les deux pieces. Recadrage source annexe x50 y120 largeur1382 hauteur627 sur1672x941. Pied de l escalier versx235, dans sa zone interactive200-295. Conserver ce gabarit pour les salles suivantes ; la cour garde sa perspective exterieure.

## 0.30 - Escalier central
Nouvel asset central : escalier condamne par barriere, passage technique ouvert, indications fixes vers le detour. Porte ~57x107 unites, seuil159, professeur .18 ; reference hall55x107. Source art/central-30/central.png, prompt.txt. Escalier de service, passerelle et passage technique restent a harmoniser.

## 0.31 - Passage technique
Nouveau fond : conduites et coffret electrique, vitrage rafistole, enduit degrade. Porte meme gabarit que hall ; professeur .18 et seuil159. Deux trous dessines selon les collisions95-128 et190-223, bords casses et marques ambre ; masque du professeur sous le sol durant la chute. Source art/technical-31/passage.png et prompt.txt. Passerelle, escalier de service et aile C restent a harmoniser.

## 0.32 - Escalier de service
Palier et deux acces dessines, escalier descendant vers droite, signaletique et professeur .18. Recadrage source100,120,1440,627 pour portes ~55x107 et seuil159, meme gabarit que hall. Source art/service-32/service.png et prompt.txt. Passerelle et aile C restent a harmoniser.

## 0.33 - Passerelle et vigile
Vue vitree vers la cour en contrebas, vitrage rafistole et lecteur de badge. Porte55x107, seuil159, professeur .18. Vigile : badge/radio/clefs, quatre poses ; preparation .75s, poussee a54unites, recuperation .85s, livre56unites. Silhouettes detourees au chargement par contours polygonaux car les sorties imagegen gardaient le fond sombre. Assets et prompts : art/bridge-33. Source intacte conservee. Aile C et eleve restent a harmoniser.

## 0.34 - Aile C et eleve
Couloir de classes 40C/41C, acces service et direction 42C. Seuil159 et portes coherentes avec les autres interieurs. Eleve au telephone : quatre poses, hauteur70 contre81 pour le professeur, anticipation .7s, coup court48unites, recuperation .85s. Direction engagee, saut et recul permettent d esquiver. Sources imagegen intactes et prompts dans art/wing-34 ; contours de sprites appliques au chargement comme pour le vigile. Raccourci local Jouer-AileC.html.

## 0.35 - CADRE commun
Interface procedurale redessinee : metal use, trois compartiments, alphabet bitmap entier sans lissage, vignette de porte a revelation progressive. Chrono commun toujours visible dans le CADRE, destination cachee avant reception, distance en km et alerte sous 1km regroupees dans le tableau. Suppression des doubles compteurs flottants. Etat auto ou professeur selon la phase ; indication SUSPENDU pour les sequences imposees. Galerie statique ?essai=cadre pour comparer les sept etats sans jouer. Aucun asset imagegen supplementaire.

## 0.36 - Echelles et elements diegetiques
DELAIS dans le CADRE. Voiture dimensionnee sur hauteur de carrosserie, ancrage pneus, profil agrandi et portiere recalee. Nouvel atlas imagegen art/school-36 : fermeture de chantier, plaque emaillee, bord de dalle effondree. Fermetures aux seules limites non traversables ; limites physiques ajustees sans supprimer les acces Haut/Bas. Trous alignes sur collisions et recadrage vertical du professeur en chute, compatible WebGL. Plaques et lettrage derriere les personnages ; commandes dans le CADRE. Dialogues en deux bulles successives pointees vers leur locuteur.


## 0.38 — Continuite du parcours
Les chutes renvoient vers la rive du dernier appui, y compris apres un saut manque. Les entrees respectent les limites physiques des fermetures des le premier affichage. Le CADRE montre le lieu et l etage, avec priorite aux messages temporaires puis aux portes utilisables. Essai direct : ?essai=chutes.


## 0.39 — Trous dans le sol
Le patch commence a la ligne des pieds (159) et occupe 16 unites de sol jusqu a 175, sans toucher les plinthes. Le masquage de chute suit le bord avant du patch et non la ligne de marche. Largeur de collision et retour sur la rive de depart conserves.


## 0.40 — Voiture asymetrique
Vue droite dediee via imagegen, sacoche a gauche et manuels a droite, ruban du pare-chocs conserve a droite. Silhouette et ancrages normalises sur la meme hauteur de carrosserie. Feux stop et echappement suivent les vues et le roulis. Source et prompt dans art/car-40.

FX de combat comics pulp : PAF / CLAC / AIE, eclats au point de contact, anticipation par ! et traits du livre/de charge. Dialogues en petits caracteres bitmap, deux pages de 4,5 secondes. Plaques directionnelles reduites et patinees ; plaque du hall fixee au-dessus de la fenetre. Galerie Retouches : fx-coup, fx-garde, fx-recu, fx-alerte.

## 0.41 — Continuite et confort de test
Pause automatique sur perte de focus/visibilite ; radio et moteur suspendus immediatement, reprise explicite par P. P/M et les repetitions clavier ne font plus avancer le cours. Panneau de pause bitmap avec rappel de commande.

Impacts du livre ancres a la main dans le hall et la passerelle, FX adaptes aux petits gabarits, feedback de collision du parent. Un coup qui touche interrompt la preparation ou la charge adverse. Les changements de salle effacent impacts, particules et hit-stop ; les personnages vaincus cessent de parler.

Export local : un seul HTML autonome et onze raccourcis legers conservant les parametres d'essai. Le jeu principal reste copiable seul. Le paquet complet passe d'environ 765 Mo a 64 Mo avant compression. La 0.40 reste dans son archive et Jouer-Technoprof-0.40.html. Tests supplementaires : pause/reprise, controles de l'ellipse, interruption des attaques, ancrages et transitions. Verifier les exports avec node work/check-local.cjs. Apercu HTTP facultatif : node work/serve-local.cjs, limite a 127.0.0.1:5173.
