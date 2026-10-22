# TECHNOPROF 0.56 — Première affectation mesurée

2 octobre 2026. **Lot 1 : livraison technique prête ; validation par découverte humaine et sur téléphone physique encore ouverte.** La 0.55 est conservée.

## Ce qui est livré

- Un parcours complet reproductible dans l'atelier : « Première affectation / parcours complet ». Il commence en cruising, sans destination ni chrono affiché, avec la seed choisie. Il utilise ensuite les mêmes règles que la journée.
- « Exporter mon essai » dans la pause et le bilan. Le fichier JSON contient les incidents, les temps et les mesures techniques. Il reste local jusqu'au partage volontaire. Le journal de l'atelier contient désormais les mêmes données.
- Mesures séparées par affectation : temps simulé dans chaque état et secondes réellement retirées au délai. Dialogue, cinématique, fondus et hit stop restent hors chrono. La pause ne compte dans aucun des deux temps.
- « Mesures de cet essai » dans l'atelier : panneau facultatif actualisé une fois par seconde, refermable avec le même bouton.
- Libération de 13 textures sources après préparation de leurs atlas indépendants. Les décors, poses, contours et fichiers PNG restent identiques. Cela retire des copies de textures correspondant à 81 788 928 octets de pixels RGBA (environ 78 Mio) ; ce chiffre n'est pas une mesure de mémoire totale économisée dans le processus.
- Saut diagonal souris/tactile : destination bornée au sol accessible. Un geste vers une limite condamnée ne laisse plus une intention de marche permanente contre cette limite.

## Parcours continus

`work/mission-runner.cjs` démarre normalement la journée avec une seed déterministe. Après le départ, il n'écrit ni position, ni PV, ni chrono, ni phase, ni résultat. Il choisit ses actions à partir des états observés : touches physiques ZQSD/F/Espace ou gestes passant par DirectInput. Le clavier appelle aussi le véritable gestionnaire de touche pour poursuivre après le cours.

Les dialogues sont laissés se dévoiler et sont confirmés page par page. Le parent du hall peut être évité par la porte d'annexe. Élève et vigile sont affrontés depuis l'arrivée réelle dans leur pièce. Le contrôleur qui lit le boss attend sa préparation, saute au moment approprié puis frappe pendant la récupération. Il termine par porte, cours, ellipse et retour en cruising.

**60 parcours réussis** : 2 chemins × 2 modes × 5 seeds × 30/60/120 images par seconde simulées. Les seeds sont 1, 4301, 8317, 123456 et 4294967294. Aucun scénario d'atelier ne remplace un morceau de ces parcours. Les adaptations Pointer Events souris/touch et dimensions de canvas restent couvertes par les tests 0.49 et 0.55 ; ces 60 parcours ne sont pas des essais sur écran tactile physique.

| Observation à 60 Hz, seed 4301 | Clavier, détour | Contrôle direct, détour | Clavier, technique | Contrôle direct, technique |
|---|---:|---:|---:|---:|
| Route, secondes retirées au délai | 60,42 | 60,42 | 60,42 | 60,42 |
| Temps total simulé jusqu'au retour en voiture | 129,62 s | 129,67 s | 126,70 s | 126,77 s |
| Délai restant au cours | 154,68 s | 154,63 s | 154,25 s | 154,18 s |
| Santé au cours | 5/5 | 5/5 | 4/5 | 4/5 |
| Chocs / chutes | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

Le détour traverse cour → hall → annexe → passerelle → escalier de service → aile C → salle 42C. La voie technique traverse cour → hall → escalier central → couloir technique → aile C → salle 42C.

Pour le détour clavier, les secondes actives à pied sont réparties en orientation 11,22 s, rencontre ordinaire 4,23 s et boss 9,45 s. Lecture : 11 s ; fondus scolaires : 2,50 s ; arrivée : 6,92 s. **« Rencontre » signifie présence d'un adversaire vivant**, donc inclut l'approche et les déplacements dans la même pièce. Ce n'est pas une mesure directe du temps où le joueur réfléchit à une attaque. Les mesures automatisées ne quantifient pas ses hésitations.

Le temps des deux voies maîtrisées est presque identique pour le chrono. Le chemin technique retire une rencontre et du temps de lecture, mais ses sauts occupent le déplacement. **Ne pas lui attribuer un gros gain de temps non mesuré.** Son intérêt et son gain éventuel pour un débutant restent à observer ; ne pas durcir artificiellement le vigile pour obtenir une différence contre ce contrôleur parfait.

## Erreurs et coût des stratégies

- Lecture ralentie à 10 secondes par page : le parcours s'allonge de plus de 50 secondes, sans réduire davantage le délai.
- Ne jamais accélérer : échec « RETARD SUR LA ROUTE », cause `late` enregistrée. Pas de saut arbitraire à l'établissement.
- Accélérer sans diriger, seed 4301 : le parcours peut aboutir, mais avec 4 chocs et 4 % d'état auto au clavier, 2 chocs et 56 % en contrôle direct. La tolérance du premier service demeure ; la route ne devient pas gratuite.
- Frapper dès que le livre est disponible contre l'inspectrice, sans esquiver : réussite possible à 3/5 PV, avec 12 gardes et 2 blessures, contre 5/5 et aucune garde pour la réponse attentive. Cela nuance la revue 0.54 : l'échec du martèlement dépendait aussi de sa cadence et de sa distance. **Le boss n'exige pas une stratégie parfaite pour réussir le premier service.** Garder cette tolérance pour l'essai humain avant de changer sa difficulté.
- Tampon et balayage, ainsi que préparation du vigile et de l'élève, surviennent depuis leurs entrées réelles. Les tests ne prouvent pas à eux seuls qu'un débutant les distingue visuellement.

## Chargement et rendu observés

Inventaire : 24 PNG, 51 295 837 octets compressés ; 151 013 120 octets de pixels sources RGBA avant copies/atlas. HTML autonome : environ 70 Mo. Le nettoyage des textures ne réduit pas le poids du HTML, et aucun objectif mobile universel n'est annoncé.

La compilation de production a été observée dans le navigateur intégré Codex sur ce poste, servie en localhost. Ce n'est pas un lancement du HTML autonome par `file://` : la compilation JS et les images sont les mêmes, la livraison HTML diffère.

- Ouverture de l'atelier compilé : prêt à 5,35 s depuis la navigation, dont 1,18 s de préparation synchrone des textures. Une interruption de démarrage a déclenché la protection existante ; cet échantillon d'une frame ne sert pas à estimer la fluidité.
- Lancement du jeu compilé puis départ normal : prêt à 4,58 s, préparation 1,15 s. Export réellement obtenu depuis « Exporter mon essai » : `work/journal-browser-056.json`.
- Sur cet essai de 20,45 secondes (cruising → DATA → début de route à faible vitesse), 2 095 intervalles : médiane 10 ms, p95/p99 11 ms, maximum 65,3 ms, aucune interruption > 1 s. Cela soutient une bonne cadence sur ce tronçon ; cela ne valide pas une journée entière à 260 km/h ni le téléphone.
- Heap JavaScript Chromium dans ce dernier export : environ 258 Mo utilisés. Donnée facultative, hors GPU. La valeur peut refléter les copies/compilations et le ramasse-miettes ; ne pas la confondre avec la somme des textures ou comparer directement le serveur de développement et la compilation.
- Rendu observé après libération : route/voiture, inspectrice, vigile et contact du livre. Aucune erreur/warning console relevé dans la page compilée contrôlée.

Les intervalles sont relevés une fois par frame de jeu, avant les sous-pas de simulation. Menu, pause et pas manuels sont exclus. Les longues interruptions sont séparées des percentiles. Le journal n'envoie rien à un serveur et ne relève ni identité ni historique de navigation.

## Vérifications et livraison

`npm test` : 18 scripts passent, dont ces 60 parcours et les essais d'erreur. TypeScript/Vite et contrôle de l'export autonome/13 raccourcis passent. Avis connus conservés : poids du bundle Vite, API expérimentale de suppression TypeScript de Node. Grille complète : `work/mission-results-056.csv`, traces : `work/mission-results-056.json`, inventaire : `work/resource-budget-056.json`.

`Jouer-Technoprof.html`, copie figée `Jouer-Technoprof-0.56.html`, archives `Technoprof-0.56-local.zip` et `Technoprof-0.56-testeurs.zip`. La 0.55 reste intacte.

## Ce qui ferme réellement le lot 1

À réaliser avec un joueur extérieur, puis le téléphone de référence choisi : découvrir le trajet sans guidage, distinguer les menaces, expliquer une chute/un choc et le résultat, relever chargement hors connexion et cadence pendant route rapide et combat. Exporter l'essai depuis la pause ou le bilan et joindre quelques phrases de ressenti. Les premières mesures PC sont disponibles ; le modèle de téléphone et la découverte humaine restent en attente. Une réduction/organisation des ressources sera prioritaire si cette mesure révèle un lancement ou un rendu trop coûteux, avant la production massive du lot 2.
