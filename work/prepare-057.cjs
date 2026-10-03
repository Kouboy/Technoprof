const fs=require('fs');const path=require('path');
const raw=fs.readFileSync('src/art-data.ts','utf8');const m=raw.slice(raw.indexOf('inspecteur:')).match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/); fs.writeFileSync('art/inspecteur-reference-057.png',Buffer.from(m[1],'base64'));
fs.copyFileSync('C:/Users/don_n/.codex/generated_images/01a0716b-6fbe-7730-9787-2febc1648803/exec-2a70efe6-e827-42c0-9705-45555dde40c3.png','art/bruel-backgrounds-057.png');
fs.copyFileSync('C:/Users/don_n/.codex/generated_images/01a0716b-6fbe-7730-9787-2febc1648803/exec-33c72909-86be-4538-b0f7-1745c18e0809.png','art/pro-backgrounds-057.png');
