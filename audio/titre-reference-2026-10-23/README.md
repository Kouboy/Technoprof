# TECHNOPROF — Interprétation courte de la composition fournie

Ouvrir **Ecouter-Titre-Interpretation.html**, ou écouter directement **Technoprof-Titre-Interpretation.wav**. Première maquette, 60 secondes à 80 BPM, contre environ 3 min 02 pour la référence.

Structure confirmée par Nicolas : **A0 → B1 → C2 → D3 → C4 → E5**. Les bornes dans l’enregistrement sont estimées : A vers 0 s, B vers 24 s, C vers 48 s, D vers 96 s, retour de C vers 132 s, E vers 168 s. L’arrangement prélève le retour de C à 144 s. Le manifeste et le lecteur indiquent les correspondances et durées. Le tempo est estimé à 80 BPM, ou 160 en double temps.

## Nature de l’interprétation

Les phrases mélodiques et harmoniques sont prélevées dans le mix fourni, avec réduction spectrale des attaques, puis réparties en deux bandes complémentaires et rééchantillonnées en **PCM signé 8 bits**. Ces bandes ne sont pas des pistes instrumentales isolées. Une basse grave et une batterie de samples synthétisés sont séquencées à nouveau. Le contour de basse du thème est une approximation musicale, pas une transcription certifiée. Les phrases gardent ainsi l’identité de la composition ; cette version n’est pas une réorchestration intégralement retranscrite note à note.

Le MOD contient exactement **quatre pistes et 26 samples**, dont vingt phrases de six secondes. Échantillonner une phrase polyphonique permet de conserver ses accords sur une seule voie de tracker. Les deux derniers tiers de la pièce source ne sont pas simplement accélérés : les répétitions sont retirées, D est réduit à six secondes et E reprend deux fois une phrase courte pour revenir vers A. La fin reste suspendue, sans cadence triomphale.

Les sources des samples sont le fichier fourni et les instruments générés localement pour les maquettes précédentes. Aucun service externe ni nouveau sample téléchargé. Le fichier d’origine n’est pas modifié ; son empreinte figure dans manifest.json. Malgré son extension .wav, il contient un flux MP3 : ffmpeg le décode avant traitement.

Le WAV stéréo est rendu à 22 050 Hz / 16 bits à partir des samples 8 bits. Comme pour les autres maquettes, le mix ajoute des réflexions courtes et resserre la stéréo ; il ne prétend pas émuler exactement l’électronique Paula. Le MOD reste éditable dans un tracker. Le niveau RMS reste à -19 dBFS pour faciliter la comparaison avec les titres précédents.

## Reconstruire et vérifier

Depuis la racine du projet, avec Python + NumPy et ffmpeg disponibles :

```powershell
python tools/arrange-title-reference.py "C:/Users/don_n/Downloads/test_song.wav"
python tools/check-title-reference.py
```

`tools/analyse-title-reference.py` produit des estimations spectrales dans work/checkpoints, sans écrire dans le fichier source. Le manifeste conserve le SHA256 d’origine ; il faut ce fichier pour régénérer les phrases. Le MOD contient déjà les samples nécessaires à sa lecture.

Les contrôles vérifient durée, ordre des sections, format des samples, amplitude, raccord et décodage indépendant du MOD par libopenmpt. Nicolas a validé cette interprétation à l’écoute.

## Écran titre de la journée musicale

L’interprétation validée est intégrée au profil local **Jouer-Technoprof-Journee-Musique.html**, avec un gain de titre de 1,8 par rapport aux musiques en jeu, soit environ +5,1 dB avant plafonnement. Au réglage Musique par défaut de 50 %, le titre joue à 90 % du volume du lecteur, contre 50 % pour la conduite. Le niveau reste borné à 100 %, sans modifier le WAV ni les autres morceaux.

La musique continue dans les réglages et les commandes de l’écran titre. Elle respecte la coupure générale du son et se suspend quand la fenêtre perd le focus ; la reprise conserve sa position. Le lancement du service l’arrête avant le bulletin radio. Si le navigateur bloque le démarrage automatique, le bouton **Écouter le titre** l’autorise par un clic ; ouvrir les réglages peut aussi autoriser la lecture.

Conserver les dossiers audio/titre-reference-2026-10-23 et audio/maquettes-2026-10-23 avec le jouable. Le lancement habituel et la 0.61 publiée restent inchangés. `npm run test:musique` couvre les règles du mix et les transitions ; `work/check-music-browser.cjs` contrôle la lecture réelle du profil dans Chromium et Firefox.
