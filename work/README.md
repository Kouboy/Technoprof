# Tests et traces de fabrication

La liste des vérifications maintenues est dans `../package.json` et le README
principal. Les numéros des tests ne signifient pas qu’ils sont périmés.

- `check*.cjs` appelés par npm : règles, rendu et régressions.
- `test-harness.cjs`, `audio-harness.cjs`, pilotes et `*runner*.cjs` : infrastructure réutilisée.
- JSON de conception/navigation : fixtures toujours utilisées.
- `reports/performance/` : mesures avant/après du nettoyage du 22 octobre.
- [historique-fabrication/](historique-fabrication/README.md) : anciens scripts
  mutateurs, séparés des vérifications maintenues et conservés avec leurs SHA256.
- PNG, TXT, CSV, résultats JSON : références ou traces historiques, conservées
  jusqu’à vérification de leurs usages.

Les nouveaux outils de maintenance vont dans `../tools/`. Les dépendances des
anciens essais doivent être cartographiées avant de déplacer leurs helpers.
Les anciennes copies `backup-0.40` à `backup-0.60` sont maintenant rangées dans
`../archives/working-copies/`, avec un manifeste local vérifié. Les fixtures et
pilotes restent ici.
