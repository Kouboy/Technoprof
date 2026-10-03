# TECHNOPROF 0.52 — Ponts et bords de route

Cette passe enrichit la route avant la refonte sonore. Le joueur garde une vue dégagée sur les véhicules : la variété vient des silhouettes et de leur répartition, sans panneaux ni alertes supplémentaires.

## Radio

Le nom est harmonisé en **Radio Educ France**, dans le sous-titre et au début du bulletin parlé. La case du CADRE indique RADIO / EDUC FRANCE pendant le cruising. Les trois bulletins et leur interruption par l'affectation sont conservés. Aucune occurrence « idiotie » n'a été trouvée dans les sources actuelles ; aucun texte de ce nom n'est ajouté.

## Ponts

Deux familles alternent : béton avec joints, coulures et nervures ; poutre d'acier rivetée sur appuis maçonnés. Les piles sont hors de la chaussée ; le tablier laisse une hauteur libre supérieure au gabarit des camions. Les détails suivent la projection et restent dans le cadrage routier.

Les ponts partagent l'ordre de profondeur des véhicules : un véhicule lointain peut être masqué par la structure, un véhicule proche passe devant. Après le franchissement, la projection continue brièvement derrière le plan du joueur ; le tablier s'agrandit et sort par le haut au lieu de disparaître instantanément. La voiture du joueur garde sa place dans la composition.

## Paysage

Six nouveaux sprites pulp : collectif R+3, gymnase municipal, atelier/logement, château d'eau en béton, platane et armoire électrique avec bornes. Ils complètent les maisons, arrêts de bus, clôtures et lampadaires existants. Les éléments droits sont orientés vers la chaussée.

Quatre portions se succèdent : habitat, équipements publics, espace arboré, ateliers. Les bâtiments sont groupés avec des intervalles vides ; les arbres, arrêts et armoires ont des fréquences distinctes. La teinte des abords et les profils de trottoirs/talus suivent la position dans le monde. Chaque objet possède une adresse et une variante stables : il ne se transforme pas lorsqu'un quartier change. Les kilométrages, vitesses, timings et règles du trafic restent ceux de la 0.51.

Source originale, alpha et prompt : [art/road-52/README.md](art/road-52/README.md). Projection : `src/road-structures.ts`. Répartition et cadres : `src/road-art.ts`. Références supplémentaires dans `Jouer-Presentation.html` : habitat, équipements, arbres, ateliers et trois vues de pont.

## Validation

Suite complète et compilation TypeScript/Vite passent ; export autonome et treize raccourcis locaux vérifiés. Tests spécifiques : six variantes présentes, identité des objets aux limites de quartier, projection continue au passage, hauteur libre camion, piles hors route, coordonnées entières et bornes du dessin. Les tests existants contrôlent aussi la profondeur commune du pont et des véhicules et les références aux trois heures.

Observation dans le navigateur à la taille 640 × 480 : pont béton, pont acier/maçonnerie au soir, sortie sous le tablier, équipements publics, portion arborée et ateliers. Aucun warning ni erreur dans la console du jeu. Captures dans `work/route-*-052.png`.

L'outil d'aperçu intégré a atteint sa limite de taille sur le gros HTML autonome ; les observations ont été réalisées sur le même jeu via le serveur Vite local, avec ressources séparées. Le HTML autonome et les ZIP sont contrôlés par compilation, vérification des dépendances et empreinte identique, sans déclarer un lancement navigateur de cet export. Une session jouée dans le navigateur habituel reste nécessaire pour juger la densité en mouvement et le ressenti du franchissement.

Ouvrir `Jouer-Technoprof.html` ou extraire `Technoprof-0.52-testeurs.zip`. La 0.51 est conservée. La prochaine passe concerne les effets et ambiances sonores : moteur et carlingue, dépassement/frôlement, impacts et gestes administratifs, lieux et entrée en classe, puis équilibre avec radio et alertes.
