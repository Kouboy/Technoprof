// Disposable art-direction preview: no game code or gameplay state is changed.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const root = path.resolve(__dirname, '../..');
let source = fs.readFileSync(path.join(root, 'src/cadre.ts'), 'utf8');
source = source.slice(0, source.indexOf('export const cleanText'))
  .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, '').replace(/export /g, '');
const scope = {};
vm.runInNewContext(stripTypeScriptTypes(source) + ';globalThis.glyphs=GLYPHS;', scope);
const glyphs = {...scope.glyphs};
for (const [letter, rows] of Object.entries({
  a:'00000/00000/01110/00001/01111/10001/01111',
  c:'00000/00000/01111/10000/10000/10000/01111',
  e:'00000/00000/01110/10001/11111/10000/01111',
  f:'00110/01001/01000/11100/01000/01000/01000',
  h:'10000/10000/10110/11001/10001/10001/10001',
  i:'1/0/1/1/1/1/1',
  n:'00000/00000/10110/11001/10001/10001/10001',
  o:'00000/00000/01110/10001/10001/10001/01110',
  r:'0000/0000/1011/1100/1000/1000/1000',
  s:'00000/00000/01111/10000/01110/00001/11110',
  t:'0100/0100/1110/0100/0100/0101/0010',
  v:'00000/00000/10001/10001/10001/01010/00100',
  w:'00000/00000/10001/10001/10101/10101/01010',
  '(':'001/010/100/100/100/010/001',
  ')':'100/010/001/001/001/010/100',
})) glyphs[letter]=rows.split('/');
const image = fs.readFileSync(path.join(__dirname, 'concept-v8-wear.png')).toString('base64');
const html = `<!doctype html><html lang="fr"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TECHNOPROF — Maquette du titre</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-content:center;background:#080d13;color:#b9aa89;font:12px monospace}
figure{position:relative;margin:0;width:min(100vw,calc(100vh * 4 / 3),1100px);aspect-ratio:4/3;overflow:hidden}
img,canvas{display:block;position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated}canvas{pointer-events:none}
#prompt{animation:teach-blink 1.2s steps(1,end) infinite}
@keyframes teach-blink{0%,54.99%{opacity:1}55%,100%{opacity:0}}
@media(prefers-reduced-motion:reduce){#prompt{animation:none}}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%)}
</style>
<figure aria-label="Maquette animée de l'écran titre TECHNOPROF">
<img alt="TECHNOPROF — Physique appliquée. Le professeur tient son manuel devant sa voiture de service et un collège." src="data:image/png;base64,${image}">
<canvas id="publisher" width="640" height="480" role="img" aria-label="(c) 2026 Brainrot Interactive Software"></canvas>
<canvas id="prompt" width="640" height="480" aria-hidden="true"></canvas>
<span class="sr-only">&lt;Press Start to Teach&gt;</span>
</figure>
<script>
const glyphs=${JSON.stringify(glyphs)};
function lettering(id,text,y,scale,color){
  const c=document.getElementById(id),g=c.getContext('2d');
  g.imageSmoothingEnabled=false;
  const width=[...text].reduce((w,ch)=>w+((glyphs[ch]||glyphs['?'])[0].length+1)*scale,0)-scale;
  const origin=Math.floor((640-width)/2);
  const paint=(dx,dy,ink)=>{let x=origin;g.fillStyle=ink;for(const ch of text){const rows=glyphs[ch]||glyphs['?'];rows.forEach((row,j)=>[...row].forEach((bit,i)=>{if(bit==='1')g.fillRect(x+i*scale+dx,y+j*scale+dy,scale,scale)}));x+=(rows[0].length+1)*scale}};
  paint(2,2,'#080d13');
  for(const [x,y] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]])paint(x,y,'#080d13');
  paint(0,0,color);
  c.dataset.text=text;c.dataset.width=width;c.dataset.left=origin;
}
lettering('publisher','(c) 2026 Brainrot Interactive Software',458,2,'#d9c798');
lettering('prompt','<Press Start to Teach>',360,2,'#fff0b2');
</script></html>`;
fs.writeFileSync(path.join(__dirname, 'apercu-anime.html'), html);
console.log('Title preview written: '+path.join(__dirname,'apercu-anime.html'));
