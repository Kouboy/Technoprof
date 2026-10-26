# Publier le playtest : navigateur et version locale

Deux liens permanents à communiquer :

- Navigateur : https://kouboy.github.io/Technoprof/
- ZIP local : https://github.com/Kouboy/Technoprof/releases/latest/download/Technoprof-local.zip

Publication du playtest autorisée par Nicolas le 25 octobre 2026 : journée
complète, fenêtre Chrome, manette, CADRE harmonisé, nouvelles jauges et retour
au titre après la fin ou le Game Over. Livraison initiale : `playtest-2026-10-25`.
Le contrôle sur petit écran a révélé un chevauchement des zones tactiles du
titre après les réglages. Le correctif `playtest-2026-10-25-r2` réserve deux
zones de 44 px et leur espacement sans déplacer le titre sur grand écran.

La passe du 26 octobre ajoute trois vies avec reprise au début du trajet de
l'affectation en cours, une radiation au dernier échec et un compteur avec le
portrait du professeur. Elle harmonise aussi les commandes B/X, les passages
sonores, l'infirmerie de Berthelot et les panneaux de cours. Le bulletin radio
utilise désormais toute la plage du curseur Voix. Publication autorisée par
Nicolas le 26 octobre ; tag prévu : `playtest-2026-10-26`.

## Version locale

Le téléchargement est l'asset **Technoprof-local.zip** d'une GitHub Release.
Extraire le ZIP entier, puis lancer `Technoprof/Jouer.cmd` sur Windows : Chrome
ouvre le jeu en fenêtre d’application. Le lanceur HTML
`Technoprof/Jouer-Technoprof-Fenetre.html` permet d’utiliser un autre navigateur.
Le navigateur et les fichiers locaux
suffisent ; aucune installation du moteur ni serveur ne sont nécessaires.

L'archive contient uniquement la journée jouable, le lanceur, Jouer.cmd, les
consignes, le questionnaire, un manifeste et les 17 WAV réellement utilisés.
Le fichier `BUILD-INFO.json` indique le commit et les SHA256 des fichiers.
Le SHA256 du ZIP est publié séparément dans `Technoprof-local.zip.sha256`.
Les ateliers et archives de développement restent dans le dépôt, hors du ZIP.

## Publication reproductible

1. Vérifier la version : `npm run test:playtest`.
2. Fusionner la PR validée vers `main`. Le workflow Pages construit et déploie
   automatiquement le profil web ; vérifier son succès et le commit de
   `https://kouboy.github.io/Technoprof/build-info.json`.
3. Sur ce même commit : `npm run build:journee`, puis `npm run package:local`.
   Le ZIP et son empreinte sont écrits dans `work/checkpoints/release/`.
   Pour remplacer uniquement ces fichiers générés : `npm run package:local -- -Force`.
4. Vérifier le ZIP avec `python work/check-local-package.py <chemin-du-zip>` et
   tester le lanceur extrait dans un navigateur hors connexion.
5. Créer une Release datée, liée au commit exact, joindre le ZIP et son SHA256,
   puis la désigner comme dernière Release. Les anciennes versions restent disponibles.
   Exemple de tag : `playtest-2026-10-25`.
6. Comparer la taille et le digest de l'asset publié avec le ZIP local, vérifier
   l'accès public et les deux liens du README.

Le nom de l'asset reste **Technoprof-local.zip** dans chaque Release : l'URL
`releases/latest/download/...` continue ainsi à pointer vers le téléchargement
actuel. La Release publique datée est un playtest, sans déclaration de version
commerciale finale. Ne pas joindre les archives locales historiques, sauvegardes
ou fichiers personnels au téléchargement joueur.

Le package utilise PowerShell 7 et les bibliothèques ZIP de .NET, sans dépendance
npm supplémentaire. Le contrôle indépendant utilise la bibliothèque standard ZIP
de Python. Il faut construire avant de créer le ZIP : le packaging n'invente pas
un binaire à partir des sources et refuse un fichier attendu manquant.
L'export journée enregistre aussi le commit et les empreintes des deux HTML dans
`dist-day/local-build-info.json` : le packaging refuse un export d'un autre commit
ou modifié après sa construction.
