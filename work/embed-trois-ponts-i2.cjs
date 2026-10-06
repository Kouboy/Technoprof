const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname,'..');
const meta = JSON.parse(fs.readFileSync(path.join(root,'art/trois-ponts-i2/atlas.json'),'utf8'));
const data = Object.fromEntries(Object.entries(meta).map(([key,{file}])=>
  [key,'data:image/png;base64,'+fs.readFileSync(path.join(root,'art/trois-ponts-i2',file)).toString('base64')]));
const crops = Object.fromEntries(Object.entries(meta).map(([key,{crops}])=>[key,crops]));
fs.writeFileSync(path.join(root,'src/trois-ponts-i2-data.ts'),
  '// Original PNGs embedded unchanged. Rebuild: node work/embed-trois-ponts-i2.cjs\n'+
  'export const TROIS_PONTS_I2_DATA: Record<string,string> = '+JSON.stringify(data)+';\n'+
  'export const TP_CROPS: Record<string,number[][]> = '+JSON.stringify(crops)+';\n');
console.log('Trois-Ponts I2: source PNGs embedded unchanged');
