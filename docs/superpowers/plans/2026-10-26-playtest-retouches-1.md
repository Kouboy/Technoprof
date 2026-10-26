# Corrections de playtest — première salve

> **For agentic workers:** Exécution directe dans la session, avec vérifications techniques et observation dans les navigateurs.

**Goal:** Rendre X/B interchangeables, corriger l’échelle de l’infirmerie Berthelot et harmoniser passages, cours et ouverture de l’intro.

**Architecture:** Garder les actions abstraites et les événements audio existants. Les changements d’échelle et de lettrage restent dans la présentation ; les samples sont produits hors ligne puis intégrés à la banque PCM existante.

**Tech Stack:** TypeScript, Phaser, Web Audio, PCM mono 8 bits / 11 025 Hz, tests Node et navigateurs Playwright.

**Spec:** Demande utilisateur du 26 octobre 2026 ; exécution autonome déjà demandée dans cette conversation.

## Contraintes

- Aucun changement de règles, topologie, dégâts, chrono ni durée des transitions.
- X et B commandent la même action logique ; maintien et appuis simultanés ne produisent pas de double action.
- Infirmerie : préserver l’ancrage au sol, le soin complet unique et les dialogues.
- Conserver le noir, « Bon. Reprenons. » et « Une heure plus tard… » ; utiliser le lettrage pixel du jeu.
- Fondu d’entrée de l’intro : 1 → 2 secondes, sans changer le montage musical.
- Livraison locale ; publication non incluse dans cette passe de corrections.

## Points de vigilance

Maintien de X/B pendant changement de phase ; pause/reprise au milieu d’un passage ; entrée/sortie de l’infirmerie sans accumulation d’échelle ; lisibilité du cours sur téléphone ; aucun changement du fondu final ni des coupes brutales du rêve.

## Étapes

- [x] Tester puis ajouter l’alias X dans `src/gamepad-input.ts`, mettre à jour les aides et bulles. Vérifier école, dialogues, cours, menus, échec, maintien/simultané/focus.
- [x] Ajuster les deux personnages de l’infirmerie A3 dans `src/new-school-art.ts` et `src/bruel-navigation-art.ts`. Observer le mobilier, la porte et les deux silhouettes ensemble, puis à la sortie.
- [x] Renforcer les cues de passage dans `src/audio.ts` et les samples escalier/porte dans `tools/compose-sfx.py`. Tester les trois identités, les surfaces, pause/reprise et absence de doublon à 30/60/120 fps.
- [x] Créer une présentation dédiée du cours en bitmap, reliée aux phases existantes. Vérifier centrage et composition sans ajouter de dialogue ou panneau superflu.
- [x] Porter `CINEMATIC.openingFadeSeconds` à 2 et adapter le test d’alpha ; préserver la durée totale et les autres fondus.
- [x] Exécuter les suites concernées, `npm test` et `test:playtest`, observer les changements en Chrome/Firefox, reconstruire la journée autonome et vérifier le lancement local.

## Vérification

Les captures et journaux de navigateur restent dans `work/checkpoints/retouches-1/`. Le fichier personnel `work/github-pages-mobile-061.png` reste intact. Chaque résultat et éventuelle limite perceptive sont consignés ci-dessous avant livraison.

- `npm test` : PASS, puis nouvelle exécution PASS après retrait du HUD pendant les intertitres.
- `npm run test:playtest` : PASS ; après la dernière correction de présentation, suites CADRE/interface/séquences et TypeScript relancées.
- `node tools/check-retouches-browser.cjs` : PASS Chrome + Firefox. Mesures réelles : professeur 100,8 px, infirmière 99 px, pieds y=163 ; retour à l’échelle 0,18 dans le couloir. Dialogue X/B, soin complet, chrono suspendu, porte/escalier/pas sur plancher effectivement déclenchés. Aucune erreur navigateur.
- Observation des captures desktop et téléphone : lettres bitmap, hiérarchie et centrage vérifiés. Une capture Chrome prise immédiatement après redimensionnement était incomplète ; le script attend désormais un rendu après resize (les captures Firefox et desktop étaient correctes).
- Correction révélée par observation : le CADRE et son pied de page restaient visibles pendant l’ellipse. Ils sont maintenant masqués pendant les quatre phases de cours/noir, avec test de non-régression.
- Samples de passage : 8 bits mono / 11 025 Hz ; 2 variantes de porte courte (480 ms) et 2 d’escalier (500 ms), queues sonores autorisées après la transition visuelle. Les musiques et la durée des fondus entre pièces restent intactes.
- Relecture indépendante commencée : vérifications ciblées réussies et deux aides B/A-B complétées en B-X/A-B-X. La relecture finale a été interrompue par la capacité du modèle ; revue finale faite par l’auteur, sans prétendre à une validation indépendante complète.
- `npm run build`, `npm run build:journee`, `node work/check-local.cjs` : PASS. Ouverture directe du HTML journée en mode hors connexion : PASS Chrome + Firefox (titre, musique native d’intro, accès au menu pour passer le film, conduite et pause).
- Référence 0.61 inchangée : SHA-256 `05713e027d7dcb4b5cd8aaa6e2e74b53d1ea45526215e33cc8fe4e905b94dd65`.
- Limite de validation : manette standard simulée dans les navigateurs ; le ressenti matériel et le jugement musical final restent ceux du playtest humain. Aucune publication dans cette passe.
