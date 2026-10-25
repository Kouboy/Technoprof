const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
if (!fs.existsSync(path.join(root, "Jouer-Technoprof-Journee-Atelier.html")))
  throw Error("Build the reduced day first: npm run build:journee");
console.log("Standalone day: H1 / A3 / I2, three roads and one final report");
fs.writeFileSync(path.join(root, "Jouer-Technoprof-Retour-Maison.html"), `<!doctype html><html lang="fr"><meta charset="utf-8"><title>TECHNOPROF — Retour Maison</title><p><a href="Jouer-Technoprof.html?essai=labo&scenario=home-return&musique=essai">Tester le retour nocturne à Maison</a></p><p>Dans l’atelier, cliquer sur Rejouer. Conserver audio/retour-maison-2026-10-25 à côté du jouable.</p><script>location.replace('Jouer-Technoprof.html?essai=labo&scenario=home-return&musique=essai')</script></html>`);
fs.writeFileSync(path.join(root, "Jouer-Technoprof-Arrivee-Maison.html"), `<!doctype html><html lang="fr"><meta charset="utf-8"><title>TECHNOPROF — Arrivée Maison</title><p><a href="Jouer-Technoprof.html?essai=labo&scenario=home-return-near&musique=essai">Tester les derniers mètres et l’arrivée à Maison</a></p><p>Dans l’atelier, cliquer sur Rejouer. L’arrivée commence après les derniers 70 mètres.</p><script>location.replace('Jouer-Technoprof.html?essai=labo&scenario=home-return-near&musique=essai')</script></html>`);
fs.writeFileSync(path.join(root, "Jouer-Technoprof-Journee-Musique.html"), `<!doctype html><html lang="fr"><meta charset="utf-8"><title>TECHNOPROF — Journée musicale</title><p><a href="Jouer-Technoprof-Journee-Atelier.html?musique=essai">Lancer la journée musicale</a></p><p>Conserver les dossiers audio/maquettes-2026-10-23, audio/titre-reference-2026-10-23 et audio/complements-2026-10-23 à côté du jouable.</p><script>location.replace('Jouer-Technoprof-Journee-Atelier.html?musique=essai')</script></html>`);

const presets = {
  "Jouer-Technoprof-Atelier-Gamefeel.html": "gamefeel-tolerant-encounter",
  "Jouer-Technoprof-Atelier-Bruel.html": "bruel-navigation",
  "Jouer-Technoprof-Atelier-Bruel-A2.html": "bruel-navigation-a2",
  "Jouer-Technoprof-Atelier-Bruel-A3.html": "bruel-navigation-a3",
  "Jouer-Technoprof-Atelier-Hanouna-H1.html": "hanouna-navigation-h1",
  "Jouer-Technoprof-Atelier-InShape-I1.html": "inshape-navigation-i1",
  "Jouer-Technoprof-Atelier-InShape-I2.html": "inshape-navigation-i2",
};
for (const [name, scenario] of Object.entries(presets)) {
  // Keep the full-day delivery independent, and share the workshop engine.
  const html = `<!doctype html><html lang="fr"><meta charset="utf-8">
<title>TECHNOPROF — Atelier</title>
<style>body{background:#141e27;color:#e3d4b3;font:18px monospace;padding:3rem}a{color:#e5ae60}</style>
<p><a href="Jouer-Technoprof.html?essai=labo&scenario=${scenario}">Ouvrir l’atelier TECHNOPROF</a></p>
<p>Gardez ce raccourci dans le même dossier que Jouer-Technoprof.html.</p>
<script>
const query = new URLSearchParams(location.search);
if (!query.has('essai')) {
  query.set('essai', 'labo');
  if (!query.has('scenario')) query.set('scenario', '${scenario}');
}
location.replace('Jouer-Technoprof.html?' + query.toString() + location.hash);
</script></html>`;
  fs.writeFileSync(path.join(root, name), html);
}
console.log(
  "7 lightweight workshop shortcuts written (shared Jouer-Technoprof.html)",
);
