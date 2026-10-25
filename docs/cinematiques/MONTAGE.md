# Montage et repères pour la composition

Lecture automatique, sans dialogue. Les durées comprennent les fondus d’entrée courts (180 ms). La cloche et le réveil utilisent une coupe franche. La pause, la perte de focus et une interruption longue suspendent la lecture ; les délais de mission ne s’écoulent pas. Le joueur peut passer la séquence entière avec le bouton dédié ; ses touches de jeu et ses gestes sur l’image n’avancent aucune vignette.

## Introduction — 10 secondes

| Début | Fin | Image / intention sonore |
| --- | --- | --- |
| 00:00.000 | 00:05.500 | Réveil au lit à 6h10 ; fatigue, alarme du téléphone |
| 00:05.500 | 00:10.000 | Café, manteau, clés ; départ pressé |

## Conclusion — 57 secondes

| Début | Fin | Image / intention sonore |
| --- | --- | --- |
| 00:00.000 | 00:05.000 | Correction nocturne, fatigue |
| 00:05.000 | 00:08.500 | Lunettes retirées, yeux frottés |
| 00:08.500 | 00:11.000 | Sonnette à la porte, retournement |
| 00:11.000 | 00:15.000 | Apparition du jeune visiteur |
| 00:15.000 | 00:19.000 | Félicitations et invitation par les gestes |
| 00:19.000 | 00:26.000 | Cour du campus, espace et accessibilité |
| 00:26.000 | 00:31.000 | Couloir, découverte progressive |
| 00:31.000 | 00:37.000 | Préparation des cours dans de bonnes conditions |
| 00:37.000 | 00:44.000 | Classe idéale, effectif réduit |
| 00:44.000 | 00:50.000 | Accompagnement AESH, attention humaine |
| 00:50.000 | 00:51.200 | Cloche et sursaut : rupture |
| 00:51.200 | 00:57.000 | Réveil au bureau à 6h10 ; retour à la réalité |

Les musiques ne sont pas encore composées. Prévoir un morceau de 10 s pour l’introduction et un de 57 s pour la conclusion : fatigue et étrangeté, ouverture progressive pendant les 31 s du campus, interruption à 50 s, puis retour froid à 51,2 s. Les bruitages existants de sonnette, cloche et téléphone restent séparés de la musique.

Les exports [introduction](timecodes-intro.csv) et [conclusion](timecodes-ending.csv) proviennent des données réelles de `src/cinematic.ts`. Après un changement de durée, lancer `node tools/export-cinematic-timeline.cjs`, puis `npm run test:cinematiques`. Ces tests vérifient que les CSV correspondent au montage joué.
