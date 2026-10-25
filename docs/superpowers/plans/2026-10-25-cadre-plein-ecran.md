# Retouches humaines : cadre, affichage et jauge

**But :** restaurer la bordure après les cinématiques, faire occuper tout le
viewport au cadre 4:3 et enlever les éléments externes superflus pendant le jeu.

**Accord utilisateur :** petit bouton Pause discret dans le CADRE ; plein écran,
son et aide regroupés dans le menu de pause. Jauge voiture en barres suivant le
même dessin que les PV professeur, pourcentage conservé pour la précision.

- [x] Reproduire le cadre effacé par l'intro ; conserver la géométrie statique et
  masquer/afficher plutôt que vider le cadre lors des films.
- [x] Installer une pause discrète avec une cible souris/tactile suffisante,
  déplacer les commandes externes dans les menus et retirer les textes d'aide
  hors du jeu. Les dialogues dans le décor restent inchangés.
- [x] Ajuster l'affichage à tout le viewport, y compris 1920×1080 et rotations,
  en conservant exactement le 4:3 et les coordonnées des gestes.
- [x] Partager le dessin des cinq barres entre état auto et PV du professeur ;
  vérifier les états plein, partiel et vide ainsi que la lisibilité des kilomètres.
- [x] Tests techniques et natifs ; reconstruction locale après commit. Le bilan
  humain et le nouveau feu vert restent à recevoir.

La publication et la Release restent suspendues jusqu'au prochain feu vert.
