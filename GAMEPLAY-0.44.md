# TECHNOPROF 0.44 — Conduite, lot 2

Ouvrir `Jouer-Technoprof.html` pour la journée. `Jouer-Labo.html` propose maintenant 18 situations, dont conduite à 40/110/260 km/h, freinage face à un véhicule lent et sortie sur l'accotement. Les réglages de conduite sont regroupés dans `src/driving.ts`. La 0.43 reste conservée dans son HTML et son archive.

## Changements perceptibles

La collision prend en compte la largeur de la voiture du professeur **et** celle de l'obstacle. Les dimensions de référence sont 42 pixels logiques pour la voiture, 52 pour la berline, 46 pour la compacte et 68 pour le camion. Le seuil entre centres est leur somme divisée par deux ; les anciens seuils de 0,24/0,30 ignoraient une bonne partie des carrosseries. Les emprises restent une approximation arcade au sol, indépendante des textures et des rétroviseurs, pas des collisions pixel à pixel.

L'accotement commence lorsque le bord de la voiture dépasse la chaussée. Le ralentissement augmente progressivement avec le débordement et la vitesse : on peut récupérer d'un écart bref, mais rouler constamment hors de la chaussée n'est plus rentable. Poussière près de la roue extérieure, grondement et message bref confirment ce qui se passe. Aucun dégât automatique ajouté pour un simple écart.

La projection donne plus de taille aux véhicules éloignés. Sa focale passe de 22 à 65 ; le trafic est dessiné jusqu'à 900 unités de distance visuelle. Route, véhicules et repères de l'atelier utilisent la même fonction de projection. Les repères de roues sont réappliqués lorsqu'une image du pool change de frame. Les sprites existants sont conservés.

Le trafic suit une séquence réglable : véhicule isolé à droite, camion à gauche, compacte centrale suivie d'un véhicule décalé, grand espace libre, puis nouveaux dépassements. Les vitesses individuelles diffèrent. La seed introduit de petites variations d'espacement. Le trafic reste continu pendant le cruising et la notification ; aucun remplacement général à l'affectation. Un véhicule dépassé n'est recyclé que derrière la caméra, et réintroduit au-delà de la distance visible. Les quantités initiales 5/8/11 sont conservées ; l'espacement, et non une densification générale, compose la difficulté.

Le son de dépassement commence environ 120 ms avant le croisement ; sa durée et son niveau suivent la vitesse relative. Le frôlement utilise la distance libre entre les carrosseries. Un véhicule ne rejoue pas plusieurs fois son son ni ses dégâts lors du même contact. Le choc combine un bruit grave de carrosserie, un claquement court et deux résonances métalliques. La poussée latérale est réduite (plus forte contre le camion), reste orientée et s'amortit rapidement. Les dégâts et la perte de vitesse restent visibles. Les traces de freinage existantes sont conservées.

## Règles conservées

Cruising plafonné à 110 km/h, affectation jusqu'à 260 km/h, accélération progressive, frein et inertie. La direction ne déplace plus latéralement une voiture complètement arrêtée. Virages symétriques et relief existants conservés. Kilomètres = intégrale des km/h ; l'amplification visuelle à haute vitesse reste un réglage arcade séparé. Cinématique d'arrivée toujours hors chrono.

## Vérifications

- `npm test`, compilation TypeScript/Vite et export autonome passent. Parcours complet conduite → détour → inspection → classe rejoué avec de vrais inputs simulés et le profil livré.
- Deux stratégies de dépassement distinctes terminent les trois trajets. Avec la seed 4401, la première affectation est terminée sans choc ; la troisième tolère un choc pour la stratégie préférant la droite. Résultats : `work/driving-044-results.json`.
- Cinq seeds, deux stratégies chacune : les dix premiers trajets arrivent sans choc. Il s'agit de pilotes de test anticipant le trafic visible, pas de novices humains.
- Ancienne stratégie à x=−0,98 : deux chocs ; x=+0,98 : trois. Elle peut encore finir grâce à la marge d'erreur, mais n'est plus gratuite. Rester à ±1,15 sur l'accotement fait dépasser le délai.
- Même situation de véhicule lent à 260 km/h : après deux secondes, accélérer sans bouger provoque un choc ; freiner l'évite. Cela confirme une fenêtre de décision utile, sans imposer de freinage artificiel à tous les dépassements.
- Limites de collision des trois types, symétrie et progressivité des accotements, récupération après choc, un seul contact/son par passage et recyclage hors vue vérifiés.
- Accélération visuelle et inertie vérifiées à 40, 110 et 260 km/h. Anciennes régressions de combat, HUD et chronomètre conservées.
- Navigateur : export exact servi localement, route et véhicule lent observés avec les repères de géométrie, sélection des nouveaux scénarios. Le navigateur de contrôle en arrière-plan subit encore des interruptions >1 s ; l'observation visuelle utilise la pause et le pas à pas. Ni la fluidité d'une session humaine ni la qualité sonore à l'écoute ne sont certifiées par ces tests. Tester dans le navigateur habituel reste nécessaire.

L'avertissement Vite sur le gros bundle est attendu : tous les assets restent inclus pour l'ouverture locale autonome. Aucun nouvel asset ni dépendance ajouté. Le lot 3 pourra maintenant travailler les poses et réactions de combat ; le ressenti de conduite reste ajustable à partir d'un retour de jeu humain.
