# Arrivée devant l'appartement

Décor nocturne dédié à la fin du retour Maison. PNG créé avec l'outil intégré image_gen, conservé sans modification. Le prompt exact est dans `prompt-background.txt` ; empreinte et cadrage dans `manifest.json`. Les références étaient le décor d'arrivée aux Ormeaux (caméra et matière) et le diptyque nocturne de l'introduction (palette et appartement).

L'illustration ne contient ni voiture ni personnage : ceux-ci sont les sprites du jeu. Vue logique `(7,7,306,168)`, seuil de porte à `(246,134)`. La porte mesure environ 55 px ; le professeur en mesure 50 à la sortie et 47 au seuil. La voiture conserve son gabarit habituel des arrivées.

Ordre de profondeur : décor 3.005, professeur 3.09, voiture 3.1, détails de carrosserie 3.2, fondu 4.05. Le professeur sort du côté trottoir : la carrosserie doit masquer ses jambes tant qu'il n'a pas dépassé la voiture, pour éviter qu'il semble marcher sur le capot. `SliceArt.hide` restaure la profondeur normale lors des scènes suivantes.

Chronologie, positions et vitesse de marche : `src/home-arrival.ts`. Le PNG est embarqué byte pour byte dans `src/home-arrival-data.ts` pour conserver les lancements directs depuis le disque.
