# Une école possible — maquette d’écoute 1

Ouvrir **Voir-La-Fin.html**, puis **Voir depuis le début**. Le lecteur montre les douze images de la conclusion et utilise la position du fichier sonore comme horloge : image, musique et bruitages se suspendent et reprennent ensemble. Le navigateur coupe la lecture quand on change d’onglet. Conserver ce dossier dans le projet pour retrouver les images relatives.

**Fin-Musique.wav** contient la composition seule sur 57 s ; silence musical exact à partir de 50 s. **Fin-Reperes.wav** contient sonnette, cloche et téléphone, plus un souffle de pièce très discret au réveil. **Fin-Montage.wav** réunit les deux pour juger la rupture avec les images.

La direction validée est la croyance sincère au rêve : fatigue au début, ouverture progressive dans le campus, résolution en la bémol majeur à 44 s, aucune annonce musicale de la rupture. La musique et ses réflexions s’arrêtent à 50 s. La cloche du jeu sonne seule ; à 51,2 s, l’alarme sèche prend le relais. Un motif initial rappelle seulement le contour de basse F / Eb / D / Ab déjà reconstruit pour le titre ; la mélodie de ce morceau est nouvelle.

Les douze instruments sont synthétisés localement puis quantifiés en PCM signé 8 bits avant transposition et séquençage. Quatre voies de samples : basse, piano mélodique, accords de cordes pré-échantillonnés, arpèges/nappe. Les accords stockés dans les samples contiennent plusieurs notes. Le WAV stéréo final est en 22 050 Hz / 16 bits, comme les maquettes précédentes ; il ne prétend pas émuler exactement Paula. La partition libre en secondes n’est pas un MOD. Aucun enregistrement ni service de génération externe.

`partition.json` contient les notes, durées, voies et gains ; `samples/` les sources 8 bits ; `manifest.json` les repères, formats et empreintes. Reproduction : Python avec NumPy, `tools/compose-cinematic-dream.py`. La cloche provient de `audio/sfx-2026-10-24/bell-start-1.wav` ; sonnette et alarme reprennent les hauteurs et rythmes du jeu, rendus séparément pour cet essai.

Maquette non intégrée : aucun changement des musiques validées, du jeu ou de GitHub Pages. Écoute humaine attendue sur la progression, le grain des timbres, la sincérité de l’apaisement et la violence ressentie du réveil.
