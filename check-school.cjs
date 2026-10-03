const fs=require('fs'),vm=require('vm'),assert=require('assert'),{stripTypeScriptTypes}=require('node:module');
const strip=s=>s.replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
const src=strip(fs.readFileSync('src/presentation.ts','utf8'))+'\n'+strip(fs.readFileSync('src/world.ts','utf8'))+'\n'+strip(fs.readFileSync('src/small-lettering.ts','utf8'))+'\n'+strip(fs.readFileSync('src/cadre.ts','utf8'))+'\n'+strip(fs.readFileSync('src/dialogue.ts','utf8'))+'\n'+strip(fs.readFileSync('src/school-props.ts','utf8'))+';globalThis.api={PROP_FRAMES,PROP_OUTLINES,SIGNS,EXITS,BLOCKED_EDGES,HOLE_FRONT_Y,holeLayout,fallingCrop,SchoolProps,dialogueLayout,bitmapWidth,smallWidth,ENCOUNTER_SECONDS};';
const ctx={};vm.createContext(ctx);vm.runInContext(stripTypeScriptTypes(src+'\n'+strip(fs.readFileSync('src/passage-hints.ts','utf8'))+';api.passageHints=passageHints;',{mode:'transform'}),ctx);const a=ctx.api;
a.PROP_FRAMES.forEach(([x,y,w,h],i)=>{assert(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);for(const [px,py]of a.PROP_OUTLINES[i])assert(px>=x&&px<=x+w&&py>=y&&py<=y+h);});
for(const [left,right]of [[140,166],[95,128],[190,223]]){const h=a.holeLayout(left,right),scale=h.w/918;assert(Math.abs(h.x+208*scale-left)<.001);assert(Math.abs(h.x+708*scale-right)<.001);assert.equal(h.y,159,"patch must not climb onto skirting");assert(h.h>=16,"hole needs visible floor depth");assert(h.y+h.h<=175,"patch must stay above HUD");assert(Math.abs(h.y+305*(h.h/422)-a.HOLE_FRONT_Y)<.001);}
assert.equal(a.fallingCrop(480,469/480,.18,159),480);assert.equal(a.fallingCrop(480,469/480,.18,a.HOLE_FRONT_Y),469);assert(a.fallingCrop(480,469/480,.18,180)<469);assert.equal(a.fallingCrop(480,469/480,.18,260),0);
const calls=[];const props=Object.create(a.SchoolProps.prototype);props.lettering={fillStyle(){},fillRect(){}};props.prop=(...args)=>{calls.push(args);return {setCrop(){return this},setTint(){return this}};};const teacher={frame:{height:480,width:260},originY:469/480,scaleY:.18,setCrop(...args){this.crop=args;}};props.render(8,[[95,128]],teacher,true,180);assert(teacher.crop[3]<469);assert(calls.some(c=>c[5]===2.1));
for(const room of [1,3,4,6])for(const x of [22,150,287])for(const t of [4,1]){const b=a.dialogueLayout(room,t,x);assert(b.x>=12&&b.x+b.w<=308);assert(b.tail>=b.x&&b.tail<=b.x+b.w);assert(b.lines.every(l=>a.smallWidth(l)<=b.w-20));}
for(const entries of Object.values(a.SIGNS))for(const [x,y,w,lines]of entries){assert(x>=7&&x+w<=313);assert(lines.every(l=>a.bitmapWidth(l)<=w-8),lines.join());}
// Every stair interaction still intersects the walkable region after closures.
for(const [room,exits]of Object.entries(a.EXITS)){const edges=a.BLOCKED_EDGES[room]??[];const min=edges.includes('left')?42:12,max=edges.includes('right')?278:298;for(const exit of exits)assert(Math.max(min,exit.from)<=Math.min(max,exit.to));}
for(const [room,side]of [[0,'right'],[1,'left'],[1,'right'],[2,'left'],[3,'right'],[6,'right'],[7,'left'],[8,'right']])assert(!(a.BLOCKED_EDGES[room]??[]).includes(side));
console.log('PASS props outlines, hole collision alignment, WebGL-safe crop, speech bubble bounds, readable signs and unobstructed navigation');
for(const [room,exits] of Object.entries(a.EXITS)) for(const exit of exits) {
  const hints=a.passageHints(Number(room),(exit.from+exit.to)/2,false);
  assert(hints.some(h=>h.active&&h.key===exit.key), 'missing matching passage key in '+room);
}
assert.equal(a.passageHints(4,280,false).length,0);
assert(a.passageHints(4,280,true).some(h=>h.active&&h.key==='UP'));
for(const [room,edges] of Object.entries(a.BLOCKED_EDGES))for(const side of edges)
  assert(!a.passageHints(Number(room),side==='left'?15:298,false).some(h=>h.key===(side==='left'?'LEFT':'RIGHT')));
assert.equal(a.dialogueLayout(4,8,220,true).name,'INSPECTRICE');
console.log('PASS available passage keys, locked classroom, closed edges and inspector identity');

assert.equal(a.ENCOUNTER_SECONDS,9);assert(a.dialogueLayout(4,8,220).lines[0].includes('retard'));assert(a.dialogueLayout(4,4,220).lines[0].includes('defavorable'));console.log('PASS smaller dialogue lettering and legacy static page previews');
