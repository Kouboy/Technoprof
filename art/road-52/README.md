# TECHNOPROF — Bords de route 0.52

Planche originale : [district.png](district.png), 1536 × 1024 RGBA. Générée avec l'outil intégré ImageGen à partir de la référence stylistique `art/road-22/district.png`. Le prompt final effectivement envoyé est conservé dans [prompts.txt](prompts.txt).

Six formes françaises ordinaires : collectif R+3, gymnase municipal, atelier/logement, château d'eau en béton, platane et armoire électrique. Palette sourde, contours noirs, traces d'usure ; aucun écriteau généré à déchiffrer.

Les cellules générées n'étant pas strictement régulières, les six cadres sont définis explicitement dans `src/road-art.ts`. La source n'est pas retouchée. L'alpha est conservé, les pixels de contact au sol déterminent l'origine verticale de chaque sprite ; filtrage NEAREST et dimensions proportionnelles en jeu. Les variantes droites sont retournées vers la chaussée. Le fichier `src/verge-data.ts` intègre cette même source dans l'export autonome.

Les ponts sont dessinés par `src/road-structures.ts` : géométrie projetée et détails de béton/acier/maçonnerie. Ils partagent l'ordre de profondeur du trafic. Leur tablier et leurs piles gardent une taille cohérente jusqu'à sortir du cadrage après le franchissement.

Vues de contrôle : ouvrir `Jouer-Presentation.html`, puis choisir les rubriques Route et Pont. Les quatre quartiers utilisent des adresses stables ; aucun bâtiment visible ne change de type à la limite d'un quartier.
