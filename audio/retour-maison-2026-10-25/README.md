# Maison — Après les cours

Autoradio instrumental du quatrième trajet : smooth jazz mélancolique, piano électrique, basse ronde, anche soufflée et batterie feutrée. 76 BPM, 16 mesures, boucle de 50,526 s. Harmonie mineure enrichie et phrases espacées ; aucune voix ni bulletin parlé.

`13-retour-maison.wav` est joué par le sélecteur musical du jeu pendant le retour et son stationnement. Il s'atténue entre l'arrêt du moteur et la sortie du professeur (1,8–2,25 s), puis laisse entendre la portière et les pas. La marche automatique se termine devant l'appartement, suivie d'un fondu noir de deux secondes avant la conclusion. Les pauses et le mute conservent la position du morceau.

Sources : `tools/compose-home-radio.py`, partition JSON et module ProTracker quatre pistes éditable. Les neuf samples sont originaux, repris de la banque musicale du jeu et quantifiés en PCM 8 bits ; le mix de diffusion est stéréo 16 bits / 22 050 Hz, filtré comme un petit autoradio avec un souffle léger. Pas d'enregistrement ni d'outil musical externe. La piste ne réécrit aucun morceau déjà validé.

Reproduction depuis la racine : `python tools/compose-home-radio.py` (NumPy). Empreinte, durée et niveaux dans `manifest.json`. Écoute isolée possible en ouvrant directement le WAV.
