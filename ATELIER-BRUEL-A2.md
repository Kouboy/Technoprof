# Bruel — atelier de navigation A2

Le jouable A2 augmente les décisions sans agrandir l’établissement : douze
zones, deux niveaux, six rencontres communes. Il conserve A1 dans le sélecteur
pour la comparaison. La journée publiée et le HTML gelé 0.61 restent inchangés.

## Lancer

Ouvrir **Jouer-Technoprof-Atelier-Bruel-A2.html** dans le dossier du projet.
Le jeu et ses images sont inclus dans ce fichier autonome d’environ 88 Mo.
Il démarre sur « Bruel A2 / découverte du réseau ». Le fichier
**Jouer-Technoprof-Atelier-Bruel.html** continue à démarrer sur A1.

Depuis les sources : `npm run build:atelier`, puis `npm run dev` et
`/?essai=labo&scenario=bruel-navigation-a2`. Les entrées « route puis réseau »
et « hall et soins » existent pour les deux révisions. Flèches/ZQSD, F/X,
Espace, souris et gestes tactiles restent les contrôles du jeu.

## Ce qui change

Le palier principal et le palier de l’annexe communiquent au premier étage.
Au palier, le joueur peut continuer par la galerie A ou emprunter le passage
intérieur. L’annexe peut le ramener au palier, le conduire à la jonction ou
le faire descendre au hall. Les changements de niveau correspondent à ces
accès ; l’annexe représente désormais un palier supérieur avec une descente.

Le grand escalier conserve sa place dominante au hall. L’escalier annexe est
visible à droite, avec une signalétique secondaire. Le vestibule situe B12
dans l’aile B, au premier étage ; les panneaux suivants donnent des lieux
locaux et des plages de salles. Ils ne répètent plus la direction de B12
sur toute la route. Le CADRE conserve la destination connue et les commandes
d’accès restent explicites. La fenêtre sur la cour, le banc, la porte verte
et le tuyau cuivre servent à reconnaître les lieux.

Les vitesses, délais, dialogues, ennemis et soins +1/+2 ne sont pas retunés.
Les adversaires vaincus le restent au retour. L’infirmerie reste optionnelle,
avec un seul soin plafonné à 5 PV et un délai actif pendant le geste. Aucun
trajet à pied n’est ajouté après le cours.

## Vérifications et limites

`npm run test:navigation` compare les graphes aux accès réellement exécutés :
48 parcours A1 et 54 parcours A2, clavier et DirectInput à 30/60/120 images/s,
avec combats et ellipse. Chaque révision comprend 60 comparaisons du soin,
les limites de PV, le retour sans nouveau stock, pause/focus et retard
prioritaire. A2 ajoute 81 vérifications des embranchements : cibles consommées,
touche maintenue sans rebond, puis nouvelle pression acceptée après relâchement.
Six parcours par révision commencent en voiture et vont jusqu’au cours.
Les résultats sont dans `work/navigation-a2-atelier-results.json` et
`work/navigation-atelier-results.json`.

À 60 images/s, au clavier, ces bots dépensent 37,067 s par le parcours principal,
35,200 s via palier → annexe et 33,683 s par l’annexe depuis le hall.
L’écart de 3,384 s reste proche des 3,447 s du modèle entre ancres. Le parcours
principal est identique à A1 ; les nouvelles entrées d’escaliers expliquent
le léger changement des fenêtres d’interaction de l’annexe. Le détour de soin
coûte environ 5,95 s par le principal et 3,25 s par l’annexe dans ces essais.
Ce sont des mesures de bots connaissant le réseau, pas une mesure de recherche
de chemin ni une validation de l’intérêt des choix.

Compilation/export et suite existante vérifiés. Les embranchements et retours
ont aussi été observés dans le navigateur local avec les commandes du jeu.
Les panneaux et recompositions sont des assets d’atelier provisoires.
L’ouverture directe du HTML exporté, le téléphone physique et l’écoute restent
à confirmer chez l’utilisateur. Le navigateur de test interdit les URL de
fichiers ; l’observation utilise le serveur local. Les avertissements connus
sur la taille du bundle et le stripping TypeScript subsistent.

## Essai humain

1. Jouer A2 depuis la cour sans lire son graphe. Exporter le journal.
2. Expliquer de mémoire où sont le hall, l’annexe et B12, puis la reconnexion
   au premier étage. Un petit croquis suffit.
3. Rejouer, reconnaître un lieu, corriger une erreur et choisir une route
   plus consciemment. Comparer les visites et hésitations, pas seulement le temps.
4. Comparer +1 et +2 PV au même état de blessure ; relever quand le détour
   devient un choix contextuel ou une habitude systématique.

Le journal indique maintenant la révision A1/A2 et compte séparément les
entrées hall → annexe et palier principal → annexe. Les mesures de fin sont
conservées après l’ellipse. Attendre cette session humaine avant de décider
d’une intégration dans la journée et d’une production d’assets définitifs.
