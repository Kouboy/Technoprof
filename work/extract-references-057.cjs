const fs=require('fs');
for(const [source,key,out] of [['art-data.ts','corridor','college-reference-057.png'],['court-data.ts',null,'cour-reference-057.png']]){
 const text=fs.readFileSync('src/'+source,'utf8');
 const scope=key?text.slice(text.indexOf(key+':')):text;
 const match=scope.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
 if(!match)throw Error('Missing reference '+key);
 fs.writeFileSync('art/'+out,Buffer.from(match[1],'base64'));
}
