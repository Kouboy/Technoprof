# Pause intégrée et appuis mats

> Exécution : skill executing-plans, avec génération et contrôles audio délégués sur des fichiers distincts.

**But :** rendre les pas moins fatigants à l'écoute, donner de l'air aux transitions et intégrer les menus à la direction du CADRE.

**Architecture :** garder les états, actions et contrôles du menu DOM accessible. Habillage métal usé et lettrage bitmap partagé avec le jeu ; aucune image distante ni nouvelle dépendance. Le gel du jeu reste sous la responsabilité existante de setPaused. Les sons restent des samples originaux 8-bit, dans les bus et réglages actuels.

**Choix de réalisation :** habillage dans le cadre, jeu figé assombri derrière la pause, reprise dominante, outils secondaires discrets. Commandes et réglages gardent leurs vrais boutons, sliders et cases à cocher. Les titres et boutons reprennent les glyphes du CADRE via une couche graphique sans entrée ni capture d'input.

## 1. Pas et transitions

- [x] Reproduire les défauts à partir du générateur : traînées de bruit et contacts d'escalier espacés de seulement 105 ms.
- [x] Retirer le frottement prolongé, assombrir et raccourcir les appuis, réduire leur gain et leur densité sans modifier la vitesse ou l'animation du personnage.
- [x] Escaliers : deux appuis espacés d'environ 300 ms et une courte queue de cage d'escalier ; aucune rafale.
- [x] Passages : un seul appui, discret ; porte moins précipitée. Garder le fondu et le délai du gameplay inchangés.
- [x] Vérifier identité des sols, pause/reprise, annulation des sons et absence de backlog ; livrer une écoute comparative.

## 2. Menu et pause

- [x] Tester pause persistante, reprise sans input parasite, réglages et navigation manette.
- [x] Habiller pause, commandes et réglages : métal ardoise, relief rectangulaire, vis, papier et ambre sobres ; lettrage bitmap sur titres et boutons.
- [x] Présenter la reprise avant les outils secondaires ; garder l'illustration titre validée et son invitation à commencer.
- [x] Garder textes descriptifs lisibles et les informations accessibles aux lecteurs d'écran.
- [x] Tester petits écrans paysage/portrait, focus, scroll, quatre volumes, retour et Start.

## 3. Livraison

- [x] Suites ciblées et revue des nouveaux modules.
- [x] Reconstruire les deux jouables locaux et observer les écrans dans Chrome/Firefox.
- [x] Fournir le lanceur habituel pour essai humain. Pas de publication dans cette passe.

## Validation et arbitrages

`npm run test:playtest`, contrôles ciblés interface/SFX/manette/gamefeel/fenêtre et deux builds : verts. Le test de la banque est rouge sur l'ancienne enveloppe de pas, puis vert sur les nouveaux appuis. Le test menu détecte l'absence de nouvelle présentation avant implémentation.

`tools/check-menu-browser.cjs` observe le jouable file:// hors connexion dans Chromium et Firefox : démarrage, pause, navigation manette standard simulée, Tab contenu dans le menu, réglages natifs, reprise, formats 844×390 / 390×844 / 640×480. Captures sous `work/checkpoints/menu-2026-10-27/`.

Arbitrage : lettrage via canvas des glyphes existants sur les seuls titres/boutons, avec texte et noms accessibles natifs conservés. Les paragraphes restent en police système pour leur lisibilité. Les images et le bouton clignotant du titre validé sont conservés. La revue a repéré un contraste insuffisant sur l'ancien compte-rendu papier : ses titres gardent leurs encres CSS, sans bitmap clair.

Arbitrage : les notes d'aide et le bulletin radio sont placés sous les actions, pour que Reprendre reste directement accessible en portrait. Les queues sonores peuvent dépasser le fondu visuel ; aucune attente gameplay n'est ajoutée. Le bus et les quatre volumes restent identiques.

Comparatif isolé, aux gains réellement utilisés : `work/checkpoints/Pas-transitions-AVANT-APRES.wav` (ancien 0–24 s, nouveau 25–49 s). Il n'inclut pas le mix complet ni la réverbération du navigateur. L'agrément musical et le rendu sur haut-parleurs restent à écouter humainement.

Les réglages sonores proposés constituent une direction d'écoute à valider humainement ; les métriques ne prouvent pas à elles seules l'agrément.
