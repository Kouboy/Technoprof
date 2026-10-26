# Compteur de vies de profil et dernier boss

Demande : réutiliser le visage de profil existant, réduire le compteur et retirer son cartouche ; appliquer ce portrait à la perte de vie ; supprimer les indications de mouvements sous le dernier boss.

- Découper une fois la tête 94 × 99 depuis la texture `prof`, nettoyer le liseré de chroma et mettre le portrait transparent en cache. Aucun nouveau PNG ni traitement du corps.
- HUD : tête 14 × 15 pixels logiques, nombre bitmap 7 pixels, contour sombre d’un pixel, sans fond. Compteur central : même frame, plus grande, timings et règles conservés.
- Supprimer les flèches/crochets sous le boss sécurité uniquement. Conserver ses animations, sons, impacts, jauge et les repères des gardes ordinaires.
- Vérifier les limites du crop, le détourage, le nettoyage entre phases et l’animation 3→2/1→0 ; observer route, dialogue, boss et perte de vie en navigateur, puis reconstruire le jouable local.

## Validation

- `npm test` PASS ; après nettoyage du liseré, tests de rendu/vies/boss, préchargement journée et TypeScript relancés : PASS. Les règles et timings de vies restent inchangés.
- Tests de portrait : prélèvement exact de la tête, transparence des pixels violets sans effacer peau/cheveux gris, HUD sans rectangle de fond, dimensions 14 × 15, même texture agrandie à 42 × 44 pendant le décompte, nettoyage des couches avant radiation/titre.
- Rendu réel du boss : aucune ligne d’indication sous ses pieds, jauge de vie toujours dessinée. Les animations et signaux de combat existants passent encore leurs tests à 30/60/120 fps.
- Chrome et Firefox PASS via `tools/check-profile-counter-browser.cjs` : portraits HUD/décompte inspectés, grand écran et 390 px, détourage transparent vérifié dans la texture, dernier boss observé sans marqueurs, aucune erreur navigateur.
- Le premier essai visuel a révélé un liseré violet dans le sprite source ; son nettoyage est limité au portrait mis en cache, sans toucher l’atlas du professeur. Les appuis du test de dialogue ont été espacés pour garantir l’échantillonnage du relâchement.
- Builds normal et journée PASS ; vérification des fichiers autonomes et ouverture hors connexion Chrome/Firefox PASS (titre, audio, introduction, conduite et pause).
- Livraison locale via `Jouer.cmd`. Référence 0.61 inchangée ; aucun déploiement de cette retouche. Les métriques régénérées restent dans `work/checkpoints/profile-counter/metrics/`.
