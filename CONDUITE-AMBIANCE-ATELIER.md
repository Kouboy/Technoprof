# Ambiance des trajets — atelier

La passe conserve la circulation, les contrôles, les vitesses, les distances et
les délais. Elle enrichit les surfaces existantes et les repères sonores.

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
