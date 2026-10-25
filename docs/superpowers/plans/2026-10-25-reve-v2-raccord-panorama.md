# Raccord de veste et position du panorama — maquette V2

Retour utilisateur : au plan du visiteur, garder la veste du professeur qu’il porte avant/après et supprimer son doublon au porte-manteau. Déplacer le plan large du campus juste avant la cloche.

- [x] Retouche imagegen isolée du plan visiteur ; préserver les sept autres images de l’atlas, en particulier le dernier réveil sans veste.
- [x] Déplacer les six secondes du panorama de 19–25 s à 50–56 s, après l’AESH et avant la cloche. Durée totale 63 s, cloche 56 s, réveil 57,2 s et fichiers audio inchangés.
- [x] Régénérer lecteur, manifeste et guide du montage ; vérifier la bonne image à chaque timecode, le raccord vestimentaire et la lecture locale.
- [x] Conserver le périmètre maquette : jeu et Pages inchangés, quatrième trajet toujours pour plus tard.

## Vérification

Source originale `art/cinematics-2026-10-25-v2/visitor-coat.png` générée avec imagegen, prompt séparé et empreinte consignés dans `layout.json`. Le professeur porte sa veste ; le porte-manteau ne conserve qu’une écharpe, le dossier du fauteuil est son tissu de siège. Retouche relue en capture réelle. L’atlas des autres images n’a pas été modifié.

Contrôle rouge puis vert de l’ordre : cour → couloir → préparation → classe → AESH → panorama → cloche → réveil. Panorama exactement 50–56 s. Les empreintes des trois WAV sont strictement identiques à la version précédente ; la musique n’a pas été recomposée pour ce déplacement d’images.

Chrome et Firefox hors connexion : treize images, pause, seek, passage de la cloche et du réveil, fin à 63 s sans erreur JavaScript. Contrôle tactile conservé. Captures du visiteur corrigé et du panorama final relues ; aucune bande de fond uniforme dans les treize cadres. Manifeste, guide et rapports de la V2 actualisés.
