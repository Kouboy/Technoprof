// Offline dry preview of the same deterministic materials and gesture gains.
// Does not claim to reproduce the live scene's ambience, limiter or room reverb.
const fs=require('fs'),vm=require('vm'),{load}=require('./audio-harness.cjs');
const scope=load();vm.runInContext('this.gestures=ENEMY_GESTURES;',scope);
const {bank,gestures}=scope,sr=bank.AUDIO.sampleRate,duration=12;
const data=new Float32Array(sr*duration),notes=[];
function add(kind,time,gain,rate=1){
 const pcm=bank.makeMaterial(kind,sr),offset=Math.round(time*sr);
 for(let i=0;i<pcm.length/rate&&offset+i<data.length;i++){
  const p=i*rate,left=Math.floor(p),a=pcm[left]??0,b=pcm[left+1]??0;
  data[offset+i]+=(a+(b-a)*(p-left))*bank.FOLEY[kind][1]*gain*bank.AUDIO.master;
 }
}
Object.entries(gestures).forEach(([role,stages],i)=>{
 const t=i*3;notes.push(`${t.toFixed(1)} s : ${role} — preparation, geste a ${(t+1).toFixed(1)} s, contact du livre a ${(t+1.6).toFixed(1)} s.`);
 for(const stage of ['windup','release']) for(const [kind,gain,rate] of stages[stage]) add(kind,t+(stage==='release'?1:0),gain,rate);
 add('book',t+1.6,1);
});
const wav=Buffer.alloc(44+data.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sr,24);wav.writeUInt32LE(sr*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(data.length*2,40);
let peak=0;data.forEach((v,i)=>{peak=Math.max(peak,Math.abs(v));if(!Number.isFinite(v)||Math.abs(v)>=1)throw Error('PCM clip');wav.writeInt16LE(Math.round(v*32767),44+i*2);});
fs.writeFileSync('work/gestes-058.wav',wav);
fs.writeFileSync('work/gestes-058.txt',['Apercu sec, mono. Synthese et gains du jeu, sans ambiance/reverberation/limiteur. Ce fichier ne remplace pas une ecoute pendant une journee.',...notes,`Peak PCM ${peak.toFixed(4)}; ${sr} Hz; ${wav.length} octets.`].join('\n'));
console.log(`PASS gesture preview: ${duration}s, peak ${peak.toFixed(4)}, no clipping, no added game samples`);
