const fs=require('fs');let s=fs.readFileSync('src/main.ts','utf8');fs.copyFileSync('src/main.ts','work/main-before18.ts.bak');
const a=s.indexOf('    for (const t of scenery.sort'),b=s.indexOf('    for (const o of [...this.obstacles]',a),c=s.indexOf('    for (const m of this.tireMarks)',b);
let scenery=s.slice(a,b),traffic=s.slice(b,c);
scenery=scenery.replace('    for (const t of scenery.sort((a, b) => b.d - a.d)) {','    const renderScenery = (t: {d:number;lane:number;kind:number}) => {').replace('if (p.x < 10 || p.x > 304) continue;','if (t.kind!==6 && (p.x < 10 || p.x > 304)) return;\n      this.g.save();\n      if(t.kind!==6 && t.lane>0){this.g.translateCanvas(p.x,0);this.g.scaleCanvas(-1,1);this.g.translateCanvas(-p.x,0);}\n      try {').replaceAll('continue;','return;');
scenery=scenery.trimEnd().replace(/\}\s*$/,'} finally {this.g.restore();}\n    };\n');
traffic=traffic.replace('    for (const o of [...this.obstacles].sort((a, b) => b.z - a.z)) {','    const renderTraffic = (o: {z:number;x:number;type:number}) => {').replaceAll('continue;','return;').trimEnd().replace(/\}\s*$/,'};\n');
s=s.slice(0,a)+scenery+traffic+`    const layers = [
      ...scenery.map(t=>({d:t.d,render:()=>renderScenery(t)})),
      ...this.obstacles.map(o=>({d:o.z-this.travel,render:()=>renderTraffic(o)})),
    ];
    layers.sort((a,b)=>b.d-a.d).forEach(layer=>layer.render());

`+s.slice(c);
s=s.replace('        local(-4, -3, 8, 3, 0x384546);',`        local(-4, -3, 8, 3, 0x384546);
        local(0,-70,1,64,0x928269);local(-2,-17,4,8,0x24333b);local(-1,-15,1,3,0xb9aa89);
        local(13,-74,8,1,0xe3d4b3);local(19,-78,2,3,0x080d13);`);
s=s.replace('        local(-8, -35, 20, 3, 0x46554e);',`        local(-8, -35, 20, 3, 0x46554e);
        local(15,-85,2,80,0x24333b);local(21,-85,2,80,0x24333b);
        for(let i=0;i<12;i++)local(16,-81+i*6,6,1,0x928269);
        local(-21,-79,4,10,0x665e4a);local(-20,-71,3,7,0x854538);
        local(-5,-85,13,6,0xb9aa89);local(-3,-83,9,1,0x24333b);`);
s=s.replace('      if (t.kind === 6) {','      if (t.kind === 6) {');
const needle='        continue;'; // branch already converted to return
const bridge=s.indexOf('      if (t.kind === 6) {'),end=s.indexOf('        return;',bridge);
s=s.slice(0,end)+`        for(let i=0;i<12;i++){
          const xx=left.x+(right.x-left.x)*i/12;
          this.rect(xx,left.y-70*p.scale,1*p.scale,8*p.scale,0x24333b);
        }
        this.rect(left.x,left.y-70*p.scale,right.x-left.x,1*p.scale,0x928269);
        this.rect(left.x+8*p.scale,left.y-58*p.scale,12*p.scale,5*p.scale,0xb9aa89);
        this.rect(left.x+10*p.scale,left.y-56*p.scale,8*p.scale,1*p.scale,0x854538);
`+s.slice(end);
s=s.replace('          r(hand, -27, 3, 5, 0x665e4a);\n          r(hand - 3, -23, 9, 3, 0x854538);',`          // Mushroom handle, metal shaft and wide rubber sole: readable rubber stamp.
          const stampY=enemy?.wind?-34:hit?-20:-28;
          poly([hand-3,stampY,hand-2,stampY-4,hand+3,stampY-4,hand+5,stampY,hand+3,stampY+2,hand-2,stampY+2],0x080d13);
          r(hand-2,stampY-3,5,3,0x928269);r(hand,stampY+1,2,5,0x758080);
          r(hand-6,stampY+5,14,3,0x080d13);r(hand-5,stampY+5,12,1,0xb9aa89);r(hand-5,stampY+8,12,2,0x854538);
          if(hit){r(hand-7,stampY+12,16,1,0xbf6648);r(hand-7,stampY+16,16,1,0xbf6648);r(hand-7,stampY+12,1,5,0xbf6648);r(hand+8,stampY+12,1,5,0xbf6648);}
`);
s=s.replace('        r(-8, -14, 4, 1, 0x665e4a);',`        r(-8, -14, 4, 1, 0x665e4a);
        r(-7,-22,4,3,0x758080);r(-6,-21,2,1,0x080d13);
        r(-8,-11,5,1,0x854538);r(-8,-9,3,1,0x665e4a);
        r(-3,-37,4,1,0x665e4a);r(2,-35,3,1,0x080d13);`);
s=s.replace('        r(-4, -32, 1, 3, 0x080d13);',`        r(-4, -32, 1, 3, 0x080d13);
        r(-4,-28,1,3,0x758080);r(-3,-25,1,1,0xbf6648);r(-4,-23,2,1,0x526064);
        r(3,-28,2,1,0x141e27);`);
s=s.replace('        r(hand + 1, -25, 2, 5, 0x758080);',`        r(hand + 1, -25, 2, 5, 0x758080);r(hand+1,-20,1,1,0xe3d4b3);
        r(-3,-38,4,1,0x665e4a);r(-2,-36,5,1,0x45443a);`);
s=s.replace('      if (o.type === 1) this.g.strokeRect(p.x - w / 2, p.y - h, w, h);',`      if (o.type === 1) {
        this.g.strokeRect(p.x-w/2,p.y-h,w,h);
        for(const side of [-1,1]){
          this.rect(p.x+side*w*.22,p.y-h*.9,p.scale,h*.55,0x24333b);
          this.rect(p.x+side*w*.22-p.scale,p.y-h*.4,3*p.scale,2*p.scale,0x758080);
        }
        this.rect(p.x-w*.25,p.y-h*.9,w*.5,4*p.scale,0x38494c);
        this.rect(p.x-w*.16,p.y-h*.86,w*.32,p.scale,0xb9aa89);
      }`);
fs.writeFileSync('src/main.ts',s);
for(const f of ['package.json','package-lock.json'])fs.writeFileSync(f,fs.readFileSync(f,'utf8').replaceAll('0.17.0','0.18.0'));
fs.writeFileSync('LIRE-MOI-LOCAL.txt',fs.readFileSync('LIRE-MOI-LOCAL.txt','utf8').replace('0.17','0.18'));
