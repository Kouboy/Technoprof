# Scripts historiques de fabrication

Ces 24 scripts ont servi à fabriquer ou modifier d'anciennes versions. Ils ne sont
appelés par aucune commande npm ni aucun outil maintenu (recherche des références
avant déplacement, 25 octobre 2026). Le manifeste contient leurs SHA256 inchangés.
`sha256` décrit les octets locaux avant/après déplacement ; `gitContentSha256`
décrit le contenu normalisé par Git, pour distinguer les fins de ligne LF/CRLF
dans une nouvelle copie du dépôt.

**Ne pas les exécuter sur le projet courant.** Ils contiennent des remplacements
de texte et des chemins historiques, parfois propres à l'ancien poste de travail.
Leur présence conserve la trace de fabrication ; elle ne constitue pas une API de
maintenance. Les outils actuels sont dans `tools/`, les vérifications dans les
commandes npm documentées dans le README principal.
