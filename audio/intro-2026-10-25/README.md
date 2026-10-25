# Prise de service — introduction, première maquette

Ouvrir **Voir-Introduction.html**, puis **Voir depuis le début**. Le lecteur fonctionne directement depuis le disque, sans serveur ni connexion.

Deux plans sans dialogue, sur dix secondes :

| Temps | Image et intention sonore |
| --- | --- |
| 0–5,5 s | Réveil à 6h10, encore de nuit. Même alarme que dans la conclusion, basse tenue, piano grave descendant, chambre étroite et lourde. |
| 5,5–10 s | Café, manteau, livre, clés et départ. Six pulsations à 80 BPM, petites ponctuations de tissu, poignée, clés et pas. |

L'image suit le temps réel de la piste audio. Pause, reprise et recherche restent synchronisées. Le changement d'image intervient à 5,5 s, avec une apparition de 180 ms. Aucun texte narratif ni voix dans le film. La musique conserve une tension non résolue pour préparer le trajet.

La retouche d'éclairage des deux vignettes a été produite avec l'outil intégré image_gen : dehors, il fait encore nuit, comme au réveil final à 6h10. Le PNG généré est conservé intact dans `../../art/intro-2026-10-25/intro-night.png`. Prompt : `prompt-night.txt`, cadrages : `layout.json` dans le même dossier. Seul le lecteur effectue le recadrage, sans déformation.

## Sources et reproduction

Depuis la racine du dépôt, lancer `python tools/compose-cinematic-intro.py` avec NumPy installé. La partition éditable est `partition.json`, les repères et empreintes sont dans `manifest.json`. Le script réemploie les instruments originaux de la maquette de fin V3 et son alarme sèche ; il ne modifie pas cette fin.

Quatre pistes de musique utilisent des sources mono PCM 8 bits. Le rendu de diffusion est stéréo PCM 16 bits à 22 050 Hz pour conserver les gains et le mixage : il évoque le grain des samples Amiga sans prétendre émuler exactement Paula. Les bruitages de tissu, poignée et pas proviennent de la banque locale du jeu ; le tintement des clés est un nouveau sample original.

Livrables : musique seule, repères seuls et montage complet, chacun de dix secondes. Cette audition est indépendante : le jeu, sa version publiée et GitHub Pages restent inchangés jusqu'à validation.

## Vérifications

Chrome et Firefox, lecture locale hors connexion : durée, changement automatique à 5,5 s, pause, déplacement dans la piste, fin et relance. Lecture tactile et absence de débordement vérifiées dans une fenêtre 390 × 844. Les deux cadrages ont été relus sur captures. Trois WAV de 220 500 frames, sources exportées en 8 bits, aucun écrêtage ; rapports dans `verification.json` et `browser-verification.json`. L'intention musicale est proposée à l'écoute, pas évaluée par ces tests techniques.
