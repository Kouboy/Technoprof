# Manette PC — 25 octobre 2026

La lecture de `navigator.getGamepads()` utilise le mapping navigateur `standard`
(disposition Xbox). Elle ne charge ni moteur supplémentaire ni pilote XInput.
Les périphériques au mapping inconnu sont ignorés plutôt que d’attribuer de
mauvaises commandes. Clavier, souris et toucher restent disponibles.

| Situation | Commandes |
| --- | --- |
| Route | Stick gauche/croix : diriger ; RT : accélérer ; LT : freiner |
| À pied | Stick/croix : marcher ; haut/bas : accès ; A : saut ; B : frappe/réplique |
| Titre / cinématique / jeu | Start : commencer / passer / pause ou reprise |
| Menus | Stick/croix : naviguer ; A : valider ; B : retour ; gauche/droite : volume |
| Après le cours / échec | A/B : poursuivre |

`src/gamepad-input.ts` contient le mapper pur et `PAD_TUNING` : zones mortes du
stick et des gâchettes, délai et répétition dans les menus. La lecture intervient
une fois par update, dans la boucle existante. Les gâchettes et la direction sont
progressives sur la route ; les valeurs de vitesse, d’inertie et de freinage
existantes sont conservées.

Les appuis A/B/Start sont des fronts uniques : maintenir un bouton ne passe pas
plusieurs répliques, ne répète pas les sauts et ne saute pas l’intro ouverte au
titre. Un changement de salle consomme l’interaction ; la direction maintenue
ne déclenche pas un deuxième escalier. La perte de focus neutralise les boutons
jusqu’au relâchement. Débrancher la manette en cours d’utilisation suspend le jeu,
y compris pendant une séquence. Un périphérique inactif ne suspend pas une partie
reprise au clavier.

## Vérification

- `npm run test:gamepad` : mapper et raccord au vrai gameplay, gâchettes partielles,
  saut/frappe, dialogue, escalier, Start contextuel et déconnexion.
- `node tools/check-gamepad-browser.cjs` après `npm run build:pages` : contrôleur
  standard simulé dans Chromium et Firefox, début sans clic, progression sonore
  de l’intro, skip, conduite, focus des menus, volumes, déconnexion et reprise.
- `npm run test:playtest` : régressions consolidées de la journée.

Les tests navigateur emploient des snapshots simulés. La reconnaissance d’une
manette physique, son éventuelle dérive et les sensations restent à confirmer
pendant le playtest matériel. Les rapports natifs vont dans
`work/checkpoints/gamepad/` et ne sont pas livrés aux joueurs.

## Fenêtre native

Nicolas a choisi Chrome après ses essais. `Jouer.cmd` ouvre le HTML journée avec
musique dans Chrome en mode application, avec les boutons système et sans
onglets. Il cherche les installations Windows habituelles ; sans Chrome, il
conserve le lanceur HTML dans le navigateur par défaut. Aucun changement de
navigateur par défaut ni installation. La publication reste suspendue.
