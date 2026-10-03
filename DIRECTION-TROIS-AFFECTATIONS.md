# TECHNOPROF — Trois lieux, une journée

**État 0.57 :** cette direction est maintenant incarnée dans le prototype : trois destinations, cartes, arrivées, rencontres et boss. Les silhouettes et répliques proposées ont été intégrées comme versions de travail ; leur ton et leur confort attendent les retours de Nicolas. Voir [GAMEPLAY-0.57.md](GAMEPLAY-0.57.md). Les propositions initiales ci-dessous restent la référence artistique.

## Intention retenue

Nicolas souhaite que chaque affectation ait lieu dans un établissement différent, avec une réutilisation intelligente des assets, des créations propres aux lieux, des ennemis communs et nouveaux, et des boss différents. Cette direction remplace la proposition de trois variations dans le même collège. Le prototype 0.54 reste inchangé ; ce document prépare son évolution.

Les trois destinations donnent à la journée une progression spatiale et humaine. Le professeur doit continuer à assurer le service dans des lieux qui ne lui sont pas familiers, avec son livre et la même voiture qui s'abîme. La notification devient aussi la découverte d'une nouvelle destination.

## Proposition de lieux

Les trois établissements sont retenus : **Collège C. Hanouna**, **Lycée Patrick Bruel** (urbain ancien) et **Lycée Professionnel Tibo InShape** (périphérique). Les deux nouveaux noms ont été choisis par Nicolas. Les boss et nouveaux ennemis suivants restent des pistes.

| Affectation | Identité visuelle | Ce que le joueur apprend ou réemploie | Rencontres |
|---|---|---|---|
| Collège C. Hanouna | Ensemble des années 1970, béton, vert institutionnel, carrelage cassé, cour usée | Chrono partagé, orientation entre niveaux, détour/raccourci, lecture des ouvertures | Adversaires actuels ; inspectrice comme premier boss |
| Lycée Patrick Bruel | Ancien bâtiment scolaire remanié, enduit abîmé, hauts plafonds, radiateurs et annexes ajoutées ; cour étroite | Lire une nouvelle organisation des ailes, reconnaître les menaces communes, esquiver une ruée | Certains adversaires connus ; nouvel adulte intimidant qui filme et avance pendant sa préparation ; parent influent comme boss |
| Lycée Professionnel Tibo InShape | Architecture de périphérie, ateliers en béton et brique, verrières rafistolées, établi et matériel encore entretenus, accès techniques dégradés | Choisir un parcours selon le risque, rester mobile face à un blocage, exploiter une récupération | Adversaires communs choisis ; nouveau jeune majeur qui lance de petits projectiles annoncés ; chef d'une sécurité externalisée comme boss |

Le délabrement doit rester concret : infiltrations, vitres réparées, zones condamnées, matériel manquant. Chaque lieu conserve des traces de soin et de travail. Éviter que le lycée professionnel soit représenté uniquement comme un lieu violent ou ruiné : ses ateliers et gestes de réparation lui donnent aussi une dignité et une personnalité.

Les nouveaux ennemis doivent être contextualisés par leurs répliques. Leur rôle et leur hostilité doivent se comprendre ; le décor ne justifie pas à lui seul qu'ils attaquent. Les gestes proposés servent la lecture d'une menace avec marcher, sauter et frapper ; ils n'introduisent pas de nouvelles commandes.

## Trois boss, trois réponses

1. **Inspectrice — jugement administratif.** Préparation du tampon ou du balayage, esquive, ouverture dans la récupération. Réutiliser le combat actuel stabilisé.
2. **Parent influent — intimidation et occupation de l'espace.** Ruée clairement annoncée, dépassement de sa cible, temps de reprise exploitable. Faire monter la tension par le placement et le rythme, avec quelques variations de séquence lisibles.
3. **Responsable de sécurité externalisée — exclusion physique.** Se protège frontalement et se retourne lentement ; le joueur peut le contourner par un saut pour frapper dans son dos. La poussée annonce le danger de rester au contact devant lui. Faire une étude de silhouette et un prototype de règles avant les poses définitives, en vérifiant espace d'atterrissage et réponse au contrôle direct.

Le parent boss peut prolonger les thèmes d'influence déjà présents chez l'élève. Le dernier boss proposé fait écho à une école où le contrôle d'accès prend le pas sur le cours. Leur personnalité et leurs répliques restent à écrire avec Nicolas ; ces descriptions ne sont pas une validation finale des attaques.

Un boss différent se définit par sa silhouette, son objet, son anticipation et la réponse qu'il demande au joueur. Augmenter les PV d'un inspecteur ou changer la couleur de son costume ne remplit pas ce critère. Les effets, sons et onomatopées doivent aider à lire cette différence.

## Méthode de production des assets

**Bibliothèque commune :** mobilier institutionnel, quincaillerie, fenêtres, tuyauterie, réparations, cônes et barrières, petites affiches, ombres, FX et matières sonores. Conserver les ancrages de pieds, largeurs de collision et gabarits de portes déjà réglés. Réutiliser ces pièces dans des compositions adaptées au lieu.

**Créations propres :** volumes architecturaux, façade d'arrivée, vues intérieures caractéristiques, signalétique locale et destination. Pour chaque nouvel établissement, commencer par trois compositions de référence : entrée/cour, espace intérieur représentatif, salle de confrontation. Leurs silhouettes et perspectives doivent déjà évoquer des lieux distincts avant les détails.

**Personnages :** partager les règles de locomotion et de réaction quand elles correspondent au rôle, mais créer les silhouettes, objets et poses nécessaires aux nouvelles attaques. Une recoloration peut servir une variante d'ennemi commun ; elle ne remplace pas un nouvel adversaire annoncé comme tel.

**Approches routières :** conserver route, circulation et conduite, composer une traversée urbaine plus resserrée pour le deuxième lieu et une périphérie d'ateliers pour le troisième. Le quartier final, la façade et la grille d'arrivée doivent correspondre à la destination annoncée.

## Critères de validation

- Sans le nom affiché, trois captures permettent de distinguer les établissements.
- Les cartes ne sont pas identiques avec des fonds différents : parcours, repères et choix changent réellement.
- La même salle et le même établissement sont désignés dans notification, CADRE, panneaux, porte et bilan ; la cible reste cachée avant la notification.
- Les portes et pieds conservent les proportions fixées, même dans les salles hautes ou les ateliers.
- Le retour d'un ennemi connu mobilise un apprentissage ; l'arrivée d'un nouveau permet de lire sa menace avant de la subir.
- Chaque boss possède une préparation et une récupération reconnaissables, et une solution possible avec les contrôles communs.
- Les temps sont calibrés par affectation ; la cinématique et les transitions restent hors chrono.
- Les nouveaux assets sont mesurés et préparés pour la livraison locale ; un établissement supplémentaire ne doit pas provoquer un ralentissement gênant.

## Ordre de construction

Corriger les passages → stabiliser le collège actuel → rendre les missions configurables → construire et tester le deuxième lieu → construire et tester le troisième → régler la journée complète. Cette succession permet de vérifier la méthode de réutilisation avant de produire simultanément tous les décors et personnages.
