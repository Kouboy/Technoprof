const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const strip=s=>s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
const literal=name=>JSON.parse(fs.readFileSync('src/'+name,'utf8').match(/= ([\s\S]*?);\s*$/)[1]);
const original=literal('cinematic-data.ts'),intro=literal('cinematic-intro-data.ts'),approved=literal('cinematic-approved-data.ts');
const source={
 'cinematic-storyboard':[original,'art/cinematics-2026-10-24/storyboard-atlas.png'],
 'cinematic-intro-v2':[intro,'art/intro-2026-10-25/intro-night.png'],
 'cinematic-campus-approved':[approved.campus,'art/cinematics-2026-10-25-v2/storyboard-v2.png'],
 'cinematic-visitor':[approved.visitor,'art/cinematics-2026-10-25-v2/visitor-coat.png'],
 'cinematic-car':[approved.car,'art/cinematics-2026-10-25-v3/car-ride.png'],
 'cinematic-badge':[approved.badge,'art/cinematics-2026-10-27/badge-classroom.png'],
};
const dimensions={};for(const [key,[uri,path]] of Object.entries(source)){
 const bytes=fs.readFileSync(path);assert.deepEqual(Buffer.from(uri.split(',')[1],'base64'),bytes,'approved source bytes: '+path);
 dimensions[key]={width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
}
const frames=[],rects=[];
const texture=key=>({getSourceImage:()=>dimensions[key],add:(id,_s,x,y,w,h)=>frames.push({key,id,x,y,w,h}),setFilter(){}});
const image={setDepth(){return this},setDisplaySize(w,h){this.w=w;this.h=h;return this},setVisible(v){this.visible=v;return this},setTexture(key,f){this.key=key;this.frame=f;return this},setAlpha(a){this.alpha=a;return this},setPosition(x,y){this.x=x;this.y=y;return this},setCrop(x,y,w,h){this.crop={x,y,w,h};return this}};
const graphics={setDepth(){return this},fillStyle(){},fillRect(x,y,w,h){rects.push({x,y,w,h})},clear(){}};
const scope={CINEMATIC_DATA:original,CINEMATIC_INTRO_DATA:intro,CINEMATIC_APPROVED_DATA:approved};vm.createContext(scope);
vm.runInContext(require('node:module').stripTypeScriptTypes(strip(fs.readFileSync('src/cinematic.ts','utf8'))+'\n'+strip(fs.readFileSync('src/cinematic-art.ts','utf8')))+';this.api={CinematicArt,CinematicSequence};',scope);
const art=new scope.api.CinematicArt({textures:{get:texture},add:{graphics:()=>graphics,image:()=>image}});
assert.equal(frames.length,24);
for(const f of frames){assert([f.x,f.y,f.w,f.h].every(Number.isInteger));assert(f.x>=4&&f.y>=4&&f.x+f.w<=dimensions[f.key].width-4&&f.y+f.h<=dimensions[f.key].height-4);assert(f.w>0&&f.h>0)}
for(const kind of ['intro','ending']){
 const s=new scope.api.CinematicSequence(kind);
 for(let index=0;index<s.count;index++){
  s.index=index;s.age=1.1;art.render(s);
  assert(image.visible);assert.equal(image.key,s.panel.texture);assert.equal(image.frame,String(s.panel.frame));
  const f=frames.find(f=>f.key===image.key&&f.id===image.frame),scale=image.w/f.w;
  assert(Math.abs(image.w/image.h-f.w/f.h)<.00001);
  assert(Math.abs(image.crop.w*scale-212)<.001&&Math.abs(image.crop.h*scale-158)<.001,'fill frame without distortion or letterbox');
  assert(image.crop.x>=0&&image.crop.y>=0&&image.crop.x+image.crop.w<=f.w+.001&&image.crop.y+image.crop.h<=f.h+.001);
 }
}
const opening=new scope.api.CinematicSequence('intro');art.render(opening);assert.equal(image.alpha,0);opening.tick(1,false);art.render(opening);assert.equal(image.alpha,.5);opening.tick(1,false);art.render(opening);assert.equal(image.alpha,1);
const ending=new scope.api.CinematicSequence('ending');for(const i of [12,13]){ending.index=i;ending.age=0;art.render(ending);assert.equal(image.alpha,1,'hard bell/wake cut')}
art.hide();assert(!image.visible);for(const r of rects)assert(r.x>=0&&r.y>=0&&r.x+r.w<=320&&r.y+r.h<=240);
console.log('PASS approved films: six source PNGs, 24 bounded crops, badge handover, full-frame cover, 2s black opening and hard bell/wake cuts');
