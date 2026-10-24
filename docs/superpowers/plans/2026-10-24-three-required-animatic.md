# Trois affectations et animatique muette — lots 1 et 2

> Exécution : superpowers:executing-plans, tests avant implémentation et revue finale indépendante.

**But :** gagner uniquement après trois cours assurés ; toute panne, tout épuisement ou retard termine la tentative. Introduire deux vignettes d'introduction et neuf de conclusion, sans dialogue ni texte narratif.

**Architecture :** règles de campagne centralisées (`campaign.ts`), séquence de vignettes explicite avec âge et verrou de lecture (`cinematic.ts`), atlas provisoire original intégré aux sources et consommé par un rendu Phaser dédié. Le jeu commande les transitions, la présentation n'altère ni délais ni combat.

**Périmètre approuvé :** lots 1–2 : règles, animatique illustrée provisoire, bruitages de repérage, commandes et transitions. Les illustrations finales et les deux compositions originales seront les lots 3–4 après retour humain. Le site public conserve `b5ff56b` pendant cet essai local.

## Contrat

- Mode normal / journée H1-A3-I2 : trois réussites sur trois, premier échec terminal. Game Over lisible, puis Recommencer repart à H1 avec voiture 100 %, santé 5, soins disponibles, progression/rencontres/chronos réinitialisés. Réglages conservés.
- Démarrage : titre → intro → cruising. Après troisième cours : conclusion → fin. Rêve limité à l'école idéale, après une journée réellement assurée.
- Cinématiques muettes : zéro bulle, sous-titre, carton narratif ou réplique. Seules les heures diégétiques 6:10 et commandes hors vignette sont autorisées.
- Action/Entrée/Espace et clic/toucher avancent une seule image. Une durée minimale évite les sauts accidentels ; maintien et input d'entrée ne traversent pas plusieurs images. Passer l'intro est possible immédiatement. Les relances après Game Over repartent directement en voiture.
- Pause/focus/mute respectés, délai et gameplay suspendus ; bruitages attachés au panneau et à son âge, aucun rappel de son à la reprise.
- Anciennes fixtures de régression identifiées explicitement avec une politique historique de campagne. La production démarre toujours avec la nouvelle politique ; les tests du parcours actuel utilisent explicitement cette politique. Aucune option historique dans le menu joueur.
- Circulation, combat, PV des ennemis, topologie et délais inchangés. HTML archive 0.61 intact. PNG utilisateur non suivi préservé.

## Découpage visuel, ordre de lecture

0. Intro : réveil dans le lit à 6:10, chambre vétuste et mal rangée.
1. Intro : manteau, café, manuel et clés ; départ précipité, voiture derrière la porte.
2. Fin : correction nocturne à la lampe, fatigue et objets de l'appartement reconnaissables.
3. Fin : lunettes retirées, yeux frottés.
4. Fin : sonnerie à la porte, professeur se retourne.
5. Fin : jeune homme ressemblant au Prof, costume, accueil lumineux dans l'embrasure.
6. Fin : mains sur les épaules, félicitations et invitation exprimées par les gestes.
7. Fin : visite d'un établissement neuf, lumineux et équipé.
8. Fin : porte entrouverte sur petite classe diverse, professeur serein et AESH présente.
9. Fin : cloche au-dessus du Prof, sursaut.
10. Fin : même bureau et copies ; réveil à 6:10 sur le portable, au matin.

## Tâches et preuves attendues

- [x] Tests rouges de règles : échec à chaque affectation/cause ; aucun 2/3 gagnant ; redémarrage complet ; troisième cours déclenche la fin une seule fois.
- [x] Tests rouges de séquence : 2/9 panneaux, aucune narration visible, temps suspendu, avance unique, touches maintenues, pause/reprise, skip et entrée tactile.
- [x] Implémentation règles et UI : centraliser seuil, textes d'aide, Game Over, rapport et garde des transitions ; conserver une voie historique uniquement pour les anciens diagnostics.
- [x] Animatique : atlas original provisoire 4×3 (11 panneaux + cellule vide), cadre centré sans HUD, commandes accessibles, bruitages réveil/sonnette/cloche.
- [x] Pilote de journée actuel mis à jour et tests à 30/60/120 fps ; erreurs terminales et réinitialisation vérifiées.
- [x] Vérifications navigateur local clavier/toucher, montage complet et retour menu ; revue indépendante et build autonome.

## Suivi

Base `b5ff56b`, branche `codex/three-assignments-cinematics`. Choix : travailler dans le répertoire habituel sur une branche dédiée afin de livrer les lanceurs locaux à l'endroit attendu ; aucun nouveau worktree ni modification de main/Pages.

## Vérification finale — 24 octobre 2026

- `npm test` : suite historique complète réussie ; fixtures anciennes explicitement historiques.
- `test:cinematiques`, `test:interface`, `test:journee`, `test:sfx`, `test:musique`, `test:assets`, `test:gamefeel` réussis. Le pilote actuel traverse les deux introductions et neuf conclusions avec les commandes normales ; premier échec terminal et relance H1 vérifiés.
- Build atelier autonome et build Pages réussis. Pages préparé uniquement, sans déploiement : 42 images intactes, 12 WAV, JavaScript 2,14 Mo. Avertissement Vite de taille des chunks attendu pour les assets intégrés/autonomes.
- Chromium et Firefox hors connexion : onze vignettes, pause/reprise, maintien de touche, retour bilan, aucune erreur JavaScript. Chromium tactile 390 × 844 : toucher direct, double appui filtré, aucun débordement horizontal. Captures et rapport dans `work/checkpoints/cinematic-*`.
- La revue indépendante a révélé un cadrage en pixels physiques au lieu des coordonnées logiques 320 × 240. Corrigé puis testé : cadre centré, image entière 212 × 158 logiques, captures revues en contexte.
- Archive 0.61 inchangée : SHA256 `05713E027D7DCB4B5CD8AAA6E2E74B53D1EA45526215E33CC8FE4E905B94DD65`. main et origin/main restent à b5ff56b.
- Atlas original, prompt et réserves artistiques : `art/cinematics-2026-10-24/manifest.json`. La composition du bureau final ne répète pas exactement le cadrage nocturne ; à raffiner au lot 3. Le son se limite aux repères réveil/sonnette/cloche ; deux compositions originales restent au lot 4.
- Validation humaine encore attendue : compréhension sans texte de la visite rêvée, rythme de lecture et raccord cloche/réveil ; toucher sur téléphone physique.
