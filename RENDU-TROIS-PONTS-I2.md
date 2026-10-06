# Trois-Ponts I2 — rendu du lycée professionnel

Passe graphique après validation du parcours et du détour médical. Le graphe
de 18 pièces, les collisions, les trous, les rencontres, les PV, les patterns,
les contrôles et les 210 secondes restent ceux d'I2. I1 garde son rendu
provisoire pour comparaison ; le HTML publié 0.61 n'est pas régénéré.

## Architecture et repères

L'établissement assemble un bâtiment scolaire en béton et brique, des ateliers
à toiture industrielle et une annexe préfabriquée. Peinture beige et bleu
écaillée, verre armé réparé, affichage scolaire déchiré, sacs pleins, seaux,
radiateurs et luminaires hors service remplacent les montages provisoires.
Les outils, établis, machines et casiers donnent une identité professionnelle
au lieu. Le crépuscule traverse les vitrages ; les vues du rez-de-chaussée
regardent la cour, celles de l'étage les toitures.

| Pièce | Fond et repères |
|---|---|
| 300 Parvis | Façade existante, nouveau nom affiché |
| 301 Accueil | Guichet vitré et porte ouverte sur la cour |
| 302 Couloir principal | Portes de classes fermées, passages latéraux ouverts |
| 303 Escalier principal | Deux volées lisibles, affichage scolaire usé |
| 304 Galerie T | Descente principale, vue sur les toits et branche service |
| 305 Jonction T | Descente vers les ateliers, pilier bleu, passage à droite |
| 306 Liaison T | Affiches techniques et réserve de manuels |
| 307 Préparation T | Établi, lavabo fatigué, branche ouverte vers les soins |
| 308 Sas T03–T04 | Extincteur, panneau d'affichage et porte secondaire fermée |
| 309 Seuil T03 | Affiche de physique, lecteur d'accès et porte de classe |
| 310 Cour technique | Trois passages distincts : atelier, vestiaire, service |
| 311 Atelier A | Tour, outillage et accès à la vie scolaire |
| 312 Vestiaire | Casiers orange, patères et deux escaliers |
| 313 Passage service | Tuyau jaune, manomètre, seaux et fuite animée |
| 314 Palier service | Même tuyau jaune, garde-corps et vue des toitures |
| 315 Infirmerie | Décor de soin existant, échelle adulte conservée |
| 316 Vie scolaire | Préfabriqué, bureau, archivage et affichage scolaire |
| 317 Couloir de soins | Tuyauterie, linge médical visible et fuite animée |

Les ouvertures correspondent aux sorties jouables. Les portes de classes
fermées restent du décor. Les plaques émaillées sont dessinées en bitmap,
au-dessus des accès ; leur placement évite les chevauchements entre destinations.
Les aides contextuelles de commande restent inchangées.

## Intégration

Quatre atlas et une cour dédiée fournissent seize nouveaux tableaux. Les PNG
sources restent intacts dans `art/trois-ponts-i2`. Les recadrages sont déclarés
dans `atlas.json`. Des bandes architecturales recalent les seuils générés sur
les zones d'interaction validées : les bandes de porte gardent leur largeur,
les surfaces murales intermédiaires sont ajustées. La continuation droite de
la jonction réutilise le passage de la liaison voisine. Aucun changement de
distance de marche ou de zone d'entrée n'est nécessaire.

La ligne de sol et les gabarits sont harmonisés par recadrage. Le professeur
conserve son échelle ; l'infirmière conserve sa texture de 86 pixels logiques
et ses semelles à y=163. Les trous restent rendus séparément devant le fond,
sur la ligne de marche. L'ouverture de T03 emploie désormais son propre masque,
sans le rectangle de l'ancien décor.

Les images et bandes sont allouées une fois ; chaque changement de pièce
efface plaques, fuites et images précédentes. Les bandes reçoivent la même
teinte d'ambiance que le fond. Les fuites sont décoratives et suspendues en pause.

[Prompts complets et provenance](art/trois-ponts-i2/PROMPTS.md).
`node work/embed-trois-ponts-i2.cjs` reconstruit les images embarquées.
`npm run build:atelier` produit `Jouer-Technoprof-Atelier-InShape-I2.html`.

## Vérifications

Les tests I2 couvrent les duos, le boss, les déplacements de la lycéenne,
les connexions réelles, les chutes, les soins complets uniques, les pauses et
la reprise du délai. Le contrôle graphique vérifie les sources intactes,
les limites de recadrage, les bandes continues, les allocations constantes,
l'échelle de l'infirmière, les profondeurs et l'effacement entre salles.
Les tests I1 vérifient l'isolement de l'ancien profil.

Observation dans le navigateur local des dix-huit pièces : proportions,
portes, escaliers, repères, duo, boss, infirmière et dangers. Le parcours humain
reste la validation finale du ressenti ; le téléphone physique n'a pas été testé.
Le HTML autonome contient toutes les images et reste volumineux.
