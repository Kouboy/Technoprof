# Cinématiques validées et publication — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans in the current session.

**Goal:** Intégrer les deux films validés dans le jeu puis fusionner et publier la version de playtest sur GitHub Pages.

**Architecture:** Intro nocturne 10 s, ouverture noire 1 s ; conclusion V3 69 s / 14 images (trajet en voiture et panorama avant la cloche). Assets originaux inchangés et recadrages cover des auditions. Deux lecteurs natifs synchronisés pour les stems musique/repères, horloge des repères pilotant le film, gains musique/SFX séparés, suspension en pause et mute silencieux sans figer le film.

**Spec:** Demande de Nicolas : intégrer les cinématiques mises à jour, fusionner et publier une version de test propre. Les trois affectations obligatoires, le retour protégé et l'arrivée à l'appartement restent intacts. Pas de nouvelle fonction de fenêtrage dans cette passe : la question concerne une future fenêtre dédiée, le ratio actuel reste 4:3.

## Tasks

- [x] Tests RED : 14 images/69 s, ouverture 1 s, assets approuvés et export des quatre stems ; ajouter couverture du cycle audio (pause, mute, bloqué/retry, source remplacée, fin/skip).
- [x] Remplacer le montage/découpage par ceux des auditions, embarquer les PNG corrigés sans modification, recadrer sans déformer ni bandes vides.
- [x] Intégrer CinematicSoundtrack et horloge audio, préserver les volumes séparés et supprimer les anciens cues doublés dans le profil musical. Les essais sans musique gardent leur horloge de simulation et leurs repères.
- [x] Mettre à jour les tests de journée/cinématiques et le catalogue Pages, inclure les contrôles cinéma/retour dans CI. Vérifier builds local et Pages, les checks requis et les films dans Chrome/Firefox/touch.
- [ ] Revue indépendante, commit de l'intégration, pousser la branche, fusionner dans main, attendre et vérifier le déploiement Pages ainsi que son identité de build. Conserver la 0.61 et le PNG utilisateur non suivi.

## Ledger

- Base 49bf32a sur codex/three-assignments-cinematics. Publication explicitement autorisée par Nicolas pour cette passe ; ne pas réclamer une nouvelle confirmation.
- Reproduire et corriger localement les assertions de catalogue encore limitées aux douze morceaux : treize pistes de jeu et quatre stems de films devront être livrés.

- RED observé : 12 images au lieu des 14 attendues. GREEN : montage 10/69 s, repères CSV et ordre exact de l'audition V3 ; PNGs byte pour byte et cover vérifiés.
- Revue indépendante en lecture seule : aucun défaut important relevé dans le lecteur, les transitions, pause/focus/menu ou le cadrage. Tests audio et art repassés par le reviewer.
- npm test complet : PASS après actualisation de l'assertion historique 059 pour les quatre palettes (nuit 21:30). Tests cinéma, journée, musique, retour, SFX, assets et Pages : PASS. Builds atelier/journée et web : PASS ; le warning de taille des bundles autonomes est celui déjà connu.
- Navigateurs : Chrome et Firefox lisent les films complets 10/69 s avec deux stems natifs alignés et horloge des repères ; pause de sept secondes stable. Les 14 images ont été capturées, y compris la voiture, l'AESH, le panorama et le réveil nocturne, puis relues. Touch 390×844 : commandes du film et ratio conservés. Rapport docs/cinematiques/browser-verification.json.
- Export Pages local : 47 images intactes, 17 WAV originaux, 156,9 Mio ; titre, routes, volumes et inputs natifs testés Chrome/Firefox/touch, aucune erreur JS ni ressource 404. Le workflow vérifiera également cinéma et retour.
- Le contrôle de fusion/déploiement est la dernière gate ; son résultat est porté par la PR et le workflow GitHub plutôt que par une nouvelle publication uniquement pour cocher ce document historique.
