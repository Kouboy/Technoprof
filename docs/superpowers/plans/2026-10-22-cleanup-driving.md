# Nettoyage et conduite — plan d'implémentation

> Pour les agents : exécution native avec superpowers:executing-plans, une étape vérifiée à la fois.

**Objectif :** clarifier le répertoire, supprimer les copies d'exports inutiles et réduire le coût identifié du rendu routier.

**Architecture :** conserver la simulation et la journée H1/A3/I2. Regrouper le décor routier dans une couche triée par profondeur et découpée une seule fois au viewport. Conserver deux exports autonomes, remplacer les copies d'atelier par des raccourcis et archiver les versions historiques sans destruction.

**Technologies :** TypeScript, Phaser 4.2.1, Node 24, Playwright Chromium/Firefox.

**Spécification :** demandes de nettoyage et de diagnostic Firefox de Nicolas ; cadrage dans docs/atelier/CONDUITE-AMBIANCE-ATELIER.md.

## Contraintes

- Aucun changement de règles, densité, contrôles, délais, topologie ou feedbacks.
- Jouer-Technoprof-Journee-Atelier.html reste autonome sur disque.
- Jouer-Technoprof-0.61.html reste à la racine et conserve son empreinte SHA256.
- Aucun asset supprimé sur la seule base de son nom ou de son ancienneté.
- Conserver tous les tests encore exécutés ; ne pas confondre fichiers locaux et code embarqué.
- Le fichier utilisateur work/github-pages-mobile-061.png est préservé.

## Points de revue

- Pont devant les lumières lointaines et derrière le trafic proche.
- Débordements lumineux hors de la fenêtre ; masques partagés, pas de découpe du HUD.
- Réutilisation des objets après pause, changement de trajet et retour au jour.
- Raccourcis avec paramètres explicites, scénario par défaut et fragment URL.
- Archives hors du dossier cible refusées ; déplacement uniquement après vérification du chemin et du hash.

## 1. Mesurer et établir les références

- [x] Inventaire racine/src/work et références des scripts d'export.
- [x] Installer un Firefox de test isolé, sans toucher au profil personnel.
- [x] Ajouter tools/profile-driving.cjs : durées RAF, appels WebGL, erreurs, moteur GPU et état observé.
- [x] Mesurer une conduite réellement en cours après la pause automatique de chargement ; conserver aussi les captures figées comparables.
- [x] Documenter explicitement la différence de GPU entre navigateurs de test et les limites de comparaison.

## 2. Une découpe commune pour les objets routiers

Fichiers : src/road-art.ts, src/main.ts, work/check-road.cjs, work/check-dusk-road.cjs.

- [x] Test : les couches et sprites rejoignent un même conteneur ; un seul masque ; tri final par profondeur.
- [x] Regrouper la création des objets routiers dans RoadArt ; conserver les profondeurs existantes, les halos et les ancrages.
- [x] Appeler finishFrame() après le tri/projet de tous les objets.
- [x] Vérifier tests de route et crépuscule, captures natives avant/après, puis mesurer les appels WebGL.
- [x] Garder la modification uniquement si elle réduit le coût sans perte visuelle démontrée.

Décision : le masque commun seul ne réduit pas les appels. Les halos et nappes
sont donc précalculés en atlas puis rendus en sprites réutilisés : 31–33 appels
de dessin deviennent 9. La géométrie dynamique des traits de lumière est conservée
par de petits sprites de couleur ; le professeur et les règles sont inchangés.

## 3. Rationaliser les exports et archiver sans perte

Fichiers : work/export-navigation-atelier.cjs, work/check-local.cjs, tools/Archive-Technoprof.ps1, .gitignore, README.md.

- [x] Test : deux HTML autonomes et dix-neuf raccourcis de moins de 2 Kio ; préservation query/hash ; scénarios A1/A2/A3/H1/I1/I2 corrects.
- [x] Générer six raccourcis à la place des copies de 135 Mo, en gardant l'export journée complet.
- [x] Archiver uniquement les versions 0.40–0.60 dans archives/versions, via chemins bornés et vérification des hashes ; ignorer ces fichiers dans Git.
- [x] Mettre à jour l'accès aux tests par thème et l'état des exports dans le README ; signaler les outils historiques sans déplacer aveuglément leurs dépendances.

## 4. Vérification et suite du chantier

- [x] npm run test:ambiance-route ; npm run test:journee ; npm test ; npm run build:atelier ; node work/check-local.cjs.
- [x] Revue indépendante sans blocage, export local régénéré, empreinte 0.61 inchangée. Le fichier utilisateur reste exclu de l'enregistrement Git.
- [x] Audit des anciens renderers/atlases consigné dans docs/technique/NETTOYAGE-2026-10-22.md. Définir ensuite un chargement propre à la journée et un chargement d'atelier : les constructeurs dépendent encore des anciens assets ; leur extraction reste à réaliser dans un lot suivant.
