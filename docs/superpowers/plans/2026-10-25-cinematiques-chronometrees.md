# Montage automatique des cinématiques

## Intention

Le joueur regarde une séquence dont le montage porte le rythme. Les images et les futurs morceaux devront partager une chronologie fixe, suspendue pendant une pause ou une perte de focus. Aucune réplique ni narration écrite ajoutée.

Réglage initial proposé dans le périmètre d’autonomie : introduction 10 s (5,5 + 4,5) ; fin 57 s. La visite (cour, couloir, préparation, classe, AESH) dure 31 s. Cloche brève à 50 s, réveil à 51,2 s. Pause conservée ; bouton explicite pour passer toute la cinématique, sans avance manuelle par image ni effet des touches de jeu ou du toucher sur la scène.

## Architecture

Durées centralisées dans les données de `cinematic.ts`. Un temps de lecture actif unique détermine panneau et âge local ; les transitions automatiques conservent le reliquat de temps entre images. Ce temps ne charge jamais le délai de mission. La pause existante gère les interruptions longues et le focus. Les futurs morceaux seront composés sur les timecodes de ce montage ; cette passe n’ajoute pas de morceau provisoire.

## Étapes

- [x] Tests rouges : avance automatique sans input, durées 10/57 s, conservation du reliquat, pause, fin unique, commandes de jeu inertes.
- [x] Modèle temporel et durées ; coupes franches cloche/réveil, fondu bref des autres images.
- [x] Intégration des transitions et du journal ; retrait du bouton Continuer ; passer la séquence entière, pause et toucher cohérents.
- [x] Export de timecodes CSV depuis les données réelles pour la composition.
- [x] Adapter pilote de journée et essais navigateur à une lecture sans actions ; tests à 30/60/120 fps et interruptions.
- [x] Construire les jouables locaux, vérifier en contexte, sauvegarder la branche. Main, Pages et archive 0.61 inchangés.

## Vérifications

- `test:cinematiques` : 10/57 s automatiques à 30/60/120 fps, reliquat conservé, invalides rejetés, pause runtime de 70 s sans progression, abandon explicite des deux séquences, durée réellement regardée conservée au journal, aucune avance par F/X/Entrée/Espace.
- Le pilote de journée actuel traverse toutes les images sans aucun input cinématique ; les trois services, soins, progression, échec terminal et délais communs restent vérifiés à 30/60/120 fps.
- CSV de composition générés par `tools/export-cinematic-timeline.cjs` et vérifiés contre la source par les tests ; guide humain `docs/cinematiques/MONTAGE.md`.
- `npm test` complet et `test:interface` réussis ; TypeScript et build atelier réussis. Autonomie des deux HTML et de leurs raccourcis vérifiée.
- Les deux musiques dédiées restent à composer après retour sur le montage. Aucun changement d’illustration dans cette passe.
- Chrome et Firefox hors connexion : introduction et douze images de fin parcourues sans action d’avance ; pause de sept secondes avant reprise, F maintenu et Entrée inertes, retour correct en voiture puis au bilan, aucune erreur JavaScript. Toucher Chromium mobile : appuis sur l’image inertes et abandon explicite par bouton fonctionnel, sans débordement horizontal. Rapport `work/checkpoints/cinematic-browser.json`.
- Archive 0.61 vérifiée au SHA256 initial `05713E027D7DCB4B5CD8AAA6E2E74B53D1EA45526215E33CC8FE4E905B94DD65`. Rapports historiques générés par les tests restaurés ; PNG utilisateur non suivi préservé.
