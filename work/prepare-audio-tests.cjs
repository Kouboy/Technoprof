const fs=require('fs');
for(const file of ['work/check.cjs','work/test-harness.cjs']){
 const s=fs.readFileSync(file,'utf8').replace('class AudioKit {combat(){}','class AudioKit {fx(){} ambienceVolume=1; combat(){}');fs.writeFileSync(file,s);
}
for(const file of ['work/check.cjs','work/check-047.cjs']){
 const s=fs.readFileSync(file,'utf8').replace("fs.readFileSync('src/audio.ts','utf8').replace('export class','class')","require('./audio-harness.cjs').source");fs.writeFileSync(file,s);
}
