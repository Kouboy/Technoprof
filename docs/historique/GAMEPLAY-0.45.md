# TECHNOPROF 0.45 — Combat, lot 3

Ouvrir `Jouer-Technoprof.html` pour jouer, ou `Jouer-Labo.html` pour comparer les situations. La 0.44 est conservée dans `Jouer-Technoprof-0.44.html` et son archive. Aucun serveur ni installation nécessaire pour le jouable autonome.

## Ce qui change pour le joueur

Le professeur accuse un coup reçu pendant 220 ms, avec une pose resserrée, un recul orienté et une brève inclinaison. Il reste opaque au contact ; le clignotement indique ensuite l'invulnérabilité. La direction ne peut pas retourner sa pose pendant cette réaction. Toutes les salles utilisent désormais la même présentation du professeur.

Une garde arrête le livre au contact, puis le fait revenir vers le professeur. L'inspection reste solide : ce rebond n'interrompt pas sa préparation. Une vraie touche déplace immédiatement le corps de collision de l'adversaire, mais son image rejoint cette nouvelle position en 220 ms au lieu de se téléporter. Cette interpolation tient compte des bords de salle. Les poses de frappe adverses suivent maintenant le temps de frappe effectif, et non une durée de récupération : un coup interrompu ne réapparaît plus après le recul.

Tous les ennemis restent visibles après leur défaite : pose de recul, déséquilibre, puis disparition progressive sur 1,1 seconde. Cela concerne aussi le parent lorsqu'il percute le mobilier. Les images existantes sont réutilisées ; il ne s'agit pas d'une nouvelle planche de chutes dessinées.

Les contacts du livre sont placés à sa hauteur réelle (55 unités au-dessus des pieds dans les couloirs, 69 dans l'arène). Les arcs suivent le côté de frappe. Les éclats sont plus courts et plus petits ; les onomatopées descendent sous les visages et s'effacent lorsqu'une préparation adverse demande l'attention.

Le souffle du livre, l'arrêt dur sur la garde, la touche sourde, le coup reçu et la défaite utilisent des enveloppes sonores différentes. Ces sons sont déclenchés par les événements de combat. Les boutons de l'atelier ouvrent désormais le contexte audio, comme le clavier du jeu.

Une pression de X dans les 100 dernières millisecondes d'un coup prépare **un seul** coup suivant. Une pression plus précoce n'est pas conservée ; maintenir X ne déclenche pas d'attaque automatique. Blessure, chute, changement de salle et fin de mission annulent la commande en attente. Aucun buffer de saut ajouté.

Le réglage **Secousses réduites**, sous le jeu, ramène l'intensité de caméra à 20 %, en conduite comme au combat. Il est mémorisé localement quand le navigateur l'autorise. Les réactions des corps et les impacts restent visibles.

## Contrat des attaques

Les durées sont exprimées en temps de simulation, hors arrêt d'impact. Elles restent réglables dans `src/gameplay.ts`. Le contact se résout une fois au début de la frappe, pas à chaque image de la pose étendue.

| Attaque | Déclenchement et préparation | Contact | Suite et réponse |
|---|---|---|---|
| Livre | X, préparation 140 ms | Une résolution directionnelle ; portée 44/56/74 selon la salle | Pose étendue 170 ms puis reprise 170 ms ; touche : arrêt 55 ms et recul adverse ; garde : arrêt 40 ms, contact tenu 60 ms puis livre ramené |
| Élève | Approche, préparation 700 ms et signe de menace | Coup de pied, portée 48, pose de frappe 120 ms ; saut ou recul pour éviter | Reprise 850 ms ; réaction du professeur si contact valide |
| Vigile | Approche, préparation 750 ms | Poussée, portée 54, pose de frappe 120 ms | Reprise 850 ms, professeur repoussé si touché |
| Parent | Préparation 1 seconde, direction engagée | Charge à 100 unités/s pendant au plus 1,9 seconde ; saut possible | Reprise 1,1 seconde, ou interruption contre le mobilier ; toucher au livre interrompt la charge |
| Inspection | Tampon : 550 ms ; balayage : 800 ms | Portée 64 / 78, direction engagée, pose 120 ms | Ouverture de 1,1 seconde ; le livre est bloqué hors ouverture ou étourdissement |

La réaction du professeur dure 220 ms ; l'invulnérabilité reste à 1,2 seconde. Le coup reçu provoque un arrêt bref (45 à 65 ms selon l'attaque). Le chrono reste suspendu pendant cet arrêt, comme précédemment. Les règles de trajet, de dialogue, de portes et d'ellipse sont conservées.

## Atelier et vérifications

25 scénarios : les 18 précédents, plus coup dans le vide, touche/garde/coup reçu dans l'autre orientation, et dernière touche contre parent/élève/vigile. La case **Onomatopées** permet de juger les corps et les FX sans texte. Pause, pas de 20 ms et ralenti restent disponibles.

Vérifications effectuées le 24 septembre 2026 :

- `npm test` : suite complète, dont mission route → collège → boss → classe ; nouvelles régressions dans `work/check-045.cjs` et `work/check-art.cjs`.
- Contact unique et sons correspondants à 15/30/60/120 images/s ; ancrages miroir, interruption de frappe, rebond, buffer tardif, maintien de X, annulation par blessure/chute/transition, défaites des quatre profils, collision du parent contre le mobilier, réduction des secousses.
- `npm run build` et `node work/check-local.cjs` : export autonome et 12 raccourcis valides.
- Observation de l'export dans le navigateur : préparation et touche droite/gauche, touche sans onomatopées, contact puis retrait sur garde, coup reçu de l'élève et défaite du parent. Les actions passent par les boutons de simulation, sans injection d'état dans le navigateur. Activation audio par les boutons sans erreur JavaScript observée.

## Limites et prochaine passe

Le navigateur de contrôle en arrière-plan provoque des pauses pour images longues. Les poses et transitions ont donc été examinées au pas à pas ; cela ne valide pas la fluidité à vitesse normale ni la qualité subjective des sons. Une session humaine reste nécessaire pour juger le poids du livre, la cadence et le confort d'écoute. Le jeu ne doit pas être considéré comme validé uniquement parce que les tests passent.

Deux avertissements Phaser concernant `setMask` en WebGL apparaissent au chargement. Leur présence a été reproduite sur la 0.44 conservée ; ils proviennent du rendu routier et ne sont pas introduits par ce lot. À traiter lors du contrat visuel du lot 4, notamment pour les limites de cadrage. L'avertissement Vite sur le gros module autonome et celui de Node sur le chargement TypeScript expérimental restent connus.

Suite prévue : lot 4, harmonisation des proportions, raccords, ombres, signalétique et lisibilité entre route et collège. La fabrication de poses définitives plus fines pourra se baser sur les timings et réactions désormais communs.
