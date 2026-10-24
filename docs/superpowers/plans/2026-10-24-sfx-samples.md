# Palette SFX sample low-fi — plan et contrat

> Exécution : superpowers:executing-plans, avec tests de comportement et une relecture finale indépendante.

**Objectif :** donner au jeu la matière sonore des musiques approuvées : impacts d'action pulp, souffles de saut, pas selon le sol, portes/grille/escaliers et petites actions quotidiennes.

**Architecture :** banque originale PCM mono 8 bits à 11 025 Hz, fabriquée hors jeu et intégrée aux sources pour préserver les HTML sur disque. Variantes et gains centralisés, buffers WebAudio mis en cache. Événements et temps de simulation existants pilotent les sons ; aucun timer réel supplémentaire.

**Choix de réalisation :** garder les générateurs continus moteur/air/ambiance, avec finition low-fi ; remplacer les sons ponctuels par des prises fixes. Une distorsion générale ne donnerait pas d'identité aux coups ; des extraits de films imposeraient d'autres sources et droits. Des samples originaux permettent les impacts exagérés demandés sans ces dépendances.

## Contrat d'expérience

- Coups secs : claquement bref, corps grave, petite résonance ; garde plus dure, dégât reçu sourd, chute lourde. Variantes sans changement du timing de combat.
- Souffle au saut réellement accepté, réception distincte au sol. Aucun « boing » mélodique.
- Pas synchronisés avec la phase de marche, seulement sur déplacement réel au sol ; variantes carrelage, bois, béton, métal et extérieur gravillonné. Infirmerie assourdie.
- Bois à l'étage Berthelot hors infirmerie ; métal aux accès techniques Trois-Ponts ; cours/parvis béton, autres intérieurs durs. Choix sonores, pas de nouvelles règles de LD.
- Arrivée : portière conservée, marche jusqu'à l'entrée ; grille uniquement aux Ormeaux (seul portail animé). Entrée adaptée aux deux autres établissements.
- Transitions : sons discrets selon le passage (porte, escalier ou circulation ouverte), sans claque de porte à chaque tableau. Marche automatique de l'infirmerie douce.
- Pause/focus/mute coupent les voix sans rattrapage au retour. Respect des volumes Effets/Ambiances, de la musique, de la radio et des dialogues.
- Circulation, PV, délais, topologie, commandes et archive HTML 0.61 préservés.

## Étapes

- [x] Banque originale : outil Python reproductible, PCM intégrés, WAV et écoute ; tests quantification, durée, variantes et saturation.
- [x] WebAudio : caches par prise, variantes, surfaces et mix ; contrôle des voix et pause/mute.
- [x] Vie sonore : contacts de pas, infirmerie, cinématiques et transitions ; tests 30/60/120 fps et interruptions.
- [x] Observation navigateur, régressions ciblées, relecture indépendante, exports locaux et site de playtest actualisés.

## Points de vigilance

1. La reprise de pause ne rejoue ni premier pas ni grille complète.
2. Les passages ouverts ne sonnent pas comme des portes.
3. Nouveau sol cohérent après changement de pièce et perte de focus.
4. Réception et saut bufferisé simultanés : impact léger.
5. Banque dans le HTML local, aucun téléchargement externe requis.

## État initial

Base `a7cabee`, branche atelier-navigation-bruel-a3, PNG utilisateur non suivi à préserver. Ancienne banque ponctuelle calculée à 22 050 Hz flottants, une seule prise par matière ; marche générique toutes les 270 ms et infirmerie muette. Fondu de pièce 120 + 180 ms ; grille H1 de 3,65 à 4,35 s ; marche d'arrivée 2,25 à 5,8 s.

## Vérifications et décisions

- 37 matières, 75 prises fixes et 354 267 octets PCM. Les anciens calculs ponctuels devenus inaccessibles ont été retirés ; seuls les cinq fonds continus restent calculés puis filtrés/quantifiés.
- `npm test` complet réussi. `test:sfx`, `test:retouches`, `test:gamefeel`, `test:musique`, `test:journee`, cycle Parent A3, trous A3 et détour de soin I2 réussis. Contrôle local mis à jour pour les raccourcis musicaux/gamefeel déjà présents (21 raccourcis au total).
- Builds atelier et Pages réussis, HTML locaux reconstruits. Site : 125,0 Mio ; SFX intégrés dans le JavaScript, douze WAV musicaux seuls copiés dans le site. Archive HTML 0.61 : empreinte inchangée.
- Observation native hors connexion, Chromium et Firefox : empreintes uniques des buffers réellement joués (17 matières identifiées), frappe au clavier, marche bois/métal, saut/réception, escalier, portière, marche/grille, entrée/dialogue/sortie d'infirmerie et pause. Rapport : `work/checkpoints/sfx-browser.json`.
- Relecture indépendante : correction après tests rouges de deux cas limites (ancienne cour sans frame traitée comme intérieur ; porte d'arrivée relue à reprise de pause). Tests SFX verts après correction.
- Le pilote natif attend l'état jouable et peut reprendre une pause de chargement visible via les commandes normales. Ses empreintes sont prises sur toute la durée des sons pour éviter de confondre les zéros initiaux des souffles. Aucune règle de pause ni de contrôle du jeu n'a été assouplie pour le pilote.
- Publication du jeu `26f5dd6` réussie : [workflow 40081285032](https://github.com/Kouboy/Technoprof/actions/runs/40081285032). `build-info.json` public identifie ce commit ; test du lien sans query réussi dans Chromium, Firefox et Chromium tactile 390 × 844 (titre, artwork, démarrage, audio et commandes, aucun échec HTTP ni erreur JavaScript). Rapport : `work/checkpoints/pages-live.json`.
- Le test Pages attend désormais explicitement le chargement de l'image de titre, créée après le chargement du document. Le contrôle immédiat précédent pouvait échouer pendant son téléchargement.
