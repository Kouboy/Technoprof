# Retour à la maison — prototype local

Demande de Nicolas du 25 octobre 2026, désormais implémentée dans la branche locale de campagne. Publication inchangée.

Après le troisième et dernier cours : quatrième trajet en pleine nuit, très peu de circulation, vitesse lente comparable au cruising avant affectation. Quelques kilomètres jusqu’à la destination affichée **Maison**, avec un autoradio **smooth jazz mélancolique**. Cette respiration accompagne le retour chez lui avant la correction des copies et la cinématique de fin.

Il s’agit d’un trajet de retour, pas d’une quatrième affectation. Nicolas a choisi le retour protégé : les collisions ralentissent et secouent la voiture, sans réduire son état ni annuler les trois réussites. Les dégâts déjà présents restent visibles. Aucun chrono, bulletin ou ordre de mission.

## Essai local

Ouvrir `Jouer-Technoprof-Retour-Maison.html` à la racine, puis **Rejouer**. Le raccourci pointe vers l’atelier `home-return`, musique activée. La journée complète rejoint également ce retour après le troisième cours. Les maquettes récentes des cinématiques restent des auditions séparées ; ce trajet rejoint la conclusion actuellement intégrée au moteur.

3 km, vitesse initiale et allure de relâchement 80 km/h, plafond 110 km/h. Z/↑ accélère, S/↓ freine jusqu’à l’arrêt, QD/←→ dirige ; souris/touch comme sur les routes précédentes. Relâcher le frein reprend progressivement l’allure. Durée autour de deux minutes selon la conduite.

À destination : cut de profil devant l'immeuble vétuste. La voiture se gare en 1,8 s, le moteur s'arrête, le professeur descend à 2,25 s et la portière claque à 2,65 s. Il marche automatiquement et lentement jusqu'au seuil pendant 6,5 s. Après un bref arrêt, fondu au noir de **2 secondes**, puis maintien noir de 0,25 s avant la conclusion. La radio s'éteint pendant la sortie ; les pas sont sur béton. Pause/focus/menu figent la séquence.

Pour contrôler cette arrivée rapidement : `Jouer-Technoprof-Arrivee-Maison.html`, puis **Rejouer**. Il ne reste que 70 mètres avant la scène.

Réglages : `HOME_DRIVE` et `homeTrafficCue` dans `src/driving.ts` ; `HOME_ARRIVAL` et `homeArrivalFrame` dans `src/home-arrival.ts` pour la cinématique. Musique originale **Maison — Après les cours**, 76 BPM, quatre pistes de tracker et sources PCM 8 bits : `audio/retour-maison-2026-10-25`. Test de boucle et de campagne : `npm run test:retour-maison`.
