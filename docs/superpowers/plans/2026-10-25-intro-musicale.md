# Introduction — premier essai sonore de 10 secondes

Après validation de la maquette de fin, Nicolas demande de passer à l’introduction. Reprise des deux plans existants : réveil à 6h10 pendant 5,5 s, départ café/manteau/livre/clés pendant 4,5 s. Aucun dialogue ni texte narratif.

Choix d’atelier : même alarme que le réveil final, basse/piano lourds et lents au lit, puis motif plus court et pulsation pressée à 80 BPM lors du départ, sans résolution victorieuse. Bruits légers de drap/manteau, clés et pas, avec le grain de samples 8 bits des autres musiques. Retouche de lumière seulement : extérieurs encore avant l’aube, pour raccorder les deux réveils à 6h10 ; vêtements et voiture de face préservés.

- [x] Relire la retouche nocturne des deux images, sans nouveau faux raccord de lunettes, vêtements ou voiture.
- [x] Composer et rendre musique et repères séparés sur 10 s exactement ; bascule rythmique à 5,5 s.
- [x] Lecteur local synchronisé au son, deux images plein cadre, pause et lecture tactile ; lien vers la fin validée pour comparer.
- [x] Vérifier sources 8 bits, niveaux et chronologie ; contrôler Chrome/Firefox hors connexion et mobile.
- [x] Livrer une maquette d’écoute isolée, sans modifier fin validée, jeu ou Pages.

Preuves : `audio/intro-2026-10-25/verification.json` et `browser-verification.json`. Chromium et Firefox lisent le WAV local de 10 s, passent automatiquement au départ à 5,5 s, puis terminent à 10 s. Pause stable, recherche et relance testées ; Chromium tactile 390 × 844 sans débordement horizontal. Captures des deux plans et du mobile relues dans `work/checkpoints/intro-*`. Trois WAV stéréo 22 050 Hz / 16 bits, six sources exportées en 8 bits, pic du mix à −8,21 dBFS, sans écrêtage. La sensation musicale reste à valider à l’écoute par Nicolas.

Retouche après validation humaine : fondu d'ouverture depuis le noir sur la première seconde. Le son commence immédiatement ; les dix secondes et la bascule à 5,5 s restent inchangées. À l'arrêt initial et après relance, la vignette est noire ; pause et recherche suivent toujours l'horloge audio.
