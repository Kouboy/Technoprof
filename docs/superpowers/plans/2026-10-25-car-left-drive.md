# Correction du point de vue de la voiture — V3

Retour utilisateur : habitacle lu comme une conduite à droite et jambes du passager visibles. Cause artistique : le prompt initial associait une caméra côté passager droit avec l’avant de la voiture vers la gauche de l’image, incohérent avec la lecture physique souhaitée.

- [x] Retouche imagegen : caméra extérieure à hauteur des visages, côté passager droit ; avant vers la droite de l’image ; vieux passager proche à gauche, jeune conducteur au fond à droite ; volant sur le côté opposé à la caméra, devant lui. Bas des corps occulté par la portière, cadrage poitrine/têtes.
- [x] Remplacer l’image de la V3, actualiser provenance et lecteur, éviter une ancienne image en cache.
- [x] Vérifier le cadrage en situation sur ordinateur et mobile, les places et le volant ; confirmer les fichiers audio et les 69 secondes inchangés. Jeu et Pages inchangés.

## Vérification

Nouvelle image originale inchangée fournie par imagegen, remplaçant `art/cinematics-2026-10-25-v3/car-ride.png`. Prompt actif `prompt-car-left-drive.txt`, ancienne empreinte et nouvelle provenance dans `manifest.json`. Vue native relue sur ordinateur et téléphone : deux profils vers la droite, vieux professeur au premier plan côté fenêtre, jeune conducteur au fond avec une main au volant ; bas des corps masqué par la portière opaque, aucune jambe visible. Lunettes du vieux professeur tenues près de la poitrine.

Lecteur régénéré avec empreinte de l’image dans son URL pour invalider le cache. Chrome et Firefox hors connexion : quatorze images, lecture audio, pause/seek, cloche/réveil et fin à 69 s, aucune erreur JavaScript. Tactile et absence de débordement vérifiés ; quatorze cadres sans bandes de fond. Les empreintes des trois WAV et toute la chronologie sont strictement identiques à la V3 précédente. Aucun changement du jeu ou de Pages.
