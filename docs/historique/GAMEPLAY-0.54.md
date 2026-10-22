# TECHNOPROF 0.54 — Passages entre tableaux et paroles

Deux symptômes traités : passages involontaires entre salles et bulles silencieuses pendant leur dévoilement.

## Transitions à pied

Reproduction dans la 0.53 : maintenir bas à droite de l'escalier de service, avec l'aile C déjà visitée, produit la succession 7 → 3 → 7 → 3 → 7. L'arrivée se situe dans une autre zone utilisant la même commande. Un verrou temporel seul ne suffit pas : il ne fait que retarder le rebond.

Une commande verticale maintenue ne peut désormais engager qu'un passage ; relâcher haut/bas avant d'en engager un autre. Un appui bref reste valide, et maintenir la commande en approchant d'une porte fonctionne toujours. Les sorties latérales exigent une intention de marche vers le bord concerné, au sol, hors frappe/recul et après le verrou d'entrée. Être poussé au bord ne suffit plus à changer de tableau.

Chaque passage demandé traverse un état explicite : assombrissement du tableau actuel (120 ms), changement de salle, révélation du suivant (180 ms). Les acteurs, collisions et délai de mission restent suspendus pendant ces 300 ms. Les inputs ponctuels reçus pendant le fondu sont consommés sans frappe ni saut à la sortie ; la direction de marche maintenue peut reprendre ensuite. Les destinations souris/tactile sont annulées au départ et à l'arrivée : elles ne se reportent pas sur la salle suivante.

Le fondu dispose d'une couche au-dessus des personnages, props, textes et FX ; il ne masque pas le CADRE. Cette couche corrige aussi les anciens fondus qui pouvaient laisser apparaître des éléments au premier plan. Le CADRE indique le délai suspendu et ne lance pas le tic d'urgence pendant le changement.

Les liens entre pièces, les emplacements d'arrivée, les adversaires persistants et les introductions seulement à la première visite restent les mêmes. Réglages : `PLAY.roomFadeOut`, `PLAY.roomFadeIn`, `PLAY.interactLock` dans `src/gameplay.ts`. Atelier : **Transitions / escalier ↔ couloir**, sans adversaire pour reproduire maintien et retour.

## Paroles

Les nouvelles lettres et chiffres révélés naturellement déclenchent un grain de voix doux de 43 ms, espacé d'au moins 75 ms pour éviter un crépitement permanent. Espaces et ponctuation restent silencieux. Le timbre varie légèrement entre parent, élève, vigile et inspection, avec une variante pour l'inspectrice.

Afficher toute la page d'un coup, passer à la page suivante ou terminer la conversation ne génère pas de rafale de syllabes. Aucun rattrapage de sons n'est programmé. La pause et le silence coupent les sources ; le volume **Effets et moteur** règle ces petits sons, indépendamment de la voix de Radio Educ France. Le rythme de lecture et les règles d'action/dialogue sont conservés.

Réglages : `DIALOGUE.soundInterval`, matière `FOLEY.talk` et sa synthèse dans `src/audio-materials.ts`, profils dans `AudioKit.talk`. Aucun fichier distant ni nouvelle dépendance.

## Validation

Suite complète, TypeScript/Vite et export autonome passent. Tests ciblés aux cadences 15/30/60/120 images/s : maintien et nouvel appui, pause au milieu du fondu, délai et CADRE cohérents, saut/frappe rejetés pendant le changement. Les huit liens latéraux et neuf accès explicites atteignent leur pièce et leur point d'arrivée attendus. Position seule, déplacement vers l'intérieur et recul ne prennent pas une sortie. Clics consommés, gestes refusés pendant le fondu et redémarrage sans destination résiduelle.

Parole : cadence bornée, lettres uniquement, silence pendant le fondu/la pause/après dévoilement complet, page suivante sans son en retard, timbre inspectrice distinct, routage du volume, sources immédiates et courtes, déverrouillage audio par geste et coupure pause/silence. Les anciennes vérifications de conduite, combat, dialogue et journée complète restent vertes ; les essais de navigation ont été adaptés pour marcher réellement vers les bords et attendre le fondu.

Dans le navigateur local : passage au clic escalier 7 → aile C 3, noir complet avec CADRE visible, arrivée stable sans nouvelle commande, retour volontaire 3 → 7, révélation progressive puis complète de la réplique du parent. Aucun warning ni erreur de console. Captures dans `work/transition-noir-054.png`, `work/transition-arrivee-054.png` et `work/dialogue-054.png`.

L'observation utilise Vite sur le loopback local : le gros HTML autonome dépasse toujours la limite de transport de l'outil de navigateur intégré. Le HTML et les ZIP sont vérifiés par compilation, dépendances et empreintes. L'écoute subjective sur les haut-parleurs habituels et le test sur téléphone restent à faire ; la vérification du graphe audio ne juge pas le naturel du timbre.

## Jouable local

Ouvrir **Jouer-Technoprof.html**, ou extraire **Technoprof-0.54-testeurs.zip** puis ouvrir le HTML. Aucune installation ni serveur nécessaire. **Jouer-Technoprof-0.53.html** et les archives 0.53 sont conservés pour comparaison.
