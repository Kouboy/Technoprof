# TECHNOPROF 0.55 — Passages fiables, lot 0

## Comportement joueur

Toucher ou cliquer une flèche de passage demande maintenant de l'emprunter. Le professeur marche jusqu'au seuil, le fondu se déclenche et le déplacement automatique s'arrête dans la pièce suivante. Il n'est plus nécessaire de viser le sol au-delà de la flèche pour franchir une sortie latérale.

Les portes et escaliers restent accessibles par leur zone dans le décor et par leur indicateur. Les flèches bénéficient d'une petite marge de sélection ; une flèche explicite prend la priorité lorsqu'une large zone de sélection de personnage la recouvre. En dehors de l'indicateur, toucher l'adversaire conserve l'approche et la frappe unique.

Au clavier, il faut toujours marcher dans le sens du passage latéral. Une position au bord, un recul, des directions opposées, un coup en cours ou un saut ne changent pas de tableau. Les protections contre le maintien de haut/bas, le fondu et le délai suspendu restent en place. Les accès bouchés restent physiquement fermés. Une blessure, la pause, le changement de salle ou la fin d'affectation annulent l'ordre automatique.

Toucher le sol au-delà d'un accès condamné ramène la destination à la limite praticable ; l'ordre s'arrête plutôt que de maintenir indéfiniment une marche contre le mur.

## Mise en œuvre

- `world.ts` rassemble sorties verticales, latérales et porte de classe : destination, seuil, point d'arrivée, touche et ancrage de l'indicateur. La sortie de classe reste conditionnée à la victoire.
- `passage-layout.ts` fournit la géométrie commune du rendu et de la sélection des indicateurs ; marge de sélection de six pixels logiques. La taille des libellés bitmap est contrôlée.
- `passage-hints.ts` dessine ces indicateurs ; `direct-input.ts` crée une intention de passage ; `main.ts` utilise les mêmes sorties pour les règles. L'intention latérale reste active jusqu'à la transition, au lieu de s'arrêter deux pixels avant la destination.
- L'atelier ajoute **Passages / cour ↔ hall**, sans adversaire dans le hall, pour isoler l'interaction. Le jeu normal conserve ses rencontres.

Les nouveaux établissements **Lycée Patrick Bruel** et **Lycée Professionnel Tibo InShape** restent planifiés dans le lot 2. Cette livraison corrige les interactions du collège de référence.

## Vérification

- `npm test` : 17 scripts, tous passent. La nouvelle suite `work/check-055.cjs` vérifie le centre des huit indicateurs latéraux à 15/30/60/120 fps, les neuf liens verticaux, la classe après victoire, les arrivées et l'annulation du déplacement.
- Vérification des accès bouchés, du clavier, des directions opposées, des états coup/recul/saut, de la reprise au clavier, de la pause et de la blessure. Les suites précédentes de dialogue, conduite, combats, audio et transitions restent vertes.
- Le vrai adaptateur Pointer Events est testé pour souris et toucher, avec deux tailles de canvas : conversion des coordonnées, capture puis relâchement et consommation de l'ordre à la transition.
- Observé dans le navigateur, sur les sources Vite : clic de la flèche cour → hall, retour par la flèche gauche, nouveau passage vers le hall, puis clic de l'indicateur de porte vers l'annexe. Déplacement, fondu, arrivée et arrêt sont visibles. Console sans warning/erreur dans cette vérification.
- TypeScript, build Vite et contrôle de l'export autonome : voir `work/build-055.txt` et `work/validation-055.txt`. La 0.54 et son hash sont conservés.

Captures : [hall](work/passages-hall-055.png), [retour cour](work/passages-retour-055.png), [annexe](work/passages-annexe-055.png).

**Limites :** le navigateur en arrière-plan a déclenché la pause protectrice lors du chargement ; l'observation a ensuite utilisé le pas à pas de l'atelier. Le contrôle tactile a été vérifié par l'adaptateur et la géométrie, pas par une session sur téléphone physique. Le ressenti de la journée complète et l'écoute restent à examiner au lot 1.

## Livraison et suite

Ouvrir **Jouer-Technoprof.html**, ou extraire **Technoprof-0.55-testeurs.zip**. Référence figée : **Jouer-Technoprof-0.55.html** ; historique 0.54 intact. Le paquet local comprend aussi les raccourcis d'essai et notes de versions.

**Lot 0 livré.** Lot 1 : première affectation complète de référence, relevés de parcours et mesures sur les appareils retenus, avant la construction des nouveaux établissements.
