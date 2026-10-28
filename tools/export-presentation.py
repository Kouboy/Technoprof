"""Deterministic NEAREST exports. Masters/prompts are read-only; no AI or retouching."""
from __future__ import annotations
import hashlib
import json
import math
from pathlib import Path
import struct
from PIL import Image, __version__ as PILLOW_VERSION

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "art" / "presentation-2026-10-28"
SIZES = (16, 32, 48, 64, 128, 192, 256, 512)
PADDING = 0.08


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def describe(path):
    result = {"file": path.name, "bytes": path.stat().st_size, "sha256": sha(path)}
    if path.suffix == ".png":
        with Image.open(path) as image:
            result.update(width=image.width, height=image.height, mode=image.mode)
    return result


def crop_box(source, target):
    width, height = source
    ratio = target[0] / target[1]
    if width / height > ratio:
        crop_width = height * ratio
        return ((width - crop_width) / 2, 0.0, (width + crop_width) / 2, float(height))
    crop_height = width / ratio
    return (0.0, (height - crop_height) / 2, float(width), (height + crop_height) / 2)


def png(image, path):
    image.save(path, format="PNG", optimize=True, compress_level=9)
    with Image.open(path) as decoded:
        assert (decoded.mode, decoded.size, decoded.tobytes()) == (image.mode, image.size, image.tobytes())


def ico():
    # Embed the exported PNG frames verbatim, avoiding Pillow's ICO resampling.
    frames = [(s, (OUT / f"icon-{s}.png").read_bytes()) for s in SIZES if s <= 256]
    offset = 6 + 16 * len(frames)
    directory = bytearray(struct.pack("<HHH", 0, 1, len(frames)))
    body = bytearray()
    for size, data in frames:
        directory.extend(struct.pack("<BBBBHHII", size % 256, size % 256, 0, 0, 1, 32, len(data), offset))
        body.extend(data)
        offset += len(data)
    path = OUT / "favicon.ico"
    path.write_bytes(directory + body)
    with Image.open(path) as decoded:
        assert decoded.ico.sizes() == {(s, s) for s, _ in frames}
        for size, _ in frames:
            with Image.open(OUT / f"icon-{size}.png") as expected:
                assert decoded.ico.getimage((size, size)).convert("RGBA").tobytes() == expected.tobytes()


def preview():
    def icons(background):
        return "".join(f'<figure class="icon {background}"><img src="icon-{s}.png" width="{s}" height="{s}" alt="Professeur et livre, icône {s} pixels"><figcaption>{s} × {s} px</figcaption></figure>' for s in SIZES)
    html = '''<!doctype html>
<html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TECHNOPROF — Présentation et exports</title><link rel="icon" href="favicon.ico">
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#10171d;color:#eee3ce;line-height:1.5}*{box-sizing:border-box}body{max-width:1320px;margin:auto;padding:24px}h1,h2,h3{line-height:1.15}h1{letter-spacing:.06em}h2{margin-top:44px;color:#f1bc6c}a{color:#8fd9ff}header p,.note{max-width:76ch;color:#bfc9cc}img{image-rendering:pixelated;max-width:100%;height:auto;display:block}figure{margin:0}figcaption{font-size:.85rem;margin-top:10px}.icons,.row{display:flex;flex-wrap:wrap;align-items:start;gap:16px}.icon,.zoom{padding:16px;border-radius:8px;max-width:100%;border:1px solid #667780}.light{background:#f4ede1;color:#1e262b}.dark{background:#17212b;color:#f4ede1}.zoom img{width:256px;height:256px}.card{max-width:100%;padding:12px;background:#080d13;border:1px solid #3e515b;border-radius:8px;margin-top:16px}.card figcaption{padding:0 4px 4px}footer{margin:44px 0 16px;border-top:1px solid #3e515b;padding-top:20px;font-size:.9rem}@media(max-width:600px){body{padding:16px}.icon{padding:10px}h1{font-size:1.65rem}.card{padding:8px}}
</style>
<header><p>Physique appliquée</p><h1>TECHNOPROF</h1><p>Exports issus des trois masters. Images à taille réelle lorsque l’écran le permet ; les grandes images se réduisent sur mobile. Aucun lissage n’est ajouté.</p><p><a href="README.md">Usage et sources</a> · <a href="manifest.json">Recettes, tailles et SHA-256</a> · <a href="favicon.ico">Favicon multi-tailles</a></p></header>
<main><h2>Icônes transparentes</h2><p class="note">Même cadrage pour toutes les tailles : limites de l’alpha non nul, centrage sur un carré transparent et marge de 8 %. Observer les cheveux gris, les lunettes et l’accent bordeaux du livre.</p>
<h3>Sur fond clair</h3><div class="icons">LIGHT_ICONS</div><h3>Sur fond sombre</h3><div class="icons">DARK_ICONS</div>
<h3>Contrôle 32 px</h3><div class="row"><figure class="icon light"><img src="icon-32.png" width="32" height="32" alt="Icône à sa taille réelle de 32 pixels"><figcaption>Taille réelle : 32 × 32 px</figcaption></figure><figure class="zoom light"><img src="icon-32.png" width="256" height="256" alt="Icône 32 pixels agrandie huit fois sans lissage"><figcaption>Zoom ×8 sur fond clair</figcaption></figure><figure class="zoom dark"><img src="icon-32.png" width="256" height="256" alt="Même zoom sur fond sombre"><figcaption>Zoom ×8 sur fond sombre</figcaption></figure></div>
<h2>Couvertures</h2><div class="row"><figure class="card"><img src="cover-630x500.png" width="630" height="500" alt="Couverture TECHNOPROF, professeur et livre de physique devant son établissement et sa voiture"><figcaption><a href="cover-630x500.png">Couverture — 630 × 500 px</a></figcaption></figure><figure class="card"><img src="cover-315x250.png" width="315" height="250" alt="Miniature de la couverture TECHNOPROF"><figcaption><a href="cover-315x250.png">Miniature — 315 × 250 px</a></figcaption></figure></div>
<h2>Partage et bandeau</h2><figure class="card"><img src="social-1200x630.png" width="1200" height="630" alt="Carte de partage TECHNOPROF, titre à gauche et professeur à droite"><figcaption><a href="social-1200x630.png">Carte de partage — 1200 × 630 px</a></figcaption></figure><figure class="card"><img src="banner-960x504.png" width="960" height="504" alt="Bandeau TECHNOPROF issu du master panoramique"><figcaption><a href="banner-960x504.png">Bandeau — 960 × 504 px</a></figcaption></figure></main>
<footer>Masters : <a href="icon-master.png">icône</a>, <a href="cover-master.png">couverture</a>, <a href="wide-master.png">panoramique</a>. Instructions conservées : <a href="prompt-icon.txt">icône</a>, <a href="prompt-cover.txt">couverture</a>, <a href="prompt-wide.txt">panoramique</a>. Exports : recadrage centré et plus proche voisin exclusivement.</footer></html>
'''
    (OUT / "Presentation-Technoprof.html").write_text(html.replace("LIGHT_ICONS", icons("light")).replace("DARK_ICONS", icons("dark")), encoding="utf-8", newline="\n")


def readme():
    text = '''# Présentation TECHNOPROF

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
'''
    (OUT / "README.md").write_text(text, encoding="utf-8", newline="\n")


def main():
    sources = ("icon-master.png", "cover-master.png", "wide-master.png", "prompt-icon.txt", "prompt-cover.txt", "prompt-wide.txt")
    before = {name: sha(OUT / name) for name in sources}
    exports = []
    with Image.open(OUT / "icon-master.png") as master:
        assert master.mode == "RGBA", "Icon master requires real transparency"
        alpha = master.getchannel("A")
        assert alpha.getextrema()[0] == 0 and alpha.getextrema()[1] > 0
        bounds = alpha.getbbox()
        cropped = master.crop(bounds)
        side = math.ceil(max(cropped.size) / (1 - 2 * PADDING))
        square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        offset = ((side - cropped.width) // 2, (side - cropped.height) // 2)
        square.paste(cropped, offset)
        for size in SIZES:
            image = square.resize((size, size), resample=Image.Resampling.NEAREST)
            assert all(image.getpixel(p)[3] == 0 for p in ((0, 0), (size-1, 0), (0, size-1), (size-1, size-1)))
            path = OUT / f"icon-{size}.png"
            png(image, path)
            exports.append({**describe(path), "master": "icon-master.png", "recipe": "alpha bounds / transparent square padding / NEAREST", "alphaBounds": list(bounds), "squareSide": side, "pasteOffset": list(offset), "paddingFraction": PADDING})
    ico()
    exports.append({**describe(OUT / "favicon.ico"), "master": "icon-master.png", "frames": list(SIZES[:-1]), "recipe": "exported PNG frames embedded verbatim"})
    for source_name, target_name, size in (
        ("cover-master.png", "cover-630x500.png", (630, 500)),
        ("cover-master.png", "cover-315x250.png", (315, 250)),
        ("wide-master.png", "social-1200x630.png", (1200, 630)),
        ("wide-master.png", "banner-960x504.png", (960, 504)),
    ):
        with Image.open(OUT / source_name) as master:
            box = crop_box(master.size, size)
            image = master.resize(size, resample=Image.Resampling.NEAREST, box=box)
            png(image, OUT / target_name)
        exports.append({**describe(OUT / target_name), "master": source_name, "recipe": "minimum centered fractional crop / NEAREST", "sourceCropBox": list(box)})
    preview()
    readme()
    assert before == {name: sha(OUT / name) for name in sources}, "A source changed during export"
    verification = {"sourcesUnchanged": True, "decodedPngPixelsEqual": True, "icoFramesEqualExportedPngs": True, "iconCornersTransparent": True}
    manifest = {"schema": 1, "title": "TECHNOPROF — Physique appliquée", "tool": {"file": "tools/export-presentation.py", "sha256": sha(Path(__file__)), "pillowVersion": PILLOW_VERSION}, "resampling": "PIL.Image.Resampling.NEAREST", "sources": [describe(OUT / name) for name in sources], "exports": exports, "documentation": [describe(OUT / name) for name in ("Presentation-Technoprof.html", "README.md")], "verification": verification}
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"exportCount": len(exports), "exportBytes": sum(x["bytes"] for x in exports), "preview": str(OUT / "Presentation-Technoprof.html"), "verification": verification}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
