# Retour à la maison — prototype local

Demande de Nicolas du 25 octobre 2026, désormais implémentée dans la branche locale de campagne. Publication inchangée.

Après le troisième et dernier cours : quatrième trajet en pleine nuit, très peu de circulation, vitesse lente comparable au cruising avant affectation. Quelques kilomètres jusqu’à la destination affichée **Maison**, avec un autoradio **smooth jazz mélancolique**. Cette respiration accompagne le retour chez lui avant la correction des copies et la cinématique de fin.

Il s’agit d’un trajet de retour, pas d’une quatrième affectation. Nicolas a choisi le retour protégé : les collisions ralentissent et secouent la voiture, sans réduire son état ni annuler les trois réussites. Les dégâts déjà présents restent visibles. Aucun chrono, bulletin ou ordre de mission.

## Essai local

Ouvrir `Jouer-Technoprof-Retour-Maison.html` à la racine, puis **Rejouer**. Le raccourci pointe vers l’atelier `home-return`, musique activée. La journée complète rejoint également ce retour après le troisième cours. Les maquettes récentes des cinématiques restent des auditions séparées ; ce trajet rejoint la conclusion actuellement intégrée au moteur.

3 km, vitesse initiale et allure de relâchement 80 km/h, plafond 110 km/h. Z/↑ accélère, S/↓ freine jusqu’à l’arrêt, QD/←→ dirige ; souris/touch comme sur les routes précédentes. Relâcher le frein reprend progressivement l’allure. Durée autour de deux minutes selon la conduite.

À destination : arrêt automatique à droite en 1,8 s, puis fondu noir 1,2 s et respiration noire de 0,25 s avant la conclusion. Le moteur cesse à l’arrêt, la radio s’éteint avec le fondu. Pause/focus/menu figent la séquence.

Réglages : `HOME_DRIVE` et `homeTrafficCue` dans `src/driving.ts`. Musique originale **Maison — Après les cours**, 76 BPM, quatre pistes de tracker et sources PCM 8 bits : `audio/retour-maison-2026-10-25`. Test de boucle et de campagne : `npm run test:retour-maison`.
