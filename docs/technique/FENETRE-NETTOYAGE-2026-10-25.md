# Fenêtre dédiée et préparation des playtests — 25 octobre 2026

Suite aux retours humains, la présentation avec barre et textes extérieurs a été
remplacée. Voir [les retouches d'affichage](RETOUCHES-AFFICHAGE-2026-10-25.md) :
cadre conservé après l'intro, plein viewport 4:3, pause discrète et jauge auto en
cinq barres. La publication reste en attente du prochain feu vert.

## Lancer le jeu

Ouvrir `Jouer-Technoprof-Fenetre.html`, puis **Ouvrir le jeu dans sa fenêtre**.
`Jouer.cmd` ouvre désormais ce lanceur, avec repli sur les anciennes entrées si
le fichier n'a pas été généré. Le lanceur pèse moins de 2 Kio ; il ne charge pas
une première copie des images et du moteur derrière la partie.

Le HTML journée et `audio/` restent à côté. Depuis le navigateur habituel, le
bouton **Ouvrir dans une fenêtre** est aussi disponible. La partie source est
suspendue ; la nouvelle fenêtre démarre au titre. Les clics suivants depuis le
même lanceur réutilisent la fenêtre sans relancer la partie. Une fermeture permet
un nouveau lancement. Aucun transfert de sauvegarde n'est suggéré.

Le cadre reste en 4:3. Les commandes natives et les sous-titres disposent de leur
propre espace ; ils ne recouvrent pas le jeu. Les dimensions sont recalculées sur
la taille réelle des commandes et des aides, y compris après rotation du téléphone.
Phaser relit les dimensions du parent avant de recalculer sa taille et ses
coordonnées d'entrée. Le parent caché au titre n'envoie pas de dimensions nulles.
Un geste tactile maintenu conserve son écart de braquage/freinage lorsque les
aides changent ce cadre : sa position et son origine sont reprojetées ensemble.
La rotation garde l'annulation explicite déjà prévue pour un redimensionnement.

Le plein écran conserve menus et sous-titres. Échap quitte le plein écran selon
le navigateur ; pause et réglages restent disponibles. Un refus de plein écran ou
un blocage de popup laisse un message et un repli utilisable. Les préférences du
navigateur peuvent imposer un onglet ou une barre de titre : ce n'est pas une
application native installée.

## Rangement vérifié

- 21 copies `work/backup-0.40` à `backup-0.60` déplacées dans
  `archives/working-copies/` : 774 fichiers, 1 010 883 880 octets. Manifeste local
  écrit avant déplacement et SHA256 de chaque fichier vérifié après. **Aucun gain
  d'espace disque annoncé pour ce rangement.**
- 24 anciens scripts mutateurs déplacés dans `work/historique-fabrication/`.
  Aucune référence depuis les outils maintenus ou commandes npm avant déplacement.
  Le manifeste suivi conserve leurs empreintes inchangées et le README les signale
  comme historiques, à ne pas exécuter sur le projet actuel.
- Suppression du seul module source sans chemin d'import depuis `src/main.ts` :
  `cinematic-campus-data.ts`, 3 685 340 octets. Son PNG original reste dans
  `art/cinematics-2026-10-24/campus-v3-ramp.png`, identique au contenu intégré :
  SHA256 `2f8c800032ae3fcb78ef69df415e37ae83366dec38eb7d9e52af91963d8d2917`.
  Ce module était déjà exclu par le bundler : sa suppression nettoie les sources,
  elle ne réduit pas le téléchargement du jeu.
- Art, musiques, ateliers actifs, fixtures et journal personnel non suivi conservés.
  Les tests numérotés restent maintenus ; leur ancien numéro n'est pas une preuve
  d'inutilité. Les sorties générées par les tests historiques ne sont pas ajoutées
  au changement.
- La 0.61 reste inchangée : SHA256
  `05713E027D7DCB4B5CD8AAA6E2E74B53D1EA45526215E33CC8FE4E905B94DD65`.

`npm run audit:projet` produit un inventaire en lecture seule : fichiers suivis,
sources locales nouvelles, imports relatifs statiques et livraisons générées.
Après cette passe, aucun module TypeScript hors déclarations n'est inaccessible
depuis le point d'entrée. Cette analyse ne remplace pas les vérifications des
ressources lues par les outils ni celles des imports construits dynamiquement.

## Optimisation du tracé bitmap

Les petites lettres étaient redécoupées en tableaux à chaque mesure et à chaque
tracé. Leurs lignes sont maintenant préparées une seule fois. Les deux tailles de
police regroupent les pixels adjacents d'une ligne en rectangles contigus, sans
changer les silhouettes, la normalisation des accents, les coordonnées ni la
découpe en largeur. Aucun cache non borné ni texture supplémentaire n'est ajouté.

Le corpus de régression passe de **15 534 à 10 119 rectangles** (environ 35 % de
moins pour ces lettres). Ce nombre ne signifie pas 35 % de gain de FPS : le décor,
la simulation et les autres éléments restent dessinés. La route conserve environ
9 appels graphiques et 14 envois de buffers par image. Le volume RGBA estimé des
textures de la journée reste à 256 790 124 octets ; ce n'est pas la mémoire totale
du navigateur ou du GPU.

Un appel ancien à `setMask` était ignoré en WebGL par Phaser 4 et déclenchait un
avertissement à chaque création de scène. Le masque géométrique est désormais
construit et appliqué seulement pour le renderer Canvas, où il reste nécessaire.
WebGL conserve son rendu précédent et n'alloue plus cette forme masquée inutile.
Les deux chemins sont vérifiés séparément ; les tests natifs refusent le retour
de cet avertissement.

La comparaison native avant/après confirme **48 vues identiques dans Chromium et
48 dans Firefox**, pixels du framebuffer 640 × 480 compris : pièces, routes,
arrivées et entrées en classe. Les fixtures suspendent la simulation pour comparer
le dessin ; les pilotes de journée vérifient séparément le déroulement continu.

## Vérifications et reproduction

- `npm run test:playtest` : suite consolidée de la journée actuelle, désormais
  utilisée par le workflow Pages avant son build.
- `npm test` : suite historique complète, conservée.
- `npm run build:atelier`, `npm run build:pages`, `node work/check-local.cjs` :
  TypeScript, deux HTML autonomes, 24 petits lanceurs, 47 PNG intacts et 17 WAV
  originaux dans l'export web.
- `tools/check-game-window-browser.cjs` : Chromium, Firefox et tactile simulé ;
  ouverture et réutilisation, partie source suspendue, titre/menus, fenêtres de
  tailles différentes, rotation, sous-titres, égalité cadre/canevas, plein écran,
  lanceur local hors connexion et reprise audio après popup bloqué.
- Revue indépendante : repli audio corrigé, aller/retour plein écran depuis
  l'onglet normal observé avec le vrai renderer ; changement réel de largeur
  394 → 469 px avec doigt maintenu reproduit, puis corrigé : +1 px physique donne
  +0,6823 px logique et aucun déplacement vertical parasite.

Les rapports natifs, captures et logs de travail sont dans `work/checkpoints/`.
Les mesures synthétisées sont conservées dans
`work/reports/performance/cleanup-2026-10-25.json`.

Exemple de test natif (Playwright disponible dans l'environnement) :

```sh
npm run build:atelier
npm run build:pages
node tools/check-game-window-browser.cjs
```

Pour le profilage routier : serveur Vite sur 4176, puis
`node tools/profile-driving.cjs <module-playwright> <rapport> 5000 moving`.
`PROFILE_FONT_REFERENCE` peut désigner un dossier contenant les anciennes versions
de `cadre.ts` et `small-lettering.ts` : elles remplacent seulement ces deux modules
dans les réponses du navigateur de test, sans réécrire les sources du jeu.

## Limites

Les temps CPU sont ceux des callbacks RAF de profils isolés, pas le temps GPU
total. Les fréquences RAF, le pilote, le profil utilisateur et le contexte de la
machine varient. Les premiers passages seuls ne justifient aucun gain global de
FPS : leurs résultats sont conservés, y compris le passage Chromium plus lent.
Une comparaison Chromium ne remplaçant que les deux modules de lettres observe
1,4 → 1,5 ms en médiane de jour et 2,1 → 1,7 ms au crépuscule ; les p95 passent
de 2,3 → 2,8 ms et 3,5 → 3,2 ms respectivement. Un passage par variante ne permet
pas de conclure à un gain CPU systématique. Le bénéfice établi est la baisse des
rectangles et des tableaux temporaires, sans différence visuelle.
Le téléphone physique et une longue session dans le Firefox personnel restent à
évaluer pendant les playtests.
Un chargement initial lourd peut déclencher la pause de sécurité sur la première
image jouable. Le test natif reprend alors par le bouton normal avant de vérifier
la lecture sonore ; il ne contourne pas les règles de pause.

Les livraisons conservent les illustrations et WAV approuvés : environ 128 Mo pour
le HTML journée et 157 Mio pour le site avec son audio. Cette passe ne prétend pas
résoudre le poids artistique par du rangement. Les grands avertissements de
bundle Vite restent attendus pour l'export autonome et le moteur commun.

Cette passe a été préparée sur `codex/window-cleanup`. Sa publication navigateur
et son téléchargement local suivent la [procédure de publication](PUBLICATION.md).
