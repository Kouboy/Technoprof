# Présentation TECHNOPROF

Ouvrir `Presentation-Technoprof.html` par double-clic pour voir les exports, les icônes sur fond clair/sombre et le contrôle 32 px à taille réelle et zoom ×8.

## Exports prêts à intégrer

| Fichier | Usage | Dimensions |
|---|---|---|
| `favicon.ico` | Onglet et raccourci navigateur ; frames PNG intégrées telles quelles | 16, 32, 48, 64, 128, 192, 256 px |
| `icon-16.png` à `icon-512.png` | Icônes transparentes selon le support | 16, 32, 48, 64, 128, 192, 256, 512 px |
| `cover-630x500.png` | Couverture du jeu | 630 × 500 |
| `cover-315x250.png` | Miniature de couverture | 315 × 250 |
| `social-1200x630.png` | Carte de partage / Open Graph | 1200 × 630 |
| `banner-960x504.png` | Bandeau panoramique | 960 × 504 |

L’intégration des balises et chemins de publication est distincte de ces exports. La carte de partage doit être exposée à une URL publique pour les robots des réseaux sociaux.

## Sources préservées

- `icon-master.png` et son intention `prompt-icon.txt`.
- `cover-master.png` et son intention `prompt-cover.txt`.
- `wide-master.png` et son intention `prompt-wide.txt`, source des deux formats panoramiques.

Les prompts décrivent l’intention de création ; ils ne remplacent pas l’examen du contenu effectivement présent dans les masters. Le script lit les trois masters et prompts sans les modifier.

## Recette reproductible

Depuis la racine du dépôt : `python tools/export-presentation.py`, avec Pillow installé. Aucune génération IA, retouche, réduction de palette, correction de couleur, netteté ou lissage. Chaque redimensionnement utilise `PIL.Image.Resampling.NEAREST`.

L’icône est rognée exactement aux bornes de son alpha non nul, puis centrée sans déformation sur un carré transparent assez grand pour une marge de 8 % de chaque côté. Ce carré sert directement à chaque taille. Les frames ICO incorporent les PNG exportés sans aucun rééchantillonnage.

Les ratios des masters diffèrent très légèrement des formats cibles. Seul le plus petit recadrage centré est appliqué, avec coordonnées sources fractionnaires pour éviter un rognage entier excessif : couverture environ 0,29 px de chaque côté ; panoramique environ 0,375 px en haut et en bas. Aucun élément n’est déplacé. Les rectangles exacts et dimensions finales figurent dans `manifest.json`.

Le manifeste contient SHA-256, tailles, dimensions, modes, masters de référence, recette et version de Pillow, plus les empreintes des prompts, de l’outil, du README et de la planche HTML. Il ne contient pas de date variable et ne se référence pas lui-même. Le script vérifie les pixels des PNG réouverts, les frames ICO, les coins transparents et l’intégrité des sources avant/après.
