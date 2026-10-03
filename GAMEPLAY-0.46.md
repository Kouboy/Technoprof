# TECHNOPROF 0.46 — Harmonisation de la présentation

Ouvrir `Jouer-Technoprof.html` pour jouer, `Jouer-Presentation.html` pour comparer les images ou `Jouer-Labo.html` pour les situations animées. Le jouable reste autonome, sans serveur ni installation. La référence 0.45 et son archive sont conservées dans le projet.

## Changements visibles

- Une lumière commune relie route, arrivée, cour et intérieurs : matin froid, midi légèrement plus chaud, fin de journée assombrie et bleutée. Les personnages gardent une valeur plus claire que les fonds ; le CADRE et les signes utiles conservent leur contraste.
- Des ombres de contact ancrent les personnages sur le sol. Elles se resserrent et s'atténuent en saut, s'interrompent aux trous et disparaissent lors des transitions. Le premier plan des sols est légèrement matifié.
- Les plaques de portes utilisent le même petit lettrage bitmap, à coordonnées entières, sur une plaque opaque. Les en-têtes des bulles suivent ce lettrage ; la bulle du boss reste à l'intérieur de la fenêtre de jeu. Le texte conserve ses deux pages de 4,5 secondes.
- Les touches des passages inactifs sont plus discrètes ; à proximité, la touche et le libellé prennent le premier plan. Un accès bouché conserve sa barrière, accompagnée d'un cône ou d'un panneau de danger selon le lieu, sans doubler systématiquement les deux.
- La route reçoit des raccords de bitume, des fissures et des gravillons attachés à des positions fixes du monde. La teinte de fond des accotements ne forme plus de grandes bandes alternées.
- Une bordure commune recadre les éléments de décor. Elle remplace les anciens masques routiers non pris en charge dans le rendu WebGL utilisé ici.

## Comparaison reproductible

La planche propose les neuf tableaux à pied, la route et l'arrivée, aux trois heures. Elle fige les poses, les positions, le trafic et le chrono pour isoler le changement de lumière. Deux cases permettent de masquer le CADRE et de voir le jeu en 640 × 480, centré dans la page. C'est un outil de comparaison ; l'atelier reste le lieu des essais de mouvement, collisions et feedbacks.

## Contrat visuel

Toutes les mesures suivantes sont en coordonnées logiques 320 × 240, doublées à l'affichage natif.

| Élément | Convention |
|---|---|
| Fenêtre de jeu | x = 7 à 313, y = 7 à 175 |
| Ligne des pieds à pied | y = 159 ; surface de sol jusqu'à 175 |
| CADRE | commence à y = 179 ; aucune teinte d'ambiance appliquée |
| Professeur | échelle 0,18 dans les circulations, 0,225 en face-à-face, 0,13 dans la cour |
| Portes | cadrage des décors existants conservé ; plaques et touches ancrées aux accès |
| Textes du monde | lettrage de cinq pixels, positions entières, support opaque ; taille du HUD indépendante |
| Danger | trou visible et ombre découpée sur les mêmes intervalles de collision |
| Usure routière | positions déterministes dans le monde, projection commune avec la route |

L'arène reste volontairement cadrée plus près que les couloirs ; la cour montre le bâtiment à une échelle plus large. Il ne s'agit pas d'une nouvelle génération des sprites ou des décors.

## Vérifications du 25 septembre 2026

- `npm test` : suite complète réussie, comprenant conduite, combat, navigation, mission complète et transitions. `work/check-046.cjs` vérifie les ombres au bord de trous fractionnaires, la stabilité des réparations routières au changement de segment, les 33 compositions figées et le nettoyage des effets lors des transitions.
- `npm run build` : TypeScript et export autonome réussis. L'avertissement Vite sur la taille du bundle reste attendu : les images sont embarquées pour permettre le lancement hors connexion. Node signale également le caractère expérimental de son outil de lecture TypeScript utilisé par les tests.
- Observation dans le navigateur de la route matin/soir, des neuf tableaux à pied et de l'arrivée ; comparaison à la taille native, vérification des plaques, du cadrage et des contrastes. Aucun avertissement de masque ni erreur JavaScript relevé pendant ces observations.
- Contrôle des raccourcis locaux et de l'archive : voir `work/validation-046.txt`.

## Limites et suite

Cette passe harmonise les assets existants. Le dessin de l'élève conserve un aspect plus simple que celui des adultes ; les grands espaces entre les groupes de façades routières restent peu détaillés. Ces écarts sont de bons candidats pour une future passe ciblée d'assets, après comparaison avec les références approuvées.

La différence entre les trois lumières reste mesurée pour préserver les obstacles et les accès. Sa force et la compréhension de l'orientation sans explication doivent encore être jugées en session humaine. Les scènes figées ne valident ni la fluidité ni le ressenti audio. Le lot suivant porte sur l'accueil, l'audio et la journée représentative ; éviter de relancer une refonte générale avant ce retour.
