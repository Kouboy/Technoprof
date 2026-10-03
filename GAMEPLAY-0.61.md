# TECHNOPROF 0.61 — Circulation dès le premier trajet

Le premier trajet reprend exactement les espacements, voies, catégories et
vitesses de l'ancien deuxième trajet. Ensuite, la densité nominale double à
chaque affectation : **×1 / ×2 / ×4**, avec des intervalles relatifs
**0,36 / 0,18 / 0,09**. La variation aléatoire des intervalles suit aussi cette
progression, au lieu de masquer l'augmentation sur les derniers trajets.

Les réglages sont centralisés dans `TRAFFIC` dans `src/driving.ts`. La réserve
reste de 32 véhicules ; l'affectation n'en recharge aucun. Les voitures qui
sortent sont remplacées au-delà de l'horizon.

## Densité et possibilités de passage

Dans les deux trajets denses, des groupes occupent deux voies ; le côté libre
alterne entre gauche et droite. Un intervalle plus long permet de changer de
côté entre les groupes. Les véhicules de ces groupes roulent à 74 km/h pour
conserver leur décalage : des vitesses très différentes les faisaient se
rattraper et former des barrages sur les trois voies. Le premier trajet garde
les variations de vitesse de l'ancien deuxième.

Cela demande davantage d'anticipation et, parfois, de freinage. Le but est de
multiplier les manœuvres sans faire de chaque groupe un bouchon à suivre pendant
tout le délai.

## Mesures

Neuf trajets normaux, trois seeds et trois affectations, avec un conducteur de
test anticipant le trafic visible. Un dépassement est ici compté **après la zone
de contact**, sans choc sur le véhicule, indépendamment de son annonce sonore.

| Trajet | Dépassements confirmés | Pic de véhicules devant dans la zone visible | Chocs |
|---|---:|---:|---:|
| Matin | 22–24 | 4 | 0 |
| Midi | 39 | 5 | 0 |
| Crépuscule | 73–75 | 7 | 0 |

Ces nombres ne sont pas une promesse de doublement exact des dépassements : la
distance, la vitesse choisie et le temps passé derrière les autres véhicules
diffèrent entre missions. La densité nominale, elle, double bien. Le journal du
jeu garde encore le défaut d'annonce anticipée décrit dans l'audit 0.60 ; les
mesures ci-dessus n'utilisent pas cette annonce pour confirmer un passage.

Le conducteur simple réagissant seulement aux véhicules très proches échoue au
troisième trajet dans les trois seeds du diagnostic isolé. Cela illustre la
différence d'exigence ; cela ne prouve ni l'inévitabilité d'un choc humain, ni la
bonne difficulté pour une première découverte.

## Vérification

- Compilation TypeScript/Vite et export autonome.
- 23 scripts passants ; 60 premières affectations et 36 journées complètes,
  clavier et gestes directs, deux chemins, trois débits simulés.
- Contrôle spécifique du point de départ historique, des ratios d'espacement et
  de la variation aléatoire, des ouvertures alternées et de neuf routes propres.
- Quatre journées de progression et six journées d'exposition ; lectures,
  fondus et cinématiques restent hors du délai.
- Atelier compilé observé dans le navigateur : premier trajet et début du trajet
  du soir, radio sans destination pendant le cruising, véhicules décalés et côté
  libre. Capture du soir après le fondu, simulation mise en pause à 1,3 s ; aucun
  message console de niveau error dans cet essai. Ce n'est pas une conduite
  humaine complète à vitesse maximale.

Les conducteurs de test n'écrivent ni les positions, ni la santé, ni le chrono
après leur configuration initiale. Les journées utilisent maintenant le
conducteur anticipatoire pour les deux trajets plus chargés ; ce changement de
méthode est explicite, plutôt que de relâcher les assertions pour accepter des
pannes. Une suite verte ne valide pas la lecture à vitesse réelle ou le confort
au doigt : ces points restent à tester humainement.

Preuves : [routes confirmées](work/traffic-confirmed-061.json),
[diagnostic des deux conducteurs](work/traffic-probe-061.json),
[journées complètes](work/day-results-061.json),
[suite](work/tests-061.txt), [progression](work/progression-061.json).
Capture : [début du trajet du soir](work/traffic-soir-061.png).

Les établissements et les combats sont ceux de 0.60 ; l'esquive des charges
reste un chantier séparé dans [le plan](PLAN-APRES-REVIEW-0.60.md). La version
figée 0.60 et sa release sont conservées. Ouvrir `Jouer-Technoprof.html` ou
extraire `Technoprof-0.61-testeurs.zip` pour jouer.
