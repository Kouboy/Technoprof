# Combat précis et reprise à l'établissement

> **For agentic workers:** Use superpowers:executing-plans. Vérifications TDD par lot ; revue globale avant livraison locale.

**Goal:** Rendre les échanges lisibles et permettre de retenter directement un établissement après perte d'une vie.

**Architecture:** Conserver le cycle du Parent (2 coups par ouverture) et les contrôles. Centraliser la préparation propre à la filmeuse. Distinguer le point de reprise selon le lieu du Game Over dans le flux des trois vies.

**Tech Stack:** TypeScript, Phaser, paramètres gameplay, tests Node et navigateurs.

**Spec:** Proposition approuvée le 28 octobre : Parent influent sans faux contacts, garde explicite ; filmeuse avec préparation d'environ 0,6 s et arrêt bref avant frappe ; Game Over école → entrée de la même école, 120 s, 5 PV, rencontres et infirmerie réinitialisées. Route → trajet avec délai normal. Troisième perte → radiation.

## Contraintes et risques

- Aucun changement de PV des ennemis, de topologie ou de nombre de vies.
- Conserver 2 coups maximum puis reprise du Parent, sans stun-lock.
- Pause, dialogue, entrée d'école et soin ne consomment pas le délai.
- Un échec sur la route pour retard reste une reprise route.
- Une frappe reconnue ne doit pas dépendre d'un unique instant arbitraire pendant le balayage visuel ; une garde doit avoir un retour distinct.
- Clavier, pad et souris/touch utilisent la même logique de contact.
- Aucun push/publication ; préserver le PNG personnel non suivi.

## Lots

- [x] Régression RED/GREEN : reprises route/école, pertes répétées, pause, soin, dernière vie.
- [x] Préparation de la filmeuse : 0,6 s, mouvement lisible et arrêt avant contact ; tests interruption/direction/pause.
- [x] Reproduire et corriger les faux contacts du Parent ; vérifier portée, fenêtres, garde et deux coups maximum dans les deux directions, au sol et près du trou.
- [x] Revue globale, suite playtest, observation native, exports locaux et commit.

## Journal

- Base : 09b5405, branche locale codex/night-traffic-floor-gaps. Le point de reprise actuel appelle toujours begin(), ce qui relance la route. La filmeuse hérite d'une anticipation de 0,34 s avec avance continue ; le coup de livre ne teste son contact qu'une fois à l'entrée de sa phase active.
- Reprise : conserver l'origine de l'échec avant begin() ; réutiliser ses réinitialisations puis school() avec 120 s. Le compteur annonce « REPRISE ETABLISSEMENT - 2:00 ». Un retard sur la route garde la reprise route. Tests sur les trois missions à 30/60/120 Hz, pauses et dernière vie compris.
- Filmeuse : anticipation propre 0,6 s, déplacement initial à 20 px/s, appui fixe pendant les 0,18 dernières secondes ; inclinaison de préparation de 7°. Direction engagée, interruption par livre et pause conservées.
- Parent : corps visible interpolé partagé entre rendu et contact, demi-largeur de torse 12 px en plus de la portée du livre. Contact retesté uniquement pendant le balayage actif (pas sa récupération), une seule touche et un seul son par frappe. Blocage avec pose défensive 0 pendant 0,24 s, CLAC lisible même pendant son anticipation. Limite de 2 coups et PV inchangés.
- Régressions RED/GREEN : reprise école donnait free ; coup sur le bord du manteau ne faisait aucun dégât ; préparation filmeuse trop courte. Chaque cas passe après correction. Le test de cible entrant tard dans le balayage est une fixture de collision explicitement scriptée, pas une simulation de déplacement ennemi.
- Ruling: le pilote clavier historique volontairement peu efficace échoue maintenant au Parent après une blessure et une chute (au lieu du dernier duo). L'assertion porte désormais sur son premier échec et l'absence de cinématique de victoire ; elle ne fige plus le numéro du tableau où un bot doit échouer. Les trois journées au contrôle direct restent des parcours réels réussis, sans modification d'état après départ.
- Revue indépendante de la logique : aucune anomalie relevée. `npm run test:playtest` complet passe, dont les nouvelles régressions et les trois journées avec trous. `check-parent-cycle-a3` conserve ses 12 combats et max 2 coups.
- Navigateurs : `check-lives-browser` passe sous Chrome/Firefox (pad simulé/touch, reprise école 120 s/5 PV, radiation, pause). `check-combat-readability-browser` obtient avec les inputs pad un impact puis un blocage distincts ; la filmeuse marque son arrêt, conserve 5 PV au professeur avant contact, et reste figée en pause. Captures réellement inspectées dans work/checkpoints/combat-readability et three-lives.
- Builds atelier et journée locale reconstruits. Résultats de test générés archivés hors Git ; aucun push/publication demandé.
