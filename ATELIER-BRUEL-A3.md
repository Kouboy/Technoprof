# Bruel — atelier A3 : récupération et alternance du boss

Cette passe suit le dernier essai humain : conserver l'agressivité des
ennemis ordinaires et l'infirmerie à la jonction B, puis transformer le soin
en respiration humaine et empêcher le Parent influent d'être enchaîné
jusqu'au K.O. Les journaux personnels ne sont pas copiés dans le dépôt.

## Lancer

Ouvrir **Jouer-Technoprof-Atelier-Bruel-A3.html** dans le dossier du projet.
Cet export autonome contient le jeu et ses images (environ 101 Mo). Il démarre
sur « Bruel A3 / combats plus vifs ». A1 et A2 restent dans le sélecteur pour
comparer, avec leur soin partiel d'origine.

Depuis les sources : `npm run build:atelier`, puis `npm run dev` et
`/?essai=labo&scenario=bruel-navigation-a3`.

- `bruel-navigation-a3-road` : trajet puis établissement.
- `bruel-navigation-a3-care` : jonction B après les trois premières rencontres,
  déclarées terminées, pour tester le détour avec les PV choisis.
- `bruel-navigation-a3-parent` : rencontre du boss, avec sa présentation et
  les PV choisis, pour comparer esquive et frappe répétée.

Flèches/ZQSD, Espace, F/X, souris et gestes tactiles restent les commandes.
La journée publiée et le HTML gelé 0.61 sont inchangés. Le travail reste sur
la branche `atelier-navigation-bruel-a3`, sans publication sur main ou Pages.

## Rendu du réseau

Les douze zones disposent maintenant de fonds adaptés à leur rôle : le hall
montre les deux escaliers, les paliers montrent les descentes, la jonction
réunit les portes de l'annexe et de l'infirmerie, et B12 termine le parcours.
Les tableaux ne réutilisent plus tous le même couloir avec des portes collées.
L'étage utilise un plancher usé, prolongé dans les passages en profondeur,
avec vues extérieures en hauteur ; l'infirmerie reçoit un lino terne.
Deux trous de plancher sont actifs au palier principal et dans la galerie A,
uniquement dans ces pièces de l'étage sans ennemi. Les accès sont dégagés.
Saut : Espace ou glissement vers le haut avec composante latérale.
Les dessins artistiques sont remplacés par des affiches scolaires déchirées.
La topologie, les rencontres, les contrôles et les réglages validés restent
identiques. Voir [la passe de rendu et ses captures](RENDU-BRUEL-A3.md).

Le sélecteur de l'atelier propose des départs « décor » pour inspecter chaque
pièce sans refaire les combats. Ces départs sont des fixtures explicites,
avec les vrais passages et adversaires de la pièce ; ils ne remplacent pas
l'essai complet depuis la cour.

## Infirmerie : une scène de récupération

L'accès reste à la jonction B au premier étage. L'entrée déclenche la scène
automatiquement : le professeur rejoint l'infirmière, s'immobilise pendant
les trois répliques, puis repart vers la même jonction. Le chrono est suspendu
pendant toute la scène et les fondus ; le CADRE affiche cette suspension.

L'infirmière accueille le professeur sans gag : « Vous avez l'air à bout ».
La commande Action révèle la réplique en cours, puis une nouvelle pression
avance à la suivante. Un toucher dans la scène fait de même. Aucune attente
imposée ne coûte du temps de mission. Les déplacements et les frappes sont
ignorés pendant cet échange.

À la dernière réplique, les PV reviennent à **5/5**. L'usage est réservé dès
l'entrée, même si le professeur était déjà en pleine santé : une autre visite
ne rejoue ni le dialogue ni le soin. Le retour libère les contrôles et reprend
le chrono. Une pause ou une perte de focus suspend aussi l'animation de cette
séquence. Recommencer l'affectation réinitialise son usage.

Le sélecteur +1/+2 est masqué pour A3 ; il reste disponible pour A1/A2.
Le journal A3 indique `careMode: recovery` et la variante
`recovery-parent-cycle`. Les événements `care-start`, `care-dialogue`,
`care-complete` et `care-exit` permettent de vérifier le soin unique et le
temps restant. Le champ historique `gain` ne règle plus le soin d'A3 ;
`care-complete.gain` indique les PV effectivement récupérés.

**Conséquence spatiale à observer :** l'entrée et le retour se font au même
point de la jonction. Avec le chrono suspendu dans l'infirmerie, le modèle
statique mesure désormais zéro seconde supplémentaire pour une visite faite
au passage. Revenir depuis une zone plus éloignée coûte toujours le temps de
marche jusqu'à la jonction. Aucun délai artificiel ni déplacement de porte
n'a été ajouté pour recréer les 4,08 s de l'ancien soin partiel.

Les textes et placements sont regroupés dans `src/bruel-recovery.ts`.
L'infirmière est un nouveau sprite créé avec l'outil intégré imagegen,
sur fond transparent, sans retouche du fichier source :
[image](art/infirmiere-bruel-a3.png) et
[prompt final et provenance](art/infirmiere-bruel-a3.prompt.md).

## Parent influent : deux coups par ouverture

Le boss conserve **6 PV**. Son anticipation de charge et sa vitesse ne sont
pas augmentées. Il reprend sa garde après chaque ouverture selon la boucle :

**charge annoncée → esquive → ouverture → un ou deux coups → reprise d'appui
→ nouvelle charge annoncée.**

L'ouverture suit la fin de sa charge, y compris lorsqu'il atteint un mur.
Un premier coup reste possible à enchaîner avec un second. Après le deuxième,
le boss retire son corps, relève son appui et recrée de la distance avec une
petite poussée sans dégâts. Le professeur suit ce déplacement sans pouvoir
prolonger la frappe. Les traits de mouvement et « REPRISE D'APPUI » confirment
la transition ; « OUVERTURE » identifie le moment de punition.

Cette reprise dure **0,38 s** et vise **84 pixels** d'écart, au-delà de la
portée du livre. Aux murs, la poussée du professeur préserve cet écart même
si le boss ne peut plus reculer. Ensuite, sa garde normale revient et une
nouvelle anticipation commence. Il n'existe pas de longue invulnérabilité
chronométrée ajoutée. Une frappe confirmant un dialogue ne se transforme pas
en attaque ; les intentions de frappe précédentes sont annulées à la reprise.

Les réglages sont regroupés dans `PARENT_CYCLE` : deux coups maximum,
ouverture 1,15 s, possibilité de second coup maintenue au moins 0,65 s après
le premier, reprise 0,38 s, recul 34 pixels, écart final 84 pixels.
Les états sont explicites : garde, anticipation, charge, ouverture, reprise.
Les événements `boss-opening`, `boss-breakaway` et `boss-guard-restored`,
ainsi que `contact.openingHit`, rendent le cycle vérifiable dans le journal.

## Périmètre conservé

Les douze zones, les six rencontres, les deux routes et leur reconnexion,
la signalétique, l'emplacement de l'infirmerie et le chrono général restent
ceux d'A3. Les réglages des adversaires ordinaires dans `PRESSURE_ENEMY`
ne changent pas. Le nouveau cycle concerne seulement le Parent boss d'A3 ;
A1/A2 et les missions publiées gardent leurs règles précédentes.

## Vérifications

- `npm run build:atelier` : compilation et exports A1/A2/A3 réussis.
- `npm test` : suite existante réussie jusqu'aux contrôles 0.61.
- `npm run test:navigation` : A1/A2/A3, branches, parcours complets et
  comparaisons de soin réussis ; la comparaison de pression A2/A3 reste verte.
- `work/check-recovery-a3.cjs` : 60 combinaisons à 30/60/120 images/s,
  clavier et toucher, PV de départ 1 à 5, anciens gains +1/+2 ignorés par A3.
  Vérification du soin complet unique, lecture prolongée sans consommation
  du délai, retour puis nouvelle blessure et revisite sans double soin.
  Douze contrôles de pause/focus couvrent entrée, dialogue, sortie et fondu.
  Maintenir Action ou un déplacement ne saute pas les répliques et ne fait
  pas rebondir entre les portes. Aucun soin ne réanime un professeur à 0 PV
  ou une affectation dont le délai était déjà expiré.
- `work/check-parent-cycle-a3.cjs` : douze combats à 30/60/120 images/s,
  clavier et toucher, avec esquive ou frappe répétée. Chaque victoire contre
  les 6 PV demande au moins trois charges/ouvertures et deux reprises ;
  jamais plus de deux contacts par ouverture. Les combats avec esquive
  utilisent les vrais PV ; l'invulnérabilité est déclarée uniquement dans
  le stress test de martèlement. Six situations aux deux murs contrôlent
  la continuité de la poussée, l'écart final et la pause en pleine reprise.
- Navigateur local, par commandes réelles : accueil de l'infirmière,
  lecture avec délai figé, soin **1 → 5 PV**, sortie automatique et reprise
  du délai à la jonction observés. Contre le Parent, deux coups font passer
  ses PV de **6 à 4**, sa reprise repousse le professeur, puis une troisième
  tentative ne retire aucun PV et la nouvelle charge est annoncée.

Les rapports sont dans `work/navigation-a3-atelier-results.json`,
`work/parent-cycle-a3-results.json` et `work/pressure-a3-results.json`.
Les captures montrent l'[accueil](work/infirmerie-a3-accueil.png), le
[soin terminé](work/infirmerie-a3-soin-complet.png) et la
[reprise du Parent](work/parent-a3-reprise.png).

L'observation du boss utilise aussi les pas de simulation et la vitesse
ralentie de l'atelier pour examiner la transition. Elle ne remplace pas
l'évaluation humaine du rythme à vitesse normale. L'ouverture directe de
l'export HTML sur téléphone et l'écoute restent à confirmer chez Nicolas.
Les avertissements connus sur la taille du bundle et le stripping TypeScript
subsistent.

## Prochain essai humain

1. Jouer depuis la cour à vitesse normale avec 5 PV, puis décider librement
   d'entrer ou non dans l'infirmerie à la jonction.
2. Vérifier que cette visite se lit comme une courte respiration humaine,
   que le soin et la reprise du délai sont évidents, sans interaction de
   gestion supplémentaire.
3. Contre le Parent, comparer une ou deux frappes après l'esquive. La reprise
   d'appui doit expliquer immédiatement la fin du combo et laisser le temps
   de relire la prochaine charge.
4. Exporter le journal et noter toute sensation de déplacement forcé trop
   brusque, d'ouverture trop courte ou de transition peu lisible.
