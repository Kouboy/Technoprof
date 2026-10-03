# TECHNOPROF 0.53 — Matières, conduite et ambiances audio

La passe remplace les bruitages génériques par une banque de matières synthétisée localement. Le but est d'identifier l'action et son résultat à l'oreille, avec une place pour le silence. Les paramètres et formes d'onde sont dans `src/audio-materials.ts` ; `src/audio.ts` assure les sources, le mixage et leur cycle de vie. Les règles, contrôles, dégâts et délais du jeu sont conservés.

## Sur la route

Moteur à impulsions de combustion et texture d'échappement, filtré selon la charge. Le régime monte dans chaque rapport ; un changement de rapport fait brièvement tomber la charge. Les bruits d'air et de roulement montent séparément avec la vitesse : à 260 km/h, l'air est bien plus présent qu'à 110 km/h, même si le moteur est dans un rapport supérieur. L'arrêt laisse le moteur au ralenti ; quitter la voiture le fait taire.

Pneus au freinage/dérapage, gravier sur l'accotement, petites résonances de tôle et choc sourd avec aftershocks de carrosserie. La voiture endommagée conserve la cadence plus fréquente de ses pièces desserrées. Dépassement et camion sont spatialisés du côté réel du passage ; le frôlement est plus présent qu'un passage distant. Le pic du déplacement d'air est placé près du moment où le véhicule croise le rétroviseur, puis décroît.

La voix de Radio Educ France baisse le moteur et le fond routier. À réception : relais, salves DATA et confirmation administrative. Notification, proximité et urgence prennent la priorité sur la conduite ; un frôlement ne peut pas raccourcir la priorité d'une notification en cours.

## Dans le collège

Le livre donne un choc mat avec un bord de papier ; la garde a un claquement plus sec et plus aigu, le coup reçu davantage de basses et de vêtement. Le dernier coup combine contact du livre et chute du corps. Le geste dans le vide produit un déplacement d'air plus léger. Le tampon possède une attaque courte de bois/caoutchouc ; le balayage a un souffle plus ample. Leur préparation fait entendre papier ou appui de chaussure selon le geste.

Pas, impulsion du saut, réception sur sol solide, effritement et récupération après chute remplacent les bips de mouvement. Les sons suivent les événements réels : une réception dans un trou n'est pas confirmée comme une réception sur sol solide. Les impacts gardent les pauses et réactions du combat existantes.

Cour sèche et fond discret ; intérieur avec air stagnant, alimentation des tubes et courte réflexion sombre. Quelques fuites ou relais irréguliers ponctuent les lieux concernés, sans simuler une alerte permanente. L'ambiance diminue pendant les introductions et le tic d'urgence est suspendu avec leur délai.

L'ouverture de 42C fait entendre poignée/porte. Sur le noir « Bon. Reprenons. » : deux chaises de côtés différents, deux mouvements de cahiers, puis quatre traits de craie. Après une pause, la séquence reprend à sa position ; quand le joueur passe à l'ellipse, les sources restantes sont annulées.

## Mixage et robustesse

Trois volumes persistants : **Effets et moteur**, **Voix de la radio**, **Ambiances et bruit de route**. Ce dernier inclut les chaises, cahiers et craie ; leur résonance passe par le même réglage. Les anciennes préférences restent valides avec un volume d'ambiance par défaut.

Sources limitées à 24 effets simultanés, cinq boucles permanentes silencieuses hors de leur phase, buffers en cache. PCM à 22 050 Hz préparé en petites tâches pendant le chargement, sans créer de contexte audio avant une action du joueur. Réduction des basses parasites et compresseur de sortie. Une coupure utilise une courte rampe ; pause, silence et changement de phase annulent aussi les sources programmées pour plus tard. Aucun fichier sonore distant ni dépendance supplémentaire.

## Vérification

Suite complète, TypeScript/Vite et export autonome passent. Tests spécifiques : PCM fini et niveau/DC bornés ; livre/garde/corps distincts par leur texture ; pic du dépassement ; création du contexte après geste ; caches ; vitesses/charge/rapports ; priorité radio/notification ; côté et intensité du passage ; volumes indépendants, y compris la classe ; urgence suspendue en dialogue ; pause/reprise/ellipse ; limite des sources et déconnexion ; événements réels de saut/chute/balayage.

Dans le navigateur : accueil et trois réglages observés, démarrage par le joueur, pause, silence/réactivation, puis vrai contact de livre dans l'atelier. Aucun warning ni erreur dans la console. Captures : `work/audio-reglages-053.png`. L'atelier a également déclenché sa protection de pause après un long frame de démarrage dans l'aperçu caché ; aucune stabilité de framerate n'est déduite de cet environnement.

Les vérifications navigateur utilisent Vite local avec ressources séparées, car l'outil d'aperçu dépasse sa limite de transport sur le gros HTML autonome. Le HTML et les ZIP sont vérifiés par dépendances, compilation et empreintes, sans déclarer leur lancement dans cet outil. L'écoute subjective, le naturel des timbres, l'équilibre sur les haut-parleurs habituels et le confort sur téléphone restent à valider en jouant.

## Écoute et comparaison

Ouvrir `Jouer-Technoprof.html`, ou extraire `Technoprof-0.53-testeurs.zip`. La 0.52 reste disponible dans son HTML et ses ZIP. Atelier : comparer conduite 40/260, freinage, accotement, livre/contact/garde, inspectrice/balayage et succès/entrée en classe.

[Montage des matières](work/matieres-audio-053.wav), 23 secondes : pas/saut/réception, livre/garde/corps, dossier/tampon/balayage, passages, pneus/tôle/choc, puis porte/chaises/cahiers/craie. Il utilise les mêmes PCM et gains de base, sans les filtres, le compresseur ou la réverbération du jeu ; il sert à comparer les matières. Repères dans `work/matieres-audio-053.txt`. Générateur reproductible : `work/preview-audio-053.cjs`.

Les deux props routiers signalés par le joueur sont présents dans la 0.52 conservée : château d'eau rare en retrait, armoire électrique de faible gabarit. Leur mise en valeur reste une retouche visuelle à reprendre après l'écoute de cette passe.
