# TECHNOPROF — Maquettes musicales 01

Ouvrir **Ecouter-Technoprof.html** dans ce dossier. Aucun serveur, aucune connexion. Les cinq fichiers WAV doivent rester à côté du lecteur. Un seul morceau joue à la fois ; les boucles peuvent être désactivées.

Titre V2 de 48 s à auditionner ; autoradio de 34,3 s et trois thèmes d’établissement de 30 à 37 s conservés à l’identique. Les quatre morceaux acceptés peuvent maintenant être essayés dans le profil local musical séparé. Les valeurs de durée et les mesures techniques exactes figurent dans manifest.json.

## Direction

- **Titre V2 / Danger et fatigue — 80 BPM** : pédale grave, cuivres bas, impacts métalliques espacés et cordes sans résolution. La version précédente était trop guillerette selon l’essai humain ; retrait du motif aigu et de la progression majeure. Le niveau RMS de comparaison reste -19 dBFS : le changement porte sur le tempo, le registre, les timbres et la composition.
- **Autoradio / Service continu — 112 BPM** : guitare rythmique, réponses de guitare claire, basse et batterie sèche ; petit filtre de poste et souffle. Instrumental.
- **Ormeaux / Première sonnerie — 104 BPM** : tension plus espacée, petits timbres de verre et nappes ternes.
- **Berthelot / Quatre couches de beige — 116 BPM** : motif pincé, cordes usées, rythme plus nerveux.
- **Trois-Ponts / Dernier service — 128 BPM** : basse insistante, ponctuations métalliques et batterie plus serrée.

Palette commune : samples courts de basse pincée, guitare claire / saturée, cordes majeures / mineures / suspendues, cuivre synthétique, verre, grosse caisse, caisse claire, charleston, tom et cymbale. Ces samples sont **fabriqués par synthèse puis quantifiés en PCM 8 bits**, pas enregistrés sur de vrais instruments. Aucun sample externe, soundfont, extrait de film ni voix.

## Sources et rendus

Les `.mod` sont de vrais modules à quatre pistes, avec les samples embarqués. Les WAV d’écoute sont rendus par le petit moteur d’échantillonnage du script, en stéréo resserrée à 22 050 Hz / 16 bits : les sources sonores restent les mêmes PCM 8 bits. Le poste radio reçoit un filtre et un souffle supplémentaires. Le mix WAV n’est pas une émulation électrique exacte de Paula. Les `.score.json` détaillent les notes et cellules ; ils sont régénérés par le script. Modifier la partition dans le script, ou ouvrir une copie des MOD dans un tracker.

Reconstruction depuis la racine du projet : `python tools/compose-maquettes.py` (Python + NumPy). Le script est déterministe et n’appelle aucun service. Les modules reprennent le format historique documenté par [libxmp](https://github.com/libxmp/libxmp/blob/master/docs/formats/Modfil11.txt) et les contraintes décrites dans le [manuel OpenMPT](https://wiki.openmpt.org/Manual:_Module_formats).

## Déroulé autoradio validé

1. Le bulletin reste intelligible, sans morceau dessous.
2. Après le bulletin, l’affectation arrive ; les sons de DATA / notification restent au premier plan.
3. Le morceau démarre à la fin de cette notification, au passage en conduite active, puis boucle pendant tout le trajet.
4. Arrêt dès le début de la cinématique d’arrivée ou du Game Over.
5. La pause / perte de focus suspend la musique ; reprise au même endroit. Le volume Musique est séparé dans le profil d’essai.

## Essai en jeu

Depuis la racine du projet, ouvrir **Jouer-Technoprof-Journee-Musique.html**. Il lance la journée avec `?musique=essai`. Garder ce raccourci, Jouer-Technoprof-Journee-Atelier.html et les dossiers audio/maquettes-2026-10-23 et audio/titre-reference-2026-10-23 ensemble. Les WAV restent externes et sont chargés un à un, à la demande ; le pack n’est pas ajouté au bundle du jeu.

Le profil habituel demeure sans cette musique. L’écran titre du profil musical utilise désormais l’interprétation de 60 secondes validée par Nicolas dans audio/titre-reference-2026-10-23, avec un gain de 1,8 pour la placer au premier plan. La V2 de ce dossier reste une proposition d’écoute archivée. Les thèmes d’établissement baissent pendant les répliques et se suspendent à l’infirmerie, avec reprise au même endroit. Les sons de classe et les cloches restent seuls pendant l’ellipse. Le Game Over et l’arrivée coupent immédiatement le morceau. Un bouton Écouter le titre / Relancer la musique apparaît si le navigateur bloque sa lecture. Dans l’atelier, un bouton de commande réessaie aussi la lecture après un geste réel.

`npm run build:atelier` reconstruit le raccourci avec les exports locaux. `npm run test:musique` vérifie le contrôleur et son branchement. Le profil n’est pas publié sur Pages.

La passe navigateur native hors ligne est dans `work/check-music-browser.cjs` : lancement habituel sans musique, profil musical avec quatre volumes, autoradio après notification, pause/reprise/mute, trois établissements et arrêt à l’infirmerie/arrivée/échec. `trial-browser-verification.json` consigne les passages Chromium et Firefox ; `browser-verification.json` couvre le lecteur d’écoute. Aucun de ces contrôles ne constitue une écoute artistique.

Les contrôles techniques (fichiers, format, décodage, amplitude, jonctions et lecteur navigateur) ne remplacent pas le choix à l’oreille : grain, mélodie, fatigue d’écoute et équilibre avec les SFX restent à tester humainement.
