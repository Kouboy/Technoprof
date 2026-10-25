# Retour au titre, boss et circulation

**Intention :** finir la journée sur le réveil brutal, laisser le morceau se
terminer, puis fondre toute l’image au noir pendant trois secondes. Retrouver
le titre et son thème automatiquement, sans écran de compte-rendu. Conserver
la sauvegarde du journal pour les tests. La règle des trois réussites reste.

**Architecture :** un retour au titre commun nettoie les entrées et les sons,
sans lancer une nouvelle journée. L’horloge sonore continue de piloter les
69 secondes de film ; une horloge de jeu suspendable pilote ensuite les trois
secondes de fondu. Start peut toujours passer la séquence entière.

- [x] Écrire les régressions de fin naturelle, pause du fondu, skip et échec.
- [x] Implémenter le fondu et le retour au titre avec reprise de sa musique.
- [x] Retour Game Over confirmé par Nicolas : automatique après le thème,
  Action permet d’écourter ; garder la vignette, aucune relance directe du jeu.
- [x] Jauge boss commune : métal sombre usé, cellules rouge rouille, biseaux
  et vis, sans nouveau texte. Capacité égale aux vrais PV de départ.
- [x] Retirer les libellés tactiques de tous les rendus ; conserver les poses,
  impacts, onomatopées et signes graphiques de danger.
- [x] Circulation : +12,5 % sur les trois affectations, mêmes voies ouvertes
  et vagues alternées ; retour Maison inchangé.
- [x] Vérifier le parcours de fin avec audio réel et les trois routes par
  entrées simulées ; compiler le jouable local. Aucun déploiement.

Les lanceurs Chrome en attente de sauvegarde sont conservés. La version locale
0.61 publiée reste intacte. Le rendu 4:3 et les commandes manette ne changent pas.

Validation : `test:playtest`, `npm test`, `test:flow`, compilation atelier et
journée, puis vérification des HTML autonomes. Fin native confirmée dans
Chromium et Firefox, pause du fondu vérifiée dans Firefox ; thème du titre
repris sans nouveau clic. Trois captures des jauges inspectées. Les neuf
routes prédictives passent sans collision. Le pilote historique sous-utilisait
la chaussée : ses cibles sont recalées à ±0,94, sans abaisser ses exigences.
Soixante premiers parcours historiques passent encore à 30/60/120 fps.

Correctifs annexes nécessaires : détection native `ended` des deux WAV plutôt
qu’égalité à 69 s (Chrome terminait à 68,963 s) ; retour Game Over garanti aussi
sans musique, avec volume nul ou son coupé. Les rapports détaillés restent dans
`work/checkpoints/`. La référence 0.61 conserve son SHA256.
