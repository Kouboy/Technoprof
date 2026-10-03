// Inventory only; no image rewriting. RGBA figures are texture-size estimates,
// not observed process/heap/GPU memory (runtime canvases may add copies).
const fs=require('fs');
const images=[];
for(const name of fs.readdirSync('src').filter(n=>n.endsWith('.ts'))){
 const source=fs.readFileSync('src/'+name,'utf8');
 for(const m of source.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)){
  const b=Buffer.from(m[1],'base64'),w=b.readUInt32BE(16),h=b.readUInt32BE(20);
  images.push({source:name,width:w,height:h,pngBytes:b.length,rgbaBytes:w*h*4});
 }
}
images.sort((a,b)=>b.rgbaBytes-a.rgbaBytes);
const report={images:images.length,encodedPngBytes:images.reduce((s,i)=>s+i.pngBytes,0),sourceRgbaBytes:images.reduce((s,i)=>s+i.rgbaBytes,0),largest:images.slice(0,12),note:'Uncompressed source pixels only. Not a live memory measurement. Derived canvases and browser copies excluded.'};
fs.writeFileSync('work/resource-budget-059.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
