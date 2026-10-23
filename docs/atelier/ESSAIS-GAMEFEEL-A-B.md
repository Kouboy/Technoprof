# Essais de gamefeel — lots 0 et 1

**B validée par Nicolas après essai : adoptée comme réglage normal.** A reste disponible dans cet atelier pour comparaison ; aucun export n’est nécessaire pour cette décision.

Ouvrir `C:/Users/don_n/Documents/Codex/Technoprof/Jouer-Technoprof-Atelier-Gamefeel.html`.
Le raccourci et `Jouer-Technoprof.html` doivent rester dans le même dossier. Aucune connexion ni serveur requis.

## Comparer

1. Jouer la rencontre aux Ormeaux en A, puis en B. Changer de variante recommence exactement la situation ; les dialogues restent manuels.
2. Refaire la comparaison contre le Parent influent. Il conserve ses PV et sa reprise après deux coups.
3. Essayer le couloir à deux trous, avec quelques sauts demandés légèrement avant la réception. Un saut très en avance expire ; tomber dans un trou reste une chute.
4. Essayer aussi au clic et par glissés tactiles si possible. Une pression maintenue ne répète pas les frappes/sauts.

La situation et la variante se choisissent dans les deux listes dédiées. **Rejouer** recommence la situation courante. Si un journal est utile pour une prochaine analyse, l’exporter avant de changer de situation ou de variante : chaque essai a son journal et ses mesures de frames propres.

| Variante | Frappe suivante anticipée | Saut avant réception |
| --- | --- | --- |
| A — référence | 100 ms | Aucun buffer |
| B — tolérance | 160 ms | 90 ms de temps contrôlable |

Le hit stop volontaire suspend la consommation du buffer ; une blessure l’annule. Pause, menu, porte, dialogue, soin, chute et reprise imposée annulent les commandes en attente. Aucune grâce après le bord d’un trou n’est ajoutée.

Le panneau de diagnostic affiche les six dernières décisions de commandes. Le journal JSON porte `gamefeel.variant`, `station`, `tuning` et les événements `control` : demande, intention souris, acceptation, mise en attente, refus, expiration ou annulation. Ce diagnostic est réservé à cet atelier.

## Journée normale

`C:/Users/don_n/Documents/Codex/Technoprof/Jouer-Technoprof-Journee-Atelier.html` utilise les tolérances B : frappe anticipée de 160 ms, saut anticipé de 90 ms avant réception. PV, délais, patterns et densités restent identiques. Cette passe corrige les aides H1 et la confirmation des dépassements : le son accompagne l’approche ; le journal et le message de frôlement attendent le dégagement sans contact. Le fichier publié 0.61 est préservé.

## Retours utiles

- Une commande semble-t-elle ignorée ? Quelle situation et quelle variante ?
- B paraît-elle plus naturelle, ou déclenche-t-elle un saut/coup que vous ne vouliez plus ?
- Le cycle esquive / un ou deux coups / reprise du Parent reste-t-il clair ?

Les tests automatisés vérifient les règles, les annulations et les transitions. Ils ne décident pas de la préférence A/B, du ressenti tactile sur téléphone ou du mixage sonore.

Validation de livraison du 23 octobre : suite complète, contrôles ciblés gamefeel, journée H1/A3/I2 à 30/60/120 fps, cycle du Parent, interface et catalogue d’assets verts. Atelier et journée ouverts hors ligne dans Chromium et Firefox ; choix A/B, trois situations, clavier réel du navigateur, export et rejeu vérifiés sans erreur de script. La revue indépendante a conduit à quatre corrections testées : borne des 90 ms, isolation des mesures de frames, commandes à la reprise et décision de saut pendant le hit stop.
