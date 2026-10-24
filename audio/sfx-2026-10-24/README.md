# Palette SFX — 24 octobre 2026

37 matières et 75 prises originales : impacts pulp, souffles, pas, portes et
grille, escaliers, tôle, circulation et petites actions de la vie scolaire.

Les prises sont fabriquées hors jeu avec `tools/compose-sfx.py` (Python + NumPy),
filtrées puis quantifiées en PCM mono **8 bits / 11 025 Hz**. Il ne s'agit pas
d'extraits de films ni de banques téléchargées. Le modèle sonore vise les
impacts exagérés du cinéma d'action et le grain des musiques du projet.

- `Ecouter-SFX.html` : écoute des variantes, une lecture à la fois.
- `Palette-Technoprof.wav` : montage d'une douzaine de secondes, sans le mix du jeu.
- `manifest.json` : fréquence, profondeur, longueur et empreinte de chaque prise.
- `*.wav` : fichiers d'écoute 8 bits non compressés.
- `../../src/sfx-data.ts` : mêmes PCM signés en base64, intégrés au HTML local.

En jeu, les prises sont décodées/rééchantillonnées une fois puis mises en cache.
La lecture varie les prises et légèrement la hauteur ; les volumes, la panoramique
et une réverbération courte sont gérés par WebAudio. Moteur, roulement et fonds
continus conservent leur modulation, avec une finition filtrée/quantifiée.
Les WAV de ce dossier ne sont pas téléchargés par le jeu.
Après modification des durées dans `src/audio-materials.ts`, régénérer la banque
pour synchroniser les fichiers, leurs métadonnées et les PCM intégrés.

L'équilibre final s'évalue dans la journée musicale : le montage brut emploie
un niveau d'écoute commun qui ne remplace pas les gains propres à chaque action.
