# Ledger — plan: docs/superpowers/plans/2026-10-23-gamefeel-trust-input.md

Base : a81b7b0 ; branche atelier-navigation-bruel-a3. Production non modifiée au départ. Seul fichier préexistant non suivi : work/github-pages-mobile-061.png.

Ruling: conserver la branche d’atelier existante — continuité locale validée — pas d’isolation supplémentaire nécessaire pour cette passe.

Ruling: stations manuelles rejouables plutôt qu’un nouveau mini-donjon — comparaison rapide sans nouveau LD — ne mesure pas le rythme d’une affectation complète.

Tâche 1 : terminée. Baseline test:interface vert ; nouveau test H1 rouge (200 sans aide), puis vert. Reproduction routière rouge de l’audit (9 confirmations suivies d’un choc) remplacée par confirmations après dégagement. check-gamefeel-trust couvre 30/60/120 fps, contact tardif, cooldown et recyclage.

Tâche 2 : terminée. check-gamefeel-input rouge (scénario inconnu, pièce 0 au lieu de 317), puis vert. B = 160/90 ms, A = 100/0 ms. File annulée aux états imposés, priorité de chute conservée. Trace réservée à l’atelier.

Ruling: le buffer de saut se mesure en temps contrôlable — le hit stop volontaire suspend aussi sa consommation — évite qu’un feedback d’impact mange une intention valide. Une blessure l’annule toujours.

Tâche 3 : atelier natif intégré ; en vérification navigateur et export. Chaque changement de situation/variante recommence l’essai ; export préalable explicite.

Revue indépendante (gpt-6-astra, contexte neuf, lecture seule) : deux importants (borne du saut, mesures de frames inter-essais), deux mineurs proposés (reprise P+action et décision manquante en hit stop). Les quatre reproductions sont rouges dans check-gamefeel-input avant correction.

Final: Ruling: reclasser les deux incohérences de traces en importantes pour cet atelier — son but est de distinguer une intention refusée d’un défaut de réponse ; une trace contradictoire fausse le diagnostic de tuning — correction dans la même passe, sans nouveau contrôle.

Final: Ruling: choix humain A/B, tactile physique et écoute non jugés automatiquement — la comparaison est livrée pour ces essais — aucune prétention de préférence validée. Le navigateur/export est vérifié ici. La quantification historique de frappe reste inchangée ; les stations ne remplacent pas une journée complète pour le rythme.

Final: corrections communes vérifiées rouges puis vertes dans check-gamefeel-input : premier pas décompté, runtime remis à zéro, décision de saut hit-stop explicite, P consomme les actions concomitantes. La première correction P gelait également le pas de reprise : check.cjs l’a détecté ; correction affinée pour conserver l’écoulement historique du chrono sans exécuter ces actions.

Tâches 3 et 4 : terminées. Vérifications finales vertes : npm test (suite complète, sortie 0), npm run test:gamefeel, test:journee (H1/A3/I2 à 30/60/120 fps), test:interface, test:assets, check-parent-cycle-a3.cjs. I2 care également vert avant corrections de revue ; aucune modification de sa topologie.

Build final : npm run build:atelier, sortie 0. Avertissements connus uniquement : gros bundle à assets embarqués et stripTypeScriptTypes expérimental.

Navigateur : check-gamefeel-browser.cjs sur serveur puis --offline ; Chromium et Firefox, listes A/B, trois stations, véritable clavier, export JSON identifié, rejeu propre, sortie vers journée normale, zéro pageerror. Contrôle hors ligne supplémentaire du titre/journée/menu/pause et tailles mobiles via check-interface-browser.cjs, les deux navigateurs verts. Captures et journaux dans work/checkpoints (non suivis). Tests de tailles mobiles et de glissés simulés, pas un essai humain sur téléphone.

SHA256 0.61 conservé : 05713E027D7DCB4B5CD8AAA6E2E74B53D1EA45526215E33CC8FE4E905B94DD65. Aucun changement de main/Pages ni publication. Aucun mineur de la revue restant à différer ; préférence humaine A/B en attente des essais.
