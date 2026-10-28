# Optimisation et présentation — premier lot

Branche locale `codex/optimization-presentation`, base publique `36d91a0`. Aucun changement des règles, délais, contrôles, densités, pixels de jeu ou échantillons audio. La version publique de playtest reste inchangée.

## Résultats vérifiés

| Mesure | Avant | Après |
|---|---:|---:|
| Textures résidentes | 78 | 78 |
| Sources canvas | 48 | 48 |
| Copies ImageData des textures préparées | 144 696 456 octets | 0 |
| Readbacks au démarrage | 68 | 27 |
| Pixels relus au démarrage | 48,77 millions | 12,59 millions |
| Images émises dans Pages | 49 | 44 |
| WAV émis dans Pages | 17 | 17 |
| Paquet Pages total, carte sociale incluse | 169 703 407 octets | 157 738 801 octets |

Gain de mémoire retenue : **137,99 Mio**, constaté avec Chromium 151 et Firefox 153. Les sept minuscules buffers internes à Phaser restent présents (28 octets). Les dimensions, frames et surfaces GPU/canvas sont conservées. Le total nominal GPU+canvas+snapshots passe de 570,5 à 432,5 Mio ; ce calcul ne représente pas la RAM totale du processus. Les temps de lancement varient avec la machine : aucun gain de FPS n'est affirmé.

Les 18 sites de préparation utilisent maintenant `addPreparedTexture`. Cette fonction conserve le même canvas, les mêmes frames et les mêmes événements que `addCanvas`, sans la copie destinée aux fonctions de lecture/édition de pixels que ces textures immuables n'utilisent pas. Les textures dynamiques de Phaser restent sous son contrôle.

Les quatre boucles de détourage lisent directement les composantes RGB. La comparaison des vraies boucles sur les 16 777 216 valeurs RGB, avec des alphas couvrant les 256 valeurs, produit les mêmes octets RGBA que l'ancien détourage.

Les cinq décors historiques omis avant émission représentent **13 417 019 octets**. Ils n'étaient déjà pas préchargés pendant une partie normale : le gain concerne le paquet distribué et son stockage, sans prétendre accélérer à lui seul le téléchargement initial. Les sources originales et l'atelier complet les conservent. Les 44 PNG retenus et les 17 WAV restent identiques aux sources.

Le paquet web complet passe d'environ **161,8 à 150,4 Mio** (−7,05 %), malgré l'ajout de la carte sociale de 1,35 Mio et du chargement habillé. Cette mesure inclut les fichiers de présentation destinés aux robots de partage, que le joueur ne télécharge pas pour jouer.

## Présentation

Kit sous `art/presentation-2026-10-28/`, planche `Presentation-Technoprof.html` : icônes transparentes, favicon, couverture, miniature, carte sociale et bandeau. Masters créés avec l'outil image intégré, prompts conservés ; exports déterministes sans lissage, documentés dans le manifeste SHA-256. L'illustration de l'écran titre du jeu reste la version déjà approuvée.

Le chargement HTML reprend le métal et les teintes du CADRE, sans ressource réseau supplémentaire : petite icône embarquée, progression réelle des images puis étape de préparation. Aucun faux pourcentage temporel. Un échec de fichier affiche « Réessayer » et empêche l'update de la scène partiellement initialisée ; le bouton recharge le document.

Les métadonnées de partage et le favicon sont intégrés. La carte sociale est émise uniquement pour Pages ; le jeu ne la précharge pas. Son URL publique ne sera disponible qu'après une prochaine publication. Le kit itch.io reste à importer sur la fiche du jeu.

## Vérifications

- `npm run test:playtest`, compilation TypeScript, builds atelier/journée/Pages et `node work/check-local.cjs`.
- `tools/check-prepared-texture-browser.cjs` : Chrome et Firefox, chacun WebGL et Canvas, **zéro différence sur les 230 400 octets RGBA** du rendu comparé ; source, frames, filtres, transformations et événements préservés.
- `tools/check-presentation-browser.cjs` : chargement aux formats 1000×800, 390×844, 844×390 et 320×568, sans débordement ; étapes et reprise après erreur.
- `tools/check-loading-failure-browser.cjs` : vrai jeu Pages, PNG volontairement indisponible, aucun `pageerror`, reprise native réussie dans Chrome et Firefox.
- Jouable local `file://` hors ligne : titre, favicon embarqué, introduction, passage par Start, conduite et ratio 4:3 dans Chrome et Firefox.
- Revue indépendante : anomalie du chemin d'échec de chargement corrigée, test RED/GREEN et contrôle navigateur ajoutés.

Les scripts navigateur utilisent Playwright installé séparément, ou le chemin donné par `PLAYWRIGHT_MODULE`. Ils ne font pas partie du jeu distribué. `PLAYWRIGHT_CHANNEL=chrome` sélectionne Chrome installé pour le test des textures. Les preuves détaillées restent sous `work/checkpoints/optimization-2026-10-28/` (audits avant/après, captures, logs et rapports).

## Suite mesurée, non intégrée

L'audit expérimental de WebP sans perte et FLAC donne environ 43 % de réduction possible du paquet original, avec pixels/PCM identiques. **Ce gain n'est pas celui livré dans ce lot.** Les codecs actuels PNG/WAV restent en place ; une migration demande de vérifier les décodeurs, les boucles, les reprises après pause et l'horloge des cinématiques. Les PNG maîtres doivent conserver leurs métadonnées de provenance.

Autres pistes : réduire les marges vides des atlas sans rééchantillonnage ; profiler les allocations du rendu routier en conservant le tri des profondeurs. Ces changements demandent des comparaisons dédiées avant intégration.
