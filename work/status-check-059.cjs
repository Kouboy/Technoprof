const fs=require('fs');
for(const p of fs.readdirSync('work').filter(n=>/^check.*\.cjs$/.test(n))){const path='work/'+p,s=fs.readFileSync(path,'utf8'); if(s.includes('LIEU : PASSAGE TECHNIQUE'))fs.writeFileSync(path,s.replaceAll('LIEU : PASSAGE TECHNIQUE','07:00 / PASSAGE TECHNIQUE'));}
