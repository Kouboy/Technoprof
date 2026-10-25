const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'dist-day/index.html'), 'utf8');
const tag = html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
if (!tag) throw Error('Day compiled script missing');
const script = path.join(root, 'dist-day', tag[1].replace(/^\//, ''));
const code = fs.readFileSync(script, 'utf8');
html = html.replace(tag[0], () => '<script type="module">\n' + code.replace(/<\/script/gi, '<\\/script') + '\n</script>');
html = html.replace(/<title>[\s\S]*?<\/title\s*>/, '<title>TECHNOPROF — Journée complète des établissements validés</title>');
html = html.replace('href="/"', 'href="Jouer-Technoprof-Journee-Atelier.html"');
fs.writeFileSync(path.join(root, 'Jouer-Technoprof-Journee-Atelier.html'), html);
console.log('Standalone reduced day written: ' + Buffer.byteLength(html) + ' bytes');
// A small redirect keeps the approved day bundle single-copy on disk.
fs.writeFileSync(path.join(root, 'Jouer-Technoprof-Fenetre.html'), `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TECHNOPROF — fenêtre dédiée</title>
<style>body{background:#080d13;color:#e3d4b3;font:16px monospace;margin:12vh auto;padding:20px;max-width:600px}h1{color:#e5ae60}button{font:inherit;background:#24333b;color:inherit;border:1px solid #758080;padding:16px;cursor:pointer}a{color:#e5ae60}p{line-height:1.6}</style>
<h1>TECHNOPROF</h1><p>Physique appliquée</p><button id="launch">Ouvrir le jeu dans sa fenêtre</button><p id="status" role="status">Fenêtre redimensionnable, cadre 4:3. Le navigateur peut conserver une petite barre de titre.</p>
<p><a href="Jouer-Technoprof-Journee-Atelier.html?musique=essai&fenetre=1">Jouer dans cet onglet</a></p>
<script>let game;document.getElementById("launch").onclick=()=>{try{if(game&&!game.closed){game.focus();return;}game=window.open("Jouer-Technoprof-Journee-Atelier.html?musique=essai&fenetre=1","technoprof-game","popup,width=960,height=820,resizable=yes,scrollbars=yes");if(!game)throw Error();game.focus();document.getElementById("status").textContent="Jeu ouvert. Gardez le dossier audio à côté des fichiers HTML.";}catch{document.getElementById("status").textContent="Fenêtre bloquée : autorisez-la ou utilisez le lien Jouer dans cet onglet.";}};</script></html>`);
