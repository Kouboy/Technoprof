# Arrivée Maison — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans in the current session. Track completion below.

**Goal:** Remplacer le simple arrêt routier par une arrivée devant l'appartement : stationnement, sortie, claquement de portière, marche lente automatique puis fondu noir de deux secondes.

**Architecture:** Conserver l'état homeArrival, enrichi par une chronologie pure HOME_ARRIVAL/homeArrivalFrame. Réutiliser voiture et professeur existants devant un nouveau décor. Les cues audio sont indexés sur le même âge, sans délais asynchrones, et restent consommés après pause/mute.

**Tech Stack:** Phaser/TypeScript, PNG généré avec imagegen, banque SFX locale, Node harness, navigateurs natifs.

**Spec:** Demande explicite de Nicolas du 25 octobre 2026. Arrivée similaire à celles des établissements, mais marche lente entièrement automatique jusqu'à l'entrée de son appartement vétuste. Fondu final exactement 2 s avant la conclusion.

## Global Constraints

Préserver les 3 km, le retour protégé, les trois affectations, l'apparence de la voiture, les contrôles et la publication. Aucun input pour sortir ou marcher. Moteur arrêté à la fin du stationnement ; radio atténuée avant la sortie, pas et portière dans le grain sample existant. Préserver les maquettes et le jouable 0.61.

## Tasks

- [x] Nouveau décor nocturne sans personnages ni voiture, PNG original conservé, prompt et cadrage documentés. Échelle porte/prof/car vérifiée.
- [x] Test rouge : l'ancienne arrivée se terminait au bout de 3,25 s, la nouvelle doit toujours montrer le professeur en marche à ce moment-là. Tests du modèle : parking 1,8 s, apparition 2,25 s, portière 2,65 s, marche 2,95–9,45 s, seuil 0,5 s, fondu 9,95–11,95 s, noir 0,25 s.
- [x] Implémenter src/home-arrival.ts et son décor, raccorder le rendu, la simulation, le moteur et le mix radio. Cues portière + pas sur béton ; aucune répétition après pause.
- [x] Faire passer tests retour, musique, audio de séquence, campagne et journée complète ; construire les deux jouables.
- [x] Contrôle réel Chrome/Firefox : voiture de profil, proportions, sortie, portière, marche lente, pause et noir complet. Rapport, captures, livraison et commit local.

## Ledger

- Base 5a118ad, branche locale existante. Seul fichier utilisateur non suivi : work/github-pages-mobile-061.png, à conserver.
- Layout retenu après inspection du PNG : seuil de porte x246/y134 dans la vue logique, professeur 50 px environ pour une porte 55 px ; voiture au gabarit des autres arrivées. Radio s'éteignant entre l'arrêt moteur et la sortie, marche dans le calme.

- RED observé : l'arrivée précédente passait déjà à ending à 3,3 s. GREEN : homeArrival dure 12,2 s, avec marche lente et fondu de 2 s vérifiés par le modèle et par la journée complète à 30/60/120 FPS.
- Tests passés : retour-maison (y compris home-arrival), musique, cinématiques, journée, interface et assets ; build:atelier reconstruit. Le test audio compte une seule portière et 13 pas sur béton, sans répétition après pause, ni pas pendant le fondu.
- Revue indépendante en lecture seule : aucun problème important identifié. Contrôle visuel : l'occlusion initiale donnait l'impression que les jambes passaient sur le capot ; professeur placé à profondeur 3.09 derrière la voiture 3.1, nettoyage réinitialisé par SliceArt.hide. Captures relues après correction.
- Navigateur final : Chrome et Firefox hors connexion, derniers 70 m puis stationnement, sortie, marche, seuil, noir et fin. Musique native, pause/mute/reprise, pause à l'arrivée et extinction sonore correctes, aucune erreur JS. Touch 390 × 844 : lecture et absence de débordement conservées. Rapport : art/home-arrival-2026-10-25/browser-verification.json ; captures work/checkpoints/home-*.png.
- PNG source 1672 × 941 / 2735385 octets : copie et embarquement strictement identiques, empreinte vérifiée. Source/prompt/layout documentés dans le dossier art.
- Livraison directe : Jouer-Technoprof-Arrivee-Maison.html, Rejouer, puis les derniers 70 m. Le retour intégral et la journée utilisent la même séquence. Version publiée et 0.61 inchangées ; maquettes de cinématiques toujours séparées.
