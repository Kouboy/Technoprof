# Maquette V3 — trajet rêvé et contrastes sonores

Demande : ajouter entre invitation et établissement un trajet illustré, de profil. Jeune professeur au volant, parlant joyeusement ; vieux professeur au premier plan se frottant les yeux, désorienté. Voiture neuve, sobre et propre ; quartier résidentiel neuf, arboré, paisible au lever du jour. Aucun dialogue audible ni texte ajouté.

Réglage initial : six secondes à 19–25 s, donc montage 69 s. Les plans scolaires sont décalés de six secondes ; panorama toujours dernier plan rêvé à 56–62 s, cloche 62 s, réveil 63,2 s. Le bureau reste de nuit, la veste portée jusqu’au rêve et retirée au réveil final.

Livraison d’une **V3 d’écoute isolée**, V1/V2 conservées, sans modifier jeu ou Pages. Le nouveau plan est une vignette de la fin, distincte du quatrième trajet jouable vers Maison, conservé pour plus tard.

- [x] Générer et relire l’image de profil : places conducteur/passager, volant, mains, lunettes et continuité des personnages.
- [x] Recaler musique et repères sur 69 s ; renforcer le bureau initial avec graves et pulsation pesante, garder le rêve sincèrement heureux, puis couper l’espace sonore à la cloche.
- [x] Renforcer le réveil avec alarme plus sèche et physique, fauteuil et papiers ; aucune harmonie résiduelle après la cloche.
- [x] Préparer lecteur V3 avec quatorze images et guide de montage, son comme horloge, pause/seek.
- [x] Vérifier durée, niveaux, sources 8 bits, placement des sons, lecture hors connexion et cadrages ; livrer lien local.

## Livraison et vérification

Lecteur `audio/cinematiques-2026-10-25-v3/Voir-La-Fin-V3.html`, trois WAV, partition, dix instruments sources 8 bits plus l’alarme 8 bits dédiée. Image originale imagegen inchangée et prompt conservés dans `art/cinematics-2026-10-25-v3/`, relue à la taille du lecteur sur bureau et mobile : conducteur au volant, passager au premier plan, main aux yeux et une seule paire de lunettes tenue à part, voiture propre et quartier paisible à l’aube.

Durée exacte 69 s ; trajet 19–25 s ; panorama 56–62 s ; cloche 62 s et réveil 63,2 s. Aucun trou dans les quatorze scènes. Silence musical numérique après 62 s et voix finales tenues au-delà de la coupe pour éviter un fondu annonciateur. Pas d’écrêtage, pic du mix −5,89 dBFS, somme des stems à deux LSB près. Début du bureau à −22,17 dBFS RMS contre −30,17 en V2 ; fraction d’énergie sous 220 Hz passée de 0,445 à 0,963, après abaissement du motif et ajout de la pédale grave. Alarme enrichie d’harmoniques sèches, fauteuil/papiers au réveil.

Lecture native hors connexion Chrome et Firefox : audio réel, quatorze images, pause stable, seek, raccords cloche/réveil puis fin sans erreur JavaScript. Test tactile Chromium et absence de débordement horizontal. Quatorze captures vérifiées sans bandes de fond uniformes dans le cadre ; nouvelle scène de voiture revue visuellement sur bureau et mobile. Rapports `verification.json`, `browser-verification.json`, `frame-verification.json` dans le dossier de l’audition.

V1, V2 et jeu inchangés ; aucun déploiement Pages. L’appréciation musicale reste à valider par écoute humaine.
