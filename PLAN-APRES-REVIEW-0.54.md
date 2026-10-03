# TECHNOPROF — Plan après la revue 0.54

**Actualisation 0.60 disponible :** [audit actuel](AUDIT-0.60.md) et [ordre de travail actualisé](PLAN-APRES-REVIEW-0.60.md). Ce document conserve les observations et le contexte historiques de la 0.54.

État du 2 octobre 2026. Ce document remplace l'ordre de travail historique du plan issu de l'audit 0.42. Référence : [AUDIT-0.54.md](AUDIT-0.54.md). Il propose les prochains chantiers ; ils ne sont pas implémentés pendant la revue.

**Avancement : lot 0 livré en 0.55 ; lot 1 technique livré en 0.56 ; lot 2 intégré en 0.57.** Configurations de mission, Bruel et lycée professionnel : nouvelles cartes, décors, adversaires et boss. 36 journées continues clavier/direct passent dans les trois lieux ; version compilée observée. Voir [GAMEPLAY-0.57.md](GAMEPLAY-0.57.md). Les essais humains, téléphone et tonalité des nouvelles répliques restent à confirmer ; le lot 3 commence en 0.58 par les poses actives, la garde directionnelle et les gestes sonores. Voir [GAMEPLAY-0.58.md](GAMEPLAY-0.58.md). L’écoute en situation, les repères routiers et le téléphone restent ouverts. 60 parcours continus clavier/contrôle direct, temps actifs/suspendus et chargement/rendu PC mesurés ; journal exportable depuis la pause ; copies de textures sources libérées. Résultats et limites dans [GAMEPLAY-0.56.md](GAMEPLAY-0.56.md). Le lot 1 reste ouvert pour la découverte extérieure et la validation sur téléphone physique ; les résultats automatisés ne valident pas le gamefeel d'un débutant. Le modèle de téléphone de référence reste à choisir.

**Retour utilisateur intégré en 0.59 :** file de trafic corrigée et exposition mesurée, neuf tableaux sans combat, décors de manque d’entretien et périodes de la journée plus explicites. Voir [GAMEPLAY-0.59.md](GAMEPLAY-0.59.md). La difficulté perçue, le rythme des nouvelles traversées et le téléphone restent à confirmer en essai humain.

## Objectif

Une journée de trois affectations dans **trois établissements distincts**, qu'un joueur extérieur peut découvrir seul, terminer ou échouer en comprenant pourquoi, puis avoir envie de recommencer. La première affectation fournit la référence de qualité ; les suivantes montrent d'autres lieux, situations et boss.

Conserver le contrôle simple, le chrono partagé, la radio en cruising, la cinématique hors chrono, le livre, le CADRE, l'école française usée, le cours et l'ellipse. **Orientation précisée par Nicolas :** réutilisation intelligente d'assets, nouveaux éléments propres à chaque lieu, ennemis communs et nouveaux, boss différents. La production de contenu s'élargit ; les mécaniques de base restent simples.

## Ordre des lots

| Lot | Livrable concret | Ampleur relative | Condition de sortie |
|---|---|---|---|
| 0 — Passages fiables | Flèches et accès utilisables en souris/tactile, règles communes aux contrôles | Petite | Le centre de chaque indicateur commande le bon passage ; clavier, retours et accès fermés préservés |
| 1 — Première affectation de référence | Parcours complet corrigé et calibré à partir d'observations ; mesure PC/téléphone | Moyenne | Aucun blocage important ; erreurs compréhensibles ; temps et coût de chargement mesurés |
| 2 — Trois établissements | Configurations de mission, nouveaux lieux, ennemis et deux nouveaux boss, construits successivement | Forte, découpée | Chaque établissement est reconnaissable, son parcours distinct et son boss demande une réponse différente |
| 3 — Finition ciblée | Mixage vérifié, menaces/impacts lisibles, répétitions et repères routiers réglés | Selon observations | Retour positif en situation sur les points corrigés ; budget mobile conservé |
| 4 — Slice figée | Livraison locale, protocole court et découverte extérieure | Moyenne | Deux parcours complets techniques, tests humains, risques restants explicitement consignés |

Ces ampleurs comparent le travail ; elles ne constituent pas un calendrier. Les mesures du lot 1 peuvent révéler une correction de ressources à faire avant le lot 2.

## Lot 0 — Raccorder le passage affiché et le passage demandé

1. Décrire les passages latéraux et explicites dans une donnée commune portant destination, seuil, point d'arrivée et indicateur. Garder l'architecture existante des états.
2. Toucher une flèche crée une intention de passage, pas une simple destination égale à sa position. Le personnage rejoint le seuil puis la transition consomme l'intention.
3. Conserver le fondu, la suspension de temps et la protection contre les inputs maintenus. Aucune sortie déclenchée par le seul recul d'un coup.
4. Tester les indicateurs réellement dessinés, les huit liens latéraux, les sorties verticales, les passages bouchés et une alternance clavier/souris. Observer au moins cour → hall, hall → escalier et passerelle → service avec la souris.

**Résultat joueur :** « Je touche ce passage ; le prof y va et change de pièce. » Aucun pixel caché à trouver. C'est le premier chantier recommandé.

## Lot 1 — Calibrer la première affectation avant d'étendre

- Parcourir cruising → notification → route → arrivée → recherche → boss → porte → cours → retour, avec les contrôles livrés. Faire un parcours au clavier et un en contrôle direct.
- Relever temps de route, d'orientation et de combat, erreurs, chutes, chocs et hésitations. Distinguer temps actif du chrono et temps de lecture/transition suspendu ; le journal local permet déjà de commencer.
- Vérifier le trafic sur plusieurs seeds. Un conducteur automatisé peut détecter une impasse ou une solution dominante ; il ne mesure pas la difficulté du débutant.
- Vérifier les ennemis depuis leur entrée réelle, particulièrement élève et vigile : préserver des combats courts tout en laissant lire leur menace propre.
- Mesurer le HTML hors connexion : lancement à froid, préparation des textures, pics de frame time et mémoire quand l'outil du navigateur le permet. Choisir un PC et un téléphone comme références. Prendre comme objectifs provisoires un jeu fluide à 60 fps sur PC et au moins 30 fps stables sur le téléphone retenu ; confirmer ces cibles avec la mesure plutôt que les promettre pour tout appareil.
- Faire une première découverte extérieure courte après la correction des passages. Ne pas attendre tout le polish pour découvrir une règle incomprise.

**Livrables :** une grille de résultats, les incidents reproductibles dans l'atelier et des corrections limitées aux causes observées. Si les ressources dominent le lancement, réduire les planches coûteuses avant d'ajouter du contenu.

**Critère :** le joueur sait quel geste utiliser, perçoit son erreur et comprend ce qu'il peut essayer ensuite. On ne fixe pas encore un taux de réussite idéal sans voir la première découverte.

## Lot 2 — Construire trois établissements

**Direction retenue :** une affectation par lieu, avec géographie, destination et boss propres. La proposition de revenir trois fois au même collège est remplacée. Nicolas a nommé les deux nouveaux lieux : **Lycée Patrick Bruel** (urbain ancien) et **Lycée Professionnel Tibo InShape** (périphérique). Les adversaires ci-dessous restent des propositions créatives.

| Service | Lieu proposé | Navigation et identité | Boss proposé |
|---|---|---|---|
| Matin | Collège C. Hanouna actuel | Béton des années 1970, cour, ailes et escaliers ; parcours de référence vers 42C | Inspectrice : tampon, balayage, ouverture après récupération |
| Midi | Lycée Patrick Bruel — urbain ancien | Cour resserrée, maçonnerie, salles hautes, annexes ; repères par ailes et passages | Parent influent : intimidation, ruée annoncée, occasion de riposte après dépassement |
| Fin de journée | Lycée Professionnel Tibo InShape — périphérique | Ateliers, verrières, passerelles techniques, portes de laboratoire ; trajet sûr ou raccourci dégradé | Responsable d'une sécurité externalisée : garde frontale, rotation lente ; contournement par saut puis riposte |

### 2A — Rendre les missions configurables

Définir pour chaque affectation établissement, salle, trajet routier, carte et sorties, assets, rencontres, répliques et boss. Distinguer l'identité d'une pièce de son rôle de gameplay : un numéro de pièce ne doit plus décider à lui seul qu'un adversaire est un élève ou que la destination est 42C. Les profils de combat et les règles communes peuvent rester dans leurs modules.

Migrer d'abord la première mission vers ces données en conservant son comportement. Vérifier notification, CADRE, façade d'arrivée, panneaux, porte, dialogue et bilan : ils doivent tous désigner le même établissement et la même salle. Valider le graphe des accès avant de produire le rendu définitif.

### 2B — Produire le deuxième lieu comme preuve de la méthode

Construire sa carte avec les contrôles existants, composer quelques vues caractéristiques, intégrer un nouvel ennemi ordinaire et le parent en véritable boss. La charge du parent actuel est une base possible ; sa promotion nécessite une silhouette/animation lisible à l'échelle du boss et un combat complet, pas seulement plus de PV.

Les ennemis communs reviennent dans un contexte et une combinaison adaptés : un parent, un élève ou un vigile peuvent être familiers sans être aux mêmes coordonnées dans chaque lieu. Toute nouvelle attaque doit être anticipable et évitable avec les actions déjà disponibles.

### 2C — Produire le troisième lieu après validation du deuxième

Créer un parcours et un vocabulaire visuel propres aux ateliers, un autre ennemi ordinaire et un troisième boss. Le choix de risque met en jeu l'apprentissage de la journée et l'état de la voiture ; il ne doit pas imposer un nouveau contrôle en dernière mission. Composer également une approche routière et une arrivée différentes.

### Réutilisation et création

- **Partagé :** professeur, voiture, circulation de base, CADRE, contrôles, transitions, sons de matière, familles de portes, radiateurs, tuyaux, mobilier, props de réparation et de danger.
- **Recomposé :** palette locale dans la même DA, éclairage, groupes de props, réparations, signes d'orientation, circulation et sélection d'ennemis communs.
- **Créé pour chaque nouveau lieu :** façade et arrivée reconnaissables, compositions de décors caractéristiques, carte et destination, éléments architecturaux propres, nouvel ennemi ordinaire, boss et répliques. Une cour/entrée, un intérieur et la confrontation constituent les premières vues de référence à produire pour chacun.

Les proportions des personnages, portes et sols restent communes et vérifiées. Un nouvel établissement doit se reconnaître sans lire son nom ; une recoloration seule ne suffit pas. Voir [DIRECTION-TROIS-AFFECTATIONS.md](DIRECTION-TROIS-AFFECTATIONS.md) pour la proposition artistique et les critères de variété.

La difficulté vient des situations autant que des chiffres. Régler distance et délai par mission à partir du parcours mesuré. Garder l'échec qui passe à l'affectation suivante, la continuité des dégâts, le cours et l'ellipse. Mesurer le coût des nouveaux assets à chaque lieu, avec une préparation des textures adaptée aux appareils retenus.

**Critère :** les trois affectations changent effectivement de lieu ; le joueur distingue leur géographie et peut expliquer comment il a dû adapter sa manière de combattre. Les deux nouveaux lieux passent chacun par un parcours complet avant intégration à la journée.

## Lot 3 — Terminer ce que le joueur voit et entend

**Audio :** écoute comparative à 40/110/260 km/h, dépassement/frôlement/choc, DATA/proximité, contact/garde/blessure, parole et classe. Juger l'audibilité en présence du moteur et la fatigue après une journée. Ajuster timbres, enveloppes et gains à partir de cette écoute. Garder les réglages séparés ; une radio enregistrée localement serait une option artistique si la voix système gêne, pas un préalable imposé.

**Combats :** revoir à vitesse réelle anticipation, pose active, contact, onomatopée, recul et récupération. Privilégier corps et timing ; garder les visages et la route d'évitement dégagés. Ajuster une rencontre qui ne montre pas sa personnalité avant d'augmenter sa difficulté.

**Route et décors :** travailler la composition de quelques tronçons, les intervalles entre façades, les raccords route/caniveau et les fenêtres de visibilité des repères. Examiner château d'eau, transformateur et ponts en déplacement. Produire de nouveaux assets seulement si un manque précis subsiste.

**UI/tactile :** conserver la hiérarchie du CADRE. Ajuster les cibles et rappels sur l'appareil retenu ; ne pas rajouter de croix ni de boutons d'action flottants. Vérifier lisibilité des bulles et signes directionnels pendant l'action.

**Sens :** demander à un nouveau joueur ce que le jeu raconte et ce que le prof cherche à préserver. Si cela se perd dans la succession d'agressions, renforcer une trace de soin ou un bref moment de travail humain. Nicolas garde l'arbitrage du ton et des textes ; pas de déplacement silencieux de l'intention satirique.

**Critère :** chaque retouche répond à une observation et a été revue en contexte, plutôt qu'à l'envie générale d'ajouter des détails.

## Lot 4 — Figer et éprouver la slice

- Deux journées complètes techniques, clavier et contrôle direct, avec réussite et carence ; inclure dépannage, pause, nouvelle journée et un retour arrière dans le collège. Les automatismes emploient les intentions accessibles au joueur au lieu de téléporter le personnage pour cette validation de parcours.
- Tests existants, build et contrôle du HTML autonome ; identité de la référence et du jouable courant ; ouverture locale et hors connexion sur les appareils retenus.
- Trois découvertes extérieures courtes si disponibles. Ne pas guider les joueurs pendant leur premier parcours. Relever où ils hésitent, pourquoi ils pensent avoir échoué et ce qu'ils comprennent de la satire.
- Corriger les incidents importants et figer une version avec paquet testeurs, aide courte, résultats et réserves connues. L'atelier reste disponible séparément.

**Critère :** pas de défaut important connu sur le parcours retenu ; règles comprises sans accompagnement ; confort et performance observés sur les cibles. Une suite verte seule ne suffit pas à déclarer ce lot fini.

## Répartition pour limiter le temps demandé à Nicolas

Le développement peut prendre en autonomie les corrections d'interaction, diagnostics, scénarios, packaging, composition à partir des assets approuvés et régressions. Les contributions les plus utiles de Nicolas sont une écoute courte, un parcours sur son téléphone et l'arbitrage des variantes de missions/textes. Ces interventions peuvent être regroupées à la sortie d'un lot.

Le premier livrable suivant doit donc être **une version qui corrige le passage direct et permet une première affectation de référence**, accompagnée de quelques points précis à observer. Le plan historique reste conservé comme trace des travaux précédents.
