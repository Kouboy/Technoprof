# Intégration de la bande-son complète — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les douze morceaux retenus audibles dans la journée musicale locale, avec les bons contextes et des transitions fiables.

**Architecture:** Conserver un seul lecteur HTMLAudioElement chargé à la demande. Un sélecteur pur distingue titre, trois routes, exploration, boss, infirmerie et échec. Sauvegarder uniquement l’offset d’exploration pendant le détour de soin ; invalider les opérations asynchrones et les offsets au redémarrage d’une mission.

**Tech Stack:** TypeScript, Phaser, HTMLAudioElement, WAV externes locaux, tests Node/VM et Playwright Chromium/Firefox.

**Spec:** Demande de Nicolas : « intégrer tous les morceaux dans le jeu que je puisse tester dans le flow ». Identités et fichiers : audio/complements-2026-10-23/README.md. Contrat ci-dessous.

## Global Constraints / contrat

- Travail dans le dossier et la branche atelier existants pour le test local ; aucune publication. Le jouable 0.61 reste intact.
- Profil `?musique=essai` et raccourci Jouer-Technoprof-Journee-Musique.html conservés. Aucun changement de conduite, combat, délais, soins, contrôles ou topologie.
- Titre approuvé avec gain 1,8 et volume général Musique conservés. Radio 1 pop-rock, radio 2 bossa, radio 3 fusion, après bulletin et DATA uniquement.
- Boss vivant : thème propre à sa mission, atténué pendant l’introduction. Boss vaincu : silence dans l’arène avant l’ouverture et les cloches.
- Infirmerie : thème doux à la place de l’exploration, puis reprise de l’exploration au même offset. Revenir dans une pièce de soin déjà utilisée reste musicalement calme sans rejouer le soin.
- Échec route ou école : laisser 0,45 s aux SFX d’échec, puis Game Over en lecture unique ; pas de relance chaque frame, en pause, par mute ou par bouton de reprise audio.
- Pause, focus et mute suspendent sans perdre le décalage. Le passage à un autre contexte coupe la piste précédente ; un seul lecteur actif.
- Les WAV restent inchangés et externes. Ne pas ajouter tout le pack au bundle graphique. Pas de nouveau système ni de dépendance.

## Review Focus

- Rejet de play obsolète après remplacement de piste : ne pas bloquer la nouvelle lecture.
- Métadonnées tardives du morceau d’exploration : appliquer la reprise au bon fichier uniquement.
- Game Over terminé puis pause/mute/retry : rester terminé ; nouvel échec après reset : jouer à nouveau.
- Sortie de soin pendant transition ou échec : ni double thème ni offset conservé dans la mission suivante.
- Boss à 0 PV pendant introduction/transition : couper sa musique, sans relancer celle du bâtiment dans l’arène.

## Task 1 — Sélecteur et cycle de lecture

**Files:** src/music.ts, work/check-music-trial.cjs.
**Interfaces:** MusicState ajoute schoolContext (exploration/boss/care/cleared) et age ; musicTrack sélectionne les douze pistes ; MusicKit.stop efface aussi la reprise de soin.

- [x] Écrire et exécuter les tests rouges : trois autoradios, trois boss, soin/reprise, victoire, délai d’échec, lecture unique et nouvel échec.
- [x] Implémenter le sélecteur, la reprise d’exploration avec garde de métadonnées, et le garde-fou ended du Game Over.
- [x] `npm run test:musique` : PASS, avec tests de promesses obsolètes et chargement tardif.

## Task 2 — Adaptateur réel et livraison

**Files:** src/main.ts, work/check-music-trial.cjs, README des packs, work/export-navigation-atelier.cjs.
**Interfaces:** Game.syncMusic transmet le contexte de salle, les boss vivants et l’âge de phase ; aucune mutation gameplay.

- [x] Écrire les assertions rouges sur l’adaptateur réel des trois missions, soin, KO et échec.
- [x] Brancher les informations et documenter les trois dossiers audio à conserver.
- [x] `npm run test:musique`, `npm run test:interface`, `npm run test:journee`, puis `npm run build:atelier` : PASS.

## Task 3 — Vérification en contexte

**Files:** work/check-music-browser.cjs, rapport JSON des compléments.

- [x] Parcourir les scénarios natifs des trois routes, trois explorations, trois boss, soins et échecs dans Chromium et Firefox, en conservant les interactions réelles du menu.
- [x] Vérifier lecture native de tous les morceaux, niveaux, pause/mute, Game Over terminé sans relance, sortie vers le silence et démarrage de la journée.
- [x] Revue indépendante du cycle audio et vérification des empreintes des WAV / 0.61 ; commit local et lien de lancement.

## Progression

- Base : 7ea639e. Préflight : le cache de reprise de Task 1 est consommé seulement lors de care → exploration ; begin/loadScenario doivent le vider. Le Game Over est une piste d’échec, pas une nouvelle durée minimale imposée au joueur.
- Tests rouges observés : absence du morceau d’infirmerie ; absence du contexte de soin dans l’adaptateur ; un callback de métadonnées obsolète pouvait effacer le nettoyage du callback courant. Corrections vérifiées par `test:musique` : PASS, y compris métadonnées pendant pause et retour au bon offset.
- Le scénario atelier `exhausted` prépare un impact fatal, il ne représente pas encore une défaite : le test appelle ensuite Game.finish pour déclencher réellement l’échec. Les fixtures `sequence-fail-*` servent au contrôle navigateur du constat affiché.
- Tests interface/journée complète : PASS, dont les profils H1/A3/I2 à 30/60/120 FPS. Exports normal et journée : reconstruits. Aucun WAV modifié.
- Revue indépendante en lecture seule : aucun défaut critique, important ou mineur relevé ; `test:musique` relancé par le reviewer : PASS. Écoute perceptive et navigateurs laissés au contrôle principal. Diff binaire des WAV/MOD/partitions contre 7ea639e : vide ; SHA256 du 0.61 inchangé.
- Le premier essai navigateur s’est arrêté dans le dialogue de soin : le journal montrait seulement deux actions sur six, envoyées avec une durée de touche nulle. Le contrôle utilise maintenant des pressions de 100 ms et attend l’état dialogue affiché dans l’atelier. Reproduction ciblée : six actions reçues, sortie automatique vers la jonction ; aucun changement de gameplay nécessaire.
- Passe navigateur finale : PASS dans Chromium et Firefox. Douze fichiers effectivement lus, niveaux et titre, trois routes/boss/explorations, entrée et sortie de soin par touches, reprise d’offset, arrivée/classe silencieuses et Game Over terminé sans relance sur les frames suivantes. Rapport : audio/complements-2026-10-23/flow-browser-verification.json. Le jugement du mix en situation reste celui de l’essai humain.
