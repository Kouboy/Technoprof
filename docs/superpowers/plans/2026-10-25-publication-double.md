# Publication navigateur et téléchargement local

**But :** publier la même version de playtest sur Pages et en archive locale
téléchargeable, avec deux liens stables visibles dans le dépôt.

**Choix :** GitHub Pages pour le navigateur ; GitHub Release pour un ZIP joueur
nommé `Technoprof-local.zip`. Le ZIP contient la journée autonome, le lanceur
fenêtre, Jouer.cmd, les consignes, les retours et les seuls 17 WAV utilisés.
Aucun ancien atelier, sauvegarde, dépendance de développement ou fichier personnel.
Un manifeste identifie le commit, les tailles et les SHA256. La 0.61 historique
et ses Releases restent conservées.

## Étapes

- [ ] Ajouter un packaging PowerShell/.NET reproductible et sa vérification indépendante.
- [ ] Construire et tester l'archive extraite, hors connexion, comme un joueur.
- [ ] Ajouter les liens navigateur/téléchargement dans le README et les consignes.
- [ ] Fusionner la branche nettoyée via une PR attachée, attendre et vérifier Pages.
- [ ] Construire depuis le commit fusionné, publier une Release datée et vérifier
  taille, empreinte et accès public de l'asset. Fournir les deux liens.

La publication est demandée par Nicolas pour partager le jeu. Aucun message n'est
envoyé à des tiers ; seuls son dépôt public et son site de playtest sont mis à jour.

**En attente des retours humains :** Nicolas a demandé de différer la publication
pour corriger le cadre après cinématique, l'affichage plein écran, les éléments
hors jeu et la jauge auto. Aucun push, merge, déploiement ou nouvelle Release
n'a été réalisé pendant cette préparation. Ne pas reprendre la publication sans
son nouveau feu vert.
