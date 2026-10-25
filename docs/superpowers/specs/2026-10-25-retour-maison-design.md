# Retour Maison — quatrième trajet

Respiration jouable après les trois cours réussis, avant le bureau de la conclusion. Nicolas valide le retour protégé et demande explicitement un fondu au noir à l'arrivée. Aucun nouvel ordre de mission ni quatrième affectation.

- 3 km, pleine nuit, plafond 110 km/h, circulation très rare. Conserver conduite, freinage et contrôles clavier/souris/touch. Proposition de tuning : départ 80 km/h, régulation douce vers 80 lorsqu'on relâche l'accélérateur ; le frein permet de s'arrêter. Cela laisse environ deux minutes de décompression.
- CADRE : « MAISON », distance restante, vitesse et état auto. Le délai et la salle disparaissent au profit de « FIN DE SERVICE ». Couleurs calmes, aucune urgence rouge ou alerte de délai.
- Même voiture cabossée et mêmes dégâts qu'à la fin du dernier service. Les chocs donnent recul, bruit et ralentissement, mais ne diminuent plus l'état auto ; aucune panne ni défaite ne peut annuler la réussite acquise.
- Autoradio instrumental smooth jazz mélancolique, samples originaux PCM 8 bits, quatre voix. Aucun bulletin parlé, notification DATA ou ping urgent. Pause, menu, mute et perte de focus suspendent correctement le son et la route.
- À destination (retouche validée après essai) : cinématique de profil devant son appartement vétuste. Stationnement 1,8 s, extinction du moteur, sortie puis claquement de portière ; marche lente et automatique jusqu'à sa porte, puis fondu noir de 2 s et maintien noir 0,25 s avant la conclusion. La radio disparaît pendant la sortie ; les pas et la portière restent seuls. Pas de nouvel établissement à traverser.
- Trois réussites restent requises ; un échec pendant les trois affectations termine toujours la tentative. Le retour n'ajoute pas de résultat et ne relance pas le dernier cours.

Approche retenue : deux états explicites `home` et `homeArrival`, projection et conduite existantes réutilisées ; réglages dédiés dans driving.ts. Un simple cruising `free` relancerait l'affectation ; une quatrième MissionSpec introduirait un faux service. Ces deux options sont écartées.

Livraison locale dans la branche existante, avec un raccourci direct pour tester ce retour. Préserver la 0.61, la publication et les deux maquettes de cinématiques validées. Leur intégration au jeu reste une passe séparée : le retour rejoint le montage de conclusion actuellement intégré.
