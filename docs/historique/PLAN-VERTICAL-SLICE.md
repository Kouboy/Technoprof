# TECHNOPROF — Plan global après l'audit 0.42

**Plan actuel au 2 octobre 2026 :** voir [PLAN-APRES-REVIEW-0.54.md](PLAN-APRES-REVIEW-0.54.md), fondé sur [AUDIT-0.54.md](AUDIT-0.54.md). Le document ci-dessous conserve l'historique des lots précédents.

**Route enrichie en 0.52 :** deux familles de ponts, franchissement continu, six props et quartiers déterminés par leur position dans le monde. Radio Educ France harmonisée. Voir `GAMEPLAY-0.52.md`.

**Passe audio 0.53 implémentée :** banque de matières, moteur/régimes, air/roulement, alertes prioritaires, gestes administratifs, classe et ambiances par lieu. Réglage séparé des ambiances ; sources coupées à la pause et aux transitions. Voir `GAMEPLAY-0.53.md`.

**Prochaine validation : écoute en jeu.** Comparer 40/110/260 km/h, dépassement distant/frôlement/choc, livre/garde/coup reçu, tampon/balayage et ellipse de classe. Juger le naturel et la fatigue auditive ; ajuster les timbres et gains à partir de cette écoute. Les contrôles de graphe et les métriques PCM ne remplacent pas cette appréciation.

**CADRE harmonisé en 0.51 :** petite typo bitmap pour les libellés, chiffres du délai affinés, instruments et matières retravaillés. Mêmes informations et seuils, vus en route et au collège à la taille native. Voir `GAMEPLAY-0.51.md`.

**Retouches de lisibilité en 0.50 :** pieds dans la bande de sol, ombres et FX raccordés, bulles dégagées des visages et menace de l'élève reformulée. Contrôles 0.49 conservés. Voir `GAMEPLAY-0.50.md`.

**Contrôles complétés en 0.49 :** ZQSD/F et interactions directes communes souris/tactile, menus mobiles et copie lisible des dialogues sous le jeu sur petit écran. Les essais automatisés et la composition en navigateur passent ; la session sur téléphone et le ressenti des gestes restent à faire. Voir `GAMEPLAY-0.49.md`. Prochaine validation : journée découverte au clavier, puis même parcours avec le contrôle direct, en notant les gestes ambigus et les accès difficiles à viser.

**État actuel : retours de test intégrés en 0.48.** Dialogues à progression manuelle, immobilisation et chrono suspendu, balayage prolongé, défilement routier renforcé et Collège C. Hanouna. Voir `GAMEPLAY-0.48.md`. La validation humaine de la nouvelle sensation de vitesse reste à faire. **L'expérience autonome du lot 5 a été préparée en 0.47.** Accueil et pause, commandes, réglages séparés, aides contextuelles, radio sous-titrée avec repli local, bilan par cause et paquet testeurs. Les trois services déjà réglés sont conservés. Voir `GAMEPLAY-0.47.md`. La suite est la découverte extérieure (lot 6) ; le ressenti audio, la fluidité et la compréhension sans accompagnement ne sont pas déclarés validés.

### Historique de livraison

**Avancement au 24 septembre 2026 : lots 0 et 1 livrés dans la 0.43.** Référence 0.42 conservée, atelier animé, journal local, profils indépendants du rendu, interruptions et causes d'échec corrigées. Voir `GAMEPLAY-0.43.md` pour les règles et les vérifications, y compris la limite du contrôle de fluidité en navigateur d'arrière-plan. Le lot 2 reste le prochain chantier.

**Lot 2 intégré en 0.44 :** emprises routières, accotements, projection, séquence de trafic et feedbacks de conduite. Tests et résultats dans GAMEPLAY-0.44.md ; validation humaine du ressenti encore nécessaire. Prochain chantier : lot 3.

## Objectif proposé

Une journée courte de trois affectations, jouable et compréhensible sans l'auteur à côté, montrant le niveau visé en conduite, navigation, combat, satire, direction artistique et son. La première affectation doit être le morceau de référence ; les suivantes doivent en montrer les possibilités, pas seulement augmenter le nombre de voitures.

Conserver : rythme à deux temps, contrôle simple, chrono partagé, cruising et radio, arrivée hors chrono, livre, vieille voiture, CADRE, école française décrépite, cours puis ellipse, échec suivi d'une nouvelle affectation.

Ne pas élargir maintenant : inventaire, compétences, combos complexes, génération procédurale de collèges, open world, nouveau moteur. Aucun de ces systèmes ne résout les problèmes prioritaires de la 0.42.

## Ordre des chantiers

| Lot | Livrable | Dépendance | Ampleur relative | Critère de sortie |
|---|---|---|---|---|
| 0 | Référence jouable et outils d'observation fiables | Aucun | Petite | Scénarios du vrai jeu reproductibles, avec seed et collisions affichables |
| 1 | Règles et transitions cohérentes | 0 | Moyenne | Plus de superposition à l'introduction ; profils de combat identiques entre tests et livraison ; échecs expliqués |
| 2 | Conduite avec décisions réelles | 1 | Moyenne | Aucune bande sûre permanente ; freinage/placement utiles ; erreurs récupérables |
| 3 | Combat et mouvement convaincants | 1 | Moyenne à forte | Chaque contact se lit par les corps et les sons avant le texte ; contrôles prévisibles |
| 4 | Cohérence visuelle et navigation | 2 et 3 pour les gabarits | Forte mais ciblée | Un même langage visuel de la route au cours ; danger et passages compris au premier essai |
| 5 | Accueil, audio et journée représentative | 2–4 | Moyenne | Expérience autonome, trois variations cohérentes, options minimales et bilan utile |
| 6 | Épreuve extérieure et stabilisation | 5 | Selon retours | Pas de défaut important ouvert sur le parcours retenu ; validation humaine et performance |

Les ampleurs comparent les lots, sans promettre un calendrier. Les corrections de règles précèdent le réglage final du chrono et la fabrication des poses définitives.

## Lot 0 — Établir une référence vérifiable

- Conserver la 0.42 comme référence, avec captures et parcours connus.
- Faire exécuter les tests avec le profil réellement livré : aucun choix de portée fondé sur la présence d'une texture.
- Ajouter un atelier animé accessible séparément : route déterministe, chaque adversaire, trou, transition, réussite et trois causes d'échec.
- Afficher à la demande état, temps d'anticipation, récupération, pieds, volumes de collision et point de contact. Ralenti et pas à pas réservés à l'atelier.
- Mesurer temps par phase, chocs, chutes et cause de perte d'affectation. Journal local suffisant ; pas besoin d'un service de télémétrie.

**Validation :** Nicolas et le développeur peuvent reproduire la même situation en quelques secondes. Une vue de FX est produite par un vrai événement de jeu, pas seulement par le réglage manuel d'un compteur visuel.

## Lot 1 — Corriger les règles avant le polish

- Séparer `Présentation`, `Approche`, `Préparation`, `Frappe`, `Récupération`, `Touché`, `Vaincu` pour les ennemis ; garder la collision corporelle active dans tous les états pertinents.
- Régler explicitement le comportement lorsqu'on attaque ou quitte un interlocuteur pendant sa première réplique.
- Harmoniser priorité du coup, saut, blessure, chute et interaction ; éviter les attaques fantômes et les changements de salle ambigus.
- Enregistrer une cause de fin : retard, épuisement ou panne. Faire correspondre scène, HUD et invite de continuation.
- Extraire les paramètres de mouvement/combat utiles et corriger la perte de temps sous faible framerate.

**Validation :** G01, G03, G05 et T01 de l'audit ont une reproduction puis une régression ; mêmes règles avec et sans rendu ; aucun chevauchement prolongé ou signal « combat actif » après une fin.

## Lot 2 — Composer la conduite

- Aligner route visible, largeur des véhicules et emprise de collision ; traiter progressivement l'accotement.
- Construire un premier trajet avec alternance : respiration, véhicule lent, virage lisible, dépassement, espace de récupération, approche du collège.
- Donner assez d'avance visuelle pour décider. Un obstacle ne doit pas devenir obligatoire avant de pouvoir être évité.
- Conserver accélération et inertie ; ajuster leur courbe par essais courts à 40, 110 et 260 km/h. Le décor doit accélérer de manière convaincante tout en conservant la distance kilométrique cohérente.
- Réviser sons de dépassement/frôlement/choc, traces et dégâts ensemble. Le choc doit montrer la direction et la perte de contrôle, puis rendre la main rapidement.

**Validation :** les stratégies de bord permanent ne suppriment plus le défi ; deux trajectoires raisonnables restent possibles ; un premier choc permet encore de comprendre et de récupérer. Pas de densification générale pour masquer un défaut de règle.

## Lot 3 — Donner du poids au livre et aux corps

- Pour chaque attaque, écrire : input, anticipation, fenêtre active, résultat, réaction, récupération.
- Attacher volumes et FX à la pose utilisée, avec un ancrage distinct par orientation et gabarit.
- Créer une réaction courte du professeur blessé et des défaites lisibles pour tous les adversaires.
- Différencier coup dans le vide, garde, touche et blessure par mouvement et son ; réserver l'onomatopée à la confirmation, loin des visages et des signaux de menace.
- Tester un petit buffer de saut/frappe si les essais montrent des commandes perdues. Point de départ possible : 80–120 ms, à valider ; pas une nouvelle règle imposée d'emblée.
- Régler hit-stop, recul, shake et audio comme un ensemble. Prévoir un shake réduit et éviter les flashs plein écran.

**Validation :** sans lire un mot, on distingue préparation, coup porté, réussite/garde et récupération. Une pression tardive ne produit pas une action inexplicable. Un adversaire présente un apprentissage simple, reproductible, sans exiger de marteler X.

## Lot 4 — Un contrat visuel commun

Créer une fiche courte avec captures à taille réelle :

| Élément | Règle à fixer |
|---|---|
| Géométrie | Ligne des pieds, hauteur des portes, échelle par type de tableau, seuils et sorties |
| Personnages | Silhouette, points d'appui, mains/livre/tampon, ombres de contact, poses droite/gauche |
| Décor | Matières, zones calmes, contraste autour des interactions, traces de soin humain |
| Route | Même degré de stylisation que les véhicules ; raccords entre sols, façades et mobilier |
| Signalétique | Texte fixe sur support physique ; touche contextuelle distincte ; information urgente dans le CADRE |
| Typographie | Famille principale cohérente, deux ou trois tailles utiles, choix net à plusieurs tailles d'affichage |
| Journée | Matin/midi/soir reconnaissables avec une lisibilité des acteurs constante |

- Régler d'abord hall, boss et une portion routière comme références finales.
- Décliner ce contrat sur les autres pièces ; conserver les assets qui le respectent.
- Remplacer quelques répétitions très visibles, améliorer les ombres et raccords, puis seulement ajouter des détails iconiques.
- Pour les trous, régler ensemble dessin, pieds, collision et occlusion de chute.
- Donner un repère mémorisable à chaque pièce et un changement de tableau qui conserve l'orientation.

**Validation :** route et collège semblent appartenir au même jeu ; un accès ouvert se lit avant sa légende ; le danger se trouve où le joueur l'attend ; l'heure de la journée reste visible avec le HUD masqué.

## Lot 5 — Transformer la démonstration en expérience autonome

- Écran titre et pause cohérents avec le CADRE : jouer, contrôles et réglages essentiels. Déplacer les raccourcis de développeur dans l'atelier.
- Introduire les commandes au moment utile, avec des rappels courts ; éviter un tutoriel textuel prolongé.
- Voix radio locale ou repli maîtrisé, sous-titres, volumes voix/effets ; revue à l'écoute des cinq ou six sons décisifs.
- Définir trois affectations à partir des mêmes assets, avec une différence de trajet ou d'obstacle intelligible. Afficher une destination correcte pour chacune si elle change.
- Conserver le cours et son ellipse comme récompense. Donner au bilan les causes utiles sans transformer le jeu en feuille de statistiques.
- Harmoniser les textes : voiture de service/personnelle, nom de la radio, mauvaise foi de l'inspection, conséquence réelle de la carence.

**Validation :** une personne extérieure lance et termine une journée sans les liens de test. Elle explique la mission, le partage du temps et la cause de sa réussite ou de son échec. Le propos « assurer le service malgré les empêchements » reste perceptible.

## Lot 6 — Épreuve extérieure

Faire d'abord tester la première affectation à 3–5 personnes qui ne connaissent pas le projet, puis la journée entière. Échantillon qualitatif : il sert à détecter les incompréhensions, pas à établir des statistiques générales.

Observer sans expliquer, puis demander :

1. Que devais-tu faire ? Quand le compte à rebours a-t-il commencé ?
2. Comment as-tu choisi ton chemin ? Quels éléments semblaient interactifs ?
3. Pourquoi as-tu pris ce coup ou chuté ? Qu'aurais-tu pu faire ?
4. À quoi as-tu reconnu une ouverture chez le boss ?
5. Qu'est-ce qui changeait dans la journée ? Quel était, pour toi, le propos du jeu ?

Mesurer également démarrage, frame times et mémoire sur une machine convenue. Fixer alors les budgets de performance ; ne pas annoncer aujourd'hui une fluidité ou un temps de chargement non mesurés.

**Portes de validation proposées :**

- Aucun crash ni état bloqué sur le parcours complet et ses retours d'échec.
- Aucun exploit important identifié permettant d'annuler une phase entière.
- Les testeurs comprennent les principales causes de dégâts et les accès sans aide orale ; chaque confusion récurrente produit une correction.
- Les contrôles et la lisibilité restent cohérents avec le son coupé et le shake réduit.
- Le framerate est stable sur la machine cible ; le mode dégradé ne change pas les règles.
- Les choix artistiques sont jugés sur des séquences jouées, pas sur les seules planches de génération.

## Arbitrages à prendre au bon moment

**Avant le lot 1 :** si le joueur frappe quelqu'un en train de parler, interrompt-il sa présentation ? Recommandation : réaction immédiate et fin du délai protecteur d'agression, tout en gardant l'attente complète pour un joueur qui écoute.

**Avant le réglage final de la journée :** quelle pression vise-t-on ? Recommandation : première mission accueillante, pression croissante et risque compréhensible ; préserver la possibilité de rater une affectation sans perdre immédiatement la journée.

**Avant de multiplier les lieux :** quels éléments varient dans les trois affectations et lesquels restent des repères ? Recommandation : varier une contrainte marquante à la fois pour que le joueur puisse apprendre.

Ces arbitrages n'empêchent pas de commencer l'instrumentation, les corrections de collision, les causes d'échec et la séparation des règles et du rendu.

## Méthode d'itération

Chaque lot produit un jouable local, une courte liste de situations à essayer et un bilan séparant preuves techniques et appréciation perceptive. Faire valider une séquence représentative avant de décliner de nouveaux assets. Conserver les versions précédentes pour comparer. Revenir aux réglages lorsqu'un nouveau visuel modifie la perception des distances ou des timings.

Priorité immédiate recommandée : **lots 0 et 1**, puis **conduite et combat**, avant la prochaine grande passe graphique.


**Correction 0.54 : transitions à pied et parole.** Rebond dû au maintien bas corrigé ; sorties latérales avec intention de déplacement ; fondu court, délai suspendu, commandes souris consommées. Petit grain de voix pendant le dévoilement naturel des bulles. Vérifier ce rythme et le confort d'écoute en session humaine ; château d'eau/armoire électrique restent à mieux mettre en valeur. Voir GAMEPLAY-0.54.md.
