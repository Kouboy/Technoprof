# Échecs, entrée en classe et respiration de l'infirmerie

Passe de présentation du 20 octobre 2026 sur la branche d'atelier. Jouable local :
**Jouer-Technoprof-Journee-Atelier.html**, après `npm run build:atelier`.

## Échec d'une affectation

La voiture s'immobilise sur son élan, sans nouvelles collisions ni temps prélevé.
La panne s'accompagne d'un moteur qui cale et de tôle ; le retard a un freinage
plus discret. À pied, l'épuisement abaisse la silhouette du professeur en gardant
ses appuis ; un retard ne reprend pas cette réaction d'épuisement.

Le constat apparaît après 850 ms : affectation non assurée, cause et commentaire
administratif. Le CADRE reste visible. Après deux secondes, Entrée ou toucher
permettent de poursuivre ; la dernière affectation propose le bilan.
Les règles de réussite, dégâts, délais et bilan de journée restent identiques.

## Classe

Après le boss, le joueur déclenche toujours lui-même l'entrée devant la porte.
Poignée, ouverture et pas suivent le temps de la séquence. Le cours reste
l'aboutissement de la séquence. La porte a un chant visible et une poignée
qui suit son pivotement.
Le professeur se tourne vers l'ouverture et marche seulement pendant l'approche.

Après le fondu et le noir, une petite cloche accompagne le début du cours, avec
les chaises, cahiers et craie existants. Une sonnerie distincte ponctue l'ellipse
« Une heure plus tard... », avant la reprise du trajet suivant.

## Infirmerie

L'ambiance est déterminée par le rôle de la pièce, pour les trois établissements,
y compris après utilisation du soin. Le bourdonnement et les alarmes disparaissent,
le fond devient plus bas et filtré ; quelques froissements restent discrets et
sans réverbération. Le son des caractères de l'infirmière est adouci. Le couloir
retrouve son ambiance à la sortie. Les dialogues, le soin intégral, l'usage unique
et la suspension du délai pendant la récupération sont conservés.

## Vérifications

- `npm run test:sequences` : sons distincts, chronologie, pause et reprise à l'offset
  restant, ambiance de soin, matériaux audio et immobilisation à 30/60/120 fps.
- `npm run test:journee`, suite générale, H1 et I2 : intégration des trois parcours,
  règles et chronométrage, poses et cadrages des portes.
- Atelier : six entrées « Séquences » donnent des vues figées des trois portes,
  des deux constats et de la pose d'épuisement. Ces vues initialisent explicitement
  une situation après échec ou victoire pour inspecter le rendu ; elles ne sont
  jamais utilisées dans la journée normale.

Les sons utilisent des matériaux PCM locaux, sans téléchargement ni service vocal
supplémentaire. Les effets suivent le temps simulé ; la pause coupe les sources
et reprend seulement les queues encore en cours. Un son terminé n'est pas rejoué.
Leur équilibre perceptif reste à juger en écoutant le jeu sur le matériel de test.
