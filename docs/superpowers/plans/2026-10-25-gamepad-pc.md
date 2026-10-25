# Commandes manette PC et fenêtre native

**But :** jouer la journée à la manette standard Xbox/XInput dans le navigateur,
en conservant clavier et souris/tactile. La publication reste suspendue.

**Mapping demandé :** stick gauche/croix pour diriger ; RT accélère et LT freine
sur la route ; A saute et B frappe à pied ; Start commence au titre, passe un
film, ouvre/reprend la pause en jeu. Compléments : haut/bas pour les accès, B pour
les répliques, A valider et B retour dans les menus, A/B après le cours/échec.

**Architecture :** module de lecture Gamepad standard séparé du gameplay,
échantillonné dans update (pas de seconde boucle RAF). Les actions passent par
ActionInput ; les axes/gâchettes analogiques sont centralisés et ne changent pas
les constantes de conduite. Les menus exposent un adaptateur explicite.

- [x] Tests : mapping, deadzone, analogique, appui unique, menus, Start contextuel,
  perte de focus, déconnexion et coexistence clavier/direct.
- [x] Implémentation pure, raccord au système d'actions et aux menus.
- [x] Tests natifs avec manette standard simulée : titre, intro sonorisée, route,
  menus, pause et déconnexion dans Chromium et Firefox. Dialogue, combat et
  transitions testés dans le vrai gameplay par simulation sans rendu.
  L’essai matériel réel reste à effectuer avec la manette de Nicolas.
- [x] Construire le jouable local et documenter les commandes.

Validation : suites `test:gamepad`, `test:playtest` et `npm test` réussies ;
compilations Pages et atelier réussies ; tests natifs manette et fenêtre réussis
dans Chromium/Firefox, cadre vérifié également au format téléphone. La référence
locale 0.61 conserve son SHA256. La review a conduit à corriger Start pendant un
échec suspendu et à adapter l’aide contextuelle aux commandes manette.

## Barre de titre Windows

La popup HTML actuelle ne maîtrise pas les boutons système. Proposition : ouvrir
le même jeu dans Edge/Chrome en mode application via Jouer.cmd, sans nouveau
moteur. Le rendu logique reste 640×480 ; pas de surcoût de simulation attendu.
Le choix est en attente après la question de Nicolas sur les performances ; ne
pas modifier son lanceur natif avant son accord. Une comparaison sur le même
navigateur évite de confondre effet du mode fenêtre et différences entre moteurs.
