# Archives locales

`versions/` conserve les HTML 0.40–0.60, déplacés depuis la racine sans modifier
leur contenu. Les manifestes indiquent chaque chemin, taille et empreinte SHA256.
Ce dossier de binaires est ignoré par Git ; l'historique des sources reste dans Git.

Ces versions autonomes s'ouvrent directement depuis le disque. La 0.61 publiée
reste à la racine. Le jouable actuel est `../Jouer-Technoprof-Journee-Atelier.html`.

`tools/Archive-Technoprof.ps1` affiche d'abord un aperçu. `-Apply` effectue le
déplacement et vérifie les hashes ; aucun fichier existant n'est écrasé.

`working-copies/` contient les 21 anciens dossiers `work/backup-0.40` à
`backup-0.60`, soit 774 fichiers / 1 010 883 880 octets, rangés le 25 octobre.
Chaque fichier a été vérifié par SHA256 après déplacement ; le manifeste est
local et conservé avec les dossiers. Ce rangement ne libère pas d'espace disque.
`tools/Archive-WorkingCopies.ps1` permet un aperçu ; `-Apply` effectue le
déplacement, refuse liens et écrasements, puis vérifie toutes les empreintes.
