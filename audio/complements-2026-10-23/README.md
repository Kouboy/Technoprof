# TECHNOPROF — Sept compléments musicaux

Ouvrir **Ecouter-Complements-Technoprof.html**. Les sept WAV doivent rester à côté du lecteur. Aucun serveur ni connexion nécessaire. Un seul morceau joue à la fois ; le bouton Tout arrêter réinitialise les lectures. Les six thèmes bouclent ; le Game Over se joue une seule fois.

## Intention de cette passe

Nicolas demande un thème pour chaque boss, une infirmerie, une bossa nova électro pour le trajet 2, un jazz fusion pour le trajet 3 et un Game Over. La texture reste celle des samples de tracker Amiga, instrumentale. Les sept compositions ont été validées à l’écoute puis intégrées à la journée musicale locale pour tester leur enchaînement.

| Usage | Proposition | Tempo | Durée approximative |
|---|---|---:|---:|
| Inspectrice / Ormeaux | Évaluation froide : ostinato sec, notes pincées, accents de tampon | 124 BPM | 31 s |
| Parent influent / Berthelot | Le poids du réseau : cuivres bas et accords courts, basse insistante | 132 BPM | 29 s |
| Responsable sécurité / Trois-Ponts | Accès refusé : basse saturée et ponctuations industrielles | 144 BPM | 27 s |
| Infirmerie | Asseyez-vous un instant : piano électrique feutré, accords suspendus, sans batterie | 72 BPM | 53 s |
| Autoradio 2 / midi | Pause réglementaire : bossa électro, nylon syncopé, rimshot, piano électrique | 108 BPM | 36 s |
| Autoradio 3 / crépuscule | Dernière correspondance : jazz fusion, basse claquante, piano électrique et cuivre synthétique | 120 BPM | 32 s |
| Game Over | Service interrompu : retombée sombre, phrase descendante, fin sans boucle | 80 BPM | 12 s |

Les boss partagent quelques timbres graves avec le titre, avec des rythmes distincts. L’infirmerie vise une respiration bienveillante et conserve un niveau RMS de -24 dBFS, environ 5 dB sous les autres boucles. Les autoradios gardent un filtre et un souffle léger de poste : ils proposent des arrangements différents, pas seulement des changements de tempo du premier trajet. Le Game Over laisse retomber le son et se termine dans le silence, sans motif comique ou fanfare.

## Fabrication

Compositions et samples générés localement par **tools/compose-music-expansion.py**, avec NumPy. Les sons d’instruments sont fabriqués par synthèse puis quantifiés en **PCM signé 8 bits**. Les noms guitare nylon, piano électrique, basse claquante et cuivre désignent des approximations de timbres : aucun de ces instruments n’est enregistré en studio ici. Aucun enregistrement externe, extrait musical, voix, banque de sons téléchargée ou API de génération.

Chaque MOD contient exactement quatre pistes et uniquement ses samples utilisés, dans la limite des 31 instruments du format M.K. Les accords sont prééchantillonnés pour tenir sur une seule piste ; basse, motif, harmonie et rythme restent séparés. Le WAV stéréo 22 050 Hz / 16 bits est rendu à partir de ces mêmes sources 8 bits. Son mix resserre la stéréo, ajoute de courtes réflexions aux thèmes hors autoradio et ne prétend pas émuler exactement l’électronique Paula. Le MOD reste éditable dans un tracker.

Les fichiers **.score.json** donnent les cellules de partition ; **manifest.json** donne les niveaux, durées, usages de boucle et empreintes des WAV. Les paramètres de tempo, progression et instrumentation se trouvent dans le script. Pour reconstruire depuis la racine :

```powershell
python tools/compose-music-expansion.py
python tools/check-music-expansion.py
node work/check-music-expansion-browser.cjs
```

Python + NumPy et ffmpeg sont nécessaires aux deux premières commandes. Le contrôle navigateur utilise le runtime Playwright local déjà employé dans le projet.

## Règles d’intégration

- Un thème de boss prend le relais de l’établissement au début de la confrontation, en laissant les répliques au premier plan, puis s’arrête à la victoire, à la sortie ou à l’échec.
- L’infirmerie remplace le thème scolaire pendant le soin et laisse intactes les règles de pause et de soin unique.
- Les deux nouveaux autoradios gardent le contrat actuel : bulletin et affectation seuls, morceau pendant le trajet actif, coupure à l’arrivée ou à l’échec.
- Le Game Over se joue une seule fois ; une piste terminée n’est pas relancée par la synchronisation de chaque frame.

## Intégration à la journée musicale

Les sept morceaux sont désormais branchés dans **Jouer-Technoprof-Journee-Musique.html**, avec le titre approuvé, le premier autoradio et les trois explorations déjà présents. Garder les trois dossiers audio/complements-2026-10-23, audio/maquettes-2026-10-23 et audio/titre-reference-2026-10-23 avec Jouer-Technoprof-Journee-Atelier.html et son raccourci musical.

L’autoradio change selon la mission, après bulletin et DATA. Le thème de boss commence à l’introduction, atténué sous les répliques, puis cesse dès son K.O. L’arène reste silencieuse jusqu’à l’ouverture de classe. L’infirmerie remplace l’exploration puis restitue sa position de lecture à la sortie. Le Game Over démarre 0,45 s après l’échec, se joue une seule fois et ne se relance ni chaque frame, ni après pause/mute/reprise audio. Le joueur peut poursuivre avant la fin du morceau : aucune attente nouvelle n’est imposée.

Le réglage Musique et la coupure générale restent actifs. Pause, perte de focus et menus de jeu suspendent les pistes. Chaque mission ou scénario recommencé efface les positions de reprise. Les fichiers WAV sont inchangés, chargés à la demande dans un seul lecteur. Le lancement habituel sans `?musique=essai` et la 0.61 publiée conservent leur comportement.

`npm run test:musique` couvre les règles et un parcours réel des trois profils avec soin, reprise, boss, K.O. et échec. `work/check-music-browser.cjs` contrôle la lecture native hors ligne de tous les morceaux et une entrée/sortie d’infirmerie au clavier dans Chromium et Firefox. Les résultats de cette passe sont consignés dans flow-browser-verification.json.
