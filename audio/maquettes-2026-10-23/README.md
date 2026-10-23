# TECHNOPROF — Maquettes musicales 01

Ouvrir **Ecouter-Technoprof.html** dans ce dossier. Aucun serveur, aucune connexion. Les cinq fichiers WAV doivent rester à côté du lecteur. Un seul morceau joue à la fois ; les boucles peuvent être désactivées.

Premières propositions originales à auditionner, **non intégrées au jeu** : titre de 48 s, autoradio de 34,3 s et trois thèmes d’établissement de 30 à 37 s. Les valeurs de durée et les mesures techniques exactes figurent dans manifest.json.

## Direction

- **Titre / Physique appliquée — 120 BPM** : pulsation lourde, motif de menace et accents de cuivres / cordes échantillonnés. Composé avec des idées de tension et d’énergie de cinéma d’action, sans reprendre les thèmes de films cités.
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
5. La pause / perte de focus devra suspendre la musique ; reprise au même endroit. Un réglage de volume musical séparé est à prévoir à l’intégration.

Les thèmes d’établissement devront laisser entendre les impacts et les signaux d’attaque, s’effacer pendant l’infirmerie et laisser les cloches / sons de classe seuls pendant l’ellipse. Ces règles sont une proposition de mixage pour l’intégration ; aucune n’a été ajoutée au code du jeu pendant cette passe d’écoute.

Les contrôles techniques (fichiers, format, décodage, amplitude, jonctions et lecteur navigateur) ne remplacent pas le choix à l’oreille : grain, mélodie, fatigue d’écoute et équilibre avec les SFX restent à tester humainement.
