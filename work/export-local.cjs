const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const tag = html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
if (!tag) throw Error('Compiled script missing');
const code = fs.readFileSync(path.join(root, 'dist', tag[1].replace(/^\//, '')), 'utf8');
html = html.replace(tag[0], () => '<script type="module">\n' + code.replace(/<\/script/gi, '<\\/script') + '\n</script>');
html = html.replace('href="/"', 'href="Jouer-Technoprof.html"');
fs.writeFileSync(path.join(root, 'Jouer-Technoprof.html'), html);
console.log('Standalone HTML written: '+Buffer.byteLength(html)+' bytes');

// One autonomous game file; the quick trials only redirect to a query preset.
const trials = {
  Salle42C: 'atelier', Arrivee: 'arrivee', Cour: 'cour', Hall: 'parent',
  Escaliers: 'escaliers', Central: 'central', Technique: 'raccourci',
  Service: 'service', Passerelle: 'passerelle', AileC: 'ailec', Retouches: 'retouches', Labo: 'labo', Presentation: 'presentation',
};
for (const [name, trial] of Object.entries(trials)) {
  const shortcut = `<!doctype html><html lang="fr"><meta charset="utf-8">
<title>TECHNOPROF — ${name}</title>
<style>body{background:#141e27;color:#e3d4b3;font:18px monospace;padding:3rem}a{color:#e5ae60}</style>
<p><a href="Jouer-Technoprof.html?essai=${trial}">Ouvrir TECHNOPROF — ${name}</a></p>
<p>Gardez ce raccourci dans le même dossier que Jouer-Technoprof.html.</p>
<script>
const query = new URLSearchParams(location.search);
if (!query.has('essai')) query.set('essai', '${trial}');
location.replace('Jouer-Technoprof.html?' + query.toString() + location.hash);
</script></html>`;
  fs.writeFileSync(path.join(root, `Jouer-${name}.html`), shortcut);
}
console.log(Object.keys(trials).length + ' lightweight trial shortcuts written.');
