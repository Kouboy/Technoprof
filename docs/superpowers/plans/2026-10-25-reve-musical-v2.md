# Maquette rêve V2 — musique, campus et continuité

Retour sur l’essai synchronisé V1 : rêve trop proche du début et trop peu enjoué ; absence d’un vrai plan extérieur du campus ; images carrées dans un cadre paysage, portes incohérentes ; dernier réveil à corriger de nuit et sans veste.

Livraison : **nouvelle maquette isolée V2**, V1 conservée, jeu et Pages inchangés pendant l’écoute. Ajout de six secondes d’extérieur à 19 s : durée totale 63 s, cloche 56 s, réveil 57,2 s. Musique du rêve plus chantante et rythmée, avec une couleur instrumentale distincte et une progression joyeuse sincère. Aucun signe musical annonciateur de la cloche.

- [x] Générer un atlas 2×4 : visiteur, invitation, extérieur, cour, préparation, classe, AESH, réveil nocturne sans veste. Inspecter portes, accessibilité, continuité et proportions.
- [x] Réviser composition et timbres ; partition 63 s, repères décalés et sortie de rêve brutale.
- [x] Lecteur V2 plein cadre avec treize scènes, piloté par la position sonore. Ne pas étirer les images ni rogner les visages pour cacher les bandes.
- [x] Vérifier sources 8 bits, durée, silence musical après 56 s, niveaux, transition des images, pause et lecture hors connexion Chrome/Firefox ; livrer un lien direct.
- [x] Conserver le quatrième trajet pour plus tard dans `docs/RETOUR-MAISON-A-PREVOIR.md`.

## Livraison et preuves

`audio/cinematiques-2026-10-25-v2/Voir-La-Fin-V2.html` et trois WAV. Neuf samples sources 8 bits utilisés, quatre voies, 158 événements dans la partition. Flûte et harpe ajoutées, basse mobile, harmonies majeures pendant le campus, résolution à 50 s. RMS de −30,17 dBFS au début à −20,74 au plan extérieur puis −17,55 à l’apaisement ; pic du mix à −5,89 dBFS. Durée exacte 63 s et silence musical numérique après 56 s, sans annonce de la cloche ; somme des stems vérifiée à deux LSB près.

Atlas original inchangé dans `art/cinematics-2026-10-25-v2/storyboard-v2.png`, prompts et empreinte dans le dossier. Le générateur n’a pas produit des rangées de hauteur égale : rectangles mesurés sur les séparations réelles, puis cadrage à ratio fixe sans étirement. Ancrage haut pour l’AESH afin de garder la professeure en arrière-plan entière ; geste sur le cahier préservé. Réveil final relu : fenêtre noire, chemise seule, une paire de lunettes posée sur le bureau. Ancien brouillon à lunettes doubles retiré des fichiers de travail.

Tests natifs hors connexion Chrome/Firefox : treize images et tous leurs cadrages capturés, lecture réelle du WAV, pause stable, seek, cloche à 56 s et réveil à 57,2 s, fin à 63 s ; aucune erreur JavaScript. Chromium tactile : accès au campus et aucun débordement horizontal. Treize captures analysées sans bandes de fond uniformes dans le cadre ; plans extérieur, portes, classe, préparation, AESH et nuit revus visuellement. Rapports dans le dossier de l’audition. Guide `MONTAGE-V2.md` généré depuis la chronologie réelle de cette version.

V1 conservée et aucun changement des sources du jeu, de ses musiques intégrées ou de Pages. L’appréciation musicale reste à faire par écoute humaine.
