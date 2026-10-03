const fs=require('fs');
const data={};for(const k of ['traffic','district'])data[k]='data:image/png;base64,'+fs.readFileSync('art/road-22/'+k+'.png').toString('base64');fs.writeFileSync('src/road-data.ts','export const ROAD_DATA = '+JSON.stringify(data)+';\n');
let s=fs.readFileSync('src/main.ts','utf8');
s='import { RoadArt } from "./road-art";\n'+s;
s=s.replace('  carArt?: CarArt;','  carArt?: CarArt;\n  roadArt?: RoadArt;');
s=s.replace('    CarArt.preload(this);','    CarArt.preload(this);\n    RoadArt.preload(this);');
s=s.replace('    this.carArt = new CarArt(this);','    this.carArt = new CarArt(this);\n    this.roadArt = new RoadArt(this);');
s=s.replace('    this.carArt?.hide();','    this.carArt?.hide();\n    this.roadArt?.hide();');
s=s.replace('    const renderScenery =',`    if(this.roadArt){
      scenery.length=0;
      // The first district repeats as a continuous prototype route. Each address
      // has an immutable world coordinate, including during notification.
      for(let id=Math.floor(this.travel/30);id<=Math.floor(this.travel/30)+18;id++){
        const d=id*30+18-this.travel;if(d<0||d>540)continue;
        scenery.push({d,lane:-1.95,kind:1});
        scenery.push({d:d+8,lane:1.8,kind:5});
        if(id%2===0)scenery.push({d:d+12,lane:id%4===0?-1.25:1.25,kind:4});
        if(id%8===3)scenery.push({d:d+15,lane:-1.38,kind:2});
        if(id%18===12)scenery.push({d:d+10,lane:0,kind:6});
      }
    }
    const renderScenery =`);
s=s.replace('      if (t.kind !== 6 && (p.x < 10 || p.x > 304)) return;',`      if(this.roadArt && t.kind!==6){
        const frame=t.kind===1?0:t.kind===2?1:t.kind===4?2:3;
        const width=[150,64,29,115][frame]*p.scale;
        if(p.x+width/2<7||p.x-width/2>313)return;
        this.roadArt.draw('district',frame,p.x,p.y,width,t.lane>0);return;
      }
      if (t.kind !== 6 && (p.x < 10 || p.x > 304)) return;`);
s=s.replace('      if (o.type === 1) this.rect(p.x - w / 2, p.y - h, w, h, 0xada884);',`      if(this.roadArt){
        this.roadArt.draw('traffic',o.type===1?2:o.type===2?1:0,p.x,p.y,(o.type===1?46:o.type===2?32:37)*p.scale);return;
      }
      if (o.type === 1) this.rect(p.x - w / 2, p.y - h, w, h, 0xada884);`);
s=s.replace('    layers.sort((a, b) => b.d - a.d).forEach((layer) => layer.render());',`    const ground=this.g;
    layers.sort((a,b)=>b.d-a.d).forEach((layer,index)=>{
      if(this.roadArt)this.g=this.roadArt.layer(index);
      layer.render();
    });
    this.g=ground;`);
// Sidewalks are projected scanlines just like the road, with joints in world space.
s=s.replace('      const left = Math.max(7, c - half),',`      for(const side of [-1,1]){
        const a=c+side*half,b=c+side*(half+24*scale);
        const l=Math.max(7,Math.min(a,b)),r=Math.min(313,Math.max(a,b));
        if(r>l)this.rect(l,y,r-l,1,Math.floor((this.travel+d)/5)%7===0?0x62665f:0x7d7c70);
      }
      const left = Math.max(7, c - half),`);
fs.writeFileSync('src/main.ts',s);
for(const f of ['package.json','package-lock.json']){let p=JSON.parse(fs.readFileSync(f));p.version='0.22.0';if(p.packages)p.packages[''].version=p.version;fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');}
fs.writeFileSync('LIRE-MOI-LOCAL.txt',fs.readFileSync('LIRE-MOI-LOCAL.txt','utf8').replace('0.21 -','0.22 -'));
