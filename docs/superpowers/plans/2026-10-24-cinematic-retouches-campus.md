# Retouches d’introduction et visite du campus

Exécution locale sur la branche de cinématiques ; aucune publication Pages.

## Intention et décisions

Les deux corrections demandées sont explicites : au réveil au lit, chemise de nuit sans manteau ni lunettes ; au départ, voiture cohérente avec sa référence de face. Le professeur conserve son identité, les onze illustrations existantes restent archivées intactes.

La fin doit gagner des étapes dans le campus idéal, sans dialogue. L’utilisateur a validé les trois ajouts proposés : cour accueillante et accessible, salle de préparation équipée, puis accompagnement individualisé par l’AESH. Douze vignettes de fin : bureau, fatigue, sonnette, visiteur, invitation, cour, couloir, préparation, classe, AESH, cloche, réveil.

## Implémentation

- [x] Générer et examiner un nouveau diptyque d’introduction avec le skill imagegen et la référence automobile de face ; conserver PNG et prompt.
- [x] Ajouter une source de texture distincte pour les deux images corrigées, sans modifier les neuf images de conclusion existantes.
- [x] Vérifier cadrage en coordonnées logiques, sélection des textures et octets inchangés.
- [x] Après décision sur la visite : ajouter les vignettes comme données ordonnées, avec repères sonores sémantiques pour que cloche et réveil ne dépendent plus d’indices fragiles.
- [x] Adapter le pilote de journée et les tests aux séquences de longueur variable ; vérifier entrée, pause, touche maintenue, conclusion complète et reprise du jeu.
- [x] Reconstruire les jouables locaux, revoir les captures, vérifier archive 0.61 et garder Pages inchangé.

## Vérification humaine attendue

Le joueur doit reconnaître un vrai réveil avant l’habillage ; voir un avant automobile crédible ; découvrir progressivement le campus et l’accompagnement humain avant le raccord cloche/réveil. Aucun texte ne doit expliquer la visite.

## Vérifications — reprise du 25 octobre

- Tests rouges puis verts de séquence et de sélection des nouvelles textures. Les repères sonnette, cloche et réveil dépendent du panneau, plus de son index dans la séquence.
- `test:cinematiques` : ordre des douze scènes, bruitages correctement placés, absence de cloche anticipée dans le campus, pause/mute, proportion et octets des trois PNG.
- `test:journee` : parcours complet à 30/60/120 fps, deux images d’introduction et douze de conclusion, chronos suspendus et échec terminal conservé.
- `test:interface` et `test:sfx` réussis ; build atelier et autonomie locale vérifiés.
- `npm test` : suite historique complète réussie, sortie 0. Rapports régénérés de diagnostic restaurés pour éviter de modifier les anciennes références.
- Test navigateur hors connexion : Chromium, Firefox et toucher mobile. Quatorze images parcourues, pause/reprise, maintien et double toucher, retour bilan, sans erreur JavaScript détectée. Captures `work/checkpoints/cinematic-*` revues pour réveil, voiture, cour et AESH.
- Build Pages préparé et vérifié (44 images intactes, douze musiques) sans publication. Main/origin main restent à b5ff56b ; archive 0.61 au SHA256 initial.
- Sources et prompts : `art/cinematics-2026-10-24/manifest-v2.json`. Le générateur a livré des cellules de campus carrées ; conservation des proportions par cadrage centré, sans étirement ni découpe des personnages. Les nouvelles musiques de cinématique restent à composer dans le lot prévu.
- Retouche demandée pendant la finalisation : la marche derrière l’élève en fauteuil est remplacée par une rampe continue à faible pente, raccordée aux paliers et bordée de mains courantes. Source active `campus-v3-ramp.png`, ancien triptyque conservé comme référence de cette édition. Aucun changement de séquence ou de gameplay.
- Après cette retouche graphique : tests de cinématiques, nouveau build atelier et autonomie locale réussis. Capture Chromium hors connexion `work/checkpoints/cinematic-campus-ramp-final.png` vérifiée visuellement dans la véritable image 6/12 ; aucune erreur JavaScript. La suite historique complète avait déjà réussi avant ce remplacement de PNG.
