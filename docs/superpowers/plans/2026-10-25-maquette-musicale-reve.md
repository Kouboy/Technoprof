# Essai musical : croire au rêve

Maquette demandée après validation de la direction : fatigue initiale, ouverture chaleureuse, apaisement réel devant la classe/AESH, rêve brisé uniquement par la cloche. Grain de samples PCM 8 bits cohérent avec les maquettes Amiga existantes. Aucun suspense inquiétant pendant la fin du campus et aucune anticipation musicale de la cloche.

Livrable de cette passe d’écoute : fin de 57 s dans un lecteur local autonome avec images existantes et horloge pilotée par le fichier sonore ; WAV musique seule et WAV montage avec repères. Aucun changement du jeu, de Pages ou des douze morceaux validés. Introduction et intégration définitive après retour d’écoute.

- [x] Composer une partition éditable et une palette originale de samples 8 bits ; quatre voix de lecture, piano mat, basse douce, cordes, nappe légère.
- [x] Rendre une ouverture mineure qui évolue vers une résolution franche ; 50 s de musique puis silence musical jusqu’à 57 s. Réverbération non cyclique, coupée avec la musique.
- [x] Monter sonnette à 8,5 s, cloche à 50 s, téléphone à 51,2 s, en pistes séparées et mixées pour l’écoute.
- [x] Préparer le lecteur des douze images, pause/seek/fin sans dérive entre son et image, lecture hors connexion.
- [x] Vérifier durée, samples, niveaux, coupe et lecture navigateur ; livrer l’essai sans prétendre valider le ressenti à la place de l’écoute humaine.

## Résultat de vérification

Livraison `audio/cinematiques-2026-10-25/Voir-La-Fin.html`, musique seule, repères seuls, mix et partition. Douze samples mono 8 bits ; WAV stéréo 22 050 Hz / 16 bits, 57 s exactes. Musique à zéro après 50 s, protection anti-clic de 2 ms à la coupe, pas de fondu annonciateur. RMS par partie de −25,94 dBFS (fatigue) à −20,13 (apaisement) ; pic du mix à −5,89 dBFS. Somme des stems vérifiée à deux LSB près. Rapports `verification.json`, `manifest.json`.

Lecture native hors connexion validée dans Chromium et Firefox : play, pause stable, saut à 44 s, passage cloche/réveil puis fin, sans erreur JavaScript. Image de cloche constatée à 50,03/50,02 s et réveil à 51,23/51,23 s, écart observé inférieur à 35 ms. Capture du lecteur revue en contexte ; rapport `browser-verification.json`. Aucun changement du jeu, des morceaux précédents ni de Pages. L’écoute humaine reste la validation musicale attendue.
