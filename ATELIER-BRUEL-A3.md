# Bruel — atelier A3 : pression des combats et soin plus tardif

A3 répond aux deux journaux A2 fournis le 4 octobre : les cinq adversaires
ordinaires étaient vaincus en deux à trois secondes, sans perte de vie avant
le boss. Les frappes répétées interrompaient leur préparation puis cumulaient
étourdissement, récupération et attente. Raccourcir seulement l'anticipation
ne suffisait pas. Les journaux personnels ne sont pas copiés dans le dépôt.

## Lancer

Ouvrir **Jouer-Technoprof-Atelier-Bruel-A3.html** dans le dossier du projet.
Cet export autonome contient le jeu et ses images (environ 88 Mo). Il démarre
sur « Bruel A3 / combats plus vifs ». A1 et A2 restent dans le sélecteur pour
comparer. Le scénario « jonction et soins » commence après les trois premières
rencontres, déclarées terminées, pour tester directement le nouveau détour.

Depuis les sources : `npm run build:atelier`, puis `npm run dev` et
`/?essai=labo&scenario=bruel-navigation-a3`. Le scénario `-road` inclut le trajet.
Flèches/ZQSD, Espace, F/X, souris et gestes tactiles restent les commandes.
La journée publiée et le HTML gelé 0.61 sont inchangés.

## Combats

Les ennemis approchent plus vite, préparent leurs coups plus rapidement et
reprennent l'initiative plus souvent. L'élève prépare en 0,34 s, le vigile
en 0,38 s et le parent en 0,50 s. Le boss est également plus vif.

Une frappe interrompt encore le coup adverse, mais l'étourdissement logique
ne dure plus que 0,08 s ; elle n'ajoute plus une longue attente systématique.
Les vraies récupérations après attaque restent des occasions de riposte.
Le recul visuel, les impacts et le hit stop conservent leur durée. L'élève
avance légèrement pendant sa préparation, avec une orientation engagée,
afin que le recul reçu ne fasse pas systématiquement manquer sa riposte.

Les portées, dégâts, PV et commandes du professeur ne changent pas. Les
dialogues protègent toujours les combattants. Le saut peut servir à éviter
un coup, y compris pendant une frappe du professeur si celui-ci n'est pas
en récupération. Les réglages A3 sont regroupés dans `PRESSURE_ENEMY` dans
`src/gameplay.ts` et ne s'appliquent qu'au profil d'atelier A3.

## Infirmerie

L'accès quitte le hall pour la jonction B, au premier étage, après les
rencontres de la cour, du vestibule et de la jonction sur les deux routes.
Une porte et une plaque identifient le nouvel accès ; le retour mène à cette
même jonction. Le hall reçoit un panneau d'affichage à la place de l'ancien
accès. Cela ne crée pas de verrou obligeant à vaincre chaque ennemi pour
emprunter les passages ordinaires.

Les douze zones, les six rencontres et la boucle de navigation A2 restent
présentes. Le soin reste optionnel, plafonné à 5 PV, utilisable une seule
fois, avec le délai actif pendant le geste. +1 reste le réglage de départ ;
+2 est conservé pour comparaison. Le modèle statique mesure environ 4,08 s
de détour sur chaque route, sans combat ni hésitation.

## Vérifications

- `npm run build:atelier` : compilation et exports A1/A2/A3 réussis.
- `npm test` : suite existante réussie.
- `npm run test:navigation` : graphes et accès vérifiés ; 54 parcours complets
  A3, dont six voiture → cours, 60 comparaisons du soin et 75 vérifications
  d'embranchements ; A1/A2 passent également.
- Douze comparaisons de cadence A2/A3 et neuf comparaisons frappe répétée /
  esquive à 30/60/120 images/s, avec protection du dialogue et pause testées.
  À 60 images/s, dans le preset de contact, l'élève exécute 17 attaques en
  16 s contre 6 en A2. L'invulnérabilité n'est utilisée que pour mesurer cette
  cadence ; les comparaisons de combat et d'esquive utilisent les vrais PV.
- Les bots qui lisent les préparations et sautent réussissent les combats
  ordinaires avec moins de dégâts que ceux qui martèlent la frappe.
- Navigateur local : préparation et coup de l'élève observés, ainsi que
  l'entrée à la souris dans l'infirmerie, le soin 3 → 4 PV et le retour à la
  jonction. Aucun avertissement ni erreur dans la console de cet essai.

Les résultats sont dans `work/pressure-a3-results.json` et
`work/navigation-a3-atelier-results.json`. Les captures
`work/combat-a3-preparation.png` et `work/navigation-a3-jonction.png` montrent
les vérifications visuelles. Les panneaux restent des recompositions d'atelier.
Les avertissements de compilation connus sur la taille du bundle et le
stripping TypeScript subsistent.

Ces vérifications ne valident pas encore la sensation à vitesse normale
avec un joueur humain. L'ouverture directe de l'export HTML, le téléphone
physique et l'écoute restent à confirmer chez Nicolas ; l'observation locale
utilise le serveur de développement.

## Prochain essai humain

1. Jouer A3 depuis la cour, à vitesse normale, avec 5 PV et le soin +1.
2. Comparer frappe répétée puis saut à la préparation : l'attaque doit être
   menaçante et identifiable, sans exiger de deviner une règle invisible.
3. Noter les PV et le besoin de soin à l'arrivée à la jonction ; décider
   librement du détour, puis comparer +2 au même état de blessure.
4. Exporter le journal. A3 y indique les débuts et les exécutions des attaques
   adverses, afin de distinguer une attaque interrompue d'une attaque évitée.

Si les premières rencontres deviennent coûteuses même après avoir compris
le saut, ajuster d'abord la préparation et la reprise par rôle, avant de
modifier les dégâts ou d'ajouter une immunité aux frappes.
