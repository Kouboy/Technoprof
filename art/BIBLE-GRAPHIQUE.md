# Technoprof — bible graphique

## Direction retenue

Les références approuvées sont le face-à-face devant 42C et la vieille voiture beige en périphérie urbaine. Elles fixent les matières, les silhouettes et l'atmosphère ; elles ne fixent pas les textes ou les dimensions de gameplay.

Comics pulp social français, pixel art détaillé, silhouettes humaines, noir d'encre et ombres franches. L'école est encore utilisée : la peinture s'écaille mais un dessin est affiché avec soin. Éviter la ruine post-apocalyptique, le cartoon et les slogans omniprésents.

## Palette et lecture

- Fonds : vert institutionnel délavé, beige nicotine, béton et ardoise.
- Prof : brun usé, cheveux gris, lunettes, livre bordeaux et tranche crème, sacoche affaissée.
- Inspecteur : costume bleu nuit, cravate bordeaux, dossier crème, tampon à semelle rouge.
- Informations : texte crème, chrono ambre ; rouge pour menace et sanction.
- Décor calme derrière le combat ; séparer les personnages du fond par leur silhouette et leurs contours.

## Échelle et cadrage

Le moteur conserve ses coordonnées de jeu 320 × 240 avec sortie 640 × 480. Le viewport occupe x=7 à 313 et y=7 à 175, le CADRE commence à y=179. Les pieds sont ancrés à y=159 ; ils partagent la même ligne de sol. Le professeur utilise une échelle de 0,18 dans les circulations, 0,225 dans le face-à-face 42C et 0,13 dans la cour. Ces trois cadrages sont intentionnels ; les pieds restent sur la même ligne. Les sources sont conservées en haute définition ; le rendu utilise un filtrage nearest.

Les dimensions doivent être jugées dans le jouable, pas sur les planches seules. Les rectangles d'atlas ne sont pas supposés réguliers : la frappe du professeur déborde de sa cellule théorique. Chaque pose possède un rectangle et un point d'ancrage explicites.

## Animation et accessoires

Huit poses par personnage : repos, trois poses de marche, préparation, frappe, reprise/balayage, saut/recul. Les poses sont choisies par les états du combat existant ; le code reste l'autorité pour les dégâts, les délais et les portées. Tous les accessoires suivent le sprite, y compris au retournement.

Le professeur garde le livre et la sacoche dans chaque pose. L'inspecteur garde dossier et tampon. La première pose de garde de l'inspecteur a été produite vers la gauche : la table de rendu compense explicitement cette différence.

Ce premier lot teste une animation par poses clés. Les intervalles de marche, la continuité de la main et le balayage devront être affinés après audit ; ne pas confondre huit belles images avec une animation finale.

## Répartition technique

- Décor 42C : image sans personnages ni HUD ; numéro de salle rendu par le moteur.
- Personnages 42C : textures d'atlas, points d'ancrage explicites, miroir à l'exécution.
- CADRE, chrono, santé, textes et transitions : moteur, jamais texte généré incorporé.
- Conduite et neuf tableaux scolaires : assets détaillés en place ; lumière, ombres et plaques harmonisées en 0.46. Le dessin de quelques assets reste à reprendre ponctuellement, notamment celui de l élève.
- Assets : génération intégrée imagegen. Le damier initial n'était pas transparent ; seconde passe de génération sur fond magenta uniforme, supprimé au chargement par une clé de couleur. Les PNG sources ne sont pas modifiés.
- Export : données d'image embarquées dans le HTML pour conserver le lancement local sans serveur.

## Contrôle avant déclinaison

1. Repos puis toutes les poses dans les deux sens : pas de morceau voisin, fond magenta ou accessoire coupé.
2. Marche : pieds stables, costume et volume constants.
3. Frappe : anticipation visible, livre/tampon attaché à la main, portée visuelle compatible avec le combat.
4. Boss : alternance frappe/balayage et fenêtre de reprise lisibles.
5. Porte, fondu, « Bon. Reprenons. », retour voiture : aucun sprite persistant devant le noir.
6. HUD lisible et chrono arrêté pendant les présentations imposées.

## Livraison 0.19

Accès direct : lien « SALLE 42C / SPRITES ». Galerie de contrôle : « Voir les poses », choix de pose et retournement. La version 0.18 reste conservée dans son ZIP local. La suite sera la correction des animations selon l'audit, puis la déclinaison de la voiture et des autres personnages.


## Contrat courant — 0.46

Le détail des coordonnées, échelles, lumières et couches est dans `../GAMEPLAY-0.46.md` ; les réglages communs sont dans `src/presentation.ts`. La planche `Jouer-Presentation.html` rend les onze scènes avec les mêmes positions aux trois heures. Comparer d'abord Hall, Salle 42C et Route, puis les autres lieux, à la taille native avec et sans CADRE.

Le décor reçoit une teinte de lumière plus soutenue que les personnages. Les plaques et informations utiles gardent leur contraste. Les ombres n'empiètent pas sur les trous ; les réparations de la route restent fixées dans le monde. Les textes du monde utilisent le petit lettrage bitmap de cinq pixels, sans réduction à une demi-échelle.

Les sections de livraison précédentes sont historiques. La 0.46 ne redessine pas les portes ni les sprites : elle harmonise leur présentation et fournit une base stable pour les prochains arbitrages visuels.