# TECHNOPROF — Audit de la version 0.42

## Verdict

**CORRECTIONS NÉCESSAIRES pour passer du prototype jouable à une vertical slice représentative.**

La proposition tient : cruising, injonction administrative, urgence routière, traversée d'un établissement dégradé, confrontation, puis retour au travail. La voiture de service, le livre, le CADRE et « Bon. Reprenons. » donnent une identité reconnaissable. Le problème principal est désormais la cohérence de l'expérience entre ces moments.

La prochaine étape devrait fiabiliser les règles et le langage visuel sur une première affectation complète, puis éprouver deux variations. Ajouter des décors et des effets avant cela augmenterait le coût de correction.

Aucun crash bloquant constaté dans les scénarios examinés. Cela ne constitue pas une certification de l'ensemble des configurations et parcours.

## Périmètre et niveau de preuve

Audit du 23 septembre 2026. Sources et export local 0.42, sans modification du jeu. Les seuls ajouts sont cet audit, le plan associé et un script de diagnostic dans `work/`.

- **Exécuté :** six scripts de `npm test`, contrôle de l'export autonome, simulations ciblées supplémentaires. Tous les tests existants passent.
- **Observé dans le navigateur :** lancement et cruising, affectation, hall, passage technique, escalier de service, route en virage, planche de blessure, confrontation réelle jusqu'à l'échec. Aucun message d'erreur dans la console inspectée.
- **Lu :** règles de conduite, combat, navigation, progression, présentation, audio, HUD, assets et export.
- **Non validé perceptivement :** qualité sonore à l'écoute, sensation de conduite lors d'une session humaine continue, confort à la manette, performances mesurées sur une machine de référence, compréhension par un nouveau joueur. Les vues figées ne prouvent pas la qualité d'une animation.
- Deux revues auxiliaires ont échoué sur une limite de service ; leurs conclusions ne sont pas utilisées. L'analyse a été poursuivie directement.

Les mesures supplémentaires viennent de [work/audit-042.cjs](work/audit-042.cjs), avec résultats dans [work/audit-042-results.json](work/audit-042-results.json). Il réutilise le chargement de logique du test existant, sans renderer ni audio réels : ses résultats sont des preuves de règles, pas des mesures de ressenti.

## Lecture globale

| Axe | Ce qui porte déjà le jeu | Ce qui limite le passage au stade supérieur |
|---|---|---|
| Boucle et rythme | Deux temps distincts ; temps partagé ; retour au travail | Trois affectations largement identiques ; tension contournable ; dialogues et chrono en concurrence |
| Conduite | Accélération, freinage, inertie, collisions, dégâts persistants | Bande latérale sûre ; circulation régulière ; parcours sans véritables situations composées |
| Combat | Un geste simple, adversaires différenciés, préparation et récupération | Introduction exploitable ; réaction du professeur trop faible ; portées liées au renderer |
| Navigation | Détour et raccourci ; touches visibles sur les accès | Géographie surtout mémorisée ; changements de tableau et d'échelle peu expliqués |
| Direction artistique | Identité française, usure, silhouettes et objets reconnaissables | Écart entre beaux sprites, surfaces routières plates, UI et animation ; éclairage journalier peu effectif |
| UI/UX | CADRE constant ; chrono dominant ; distance et santé séparées | Échec peu explicite ; interface de développement exposée ; apprentissage dispersé |
| Audio | Événements et intentions variés, radio, ambiance de classe | Synthèse dépendante du poste ; pas de sous-titres radio ; mixage non réglable |
| Technique | Export autonome, tests de transitions, scènes reproductibles | Tests parfois sur un ancien comportement ; paramètres dispersés ; cadence non indépendante du framerate |

## Problèmes trouvés

### G01 — [IMPORTANT] L'introduction désactive aussi la collision et la réaction des adversaires

**Observation démontrée.** L'élève et le vigile restent attaquables pendant leurs neuf secondes de présentation. Le `continue` qui empêche leur agression empêche également leurs mises à jour de séparation et de stun. Le professeur peut se superposer à eux, voire les éliminer avant la fin de la première page.

**Pourquoi cela compte.** La mesure destinée à permettre la lecture devient une période de vulnérabilité gratuite. Elle incite à frapper avant d'écouter et réintroduit les chevauchements que le projet cherchait à supprimer. Un personnage touché peut rester figé dans sa pose de recul jusqu'à la fin du délai.

**Preuve.** `src/main.ts:1261` applique les dégâts ; `src/main.ts:1308` bloque les mises à jour ennemies. Les séparations se trouvent dans `updateStudent` et `updateGuard`, donc après ce blocage. Simulation à portée, à x=170 : élève et vigile vaincus en 0,72 s, avec 8,28 s de présentation restantes et aucune blessure du professeur. En avançant 0,46 s, séparation de seulement 0,9 unité avec ces personnages.

**Test en jeu.** Arriver à portée pendant la première bulle, continuer à marcher puis frapper deux fois. Comparer avec le même geste après la présentation.

**Correction minimale.** Séparer collision, réaction à un coup et autorisation d'attaquer. La collision et les réactions doivent toujours fonctionner. Choix à arbitrer : une attaque volontaire du joueur interrompt-elle la présentation et engage-t-elle le combat ? Recommandation : oui, avec réaction claire ; conserver le temps de lecture tant que le joueur n'engage pas les hostilités. Ne pas imposer ce choix sans validation de Nicolas.

### G02 — [IMPORTANT] Une bande de conduite permet d'ignorer tout le trafic

**Observation démontrée.** Tenir la voiture près de x=-0,98, en corrigeant simplement la dérive, permet de terminer les trois trajets sans collision. Le même principe existe à droite.

**Pourquoi cela compte.** Le joueur expert trouve une trajectoire dominante qui supprime presque tout choix de dépassement ou freinage. Augmenter le nombre de voitures ne corrige pas cette règle ; cela pénalise surtout le débutant qui reste dans les voies.

**Preuve.** `src/main.ts:1060` ne ralentit qu'au-delà de |x|=1. Les centres du trafic sont essentiellement -0,62, 0 et +0,62, avec un seuil de collision maximal de 0,30 (`src/main.ts:1099`). Les simulations avec accélération maintenue et correction latérale ont fini les trois routes en 63,66 s chacune, à 100 % d'intégrité et zéro choc. Le test de mission complète emploie déjà cette stratégie (`work/check.cjs:27`). Départ de simulation : affectation active, 40 km/h ; ces temps excluent le cruising et la cinématique.

**Test en jeu.** Faire une mission uniquement en longeant une bordure, sans chercher à se replacer dans la circulation.

**Correction minimale.** Faire coïncider largeur visible du véhicule, emprise roulable et ralentissement sur l'accotement. Composer quelques situations de trafic qui demandent un choix, sans obstacle apparaissant au dernier moment. Conserver une marge de récupération pour les débutants. Ne pas compenser par davantage de trafic uniforme.

### G03 — [IMPORTANT] La présence des graphismes change les règles ; le test complet couvre l'ancien combat

**Observation démontrée.** `usesSliceArt()` détermine portée du livre, portée du boss, séparation corporelle, immobilité pendant le coup et durée d'ouverture de porte.

**Pourquoi cela compte.** Une modification de présentation peut modifier silencieusement le gameplay. Le succès des tests donne une assurance excessive sur le jouable.

**Preuve.** `src/main.ts:1228`, `1267`, `1333`, `1669`. Le scénario « full mission » s'exécute avant la première initialisation de `g.art` dans `work/check.cjs:65`. Il utilise notamment les portées réduites et non le combat affiché au joueur. Des tests isolés couvrent les grands sprites, mais pas l'ensemble de la mission avec ces règles.

**Test.** Rejouer le même scénario avec le profil réellement livré, indépendamment du chargement des textures ; comparer positions, dégâts et durée.

**Correction minimale.** Définir un profil explicite de combat et ses ancrages ; le renderer le lit mais ne le choisit pas par sa seule présence. Faire tourner la mission complète avec ce profil. Pas besoin de changer de moteur ni de réécrire tout le projet.

### G04 — [IMPORTANT] Un coup reçu n'a pas encore une réaction corporelle convaincante du professeur

**Observation code et visuelle.** La blessure retire un point, déclenche son et shake, puis une période d'invulnérabilité. La sélection de pose du professeur ne comporte pas de véritable état blessé. Dans la vue `fx-recu`, le personnage reste en garde et « AIE! » recouvre son visage. Cette vue est une composition figée, pas une capture d'un coup réellement reçu.

**Pourquoi cela compte.** L'effet annonce un choc que le corps ne confirme pas. Des onomatopées supplémentaires ne suffiront pas à donner du poids. Les réactions sont également inégales : le vigile ne reçoit pas le même hit-stop au contact que le parent ou l'élève ; le parent disparaît immédiatement à sa défaite alors que d'autres ont une sortie animée.

**Preuve.** `src/main.ts:1683` (`hurt`), `src/slice-art.ts:134` (poses du professeur), `src/main.ts:1548` (vigile), `src/main.ts:3003` (parent rendu seulement si hp>0), `src/comic-fx.ts:188` (position du lettrage).

**Test en jeu.** Recevoir un coup sans agir, pendant un déplacement puis pendant un coup de livre. Pouvoir distinguer à chaque fois : attaque adverse, contact, recul, récupération et reprise de contrôle. Comparer coup réussi, garde et coup dans le vide sans le son.

**Correction minimale.** Ajouter une réaction brève du professeur, un contrat d'interruption explicite et un recul mesuré. Préserver une réponse rapide à l'input : ne pas créer une longue immobilisation punitive. Donner un ancrage de contact et une zone de lettrage à chaque attaque. Harmoniser les sorties d'adversaires. Les durées se règlent ensuite ensemble, en situation.

### G05 — [IMPORTANT] Échec et états terminaux insuffisamment expliqués

**Observation démontrée en jeu.** Après épuisement de la santé, « CARENCE CONSTATÉE » apparaît tandis que le CADRE indique encore « EN COURS » et que « OUVERTURE » peut rester affiché au-dessus du boss. Le même libellé d'échec sert aussi au dépassement du délai.

**Pourquoi cela compte.** La satire administrative fonctionne, mais le joueur doit d'abord comprendre ce qui a terminé sa tentative. Les états figés du combat concurrencent cette explication. L'écran propose Entrée avant que le délai de deux secondes autorise réellement la suite.

**Preuve.** `finish` stocke uniquement succès/échec (`src/main.ts:865`), écran d'échec `2080` environ, `drawSliceSchool` `3227`, modèle CADRE `src/cadre.ts:135` et `283`, attente Entrée `src/main.ts:1030`.

**Test.** Provoquer séparément zéro santé, délai écoulé et panne. Demander au testeur d'expliquer la cause, la conséquence sur la journée et la prochaine action.

**Correction minimale.** Conserver le verdict bureaucratique, ajouter une cause courte et factuelle, arrêter les indications de combat et afficher un état terminal du chrono. Faire apparaître l'invite de continuation lorsqu'elle est utilisable. Conserver la logique voulue : une mission perdue conduit à la suivante.

### G06 — [IMPORTANT] Les trois affectations font surtout varier la difficulté numérique

**Observation code.** Même établissement, salle 42C, plan des tableaux et positions principales. Le trafic passe de 5 à 8 puis 11 véhicules ; le délai de 240 à 225 puis 210 secondes ; le boss gagne des points de vie. La radio et l'identité du premier boss changent.

**Pourquoi cela compte.** Après découverte du trajet à pied, la recherche devient récitation. La difficulté augmente sans enrichir autant les décisions. Le même accrochage répété risque de remplacer le sentiment d'une journée qui use.

**Preuve.** `src/world.ts:2`, `35`, `132` ; `src/main.ts:815` ; destination constante dans `src/cadre.ts:256`.

**Test en jeu.** Faire deux journées complètes : relever les décisions réellement différentes à la deuxième et troisième mission, plutôt que compter les ennemis ou le temps retiré.

**Correction minimale.** Conserver trois affectations, mais donner une variation de situation à chacune : approche routière, accès praticable, détour annoncé, configuration de confrontation. Réutiliser les assets. D'abord rendre la première mission représentative, ensuite seulement créer ces variantes.

### V01 — [IMPORTANT] Le cycle de lumière prévu n'est plus porté par les principaux assets

**Observation code.** Les arrière-plans du collège sont affichés avec les mêmes textures sans variation liée à la mission. Le nouveau ciel routier ne reçoit pas l'heure de la journée. Les variations matin/soir restantes concernent surtout des couches anciennes recouvertes par le nouveau rendu.

**Pourquoi cela compte.** Le CADRE annonce 08:00, 12:00 et 17:00, mais le lieu raconte moins nettement le temps qui passe. Cela affaiblit le rythme journalier demandé dès la conception.

**Preuve.** `src/road-art.ts:106` (`sky`), appel `src/main.ts:2327`, rendus des pièces à partir de `drawHall` ; les variations de `roadSky`/`schoolAtmosphere` appartiennent au rendu de repli.

**Test.** Comparer une capture identique au matin et au soir, en masquant le CADRE. L'heure doit être perceptible sans altérer la lisibilité des menaces.

**Correction minimale.** Un éclairage cohérent par moment de journée, appliqué aux couches utiles : ciel, fenêtres, environnement et personnages avec intensités choisies. Éviter un filtre global qui noircit aussi les textes. Aucun besoin de régénérer toutes les salles.

### V02 — [IMPORTANT] La cohérence graphique doit se régler à l'échelle de l'écran joué

**Observation visuelle.** Le professeur, la voiture et plusieurs intérieurs portent bien la direction pulp. La route montre cependant une chaussée et des bas-côtés très plats entre des façades détaillées, répétées à intervalles réguliers. L'accueil et les textes de combat utilisent encore un registre plus générique. Les props de fermeture répétés presque à l'identique rendent visible la méthode d'assemblage.

**Pourquoi cela compte.** Plus de détails dans un asset isolé peut accroître l'écart avec ce qui l'entoure. Le problème est surtout le niveau de simplification, les ancrages au sol, les masses sombres et la hiérarchie.

**Preuve.** Vues navigateur accueil, cruising, virage, hall et service ; `src/road-art.ts:21` (répartition répétitive), `src/main.ts:2336` (surfaces routières), `src/school-props.ts:283` (fermetures), `src/main.ts:735` (`txt`) et `src/small-lettering.ts` (systèmes de lettrage distincts).

**Test.** Comparer route, hall, boss et arrivée côte à côte à la taille réelle. Examiner ensuite chaque scène en mouvement. Les objets importants doivent se lire avant les textures ; les sprites ne doivent pas sembler glisser sur une illustration.

**Correction minimale.** Fixer un contrat visuel : lignes de sol, gabarits de portes et personnages, palette par fonction, contour, ombres de contact, densité de texture et tailles de texte. Puis traiter quelques familles prioritaires : surface routière, raccords des façades, fermetures, poses. Conserver les assets déjà convaincants.

### U01 — [À SURVEILLER] Navigation mieux indiquée, mais géographie et danger restent à éprouver

**Observation.** Les touches sur les accès ont nettement amélioré la lecture. Elles coexistent avec les panneaux et une ligne contextuelle dans le CADRE. Le plan, toutefois, est fixe ; les changements de tableau sont directs. Dans l'escalier de service, l'escalier dessiné est central alors que les portes latérales portent les actions. Le passage technique montre des trous dans la bande de sol devant la ligne des pieds.

**Pourquoi cela compte.** Un joueur peut comprendre quelle touche appuyer sans comprendre où il va. Pour les trous, l'ouverture visible et la zone qui déclenche la chute doivent être jugées ensemble ; l'alignement numérique du patch ne prouve pas sa lisibilité.

**Preuve.** Observations hall/technique/service ; `src/world.ts:46` (EXITS), `src/passage-hints.ts`, `src/school-props.ts:113` (patch à y=159), `src/main.ts:1377` (chute par intervalle horizontal).

**Test en jeu.** Donner uniquement « Salle 42C » à un joueur neuf. Observer ses hésitations sans guider. Faire aborder chaque trou des deux côtés, à différentes vitesses de déplacement et pendant un combat ; relever où il pense tomber.

**Correction minimale.** Contraster précisément les accès actifs et leurs destinations ; conserver les touches locales. Renforcer le raccord spatial lors d'un changement de tableau et donner un repère propre à chaque pièce. Pour les trous, afficher temporairement l'intervalle de collision et les pieds afin de régler le dessin. Ajouter un plan global seulement si le test démontre qu'il est nécessaire.

### U02 — [IMPORTANT pour diffusion] L'enveloppe reste un outil de développement

**Observation.** Les liens de poses, scènes et essais sont exposés sous le jeu. Les contrôles sont surtout rappelés hors de la fenêtre de jeu. Il n'y a pas de menu de réglages ; M est un interrupteur global. Le zoom FIT peut appliquer une échelle non entière.

**Pourquoi cela compte.** C'est pratique pour Nicolas, mais un nouveau joueur voit de nombreux choix avant de comprendre l'expérience attendue. L'agrandissement arbitraire et les petites polices demandent une vérification sur petit écran. Couper le son ne doit pas retirer un élément narratif indispensable.

**Preuve.** `index.html:19`, `54`, `59` ; `src/main.ts:328`, `938`, configuration finale ; `src/audio.ts:14`. Pas de sous-titre du bulletin radio dans le renderer examiné.

**Test.** Lancer sans consigne externe sur deux tailles de fenêtre. Comprendre accélération, saut, frappe et passage ; mettre en pause, couper le son, reprendre et quitter. Tester aussi la perte de focus pendant une transition.

**Correction minimale.** Séparer « Jouer » de l'atelier de test, ajouter un accueil/une pause cohérents et des rappels au premier usage. Prévoir au minimum volume voix/effets, sous-titres radio, shake réduit et choix d'affichage net. Une couche d'actions facilitera ensuite remapping et manette. L'absence de manette n'est pas un blocker pour cette slice clavier.

### A01 — [À SURVEILLER] Audio narratif et tempo dépendent de la synthèse vocale du poste

**Observation code.** Le bulletin utilise la première voix française trouvée. Sans voix disponible, la radio reste silencieuse et l'affectation arrive via un délai de repli. La fin du bulletin peut elle-même déclencher la mission. Les sons de moteur, matière et impact sont synthétiques ; leur adéquation au pulp n'a pas été validée à l'écoute dans cet audit.

**Pourquoi cela compte.** Deux postes peuvent offrir une voix, une durée de cruising et un rendu sonore différents. L'intention « radio une fois, puis affectation » est bonne mais sa réalisation n'est pas complètement maîtrisée.

**Preuve.** `src/audio.ts:127`, `160`, `185` ; `src/main.ts:1148` (départ sur fin radio ou délai 15/45 s). Le texte dit encore « Radio Service Public » tandis que le CADRE affiche Educ France.

**Test.** Jouer avec et sans voix française, avec le son coupé dès le départ puis au milieu du bulletin, avec pause/reprise. Écouter moteur, frôlement, collision, livre, tampon et classe au casque et sur haut-parleurs.

**Correction minimale.** Bulletin local maîtrisé et sous-titré, avec repli explicite. Définir une petite liste de sons prioritaires et leur contraste : livre/papier, tampon, carrosserie, dépassement, alerte rectorale, retour en classe. Régler le mixage après écoute, sans remplacer automatiquement toute la synthèse.

### T01 — [IMPORTANT sous faible framerate] Le temps simulé ralentit sous 25 images/s

**Observation démontrée.** Le delta est plafonné à 40 ms et le surplus est perdu. À 15 images/s, dix secondes réelles font avancer le chrono de six secondes ; à 30, 60 et 120 images/s, il avance bien de dix secondes.

**Pourquoi cela compte.** Mouvement, fenêtres d'attaque et chrono changent de cadence sur un poste lent. Le temps audio peut continuer à un autre rythme. Cela ne prouve pas que le jeu tourne actuellement à 15 images/s, mais prouve ce qui arrive si c'est le cas.

**Preuve.** `src/main.ts:938` et simulation `clockAtFps` du diagnostic.

**Test.** Mesurer les frame times puis reproduire avec limitation CPU/framerate ; comparer une mission et ses timings, pas seulement le compteur d'images.

**Correction minimale.** Horloge cohérente et simulation en pas bornés avec rattrapage limité, en préservant les pauses voulues. Ajouter les tests 30/60/120 et un scénario dégradé. Ne pas lancer une optimisation générale sans mesure.

### T02 — [À SURVEILLER] Le coût d'itération et de chargement augmente

**Observation code.** `main.ts` dépasse 3 500 lignes et mélange états, règles, essais et rendu. Des valeurs sensibles restent dispersées. Des textes Phaser sont détruits/recréés à chaque dessin. Le HTML autonome pèse 66 333 658 octets et le ZIP 48 423 140 octets. Le chargement construit les textures et leurs masques ; aucune mesure mémoire/frame time n'a été faite ici.

**Pourquoi cela compte.** Risque de régression croisée et difficulté de tuning. Le poids est acceptable pour un prototype local, mais il faut mesurer l'attente avant de distribuer une démonstration. Les galeries figées ne remplacent pas les scènes de test animées.

**Preuve.** `src/main.ts:1946`, `src/road-art.ts:76`, `src/slice-art.ts:39`, `package.json` et taille des exports. Une part du rendu de repli est désormais peu représentative du jeu livré.

**Test.** Mesurer démarrage à froid, mémoire après trois affectations, P95/P99 du frame time en conduite et combat, y compris en pause et sur l'écran titre.

**Correction minimale.** Extraire seulement ce qui accélère les prochains réglages : profils de mouvement/combat, définitions de mission, événements de contact et modèle de HUD. Réutiliser les textes fixes. Préparer des scènes animées avec collisions/états visibles et seed fixe. Conserver le livrable autonome, sans migration de moteur.

## Cohérence du propos

Le meilleur geste du jeu reste sa finalité : parvenir à faire cours. Le livre, la voiture entretenue faute de moyens, les panneaux rafistolés et les sons de classe servent ce propos. Ils méritent d'être préservés.

Le risque éditorial est que le joueur retienne surtout « frapper des parents et des élèves » si c'est la seule action lisible et gratifiante. Ce n'est pas une demande de retirer la baston voulue. Il faut rendre évident le mécanisme : un service empêché par le manque de moyens, les injonctions contradictoires et des rapports d'autorité ; le professeur cherche à passer et travailler. La possibilité de contourner certains adversaires va déjà dans ce sens.

Deux incohérences de texte sont à clarifier : véhicule de service dans l'identité visuelle mais « véhicule personnel » dans les messages de dégâts ; l'inspection annonce toujours un retard, même lorsque l'affectation laisse encore beaucoup de temps. Ce second point peut exprimer la mauvaise foi voulue, à condition qu'il soit présenté comme tel et ne ressemble pas à un diagnostic du système.

La présence féminine est assurée par l'inspectrice, mais elle partage les mêmes règles que son homologue. Il n'est pas nécessaire de créer une nouvelle mécanique pour la distinguer. À terme, une présence humaine non hostile pourrait faire sentir que l'école continue de vivre ; c'est une proposition éditoriale à valider, pas un ajout indispensable à cette slice.

## Ce qui paraît sain

- La mission ne se révèle qu'à la notification ; circulation déjà présente avant celle-ci.
- Le délai est commun à la route et à l'établissement ; les transitions imposées et l'introduction du boss sont exclues.
- L'échec d'une affectation n'arrête pas la journée ; bilan sur trois services et seuil de deux réussites.
- Les accès possèdent des destinations explicites ; le détour et le raccourci existent réellement.
- Les ennemis conservent leur santé lors d'un aller-retour entre tableaux.
- Collision automobile : perte de vitesse, déplacement, dégâts, son, shake et délai protecteur ; bonne base de chaîne de feedback.
- La voiture conserve son asymétrie grâce à une vue droite dédiée ; ses points de fixation sont documentés.
- Dégâts routiers persistants, santé du professeur rétablie entre missions : règles présentes, à mieux exposer au joueur.
- Pause sur perte de focus, reprise explicite, contrôle de l'ellipse et nettoyage des FX entre pièces couverts par des régressions.
- Export autonome et onze raccourcis locaux vérifiés. Pas de dépendance au serveur pour le livrable.

## Tests à effectuer en jeu

1. **Première découverte, sans aide orale.** Un joueur neuf doit partir, comprendre l'affectation, trouver la salle et expliquer un échec. Noter les hésitations et erreurs d'interprétation.
2. **Conduite dominante.** Bord gauche, bord droit, centre, alternance freinage/dépassement : comparer sécurité et intérêt, avec la même seed.
3. **Combat lisible.** Coups dans le vide, garde, réussite, blessure, saut, interruption et défaite, des deux côtés. Revoir en ralenti puis à vitesse normale.
4. **Présentation.** Attendre, traverser le personnage, le frapper, quitter/revenir pendant chaque page. Valider le comportement choisi sans chevauchement ni avantage gratuit.
5. **Navigation/danger.** Tous les passages dans les deux sens, touches maintenues, trou abordé des deux côtés, réception de saut sur une limite, combat près d'un trou.
6. **Journée entière.** Deux parties successives ; relever temps de route, de recherche, de combat, d'attente et raison des échecs. Ne pas régler le chrono sur le seul parcours automatisé expert.
7. **Confort.** Son coupé, sous-titres, petit affichage, pause/focus, cadence dégradée. Ajouter écoute humaine et mesures de performance avant validation publique.

Le plan d'exécution et ses critères de sortie sont dans [PLAN-VERTICAL-SLICE.md](PLAN-VERTICAL-SLICE.md).
