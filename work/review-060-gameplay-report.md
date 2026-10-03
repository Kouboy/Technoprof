# Passe indépendante Game Dev Reviewer — règles et rythme 0.60

## Verdict

**VALIDÉ AVEC RÉSERVES pour la progression demandée ; correction ciblée nécessaire sur la mesure des dépassements réussis.** Aucun BLOCKER établi. Les réserves de rythme et de difficulté ne contredisent pas la demande explicite de doublement : elles exigent une découverte humaine, pas une réduction silencieuse de la charge.

Lecture intégrale du skill Game Dev Reviewer et des documents AUDIT-0.54, PLAN-APRES-REVIEW-0.54 et GAMEPLAY-0.60. Sources et runners lus. Tous les essais ci-dessous utilisent les règles courantes et des inputs, sans correction de position, HP, chrono ou phase pendant le parcours. Le harness remplace le rendu/audio ; ces mesures ne constituent donc ni un test visuel, ni une écoute, ni un test sur téléphone.

## Problèmes trouvés

### [IMPORTANT] Un choc peut être compté comme dépassement réussi

- Observation démontrée : 9 cas sur 9 (trois affectations, seeds 4301/8317/2026) enregistrent `near-pass`, puis `crash` sur le même objet véhicule environ 0,08–0,117 seconde après. Le test conduit à côté d'un véhicule naturellement présent, puis braque vers lui après le signal de dépassement. Exemple soir, seed4301 : near-pass à20,983s, distance17,61 ; crash à21,083s, distance1,66, véhicule78/100.
- Problème : les événements pass/near-pass servent au comptage de l'exposition réussie, alors que GAMEPLAY-0.60 annonce que les chocs ne sont pas comptés. Le son/texte de frôlement précède également un choc encore possible.
- Source : C:/Users/don_n/Documents/Codex/Technoprof/src/main.ts:1934 enregistre à `distance <= closing * 0.12`, avant le véhicule ; C:/Users/don_n/Documents/Codex/Technoprof/src/main.ts:1960 teste ensuite le contact. Le flag `sounded` ne constitue pas une réussite définitive.
- Reproduction : `node work/review-060-pass.cjs`, preuves dans work/review-060-pass-results.json.
- Correction minimale : conserver si souhaité un son anticipé, mais différer la validation du journal jusqu'à la sortie de la zone de contact sans `hit`, ou distinguer événement anticipé et dépassement confirmé. Ajouter ce cas à la vérification du comptage.
- Limite importante : instrumentation des quatre journées de référence seed4301, zéro objet simultanément `hit` et `sounded`. Leurs mesures10/20/40 ne sont pas réfutées par ce cas limite.

### [À SURVEILLER] R03 persiste dans les rencontres supplémentaires

- Observation démontrée dans les quatre parcours de référence : les12 rencontres ordinaires des39 tableaux ajoutés (3Bruel+9PRO) montrent une anticipation, mais aucune n'atteint sa pose d'attaque active avant défaite. La stratégie ordinaire se contente d'approcher et de frapper dès disponibilité, sans lire le timing. Élève/vigile supplémentaires : environ1,95–1,98s depuis l'entrée réelle, introduction exclue. Lanceurs supplémentaires70/85 : environ2,17–2,20s, aucun projectile émis avant défaite.
- Problème possible : quantité accrue, mais réponse du joueur commune ; la menace propre peut rester un détail visuel. Cela ne prouve pas que ces combats doivent durer plus longtemps ni que toute la journée est facile.
- Source : C:/Users/don_n/Documents/Codex/Technoprof/src/missions.ts:605, placements communs210 et2PV ; C:/Users/don_n/Documents/Codex/Technoprof/src/main.ts:2262 annule l'anticipation au coup ; C:/Users/don_n/Documents/Codex/Technoprof/src/main.ts:2603 lanceur.
- Preuve : work/review-060-reference.cjs / work/review-060-reference-results.json.
- Test humain : après les trois types ajoutés, demander ce qui distingue leur menace. Correction uniquement si distinction perdue : retoucher une entrée/portée/cooldown ; éviter de multiplier globalement les PV.

### [À SURVEILLER] La marge du soir tolère peu d'hésitation répartie

- Observation : référence seed4301, toutes les missions réussies, marge matin145,8–146,3s ; midi112,0–113,5s ; soir28,9–32,8s. Au soir, orientation chargée87,1–90,2s, rencontres21,9–22,6s, route60,9–61,0s. Ajouter une seconde sans input après chaque entrée/introduction fait échouer le soir au boss dans les quatre variantes, après succès matin/midi ; il reste2HP au professeur.
- Interprétation : sensitivity test du délai ; la seconde d'attente change aussi la position/état des ennemis et les timings de combat. Ce n'est ni une simulation fidèle d'un débutant, ni une preuve de difficulté injuste. Le doublement a été demandé explicitement.
- Source : C:/Users/don_n/Documents/Codex/Technoprof/src/missions.ts:578 (210s), :500 (29 nouvelles traversées), C:/Users/don_n/Documents/Codex/Technoprof/src/main.ts:2058 (temps actif).
- Reproduction : work/review-060-gameplay.cjs / work/review-060-gameplay-results.json, variantesreference/hesitate.
- Test humain : découverte complète avec hésitations et retour arrière consignés ; vérifier que l'échec est compris. Ajuster le délai seulement après arbitrage du niveau d'exigence voulu.

### [À SURVEILLER] L'accès de service PRO n'offre pas de compensation mesurée

- Établi : route sûre36 tableaux, route de service37 ;12 rencontres dans les deux ; branche sûre avecvigile22, service avecvigile25 et deux trous23. Référence : service coûte environ3s actifs supplémentaires sans gain de santé. Son introduction plus courte peut alléger le temps de lecture, lequel est suspendu.
- Risque de conception : la direction des trois établissements propose de choisir selon le risque ; si cette branche est censée offrir un raccourci utile, son coût actuel ne fournit pas de bénéfice identifié. La0.60 l'appelle honnêtement « accès de service » ; ne pas l'accuser de promettre un raccourci absent dans son changelog.
- Sources : C:/Users/don_n/Documents/Codex/Technoprof/src/missions.ts:221, :237, :494 ; DIRECTION-TROIS-AFFECTATIONS.md:19.
- Correction minimale selon intention : assumer un détour facultatif, ou compenser le risque par un segment plus rapide tout en préservant les minima demandés. Aucun changement silencieux de design recommandé.

### [POLISH] Le bilan désigne encore le collège lors d'un échec au lycée

- Établi : les quatre échecs de délai du soir produisent « RETARD DANS LE COLLEGE » dans results, donc dans le bilan qui nomme pourtant TiboInShape.
- Source : C:/Users/don_n/Documents/Codex/Technoprof/src/player-experience.ts:23.
- Correction minimale : « RETARD DANS L'ETABLISSEMENT », ou le type d'établissement issu des données mission.

## Ce qui paraît sain

- Quatre journées référence refaites, deux contrôles et deux branches : minima9/18/36, variantes10/18/37 ; toutes réussies ; rencontres3/6/12 minimum ; exposition10/20/40 sur ces cas, et absence de double comptage pass+crash dans ces références.
- Introductions manuelles, immobilisation, temps suspendu, confirmation consommée avant combat : sources cohérentes (main.ts1169,2060,2087,2106). Les tests060 couvrent les nouvelles entrées et revisites ; la suite globale est exécutée par l'agent principal.
- Boss différenciés : inspection par ouverture, parent influent par charge, sécurité par garde et rotation. Le runner applique effectivement des réponses séparées. Leur distinction ne repose plus sur une simple hausse de PV.
- Le chrono de référence distingue temps actif et suspendu ; introductions/arrivées/transitions n'expliquent pas une fausse baisse de marge. Les combats courts restent compatibles avec le délai.
- Hypothèse de bypass dominant par saut sans coups ordinaires rejetée dans cet essai : pertes de santé accrues, pas de succès démontré sur toute la journée. Ne pas la rapporter comme exploit établi.

## Suivi de la0.54

| Remarque | Statut dans ce périmètre |
|---|---|
| R01 passages directs | Résolue techniquement : les quatre journées direct empruntent les centres des indicateurs via passageMarker ; finissent. Validation doigt réel encore distincte. |
| R02 même collège/salle/boss | Résolue sur lieux/destinations/boss. Variété des décisions dans les nouvelles ailes encore ouverte :29 tableaux PRO sont une succession linéaire de quatre types, pas29 situations nouvelles. Respect du doublement demandé. |
| R03 élève/vigile réponse commune | Persiste ; les rencontres supplémentaires confirment une approche/frappe commune dans les cas testés. |
| R04 coût mobile | Toujours ouverte sur appareil réel. Aucun asset ajouté en0.60 ne supprime le besoin de mesurer les87,6Mo livrés. |
| R05 validation fragmentaire | Améliorée : parcours input-only continus, métriques et nouveaux cas limites. Son, compréhension, fatigue, téléphone et découverte restent non validés par ce harness. |
| R06 repères routiers | Hors observation visuelle de cette passe ; ne pas déclarer résolu sur la seule lecture. |

## Tests à effectuer en jeu

1. Deux branches PRO et comparaison du bénéfice compris avant engagement dans les trous.
2. Journée humaine continue : noter hésitations, retours, temps actif, fatigue, compréhension de l'échec du soir ; ne pas guider pendant la découverte.
3. Menaces supplémentaires : demander au joueur comment éviter chacune ; regarder si le projectile ou la poussée deviennent perceptibles à vitesse réelle.
4. Trafic du soir sur téléphone : véhicules éloignés, anticipation du freinage, occultations et geste tactile. Le conducteur anticipatoire lit coordonnées/vitesses exactes d'objets visibles jusqu'à900unités ; il n'éprouve pas leur discernabilité à cette distance.
5. Dépassement puis braquage tardif : vérifier la séparation entre son anticipé, frôlement confirmé et choc après correction du journal.
