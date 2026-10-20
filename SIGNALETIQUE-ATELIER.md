# Signalétique physique — journée d’atelier

Les trois établissements validés partagent une écriture bitmap nette, mais leurs
supports diffèrent : plastique jauni monté dans un rail aux Ormeaux, panneaux
repeints avec sous-couche apparente à Auguste-Berthelot, métal plié et avertissements
de sécurité aux Trois-Ponts. Les numéros de salle utilisent une plaque compacte ;
les avis sont des feuilles fixées au ruban adhésif. L’usure reste sur les bords et
les fixations, jamais sur les lettres nécessaires pour se diriger.

Les ancrages sont choisis par pièce, à proximité des linteaux, portes, murs et
panneaux d’affichage. Les étiquettes des Trois-Ponts ne sont plus disposées par un
empilement automatique en haut de l’écran : chaque sortie possède un ancrage
identifié par sa destination. Les avertissements de sol fragile restent distincts
des panneaux directionnels.

Les repères de navigation et les contrôles sont conservés. Le grand escalier de
Berthelot conserve la priorité sur l’annexe. Les indications de touche restent une
interface de proximité, avec un espace réservé même dans leur état actif élargi.
Les règles, les graphes, les rencontres, les soins et le chronomètre ne changent pas.
Les anciens comparatifs A1/A2/I1 et le HTML figé 0.61 sont conservés.

## Vérification

`npm run test:signaletique` vérifie les dimensions, le tracé en pixels entiers,
la stabilité du rendu, la protection des lettres, l’absence de chevauchement entre
panneaux et avec les indications de touche actives, les sorties couvertes, les
visites répétées et l’absence de mutation des règles des trois profils.

La perception des matériaux et l’intégration architecturale se vérifient aussi
dans l’atelier (`?essai=labo`, vues de décors H1/A3/I2), avec les personnages et
les indications de passage. `npm run build:atelier` actualise le jouable complet
`Jouer-Technoprof-Journee-Atelier.html`.

Passe vérifiée : tests de signalétique, profils H1/I2, journée complète aux trois
cadences et suite générale ; build TypeScript/Vite et export autonomes réussis.
Contrôle visuel dans le navigateur sur serveur local : halls H1/A3, galerie C,
jonctions A3/I2, Préparation T et infirmerie. Le HTML autonome a également été
analysé : scripts intégrés valides et aucune dépendance de module externe.
