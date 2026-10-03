// Review montage of the same PCM materials, without the game's WebAudio filters.
const fs=require('fs'),{bank}=require('./audio-harness.cjs').load();
const sr=bank.AUDIO.sampleRate,seconds=23,channels=[new Float32Array(sr*seconds),new Float32Array(sr*seconds)];
const cache=new Map(),sample=k=>{if(!cache.has(k))cache.set(k,bank.makeMaterial(k,sr));return cache.get(k);};
const mix=(kind,time,weight=1,pan=0,rate=1)=>{
 const pcm=sample(kind),gain=bank.FOLEY[kind][1]*bank.AUDIO.master*weight;
 for(let i=0;i<pcm.length/rate;i++){
  const index=Math.floor(time*sr+i);if(index>=channels[0].length)break;
  const p=i*rate,l=Math.floor(p),v=pcm[l]*(1-(p-l))+(pcm[l+1]||0)*(p-l);
  channels[0][index]+=v*gain*Math.sqrt((1-pan)/2);channels[1][index]+=v*gain*Math.sqrt((1+pan)/2);
 }
};
for(const [kind,t,side,weight] of [
 ['step',.4,-.25,1],['step',.75,.25,1],['jump',1.25,0,1],['land',1.85,0,1],
 ['swing',3,0,1],['book',3.7,0,1],['block',4.6,0,1],['body',5.5,0,1],['defeat',6.4,0,1],
 ['paper',8,0,0.7],['stamp',8.7,0,1],['sweep',9.6,0,1],
 ['pass',11,-.7,.42],['pass',12.3,.7,1],['truck',13.6,-.7,1],
 ['skid',15,.3,1],['rattle',15.65,.3,1],['impact',16.3,.5,1],
 ['door',18,0,1],['chair',19.1,-.55,1],['chair',19.48,.6,1],['paper',20.05,-.25,1],['paper',20.55,.35,1],['chalk',21.25,-.15,1]
 ])mix(kind,t,weight,side);
const buffer=Buffer.alloc(44+sr*seconds*4);buffer.write('RIFF');buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(2,22);buffer.writeUInt32LE(sr,24);buffer.writeUInt32LE(sr*4,28);buffer.writeUInt16LE(4,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(buffer.length-44,40);
let peak=0;for(let i=0;i<channels[0].length;i++)for(let ch=0;ch<2;ch++){
 const v=channels[ch][i];peak=Math.max(peak,Math.abs(v));buffer.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+(i*2+ch)*2);
}
fs.writeFileSync('work/matieres-audio-053.wav',buffer);
fs.writeFileSync('work/matieres-audio-053.txt','Montage des matières 0.53, mêmes PCM et gains de base que le jeu, sans ses filtres, compresseur ou réverbération.\n0-2 : pas, saut, réception.\n3-7 : livre dans le vide, livre qui touche, garde, coup reçu, dernier coup.\n8-10 : dossier, tampon, balayage.\n11-14 : dépassement distant, frôlement, camion.\n15-17 : pneus, tôle, choc.\n18-23 : porte, chaises, cahiers, craie.\n');
console.log('Audio material montage:',seconds,'seconds; peak',peak.toFixed(3),';',buffer.length,'bytes');
