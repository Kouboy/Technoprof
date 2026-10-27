# Badge, ville nocturne et pose du responsable sécurité

> **For agentic workers:** Use superpowers:executing-plans for the integration; independent diagnostics are delegated with dispatching-parallel-agents.

**Goal:** Clarifier l'invitation finale à enseigner, rendre la ville nocturne habitée et supprimer un fragment parasite d'animation.

**Architecture:** Une nouvelle image autonome remplace uniquement la vignette AESH de fin. Les lumières restent dans la texture précalculée de RoadArt. Le boss conserve son atlas, avec une correction de découpe.

**Tech Stack:** TypeScript, Phaser, PNG embarqués, tests Node et navigateurs natifs.

**Spec:** Demande utilisateur du 27 octobre : remise au vieux professeur de son propre badge devant une classe neuve et vide ; davantage de lumières skyline au retour Maison ; fragment de botte à l'autre extrémité d'une pose du boss 3. Correction utilisateur : photo du vieux professeur sur le badge.

## Contraintes

- Vignette sans dialogue, personnages et tenues cohérents avec le rêve.
- Conserver 6 secondes pour ce plan, la durée totale de 69 secondes, les musiques et la cloche.
- Ne pas changer les règles, la conduite, les densités, les PV ou timings des boss.
- Lumières uniquement la nuit, pas de traitement de pixels en boucle de rendu.
- Reconstruire les deux jouables locaux ; aucune publication demandée.

## Vérifications prioritaires

- Photo du vieux professeur sur le badge ; visages, mains et badge préservés au recadrage.
- Bonne vignette au bon timecode, en pause et après reprise.
- Lumières perceptibles malgré la réduction et l'oscillation de l'horizon ; aucune lumière dans le ciel ou de jour.
- Botte parasite supprimée dans les deux orientations sans couper l'arme, la main ou la botte propre du boss.
- Pas de régression dans la journée ou le retour Maison.

## Étapes

- [x] Inspecter les références, le montage, l'atlas du boss et la skyline réelle.
- [x] Générer la nouvelle vignette avec imagegen, puis corriger la photo du badge.
- [x] Intégrer la texture autonome et le nouvel identifiant de plan ; vérifier rendu et timecodes.
- [x] Corriger les lumières avec test de réduction réel.
- [x] Corriger la découpe du boss avec test sur l'atlas réel.
- [x] Exécuter les vérifications ciblées et la suite playtest ; observer les scènes en navigateur.
- [x] Reconstruire les deux jouables et enregistrer localement.

## Résultats techniques

- Montage : `badge-handover` remplace `aesh` entre 50 et 56 s ; 14 images et 69 s conservées. Photo du vieux professeur validée sur le badge après retouche imagegen. PNG autonome conservé octet pour octet et référencé dans son manifeste.
- Skyline : 156 fenêtres précalculées, empreinte source 5×8 au lieu de 3×4. Le rendu natif montre 80/88/115 pixels lumineux aux horizons 64/67/70, répartis dans six secteurs ; seulement 6 pixels avec la version précédente. Aucun éclairage ajouté de jour, dans le ciel ou sur le sol.
- Boss : exclusion de la pose voisine à partir de x384 au lieu de x410. Test sur l'atlas réel : alpha parasite 253 avant, 0 après ; visage, paume et botte propre préservés. Les 16 poses des deux acteurs, dans les deux orientations, ont été inspectées.
- `npm test`, `npm run test:playtest`, les tests ciblés de cinématique et les deux builds locaux passent. Les métriques générées sont archivées dans les checkpoints ignorés.
- Le test natif en scène utilise des appuis F espacés d'un relâchement de 100 ms : sans cette séparation, l'échantillonnage pouvait lire une touche maintenue et laisser le dialogue ouvert. Aucun changement de contrôles dans le jeu.
- `tools/check-badge-night-boss-browser.cjs` passe sous Chromium et Firefox : retour Maison complet observé, `pro-pose-1` à 6 PV avec alpha parasite 0, vignette `cinematic-badge` au timecode 51,016 s / 50,599 s respectivement, aucune erreur JS. Captures et rapport : `work/checkpoints/badge-night-boss/`.
- Les deux exports locaux et `work/check-local.cjs` passent. Aucun push, aucune modification de la publication GitHub Pages.
