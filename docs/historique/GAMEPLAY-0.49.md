# TECHNOPROF 0.49 — Clavier, souris et toucher

Ouvrir `Jouer-Technoprof.html`. Le contrôle direct est disponible dans la journée normale et l'atelier. La 0.48 est conservée dans son HTML et ses archives.

## Commandes clavier

ZQSD et les flèches donnent les mêmes actions : Z/haut accélère ou emprunte un accès montant ; S/bas freine ou emprunte un accès descendant ; Q/gauche et D/droite dirigent ou font marcher. Espace saute. F et X frappent, révèlent une réplique ou la poursuivent. P/Échap ouvre la pause, M coupe le son.

Les alias s'additionnent sans déclencher deux frappes : maintenir X puis appuyer sur F ne constitue pas un nouveau coup. Une pression très courte reste reconnue même si la touche est déjà relâchée au prochain calcul du jeu.

## Contrôle direct commun à la souris et au toucher

Il n'y a ni croix ni boutons virtuels sur la scène.

- Route : maintenir un clic ou un doigt dans la scène accélère. Glisser horizontalement change la position latérale demandée ; le braquage conserve son inertie. Glisser vers le bas freine, revenir vers la hauteur initiale accélère de nouveau. Relâcher laisse rouler.
- École : cliquer/toucher le sol donne une destination. Le professeur marche jusqu'à elle. Cliquer/toucher un adversaire vivant lui donne un ordre d'approche puis une seule frappe. Une nouvelle pression est nécessaire pour frapper de nouveau. La garde et les timings de l'inspection restent actifs.
- Portes et escaliers : toucher leur zone visible donne un ordre d'approche, puis active l'accès quand le professeur peut l'emprunter. Un passage fermé ou la classe encore gardée ne s'ouvre pas automatiquement. Les limites latérales des tableaux se traversent en touchant le sol près du bord ouvert.
- Saut : glisser vers le haut. Un glissement diagonal ajoute un déplacement dans cette direction ; un glissement vertical conserve la destination déjà demandée.
- Dialogue : chaque clic/toucher révèle la page puis la poursuit. La dernière confirmation est consommée par le dialogue. Le délai reste suspendu.
- Après le cours et un échec : toucher la scène poursuit, après la même courte période de lecture qu'au clavier. Accueil, réglages, pause et bilan utilisent leurs boutons HTML habituels.

Un petit repère confirme une destination, un accès ou une cible. La logique ne téléporte pas les acteurs et n'évite pas les obstacles à la place du joueur : franchir un trou demande toujours un saut. Une blessure, une chute, une pause ou une transition annule la destination en cours. Une commande clavier prend immédiatement la main sur un ordre direct. Un deuxième doigt est ignoré pendant le geste en cours ; ce mode est prévu pour un doigt, comme pour un seul pointeur souris.

## Présentation mobile

Les menus s'étendent à l'écran sur petit affichage ; les boutons restent atteignables au toucher. Le cadre du jeu reste en 4:3, sans recadrage des ennemis ou du CADRE. Les consignes et la radio restent sous la scène. Sur petit écran, les répliques disposent aussi d'un texte lisible sous le jeu, synchronisé avec leur révélation. Le paysage est conseillé.

## Architecture et vérification

`src/controls.ts` fusionne les sources en actions communes. `src/direct-input.ts` interprète les gestes et produit les mêmes actions que le clavier. `DIRECT` centralise les seuils de geste, d'arrivée et de correction du braquage. `Game.pointerExits()` partage les accès réellement ouverts entre les deux modes.

La suite complète, TypeScript/Vite et l'export autonome passent. Les essais couvrent les alias, appuis courts et simultanés, pause, marche, saut diagonal, approche/frappe unique, garde, portes, cours et échec. Le véritable adaptateur Pointer Events est testé avec des événements souris et tactiles, y compris conversion des coordonnées, capture, annulation et perte de focus. Un trajet piloté uniquement par gestes atteint la première arrivée avec 100 % d'état auto et sans choc dans le scénario déterministe.

Dans le navigateur : échange avancé par clics dans la scène, menu de commandes et accueil contrôlés à 844×390 et 375×812, lancement de la journée et absence de commandes superposées vérifiés. Le navigateur caché suspend les longues images : cela permet la composition et le pas à pas, pas une validation honnête de la fluidité ou du ressenti tactile. Aucun vrai téléphone n'a encore été testé.

Preuves : `work/tests-049.txt`, `work/build-049.txt`, `work/validation-049.txt`, `work/mobile-jeu-049.png`. Archives autonome et testeurs en 0.49.
