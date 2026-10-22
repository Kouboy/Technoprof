# Livraison journée et assets d'atelier

Nicolas autorise la suite du nettoyage : retirer de la livraison joueur les
assets réservés aux anciens ateliers, sans modifier l'expérience H1/A3/I2.
Le jeu doit rester autonome sur disque, au même chemin, sans requête réseau.

## Choix

Conserver le build complet pour les ateliers et produire un build Vite `day`
pour la journée. Un catalogue de compilation explicite sélectionne les feuilles
partagées dans les modules de données existants ; les octets des images retenues
restent identiques. Aucun PNG source n'est supprimé ou redimensionné.

Une suppression directe des anciens renderers casserait leurs personnages encore
utilisés. Un chargement réseau différé compliquerait le lancement file://. Le
profil de compilation conserve donc ces renderers avec préparation des acteurs
seulement, et exclut leurs arrière-plans inutilisés. Les arrière-plans Bruel et pro
restent nécessaires aux cinématiques de stationnement et à l'entrée I2.
L'infirmière et les trois décors actuels restent partagés.

## Comportement

- La journée démarre sur son accueil actuel, quelles que soient les anciennes
  options d'atelier dans l'URL. Les outils historiques restent dans le HTML complet.
- Les délais, pauses, dialogues, combats, transitions et contrôles restent inchangés.
- Les constructions de décors historiques ne s'exécutent pas dans le profil day.
- Le build complet conserve toutes ses images et ses scénarios.
- L'export journée est produit à partir du build day, et non copié du build complet.
- La 0.61 publiée conserve son empreinte ; aucune publication Pages dans cette passe.

## Vérification

Catalogue : clés requises, sources inconnues inchangées, images retenues identiques,
rejet des données attendues manquantes. Préparation : absence de demande de texture
historique dans le profil réduit. Build : poids inférieur, pas de script externe.
Navigateur natif : accueil, route, trois établissements, acteurs, infirmeries et
portes de cours ; comparaison des captures avec le build complet, erreurs et
textures décodées relevées. Tests de journée existants pour les règles.
