# Cadre, affichage et jauge — retours humains du 25 octobre 2026

## Cadre disparu après l'introduction

La bordure métallique était calculée une fois à la création de la scène. La
branche de rendu des cinématiques la vidait avec `clear()`, puis le retour à la
route ne la reconstruisait pas. Le décor pouvait alors recouvrir la bordure.

Le dessin statique est désormais conservé : invisible pendant les films, visible
dès leur fin ou leur passage. Il n'est pas recalculé à chaque image. Le test de
cycle reproduit l'effacement avant correction, puis vérifie les deux sorties.

Les 96 vues avant/après de la passe précédente comparaient deux versions entre
elles ; elles ne prouvaient pas que la bordure attendue était encore présente.
Un nouveau contrôle lit maintenant les pixels métalliques attendus sur le rendu
natif, notamment devant les éléments du bord de route.

## Affichage joueur

- Le cadre entier occupe l'espace disponible en 4:3, sans plafond à 960 px.
  À 1920×1080, il mesure 1440×1080, avec des bandes latérales pour garder le ratio.
- Suppression de la barre et des textes extérieurs pendant le jeu. Les bulles
  des personnages et la signalétique dans les établissements restent en place.
- Petit symbole Pause gris dans le coin inférieur droit du CADRE. Son dessin est
  discret ; sa zone de clic/toucher mesure au moins 44×44 px. P/Échap restent actifs.
- Plein écran, son et aide accessibles dans les menus. Le bulletin radio peut
  être lu dans la pause pendant la croisière. Les grandes pages de réglages
  défilent à l'intérieur du menu, sans faire défiler ni déformer le jeu.
- La cinématique peut être passée depuis le menu de pause ; cette action reprend
  correctement les états avant de passer le film.

## Jauge voiture

Les deux jauges utilisent le même dessin : cinq cases, cadre en retrait, remplissage
beige et filet clair ; rouge à 40 % ou moins. Pour l'auto, une case représente 20 %,
avec un remplissage partiel pour rendre les petits dégâts visibles. Le pourcentage
est conservé. Les kilomètres gardent leurs grands chiffres et passent en rouge
sous 0,5 km. Aucun dégât, délai ou paramètre de conduite n'est modifié.

## Vérifications

- `work/check-viewport-lifecycle.cjs` : intro passée ou terminée, cadre conservé.
- `work/check-condition-bars.cjs` : mêmes cases aux mêmes proportions, 0–100 % et
  remplissage partiel (82 % = quatre cases pleines et le début de la cinquième).
- Tests existants CADRE, contrôles et menus conservés.
- `tools/check-game-window-browser.cjs` : Chromium, Firefox, tactile, menus,
  fenêtres 640 px à 1920 px, rotation, canevas aligné et absence de barre extérieure.
- `work/check-frame-pixels.py` : pixels réellement visibles de la bordure sur
  les captures natives des trois profils, et non seulement égalité de deux builds.
- Revue indépendante : cycle du cadre, réattachement des commandes aux menus,
  passage des films en pause, cascade de taille et dessin partagé des jauges.

Les captures et résultats sont dans `work/checkpoints/window/` et
`work/checkpoints/cadre-native.log`. La nouvelle Release et la mise à jour Pages
restent suspendues à la demande de Nicolas, jusqu'à ses prochains retours.
