# Bruel A3 — rendre le réseau reconnaissable

La navigation et le rythme des ennemis ont reçu la validation humaine.
Cette passe adapte uniquement leur présentation au graphe actuel. Elle reste
sur la branche d'atelier A3 ; main et le HTML publié 0.61 sont intacts.

## Douze tableaux, trois planches

| Zone | Lecture visuelle et repère |
|---|---|
| Cour | Façade de pierre, arbre et banc cassé ; entrée à droite |
| Vestibule | Deux arches de liaison, retour vers la cour et accès au hall |
| Hall | Grand escalier dominant à gauche, annexe secondaire à droite, panneau central |
| Grand escalier | Montée en profondeur à droite ; porte de retour au hall à gauche |
| Palier principal | Descente à gauche, vue sur la cour, passage intérieur vers l'annexe |
| Annexe | Descente au hall, liaison latérale avec le palier, tuyau cuivre réparé |
| Galerie A | Trois travaux graphiques affichés avec soin entre les passages |
| Jonction B | Porte verte de l'annexe, porte grise de l'infirmerie, même cuivre réparé |
| Galerie B | Long radiateur en fonte et chauffage apparent ; plage B08–B10 |
| Palier B | Vitrine d'emploi du temps au verre fendu ; accès aux salles B11–B14 |
| Infirmerie | Lit, drap propre, armoire murale, horloge et bureau ; infirmière conservée |
| Seuil B12 | Porte fermée à droite, mur calme derrière la confrontation |

La pierre, le bois, les traces de réparation et le vert usé reprennent
la direction comics pulp du lycée urbain ancien. Des fenêtres rafistolées,
du plâtre écaillé, des carreaux ternes au RDC et un plancher rayé à l'étage
racontent son état ; les travaux
d'élèves et le linge de l'infirmerie montrent la persistance du soin.

## Raccords et lecture

- Les pieds restent à la même ligne de sol que dans le prototype validé.
  Les crops compensent la hauteur différente des deux rangées des planches
  pour placer la jonction mur/sol près de y=144, derrière les pieds à y=163.
- Les escaliers sont dans la profondeur du décor. Les paliers supérieurs
  montrent des marches descendant dans une cage sombre ; les phases de
  jeu restent sur un plan horizontal, sans scrolling.
- Le banc et l'arbre de la cour sont redessinés vus d'en haut dans la fenêtre
  du palier. L'ancien crop à hauteur de sol est retiré, pour éviter un faux
  raccord de perspective. Le tuyau à coude et son ruban constituent le repère partagé
  annexe/jonction.
- Les anciens fonds sont masqués, les portes et escaliers provisoires ne
  sont plus superposés à A3, et les barrières génériques ne couvrent plus
  les murs et les accès dessinés. Les directions fermées restent fermées
  dans les règles ; aucune sortie supplémentaire n'est créée.
- Le lettrage reste une police bitmap à pixels entiers sur des plaques
  d'émail avec relief, fixations et petites ébréchures. Les informations
  locales conservent niveaux, noms et plages de salles, sans ajouter de
  fléchage répété vers B12. Les touches contextuelles restent identiques.
- L'ouverture de la porte B12 suit le nouveau cadre et sa hauteur. Le
  déplacement du professeur, le fondu et l'ellipse gardent leurs timings.
- Les sprites, tailles d'acteurs et cadrage du boss ne changent pas. La
  lumière de midi et la teinte de l'infirmière sont harmonisées avec les
  fonds. Une petite fuite au cuivre reste décorative et derrière le plan
  de marche ; elle ne modifie ni collision ni génération aléatoire.

## Sources et intégration

Création et retouches avec **l'outil imagegen intégré**, puis copie des PNG
sélectionnés dans le dépôt. Aucune retouche raster par script ; les originaux
de génération restent conservés. Sources finales :
[entrée](art/bruel-a3/entree-v2.png), [réseau](art/bruel-a3/reseau-plancher-v4.png) et
[aile B](art/bruel-a3/aile-b-plancher-v3.png).
Les [prompts complets et la provenance](art/bruel-a3/PROMPTS.md) incluent les
corrections des descentes, du grand escalier, de la position de B12 et du
passage intérieur du palier, aligné sur sa zone d'action existante, puis
les sols de l'étage et leurs vues extérieures.

## Correction du premier étage

Les sept tableaux de circulation à l'étage utilisent désormais de longues
lames de bois gris brun, usées, clouées et réparées par endroits : palier
principal, annexe, galeries A/B, jonction B, palier B et seuil B12.
Le même matériau se prolonge dans les passages vus en profondeur. Les
sols du rez-de-chaussée et les marches ne changent pas. L'infirmerie reçoit
un revêtement de lino gris vert terne, avec réparations et traces d'usage.

Les extérieurs se lisent depuis le premier étage : fenêtres des façades
opposées, branches et, au palier, cour en contrebas avec le banc vu de dessus.
Les passages latéraux restent des circulations intérieures au même niveau.
La ligne de sol, les dimensions des accès et les proportions des acteurs
restent celles de la première passe.

Choix humain confirmé : valider ce rendu avant de réintroduire les trous.
Cette passe n'ajoute ni ouverture dans le sol ni collision, et conserve
les galeries sans danger nouveau. Une rupture future devra montrer les
lames cassées et le vide sous le plancher, au niveau des pieds ; son placement
et le comportement de chute feront l'objet d'une passe distincte.

Validation de la retouche : huit tableaux d'étage inspectés avec les acteurs
dans le navigateur ; crops, nettoyage des calques et profils A1/A2 vérifiés
par `test:rendu-a3`. La suite `test:navigation` conserve les parcours, le soin
et le cycle du Parent. L'export A3 reconstruit fait environ 99 Mo.

`src/bruel-a3-art.ts` regroupe crops, pièces et écriteaux. Les textes et
animations sont rendus par le moteur. `src/bruel-a3-data.ts` embarque les
trois PNG exacts pour l'export autonome. Les profils A1/A2 restent disponibles
avec leur composition antérieure. Les calques se masquent avant chaque
nouveau tableau et chaque changement de phase, sans créer d'images par frame.

## Vérifications

- `npm run build:atelier` : exports autonomes reconstruits, environ 99 Mo
  pour A3 (augmentation d'environ 11 Mo due aux trois planches).
- `npm test` : suite existante réussie ; navigation publiée, phases de
  dialogue, collisions et entrée en classe restent vérifiées.
- `npm run test:navigation` : A1/A2/A3 réussis, y compris soin unique,
  pause/focus et cycle du Parent. Aucun graphe ou paramètre de combat modifié.
- `npm run test:rendu-a3` : douze vues distinctes, PNG embarqués identiques
  aux sources, crops valides, écriteaux dans le mur, visites répétées,
  absence d'images créées pendant le rendu, nettoyage des calques et
  conservation d'A1/A2 ; fixtures de départ contrôlées.
- Navigateur local : douze tableaux inspectés à l'échelle réelle, avec les
  personnages, les touches de passage et les répliques. Accueil dans le
  nouveau décor de soin observé avec le chrono suspendu. Clic sur la porte
  dessinée du palier vérifié : déplacement puis arrivée dans l'annexe,
  sans changer la zone d'action ni le graphe.

Les captures `work/rendu-a3-*.png` couvrent les douze pièces. Points clés :
[hall](work/rendu-a3-hall.png), [palier](work/rendu-a3-palier.png),
[annexe](work/rendu-a3-annexe.png), [jonction](work/rendu-a3-jonction.png),
[infirmerie](work/rendu-a3-infirmerie.png) et [B12](work/rendu-a3-b12.png).
Certaines captures d'atelier sont en début de réplique ou de protection
d'entrée : elles montrent des situations de test, pas des états de combat figés.

L'essai humain à vitesse normale doit encore confirmer que les quatre
embranchements se reconnaissent sans plan, que l'annexe reste secondaire
au hall et que les nouvelles matières ne concurrencent pas les ennemis.
La perception sur téléphone physique n'est pas validée par ces tests.
