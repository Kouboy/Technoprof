# Fenêtre dédiée et préparation des playtests

**But :** lancer la journée musicale dans une fenêtre redimensionnable, puis alléger et ranger le projet sans modifier ses règles ni ses illustrations approuvées.

**Conception :** un mode d'affichage `fenetre=1` partagé entre le fichier autonome et Pages. L'ouverture doit suivre un clic réel, conserver les options de lancement et annoncer un éventuel blocage. La fenêtre adapte le cadre 4:3 à son espace disponible. Une petite barre persistante conserve pause, son, sous-titres et plein écran ; aucun contrôle de jeu en surimpression. La session source est suspendue avant l'ouverture : pas de deux parties sonores simultanées. Une nouvelle fenêtre démarre au titre, sans prétendre transférer une partie en cours. Le plein écran utilise le document entier pour garder les menus accessibles.

**Architecture :** module `src/game-window.ts` pour les commandes de fenêtre et plein écran, styles dédiés dans index.html, raccord après l'installation du menu joueur. Raccourci local léger généré par l'export journée. Aucun framework ni dépendance ajouté.

**Contraintes :** conserver la 0.61, les sources artistiques/musicales, les ateliers utiles, le PNG personnel non suivi et les règles/contrôles/timings. Ne pas confondre rangement et baisse du coût d'exécution. Mesurer avant optimisation ; garder un inventaire vérifiable pour le nettoyage.

## Exécution

- [x] Tester ouverture, blocage, réutilisation, pause et refus du plein écran ; implémenter le mode et son raccourci local.
- [x] Observer Chromium, Firefox et tactile : titre, redimensionnement, menus, sous-titres, reprise et absence de déformation/scroll involontaire.
- [x] Inventorier les modules accessibles, fichiers générés, doublons et dépendances ; mesurer le rendu natif jour/crépuscule avant modification.
- [x] Retirer uniquement les modules prouvés inutilisés ; optimiser un coût mesuré avec comparaison de rendu et documenter les gains/limites.
- [x] Regrouper les commandes de validation et documenter la livraison ; exécuter tests techniques, tests en jeu et revue indépendante avant bilan.

## Registre

- Décision : garder une barre discrète et les sous-titres hors du cadre 4:3, car les cacher pénaliserait les contrôles souris/tactiles et l'accessibilité.
- Décision : préparer cette passe localement sur `codex/window-cleanup`. La publication précédente reste la référence publique pendant les vérifications.
- Vérification : suites historique et playtest réussies ; builds atelier/Pages et 24 raccourcis contrôlés ; 48 vues avant/après identiques dans chaque navigateur.
- Revue : repli audio après popup bloqué et taille Phaser après rotation corrigés. Un vrai reflow tactile 394→469 px conservant le doigt a ensuite reproduit un braquage parasite : la reprojection simultanée de l'origine et de la position le corrige. Confirmé en test automatisé et par une seconde observation native indépendante.
- Mesures : 35 % de rectangles de lettres en moins sur le corpus, aucune différence de pixels. Les variations CPU observées ne justifient pas de promesse globale de FPS ; les deux passages initiaux et le contrôle A/B sont conservés.
