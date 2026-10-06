# Lycée professionnel des Trois-Ponts — atelier I2

Les trois noms affichés dans cette passe sont Collège des Ormeaux, Lycée
Auguste-Berthelot et Lycée professionnel des Trois-Ponts. Affectations, CADRE,
façades, bilan de journée et sélecteur d'atelier suivent ces noms. Les noms
longs tiennent dans les plaques et le CADRE à la taille habituelle des pixels.
Les noms de fichiers et identifiants des scénarios restent compatibles.

I2 compare une nouvelle composition des combats à [I1](ATELIER-INSHAPE-I1.md).
Le bâtiment garde ses 17 zones, ses accès, ses onze trous hors combat, son
infirmerie et ses 210 secondes. Les décors portent toujours la révision I1.
La mission publiée 0.61 reste intacte. Les règles des profils I1, H1 et A3
restent les témoins ; leurs noms affichés suivent ceux des établissements.

## Jouer et comparer

- Ouvrir `Jouer-Technoprof-Atelier-InShape-I2.html`, généré par
  `npm run build:atelier`.
- Avec le serveur local : `?essai=labo&scenario=inshape-navigation-i2`.
- Les reprises `-road`, `-care`, `-boss` et les vues de pièces
  permettent d'isoler les situations dans l'atelier.
- Contrôles existants : ZQSD/flèches, Espace pour sauter, F/X pour frapper et
  avancer une réplique ; accès en profondeur avec Z/S ou haut/bas.
- Souris et touch conservent les commandes directes existantes.

La première comparaison doit utiliser le même parcours et les mêmes PV de
départ dans I1 et I2. Le trajet automobile reste à réintégrer avant de fixer
le chrono global : le temps disponible dans l'atelier à pied ne suffit pas
pour conclure sur sa difficulté définitive.

## Composition des rencontres

Deux pièces déjà consacrées au combat reçoivent un duo :

| Pièce | Adversaire au contact | Adversaire en retrait |
| --- | --- | --- |
| Couloir principal, RDC | Élève à x165, 2 PV | Lanceur à x235, 2 PV |
| Liaison T03–T06, étage | Vigile à x165, 2 PV | Lanceur à x235, 2 PV |

Un seul personnage donne sa réplique habituelle : l'élève dans le couloir,
l'agent de sécurité dans la liaison. Le dialogue ne décrit pas le duo.
L'intention est de faire choisir une cible et une position, tout en gardant
chaque attaque anticipable. Les pièces à trous restent des respirations sans
adversaire. Les combats terminés ne recommencent pas au retour.

I2 conserve huit emplacements de rencontre et compte dix adversaires au total :

| Parcours complet | Rencontres I1 / I2 | Adversaires I1 | Adversaires I2 |
| --- | --- | --- | --- |
| Principal | 6 | 6 | 8 |
| Ateliers | 6 | 6 | 7 |
| Coupe connue | 5 | 5 | 6 |
| Service | 5 | 5 | 6 |

La coupe connue évite toujours le couloir principal ; la liaison reste commune
à toutes les routes. Cette différence donne un enjeu perceptible à la maîtrise
du bâtiment sans changer son graphe.

## Lycéenne et Sécurité

La lycéenne garde ses trois PV, ses livres et son kick. I2 lui fait reprendre
de la distance après un coup reçu, pour relancer son offensive plutôt que subir
un combo continu. Le recul doit se lire dans sa pose et son déplacement ; le
livre doit rester évitable, et le kick laisser une ouverture compréhensible.

La Sécurité garde ses six PV. I2 cherche une séquence lisible : poussée,
courte avancée, puis ouverture franche. Le danger vient de l'enchaînement à
relire, sans allonger artificiellement sa barre de vie.

Pendant l'enchaînement, il pare les livres des deux côtés : deux petits crochets
au sol signalent sa garde ; la flèche donne seulement la direction de l'attaque.
La direction de chaque attaque est fixée pendant sa préparation. L'ouverture
dure 1,05 s et autorise au maximum deux coups ; il reprend ensuite son appui en
reculant pendant 0,25 s. Les six PV nécessitent donc au moins trois ouvertures.
Les silhouettes gardent 36 unités de séparation pour éviter leur chevauchement.

La lycéenne recule sur 37,5 unités après un impact. Si le mur l'empêche de
reculer, elle écarte le professeur par une courte poussée sans dégât. Aucun
point de vie ni longue invulnérabilité n'est ajouté.

## Vérification avant validation humaine

Les tests doivent couvrir les états des deux adversaires, leur séparation,
les projectiles, les dialogues, la fin réelle d'une rencontre et le retour
dans une salle nettoyée. La première attaque doit attendre la fin de
l'introduction. Aucun personnage ne doit cacher durablement son partenaire,
être poussé dans un accès, ni attaquer pendant une transition ou le soin.

Observer les duos dans les deux sens d'arrivée : peuvent-ils être compris
avant le premier dommage ? Le joueur peut-il esquiver, atteindre le lanceur,
interrompre une attaque et se repositionner ? L'ouverture du boss doit être
assez nette pour autoriser une punition, sans retour au verrouillage continu.

Ce document décrit le réglage d'atelier à comparer. La validation de la
difficulté finale demande encore un essai humain complet.

## Vérifications effectuées

- `npm run test:inshape-i2` : duos indépendants, pause et répliques figées,
  collisions aux deux murs sans traversée forcée, traversée aérienne,
  persistance des morts et ciblage du partenaire à la souris/touch ; recul de
  la lycéenne dans les deux sens, reprise du livre et du kick ; garde, deux
  coups maximum, direction engagée et esquives du boss, à 30/60/144 images/s.
- Six combats de duo avec les commandes normales et 5 PV initiaux : quatre
  coups réussis par pièce, victoire avec 3 ou 4 PV ; les tests de collisions
  isolés utilisent explicitement une protection et ne constituent pas un
  résultat de difficulté.
- Trois combats du boss avec recul puis saut et punition : trois ouvertures,
  six coups, aucun dégât, environ 7,3–7,5 s pour le pilote automatisé. Cela
  prouve la faisabilité du pattern ; ce n'est pas une mesure de découverte
  humaine ni du parcours complet.
- Tests I1, H1, agressivité A3, cycle du Parent et trous A3 : réussis. Les
  contrôles de la suite générale ont passé après adaptation de deux fixtures
  de rendu à la nouvelle paire d'images.
- Observation native dans l'atelier : duo élève/lanceur, préparation puis
  avancée et ouverture du boss, frappe réussie pendant l'ouverture. Les
  indications et projectiles ont leur propre couche pour rester devant le
  décor recomposé ; les poses et ombres sont propres à chaque adversaire.

Captures : [duo](work/inshape-i2-duo.png),
[avancée](work/inshape-i2-boss-avance.png),
[ouverture](work/inshape-i2-boss-ouverture.png).
Mesures reproductibles : [résultats I2](work/inshape-i2-results.json).

Après simplification des introductions et renommage : `npm test`,
`test:inshape-i2`, `test:inshape-i1`, `test:hanouna-h1` et `test:rendu-a3`
réussis. Observation native des deux répliques classiques et des trois
façades/CADRE ; sélecteur d'atelier contenu dans son panneau malgré les
intitulés plus longs. Captures : [réplique du duo](work/trois-ponts-i2-dialogue.png),
[Ormeaux](work/ormeaux-name.png), [Auguste-Berthelot](work/auguste-berthelot-name.png),
[Trois-Ponts](work/trois-ponts-name.png). L'export 0.61 publié conserve son SHA-256.

Les passages ordinaires conservent leur règle existante : le combat n'est pas
un verrou obligatoire. Le joueur peut fuir si sa position le permet. La porte
T03 reste fermée tant que le boss vit. Chrono global et trajet automobile
restent à évaluer ensemble après la validation des trois établissements.
