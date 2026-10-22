# Chargement allégé de la journée — 22 octobre 2026

## Résultat

La journée H1/A3/I2 dispose d'un profil Vite `day`. L'atelier complet reste
disponible dans son propre HTML ; aucun PNG source ni scénario historique n'est
supprimé. Les règles, délais, contrôles et paramètres de conduite sont conservés.

| Mesure | Atelier complet | Journée |
| --- | ---: | ---: |
| HTML autonome, octets | 135 087 516 | 100 060 673 |
| Textures actives après préparation | 64 | 54 |
| Volume RGBA estimé, octets | 275 682 064 | 212 747 984 |

Soit environ 35 Mo / 26 % de livraison en moins et 63 Mo / 23 % de volume RGBA
actif en moins. Le volume RGBA additionne largeur × hauteur × 4 de chaque texture
active ; ce n'est pas une mesure de la mémoire totale du navigateur ou du GPU.
Les temps de démarrage sont consignés, mais une seule exécution ne constitue pas
un benchmark fiable du chargement ni des ralentissements dans le Firefox habituel.

## Séparation

- `vite.config.mjs` active le drapeau de compilation et le catalogue seulement en
  mode `day`. Les autres modes conservent toutes leurs données.
- `tools/asset-catalog.cjs` sélectionne explicitement les feuilles des personnages
  dans les anciens modules composites. Les URI conservées restent identiques.
  Une clé requise manquante ou une déclaration inattendue fait échouer le build.
- Les constructeurs partagés préparent les acteurs sans leurs anciens décors.
  Les arrière-plans de couloir initial, hall, aile C, passerelle, pièces calmes,
  escalier de service, local technique, escaliers central/annexe et cour initiale
  ne sont plus préchargés dans la journée.
- Les arrière-plans Bruel et pro restent nécessaires aux stationnements ; celui
  du pro sert aussi à la cour I2. La comparaison native a précisément détecté
  cette dépendance de l'arrivée Berthelot : l'image a été conservée.
- Le bootstrap HTML de la journée ignore les anciennes options d'atelier et
  conserve les aides et sous-titres joueur. Les commandes de galerie restent
  réservées au HTML complet. Le lancement ne nécessite aucune redirection.

## Vérification

- `npm test`, `npm run test:journee`, `npm run test:signaletique`,
  `npm run test:assets`, TypeScript et `npm run build:atelier` réussissent.
- Deux HTML autonomes, dix-neuf petits raccourcis : `node work/check-local.cjs`.
- Chromium et Firefox : 48 vues natives identiques entre les deux builds pour
  chaque navigateur. Cela couvre 39 pièces, trois routes, trois arrivées et
  trois ouvertures de classe, avec les acteurs et infirmières correspondants.
- La comparaison utilise le framebuffer 640 × 480 et le SHA256 des pixels RGBA,
  sans dépendre de la mise à l'échelle CSS ni de l'encodage PNG du navigateur.
  Les fixtures fixent la graine et suspendent uniquement la simulation de test ;
  les horloges sont vérifiées immobiles pendant les captures. Ce sont des tests
  de rendu, distincts des pilotes continus utilisant les commandes réelles.
- Les deux navigateurs lancent aussi le fichier livré, non instrumenté, depuis
  le disque avec le réseau coupé, jusqu'à la prise de service. Aucune erreur JS.
- Rapports : `work/reports/performance/day-assets-{chromium,firefox}.json`.
- La 0.61 conserve le SHA256
  `05713E027D7DCB4B5CD8AAA6E2E74B53D1EA45526215E33CC8FE4E905B94DD65`.
- Revue indépendante : ancien bootstrap d'atelier corrigé ; pas d'autre blocage.

## Usage et limites

`npm run build:atelier` produit les deux livraisons et leurs raccourcis.
`npm run build:journee` produit uniquement la journée dans son chemin habituel.
`npx vite --mode day` permet de travailler sur le profil réduit.

L'export reste volumineux : les images utiles sont toujours embarquées en base64,
et les trois établissements sont préparés au démarrage. Les anciens renderers
partagés restent dans le code pour leurs acteurs. Une éventuelle seconde passe
pourra extraire les seules entrées des grands atlas et étudier un chargement par
affectation ; elle devra préserver les stationnements, les retours et les pauses.
L'avertissement Vite sur les gros bundles demeure attendu pour l'export autonome.

Reproduire la vérification native :
`node tools/check-day-render.cjs <chemin-module-playwright> [chromium|firefox]`.
Le serveur et les profils de navigateur sont isolés et arrêtés après le test ;
l'instrumentation temporaire ne modifie aucun HTML livré.
