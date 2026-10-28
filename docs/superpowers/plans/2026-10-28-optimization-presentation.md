# Optimisation sans perte et présentation — premier lot

> **For agentic workers:** Use executing-plans for integration, with independent audit and mechanical test support. The public playtest stays unchanged.

**Goal:** Réduire la mémoire et le travail au démarrage sans changer les pixels, le son ou le gameplay ; préparer un kit graphique GitHub Pages / itch.io / partage.

**Architecture:** Remplacer les CanvasTexture immuables par des Texture normales partageant le même canvas, sans ImageData conservée. Garder les sources et les codecs courants dans ce lot. Exclure explicitement cinq assets historiques du build joueur. Ajouter un chargement HTML léger, une icône et des métadonnées de partage ; les grands visuels promotionnels restent hors du preload du jeu.

**Tech Stack:** TypeScript, Phaser 4.2.1, Vite, tests Node/Chrome/Firefox, PNG et exports dimensionnés, imagegen pour les nouveaux masters raster.

**Spec:** Demande du 28 octobre : alléger au maximum sans réduire la qualité, privilégier fluidité/stabilité ; icônes, chargement, bandeaux et miniatures. Périmètre confirmé : GitHub Pages, itch.io et partage des liens. Travail local pendant la campagne de playtests, aucune publication automatique.

## Mesures et règles

- Baseline Pages : 169703407 octets, 49 PNG/17 WAV ; 5 PNG d'ateliers non préchargés mais encore émis = 13417019 octets.
- Baseline native : 78 textures ; ~138 Mio de snapshots ImageData redondants, ~570,5 Mio nominaux GPU+canvas+snapshots. Ce total n'est pas une mesure exacte de la RAM du processus.
- Color-key : quatre boucles créent une vue TypedArray par pixel ; garder exactement le même prédicat et les mêmes octets.
- Pas de baisse de résolution, de sampling audio, de densité, d'animation, de timings ou de fréquence d'input.
- Conserver PNG et WAV approuvés. WebP lossless/FLAC sont des candidats mesurés (pixels/PCM identiques), mais pas intégrés avant tests spécifiques des décodeurs, boucles, seeks et horloge cinéma.
- Le chargement affiche des étapes et une progression réellement observées ; pas de faux pourcentage temporel.
- Les visuels restent en pixels nets et suivent le professeur fatigué, le livre bordeaux et le logo chromé du jeu. Aucun nouveau spoiler de fin.

## Lots de cette passe

- [x] Audits chiffrés livraison et runtime, preuves conservées en checkpoints.
- [x] Générer les masters icône, couverture itch et visuel horizontal ; conserver prompts et PNG originaux.
- [x] Tester RED/GREEN l'enregistrement de textures immuables, même rendu en WebGL/Canvas et mêmes frames, sans snapshot ; migrer les seules textures préparées.
- [x] Remplacer les vues par pixel par une indexation directe ; vérifier la sortie exacte.
- [x] Exclure les cinq modules historiques des builds jour/Pages et vérifier les assets restants inchangés.
- [x] Exporter icônes/favicons, couverture630×500 et miniature315×250, partage1200×630 et bandeau960×504 ; fournir une planche locale consultable.
- [x] Intégrer le chargement CADRE léger, les icônes et les métadonnées ; vérifier mobile, faible mouvement, erreurs/étapes et fin de chargement.
- [x] Refaire mesures mémoire/chargement et tests du jeu ; reconstruire les jouables locaux, revue et commit.

## Sources et preuves

- Audits : work/checkpoints/optimization-2026-10-28/delivery-lossless-report.md et runtime/REPORT.md.
- Format itch cover : https://itch.io/docs/creators/getting-started ; ratio315:250, recommandé630×500. Banner : https://itch.io/docs/creators/design (hauteur libre).
- Partage : https://ogp.me/ (image, dimensions et texte alternatif). Format1200×630 choisi pour ce kit, sans prétendre à une obligation du protocole.
- Code Phaser inspecté : TextureManager.create/addImage/addCanvas et CanvasTexture.constructor, version installée4.2.1.

## Clôture du lot

Revue indépendante : un défaut du chemin loaderror a été corrigé par un état explicite empêchant update après initialisation incomplète, avec RED/GREEN et vrai test Phaser Chrome/Firefox. Suite test:playtest finale verte ; builds et jouables locaux vérifiés hors ligne. Mémoire retenue −137,99 Mio ; paquet Pages 169703407 → 157738801 octets, carte sociale incluse. Pas de gain FPS affirmé. Rapport : docs/technique/OPTIMISATION-PRESENTATION-2026-10-28.md. Les fichiers de métriques générés sont conservés en checkpoint et restaurés dans le dépôt ; la capture utilisateur reste intacte. Aucun push ni déploiement.
