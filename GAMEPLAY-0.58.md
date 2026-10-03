# TECHNOPROF 0.58 — Finition ciblée des nouveaux combats

Première passe du lot 3, livrée pendant l'attente des tests de Nicolas. Les trois missions, leurs cartes, dégâts, portées, délais et règles de victoire sont conservés. La 0.57 reste disponible séparément.

## Ce qui change en jeu

- Les nouvelles poses actives ne sont plus masquées par la récupération, qui commence au même instant que le contact. Le lancer de l'élève dure visuellement 0,25 s, la poussée du responsable 0,28 s ; la poussée de la mère qui filme dispose de 0,22 s. Ces durées montrent un geste déjà résolu ; elles ne prolongent pas la zone de dégâts.
- La mère qui filme prépare sa poussée avec sa pose d'approche, puis étend la main au contact. La ruée du parent influent conserve sa silhouette pendant le déplacement. Un coup reçu ou une défaite reste prioritaire : aucune attaque annulée ne réapparaît à la récupération.
- Le retournement du responsable est un état lisible dans les diagnostics. Le repère au sol indique son côté protégé ; il se fragmente pendant la rotation et disparaît dans l'ouverture. Le texte est regroupé avec sa jauge, à l'écart des visages.
- Quatre gestes disposent de signatures faites avec les matières existantes : appui et vêtement pour la ruée, déclic de radio puis poussée pour la sécurité, papier froissé puis lancer bref pour l'élève, froissement puis mouvement de manche pour la mère qui filme. Chaque départ/préparation produit un seul événement ; les contacts gardent leurs sons distincts de livre, garde et blessure.
- Quatre essais courts sont disponibles dans **Jouer-Labo.html** : « Parent au téléphone / poussée », « Parent influent / ruée », « Élève majeur / lancer », « Responsable sécurité / poussée ». Ils préparent une situation isolée puis emploient les vrais comportements. La pause et le pas de 20 ms permettent de revoir les poses.
- Les extractions de reprise/blessure des deux nouvelles planches excluent désormais les mains et pieds de la pose voisine. Le contrôle en contexte a révélé ce morceau flottant ; les fichiers images originaux restent intacts.

## Technique et vérifications

`enemyPhase` et `newEnemyFrame` partagent une priorité explicite : défaite, blessure, présentation, préparation, attaque active, récupération, retournement, approche. Le dessin ne fait avancer aucun timer. Les durées de pose et l'avance de la parent sont centralisées dans `src/gameplay.ts`.

20 scripts de vérification passent. Les nouveaux tests exécutent le rendu réel des quatre acteurs à 30/60/120 fps simulées, vérifient le passage préparation → pose active → reprise, l'annulation par un coup, le silence en pause et les événements sonores uniques. Les 36 journées continues clavier/contrôle direct, soit 108 affectations, passent à nouveau : trois cours assurés, aucun choc ni chute, comptabilité du délai exact. Ces automatismes connaissent le chemin ; ce ne sont pas des tests de débutant.

Build TypeScript/Vite et export HTML autonome passent. Banque de 28 PNG et 61,58 Mo d'images compressées inchangée ; aucun nouveau fichier sonore dans le jouable. HTML d'environ 83,7 Mo. La limite de taille Vite et l'avertissement du chargeur TypeScript de Node sont connus.

Preuves : [tests](work/tests-058.txt), [rendu et gestes](work/check-058.cjs), [journées](work/day-results-058.json), [build](work/build-058.txt), [ressources](work/resource-budget-058.json). Les résultats historiques 0.57 sont rejoués depuis leur sauvegarde de source, séparément des régressions courantes.

Observation PC dans le navigateur compilé : préparation/poussée du responsable, maintien de la silhouette active, repère sous les pieds, lancer et projectile, séparation de la récupération. Captures dans `work/`. L'ouverture autonome `file://`, les sensations sur téléphone et la découverte extérieure restent à valider.

## Ce qui reste ouvert

Cette passe ne clôt pas le lot 3 : une écoute réelle pendant toute la journée reste nécessaire pour juger le mixage et la fatigue sonore. Un [aperçu sec de 12 secondes](work/gestes-058.wav) et ses [repères](work/gestes-058.txt) permettent de comparer les gestes ; il exclut l'ambiance, la réverbération et le limiteur du jeu. Sa crête PCM est vérifiée, mais cela ne prouve pas son agrément à l'écoute.

À éprouver ensuite : compréhension du contournement, taille du repère de garde, impression de contact des nouvelles silhouettes, ancrage encore sommaire de la boulette à la main, répétitions routières, confort tactile et chargement sur le téléphone choisi. Pas de nouvelle difficulté ni de changement de ton des répliques avant les retours humains.
