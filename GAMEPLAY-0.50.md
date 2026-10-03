# TECHNOPROF 0.50 — Pieds au sol et dialogues dégagés

Les personnages de l'école sont descendus de quatre pixels logiques (huit pixels à la résolution native). Leurs pieds reposent dans la bande de sol plutôt qu'à la jonction des plinthes. Le réglage commun `VIEW.actorOffsetY` s'applique après le calcul des poses à chaque dessin ; il ne s'accumule pas pendant la pause. Ombres, traînées du livre, impacts, particules et découpe des corps pendant les chutes suivent cette correction. L'arrivée en voiture conserve son cadrage.

La simulation reste sur sa ligne de référence : hauteur de saut, portées, collisions, passages et timings restent identiques. `VIEW.floor` indique désormais la ligne de contact visuelle à 163.

Les bulles sont plus compactes verticalement, placées dans la bande supérieure. Leur queue s'arrête dans l'air au-dessus de l'interlocuteur. Taille des caractères, progression à l'action et durée choisie par le joueur restent identiques.

L'élève dit : « Mon père préside le conseil des parents d'élèves. » Puis : « Retirez ce zéro, ou il fera sauter votre contrat. » La menace garde son intention, avec une formulation compréhensible.

Vérifications : suite complète, compilation TypeScript/Vite et export autonome ; espace entre bulles et silhouettes contrôlé dans les tests de mise en page. Dans le navigateur, premières répliques de l'élève, du parent, de l'inspectrice et du vigile observées dans leurs décors ; répétition des dessins sans déplacement progressif des pieds. Capture : `work/inspectrice-050.png`. La fluidité et le confort sur téléphone restent à évaluer pendant une session humaine.

Ouvrir `Jouer-Technoprof.html`, ou extraire `Technoprof-0.50-testeurs.zip`. La 0.49 est conservée dans son HTML et ses archives.
