# Journée complète des établissements validés

Ouvrir **Jouer-Technoprof-Journee-Atelier.html**, généré par
`npm run build:atelier`, puis choisir **Prendre le service**. Le fichier contient
les images et le programme : il fonctionne hors connexion après chargement.
En développement : `http://127.0.0.1:4175/?essai=journee` (adapter le port Vite).

Cette partie utilise l'accueil, les commandes, les pauses et le bilan ordinaires,
avec les trois trajets et les dernières versions des établissements :

| Affectation | Période | Établissement | Parcours | Destination | Délai |
| --- | --- | --- | --- | --- | --- |
| 1 | Matin | Collège des Ormeaux | H1 | 42C | 4:00 |
| 2 | Midi | Lycée Auguste-Berthelot | A3 | B12 | 3:45 |
| 3 | Crépuscule | Lycée professionnel des Trois-Ponts | I2 | T03 | 3:30 |

Les réglages actuels sont conservés pour évaluer l'équilibre réel : circulation
croissante, rencontres, boss, trous, signalétique et détours facultatifs de soin.
Aux Trois-Ponts, l'unique infirmerie reste derrière le couloir dangereux accessible
depuis Préparation T. Chaque bâtiment restaure les PV de départ ; les dégâts de
la voiture persistent sur la journée selon les règles existantes.

Le délai démarre à la notification et couvre **route + établissement**. Le cruising,
l'arrivée automatique, les transitions, les dialogues et la récupération à
l'infirmerie ne consomment pas le délai. Après le cours et l'ellipse, la voiture
reprend le prochain trajet. Une affectation ratée n'interrompt pas la journée.
Deux cours sur trois permettent de conserver le poste au bilan final.

Pour nous transmettre l'essai, ouvrir la pause ou le bilan et choisir
**Exporter mon essai**. Le JSON réunit les trois chronos (route et école), les
résultats et trois relevés de navigation distincts, sous `navigationByMission`.
Le début d'une nouvelle journée remet ces relevés à zéro.

Le laboratoire propose aussi **Journée complète / trois trajets et établissements
validés**, scénario `journee-validee`, pour les essais reproductibles et les outils
de diagnostic. Les ateliers isolés restent disponibles. La 0.61 publiée n'est pas
remplacée, et aucun changement n'est envoyé sur `main` ou GitHub Pages.

Vérifications : `npm run test:journee`, suite générale et tests des profils concernés.
Les pilotes continus utilisent les commandes réelles à 30, 60 et 120 fps sans
modifier les PV, positions, ennemis ou chronos après le départ. Ils connaissent
les itinéraires : leurs résultats confirment l'intégration, pas la difficulté
d'une première découverte humaine.
