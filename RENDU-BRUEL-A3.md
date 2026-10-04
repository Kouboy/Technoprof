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
du plâtre écaillé et des carreaux ternes racontent son état ; les travaux
d'élèves et le linge de l'infirmerie montrent la persistance du soin.

## Raccords et lecture

- Les pieds restent à la même ligne de sol que dans le prototype validé.
  Les crops compensent la hauteur différente des deux rangées des planches
  pour placer la jonction mur/sol près de y=144, derrière les pieds à y=163.
- Les escaliers sont dans la profondeur du décor. Les paliers supérieurs
  montrent des marches descendant dans une cage sombre ; les phases de
  jeu restent sur un plan horizontal, sans scrolling.
- Le banc et l'arbre de la cour sont réutilisés dans la vitre basse du
  palier. Le tuyau à coude et son ruban constituent le repère partagé
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
[entrée](art/bruel-a3/entree-v2.png), [réseau](art/bruel-a3/reseau-v3.png) et
[aile B](art/bruel-a3/aile-b-v2.png).
Les [prompts complets et la provenance](art/bruel-a3/PROMPTS.md) incluent les
corrections des descentes, du grand escalier, de la position de B12 et du
passage intérieur du palier, aligné sur sa zone d'action existante.

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
