## Verdict

**VALIDÉ AVEC RÉSERVES pour la progression 0.60.** Le prototype est prêt pour une nouvelle session de tests ; des corrections ciblées sont nécessaires sur la confirmation des dépassements et l'évitement des charges (complément après retour de Nicolas, R13). Aucun BLOCKER établi. La vertical slice autonome n'est pas encore validée sur sa découverte humaine, son mixage ou un téléphone physique.

TECHNOPROF — audit du 2 octobre 2026, selon **Game Dev Reviewer**. Cette revue actualise [l'audit 0.54](AUDIT-0.54.md) et débouche sur [le plan 0.60](PLAN-APRES-REVIEW-0.60.md). Une passe indépendante a réexaminé règles, parcours et cas limites ; une autre observation couvre le HTML livré, la composition et l'interface. Les sources du jeu et les livraisons sont conservées pendant cet audit.

### Périmètre et niveau de preuve

- **Réexécuté :** suite actuelle de 22 scripts, tous passants, et contrôles de l'export ; [résultat de suite](work/review-060-tests.txt).
- **Diagnostics indépendants :** douze journées, comprenant référence, tentative d'évitement et une seconde d'hésitation par tableau ; quatre journées instrumentées pour les attaques ordinaires ; neuf cas de frôlement suivi d'un choc. [Passe détaillée](work/review-060-gameplay-report.md), [mesures de parcours](work/review-060-gameplay-results.json), [attaques et comptages de référence](work/review-060-reference-results.json), [cas limite routier](work/review-060-pass-results.json). Les inputs sont simulés ; positions, santé et délai ne sont pas corrigés pendant le parcours.
- **Observé réellement :** HTML figé 0.60 servi localement, accueil, cruising, notification visible, pause/aide, menus, nouvelle réplique du lycée professionnel et véritable contact du livre dans l'atelier. Desktop puis viewport 844 × 390. Les boutons Action/Un pas déclenchent les règles du jeu ; le contact n'est pas une image statique. Aucun message console de niveau error relevé.
- **Identité de livraison :** HTML courant et figé 0.60 ont le SHA-256 EF98F0F98C6EB73BAE83B15313756BBA63D6538002EB4AEF78216FEC9E4E90AF. Le fichier figé fait 87 558 307 octets. L'ouverture navigateur vérifie le HTML exporté par HTTP local ; elle ne vérifie pas le protocole file:// hors connexion ni le GPU d'un téléphone.
- **Non validé ici :** timbres/mixage à l'écoute, conduite humaine complète, fatigue d'une journée, compréhension sans accompagnement, doigts réels, mémoire vive/GPU sur appareil cible. La taille des textures sources n'est pas une mesure de mémoire en jeu. Les conducteurs automatiques utilisent des coordonnées précises ; ils ne prouvent pas que le trafic lointain est discernable par un joueur.

### Mise à jour des remarques 0.54

| Remarque | État actuel | Conséquence pour la suite |
|---|---|---|
| R01 — flèche latérale sans passage direct | Résolue techniquement depuis 0.55 ; les journées directes empruntent les indicateurs et terminent | Conserver les régressions ; tester la cible au doigt réel |
| R02 — même lieu, salle et boss | Résolue sur les trois lieux, destinations, arrivées et réponses aux boss | La variété des décisions dans les longues ailes reste ouverte, voir R08 |
| R03 — approche/frappe commune chez les ordinaires | Défaites rapides confirmées ; Nicolas précise que ce comportement préexistait | Conserver l'interruption utile ; priorité à l'évitement des attaques, voir R13 |
| R04 — coût et ergonomie mobiles | Mesures et libération de textures améliorées, appareil réel non validé | 87,6 Mo embarqués et cibles petites : mesurer avant de produire une nouvelle série d'assets |
| R05 — validation par morceaux | Améliorée par journées continues, journaux et diagnostics indépendants | Découverte humaine, écoute et fatigue restent séparées des tests techniques |
| R06 — répétitions et repères routiers | Des périodes et districts existent ; répétition de façades encore observable | Visibilité du château d'eau/transformateur à vitesse réelle reste à vérifier, sans déclarer leur absence |

### Lecture globale

| Axe | Ce qui est démontré ou observé | Ce qui reste ouvert |
|---|---|---|
| Gameplay / progression | Minima 9 / 18 / 36 tableaux, 3 / 6 / 12 rencontres ; trafic nettement croissant | Quantité supplémentaire versus nouvelles décisions |
| Rythme | Trois périodes explicites ; pression du soir accrue ; lectures et cinématiques hors délai | Longueur ressentie et marge de découverte |
| Gamefeel / combat | Contact, recul, impact pulp et perte de PV cohérents au pas à pas ; boss demandant des réponses différentes | Lecture des ordinaires à vitesse réelle ; sensation au doigt |
| Visuels / lisibilité | Silhouettes séparées dans les vues examinées ; livre, réparations, délabrement, plaques et bulles raccordés | Répétition des modules et petits textes sur écran compact |
| UI/UX / feedback | CADRE lisible sur desktop, dialogues manuels, menus scrollables et causes d'échec | Confirmation routière trop précoce ; coût de la place réservée à l'aide en paysage |
| Audio | Routage, événements et suspension couverts par les tests | Audibilité des alertes et fatigue du moteur après une journée, sans conclusion de timbre ici |
| Cohérence / sens | Injonction administrative, dommages persistants, manque d'entretien et retour au cours | Sens attribué par le joueur à la multiplication des agressions |
| Technique | Pas de nouveau bitmap en 0.60 ; export autonome réel lancé ; instrumentation utile | Charge mobile ; aucune justification d'une réarchitecture générale |

## Problèmes trouvés

### R07 — [IMPORTANT] Le dépassement peut être confirmé avant d'être terminé

- **Observation :** neuf cas sur neuf enregistrent near-pass, puis crash sur le même véhicule environ 0,08 à 0,117 seconde plus tard. Exemple du soir, seed 4301 : signal à 20,983 s, distance 17,61 ; choc à 21,083 s, distance 1,66. Le diagnostic braque vers un véhicule après son annonce, avec les commandes normales.
- **Pourquoi :** le bruit de passage peut anticiper légitimement l'approche, mais un journal de dépassements réussis et un message de frôlement ne doivent pas valider une manœuvre encore exposée au contact. Cela fragilise aussi les mesures de progression. La formulation « les chocs ne sont pas comptés comme dépassements » n'est pas vraie pour tous les cas.
- **Preuve :** [main.ts:1934](src/main.ts#L1934) enregistre à distance <= closing × 0,12 ; le contact reste vérifié ensuite à [main.ts:1960](src/main.ts#L1960). [Reproduction](work/review-060-pass.cjs). Les quatre références seed 4301 n'ont aucun objet simultanément hit et sounded : leurs valeurs 10 / 20 / 40 ne sont pas réfutées.
- **Test de confirmation :** passer au bord de la largeur de contact, puis braquer vers le véhicule après le son ; suivre le même objet jusqu'à sa sortie de zone.
- **Correction minimale :** séparer l'annonce sonore anticipée de la validation du passage après sortie de la zone de contact, sans hit. Garder une seule confirmation par véhicule et un événement distinct pour l'approche si utile. Vérifier ensuite les mesures et le message du CADRE.

### R08 — [À SURVEILLER] L'allongement des ailes repose principalement sur une succession linéaire

- **Observation établie :** dix tableaux ajoutés à Bruel, vingt-neuf au lycée professionnel. Le générateur alterne COULOIR / ETUDE / HALL / PALIER ; une sortie avance au tableau suivant, l'autre revient. Le secteur change tous les quatre tableaux. Les nouveaux tronçons ne créent pas de bifurcation stratégique.
- **Pourquoi :** le doublement demandé est respecté. Le risque est de faire percevoir « continuer à droite » pendant plusieurs minutes plutôt qu'une recherche de salle dans un établissement plus grand. Nombre de tableaux et variété de situations ne sont pas équivalents. L'ennui n'est pas démontré par une simulation.
- **Preuve :** [missions.ts:381](src/missions.ts#L381), :406, :476 et :500. Les cadres et plaques observés donnent des repères, mais leurs quatre modules se répètent.
- **Test :** journée humaine complète ; noter retour arrière, décisions, lieux reconnus et moments de lassitude. Faire décrire le trajet sans montrer le graphe.
- **Suggestion minimale :** conserver les minima 9 / 18 / 36 et la bibliothèque d'assets ; recomposer quelques séquences avec des repères locaux et une alternance plus intentionnelle entre recherche, tension et respiration. Introduire au plus un choix lisible dont le coût est réel. Éviter de répondre d'abord par davantage de pièces ou d'ennemis.

### R03 actualisé — [À SURVEILLER] Variété perçue des menaces ordinaires

- **Observation bornée :** dans les quatre références, les douze rencontres situées dans les 39 tableaux ajoutés montrent une préparation, mais aucune attaque active avant défaite. Élèves/vigiles : environ 1,95–1,98 s depuis l'entrée réelle, introduction exclue ; nouveaux lanceurs : 2,17–2,20 s, sans projectile émis. Le conducteur combat approche et frappe dès disponibilité ; il ne lit pas l'ouverture de ces adversaires.
- **Pourquoi :** les silhouettes et les répliques les distinguent, mais leur réponse mécanique peut rester commune. Nicolas précise après l'audit que les ennemis pouvaient déjà tomber avant leur première attaque : ce comportement n'est pas une régression établie de 0.60. Interrompre rapidement une menace est une réponse valable ; les combats brefs servent le rythme et le délai. L'absence d'attaque active dans les références n'est pas à elle seule un défaut.
- **Preuve :** [placements/PV](src/missions.ts#L605), [interruption au contact](src/main.ts#L2262), [lanceur](src/main.ts#L2603), [mesures instrumentées](work/review-060-reference-results.json).
- **Test :** laisser un nouveau joueur rencontrer ces trois types ; demander ensuite quelle menace il a évitée. Examiner apparition de la première préparation et première attaque depuis la vraie entrée.
- **Suggestion minimale :** vérifier d'abord la compréhension et l'évitement des attaques quand elles se produisent (R13). Conserver les victoires rapides et l'interruption ; aucune obligation de voir chaque attaque, aucune hausse générale des PV. Retoucher une rencontre témoin seulement si sa menace reste incompréhensible en découverte.

### R13 — [IMPORTANT] Une charge ne peut pas être évitée par un saut sur place dans le cas reproduit

**Complément du développeur principal après le retour de Nicolas, le 2 octobre 2026.** Ce diagnostic s'ajoute à la passe indépendante ; il ne lui attribue pas rétrospectivement une observation qu'elle n'avait pas faite.

- **Retour joueur :** certaines attaques, notamment le fonçage, paraissent sans esquive accessible et sont frustrantes. Il ne s'agit donc pas d'abord de rendre les ennemis plus résistants.
- **Reproduction bornée :** scénario atelier `bruel-rush`, professeur au sol x175, parent influent x220, sans invulnérabilité. Après cette configuration initiale, seuls saut et déplacement sont commandés ; aucune correction de position, santé ou état ennemi. Pour chacun des trois débits 30/60/120 images/s, 161 instants de saut sont essayés entre 0 et 1,60 s après le début de préparation. Aucun saut sur place, ni saut en reculant dans ce cas, ne termine la première charge sans blessure. Le saut en avançant vers le parent réussit pour 20 instants testés par débit (délais demandés 0,74–0,93 s ; résolution et pas internes du jeu limitent la précision). Cela ne démontre pas l'impossibilité à toute distance ou près d'une limite de salle.
- **Pourquoi :** la charge blesse tant que la distance horizontale est inférieure à 22 unités et que les pieds sont sous y130. Le saut actuel laisse trop peu de temps au-dessus de ce seuil pour couvrir toute la traversée de la zone de contact à l'arrêt. Avancer vers la charge raccourcit cette traversée. Sauter dès le début de la seconde de préparation fait aussi retomber avant la menace. Cette exigence de déplacement reste peu expliquée ; l'aide clavier promet simplement de sauter une charge.
- **Preuve :** [charge et collision](src/main.ts#L2697), [saut et gravité](src/gameplay.ts#L4), [diagnostic reproductible](work/review-060-charge.cjs), [résultats](work/review-060-charge-results.json). Simulation de règles, sans évaluation perceptive ni validation au doigt réel.
- **Correction à préparer :** rendre le saut sur place correctement synchronisé capable d'éviter entièrement la charge, en ajustant spécifiquement son seuil/volume de contact plutôt qu'en ajoutant une invulnérabilité générale. Distinguer préparation et départ par une pose et un signal lisibles ; laisser le saut en avançant comme option utile. Vérifier le parent ordinaire et le parent influent, les deux orientations, distances proches/lointaines et bords de salle ; comparer clavier, souris et geste vertical/diagonal tactile. Ne pas renforcer les ennemis avant cette vérification.
- **Critère joueur :** voir la menace, choisir de sauter et comprendre immédiatement pourquoi le coup a été évité ou reçu. Une attaque esquivable uniquement grâce à une combinaison implicite ne satisfait pas ce critère.

### R09 — [À SURVEILLER] Le soir tolère peu d'hésitation répartie

- **Observation :** marges des quatre références : matin 145,8–146,3 s ; midi 112,0–113,5 s ; soir 28,9–32,8 s. Une seconde sans input après chaque entrée/introduction fait échouer le soir au boss dans les quatre variantes, après les deux premiers succès ; le professeur a encore 2 PV. Le temps d'attente change aussi les rencontres, pas seulement le total arithmétique du délai.
- **Pourquoi :** la demande explicite était une hausse forte de difficulté. Cette sensibilité n'est donc pas un bug ou une injustice établie. Elle implique toutefois qu'un joueur découvrant les accès peut échouer avant d'expérimenter le troisième boss. Un retour arrière coûte déjà plusieurs secondes.
- **Preuve :** [210 secondes](src/missions.ts#L578), [diagnostic référence/hésitation](work/review-060-gameplay.cjs) et ses résultats.
- **Test :** première découverte puis reprise par la même personne ; relever où part le délai et ce qu'elle comprend de l'échec. Comparer les deux contrôles.
- **Suggestion :** mesurer avant de toucher au délai. Si une correction est nécessaire, Nicolas arbitre le niveau d'exigence ; réduire une friction d'accès ou améliorer un indice peut préserver la pression voulue mieux qu'un allongement général.

### R10 — [À SURVEILLER] La branche de service du lycée professionnel n'a pas de bénéfice stratégique mesuré

- **Observation :** trajet par la passerelle : 36 tableaux ; accès de service : 37. Douze rencontres dans les deux cas, avec un vigile dans chaque branche. Le service ajoute deux trous et coûte environ trois secondes actives supplémentaires dans les références, sans gain de santé.
- **Pourquoi :** si c'est un détour, cette asymétrie peut être volontaire. S'il doit permettre un compromis entre sécurité et rapidité, le bénéfice actuel n'est pas identifié. Le changelog 0.60 parle honnêtement d'un accès de service ; c'est la direction de gameplay antérieure qui proposait un choix selon le risque.
- **Preuve :** [branches](src/missions.ts#L221), :237 et [vigile ajouté à la réserve](src/missions.ts#L494), [intention des lieux](DIRECTION-TROIS-AFFECTATIONS.md#L19).
- **Test :** demander ce que promet chaque accès avant engagement ; comparer leurs coûts réels après les deux parcours.
- **Suggestion :** décider s'il s'agit d'un détour assumé ou d'une alternative utile ; dans le second cas, compenser son risque par un bénéfice perceptible, sans abaisser silencieusement les minima demandés.

### R04 actualisé — [À SURVEILLER] Le paysage compact réduit fortement les textes et les cibles

- **Observation réelle :** à 844 × 390, le canvas normal mesure environ 370,7 × 278 pixels CSS. Les commandes restent consultables par scroll et les actions de menu sont accessibles. La police cinq pixels des plaques/bulles correspond à environ 5,8 pixels CSS ; une flèche latérale active de 15 × 14 unités, avec padding de six, offre environ 31 × 30 pixels CSS de cible. Ce sont des mesures de viewport, pas de doigts réels.
- **Pourquoi :** le grand chrono reste lisible, mais petits libellés et précision de toucher deviennent fragiles. Les 112 pixels de hauteur réservés à l'interface/aide réduisent la scène même quand les rappels ne sont pas affichés. Sous-titres HTML mobiles présents : ils aident les dialogues, pas toutes les plaques.
- **Preuve :** [règle paysage](index.html#L267), [marqueurs et padding](src/passage-layout.ts#L4), [police](src/small-lettering.ts#L1). [Capture 844 × 390](work/review-060-mobile.png). Livraison 87,6 Mo, 29 PNG ; libération de copies sources à [main.ts:797](src/main.ts#L797). Le coût GPU réel reste non mesuré ici.
- **Test :** téléphone de référence, première lecture du CADRE et toucher d'une flèche centrale/gauche/droite, lancement à froid et rotation/reprise.
- **Suggestion minimale :** agrandir la zone sensible sans agrandir les flèches ni ajouter de croix/boutons ; récupérer la place réservée à l'aide lorsqu'elle est absente, en conservant le CADRE et les sous-titres. Optimiser les textures uniquement d'après les mesures réelles.

### R11 — [À SURVEILLER] La multiplication des agressions peut modifier ce que le joueur attribue à la satire

- **Observation de contenu :** plusieurs nouvelles répliques parlent du chauffage, des ateliers supprimés et de l'instabilité des remplacements, puis le locuteur attaque le professeur. Le contexte existe ; l'intention institutionnelle doit néanmoins survivre à douze rencontres et aux trois boss.
- **Pourquoi :** risque de lecture artistique, non défaut moral ou bug établi. Le jeu veut montrer l'usure de l'école et le mépris du métier ; une succession d'élèves/agents hostiles peut faire retenir un autre sujet. Le gameplay d'action et les ennemis sont expressément voulus par Nicolas.
- **Preuve :** [répliques supplémentaires](src/missions.ts#L500), [direction et traces de soin](DIRECTION-TROIS-AFFECTATIONS.md#L21), [nouveau dialogue observé](work/review-060-dialogue.png).
- **Test :** après une journée, demander sans orienter « Qu'est-ce que le jeu dénonce ? » et « Que cherche à préserver le professeur ? ».
- **Suggestion :** selon ce retour seulement, renforcer une trace de travail/entraide dans des pièces calmes ou clarifier une réplique. L'arbitrage de ton reste à Nicolas ; aucune nouvelle mécanique de cours nécessaire.

### R12 — [POLISH] Le bilan appelle encore « collège » les deux lycées

- **Observation :** les quatre échecs du soir par délai affichent RETARD DANS LE COLLEGE alors que le bilan nomme le lycée professionnel.
- **Pourquoi :** petite incohérence de contenu après introduction des trois établissements ; la cause reste compréhensible.
- **Preuve :** [resultLine](src/player-experience.ts#L23) et les variantes hésitation du diagnostic.
- **Correction minimale :** RETARD DANS L'ETABLISSEMENT, ou type issu des données de mission. Vérifier notification, pause, HUD, erreur et bilan ensemble.

## Ce qui paraît sain

- La progression de quantité demandée est réelle : 9 / 18 / 36 minima et 3 / 6 / 12 adversaires croisés, boss inclus. Un détour du collège porte le total à 10/4 ; le service PRO à 37/12. Ces nombres ne sont pas des éliminations obligatoires.
- Les trois affectations possèdent leurs destinations et leurs boss : ouverture après inspection, ruée du parent influent, garde et rotation de la sécurité. Les parcours automatiques utilisent effectivement des réponses différentes contre les boss.
- Même réserve de trafic, densités croissantes, aucun renouvellement à la notification. La première mission conserve ses grands intervalles. Les références indépendantes seed 4301 donnent 10 / 20 / 40 passages et aucun double comptage choc/pass.
- Les dialogues immobilisent, la révélation et la confirmation sont séparées, la confirmation ne frappe pas. Vérifié en atelier sur le nouveau lanceur : DIALOGUE/210,00 s, puis LIBRE/209,98 s, zéro coup involontaire.
- Les fondus, lectures et arrivées forcées restent hors délai ; les états sont suffisamment explicités pour reproduire les incidents. Les dommages de voiture persistent ; la récupération du professeur entre services est annoncée.
- Le contact du livre observé montre une pose d'attaque, un éclat raccordé au corps, une onomatopée et un recul avec PV 2 → 1. Les visages restent visibles dans cette vue. Cela valide un raccord, pas toute la sensation à vitesse réelle.
- Les vues examinées conservent les proportions, les détails français d'entretien et l'identité pulp. Midi et crépuscule se différencient ; les pièces calmes et tableaux animés de vétusté existent.
- Accueil, pause, commandes, volumes et sous-titres ont un parcours autonome. L'atelier reste séparé. Le HTML exporté lance effectivement la journée ; les erreurs de l'outil d'observation sur une page de 87 Mo ne sont pas des crashs du jeu.
- Les nouvelles traversées réutilisent les assets : pas de gonflement des PNG en 0.60. Les timings et profils sont déjà réglables ; aucun besoin établi de changer de moteur ni de réécrire l'architecture.

[Contact observé dans le HTML livré](work/review-060-contact.png) · [Affichage paysage compact](work/review-060-mobile.png)

## Tests à effectuer en jeu

| Essai | Critère à noter |
|---|---|
| Première découverte, journée entière | Notification/chrono compris ; hésitations, retours et cause d'échec identifiés sans guidage |
| Deux branches du lycée professionnel | Le joueur peut expliquer le bénéfice et le coût de chaque route avant/après l'avoir empruntée |
| Trois types ordinaires ajoutés | Menace propre perçue ; préparation, esquive/interruption et conséquence lisibles |
| Reprise du soir après découverte | Progrès réel de maîtrise ; fatigue des 29 tableaux supplémentaires mesurée séparément de la difficulté |
| Frôlement puis braquage tardif | Son anticipé distinct d'une réussite ; aucun passage confirmé si choc sur le même objet |
| Route à 110/260 sur téléphone | Obstacles discernables, freinage anticipable, cibles tactiles utilisables |
| Écoute d'une journée | DATA/proximité/parole/impacts restent audibles ; moteur et répliques ne fatiguent pas |
| Hors connexion, appareil cible | Chargement à froid, premières interactions, frame time, rotation et reprise sans commande restée active |
| Question de sens après partie | Le joueur attribue la pression aux conditions de travail et comprend le retour au métier |

La prochaine progression utile est une correction limitée du feedback routier, puis une passe de situations et de découverte mesurée. Ajouter encore du contenu avant ces retours risquerait de masquer ce qui doit être réglé.
