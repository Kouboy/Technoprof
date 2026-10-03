const fs=require('fs');const root='C:/Users/don_n/Documents/Codex/Technoprof/';
const link=(p,l)=>root+p+(l?':'+l:'');
const audit=`## Verdict

**VALIDÉ AVEC RÉSERVES pour la progression 0.60.** Le prototype est prêt pour une nouvelle session de tests ; une correction ciblée est nécessaire sur la confirmation des dépassements. Aucun BLOCKER établi. La vertical slice autonome n'est pas encore validée sur sa découverte humaine, son mixage ou un téléphone physique.

TECHNOPROF — audit du 2 octobre 2026, selon **Game Dev Reviewer**. Cette revue actualise [l'audit 0.54](${link('AUDIT-0.54.md')}) et débouche sur [le plan 0.60](${link('PLAN-APRES-REVIEW-0.60.md')}). Une passe indépendante a réexaminé règles, parcours et cas limites ; une autre observation couvre le HTML livré, la composition et l'interface. Les sources du jeu et les livraisons sont conservées pendant cet audit.

### Périmètre et niveau de preuve

- **Réexécuté :** suite actuelle de 22 scripts, tous passants, et contrôles de l'export ; [résultat de suite](${link('work/review-060-tests.txt')}).
- **Diagnostics indépendants :** douze journées, comprenant référence, tentative d'évitement et une seconde d'hésitation par tableau ; quatre journées instrumentées pour les attaques ordinaires ; neuf cas de frôlement suivi d'un choc. [Passe détaillée](${link('work/review-060-gameplay-report.md')}), [mesures de parcours](${link('work/review-060-gameplay-results.json')}), [attaques et comptages de référence](${link('work/review-060-reference-results.json')}), [cas limite routier](${link('work/review-060-pass-results.json')}). Les inputs sont simulés ; positions, santé et délai ne sont pas corrigés pendant le parcours.
- **Observé réellement :** HTML figé 0.60 servi localement, accueil, cruising, notification visible, pause/aide, menus, nouvelle réplique du lycée professionnel et véritable contact du livre dans l'atelier. Desktop puis viewport 844 × 390. Les boutons Action/Un pas déclenchent les règles du jeu ; le contact n'est pas une image statique. Aucun message console de niveau error relevé.
- **Identité de livraison :** HTML courant et figé 0.60 ont le SHA-256 EF98F0F98C6EB73BAE83B15313756BBA63D6538002EB4AEF78216FEC9E4E90AF. Le fichier figé fait 87 558 307 octets. L'ouverture navigateur vérifie le HTML exporté par HTTP local ; elle ne vérifie pas le protocole file:// hors connexion ni le GPU d'un téléphone.
- **Non validé ici :** timbres/mixage à l'écoute, conduite humaine complète, fatigue d'une journée, compréhension sans accompagnement, doigts réels, mémoire vive/GPU sur appareil cible. La taille des textures sources n'est pas une mesure de mémoire en jeu. Les conducteurs automatiques utilisent des coordonnées précises ; ils ne prouvent pas que le trafic lointain est discernable par un joueur.

### Mise à jour des remarques 0.54

| Remarque | État actuel | Conséquence pour la suite |
|---|---|---|
| R01 — flèche latérale sans passage direct | Résolue techniquement depuis 0.55 ; les journées directes empruntent les indicateurs et terminent | Conserver les régressions ; tester la cible au doigt réel |
| R02 — même lieu, salle et boss | Résolue sur les trois lieux, destinations, arrivées et réponses aux boss | La variété des décisions dans les longues ailes reste ouverte, voir R08 |
| R03 — approche/frappe commune chez les ordinaires | Persiste ; confirmé sur les douze rencontres ajoutées | Ajuster une situation témoin avant de multiplier les PV |
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
| Cohérence / sens | Injunction administrative, dommages persistants, manque d'entretien et retour au cours | Sens attribué par le joueur à la multiplication des agressions |
| Technique | Pas de nouveau bitmap en 0.60 ; export autonome réel lancé ; instrumentation utile | Charge mobile ; aucune justification d'une réarchitecture générale |

## Problèmes trouvés

### R07 — [IMPORTANT] Le dépassement peut être confirmé avant d'être terminé

- **Observation :** neuf cas sur neuf enregistrent near-pass, puis crash sur le même véhicule environ 0,08 à 0,117 seconde plus tard. Exemple du soir, seed 4301 : signal à 20,983 s, distance 17,61 ; choc à 21,083 s, distance 1,66. Le diagnostic braque vers un véhicule après son annonce, avec les commandes normales.
- **Pourquoi :** le bruit de passage peut anticiper légitimement l'approche, mais un journal de dépassements réussis et un message de frôlement ne doivent pas valider une manœuvre encore exposée au contact. Cela fragilise aussi les mesures de progression. La formulation « les chocs ne sont pas comptés comme dépassements » n'est pas vraie pour tous les cas.
- **Preuve :** [main.ts:1934](${link('src/main.ts',1934)}) enregistre à distance <= closing × 0,12 ; le contact reste vérifié ensuite à [main.ts:1960](${link('src/main.ts',1960)}). [Reproduction](${link('work/review-060-pass.cjs')}). Les quatre références seed 4301 n'ont aucun objet simultanément hit et sounded : leurs valeurs 10 / 20 / 40 ne sont pas réfutées.
- **Test de confirmation :** passer au bord de la largeur de contact, puis braquer vers le véhicule après le son ; suivre le même objet jusqu'à sa sortie de zone.
- **Correction minimale :** séparer l'annonce sonore anticipée de la validation du passage après sortie de la zone de contact, sans hit. Garder une seule confirmation par véhicule et un événement distinct pour l'approche si utile. Vérifier ensuite les mesures et le message du CADRE.

### R08 — [À SURVEILLER] L'allongement des ailes repose principalement sur une succession linéaire

- **Observation établie :** dix tableaux ajoutés à Bruel, vingt-neuf au lycée professionnel. Le générateur alterne COULOIR / ETUDE / HALL / PALIER ; une sortie avance au tableau suivant, l'autre revient. Le secteur change tous les quatre tableaux. Les nouveaux tronçons ne créent pas de bifurcation stratégique.
- **Pourquoi :** le doublement demandé est respecté. Le risque est de faire percevoir « continuer à droite » pendant plusieurs minutes plutôt qu'une recherche de salle dans un établissement plus grand. Nombre de tableaux et variété de situations ne sont pas équivalents. L'ennui n'est pas démontré par une simulation.
- **Preuve :** [missions.ts:381](${link('src/missions.ts',381)}), :406, :476 et :500. Les cadres et plaques observés donnent des repères, mais leurs quatre modules se répètent.
- **Test :** journée humaine complète ; noter retour arrière, décisions, lieux reconnus et moments de lassitude. Faire décrire le trajet sans montrer le graphe.
- **Suggestion minimale :** conserver les minima 9 / 18 / 36 et la bibliothèque d'assets ; recomposer quelques séquences avec des repères locaux et une alternance plus intentionnelle entre recherche, tension et respiration. Introduire au plus un choix lisible dont le coût est réel. Éviter de répondre d'abord par davantage de pièces ou d'ennemis.

### R03 actualisé — [À SURVEILLER] Les nouvelles menaces ordinaires peuvent mourir avant leur première attaque

- **Observation bornée :** dans les quatre références, les douze rencontres supplémentaires montrent une préparation, mais aucune attaque active avant défaite. Élèves/vigiles : environ 1,95–1,98 s depuis l'entrée réelle, introduction exclue ; nouveaux lanceurs : 2,17–2,20 s, sans projectile émis. Le conducteur combat approche et frappe dès disponibilité ; il ne lit pas l'ouverture de ces adversaires.
- **Pourquoi :** les silhouettes et les répliques les distinguent, mais leur réponse mécanique peut rester commune. Ce n'est pas une preuve que les combats doivent tous durer davantage : les combats brefs servent le rythme et le délai.
- **Preuve :** [placements/PV](${link('src/missions.ts',605)}), [interruption au contact](${link('src/main.ts',2262)}), [lanceur](${link('src/main.ts',2603)}), [mesures instrumentées](${link('work/review-060-reference-results.json')}).
- **Test :** laisser un nouveau joueur rencontrer ces trois types ; demander ensuite quelle menace il a évitée. Examiner apparition de la première préparation et première attaque depuis la vraie entrée.
- **Suggestion minimale :** régler une seule rencontre témoin par type : placement, distance de déclenchement ou délai avant geste. Garder esquive/interruption possibles ; ne pas imposer une attaque inévitable ni augmenter tous les PV.

### R09 — [À SURVEILLER] Le soir tolère peu d'hésitation répartie

- **Observation :** marges des quatre références : matin 145,8–146,3 s ; midi 112,0–113,5 s ; soir 28,9–32,8 s. Une seconde sans input après chaque entrée/introduction fait échouer le soir au boss dans les quatre variantes, après les deux premiers succès ; le professeur a encore 2 PV. Le temps d'attente change aussi les rencontres, pas seulement le total arithmétique du délai.
- **Pourquoi :** la demande explicite était une hausse forte de difficulté. Cette sensibilité n'est donc pas un bug ou une injustice établie. Elle implique toutefois qu'un joueur découvrant les accès peut échouer avant d'expérimenter le troisième boss. Un retour arrière coûte déjà plusieurs secondes.
- **Preuve :** [210 secondes](${link('src/missions.ts',578)}), [diagnostic référence/hésitation](${link('work/review-060-gameplay.cjs')}) et ses résultats.
- **Test :** première découverte puis reprise par la même personne ; relever où part le délai et ce qu'elle comprend de l'échec. Comparer les deux contrôles.
- **Suggestion :** mesurer avant de toucher au délai. Si une correction est nécessaire, Nicolas arbitre le niveau d'exigence ; réduire une friction d'accès ou améliorer un indice peut préserver la pression voulue mieux qu'un allongement général.

### R10 — [À SURVEILLER] La branche de service du lycée professionnel n'a pas de bénéfice stratégique mesuré

- **Observation :** trajet par la passerelle : 36 tableaux ; accès de service : 37. Douze rencontres dans les deux cas, avec un vigile dans chaque branche. Le service ajoute deux trous et coûte environ trois secondes actives supplémentaires dans les références, sans gain de santé.
- **Pourquoi :** si c'est un détour, cette asymétrie peut être volontaire. S'il doit permettre un compromis entre sécurité et rapidité, le bénéfice actuel n'est pas identifié. Le changelog 0.60 parle honnêtement d'un accès de service ; c'est la direction de gameplay antérieure qui proposait un choix selon le risque.
- **Preuve :** [branches](${link('src/missions.ts',221)}), :237 et [vigile ajouté à la réserve](${link('src/missions.ts',494)}), [intention des lieux](${link('DIRECTION-TROIS-AFFECTATIONS.md',19)}).
- **Test :** demander ce que promet chaque accès avant engagement ; comparer leurs coûts réels après les deux parcours.
- **Suggestion :** décider s'il s'agit d'un détour assumé ou d'une alternative utile ; dans le second cas, compenser son risque par un bénéfice perceptible, sans abaisser silencieusement les minima demandés.

### R04 actualisé — [À SURVEILLER] Le paysage compact réduit fortement les textes et les cibles

- **Observation réelle :** à 844 × 390, le canvas normal mesure environ 370,7 × 278 pixels CSS. Les commandes restent consultables par scroll et les actions de menu sont accessibles. La police cinq pixels des plaques/bulles correspond à environ 5,8 pixels CSS ; une flèche latérale active de 15 × 14 unités, avec padding de six, offre environ 31 × 30 pixels CSS de cible. Ce sont des mesures de viewport, pas de doigts réels.
- **Pourquoi :** le grand chrono reste lisible, mais petits libellés et précision de toucher deviennent fragiles. Les 112 pixels de hauteur réservés à l'interface/aide réduisent la scène même quand les rappels ne sont pas affichés. Sous-titres HTML mobiles présents : ils aident les dialogues, pas toutes les plaques.
- **Preuve :** [règle paysage](${link('index.html',267)}), [marqueurs et padding](${link('src/passage-layout.ts',4)}), [police](${link('src/small-lettering.ts',1)}). [Capture 844 × 390](${link('work/review-060-mobile.png')}). Livraison 87,6 Mo, 29 PNG ; libération de copies sources à [main.ts:797](${link('src/main.ts',797)}). Le coût GPU réel reste non mesuré ici.
- **Test :** téléphone de référence, première lecture du CADRE et toucher d'une flèche centrale/gauche/droite, lancement à froid et rotation/reprise.
- **Suggestion minimale :** agrandir la zone sensible sans agrandir les flèches ni ajouter de croix/boutons ; récupérer la place réservée à l'aide lorsqu'elle est absente, en conservant le CADRE et les sous-titres. Optimiser les textures uniquement d'après les mesures réelles.

### R11 — [À SURVEILLER] La multiplication des agressions peut modifier ce que le joueur attribue à la satire

- **Observation de contenu :** plusieurs nouvelles répliques parlent du chauffage, des ateliers supprimés et de l'instabilité des remplacements, puis le locuteur attaque le professeur. Le contexte existe ; l'intention institutionnelle doit néanmoins survivre à douze rencontres et aux trois boss.
- **Pourquoi :** risque de lecture artistique, non défaut moral ou bug établi. Le jeu veut montrer l'usure de l'école et le mépris du métier ; une succession d'élèves/agents hostiles peut faire retenir un autre sujet. Le gameplay d'action et les ennemis sont expressément voulus par Nicolas.
- **Preuve :** [répliques supplémentaires](${link('src/missions.ts',500)}), [direction et traces de soin](${link('DIRECTION-TROIS-AFFECTATIONS.md',21)}), [nouveau dialogue observé](${link('work/review-060-dialogue.png')}).
- **Test :** après une journée, demander sans orienter « Qu'est-ce que le jeu dénonce ? » et « Que cherche à préserver le professeur ? ».
- **Suggestion :** selon ce retour seulement, renforcer une trace de travail/entraide dans des pièces calmes ou clarifier une réplique. L'arbitrage de ton reste à Nicolas ; aucune nouvelle mécanique de cours nécessaire.

### R12 — [POLISH] Le bilan appelle encore « collège » les deux lycées

- **Observation :** les quatre échecs du soir par délai affichent RETARD DANS LE COLLEGE alors que le bilan nomme le lycée professionnel.
- **Pourquoi :** petite incohérence de contenu après introduction des trois établissements ; la cause reste compréhensible.
- **Preuve :** [resultLine](${link('src/player-experience.ts',23)}) et les variantes hésitation du diagnostic.
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

[Contact observé dans le HTML livré](${link('work/review-060-contact.png')}) · [Affichage paysage compact](${link('work/review-060-mobile.png')})

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
`;
fs.writeFileSync('AUDIT-0.60.md',audit);
const plan=`# TECHNOPROF — Plan après l'audit 0.60

Référence : [AUDIT-0.60.md](${link('AUDIT-0.60.md')}). Ce plan actualise l'ordre de travail du [plan 0.54](${link('PLAN-APRES-REVIEW-0.54.md')}). Il prépare des interventions ; elles ne sont pas implémentées pendant la revue.

Conserver la demande de progression forte : minima 9 / 18 / 36 tableaux, 3 / 6 / 12 adversaires et trafic nettement croissant. Le prochain chantier doit améliorer ce que le joueur rencontre dans cette charge, sans l'abaisser silencieusement ni rajouter de contenu par défaut.

## Lot A — Fiabiliser les confirmations et l'identité

1. Séparer son routier anticipé, passage confirmé et choc. Compter après sortie de la zone de contact sans hit ; un véhicule ne peut produire qu'une confirmation. Ajouter au test le braquage tardif qui déclenche actuellement pass puis crash.
2. Refaire les comptages sur références, deux branches et plusieurs seeds. La capacité32 n'est pas une mesure d'exposition ; les coordonnées connues par un bot ne valident pas la discernabilité humaine.
3. Corriger le libellé de retard au lycée et vérifier destination/nom/salle dans notification, HUD, pause et bilan.

**Sortie :** plus de double validation au cas limite ; aucune régression de son/dégâts/chrono ; mesures cohérentes. Petit chantier autonome, sans arbitrage artistique.

## Lot B — Donner une occasion lisible aux menaces ordinaires

Prendre une rencontre témoin pour l'élève, le vigile et le lanceur. Partir de leur vraie entrée, et comparer marche + frappe, saut, évitement et contrôle direct. Retoucher uniquement placement, déclenchement, portée ou récupération lorsque la menace reste invisible. Préserver combat court, interruption utile et réponse immédiate ; une attaque ne doit pas devenir inévitable pour garantir sa visibilité.

**Sortie :** un joueur explique la différence entre les trois types après les avoir vus ; les références finissent avec une marge documentée. Ne pas généraliser une hausse de PV. Si la retouche allonge le combat, mesurer son coût dans le même délai.

## Lot C — Recomposer quelques séquences avant de créer des assets

- Garder les quantités et les pièces calmes ; remplacer l'alternance mécanique des quatre modules par quelques séquences reconnaissables, avec progression par ailes et repères physiques.
- Concentrer les variantes de placement et les rares événements de fond dans les espaces déjà disponibles. Ménager repos et lecture sans immobilisations gratuites supplémentaires.
- Clarifier le rôle de la branche de service PRO : détour assumé ou alternative de risque utile. Ce choix implique Nicolas. Si un bénéfice est voulu, le rendre compréhensible avant engagement et mesurable après.
- Confirmer que le joueur cherche encore sa destination et reconnaît sa position, plutôt qu'il ne se contente d'attendre le bout d'une chaîne.

**Sortie :** mêmes minima, quelques décisions réellement différentes et repères rappelés par le joueur. Pas besoin de nouveaux décors pour chaque tableau ; produire un asset seulement pour une fonction précise manquante.

## Lot D — Découverte, écoute et confort sur la cible

Une découverte humaine complète, puis reprise du soir par la même personne. Mesurer hésitations, retours, marge, blessures, collisions et lassitude. L'essai ajoutant une seconde par tableau est un diagnostic de sensibilité, pas une norme de réussite ni une preuve d'injustice. Décider du délai seulement après avoir identifié le coût perceptif et le niveau d'exigence voulu.

Tester le téléphone retenu : lancement du HTML hors connexion, cibles de passage, petits libellés du CADRE, conduite, rotation et reprise. Vérifier les sous-titres. Agrandir les zones sensibles et récupérer une part de la place d'aide si nécessaire, avec contrôle direct sans croix ni boutons d'action flottants.

Écouter le mixage durant la même journée : moteur, frôlements, DATA, alerte d'arrivée, parole, livre, blessure et classe. Régler à partir de cette écoute. Vérifier château d'eau, transformateur et ponts dans une fenêtre de visibilité utile ; davantage d'assets ne compense pas un repère masqué ou trop bref.

**Sortie :** difficultés identifiées et compréhensibles, confort constaté sur l'appareil, alertes audibles, fichiers et résultats d'essai archivés. Les optimisations de ressources suivent les mesures, pas un budget GPU supposé.

## Lot E — Figer la slice et vérifier sa lecture

Regrouper les corrections importantes, exécuter régressions et parcours continus, vérifier le fichier autonome livré et figer la référence. Faire une découverte extérieure sans explication préalable si disponible. Demander ce que le jeu dénonce et ce que le professeur préserve ; Nicolas arbitre une retouche de ton si la multiplication d'agressions change la lecture voulue.

**Sortie :** pas de défaut important connu dans le parcours cible, expérience comprise sans accompagnement, réserves de téléphone/audio explicitement levées ou conservées. Une suite verte seule ne suffit pas.

## Contributions utiles de Nicolas

Les corrections de confirmation et de contenu peuvent être faites en autonomie. Les arbitrages utiles sont limités au rôle de la branche PRO, au niveau d'exigence de la fin de journée après essai, et à la lecture satirique. Une seule session regroupant découverte, reprise du soir et écoute donnera davantage d'information que plusieurs demandes générales de polish.
`;
fs.writeFileSync('PLAN-APRES-REVIEW-0.60.md',plan);
for(const [p,heading] of [['AUDIT-0.54.md','# TECHNOPROF — Évaluation globale 0.54'],['PLAN-APRES-REVIEW-0.54.md','# TECHNOPROF — Plan après la revue 0.54']]){
 let s=fs.readFileSync(p,'utf8');s=s.replace(heading,heading+'\n\n**Actualisation 0.60 disponible :** [audit actuel]('+link('AUDIT-0.60.md')+') et [ordre de travail actualisé]('+link('PLAN-APRES-REVIEW-0.60.md')+'). Ce document conserve les observations et le contexte historiques de la 0.54.');fs.writeFileSync(p,s);
}
let readme=fs.readFileSync('README.md','utf8');readme=readme.replace('# TECHNOPROF — Physique appliquée — 0.60','# TECHNOPROF — Physique appliquée — 0.60\n\nRevue actualisée : [audit 0.60]('+link('AUDIT-0.60.md')+') et [plan après revue]('+link('PLAN-APRES-REVIEW-0.60.md')+').');fs.writeFileSync('README.md',readme);
fs.writeFileSync('work/review-060-summary.json',JSON.stringify({version:'0.60',date:'2026-10-02',verdict:'VALIDÉ AVEC RÉSERVES',blockersEstablished:0,important:['R07 anticipation/confirmation de dépassement'],observedExport:'Jouer-Technoprof-0.60.html via localhost HTTP',normalLandscapeCanvasCss:{viewport:[844,390],width:370.65625,height:277.9921875},physicalDevice:false,audioListening:false,tests:'22 scripts npm test pass',diagnostics:['review-060-gameplay.cjs','review-060-reference.cjs','review-060-pass.cjs'],screenshots:['review-060-mobile.png','review-060-dialogue.png','review-060-contact.png']},null,2));
console.log('Audit, plan, historical pointers and evidence summary written.');
