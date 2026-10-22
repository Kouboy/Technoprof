# Day assets implementation plan

> Exécution par superpowers:executing-plans dans l'atelier existant autorisé.

**Goal:** livrer la même journée avec moins d'images embarquées et décodées.
**Architecture:** profil Vite day, catalogue explicite, constructeurs acteurs seuls,
export autonome séparé. Le build complet conserve les scénarios historiques.
**Tech Stack:** TypeScript, Phaser, Vite, Node, Playwright.
**Spec:** docs/superpowers/specs/2026-10-22-day-assets-design.md.

## Contraintes et revue

Conserver rendu, règles, contrôles et livraison locale. Ne pas modifier la 0.61.
Vérifier les acteurs partagés, le fond pro de la cour I2, l'infirmière, les reprises
après pause et les URL d'atelier appliquées par erreur au fichier journée.

## 1. Catalogue de compilation
- [x] Test en échec de sélection, intégrité et refus d'une clé manquante.
- [x] tools/asset-catalog.cjs et vite.config.mjs : données complètes par défaut,
      sous-ensemble strict seulement en mode day.
- [x] Vérifier le test et relever les octets exclus : 17 111 963 dans le catalogue,
      plus les modules complets éliminés par le drapeau de compilation.

## 2. Préparation des renderers
- [x] Test en échec de preload sans anciens décors.
- [x] src/asset-profile.ts ; options legacyBackgrounds dans les renderers partagés.
- [x] main.ts : préparation historique conditionnelle et accueil day imposé.
- [x] Compiler et vérifier les tests de rendu existants.

## 3. Livraison et preuve en situation
- [x] tools/export-day.cjs, scripts npm et export-navigation : build day indépendant.
- [x] Vérifier deux autonomes, dix-neuf raccourcis et réduction effective du poids.
- [x] Tests journée et tests techniques appropriés ; contrôle natif des trois lieux
      et comparaison avec l'atelier complet, inventaire textures et erreurs.
- [x] Documenter les mesures et revue finale ; enregistrement de l'atelier après vérification.

## Décisions vérifiées

- Conserver bruel-backgrounds : le premier passage natif a révélé son usage dans
  le stationnement Berthelot. Le test de preload requis a été corrigé en échec,
  puis l'asset rétabli : pas de substitution de décor pour gagner des octets.
- La revue a identifié le bootstrap HTML historique encore sensible à essai=labo.
  Le profil day le remplace ; test rouge puis vert sur les options et états DOM.
- Comparer le framebuffer et les pixels RGBA, avec graine fixe et arrêt du callback
  de simulation Phaser. Les captures CSS et les octets PNG Firefox sont impropres
  à cette comparaison exacte. Les horloges restent explicitement vérifiées figées.
- Résultat : 48 vues identiques dans Chromium et Firefox, fichier autonome lancé
  hors connexion dans les deux, 135 087 516 → 100 060 673 octets.
