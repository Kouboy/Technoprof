# Historique importé de TECHNOPROF

Le dépôt Git a été créé le 3 octobre 2026 à partir du projet local. Les commits
antérieurs à l'import n'existaient pas : les jalons `snapshot-0.40` à
`snapshot-0.59` sont des imports des sauvegardes réellement conservées. Leurs
dates de commit sont celles de l'import, pas des dates de développement inventées.

- **0.40 à 0.46 :** sauvegardes partielles, comprenant les fichiers modifiés à ces
  étapes. Ces arbres ne sont pas des projets complets et ne doivent pas être
  utilisés comme versions compilables.
- **0.47 à 0.59 :** sauvegardes plus complètes de `src/`, avec la configuration et
  les outils présents dans chaque sauvegarde. Certains outils, documents ou
  fichiers de configuration n'y avaient pas été conservés. Leur compilation
  et leur suite de tests n'ont pas été validées lors de cet import.
- **v0.60 / main :** état actuel des sources, assets, outils et documentation,
  comprenant l'audit et son complément sur les charges. Le gameplay est celui
  de la livraison locale 0.60 ; l'esquive n'est pas encore corrigée.

Chaque jalon importé contient `history/checkpoint.json`, qui liste les fichiers
conservés et leurs empreintes SHA-256. Les fichiers TypeScript qui étaient à la
racine d'une sauvegarde partielle sont replacés sous `src/`. Aucun fichier
manquant n'a été rempli avec une version récente.

Les exports HTML autonomes, archives ZIP et dépendances ne sont pas stockés dans
les commits. La release `v0.60` fournit le jouable pour les tests. Les anciennes
livraisons 0.13 et suivantes restent conservées dans le dossier local ; elles ne
sont pas présentées comme un historique de sources reconstitué.

À partir de cet import, les évolutions doivent être enregistrées par de vrais
commits, puis poussées vers GitHub. Un tag de version désigne un état précis ;
une release peut lui associer les livraisons autonomes correspondantes.
