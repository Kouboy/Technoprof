# TECHNOPROF — Physique appliquée

Jeu d’action rétro satirique français : rejoindre une affectation en voiture,
traverser un établissement dégradé, puis faire cours avant la fin du délai.

## Lien de playtest

**[Jouer à Technoprof](https://kouboy.github.io/Technoprof/)** — journée complète
Ormeaux H1 / Auguste-Berthelot A3 / Trois-Ponts I2, retour nocturne à Maison et cinématiques sonorisées.
Le lien s’ouvre directement dans un navigateur, sans installation ni compte.
Clavier, souris et toucher sont disponibles ; les commandes et quatre volumes
séparés sont accessibles depuis le menu. Le son démarre après une interaction.
Le menu de pause et le bilan permettent d’exporter le journal d’essai.

## Jouer à la version d’atelier actuelle

**Lancement conseillé : ouvrir Jouer-Technoprof-Fenetre.html**, puis **Ouvrir le jeu
dans sa fenêtre**. `Jouer.cmd` ouvre ce lanceur sur Windows. Le cadre conserve le
ratio 4:3 quand la fenêtre est redimensionnée ; les commandes Pause/son et les
sous-titres restent accessibles. Le plein écran est facultatif. En cas de blocage
des fenêtres, le lien **Jouer dans cet onglet** conserve le même affichage adapté.
Garder `Jouer-Technoprof-Journee-Atelier.html` et le dossier `audio/` à côté du
lanceur. Ce lanceur de moins de 2 Kio ne duplique pas les images du jeu.

Depuis l’onglet de jeu normal, **Ouvrir dans une fenêtre** suspend la partie en
cours et ouvre une nouvelle journée au titre. Un second clic réutilise la fenêtre
existante sans la recharger ; la progression n’est pas transférée entre fenêtres.
Le navigateur peut conserver sa barre de titre ou ouvrir un onglet selon ses
préférences. Sur téléphone, le paysage est conseillé.

Ouvrir **Jouer-Technoprof-Journee-Atelier.html**, puis **Prendre le service**.
Ce fichier autonome fonctionne sur disque, hors connexion. Il enchaîne les trois
trajets et les établissements validés : Ormeaux H1, Auguste-Berthelot A3 et
Trois-Ponts I2. Le journal d’essai réunit toute la journée.
Les trois affectations doivent réussir : le premier échec interrompt la journée,
et recommencer repart du début. Après le dernier cours, retour protégé de 3 km à
Maison, stationnement, portière et marche lente jusqu'à l'appartement, puis fondu
noir de deux secondes avant la conclusion.

Les cinématiques validées sont automatiques et sans dialogue : introduction
nocturne de 10 secondes avec ouverture depuis le noir, conclusion de 69 secondes
et quatorze images, jusqu'à la cloche qui brise le rêve. Musique et bruitages
conservent leurs volumes séparés ; les images suivent l'horloge sonore. Pause
suspend le film ; « Passer la cinématique » passe la séquence entière.
[Montage et synchronisation](docs/cinematiques/INTEGRATION.md).
Pour jouer avec la musique sur disque, ouvrir **Jouer-Technoprof-Journee-Musique.html**
et conserver le dossier `audio/` ainsi que le HTML journée à côté du lanceur.

Pour voir la conclusion sans gagner la journée, ouvrir **Jouer-Labo.html**, choisir
le scénario **Cinématique / conclusion muette (animatique)**, puis **Rejouer**.

Pour le régénérer depuis les sources (Node.js 24 et npm) :

```sh
npm ci
npm run build:atelier
```

Le build produit deux fichiers autonomes : `Jouer-Technoprof.html` (moteur commun
et anciens essais) et `Jouer-Technoprof-Journee-Atelier.html` (journée actuelle).
La journée utilise un profil de compilation dédié : environ 128 Mo contre
163 Mo pour l'atelier complet, avec les mêmes images utiles et sans les anciens
arrière-plans. `npm run build:journee` régénère uniquement ce fichier ;
`npx vite --mode day` permet de vérifier ce profil en développement.
Les dix-neuf autres lanceurs sont de petits raccourcis ; conserver
`Jouer-Technoprof.html` à côté pour les utiliser. Les exports sont ignorés par Git.

La [release v0.61](https://github.com/Kouboy/Technoprof/releases/tag/v0.61) conserve
la référence publique antérieure à l’atelier. Le site Pages sert désormais la
journée actuelle avec musique. Le HTML local `Jouer-Technoprof-0.61.html`
reste intact ; les versions 0.40–0.60 sont rangées dans `archives/versions/`.

## Développer et vérifier

```sh
npm run dev
npm run test:rapide
```

| Commande | Usage |
| --- | --- |
| `npm run test:rapide` | Règles principales, conduite, lumières, audio de route et voiture |
| `npm run test:playtest` | Validation consolidée de la journée actuelle : interface, gamefeel, musiques, cinéma, SFX, assets, signalétique, textes et fenêtre |
| `npm run test:fenetre` | Ouverture, réutilisation, blocage et repli, plein écran refusé/accepté |
| `npm run test:lettres` | Rendu bitmap identique et réduction du nombre de rectangles |
| `npm run audit:projet` | Inventaire en lecture seule et accessibilité des modules depuis le jeu |
| `npm run test:journee` | Trois trajets + H1/A3/I2, commandes, soins, transitions et bilan à 30/60/120 fps simulés |
| `npm run test:cinematiques` | Règle 3/3, échec terminal, films 10/69 s, son synchronisé, pause et cadrages validés |
| `npm run test:assets` | Catalogue de compilation, images retenues intactes et préchargement des acteurs partagés |
| `npm run test:musique` | Treize thèmes, priorités, pauses et reprises |
| `npm run test:sfx` | Samples low-fi, variantes, sols, pas/cinématiques, portes/escaliers et interruptions |
| `npm run test:pages` | Export web : images inchangées, treize thèmes et quatre stems cinéma |
| `npm run build:pages` | Journée musicale pour Pages, puis vérification du contenu de `dist/` |
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
- `audio/sfx-2026-10-24/` : palette SFX originale, prises WAV et écoute ; les mêmes PCM sont intégrés au jeu pour le lancement sur disque.
- [docs/](docs/README.md) : documents d’atelier, audits et historique du design.
- `tools/` : outils maintenus de rangement et de profilage.
- [work/](work/README.md) : tests, pilotes et anciens outils de fabrication.
- [archives/](archives/README.md) : anciennes livraisons locales, avec manifestes.
- `dist/` : build web complet généré ; `dist-day/` : build journée ; `node_modules/` : dépendances locales.

Le [bilan de nettoyage et de profilage](docs/technique/NETTOYAGE-2026-10-22.md)
distingue les premiers gains du [chargement allégé de la journée](docs/technique/ASSETS-JOURNEE-2026-10-22.md).
L’[historique Git](HISTORIQUE.md) décrit les sauvegardes importées.
La [passe fenêtre et nettoyage du 25 octobre](docs/technique/FENETRE-NETTOYAGE-2026-10-25.md)
documente les vérifications, le rangement et les limites des optimisations.

GitHub Pages publie `dist/` uniquement après un envoi sur `main`, via
[pages.yml](.github/workflows/pages.yml). Le workflow vérifie la journée, la
musique et les assets avant de construire et publier le site. Le mode `pages`
sépare les images du JavaScript, préserve leurs octets et copie uniquement les
douze WAV utilisés. Les fichiers `build-info.json` et `.nojekyll` sont générés ;
le premier identifie le commit servi. La branche d’atelier conserve les essais
locaux ; la release et le HTML figés 0.61 restent intacts.

Pour vérifier le build sous `/Technoprof/` dans Chromium, Firefox et une fenêtre
tactile mobile, lancer `node work/check-pages-browser.cjs` avec Playwright
disponible (`PLAYWRIGHT_MODULE` peut désigner son module installé). Le même test
accepte `PAGES_URL` pour contrôler le déploiement public.

La palette SFX se régénère avec `python tools/compose-sfx.py` (NumPy requis).
Les gains restent dans `src/audio-materials.ts`, les surfaces et contacts de pas
dans `src/soundscape.ts`, les séquences et le mix dans `src/audio.ts`.
`audio/sfx-2026-10-24/Ecouter-SFX.html` permet d'écouter chaque prise séparément.
