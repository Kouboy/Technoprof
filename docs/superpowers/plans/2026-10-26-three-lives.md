# Trois vies — règle de reprise et radiation

**Intention utilisateur :** conserver trois affectations obligatoires, mais accorder trois vies sur la journée. Chaque échec, sur route, dans l’établissement ou par délai dépassé, coûte exactement une vie. Une nouvelle journée rétablit trois vies.

**Présentation :** tête pixel du professeur (lunettes, cheveux gris en bataille, barbe courte) et × nombre en haut à droite de l’aire de jeu. Après la vignette et la musique existantes d’échec, noir complet et même compteur agrandi : ancienne valeur, disparition d’une vie, nouvelle valeur. Au troisième échec, illustration de dos, livre pendant, épaules voûtées, puis gros tampon rouge RADIÉ et retour au titre.

**Reprise annoncée :** début du trajet de l’affectation échouée, cruising puis notification normale ; délai initial, 5 PV et voiture à 100 %. Affectations réussies conservées, ennemis/trous/soin réinitialisés dans l’établissement concerné, pas de nouvelle intro. Les journaux gardent les tentatives échouées. La route de retour protégée reste protégée.

**Architecture :** compteur et timing purs dans `src/lives.ts` ; phases explicites `lifeLost` et `radiated` après `fail` ; présentation indépendante dans `src/lives-art.ts`. Profil historique `legacy-two` conservé pour les anciens ateliers. L’image est intégrée comme les autres PNG, avec le tampon dessiné en jeu pour synchroniser son impact sonore.

**Réglages de présentation :** écran de vie 2,6 s, changement à 0,8 s ; Action peut écourter après 1,2 s. Radiation 6 s, tampon à 0,65 s, fondu final sur 1 s ; Action/Start peuvent écourter après 2 s. Ces durées sont des choix d’implémentation tunables, sans modifier celles du jeu ou des musiques existantes.

## Étapes

- [x] Tester 3→2→1→0, double échec, pauses et troisième radiation ; reprises des trois missions, soins/combat restaurés, progression conservée, retour protégé.
- [x] Implémenter le compteur, les phases, la remise en route et la télémétrie.
- [x] Intégrer portrait, décompte central et illustration/tampon ; éviter les bulles et jauges de boss.
- [x] Adapter Action clavier/manette/souris/touch, aide, musique et son de tampon.
- [x] Actualiser les tests dont l’ancienne règle est explicitement remplacée ; vérifier suites et navigateurs, y compris la livraison locale.

## Illustration

Outil imagegen intégré, sans API payante externe. Source : `art/radiation-2026-10-26/radiation.png`. Illustration sombre 4:3, professeur de dos à bout de forces devant une grille d’établissement, manteau brun usé, cheveux gris, livre rouge pendant. Aucun texte inclus dans le PNG ; le tampon est rendu par le jeu. Prompt complet conservé à côté du PNG.

## Résultats et arbitrages d’implémentation

- `npm test`, `npm run test:playtest`, `npm run test:journee`, TypeScript et builds normal/Pages/journée : PASS. Le budget de vies est vérifié pour les trois causes d’échec et les trois missions, avec perte unique, pause, reprise et radiation à 30/60/120 fps.
- Relecture indépendante : texte du titre devenu contradictoire et réglage de secousses ignoré corrigés ; tests du réglage `reducedShake` et nettoyage de l’ancien verrou de fondu ajoutés. Aucun autre défaut bloquant relevé.
- Panne avant notification : elle coûte aussi une vie dans le jeu normal, conformément à la règle de défaite sur route. Le dépannage des anciens ateliers reste isolé dans `legacy-two` ; le retour Maison reste protégé.
- Présentation : captures inspectées du petit portrait, des comptes 3/2/0 et du tampon RADIÉ. Les bulles réservent la zone supérieure droite ; les jauges de boss ne changent pas. Le PNG intégré est comparé octet pour octet à l’original.
- Navigateurs : parcours natif Chrome complet PASS (`work/checkpoints/lives-native.log`), puis Firefox complet PASS (`work/checkpoints/lives-native-firefox.log`). Fin réelle de la musique Game Over, compteur, Start pause/reprise, reprise après défaite à pied au toucher, dernière vie avec X, tampon non répété après pause, retour automatique au titre et musique du titre.
- Les scénarios d’atelier doivent conserver leur identifiant pour Rejouer ; un test a révélé et corrigé ce problème. Les appuis manette du test sont précédés d’une connexion au repos, pour ne pas confondre un branchement avec bouton maintenu et une nouvelle pression. Les tests d’atelier utilisent leur commande explicite de pause pour observer la radiation ; ils ne prétendent pas tester une manette physique.
- Livraison locale : `node work/check-local.cjs` PASS ; ouverture `file://` hors connexion Chrome + Firefox PASS (titre, son d’intro, passage de cinématique, conduite et pause). Journée reconstruite, aucun nouveau déploiement.
- Référence 0.61 intacte : SHA-256 `05713e027d7dcb4b5cd8aaa6e2e74b53d1ea45526215e33cc8fe4e905b94dd65`.
- Les métriques générées par les essais sont conservées sous `work/checkpoints/three-lives/metrics/` et ne polluent pas le diff. Le fichier personnel `work/github-pages-mobile-061.png` est conservé.
