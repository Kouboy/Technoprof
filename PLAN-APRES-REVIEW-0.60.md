# TECHNOPROF — Plan après l'audit 0.60

Référence : [AUDIT-0.60.md](AUDIT-0.60.md). Ce plan actualise l'ordre de travail du [plan 0.54](PLAN-APRES-REVIEW-0.54.md). Il prépare des interventions ; elles ne sont pas implémentées pendant la revue.

Conserver la demande de progression forte : minima 9 / 18 / 36 tableaux, 3 / 6 / 12 adversaires et trafic nettement croissant. Le prochain chantier doit améliorer ce que le joueur rencontre dans cette charge, sans l'abaisser silencieusement ni rajouter de contenu par défaut.

## Lot A — Fiabiliser les confirmations et l'identité

1. Séparer son routier anticipé, passage confirmé et choc. Compter après sortie de la zone de contact sans hit ; un véhicule ne peut produire qu'une confirmation. Ajouter au test le braquage tardif qui déclenche actuellement pass puis crash.
2. Refaire les comptages sur références, deux branches et plusieurs seeds. La capacité32 n'est pas une mesure d'exposition ; les coordonnées connues par un bot ne valident pas la discernabilité humaine.
3. Corriger le libellé de retard au lycée et vérifier destination/nom/salle dans notification, HUD, pause et bilan.

**Sortie :** plus de double validation au cas limite ; aucune régression de son/dégâts/chrono ; mesures cohérentes. Petit chantier autonome, sans arbitrage artistique.

## Lot B — Rendre l'évitement fiable et lisible avant de renforcer les menaces

**Priorité révisée après le retour de Nicolas :** les défaites avant la première attaque existaient déjà et restent une issue valable. Le diagnostic R13 confirme en revanche qu'un saut sur place ne suffit à aucun des instants testés pour la charge du parent influent dans la situation reproduite. Corriger cette règle avant de durcir un adversaire ; la demande de progression quantitative reste conservée.

1. Donner à la charge une vraie fenêtre d'esquive par saut sur place correctement synchronisé. Ajuster son seuil/volume de contact avec des paramètres centralisés ; conserver le saut en avançant comme autre réponse. Éviter une invulnérabilité de saut générale qui effacerait les autres règles.
2. Distinguer clairement préparation, départ, traversée et récupération. Le signal doit aider à choisir l'instant du saut ; ne pas se contenter d'ajouter une consigne textuelle à une fenêtre impraticable.
3. Tester parent ordinaire et parent influent dans les deux sens, à plusieurs distances et aux bords ; comparer clavier, souris, glissement vertical et diagonal. Vérifier les limites de timing à plusieurs débits, sans compensation de santé pendant les essais.
4. Examiner ensuite une rencontre témoin pour l'élève, le vigile, le lanceur et l'inspectrice : menace, réponse accessible, résultat et raison d'échec. Préserver combats courts, interruption utile et réponse immédiate ; aucune attaque obligatoire pour montrer une animation.

**Sortie :** chaque attaque a une réponse accessible et expliquée par l'action ; un saut bien synchronisé évite réellement la charge sans déplacement imposé. La réussite comme l'échec sont compréhensibles en jeu. Les références finissent avec une marge documentée. Aucune hausse générale de PV ; si une retouche allonge le combat, mesurer son coût dans le même délai. La validation perceptive reste à faire après la correction technique.

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
