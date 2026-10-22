# TECHNOPROF — Physique appliquée

Jeu d’action rétro satirique français : rejoindre une affectation en voiture,
traverser un établissement dégradé, puis faire cours avant la fin du délai.

## Jouer à la version d’atelier actuelle

Ouvrir **Jouer-Technoprof-Journee-Atelier.html**, puis **Prendre le service**.
Ce fichier autonome fonctionne sur disque, hors connexion. Il enchaîne les trois
trajets et les établissements validés : Ormeaux H1, Auguste-Berthelot A3 et
Trois-Ponts I2. Le journal d’essai réunit toute la journée.

Pour le régénérer depuis les sources (Node.js 24 et npm) :

```sh
npm ci
npm run build:atelier
```

Le build produit deux fichiers autonomes : `Jouer-Technoprof.html` (moteur commun
et anciens essais) et `Jouer-Technoprof-Journee-Atelier.html` (journée actuelle).
La journée utilise un profil de compilation dédié : environ 100 Mo contre
135 Mo pour l'atelier complet, avec les mêmes images utiles et sans les anciens
arrière-plans. `npm run build:journee` régénère uniquement ce fichier ;
`npx vite --mode day` permet de vérifier ce profil en développement.
Les dix-neuf autres lanceurs sont de petits raccourcis ; conserver
`Jouer-Technoprof.html` à côté pour les utiliser. Les exports sont ignorés par Git.

La [0.61 publiée](https://kouboy.github.io/Technoprof/) et la
[release v0.61](https://github.com/Kouboy/Technoprof/releases/tag/v0.61) restent
les références publiques antérieures à l’atelier. Elles ne sont pas mises à jour
par les envois sur cette branche. Le HTML local `Jouer-Technoprof-0.61.html`
reste intact ; les versions 0.40–0.60 sont rangées dans `archives/versions/`.

## Développer et vérifier

```sh
npm run dev
npm run test:rapide
```

| Commande | Usage |
| --- | --- |
| `npm run test:rapide` | Règles principales, conduite, lumières, audio de route et voiture |
| `npm run test:journee` | Trois trajets + H1/A3/I2, commandes, soins, transitions et bilan à 30/60/120 fps simulés |
| `npm run test:assets` | Catalogue de compilation, images retenues intactes et préchargement des acteurs partagés |
| `npm run test:retouches` | Nouveaux délais/dégâts, radio et claquement de portière |
| `npm run test:signaletique` | Panneaux et rendu des trois établissements |
| `npm run test:sequences` | Entrée en classe, échecs et feedbacks sonores |
| `npm run test:hanouna-h1` | Premier établissement et Inspectrice |
| `npm run test:inshape-i2` | Lycée professionnel et détour de soin |
| `npm test` | Régressions historiques complètes ; à lancer avant livraison |
| `node work/check-local.cjs` | Après build : autonomie et raccourcis sans copie d’assets |

Les anciens tests numérotés restent utiles : leurs numéros décrivent le moment
auquel ils ont été ajoutés, pas leur obsolescence. L’essai humain reste nécessaire
pour le gamefeel, l’écoute et le téléphone physique.

Commandes : flèches ou ZQSD ; Espace pour sauter ; F/X pour frapper et avancer
les répliques. La souris et le toucher utilisent directement la scène.

## Se repérer dans le projet

- `src/` : jeu, rendu, données et images intégrées.
- `art/` : sources artistiques.
- [docs/](docs/README.md) : documents d’atelier, audits et historique du design.
- `tools/` : outils maintenus de rangement et de profilage.
- [work/](work/README.md) : tests, pilotes et anciens outils de fabrication.
- [archives/](archives/README.md) : anciennes livraisons locales, avec manifestes.
- `dist/` : build web complet généré ; `dist-day/` : build journée ; `node_modules/` : dépendances locales.

Le [bilan de nettoyage et de profilage](docs/technique/NETTOYAGE-2026-10-22.md)
distingue les premiers gains du [chargement allégé de la journée](docs/technique/ASSETS-JOURNEE-2026-10-22.md).
L’[historique Git](HISTORIQUE.md) décrit les sauvegardes importées.

GitHub Pages publie `dist/` uniquement après un envoi sur `main`, via
[pages.yml](.github/workflows/pages.yml). La branche d’atelier conserve les essais
locaux et la 0.61 publiée intacte.
