# Titre V2 et journée d’essai musicale

Nicolas : titre plus lourd, grave et menaçant ; danger et fatigue. Les quatre autres morceaux peuvent être essayés avec le jeu. Les fichiers musicaux acceptés restent identiques. Le titre révisé est proposé à l’écoute avant son intégration.

## Contrat

- Titre V2 : 80 BPM, pédale grave, cuivres bas et impacts espacés, sans progression majeure ni montée héroïque. Même durée de 48 s et même niveau RMS de comparaison ; les quatre autres WAV/MOD/partitions ne changent pas.
- Profil musical local explicite `?musique=essai`, lancé par `Jouer-Technoprof-Journee-Musique.html`. Le lancement habituel et 0.61 restent sans cette musique.
- Bulletin et notification sans morceau dessous. Autoradio à l’entrée en phase road, boucle sur tout le trajet, coupure à arrival/fail. Un thème par établissement en school.
- Pause, perte de focus et mute suspendent le morceau, reprise au même endroit. L’infirmerie suspend le thème ; les répliques diminuent son volume. Porte/course/ellipse/bilan sans musique.
- Volume musical indépendant, sauvegardé, uniquement affiché dans le profil musical. Le mix de SFX et d’ambiance demeure indépendant.
- WAV externes locaux, chargés à la demande par un élément audio. Le dossier audio doit accompagner ce profil ; le HTML habituel reste autonome. Pas de nouveau bundle de samples/base64, ni de publication.

## Étapes

1. Maquette V2 et contrôle d’identité des quatre fichiers conservés ; décodage MOD et WAV, niveau et raccords.
2. `src/music.ts` : contrôleur testable, choix de piste pur, pause/reprise, changements, annulation des plays asynchrones et reprise après blocage navigateur. Tests rouges puis verts dans `work/check-music-trial.cjs`.
3. Branchement optionnel dans main.ts, slider musique conditionnel dans player-experience.ts, raccourci local dans l’export atelier. Tests de menu existants + profil musical.
4. Compilation et exports, lecture hors ligne Chromium/Firefox, scènes de route/école/soin/échec via atelier, revue indépendante, contrôles ciblés des transitions et journée complète. Aucun changement de gameplay.

L’écoute humaine décide du ton. Les mesures ne prétendent pas démontrer qu’une composition est menaçante. Le titre V2 reste hors du jeu dans cette passe.

## Vérifications réalisées

- WAV et MOD : cinq boucles décodées, niveaux bornés, raccords sans silence ; les douze WAV/MOD/partitions des quatre autres morceaux sont identiques à `61c9833`.
- Tests musique : contrôleur, adaptateur réel, pause/focus/mute, soin, changement de piste, promesses obsolètes, blocage navigateur et reprise ; redémarrage d’une partie remis à zéro après reproduction du défaut.
- Tests interface et journée complète : PASS, dont trois missions à 30/60/120 FPS. Compilation TypeScript et deux exports locaux : PASS.
- Chromium et Firefox hors ligne : lecteur des cinq maquettes, boucle réelle, arrêt ; journée musicale par son raccourci, volume séparé, bulletin seul puis autoradio, pause/reprise/mute ; quatre thèmes réellement lus dans l’atelier, infirmerie/arrivée/échec silencieux. Rapports JSON dans le dossier des maquettes. Aucun défaut JavaScript relevé.
- Revue indépendante : aucun défaut critique ou important ; scénario complémentaire de rejet tardif ajouté.
- Empreinte du jouable 0.61 inchangée : `05713E027D7DCB4B5CD8AAA6E2E74B53D1EA45526215E33CC8FE4E905B94DD65`.
