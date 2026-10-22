# Archives locales

`versions/` conserve les HTML 0.40–0.60, déplacés depuis la racine sans modifier
leur contenu. Les manifestes indiquent chaque chemin, taille et empreinte SHA256.
Ce dossier de binaires est ignoré par Git ; l'historique des sources reste dans Git.

Ces versions autonomes s'ouvrent directement depuis le disque. La 0.61 publiée
reste à la racine. Le jouable actuel est `../Jouer-Technoprof-Journee-Atelier.html`.

`tools/Archive-Technoprof.ps1` affiche d'abord un aperçu. `-Apply` effectue le
déplacement et vérifie les hashes ; aucun fichier existant n'est écrasé.
