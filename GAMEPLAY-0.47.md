# TECHNOPROF 0.47 — Préparer une découverte autonome

Ouvrir `Jouer-Technoprof.html`. La journée normale commence par un accueil avec **Prendre le service**, **Commandes** et **Réglages**. Les galeries et outils de développement restent accessibles depuis `Jouer-Labo.html`, sans liens ni raccourcis F2/F3/F4 dans la journée destinée aux joueurs.

## Parcours du joueur

L'accueil présente l'objectif : assurer deux cours sur trois affectations. Il explique le départ sans destination, la notification qui déclenche le délai commun à la route et au collège, et l'arrivée automatique hors chrono. L'indicateur de chargement reste visible jusqu'à la préparation du jeu.

De courts rappels apparaissent sous le jeu aux moments utiles : conduite initiale, délai partagé, arrivée, marche dans la cour, livre et saut après la première réplique du parent, ouverture de l'inspection, continuation après le cours. Ils ne couvrent pas le décor et peuvent être désactivés. Les premières répliques restent prioritaires. Les passages conservent leurs touches ancrées dans le monde.

**P ou Échap** ouvre la pause ; la souris et le clavier permettent de consulter les commandes et les réglages. Échap revient d'abord au menu, puis reprend la partie. Les touches maintenues sont relâchées lors de l'entrée ou de la sortie du menu. La perte de focus conserve une reprise explicite. Il n'y a pas de redémarrage destructif dans le menu de pause.

Le bilan indique les trois créneaux, les cours assurés et les causes de carence : retard sur la route, retard dans le collège, panne, épuisement. Le seuil de deux cours est rappelé ; **Nouvelle journée** réinitialise le service, le véhicule et le journal. Les formulations administratives conservent la mauvaise foi du CADRE.

## Audio et repli

- Deux volumes séparés : effets/ambiance et voix radio. Les réglages, rappels et secousses réduites sont mémorisés localement si le navigateur le permet. Le bouton de son et M restent disponibles.
- Un texte unique alimente la voix et les sous-titres des bulletins d'**Educ France**. Le texte est présenté sous le jeu pendant le cruising et disparaît à la notification. Aucun nouveau cadre flottant dans la scène.
- Seule une voix française déclarée locale par le navigateur est choisie. Sans voix compatible, la lecture du bulletin reste possible pendant le cruising de quinze secondes. Une erreur de synthèse ne précipite plus l'affectation après seulement trois secondes. Ce n'est pas une nouvelle voix enregistrée.
- Les sons de conduite et de combat existants sont conservés. Leur appréciation à l'écoute reste à faire ; cette livraison ne prétend pas avoir refait le sound design. Un changement du volume de voix concerne au minimum le prochain bulletin : l'application à une phrase déjà lancée dépend du moteur vocal.

## Journée retenue pour les tests

Les trois services reviennent au même collège et à la même salle 42C. La destination affichée reste donc exacte. On conserve le parcours scolaire appris, les variations de lumière et les réglages déjà validés techniquement : trafic initial de 5 / 8 / 11 véhicules et délais de 240 / 225 / 210 secondes. Les dégâts de la voiture persistent ; le professeur récupère entre services. Un rappel au début des deuxième et troisième services explicite cette pression croissante. Aucune nouvelle bifurcation de parcours n'est ajoutée avant les retours.

## Vérifications

- Suite `npm test` réussie, incluant les régressions précédentes et `work/check-047.cjs` : enchaînement des issues d'une journée, motifs de bilan, relance, touches libérées dans les menus, absence de raccourcis de test en partie normale, repli vocal, volumes séparés, navigation Retour / Échap / P / M et rappels qui respectent les dialogues.
- Compilation TypeScript, export autonome et contrôle des treize raccourcis réussis. Les avertissements connus de taille du bundle Vite et de lecture TypeScript expérimentale dans les tests restent présents.
- Observation navigateur : accueil sans liens de développement, réglages utilisables au clavier et mémorisés après rechargement, départ, pause automatique, bilans de maintien et de radiation. Les bilans ont été ouverts via des aperçus explicites dans la galerie `?essai=accueil` ; cela vérifie leur présentation, pas une journée jouée à la main.
- Aucun avertissement ou erreur JavaScript relevé pendant ces observations. Le navigateur d'arrière-plan déclenche la pause de protection contre les images longues : fluidité, mixage et compréhension réelle par une personne extérieure restent à valider.

## Livraison pour les tests

`Technoprof-0.47-testeurs.zip` ne contient que le HTML autonome, `Jouer.cmd`, une note de lancement et les questions à consulter après la partie. Pas d'installation, de compte ni d'envoi automatique de retours. Les outils de développement restent dans le dossier du projet et l'archive locale complète.

La 0.46 est conservée. La prochaine étape utile est la session de découverte : l'autonomie est maintenant préparée, elle devra être confirmée par les observations des joueurs. Après ces retours, cibler le sound design et les confusions récurrentes, plutôt que modifier plusieurs paramètres de difficulté simultanément.
