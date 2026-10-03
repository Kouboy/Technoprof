# TECHNOPROF 0.48 — Dialogues et vitesse

Retour de test du 1er octobre 2026. Le jouable principal reste `Jouer-Technoprof.html`, sans installation. La 0.47 est conservée dans `Jouer-Technoprof-0.47.html` et ses archives.

## Conversations

Les premières rencontres avec le parent, l'élève, le vigile et l'inspection immobilisent les deux personnages et suspendent le délai. Le texte se dévoile à 34 caractères par seconde. X affiche immédiatement la page en cours ; une nouvelle pression passe à la suivante. Sur la dernière page entièrement affichée, X ferme l'échange. Cette pression ne déclenche jamais de frappe. Maintenir X ne fait pas défiler les pages. L'échange ne se répète pas après un aller-retour dans la pièce.

Chaque bulle garde ses dimensions pendant l'affichage et indique « X : AFFICHER », « X : SUITE » ou « X : TERMINER ». Le CADRE affiche le délai suspendu, sans suggestion de déplacement pendant l'échange. Le professeur reste opaque et immobile même si une direction est maintenue. Les rappels de combat commencent après la fermeture de la conversation.

Cette règle remplace les neuf secondes automatiques et l'interruption des répliques par un coup des versions précédentes. Données et progression dans `src/dialogue.ts`, intégration dans `src/main.ts`, composition dans `src/school-props.ts`.

## Inspection

La pose du balayage passe de 120 à 360 ms. La pose du tampon dure 180 ms. L'anticipation du balayage reste de 800 ms et la récupération de 1,1 s, qui comprend le suivi du coup. La portée de 78 unités reste identique. Les dégâts sont appliqués une seule fois au contact, pas à chaque image de la pose prolongée. Un scénario « Inspectrice / balayage » est disponible dans l'atelier.

## Conduite

Le défilement du monde est multiplié par 2,4. À vitesse constante, cela donne 73,3 unités/s à 110 km/h et 286 à 260 km/h. L'amplification progressive à haute vitesse est conservée. Le trafic roule et ses intervalles sont espacés avec le même facteur, afin de préserver son rythme d'arrivée tout en accélérant l'approche visuelle. Il entre toujours au-delà de la distance visible lors du recyclage. La caméra et les emprises de collision ne changent pas.

Les kilomètres restent l'intégrale de la vitesse affichée en km/h : le trajet fait toujours 4,2 km, le plafond avant affectation reste à 110 km/h et le maximum à 260. Le scénario de freinage conserve sa marge temporelle avec une distance initiale recalibrée. Réglage central : `DRIVE.motionScale` dans `src/driving.ts`.

## Établissement

Le collège devient **Collège C. Hanouna** : destination abrégée « C. HANOUNA » dans le CADRE, nom complet sur les façades d'arrivée. Les services utilisent actuellement le même nom de collège ; aucune nouvelle destination n'est inventée.

## Vérifications et limites

- Suite complète `npm test`, compilation TypeScript/Vite et contrôle de l'export autonome : réussis.
- Quatre conversations testées à 15, 30, 60 et 120 images/s : immobilité, temps suspendu, révélation, maintien de X, pause, confirmation sans coup, retour dans la pièce et actions pendant le fondu.
- Balayage testé avec et sans contact : pose encore visible après 200 ms, dégât unique, récupération conservée.
- Défilement et progression physique des kilomètres vérifiés séparément. Six parcours pilotés par inputs atteignent l'arrivée sans choc ; les bandes fixes ne constituent pas un passage sûr. Freinage et accotements passent les régressions.
- Le navigateur d'arrière-plan permet de contrôler la composition et les transitions au pas à pas, mais ne permet pas de juger honnêtement la sensation de vitesse en plein écran ni la fluidité en temps réel. Le ressenti de la nouvelle conduite reste à confirmer par une session humaine.

Preuves : `work/tests-048.txt`, `work/build-048.txt`, `work/validation-048.txt` et `work/dialogue-048.png`. Les avertissements connus concernent le gros paquet d'images embarquées et l'API expérimentale Node utilisée par le banc de tests.
