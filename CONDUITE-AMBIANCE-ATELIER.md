# Ambiance des trajets — atelier

Les contrôles, les vitesses, les distances et les délais restent inchangés.
Les surfaces et les repères sonores sont enrichis ; la dernière passe ajoute
l'éclairage du crépuscule et resserre légèrement les deux premiers trajets.

## Circulation et crépuscule

`TRAFFIC.journeyGain` augmente la densité de placement de 12 % sur les trajets 1
et 2, soit des multiplicateurs 1,12 / 2,24 / 4 par rapport à l'espacement de base.
Le premier reste le plus calme et le troisième conserve exactement ses espacements.
Les ouvertures alternées, les gabarits, la vitesse du trafic et sa continuité
avant/après notification sont conservés. Le nombre réel de dépassements dépend
toujours de la façon de conduire ; ce n'est pas une promesse de +12 % de rencontres.

Au crépuscule, les façades et les véhicules prennent une teinte froide. Les feux
arrière rouges suivent les ampoules des trois silhouettes de trafic ; ceux de la
voiture de service suivent ses ancrages, y compris en virage, et s'intensifient au
freinage. Les faisceaux avant éclairent la chaussée derrière les véhicules dans
l'ordre de dessin. Les lampadaires produisent un halo chaud et une nappe dirigée
vers la route, correctement inversés sur le bas-côté opposé.

Seules les lumières laissent de courtes traînées à haute vitesse : ni les caisses
ni la route ne sont floutées. La longueur est bornée et suit la vitesse relative
pour le trafic. `ROAD_LIGHT` centralise les réglages. Les effets utilisent des
Graphics réutilisés, effacés à chaque dessin et découpés à la fenêtre de jeu ;
chaque lumière appartient à la profondeur de son objet, donc les ponts et les
véhicules proches occultent les lumières lointaines.

La planche de référence propose « Route / éclairage des véhicules ». L'atelier
ajoute « Conduite / crépuscule à 260 km/h », utilisable en jeu ou en pas de 20 ms.
`work/check-dusk-render.cjs` capture les vraies scènes WebGL et vérifie la pause ;
il accepte en argument le chemin du module Playwright déjà installé. La simulation
peut être mise en pause automatiquement par une frame longue en navigateur de test ;
le contrôle de mouvement utilise donc les pas réels de l'atelier, sans supprimer
cette protection. Ce test ne mesure pas les performances sur téléphone.

Les neuf routes propres de `check-061` utilisent désormais une prédiction de
pilotage qui prend en compte l'accélération visuelle à haute vitesse, la courbe
et les frottements, avec un horizon de décision de 1,5 seconde. Les anciens chiffres
de dépassement issus du pilote approximatif ne constituent pas une comparaison
directe. Les tests de placement vérifient séparément la hausse de 12 % et la
troisième densité inchangée.

## Décor

Deux publicités sobres, fixées aux surfaces disponibles des ateliers et murs de
clôture : « L’école de demain / Livraison reportée » et « Excellence / À crédit ».
Elles restent rares ; des affiches « Un prof », « Budget gelé » et des graffitis
« Des profs / Pas des promesses », « Tout va bien / Sur le papier » sont plus
discrets et plus fréquents. La plupart des éléments restent sans patch.

La sélection dépend de l’identité du décor, pas de la distance à la caméra ou du
générateur de trafic. Le patch suit la perspective, les occultations, la ligne de
base et le côté de sa façade. Le texte conserve son sens de lecture après miroir.
Les sprites sont réutilisés ; un atlas local de 196 × 112 pixels fournit les six
variantes sans nouvelle image distante ni régénération des bâtiments.

La planche de référence (`?essai=presentation`) propose six vues supplémentaires :
publicité Excellence, École de demain, publicité côté gauche, façade d’atelier,
affiches et graffiti.

## Son

Sous 1 km restant, un court ping GPS de deux notes apparaît puis se répète toutes
les quatre secondes. Sous 0,5 km, la cadence passe à deux secondes. Le changement
de proximité produit un ping immédiat. Le message du CADRE et la distance rouge
restent en place ; l’ancien son ponctuel d’approche est remplacé par ce repère.

La cadence suit le temps simulé : pause et perte de focus la suspendent. Couper
le son consomme les échéances sans les rejouer au retour. L’entrée dans la
cinématique d’arrivée annule le GPS, y compris une seconde note déjà programmée.

Le moteur accompagne le stationnement puis s’éteint à 1,8 seconde, avant la sortie
du professeur à 2,25 secondes. Il reste coupé après pause/reprise pendant cette
séquence, et redémarre au prochain trajet. Le stationnement et son rendu partagent
le paramètre `DRIVE.parkingSeconds`.

## Vérification

`npm run test:ambiance-route` : identité des détails à travers les segments,
fréquence faible des publicités, atlas borné, position et texte sur les deux côtés,
réutilisation des sprites, profondeur, pings à 30/60/120 images/s, annulation des
vrais oscillateurs et moteur dans les trois arrivées. La journée complète et la
suite générale sont aussi vérifiées. Le rendu est inspecté dans le navigateur ;
le confort d’écoute et le volume relatif restent à apprécier pendant l’essai humain.

`npm run build:atelier` actualise `Jouer-Technoprof-Journee-Atelier.html`.

## Prochaine passe technique

L'export actuel pèse environ 135 Mo : les grandes planches intégrées aux modules
`*-data.ts` dominent le volume. C'est un premier point à mesurer, sans conclure
que le poids du fichier explique à lui seul les performances en jeu.

1. Figer les parcours, captures et résultats de cette passe comme référence ;
   relever temps de démarrage, mémoire et intervalles de frames sur la machine cible.
2. Séparer progressivement les responsabilités de `main.ts` (rendu, conduite,
   séquences, orchestration des établissements), avec une extraction à la fois
   et des tests de comportement identiques.
3. Inventorier les assets réellement utilisés et les anciens profils, supprimer
   les doublons démontrés, puis optimiser chargement et allocations là où les
   mesures montrent un coût. Conserver le lancement autonome sur disque.

La difficulté, le LD et les timings validés constituent la référence de cette
session de nettoyage ; leurs éventuelles retouches resteront des choix distincts.
