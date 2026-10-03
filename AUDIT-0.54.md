# TECHNOPROF — Évaluation globale 0.54

**Actualisation 0.60 disponible :** [audit actuel](AUDIT-0.60.md) et [ordre de travail actualisé](PLAN-APRES-REVIEW-0.60.md). Ce document conserve les observations et le contexte historiques de la 0.54.

Revue du 2 octobre 2026, selon la grille **Game Dev Reviewer** et les responsabilités de `GAMEPLAY_LEAD.md`. Sources et livraison locale examinées ; aucune modification du jeu pendant cette revue.

**Orientation précisée après la revue :** Nicolas souhaite trois lieux distincts, des assets communs et spécifiques, des ennemis communs et nouveaux, et trois boss différents. Le [plan opérationnel](PLAN-APRES-REVIEW-0.54.md) et la [proposition de direction](DIRECTION-TROIS-AFFECTATIONS.md) intègrent cette demande. Les observations ci-dessous restent celles du prototype 0.54.

**Suivi : R01 corrigé en 0.55 (lot 0).** Les passages et indicateurs partagent leurs données ; toucher une flèche latérale commande le passage et consomme le déplacement à l'arrivée. Tests et observations dans [GAMEPLAY-0.55.md](GAMEPLAY-0.55.md). Les constats ci-dessous conservent leur valeur de reproduction sur la 0.54.

## Verdict

**CORRECTIONS NÉCESSAIRES avant de considérer la journée comme une vertical slice autonome validée.**

La boucle, l'identité et les principales règles tiennent ensemble. Le stade suivant consiste à rendre la journée convaincante pour quelqu'un qui découvre le jeu : interactions fiables, apprentissage observable, variations utiles et confort vérifié. Il n'y a pas de raison établie de changer de moteur ou de recommencer la direction artistique.

Un défaut de passage en contrôle direct est reproductible. La répétition des affectations est une limite de conception identifiable. Le ressenti audio, la difficulté pour un débutant et la performance sur téléphone restent des validations ouvertes, et non des défauts déclarés sur la seule lecture du code. Aucun BLOCKER établi dans le périmètre examiné.

## Périmètre et preuves

- **Exécuté :** les 16 scripts de `npm test`, puis `node work/check-local.cjs` ; tous passent. Diagnostic indépendant `node work/review-054.cjs` : sept passages latéraux, combats ordinaires, neuf essais de frappe répétée contre le boss, tailles de livraison.
- **Observé dans le navigateur :** accueil, commandes, réglages, présentation de l'inspectrice, véritable contact du livre au pas à pas, route, lancement d'une journée et pause. Composition observée à 1280 × 720, puis 844 × 390 pour le paysage sur petit écran.
- **Lu :** états et transitions, contrôles, conduite, navigation, combats, progression, CADRE, audio, disposition des décors, chargement et tests existants. Comparaison avec les problèmes de l'audit 0.42.
- **Limites :** les observations en navigateur portent sur les sources servies par Vite. L'export autonome a été contrôlé par script, sans nouvelle session complète dans le gros HTML. Le diagnostic simule les règles sans renderer ni sortie audio. Le petit viewport ne reproduit ni les doigts ni le GPU d'un téléphone. Pas de jugement de timbre à l'écoute, pas de journée humaine complète ni de découverte par un joueur extérieur pendant cette revue.

Le HTML courant et la référence figée 0.54 ont le même SHA-256 : `5F348A49B65CE73161F8E34A1D4454D51C7E3A2CAF6924A608086E0CD6335256`.

Résultats : [diagnostic](work/review-054.cjs), [mesures](work/review-054-results.json), [suite existante](work/review-054-tests.txt). Le diagnostic consigne volontairement le défaut présent ; il ne faut pas le confondre avec un test de régression qui approuverait ce comportement.

## Lecture globale

| Axe | Ce qui fonctionne déjà | Prochaine question à résoudre |
|---|---|---|
| Concept et rythme | Cruising, radio, injonction, urgence, travail puis ellipse constituent une boucle identifiable | Chaque nouveau service apporte-t-il autre chose qu'une difficulté accrue ? |
| Conduite | Accélération, freinage, inertie, accotements, emprises et trafic continu ont des règles explicites | Un débutant comprend-il quand freiner et anticiper, sans correction verbale ? |
| Combat et gamefeel | Contact, recul, hit stop, récupération, garde et boss sont articulés ; le coup observé porte visuellement | À vitesse réelle, distingue-t-on assez vite menace, contact et reprise de contrôle ? |
| Navigation | Détour et raccourci ont des lieux et des dangers ; les transitions ont désormais un fondu et une protection contre les inputs maintenus | Les passages affichés sont-ils empruntables avec le geste enseigné ? Que reste-t-il à chercher après la première mission ? |
| Visuels | Professeur, inspectrice, livre, voiture et collège portent la DA ; détails d'usure et réparation racontent le lieu | Les répétitions routières et quelques éléments procéduraux attirent-ils trop l'œil ? |
| UI/UX | CADRE constant, informations hiérarchisées, accueil, pause et bilan donnent un parcours autonome | Les petites flèches et textes restent-ils pratiques sur le téléphone réel ? |
| Son | Événements contextualisés, réglages séparés, radio sous-titrée, ambiances et matière de classe | Les alertes restent-elles audibles et les textures agréables pendant plusieurs minutes ? |
| Technique | Paramètres extraits, simulation découpée, scénarios reproductibles et livraison locale | Quel est le coût réel des assets embarqués et des copies de textures au lancement ? |

## Problèmes trouvés

### R01 — [IMPORTANT] La flèche latérale ne commande pas réellement le passage en souris/tactile

**Observation établie.** Toucher le centre de la flèche à droite fait marcher le professeur jusqu'à environ x=296,1, puis le laisse dans la même pièce. À gauche, il s'arrête à environ x=15,8. Toucher le sol plus loin, à x=310 ou x=8, permet bien de sortir. Reproduit sur cinq sorties à droite et deux à gauche, avec les ennemis retirés du diagnostic pour isoler l'interaction.

**Pourquoi c'est un problème.** Le menu enseigne « touchez un passage pour l'emprunter ». Le signal visible et l'action répondent donc à deux règles différentes. Un joueur peut croire que le passage est fermé ou chercher une touche inexistante sur téléphone ; le chrono continue pendant cette hésitation.

**Preuve/code.** `src/passage-hints.ts:31` place les flèches à x=298/15. `src/direct-input.ts:167` ne reconnaît comme passages que les sorties explicites retournées par `pointerExits()` ; sinon le toucher devient une destination de marche. `src/direct-input.ts:279` arrête la marche à deux unités de cette destination. `src/main.ts:2151` demande x>298 ou x<12, avec une direction active, pour les sorties latérales. `src/main.ts:2205` n'expose que les sorties verticales et la porte de classe au contrôle direct.

**Test pour confirmer en jeu.** Rejoindre une flèche latérale, toucher son centre puis le sol à l'extrême bord. Comparer les deux résultats dans la cour, le hall et la passerelle. Vérifier aussi la flèche de gauche du hall.

**Correction minimale.** Décrire les passages latéraux comme des interactions, partagées par le rendu, le clavier et le contrôle direct. Un toucher de flèche doit lancer l'intention de passage, marcher jusqu'au seuil et la consommer au changement de tableau. Conserver les accès bouchés et la protection contre les traversées involontaires. Ajouter des tests visant le centre de chaque indicateur visible, et non seulement des coordonnées déjà au-delà du seuil.

### R02 — [IMPORTANT] La journée varie surtout sa pression, peu ses décisions

**Observation établie, limite de conception.** Les trois services utilisent le même collège, la même salle, les mêmes sorties et les mêmes emplacements d'adversaires ordinaires. Le trafic passe de 5 à 8 puis 11 véhicules actifs ; le délai de 240 à 225 puis 210 secondes ; le boss de 6 à 7 puis 8 PV. Le boss change aussi de variante féminine à masculine. La voiture conserve ses dégâts, avec un dépannage si nécessaire.

**Pourquoi c'est un problème.** La première recherche de 42C peut être intéressante. Les suivantes reposent davantage sur la mémorisation, alors que l'orientation est une intention centrale du projet. Augmenter la pression ne produit pas automatiquement une nouvelle situation. Le retour au même établissement peut être pertinent narrativement ; c'est le manque d'évolution de ce qui s'y passe qui limite la démonstration.

**Preuve/code.** Topologie fixe dans `src/world.ts:51`, adversaires dans `src/world.ts:138`, réinitialisation dans `src/main.ts:991`, difficulté dans `src/main.ts:1037`. Les textes `DAY_BRIEFS`, `src/player-experience.ts:10`, annoncent essentiellement trafic et délai.

**Test pour confirmer en jeu.** Faire la journée entière puis noter, pour chaque service, les décisions effectivement différentes : itinéraire, engagement ou évitement, freinage, risque choisi. Distinguer une surprise compréhensible d'un simple changement de chiffres.

**Direction retenue après retour de Nicolas.** Trois configurations écrites à la main, dans trois établissements distincts : référence du matin ; nouveau lieu demandant de lire une autre géographie ; dernière affectation mobilisant les risques et gestes déjà appris. Réutiliser une bibliothèque commune, créer les compositions et personnages propres aux nouveaux lieux, et différencier les trois boss. Les fermetures doivent avoir une justification physique, un indice avant engagement et une autre route praticable. Garder le retour au travail et l'ellipse. Les types de lieux et attaques proposés sont détaillés dans le plan et restent à affiner.

### R03 — [À SURVEILLER] Deux adversaires ordinaires offrent une solution très proche à courte portée

**Observation établie dans un cas borné.** Depuis x=170, après la présentation, sans mouvement et avec une frappe toutes les 0,5 seconde, l'élève et le vigile sont vaincus en 0,70 seconde, sans perte de santé. Le parent ne l'est pas dans les dix secondes du même essai. Contre le boss, les neuf essais de cette stratégie échouent : le professeur tombe avant de vaincre l'adversaire.

**Pourquoi c'est à surveiller.** Les silhouettes et les attaques distinguent les personnages ; certaines rencontres peuvent néanmoins se résoudre avant que le joueur voie cette différence. Ce n'est pas une preuve que tout le combat est trivial : le placement initial est avantageux et les ennemis ordinaires peuvent volontairement être brefs.

**Preuve/code.** Profils et timings dans `src/gameplay.ts:30`, `:98` et `:107` ; PV et placement dans `src/world.ts:138`. Résultats détaillés dans `work/review-054-results.json`.

**Test pour confirmer en jeu.** Aborder chacun depuis sa vraie entrée, au clavier puis au toucher. Demander après la rencontre : « Qu'est-ce qui rendait cet adversaire différent ? » Observer aussi la possibilité de passer sans combattre.

**Correction minimale si la distinction se perd.** Retoucher placement, déclenchement ou récupération d'une seule rencontre ; mettre en évidence sa menace avant le premier contact. Éviter de compenser par une hausse générale des PV ou d'imposer de nouveaux combos.

### R04 — [À SURVEILLER] La portabilité est préparée, son coût n'est pas encore mesuré sur appareil réel

**Observation établie.** Le HTML autonome fait 69 951 003 octets, soit environ 66,7 Mio ; le paquet testeurs compressé environ 48,7 Mio. Les décors et planches sont préchargés. Certaines planches sont ensuite copiées en canvas pour traiter la transparence. À 844 × 390, le jeu, les boutons et les rappels tiennent dans la page, mais la surface de scène et les petits détails se réduisent sensiblement.

**Pourquoi c'est à surveiller.** La taille du fichier ne prouve pas une mauvaise performance. Elle justifie de mesurer lancement, mémoire et frame time avant de multiplier les assets. Le coût tactile dépend aussi de la taille de la scène et des doigts, que le viewport de bureau ne simule pas.

**Preuve/code.** `src/main.ts:197` précharge les planches ; `src/road-art.ts:112` traite les pixels et crée une texture canvas. L'interruption supérieure à une seconde devient une pause explicite dans `src/main.ts:1455`. Une telle pause a été observée au lancement de l'atelier dans le navigateur en arrière-plan ; ce contexte ne permet pas d'attribuer le ralentissement au jeu ni de conclure sur sa fluidité au premier plan. Taille de livraison dans le diagnostic.

**Test pour confirmer.** Ouvrir le vrai HTML hors connexion, sur le PC cible puis un téléphone retenu. Mesurer chargement à froid, premières interactions, pics aux changements de lieu et fluidité d'une mission. Tester perte de focus, rotation et reprise sans geste resté actif.

**Correction minimale selon mesure.** Réduire les deux ou trois planches réellement coûteuses, découper les zones inutilisées et préparer leur transparence avant livraison. Ajuster ponctuellement une cible tactile ou la place des rappels. Fixer des objectifs de confort et de performance pour les appareils retenus ; ne pas réécrire le renderer sur une hypothèse.

### R05 — [À SURVEILLER] Les contrôles techniques ne permettent pas encore de valider le ressenti global

**Observation établie sur la validation.** Les tests couvrent désormais beaucoup de règles : cadences, introductions, transitions, collisions, causes d'échec, menus, sons déclenchés et volumes. Certains parcours de test placent directement le professeur au seuil d'une sortie ou provoquent un résultat de mission. Ils ne constituent pas une découverte complète et comparable au clavier et au tactile.

**Pourquoi c'est à surveiller.** Une journée peut être correcte par morceaux mais fatigante, confuse ou trop facile à traverser. Une banque audio sans erreur peut encore masquer les alertes ou produire une fatigue auditive. La force du coup dans une capture ne garantit pas sa lecture à vitesse réelle. On doit éviter de relancer un chantier de polish sans identifier le problème perceptif.

**Preuve/code.** `work/check.cjs` manipule certaines positions pour vérifier les liens ; `work/check-047.cjs:4` vérifie une journée à trois résultats en provoquant les fins. Les suites 0.53/0.54 valident le routage et la cadence sonore. Le contact réel observé dans le navigateur montre un recul et un FX raccordés, mais ce n'est qu'une situation.

**Test pour confirmer.** Deux journées continues, une au clavier et une en contrôle direct, puis une découverte extérieure sans explication. Écouter moteur, route, dépassement, frôlement, choc, parole, DATA, urgence et classe aux niveaux réellement utilisés. Demander au joueur pourquoi il a échoué et ce qu'il ferait autrement.

**Correction minimale.** Consigner confusion et timings dans une courte grille, reproduire les incidents dans l'atelier et régler un seul système à la fois. Ajouter une traversée automatisée par intentions réelles pour les cas que la session découvre ; conserver une validation humaine séparée pour le son, la vitesse et la lisibilité.

### R06 — [POLISH] La répétition routière reste plus visible que certains nouveaux repères

**Observation visuelle limitée.** Dans la vue routière examinée, la répétition d'une même façade et le contraste entre route procédurale et façades détaillées restent perceptibles. Château d'eau et transformateur ont bien une règle de placement dans le monde, mais leur présence en code ne prouve pas qu'on les remarque pendant une conduite normale.

**Pourquoi c'est un problème secondaire.** La route peut sembler assemblée par répétition alors que le collège possède des détails plus spécifiques. Fabriquer davantage de sprites ne résoudra pas un repère trop éloigné, masqué ou trop bref à l'écran.

**Preuve/code.** `src/road-art.ts:52` place les objets ; `:83` place le transformateur et `:84` le château d'eau. Captures [route](work/review-054-route.png) et [contact](work/review-054-contact.png).

**Test pour confirmer.** Rejouer un tronçon avec les repères attendus et observer leur taille, occultation et durée visibles à 110 puis 260 km/h. Comparer la même zone au passage suivant.

**Correction minimale.** Composer quelques groupes de bâtiments, ménager des vides et placer un repère dans une fenêtre de visibilité utile. Ajuster les raccords de matériaux et les répétitions avant de commander une nouvelle série d'assets.

## Ce qui paraît sain

- **Contrat du chrono :** une même réserve couvre route et collège ; dialogues, cinématique d'arrivée et transitions forcées sont suspendus. Le CADRE indique cette suspension. Les protections contre le maintien d'une touche et les retours d'escalier sont couvertes entre 15 et 120 fps.
- **Dialogue :** le professeur est immobilisé ; action révèle puis avance ; aucun besoin de courir derrière une bulle. Le grain de parole accompagne la révélation naturelle sans rafale à l'affichage complet.
- **Conduite :** le trafic existe avant la notification, la distance dérive des km/h, l'emprise du véhicule intervient sur l'accotement, le freinage et l'inertie sont réglables. La hausse du défilement visuel est explicitement séparée de la distance de mission.
- **Combat :** profils indépendants des textures, états et ancrages de contact explicites. Le coup réel observé raccorde pose, recul et éclat. Le boss n'est pas vaincu par les essais de frappe statique ; le parent a une charge et une récupération distinctes.
- **Présentation :** l'usure, la sacoche, le manuel, le tampon, la porte et l'inspectrice ont une identité. Le CADRE a retrouvé une hiérarchie ; l'accueil ordinaire masque l'atelier et les raccourcis de développement.
- **Accessibilité et autonomie :** ZQSD, flèches, souris/tactile, pause, sous-titres radio, volumes séparés, secousses réduites et bilan par cause sont présents. C'est une base utile à éprouver, pas une promesse universelle de compatibilité.
- **Intention satirique :** injonction administrative, dégâts persistants, entretien insuffisant et maintien du travail se répondent. La classe reste un retour au métier. En test extérieur, vérifier qui ou quoi le joueur pense que le jeu vise : cela donnera un retour plus utile qu'ajouter des slogans. Si nécessaire, renforcer une trace de soin ou un bref échange humain sans introduire un nouveau minijeu de cours.
- **Architecture d'itération :** tuning, profils, contrôles, audio et présentation ont déjà leurs modules. Le gros `main.ts` mérite des extractions lorsque le nouveau design en a besoin, pas une réorganisation générale comme préalable obligatoire.

## Tests à effectuer en jeu

| Essai | Question et critère |
|---|---|
| Première mission, nouveau joueur | Comprend-il la notification et le chrono partagé ? Trouve-t-il un passage sans explication orale ? |
| Toutes les sorties, souris puis doigt | Toucher l'indicateur visible suffit ; aucun besoin de viser au-delà du décor. Retour et accès fermé restent cohérents. |
| Route à 40/110/260 km/h | Accélération, virage et freinage se distinguent ; menace suffisamment anticipable ; dépassement/frôlement/choc ne se confondent pas. |
| Chaque adversaire, arrivée réelle | Réplique lisible, corps séparés, attaque anticipable ; contact, garde, récupération et défaite reconnaissables. |
| Détour et raccourci | Choix compris avant le coût ; trous vus au sol ; un échec apprend une règle récupérable. |
| Journée entière avec succès et carence | Retour au cruising, dépannage, santé, dégâts, bilan et nouvelle journée sans état résiduel. |
| Téléphone retenu, HTML hors ligne | Accès tactiles visables ; textes essentiels lisibles ; rotation/pause/reprise fiables ; absence de ralentissement gênant mesuré. |
| Écoute continue puis nouvelle découverte | Alertes audibles, voix supportable, sens politique perçu sans commentaire de l'auteur. |

## Plan pour la suite

Le plan opérationnel est dans [PLAN-APRES-REVIEW-0.54.md](PLAN-APRES-REVIEW-0.54.md). Priorité : corriger le passage direct, éprouver la première affectation et le coût mobile, composer les variations, puis terminer un polish ciblé et figer une slice testée.
