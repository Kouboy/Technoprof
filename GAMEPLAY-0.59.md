# TECHNOPROF 0.59 — Trafic, traversées et journée

Le journal d’essai 0.58 fourni le 2 octobre montrait 9, 8 puis 10 dépassements/frôlements, aucun choc automobile, et des trajets à pied courts. Cette passe répond à ces observations.

## Expérience attendue

- Le trafic se resserre réellement au fil des trois trajets. La même capacité de file (12 véhicules) évite qu’une file plus longue repousse les recyclages dans le lointain. Les espacements passent à 100 %, 64 %, 44 %. Les véhicules déjà présents restent en place à la notification ; le premier trajet conserve de grandes respirations.
- Trois tableaux calmes s’ajoutent à chaque établissement : liaison, classe d’étude traversante et hall. Les deux itinéraires passent par cette aile avant leur boss. Aucun nouvel ennemi ni trou dans ces pièces ; leur traversée consomme le délai. Retours, flèches et plaques de destination réutilisent les interactions existantes.
- Le collège passe de 9 à 12 tableaux ; les deux lycées de 6 à 9. Quatre nouveaux fonds sont réutilisés selon le lieu, la lumière et l’orientation. Les halls partagés ne constituent pas neuf décors uniques.
- Fuites animées, seaux, sacs pleins, petits débris, mouches et papier déplacé par les courants d’air rendent le manque d’entretien visible. Les accessoires restent derrière les acteurs ; les emplacements générés évitent les trous. Les classes de l’atlas conservent leurs accessoires dessinés sans doublon simplifié.
- 07:00 : matin froid, ciel bleu gris, horizon pâle. 12:00 : midi plus clair et chaud. 18:30 : crépuscule violet, horizon cuivré, locaux assombris. L’heure apparaît sur le CADRE, y compris à pied hors indication prioritaire. Les silhouettes et marqueurs restent lisibles.

## Vérifications

Les tests techniques comprennent les 21 scripts de la suite, 60 premières affectations continues et 36 journées complètes à trois établissements, clavier/commandes directes, deux itinéraires et 30/60/120 images/s synthétiques. Six journées supplémentaires, dont la seed du journal utilisateur, mesurent les rencontres routières : **10 / 12 / 18** véhicules dépassés/frôlés dans ces parcours simulés. Ce chiffre varie avec la conduite réelle ; il ne mesure pas une sensation humaine de difficulté. Les bots anticipent les obstacles et ne remplacent pas un débutant.

Les trois nouvelles ailes sont traversées sans écritures de position, vie ou chrono après le départ dans les parcours complets. Les portes de boss restent fermées avant victoire. Le délai exclut toujours dialogues, fondus imposés, stationnement et ellipse.

Contrôle visuel de la compilation via navigateur local : trois classes et lumières, hall, passage vers une nouvelle pièce, route au crépuscule. Tests humains et téléphone physique restent à faire. Aucun réglage de dégâts, de vie ou de délai maximal n’a été modifié pour cette passe.

Une seule nouvelle planche PNG : environ 2,9 Mo compressés, 6,3 Mo de pixels source estimés. Total : 29 PNG embarqués, environ 87,6 Mo pour le HTML autonome. Cette estimation des pixels ne constitue pas une mesure de mémoire GPU/processus. Le chargement initial reste un point à surveiller.

## Essais ciblés

Ouvrir `Jouer-Labo.html`, puis choisir Matin / classe vide, Midi / classe vide, Crépuscule / classe vide ou les halls. Pour la difficulté, jouer une journée complète sans scénario isolé et exporter le journal depuis la pause ou le bilan.

À observer : la montée du trafic reste-t-elle anticipable ? Les classes et halls font-ils ressentir la taille de l’établissement sans devenir une marche vide ? Les horaires et lumières suffisent-ils à situer la journée ? Les petits événements attirent-ils trop le regard ?

## Sources et tuning

Trafic : `src/driving.ts`, `TRAFFIC`. Parcours : `src/missions.ts`, `extendWing`. Lumières et événements : `src/presentation.ts`, `DAYLIGHT`, `SCHOOL_WEAR`. Atlas : `art/quiet-backgrounds-059.png`, généré avec imagegen intégré, prompt exact dans `art/PROMPTS-059.md`. Original intact ; découpe runtime nearest-neighbour.

La version 0.58 est conservée dans `Jouer-Technoprof-0.58.html` et ses archives.
