# Bruel — atelier de navigation A1

Prototype issu de la proposition validée le 3 octobre 2026. Branche
`atelier-navigation-bruel`, base 0.61. La mission de la journée, le fichier
gelé `Jouer-Technoprof-0.61.html` et GitHub Pages ne sont pas remplacés.

## Lancer l’essai

Ouvrir **Jouer-Technoprof-Atelier-Bruel.html**. Ce fichier contient le jeu et
ses images pour un lancement hors connexion et ouvre directement l’atelier dans
la cour de Bruel. Le chargement reste volumineux : environ 88 Mo.

Depuis les sources :

```sh
npm ci
npm run build:atelier
npm run test:navigation
```

Pour le serveur de développement : `npm run dev`, puis
`/?essai=labo&scenario=bruel-navigation`.

Trois entrées existent dans le sélecteur de l’atelier :

- **Découverte du réseau** : cour, 5 PV par défaut, 225 secondes disponibles.
  Ce budget de départ sert à observer la navigation, pas à valider la difficulté
  d’une affectation complète.
- **Route puis réseau** : cruising, radio, notification, trajet, arrivée et
  établissement. Le délai de 225 secondes est partagé avec la conduite.
  Les réglages de PV de départ ne s’appliquent pas à cette entrée.
- **Hall et soins** : entrée au hall pour comparer l’infirmerie rapidement.
  Sélectionner par exemple 2 PV, puis tester +1 et +2 à paramètres identiques.

Changer le gain du soin ou les PV relance l’essai. « Rejouer » remet les
rencontres et le stock de soins à zéro. Les déplacements clavier/ZQSD,
F/X, les clics et les gestes tactiles existants restent disponibles.

## Comportement à évaluer

Douze zones fixes, deux niveaux, aucune minimap ni scrolling. Le hall est le
pivot. Le grand escalier est présenté en premier plan, avec B10–B12 / premier
étage. L’annexe est annoncée sur le côté, moins dominante. Deux galeries et un
palier supplémentaires distinguent le chemin principal du parcours par l’annexe.
La porte verte et le tuyau de cuivre marquent la jonction ; le palier principal
montre la cour par sa fenêtre. Les sorties indiquent leur direction et les
changements de niveau.

Les six rencontres de Bruel sont reprises sur les portions communes. Vie,
dialogues, attaques et conséquences sont conservés. Un retour ne régénère
pas l’adversaire et ne répète pas son introduction. Le boss garde B12. Le cours
conduit à l’ellipse puis à la voiture : aucun trajet à pied pour repartir.

L’infirmerie est une impasse volontaire. Approcher l’armoire puis presser F/X,
ou cliquer/toucher son corps. Le professeur s’immobilise 1,2 seconde ; la jauge
progresse et **le délai continue**. Le soin donne +1 ou +2 PV, plafonnés à 5,
une seule fois par affectation. Une armoire utilisée reste vide après un retour.
À 5 PV, l’action explique qu’il n’y a rien à soigner et ne consomme pas le stock.
Pause et perte de focus suspendent le geste ; un retard n’est pas annulé par
un soin qui n’a pas fini.

Les nouveaux panneaux, la fenêtre, le tuyau et le mobilier de soins sont des
compositions provisoires. Ils servent à tester la reconnaissance et la
hiérarchie avant la production d’assets définitifs.

## Journal et vérifications

« Exporter le journal » contient les zones visitées, les choix de sortie,
les retours, les passages du hall vers l’annexe, les PV et le délai à chaque
visite/choix, le temps actif par zone et les événements de soin. La variante
du soin est indiquée. Les mesures par zone comptent le temps effectivement
déduit ; dialogues et fondus restent suspendus selon les règles existantes.

Vérifications techniques réussies :

- `npm run build:atelier` : compilation et export autonome.
- `npm test` : suite existante, dont les journées normales à trois missions.
- `npm run test:navigation` : conformité au graphe approuvé, isolation du
  profil, 60 comparaisons de soin et 48 parcours complets à 30/60/120 fps,
  avec clavier ou DirectInput. Ces parcours incluent 24 essais avec soin
  +1/+2 et six séquences continues depuis la voiture jusqu’au cours.
- Cas limites : stock conservé au retour, soin plafonné, actions ignorées
  pendant le geste, pause/focus, retard prioritaire, portes et ellipse.
- Observation dans le navigateur : hall, annexe, jonction, palier et soin
  au clic. Aucun message d’erreur relevé dans la console lors de ces essais.

Les résultats reproductibles sont dans `work/navigation-atelier-results.json`.
Ce sont des parcours automatisés avec connaissance du graphe et du combat.
Ils ne mesurent ni l’hésitation humaine ni la compréhension des repères.
Les essais de soin partent d’un preset de PV déclaré, sans prétendre reproduire
une distribution réelle de blessures.

À 60 fps, l’annexe économise environ **3,6 s** dans ces parcours, proche des
3,45 s estimées entre les ancres. Son avantage n’a pas été augmenté.
Le détour de soin ajoute environ **5,8–6,0 s** sur le parcours principal,
mais seulement **3,1–3,2 s** par l’annexe. Les fenêtres d’interaction rendent
ce dernier plus court que les 4,08 s du modèle entre ancres. Ce constat est
à tester avant de choisir le gain final. À 2 PV de départ, ces bots terminent
avec 2 PV après +1 et 3 PV après +2 ; le coût temporel est identique.

L’observation du jeu a été faite sur le serveur local. Le navigateur automatisé
n’autorise pas les URL de fichiers : l’ouverture directe du HTML exporté reste
à confirmer dans le navigateur de l’utilisateur.

Les avertissements connus sur la taille du bundle Vite et le stripping
TypeScript de Node restent présents. Le téléphone physique, l’écoute et
la qualité perceptive de la navigation ne sont pas validés par cette suite.
Les règles de combat, y compris les limites actuelles de l’esquive de la
ruée du parent influent, ne sont pas refondues par cet atelier.

## Session humaine à mener avant intégration

1. Première tentative depuis la cour, sans consulter le graphe ni ces notes.
   Exporter le journal après succès ou échec.
2. Décrire de mémoire où sont hall, annexe et B12, puis expliquer comment la
   jonction relie les deux escaliers. Un croquis grossier suffit.
3. Rejouer : reconnaître les repères, corriger un mauvais choix, choisir le
   chemin plus consciemment. Comparer les visites et hésitations, pas seulement
   le chrono final.
4. Comparer les soins +1/+2 au même niveau de blessure et avec le même délai.
   À quel moment le détour est-il un choix plutôt qu’une habitude systématique ?

Ne pas intégrer le graphe dans la journée publiée tant que ces observations
n’ont pas permis de juger l’apprentissage du lieu et la valeur contextuelle du soin.
