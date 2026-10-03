const fs=require('fs');
for(const [source,name] of [['exec-61743126-a687-4278-a349-068fee64e36f.png','bruel-enemies'],['exec-155b2465-f7f6-42b8-8e4a-4ac94771c5c5.png','pro-enemies']])fs.copyFileSync('C:/Users/don_n/.codex/generated_images/01a0716b-6fbe-7730-9787-2febc1648803/'+source,'art/'+name+'-057.png');
const assets={};for(const name of ['bruel-backgrounds','pro-backgrounds','bruel-enemies','pro-enemies']) assets[name]='data:image/png;base64,'+fs.readFileSync('art/'+name+'-057.png').toString('base64');
fs.writeFileSync('src/new-school-data.ts','// Built-in imagegen assets, provenance and exact prompts: art/PROMPTS-057.md.\nexport const NEW_SCHOOL_DATA = '+JSON.stringify(assets)+';\n');
