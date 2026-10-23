# TECHNOPROF — audit gamefeel du 23 octobre 2026

## Verdict

**VALIDÉ AVEC RÉSERVES.** La prochaine passe gagnerait à travailler la confiance
dans les commandes, la compréhension des ouvertures et la fiabilité des
confirmations. Deux corrections sont établies ; les autres sujets demandent
des comparaisons de réglages. Aucun BLOCKER démontré dans cet audit.

État examiné : `6d12ca8`, branche `atelier-navigation-bruel-a3`, journée actuelle
Ormeaux H1 / Auguste-Berthelot A3 / Trois-Ponts I2. Revue indépendante appliquant
le skill **Game Dev Reviewer**, puis reproduction et observation complémentaires
par le développeur principal. Aucun réglage du jeu n'a été modifié.

### Portée et preuve

- **Revue indépendante :** systèmes actuels, six journées par inputs à
  30/60/120 Hz, 18 politiques de combat contre les trois boss, aides et tolérance
  des inputs. [Mesures du reviewer](../../work/audits/gamefeel-2026-10-23/reviewer-probes.json).
- **Contre-vérifications :** neuf approches/frôlements suivis de collision,
  accélération/freinage/inertie/reprise après choc et six séquences de frappes.
  [Conduite](../../work/audits/gamefeel-2026-10-23/road-measures.json),
  [frappes](../../work/audits/gamefeel-2026-10-23/input-crosscheck.json).
- **Référence actuelle :** nouvelle journée directe complète, seed 4301,
  60 Hz, chemins connus et soin à chaque établissement : 3/3 cours, zéro choc,
  zéro chute. [Parcours et délais](../../work/audits/gamefeel-2026-10-23/day-reference.json).
- **Observation du rendu réel :** ateliers conduite rapide de jour/soir,
  frappe touchée/ratée au pas de 20 ms, couloir de soins I2 à deux trous.
  Pose, contact, effet d'impact et recul sont raccordés dans la séquence examinée.
  [Périmètre navigateur](../../work/audits/gamefeel-2026-10-23/browser-observation.json).
  La planche de contact utilise un ancien décor d'atelier ; elle ne vaut pas
  validation de chaque adversaire actuel. Aucune erreur de page sur ces vues.
- **Limites :** ni écoute humaine du mixage, ni mesure de latence d'un appareil,
  ni test au doigt sur téléphone physique, ni découverte par une personne neuve.
  Une partie automatique ne mesure pas le plaisir, la fatigue ou la difficulté humaine.

Les [scripts de reproduction](../../work/audits/gamefeel-2026-10-23/README.md)
conservent leurs résultats dans le dossier temporaire d'essai, sans écraser
les mesures archivées de cette passe.

Les anciens constats de l'audit 0.60 ont été confrontés au code actuel. En
particulier, la confirmation routière prématurée reste reproductible. Ses
anciens minima de tableaux ne décrivent pas les nouvelles topologies validées.

## Problèmes trouvés

### GF01 — [IMPORTANT] Les aides de la première école ne suivent plus H1

- **Observation — démontrée :** `contextualHelp()` produit une chaîne vide dans
  les salles H1 `200`, `201`, `207`, alors que les anciennes `0`, `1`, `4`
  produisent les rappels marche, frappe/saut et inspection.
- **Pourquoi :** les commandes sont disponibles dans le menu, mais l'explication
  au moment d'agir a disparu. Un nouveau joueur peut comprendre une perte de PV
  comme une règle opaque ou une commande défaillante.
- **Preuve :** `src/player-experience.ts:60–68`, identifiants dans
  `src/hanouna-navigation.ts`; champ `help` des mesures du reviewer.
- **Test humain :** démarrer une journée sans conseil oral ; observer ce que
  le joueur fait dans la cour, à la première rencontre et devant l'Inspectrice.
- **Correction minimale :** raccorder les trois rappels au profil H1 actuel,
  conserver leurs fenêtres temporelles et la désactivation des rappels.
  Pas besoin d'un nouveau tutoriel ni d'un écran obligatoire.

### GF02 — [IMPORTANT] Le jeu peut féliciter un frôlement avant son issue

- **Observation — démontrée :** neuf cas sur neuf annoncent le passage puis
  enregistrent un choc avec le même véhicule **67 à 100 ms** plus tard. Le
  conducteur braque normalement vers lui après l'annonce ; aucune position
  ni santé n'est corrigée pendant le parcours.
- **Pourquoi :** un son d'approche peut anticiper le passage. Le message
  « RÉTROVISEUR : ENCORE PRÉSENT » et le comptage d'un passage réussi doivent
  confirmer une manœuvre terminée. Leur contradiction avec un choc nuit à la
  confiance dans ce qui vient de se produire.
- **Preuve :** `src/main.ts:2447–2463`, annonce à `closing * 0.12` avant la
  sortie de la zone de contact ; `passThenCrash` dans les mesures conduite.
- **Test :** frôler puis corriger sa direction vers la voiture au moment du
  son ; suivre l'objet jusqu'au dégagement et comparer annonce/choc/confirmation.
- **Correction minimale :** séparer approche sonore et confirmation de
  dépassement. Valider celle-ci après dégagement, une fois, sans collision.
  Conserver le whoosh d'approche si son anticipation est utile.

### GF03 — [À SURVEILLER] Le rythme d'enchaînement peut paraître irrégulier

- **Observation — démontrée pour l'acceptation :** un deuxième F à +200 ms
  est oublié ; un clic ennemi à ce moment conserve une intention et attend la
  disponibilité. Contre-vérification : F à +400 ms enchaîne après une frappe
  dans le vide, mais pas après un contact. À +480 ms, les deux enchaînent.
- **Pourquoi :** la fenêtre clavier est une anticipation tardive de 100 ms ;
  le clic est une intention persistante. Le hit stop décale la disponibilité
  après contact. Ces règles peuvent donner l'impression qu'une commande a été
  perdue à un rythme pourtant familier. La gêne ressentie reste à confirmer.
- **Preuve :** `src/gameplay.ts:10–15`, `src/main.ts:2303,2773–2787`,
  `src/direct-input.ts:307–325`; résultats `queues` et `input-crosscheck.json`.
- **Test :** deux frappes à rythme naturel sur cible touchée, ratée et gardée,
  au clavier puis au clic. Compter les demandes faites et acceptées ; demander
  au joueur quand il pense pouvoir refrapper.
- **Réglage minimal à comparer :** buffer tardif actuel de 100 ms contre
  140–160 ms. Si cela ne règle pas la gêne, comparer une seule frappe mise
  en attente après le contact. Ce second choix change davantage l'engagement
  du coup : arbitrage nécessaire avant adoption. Blessure, transitions et
  fins de fenêtre de boss doivent toujours annuler les demandes obsolètes.
- **Garde-fou :** pas de coups automatiques indéfinis, pas d'annulation libre
  des animations, pas de suppression de la reprise de garde après deux touches.

### GF04 — [À SURVEILLER] Un saut un peu anticipé est consommé sans effet

- **Observation — démontrée :** sur trois instants proches de la réception,
  une pression Espace n'est pas mémorisée et le personnage reste ensuite au sol.
  Le départ de saut exige d'être exactement au sol. Aucune tolérance de bord
  ne rattrape un départ demandé après le début de chute.
- **Pourquoi :** avec deux trous successifs, un joueur qui anticipe la
  réception peut sentir sa commande ignorée. Les trous sont franchissables ;
  leur difficulté n'est pas invalidée par ce constat.
- **Preuve :** `src/main.ts:2754,3070–3076`; champ `jumpBuffer` du reviewer.
- **Test :** franchir le couloir I2 sans regarder les variables, enchaîner
  deux sauts au clavier puis par glissés. Relever les demandes précoces et tardives.
- **Réglage minimal à comparer :** mémorisation de saut pendant **80–100 ms**
  avant réception. Une grâce de bord de 40–60 ms ne vient qu'ensuite si les
  essais la justifient : elle touche le déclenchement de chute et coûte plus
  qu'un simple changement de constante. Garder l'arrêt pédestre immédiat.

### GF05 — [À SURVEILLER] La première victoire ne vérifie pas l'apprentissage attendu

- **Observation — démontrée pour les politiques testées :** D maintenu et F
  répété toutes les 100/200/300 ms, sans lire les phases, battent l'Inspectrice
  H1 depuis son atelier à 5 PV en environ **6,8–12,6 s**, avec **2–3 PV**.
  Les mêmes politiques échouent contre le Parent A3 et la Sécurité I2.
- **Pourquoi :** si H1 doit apprendre « lire → éviter → riposter », sa victoire
  peut valider une habitude qui échoue ensuite. Un premier boss permissif peut
  aussi être un bon choix. Le problème d'apprentissage est donc probable,
  pas établi par le seul résultat du bot.
- **Preuve :** 18 essais `periodicFights`; réglages H1 dans
  `src/gameplay.ts:224`, garde dans `src/main.ts:2812` et séquence de récupération.
- **Test :** après sa première victoire, demander au joueur « Comment as-tu
  gagné ? », puis observer sa première tentative A3. Vérifier s'il reconnaît
  la garde, l'ouverture et la raison d'un coup refusé.
- **Correction minimale :** restaurer d'abord GF01, puis améliorer le signal
  d'ouverture si nécessaire. Régler protection/fenêtres seulement après cette
  observation. Garder les PV et dégâts stables pendant la comparaison.

### GF06 — [À SURVEILLER] Le coût d'une collision rapide mérite une comparaison dédiée

- **Observation — mesurée, défaut ressenti non établi :** un choc automobile
  à 260 km/h ramène à 124,8 km/h et il faut **8,85 s** d'accélération continue
  pour revenir à 260 sur route dégagée. Un même choc à 110 demande **1,99 s**
  de reprise ; à 20, **0,29 s**. Les dégâts automobiles sont de 18 dans les trois cas.
- **Pourquoi :** la sanction ressentie combine perte de carrosserie et perte
  d'élan. Après avoir allégé les dégâts, le temps passé à reprendre sa vitesse
  peut encore porter une grande partie de la punition. Cela peut être voulu.
- **Preuve :** `src/main.ts:3133`, accélération `:2362–2374`, `impacts` dans
  les mesures conduite. Ce sont des essais isolés avec état initial contrôlé,
  pas des moyennes de collisions au milieu du trafic.
- **Test :** même trajet court, une collision comparable, noter si la reprise
  nourrit la tension ou produit une attente subie. Tester séparément une touchette
  et un camion ; ne pas dériver un réglage de la seule valeur numérique.
- **Réglage minimal à comparer si besoin :** accélération 38 contre 42,
  sans toucher au plafond, au trafic ni aux dégâts pendant l'essai. Mesurer
  aussi l'accélération initiale et le délai restant, car cette constante agit
  sur toute la conduite. Ne pas retenir automatiquement le réglage plus facile.

## Ce qui paraît sain

- **Une frappe possède déjà un langage.** Préparation nominale de 140 ms,
  contact, recul, effet pulp et hit stop paramétré ; coup dans le vide, garde et
  blessure ont des réponses distinctes. Le raccord contact/effet/recul est
  visible dans la séquence native examinée. Ajouter des particules n'est pas
  un remède démontré aux points GF03/GF05.
- **Les boss avancés imposent des décisions.** A3 casse l'enchaînement après
  deux touches ; I2 organise poussée, avancée, ouverture, reprise. Les attaques
  aveugles testées échouent. Préserver ces boucles pendant le tuning.
- **La conduite a une amplitude réelle.** 110→260 prend 9,45 s ; le freinage
  260→0 prend 2,74 s. Après une impulsion droite de 0,3 s, le relâchement laisse
  encore environ 18,4 pixels logiques de déplacement en 0,6 s à 260, contre
  10,7 à 110, courbure réelle incluse. L'inertie demandée existe ; ces chiffres
  seuls ne justifient pas de la supprimer. Le gain de défilement à haute vitesse
  est présent et la direction utilise une réponse indépendante du framerate.
- **Le déplacement pédestre sert les choix précis.** Réponse directe, arrêt
  net, reprise clavier immédiate après une intention à la souris. À conserver
  pour les portes, l'orientation et les trous.
- **Le temps forcé est traité équitablement.** Lecture, arrivée, transitions
  et scène de soin suspendent le délai partagé route/école.
- **L'infirmerie remplit son rôle humain.** Facultative, complète, unique,
  bienveillante et automatique. L'entrée à 5 PV consomme aussi la visite ;
  cette règle mérite seulement une vérification de compréhension. Nicolas a
  validé la scène : pas de soin partiel, inventaire ou confirmation intrusive proposés.
- **La maîtrise d'un lieu est récompensée.** Dans la référence directe
  informée, il reste environ **82 / 90 / 91 s** aux victoires. Cela ne prouve
  pas que les délais sont trop larges. Découverte, hésitations et erreurs de
  parcours humaines restent à mesurer ; conserver les délais pendant cette passe.
- **Fréquence de simulation :** six journées indépendantes à 30/60/120 Hz
  terminent avec 3/3 pour le pilote direct, 2/3 pour le pilote clavier, sans
  chute/collision. Les algorithmes de pilotage diffèrent : aucun classement de
  difficulté entre périphériques ne peut en être déduit.

## Plan proposé

| Lot | Contenu | Gain attendu | Coût / risque | Validation |
|---|---|---|---|---|
| 0 — Confiance | Rappels H1 et confirmation routière après dégagement | Comprendre l'action ; croire le feedback | Faible ; pas de changement de difficulté voulu | Première découverte + cas frôlement/choc sur un même objet |
| 1 — Commandes | Comparaison de tolérance F/clic ; saut avant réception | Réduire les demandes ressenties comme perdues | Faible à moyen ; combat/trous potentiellement facilités | Deux versions masquées, mêmes rencontres, inputs reçus/acceptés et commentaire joueur |
| 2 — Lecture des combats | Apprentissages H1→A3 ; signal d'ouverture ; poids des impacts à l'écoute | Choisir la bonne action au bon moment | Moyen ; préserver les boss validés | Le joueur explique garde, ouverture et rupture après deux touches |
| 3 — Conduite | Reprise après choc, puis éventuellement contre-braquage, un paramètre à la fois | Garder la tension tout en permettant la correction | Faible code ; impact réel sur erreurs/chronos | Circuit court identique, ressenti + collisions + délai, sans hausse de densité simultanée |
| 4 — Vie et variété | Une petite scène humaine de fond dans un espace calme, si les essais signalent une fatigue | Renforcer le sens et la respiration | Moyen avec quelques assets ; lisibilité à protéger | Le joueur comprend le geste sans quitter le parcours ni attendre |

### Ajouts réellement pertinents

1. **Un mini-parcours d'atelier de 60–90 s**, construit avec les scènes déjà
   disponibles : une rencontre simple, un boss, deux trous. Un autre essai court
   pour reprise et correction de trajectoire. Rejouables immédiatement, ils
   permettent de comparer un réglage sans refaire une journée.
2. **Un petit journal des intentions en atelier** : demande de frappe/saut,
   acceptation/refus et état à cet instant. Hors de l'UI joueur. Il répond à
   « j'ai appuyé » avant de changer la difficulté.
3. **Si l'ouverture n'est pas reconnue :** une reprise d'appui ou un signe
   sonore bref propre au boss, au moment utile. Utiliser d'abord les poses et
   sons actuels ; ne produire un nouveau sprite que si leur ambiguïté est observée.
4. **Après le tuning :** un événement de fond rare de soin ou de travail dans
   une pièce calme, par exemple un élève en manteau qui travaille ou un agent
   qui protège une fuite. Aucun objectif, récompense ou interaction imposée.
   L'infirmerie reste la respiration centrale.

### À éviter pour cette étape

Combos multiples, endurance, esquive dédiée, armes supplémentaires, arbres de
compétences, inflation de shake/flash/onomatopées, davantage d'ennemis ou de
couloirs pour remplacer un problème de lecture, et inertie pédestre. Leur coût
serait un nouveau langage à apprendre. Les outils et comparaisons ci-dessus
doivent d'abord montrer où le jeu résiste à l'intention du joueur.

## Tests à effectuer en jeu

Une session ciblée d'environ 25 minutes suffit pour la prochaine décision :

1. **5 min, découverte H1 :** sans explication orale ; demander après une
   rencontre ce qui est dangereux et comment avancer. Après le boss, demander
   comment il a gagné. Garder les erreurs, pas seulement le résultat final.
2. **5 min, frappe et ouverture :** mêmes situations touchée/ratée/gardée,
   clavier puis clic ; essai A3 en premier apprentissage. Observer demandes
   ignorées, attente, compréhension de la garde et des deux touches.
3. **5 min, deux trous I2 :** sauts naturels avant réception et tardifs au bord,
   clavier puis glissés. Relever l'intention, la position et l'issue.
4. **5 min, route :** corrections à 110 puis haute vitesse ; choc isolé ;
   frôlement suivi d'une correction ; mesurer la reprise ressentie.
5. **5 min, écoute :** casque puis haut-parleurs ; distinguer approche,
   frôlement confirmé, choc, swing, garde, impact, blessure, ouverture. Tester
   les niveaux plutôt que supposer que les sons neufs doivent être plus forts.

Finir par trois questions ouvertes : « Qu'est-ce qui t'a fait perdre ? »,
« Quelle commande t'a semblé ne pas répondre ? », « Qu'est-ce que le jeu
dénonce ? ». Si plusieurs personnes testent, ne pas leur annoncer les
hypothèses de cet audit avant leur première tentative.

Les propositions de valeurs sont des points de comparaison, pas des réglages
déjà validés. Ce document autorise une décision de chantier ; il ne prétend
pas qu'un ressenti humain a été reproduit automatiquement.
