# Proposition visuelle — titre, échecs et cadre

Demande : titre illustré en pixel art 8 bits parodique de Technocop, échecs et
bords d'écran plus graphiques. Sources générées avec image_gen, puis intégration
native dans le profil atelier/journée locale. La 0.61 publiée reste intacte.
Prompt et références de départ : prompt-v1.txt.

Composition automobile validée : concept-v3.png. Après deux essais conservant une
face avant ambiguë, la voiture a été générée seule sans référence automobile,
puis entièrement remplacée dans la composition. Calandre noire, phares ronds
blancs et capot moteur rendent son orientation avant explicite. Références et
prompts conservés dans car-front-v1.png, prompt-front-car-v1.txt et prompt-v3.txt.

Maquette actuelle : concept-v8-wear.png, patine du manuel (prompt-v8-wear.txt) :
toile frottée, arêtes éraflées, coins écrasés et carton découvert, pages jaunies.
La perspective et l'emblème sont conservés. Base : concept-v7-atom.png, emblème atomique remonté et recentré sur
la couverture entière (prompt-v7-atom.txt), à partir de concept-v6-book.png.
La v6 apportait une nouvelle correction ciblée du manuel
(prompt-v6-book.txt), après rejet de la v5 : suppression du large bandeau de
reliure frontal, dos presque masqué et pages réduites à un bord étroit en fuite.
La couverture devient la seule grande face visible. Le grand logo chromé TECHNOPROF et le sous-titre
Physique appliquée viennent de concept-v4-logo.png (prompt-v4.txt). Le fichier autonome
apercu-anime.html ajoute une typographie bitmap native sur deux calques :
« (c) 2026 Brainrot Interactive Software » dans le cartouche inférieur et
« <Press Start to Teach> » sur l'image, clignotant toutes les 1,2 secondes.
Le clignotement est désactivé si le navigateur demande moins d'animations.
Reconstruction : node art/title-2026-10-23/build-preview.cjs.

Contrôle effectué hors ligne sous Chromium et Firefox : textes exacts, cadrage,
alternance visible/masquée, préférence de mouvement réduit, aucune erreur JS.
Capture de présentation : apercu-titre.png. Cet aperçu reste une maquette ; le
jouable utilise maintenant la même illustration avec de vrais contrôles natifs.

## Écran titre

Portrait dominant, manuel à la place de l'arme, vieille voiture de service,
collège français et menace bureaucratique. Grand TECHNOPROF en lettres massives,
sous-titre Physique appliquée, commande Prendre le service nettement hiérarchisée.
Logo et commandes composés séparément pour rester lisibles au clavier/toucher.
L'aide et les réglages restent accessibles sans charger l'illustration de texte.

L'illustration reste plus riche qu'un vrai écran 8 bits. Le bouton de démarrage
clignote, reste visible au focus et avec la préférence de mouvement réduit.
Commandes et Réglages se trouvent sous l'image ; les règles détaillées sont
dans Commandes. Entrée, Espace et toucher démarrent le service.

## Échecs et bilan

Vignette routière : voiture arrêtée, carrosserie abîmée et professeur à côté.
Vignette à pied : professeur épuisé dans le couloir, livre et sacoche présents.
Atlas retenu : failure-atlas-v3.png, deux images de même hauteur superposées.
Après retouches humaines : épave fumante, professeur débraillé, perspective du
livre simplifiée ; le phare cassé et son reflet restent éteints. Prompts dans
prompt-failure-atlas.txt, prompt-failure-atlas-v2.txt et prompt-failure-atlas-v3.txt.
Même palette et même traitement de contours. Conserver la raison de l'échec,
la lecture minimale et la commande pour poursuivre la journée.
Une affectation ratée n'est pas une radiation : garder cette distinction dans
les titres, les images et les boutons. Le bilan final possède son propre traitement
administratif, avec maintien/radiation et résultats lisibles.
Les retards gardent la scène réelle pour ne pas suggérer une panne inexistante.
Les illustrations arrivent au même instant que le constat, après l'animation
initiale. Les légendes restent sur les bords pour révéler les silhouettes et la
fumée ; la cause reste également dans le CADRE. Le bilan final prend la forme
d'une feuille administrative tamponnée, avec export et nouvelle journée.

## Bords de jeu

Prolonger le métal patiné du CADRE : joints, vis, marques d'usage et coins réparés.
Palette sombre, détails concentrés aux angles. Ne pas empiéter sur la fenêtre
jouable, les indices d'interaction, le compte à rebours ou la distance.
Privilégier une bordure peu coûteuse et stable pour préserver les gains Firefox.
La bordure implémentée reste dans les marges existantes de VIEW, en un seul
dessin statique à la création de scène : métal biseauté, vis et usure localisée.

## Suite proposée

Reconstruction des données : node tools/build-interface-art.cjs.
Livraison complète : npm run build:atelier. Lancer Jouer-Technoprof-Journee-Atelier.html.
Contrôles techniques : npm run test:interface, npm test, npm run test:journee.
Plan et vérifications : docs/superpowers/plans/2026-10-23-illustrated-interface.md.
