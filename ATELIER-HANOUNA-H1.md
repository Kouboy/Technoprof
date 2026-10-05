# Hanouna H1 — premier atelier de navigation

Premier lot de la [conception validée](CONCEPTION-HANOUNA-INSHAPE.md), après
la validation humaine de Bruel A3. H1 apprend à lire un établissement : suivre
une aile et un étage, puis reconnaître un détour de soin facultatif.

## Jouer localement

Ouvrir **Jouer-Technoprof-Atelier-Hanouna-H1.html**, dans le dossier du projet.
Le HTML contient le programme et les images, sans serveur ni réseau requis
(environ 113 Mo). Il démarre sur « Hanouna H1 / découverte du collège ».

Depuis les sources : `npm run build:atelier`, puis `npm run dev` et
`/?essai=labo&scenario=hanouna-navigation-h1`.

- Découverte : départ dans la cour, 5 PV par défaut, adversaires réels.
- Route puis collège : `hanouna-navigation-h1-road`, cruising puis affectation.
- Jonction et soins : `hanouna-navigation-h1-care`, deux premières rencontres
  déclarées terminées, PV de départ réglables pour isoler le détour.
- Inspectrice : `hanouna-navigation-h1-boss`, présentation et combat réels.
- Départs « décor » : inspection de chaque zone avec ses accès réels.

Flèches/ZQSD, Espace, F/X, souris et gestes tactiles restent les commandes.
Le bouton Action de l'atelier affiche puis avance les répliques ; « Un pas »
permet l'inspection en pause. Exporter le journal après l'essai.

## Parcours et règles

Cour ↔ vestibule ↔ hall ↔ grand escalier ↔ palier C ↔ galerie C30–C41 ↔
jonction C42–C45 ↔ seuil 42C. La jonction offre l'unique bifurcation vers
l'infirmerie. Neuf zones au total, huit sur le parcours direct. Aucun trou.

Le parent est dans le vestibule, l'élève dans la galerie, l'Inspectrice devant
42C. Leurs PV d'origine sont conservés : 3, 2, 6. Les ennemis ordinaires utilisent
la cadence plus vive déjà validée dans A3. Aucune nouvelle attaque ni hausse de PV.
Les retours gardent les rencontres terminées ; l'arène verrouille la sortie.
Victoire → porte 42C → « Bon. Reprenons. » → ellipse → voiture.

L'infirmerie intervient après les deux premières rencontres. Entrer réserve
son unique utilisation et suspend le délai jusqu'à la sortie. L'infirmière
accueille le professeur, trois pages se lisent avec Action ; soin complet,
sortie automatique vers la jonction. Le coût reste le détour spatial.
Une seconde visite ne relance ni dialogue ni soin.

Les 240 secondes et le trajet de la première affectation restent inchangés.
L'équilibrage global attend la réunion des trois établissements et de la conduite.

## Rendu de l'atelier

La topologie a été validée lors de l'essai humain. Les [neuf décors dédiés](RENDU-HANOUNA-H1.md)
suivent maintenant ce parcours : collège français en béton des années 1970,
vitres rafistolées, rampe verte, affiches abîmées, carrelage usé. Le hall et
l'escalier ont des compositions distinctes. Le palier donne une vue de la cour
depuis l'étage, avec le bouleau et le toit du préau comme repères partagés.
Les plaques sont intégrées au décor et les accès conservent leurs commandes.
Dans l'infirmerie, mobilier et adultes ont une échelle cohérente ; l'infirmière
est ancrée sur la même ligne de sol que le professeur.
Une retouche de raccord clarifie le retour intérieur du hall vers le vestibule.
Débris, sacs et traces d'humidité sont regroupés en arrière de la ligne de marche ;
deux fuites discrètes sont animées au hall et au palier. Ce sont des éléments
de décor, sans nouveaux obstacles ni dégâts.

![Hall H1 et accès au grand escalier](work/hanouna-h1-rendu-hall.png)

## Vérification et essai humain

`npm run test:hanouna-h1` vérifie 90 connexions par les vrais contrôles,
18 séquences de soin et 12 parcours complets avec combats et ellipse,
au clavier et par pointage, à 30/60/120 fps. Les séquences de soin couvrent
PV 1/3/5, pause, focus, reprise du délai et seconde visite. Le rendu vérifie
les neuf compositions, plaques, frames chargées et nettoyage des objets.
Résultats : [rapport H1](work/hanouna-h1-results.json).

Les suites du jeu publié, A1/A2/A3 et le rendu A3 passent. Vérification native
du hall, de la montée, du palier, de la galerie, de la jonction, de l'infirmerie
et de 42C ; passage par pointage, lecture de l'accueil et retour soigné observés.
Aucune nouvelle erreur ou alerte dans la console du navigateur de cette passe.
Cela ne remplace pas la compréhension humaine du lieu ni l'essai tactile physique.

Pour le court test : faire un premier parcours sans plan, puis expliquer
grossièrement où sont l'aile C, l'étage, 42C et l'infirmerie. Le panneau du hall
doit suffire à orienter ; le soin doit être identifiable comme un détour.
Un second parcours doit permettre de retrouver volontairement la jonction,
de choisir le détour ou de le laisser, et de revenir sans hésitation inutile.

Bruel A3 et le HTML 0.61 gelé restent intacts. Branche
`atelier-navigation-bruel-a3`, sans publication sur main ou Pages.
InShape I1 est le prochain lot après la vérification humaine du rendu H1.

## Inspectrice — correction après essai humain du 4 octobre

Le retour humain signalait un boss trop difficile à toucher. Le journal montre
24 tentatives, 20 gardes et deux contacts. H1 avait hérité du boss accéléré A3 :
sa récupération de 0,65 s comprenait aussi la pose de frappe, laissant trop peu
de temps pour identifier l'ouverture, revenir et placer le livre.

Réglage propre à H1 : préparation du tampon 0,55 s, balayage 0,8 s,
récupération 1,35 s, cooldown 0,65 s. Les poses restent 0,18/0,36 s : l'ouverture
effective dure donc environ 1,17/0,99 s après leur fin. Le signal « OUVERTURE »
et la possibilité de toucher commencent ensemble après cette pose. Six PV,
portées, dégâts et vitesse d'approche inchangés. Les coups n'allongent pas
automatiquement la récupération ; la garde et la prochaine préparation reviennent.
Les autres ennemis, A3 et la 0.61 gardent leurs paramètres.

`npm run test:hanouna-h1` inclut maintenant `check-inspector-h1.cjs` :
12 reproductions de l'ancienne fenêtre trop courte et 12 combats gagnés sans
dégât en reculant, attendant 350 ms après la frappe, revenant et plaçant un contre.
Clavier/pointage, 30/60/120 fps, tampon ou balayage en première attaque.
Il vérifie aussi pause/focus, correspondance pose/ouverture et fin de fenêtre
malgré les frappes répétées. [Rapport](work/inspector-h1-results.json).
Un contre après recul a également été observé dans le navigateur natif.
Le prochain essai humain reste nécessaire pour juger le confort du nouveau rythme.

![Contre à l'Inspectrice après l'esquive](work/hanouna-h1-inspector-counter.png)
