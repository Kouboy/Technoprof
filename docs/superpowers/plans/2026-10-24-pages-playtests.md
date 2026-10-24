# Publication des playtests Technoprof

Demande : mettre à jour le dépôt public et fournir un lien Pages vers la journée actuelle, avec toute la musique.

## Contrat

- Publier la journée H1/A3/I2 et les douze morceaux à https://kouboy.github.io/Technoprof/, avec musique active sans paramètre dans le lien.
- Export Pages dédié : même sélection d’images et même gameplay que la journée locale. Sortir les PNG/WebP/JPEG des chaînes base64 vers des fichiers cacheables, en conservant leurs octets. Copier uniquement les douze WAV utilisés.
- Les HTML autonomes locaux et le fichier/release v0.61 restent conservés. Le site principal est actualisé conformément à la nouvelle demande de publication.
- Avancer main uniquement par fast-forward après vérification ; pousser aussi la branche atelier avec son historique. Aucun force-push, suppression de version ou ajout du PNG local non suivi.
- Garder le déploiement Actions déjà configuré, avec vérifications de musique, journée et assets. Ajouter build-info.json pour identifier le commit réellement servi.

## Étapes

- [x] Test rouge puis vert du plugin d’export : externalisation sans altérer les images, déduplication, chemins et présence des douze WAV.
- [x] Configurer le mode Pages : profil journée, musique par défaut, même bootstrap public ; vérifier build et tests de régression.
- [x] Contrôler le site compilé sous /Technoprof/, sur desktop et largeur mobile, ainsi que l’audio depuis le serveur HTTP.
- [ ] Documenter le lien, committer, envoyer l’historique sur atelier et main ; vérifier le workflow et la configuration Pages.
- [ ] Contrôler le lien public et son commit déployé avant livraison.

## État initial

- Base locale a1877d8, branche atelier-navigation-bruel-a3 ; onze commits non envoyés sur cette branche. origin/main 3fd51f8 est ancêtre de HEAD, donc mise à jour sans réécriture possible.
- Pages déjà en mode workflow, HTTPS imposé et déploiements main autorisés. Dernier déploiement réussi : 3fd51f8.
- Ancien build:pages compile l’atelier complet et ne copie pas la musique ; le nouveau mode doit corriger ces deux points avant publication.

## Vérifications locales

- Export et build : 41 images identiques aux sources, douze WAV inchangés, 124,5 Mio pour le site complet ; JavaScript de 1,67 Mo séparé des images.
- Contrôles `test:journee`, `test:musique`, `test:assets`, `test:pages` réussis. Les trois affectations restent validées à 30/60/120 fps simulés.
- Suite historique : contrôles `check` à `check-059` réussis dans `npm test`, puis `check-060` et `check-061` repris et réussis après actualisation du test multipage. Maintenance limitée à deux préparations de tests : chargement du module gamefeel dans l’ancien harnais et lecture de toutes les pages des répliques approuvées, sans changement des règles.
- Navigateur natif sous `/Technoprof/`, sans query : Chromium et Firefox sur desktop, Chromium avec fenêtre 390 × 844 et toucher. Titre et conduite chargés, musiques réellement lues après interaction, quatre volumes présents, aucun échec HTTP ni erreur JavaScript. Captures et rapport local dans `work/checkpoints/pages-*` (ignorés par Git).
- Relecture indépendante de l’export et du workflow : aucun défaut bloquant relevé. L’avertissement de taille Vite concerne le bundle moteur/jeu de 1,67 Mo ; les images n’y sont plus intégrées.
- HTML 0.61 inchangé : SHA256 `05713E027D7DCB4B5CD8AAA6E2E74B53D1EA45526215E33CC8FE4E905B94DD65`.

Les deux dernières cases sont à confirmer après l’envoi de ce commit. Le workflow GitHub est la trace de publication ; le test navigateur conserve le résultat du contrôle public dans `work/checkpoints/pages-live.json`.
