# Nettoyage et diagnostic de conduite — 22 octobre 2026

## Périmètre livré

Les règles, densités, délais, combats, contrôles et topologies restent ceux de
la référence d'atelier. Cette passe traite le rangement, la duplication des
exports et un coût graphique mesuré du crépuscule.

- 21 exports 0.40–0.60 (1 483 411 410 octets) déplacés dans `archives/versions/`.
  Chaque déplacement est vérifié par SHA256 et consigné dans un manifeste local.
- 6 ateliers de 135 Mo remplacés par des raccourcis de moins de 2 Kio : environ
  810 Mo de copies supprimées. La journée complète reste autonome.
- 42 documents classés dans `docs/atelier/` et `docs/historique/`, avec 168 liens
  ajustés. README et HISTORIQUE restent les points d'entrée à la racine.
- Tests conservés ; commandes regroupées par usage dans le README, avec une
  suite rapide. Les scripts historiques mutateurs sont identifiés dans work/README.

La 0.61 reste à la racine et conserve le SHA256
`05713E027D7DCB4B5CD8AAA6E2E74B53D1EA45526215E33CC8FE4E905B94DD65`.
L'archivage change le rangement, pas l'espace disque ; seul le remplacement
des six copies redondantes apporte ici le gain d'environ 810 Mo.

## Conduite : résultat mesuré

Les halos étaient reconstruits en géométrie Graphics à chaque frame. Ils sont
désormais précalculés dans un petit atlas de 96 × 116 pixels. Les sprites gardent
les centres des ampoules, les couleurs, les dimensions et les trois traits de
traînée. La nappe du lampadaire est précalculée et inversée avec son côté.
Le groupe routier utilise une découpe commune et un tri final par profondeur.

Le masque commun seul n'a pas réduit les appels graphiques : cette hypothèse
intermédiaire n'est donc pas présentée comme le gain. Les sprites permettent de
regrouper les lumières avec les autres images sans reconstructions géométriques.

| Scène de référence | Avant | Avec sprites |
| --- | --- | --- |
| Appels de dessin, jour | 9/frame | 9/frame |
| Appels de dessin, crépuscule | 31–33/frame | 9/frame |
| Envois de buffers, crépuscule | 47–50/frame | 14/frame |
| CPU médian Firefox, crépuscule | 5 ms | 3 ms |

Les captures de jour sont identiques pixel pour pixel. Les différences nocturnes
se limitent aux zones lumineuses, désormais rasterisées. Les ponts, le trafic,
les bords de fenêtre et la stabilité en pause sont vérifiés dans le rendu natif.

## Ce que ces mesures ne prouvent pas

Les premières fenêtres de mesure étaient en pause après le chargement : elles
comparent le coût du dessin, pas une course. Un second passage Firefox a repris
par les commandes publiques : la simulation progresse bien sur les deux routes,
avec environ 9 appels par frame et aucun défaut JavaScript, pendant quatre secondes.
Les rapports complets sont dans `work/reports/performance/`.

Firefox 153 de test utilise ANGLE/Intel D3D11 ; Chromium 151 utilise SwiftShader.
Leurs fréquences RAF diffèrent aussi. Les nombres absolus entre navigateurs ne
constituent donc pas un classement. Ils ne reproduisent pas le profil Firefox
personnel de Nicolas, une session longue ou le téléphone. Les ralentissements
humains signalés restent à retester ; un coût évitable a été supprimé.

## Allègement restant à réaliser

Les sources pesaient 133 947 492 octets avant cette passe, essentiellement des
images intégrées. Les copies HTML et les fichiers de work ne sont pas tous
embarqués : leur suppression ne suffit pas à réduire le programme.

`Game.preload()` et `create()` chargent/construisent encore les anciens renderers
et leurs décors, même pour la journée H1/A3/I2. Certains éléments sont néanmoins
partagés : le professeur et des ennemis utilisent les classes anciennes ; A3
dépend encore de bruel-backgrounds, et I2 de pro-backgrounds pour la pièce 300.
Supprimer ces imports à l'aveugle casserait les essais ou des lieux actuels.

Le prochain lot doit séparer les besoins de la journée des galeries historiques,
adapter les constructeurs concernés puis mesurer textures décodées, mémoire et
chargement. Cette extraction permettra ensuite de retirer réellement les assets
inutiles de la livraison joueur, tout en conservant un atelier complet séparé.

Outil de profilage : `node tools/profile-driving.cjs <module-playwright> <rapport> <durée-ms> [moving] [firefox|chromium]`.
Il utilise un profil navigateur de test isolé et le serveur local sur le port 4176.
