# Retour Maison — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans; implement in this session. Track with the checkboxes below.

**Goal:** Ajouter le retour nocturne protégé entre le troisième cours et la conclusion.

**Architecture:** Réutiliser la route et ses contrôles avec les états home/homeArrival. Paramètres et circulation dans driving.ts, sélection musicale dans music.ts, nuit dans la présentation et RoadArt ; CADRE spécifique sans chrono. Aucun changement aux trois affectations.

**Tech Stack:** Phaser/TypeScript, HTMLAudioElement, Python/NumPy, Node harness et Playwright.

**Spec:** docs/superpowers/specs/2026-10-25-retour-maison-design.md

## Global Constraints

3 km, maximum 110 km/h, aucun chrono, aucun nouveau service, aucune défaite sur le retour. Arrêt 1,8 s puis noir 1,2 s avant la conclusion. Musique smooth jazz instrumentale, samples 8 bits, contrôles existants. Branche locale existante ; 0.61 et GitHub Pages inchangés.

## Review Focus

Mission 3 ne doit pas dépasser les tableaux de palettes. Relâcher un input à l'entrée ne doit pas maintenir le frein ou l'accélération. Pause/focus/menu pendant l'arrêt doivent figer le fondu et le son. Plusieurs appels next ne doivent pas répéter le retour ou le résultat. Une voiture arrivée très abîmée doit pouvoir rentrer sans réparation magique ni panne.

## Task 1 — Composition

- [x] Créer tools/compose-home-radio.py : partition originale à 76 BPM, 16 mesures, quatre voix, exports WAV/MOD/partition/manifest dans audio/retour-maison-2026-10-25.
- [x] Vérifier durée, samples 8 bits, niveaux, boucle sans écrêtage ; conserver les autres morceaux.

## Task 2 — Boucle jouable et présentation

- [x] Écrire work/check-home-return.cjs : dernier cours -> home -> homeArrival -> ending, pas de chrono/notification/dégâts, km réels, faible densité, 30/60/120 FPS, frein et reprise, pause/relance, absence de quatrième résultat. Constater l'échec avant implémentation.
- [x] Ajouter HOME_DRIVE et homeTrafficCue dans src/driving.ts ; raccorder src/main.ts, les contrôles directs, le sélecteur musical et les scénarios atelier.
- [x] Adapter src/cadre.ts à Maison/fin de service et src/presentation.ts + src/road-art.ts à la nuit, conserver l'ordre des couches et les pools de lumière.
- [x] Faire passer test:retour-maison, test:cinematiques, test:musique, test:journee, test:ambiance-route et tsc. Actualiser uniquement le test de campagne qui attendait la fin immédiate.

## Task 3 — Jouable local et observation

- [x] Construire le jouable et la journée ; ajouter Jouer-Technoprof-Retour-Maison.html et le scénario home-return. Vérifier la même route dans la journée complète.
- [x] Observer Chrome/Firefox et touch : nuit lisible, faible trafic, vraie lecture musicale, moteur, pause/focus, distance, arrêt puis noir complet avant ending. Rapport/captures work/checkpoints.
- [x] Relire le diff et la continuité ; corriger les régressions puis committer sans publier. Documenter le lancement exact et les réglages.

## Ledger

- Base bfde49f, seul fichier utilisateur non suivi : work/github-pages-mobile-061.png, préservé. Travail dans la branche codex/three-assignments-cinematics déjà dédiée à la continuité de campagne.
- Ruling: maquettes d'intro/fin non intégrées dans cette passe — respecter les fichiers validés et limiter la tâche au quatrième trajet — la journée utilise encore son montage intégré précédent, à harmoniser ensuite.

- Preuve RED : `work/check-home-return.cjs` échouait initialement sur `ending !== home` après le troisième cours. GREEN : route protégée, kilométrage, pause, frein/reprise, arrêt, noir et fin à 30/60/120 FPS.
- La revue indépendante a trouvé un gain radio supérieur à 1 avant le fondu (volume .4 devenait 1 à age 0). Assertion ajoutée et échec reproduit ; gain borné puis tests musique/retour repassés. Aucun autre défaut important relevé.
- Ruling: ajout d'un maintien noir de 0,25 s après le fondu pour garantir une vraie image noire avant la conclusion, y compris à 30 FPS.
- Vérifications : `test:retour-maison`, `test:cinematiques`, `test:musique`, `test:journee`, `test:ambiance-route`, `test:interface`, `test:gamefeel` et `build:atelier` passent. La journée pilotée par les entrées réelles inclut le retour et un unique événement de fin à 3000 m ; aucun quatrième résultat, dégâts du dernier service préservés.
- Navigateur : Chromium a parcouru les 3 km, Firefox les derniers 70 m ; musique native effectivement lue, pause/mute/reprise et pause pendant le stationnement, volume de stationnement .5 inchangé, zéro avant la conclusion. Captures noires relues dans les deux moteurs. Touch 390 × 844 : son natif et aucun débordement. `audio/retour-maison-2026-10-25/browser-verification.json`, captures `work/checkpoints/home-*`.
- Musique : 50,526 s, source MOD M.K. quatre pistes / neuf samples 8 bits, diffusion stéréo 16 bits à 22050 Hz. Pic 0,646, jonction de boucle sans saut de sample ; rapport `verification.json`.
- Note QA : le premier contrôle de mute pressait deux fois M avant que le relâchement physique puisse être échantillonné. Reproduction résolue en laissant 180 ms entre les deux pressions ; aucune modification des contrôles du jeu nécessaire.
- Export local reconstruit, raccourci Retour-Maison disponible ; avertissement Vite de taille de bundle déjà connu (exports autonomes avec images embarquées). SHA256 0.61 conservé : 05713E027D7DCB4B5CD8AAA6E2E74B53D1EA45526215E33CC8FE4E905B94DD65. Aucune publication.
