# Gamefeel : confiance et tolérances comparables

Validation : propositions de l’audit du 23 octobre, accord de Nicolas. Lots 0 et 1 seulement ; autres réglages après essais humains.

## Contrat joueur

- Les aides du premier collège réapparaissent après les dialogues, aux endroits utiles.
- Un bruit d’approche n’est pas une réussite : le dépassement est confirmé après dégagement complet, sans collision ni chevauchement protégé par le cooldown.
- La journée conserve ses règles de référence. Un atelier A/B compare frappe 100/160 ms et saut 0/90 ms, sans modifier dégâts, PV, délais, circulation ou attaques ennemies.
- Une commande mise en attente ne traverse ni pause, ni dialogue, ni porte, ni soin, ni chute, ni coup reçu.

## Étapes

1. Tests ciblés rouges : aides H1 et confirmation routière. Corriger puis vérifier les cas limites (proximité, collision tardive, cooldown, recyclage, fréquences différentes).
2. Tests rouges : profils A/B, buffer de saut et annulation des intentions. Centraliser les profils, conserver le défaut A ; journaliser demandes et décisions uniquement en atelier.
3. Atelier court : variantes A/B et stations rejouables (rencontre, Parent, trous), raccourci local et journal identifié. Pas de nouvelle topologie ni de progression automatique inventée.
4. Vérification technique et navigateur, exports locaux, revue indépendante finale. Conserver 0.61 et le fichier non suivi préexistant. Aucun push/publication.

## Validation

Tests unitaires/simulation ciblés, suites existantes pertinentes puis complètes, journée à plusieurs fréquences, compilation, contrôle des exports hors ligne et de l’atelier au navigateur. Les essais automatisés prouvent les règles ; le choix A/B reste un essai humain.
