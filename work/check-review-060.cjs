const fs=require('fs');let s=fs.readFileSync('AUDIT-0.60.md','utf8').replace('Injunction administrative','Injonction administrative').replace('dans les quatre références, les douze rencontres supplémentaires montrent','dans les quatre références, les douze rencontres situées dans les 39 tableaux ajoutés montrent');fs.writeFileSync('AUDIT-0.60.md',s);
for(const p of ['AUDIT-0.60.md','PLAN-APRES-REVIEW-0.60.md']){
 const t=fs.readFileSync(p,'utf8'),paths=[...t.matchAll(/\]\((C:\/[^)]+)\)/g)].map(m=>m[1].replace(/:\d+$/,''));
 const bad=paths.filter(x=>!fs.existsSync(x));if(bad.length)throw Error(JSON.stringify(bad));console.log(p+': '+paths.length+' verified local links');
}
