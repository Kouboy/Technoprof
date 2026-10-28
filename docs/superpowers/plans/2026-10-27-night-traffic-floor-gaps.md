# Retouches : pas, trafic, nuit et deux ruptures de sol

**But :** remonter les appuis sans retrouver leur frottement, varier le trafic à densité identique, rendre le retour nocturne habité et ajouter les deux dangers demandés.

**Réalisation :** gains des pas ×1,4 environ ; samples, cadence, bus et musiques conservés. Variantes de peinture et de détails routiers stables, préparées une seule fois et indépendantes du tirage de circulation. Lumières placées dans les fenêtres réellement dessinées, lampadaires et lointain du retour Maison. Garde des proportions, collisions, couches et performances.

- [x] Pas : ajuster les gains des cinq sols ; vérifier variation et discrétion de l'infirmerie.
- [x] Route : variantes de carrosserie/détails pour voitures et camions, aucun ajout d'obstacle ni changement du planning.
- [x] Maison : lumières urbaines et quelques fenêtres allumées ; continuité des points lumineux, occultation correcte et aucune animation aléatoire par frame.
- [x] Berthelot : une rupture de plancher au seuil B12 (boss), hors point d'arrivée et porte ; vérifier charge/esquive/punition, pas de chute automatique.
- [x] Trois-Ponts : Nicolas a précisé le sas T03–T04, avec la lycéenne. I2 seulement ; I1 intact.
- [x] HUD : supprimer le nombre en pourcentage d'intégrité, conserver les cinq segments et leurs seuils.
- [x] Contrôles techniques et en situation, revue finale, reconstruire les deux jouables locaux. Aucune publication dans cette passe.

Les profils historiques A1/A2 et la 0.61 figée restent conservés. Le boss ne doit pas gagner de PV et le délai ne doit pas être ajusté pour compenser ces retouches.

## Arbitrages confirmés et validation

Nicolas a choisi explicitement des adversaires qui enjambent les trous, sans chute ni dégâts gratuits. Les deux ouvertures sont [126,156], loin des arrivées et portes. Le pas engagé est un état court avec arc visible (18 px, au plus 0,28 s), sans invulnérabilité ni modification des PV. La charge reste dangereuse et rejoint son ouverture de punition après l'atterrissage. Cette règle est limitée à A3/B12 et I2/sas ; les anciens parents du collège restent inchangés.

La projection neutre du solveur de collision et la reprise du boss ne doivent pas placer le professeur dans un trou à sa place. Ces déplacements se bornent au bord sûr ; les vrais coups, erreurs de saut et reculs de combat restent dangereux. La revue en lecture seule a contrôlé les positions des deux acteurs après cette correction.

Les variantes de trafic ont une identité stable par objet, sans utiliser le RNG de simulation. Quatre atlases de peinture et deux masques de fenêtres sont préparés une fois, puis réutilisés par le pool ; coût supplémentaire d'environ 36 Mio de pixels sources, aucun traitement de pixels par frame. Les vitres, feux, plaques, pneus et ombres restent ceux des dessins validés. Les fenêtres nocturnes et le lointain suivent leurs façades, leurs miroirs et la perspective.

`npm run test:playtest`, tests ciblés de géométrie, sauts, chute unique, pause et reprise, traversées NPC dans les deux sens à 30/60/120 fps et deux builds : verts. Le pilote de journée complète utilise de vrais inputs et lit désormais les trous pendant les déplacements de combat, avec sauts directionnels ; trois journées publiques complètes à trois fréquences passent avec les nouveaux sols.

Les anciens tests comparatifs de navigation/cycle conservent explicitement l'arène plate comme fixture de référence, pour isoler les variations de route et de soin. Ils ne prétendent pas valider le combat sur le nouveau sol. Celui-ci est couvert séparément par `check-combat-floor-gaps`, le pilote de journée publique et le navigateur.

`tools/check-night-combat-floor-browser.cjs` : scènes déclarées sélectionnées par UI, sonde de lecture seule, commandes natives dans Chromium/Firefox, aucune erreur JS. Captures du retour Maison, du boss réellement en train d'enjamber et du sas dans `work/checkpoints/night-combat-floors/`. L'agrément et le nouveau niveau de difficulté restent à confronter à l'essai humain.
