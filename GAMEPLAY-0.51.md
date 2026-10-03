# TECHNOPROF 0.51 — Le CADRE, pupitre administratif

La passe concerne le panneau inférieur commun aux deux phases. Les trois compartiments restent à la même place : affectation/radio, délai, voiture/personnel.

## Hiérarchie et typographie

Les libellés passent de sept à cinq pixels logiques, avec la même police bitmap que les écriteaux et les bulles. Les chiffres du délai utilisent un dessin étroit de neuf lignes agrandi deux fois : dix-huit pixels de haut au lieu de vingt et un. Le délai reste ambre, rouge en urgence ; la salle et la distance gardent leurs valeurs à quatorze pixels. La vitesse, les unités, les états et les mentions administratives occupent des lignes distinctes. Les longs messages sont bornés avec une ellipse plutôt que coupés au bord d'un caractère.

La distance est précédée de RESTE ; KM reste séparé des chiffres. La santé du professeur et le numéro du service ont leurs propres emplacements. Les mentions secondaires sont plus claires sur fond sombre pour compenser leur taille réduite.

## Matières

Plaques encastrées, bords de tôle repliés, vis à fente, creux sombres et petites traces d'oxydation. L'usure reste sur les montants ; les surfaces de lecture sont calmes. Carte de destination détaillée avec vitrage armé, poignée et protection inférieure ; petits témoins d'état et jauge de carrosserie segmentée. Couleurs communes au collège : ardoise, métal oxydé, papier jauni et encre. Aucun texte décoratif supplémentaire.

## Règles conservées

Destination masquée avant notification ; radio pendant le cruising ; chargement progressif de la carte à réception. Délai commun, suspension pendant les introductions et transitions, proximité ambre sous un kilomètre et distance rouge sous cinq cents mètres. Les fins de mission indiquent leur cause sans reprendre le clignotement d'urgence du jeu actif. Le rendu reste une lecture de l'état, sans mutation.

## Vérification

Suite complète, compilation TypeScript/Vite et export autonome passent. Les tests contrôlent les largeurs des fontes réellement utilisées, les coordonnées entières, les bornes du panneau, les phases et les seuils. Les vues radio, réception, route, proximité, collège et urgence ont été observées dans le navigateur. La planche de référence a été contrôlée en 640 × 480 pour les deux phases, puis en paysage mobile 844 × 390 : les valeurs principales restent identifiables, les libellés secondaires sont petits à cette échelle. Aucun essai sur téléphone physique n'est déclaré.

Captures : `work/cadre-college-051.png`, `work/cadre-route-051.png`, `work/cadre-mobile-051.png`. Résultats : `work/tests-051.txt`, `work/build-051.txt`, `work/validation-051.txt`.

Ouvrir `Jouer-Technoprof.html`, ou extraire `Technoprof-0.51-testeurs.zip`. La 0.50 est conservée dans son HTML et ses archives.
