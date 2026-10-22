# Tests et traces de fabrication

La liste des vérifications maintenues est dans `../package.json` et le README
principal. Les numéros des tests ne signifient pas qu’ils sont périmés.

- `check*.cjs` appelés par npm : règles, rendu et régressions.
- `test-harness.cjs`, `audio-harness.cjs`, pilotes et `*runner*.cjs` : infrastructure réutilisée.
- JSON de conception/navigation : fixtures toujours utilisées.
- `reports/performance/` : mesures avant/après du nettoyage du 22 octobre.
- `integrate*`, `prepare*`, `docs*`, `write-review*` : anciens scripts de fabrication,
  parfois mutateurs ; ils ne constituent pas une suite à exécuter en bloc.
- PNG, TXT, CSV, résultats JSON : références ou traces historiques, conservées
  jusqu’à vérification de leurs usages.

Les nouveaux outils de maintenance vont dans `../tools/`. Les dépendances des
anciens essais doivent être cartographiées avant de déplacer leurs helpers.
