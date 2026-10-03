# TECHNOPROF 0.43 — Lots 0 et 1

Livraison locale du 24 septembre 2026. Référence conservée : `Jouer-Technoprof-0.42.html` et `Technoprof-0.42-local.zip`. L'audit et le plan de la 0.42 restent les documents de départ.

## Jouer et observer

- `Jouer-Technoprof.html` : journée normale. Entrée commence, P suspend/reprend.
- `Jouer-Labo.html` : atelier animé, séparé du parcours joueur. Conserver ce raccourci à côté du HTML principal.
- Choisir un scénario puis Rejouer pour réinitialiser sa situation. Pause/reprendre, vitesse normale ou ×0,5/×0,25, pas de 20 ms. Frapper déclenche le vrai input X ; en pause, il avance aussi d'un pas.
- Quatorze situations : route, parent, élève, vigile, inspectrice, trous, arrivée, contact, garde, coup reçu, dernier coup/entrée en classe, retard, épuisement, panne.
- En « dernier coup », frapper, rejoindre la porte et presser Haut. Les scénarios préparent une situation ; leurs dégâts, réussites et échecs passent ensuite par les règles normales.
- L'atelier conserve le jeu visible pendant la pause. Sur écran large, les commandes apparaissent à droite ; sur écran étroit, elles passent dessous.
- Cliquer dans un champ de réglage suspend le jeu et libère le clavier. Reprendre après modification. La perte de focus suspend également le jeu.

Les repères cyan montrent la séparation horizontale des pieds/corps ; ce ne sont pas des collisions pixel à pixel. Ambre : portée du livre ; rouge : portée adverse et trous ; croix : point de contact enregistré avant recul. Sur route, les bandes montrent les seuils entre centres utilisés par la collision actuelle. Leur désaccord avec les grandes silhouettes routières fait partie du lot 2.

## Contrat des règles

| Situation | Réponse |
|---|---|
| Première réplique d'un adversaire ordinaire | Neuf secondes sans agression ; le joueur peut bouger. La séparation des corps et l'expiration du stun restent actives. Le délai continue. |
| Le joueur touche cet adversaire pendant sa réplique | La réplique cesse au contact. Dégât, réaction, récupération puis reprise du combat. Une frappe dans le vide ne coupe pas la réplique. |
| Le joueur quitte puis retrouve l'interlocuteur | Pas de répétition de l'introduction ; l'état de l'ennemi est conservé. |
| Présentation de l'inspection | Introduction imposée conservée, commandes d'action rejetées et délai suspendu. |
| Coup reçu pendant une frappe | Frappe annulée, 140 ms de récupération, invulnérabilité temporaire. Pas de coup fantôme après la blessure. |
| Saut et frappe | Peuvent coexister ; le livre ne touche plus au-dessus de son seuil de hauteur. |
| Chute | Annule la frappe et prend la priorité sur les interactions. Retour sur la bonne rive, un dégât ; épuisement si dernier point perdu. |
| Porte, escalier ou bord de tableau | Attend le sol et la fin de frappe/récupération. Une flèche maintenue peut alors valider l'accès. |
| Échec | Cause mémorisée : délai dépassé, professeur épuisé ou véhicule en panne. FX et attaques nettoyés, CADRE « ÉCHEC », chrono arrêté, plus d'alerte d'ouverture. |
| Continuer après échec | Invite après deux secondes ; une nouvelle pression sur Entrée passe à l'affectation suivante. Une pression précoce ne reste pas en attente. |
| Réussite | Entrée en classe de 3,4 s hors chrono, puis noirs, « Bon. Reprenons. », touche et ellipse. |

Priorités : pause/transition imposée → fin de mission → chute en cours → récupération après blessure → déplacement/saut → contrôle du sol → frappe/contact → agression adverse → contrôle du sol et de la santé → interaction. Les inputs ponctuels refusés par une transition ne se déclenchent pas plus tard. Aucun buffer de combat ajouté dans ce lot.

## Réglages et états

`src/gameplay.ts` contient les vitesses à pied, saut, gravité, portées, séparations, délais de frappe, réactions, attaques adverses, seuil de pause et durées de sortie. `combatProfile(room)` choisit le gabarit de la pièce sans examiner les textures chargées. Les tests et le jeu livré partagent donc les mêmes règles.

`enemyPhase()` dérive un état exclusif depuis les compteurs qui font autorité : présentation, approche, préparation, frappe, récupération, touché, vaincu. Il sert à l'observation ; il ne crée pas une seconde machine d'états susceptible de diverger des règles. La collision corporelle se résout séparément de l'IA et de la parole. Les poses existantes restent utilisées ; leur refonte appartient au lot 3.

Le moteur transmet désormais le temps écoulé sans lissage préalable. Chaque image est simulée en sous-pas d'au plus 20 ms, puis dessinée une fois. Les images lentes ne sont plus raccourcies à 40 ms. Au-delà d'une seconde sans image, pause explicite « INTERRUPTION LONGUE » : aucune simulation aveugle d'une longue absence. P reprend. Hit-stop, cinématiques et pauses restent volontairement hors délai.

## Reproduction et journal

La seed initialise le renouvellement du trafic ; même seed et mêmes commandes reproduisent ce trafic. Les premiers véhicules du trajet gardent leur composition existante. Chaque affectation dérive sa seed depuis celle de la journée. Les particules et sons ne sont pas annoncés comme bit à bit déterministes.

`src/session-log.ts` enregistre localement les temps simulés par phase, changements de pièce, coups, contacts, collisions, chutes, réussite et cause d'échec. Le journal garde au plus 2 000 événements. À chaque fin d'affectation, une copie est sauvegardée dans `localStorage` si disponible (`technoprof-last-session`). L'atelier peut exporter son journal JSON ; aucun envoi réseau. Le stockage peut être désactivé par le navigateur, particulièrement en ouverture de fichier local ; l'export reste disponible.

## Vérifications réalisées

- `npm test` : parcours complet conduite → détour → inspection → classe, profil du jeu livré ; collisions pendant les introductions ; interruption par contact/blessure/chute ; transitions ; trois causes d'échec et absence de double résultat ; pas à pas ; seed ; tests visuels de géométrie et du CADRE.
- Simulation à 15, 30, 60 et 120 images/s : dix secondes de jeu sans impact consomment dix secondes de délai. Interruption de 1,5 s : pause explicite.
- `npm run build` : types, bundle et export autonome. `node work/check-local.cjs` : HTML sans script externe, douze raccourcis légers, paramètres préservés.
- Navigateur de contrôle : HTML exporté servi sur loopback, sélection de scénario, pause, pas à pas, frappe réelle, diminution des PV, impact, superposition des repères, HUD de l'épuisement. Pas d'erreur console observée. L'atelier reste lisible avec le jeu et les commandes côte à côte.

Limite de cette observation : le navigateur de contrôle en arrière-plan présente des interruptions mesurées autour de 1,1 s, qui déclenchent correctement la pause. Les vérifications visuelles de combat ont donc utilisé le pas à pas. Cela ne valide ni une session humaine complète à vitesse normale ni les performances sur le navigateur habituel de Nicolas. L'ouverture directe `file://` n'a pas été observée dans cet outil ; le fichier autonome exact a été inspecté et servi localement.

Le warning Vite sur la taille du bundle subsiste : les images sont incluses volontairement dans le HTML autonome (~66 Mo, archive ~48 Mo). Le warning Node `stripTypeScriptTypes` concerne le banc de tests. Aucune nouvelle dépendance.

## Suite

Le lot 2 reste prioritaire : cohérence emprise/silhouette des véhicules, suppression de la bande sûre permanente, composition du trajet, freinage et erreurs récupérables. Ne pas corriger ce problème par une hausse générale de la densité. Le lot 3 travaillera les poses, réactions et sons des contacts à partir de cet atelier.
