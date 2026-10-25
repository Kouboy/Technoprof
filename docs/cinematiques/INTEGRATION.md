# Cinématiques intégrées au jeu

Le profil musical local et GitHub Pages emploient les films validés du 25 octobre : introduction 10 s, conclusion V3 69 s / 14 images. Les auditions restent consultables, mais leur contenu rejoint désormais le moteur.

L'introduction utilise `art/intro-2026-10-25/intro-night.png` et s'ouvre depuis le noir pendant une seconde. La conclusion reprend le storyboard V2, le visiteur avec son manteau, le trajet en voiture corrigé et le panorama du campus placé juste avant la cloche. Tous les PNG sont embarqués sans modification ; les recadrages cover et le focus AESH reprennent les auditions, sans étirer les images ni laisser de bandes vides.

Les quatre WAV musique/repères validés restent inchangés. `CinematicSoundtrack` utilise deux lecteurs natifs : les repères pilotent les images ; la musique reste alignée sur cette horloge. Musique et bruitages conservent leurs réglages séparés. Pause, menu et perte de focus suspendent les deux pistes. Mute et volume musical nul ne figent pas le film. Une politique de lecture bloquée expose la commande de relance ; passer le film coupe ses lecteurs.

La musique du rêve s'interrompt à 62 s, cloche et image arrivent ensemble ; le réveil nocturne suit à 63,2 s. Aucun cue ancien ne s'ajoute au montage sonore dans le profil musical. Les essais historiques sans profil musical gardent leur simulation et leurs repères sonores.

La journée complète exige trois réussites puis enchaîne le retour à Maison et son arrivée automatique avant la conclusion. La 0.61 reste conservée séparément. GitHub Pages exporte treize thèmes de jeu et ces quatre stems ; aucun WAV de maquette inutilisé n'est publié.

Vérifications : `test:cinematiques`, `test:journee`, `test:retour-maison`, `test:musique`, `test:sfx`, `test:assets`, `test:pages`, `build:pages`. Contrôles natifs : `work/check-cinematic-browser.cjs` et `work/check-pages-browser.cjs` avec `PLAYWRIGHT_MODULE` configuré.
