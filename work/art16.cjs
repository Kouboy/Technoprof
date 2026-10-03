const fs=require('fs');const p='src/main.ts';let s=fs.readFileSync(p,'utf8');fs.copyFileSync(p,'work/main-before-art16.ts.bak');
const a=s.indexOf('    if (["school", "opening"].includes(this.phase)) {',s.indexOf('  rect('));const b=s.indexOf('    this.g.fillStyle(c);',a);
s=s.slice(0,a)+`    c = this.ink(c);
`+s.slice(b);
const methods=`  inkCache = new Map<number, number>();
  ink(c: number) {
    if (c === 0) return 0;
    const known = this.inkCache.get(c);
    if (known !== undefined) return known;
    // Shared pigments for every scene: soot, slate, oxidised steel, tobacco, paper, rust.
    const palette = [0x080d13,0x141e27,0x24333b,0x38494c,0x526064,0x758080,0x45443a,0x665e4a,0x928269,0xb9aa89,0xe3d4b3,0x512e32,0x854538,0xbf6648,0xe5ae60];
    const r=c>>16,g=(c>>8)&255,b=c&255;
    let best=palette[0],distance=Infinity;
    for(const p of palette){ const d=2*(r-(p>>16))**2+3*(g-((p>>8)&255))**2+(b-(p&255))**2; if(d<distance){distance=d;best=p;} }
    this.inkCache.set(c,best);return best;
  }
  shape(points: number[], color: number, alpha=1) {
    this.g.fillStyle(this.ink(color),alpha);
    this.g.beginPath();this.g.moveTo(points[0],points[1]);
    for(let i=2;i<points.length;i+=2)this.g.lineTo(points[i],points[i+1]);
    this.g.closePath();this.g.fillPath();
  }
  hatch(x:number,y:number,w:number,h:number,color=0x080d13,spacing=5) {
    this.g.lineStyle(.5,this.ink(color),.45);
    for(let i=0;i<w;i+=spacing)this.g.lineBetween(x+i,y,x+Math.min(w,i+5),y+Math.min(h,8));
  }
  rearCar(x:number,y:number,w:number,h:number,paint:number,lean=0) {
    const poly=(pts:number[],c:number)=>this.shape(pts.map((v,i)=>i%2?y+v*h:x+v*w+(v<0?lean:0)),c);
    poly([-.55,0,-.52,-.38,-.35,-.91,-.23,-1,.27,-1,.38,-.86,.53,-.35,.54,0],0x080d13);
    poly([-.46,-.12,-.46,-.44,-.31,-.87,.3,-.87,.46,-.43,.47,-.12],paint);
    poly([-.31,-.86,-.24,-.96,.25,-.96,.32,-.85],0xb9aa89);
    poly([-.3,-.81,.29,-.81,.37,-.5,-.37,-.5],0x141e27);
    poly([-.26,-.78,-.1,-.78,-.28,-.54,-.34,-.54],0x526064);
    poly([-.44,-.43,.44,-.43,.48,-.33,-.46,-.33],0x928269);
    poly([.38,-.43,.48,-.35,.47,-.12,.35,-.12],0x45443a);
    this.rect(x-w*.44,y-h*.23,w*.19,h*.07,0xbf6648);
    this.rect(x+w*.25,y-h*.23,w*.19,h*.07,0xbf6648);
    this.rect(x-w*.46,y-h*.11,w*.92,h*.045,0x758080);
    this.rect(x-w*.13,y-h*.19,w*.26,h*.055,0xe3d4b3);
    this.hatch(x-w*.35,y-h*.3,w*.36,h*.1);
  }
  sceneInk() {
    // Edge shadow stays outside the playable floor and does not touch text or the CADRE.
    this.shape([7,24,21,24,13,149,7,158],0x080d13,.55);
    this.shape([303,24,313,24,313,158,308,149],0x080d13,.55);
    if(["school","opening"].includes(this.phase)) {
      this.shape([7,24,313,24,313,29,7,33],0x080d13);
      this.hatch(8,34,303,12,0x080d13,7);
    }
  }
`;
s=s.replace('  rect(x:',methods+'  rect(x:');
// Tall narrow figures: small angular heads, articulated legs and asymmetrical coats.
const ps=s.indexOf('    this.rect(x - 9, y - 2, 20, 3, 0x283431);',s.indexOf('  person('));const pe=s.indexOf('    if (book) {',ps);
s=s.slice(0,ps)+`    const poly=(pts:number[],color:number)=>this.shape(pts.map((v,i)=>i%2?y+v:x+v),color);
    this.shape([x-11,y+1,x-6,y-2,x+11,y-1,x+14,y+2],0x080d13,.7);
    y += moving ? -Math.abs(step)*.25 : Math.sin(this.ambienceClock*2+x)*.3;
    poly([-5,-27,-7+step,-12,-8+step,0,-3+step,0,0,-14,3-step,-1,8-step,-1,5,-25],0x080d13);
    poly([-4,-19,-5+step,-4,-2+step,-4,1,-18],0x38494c);
    poly([2,-20,4-step,-4,6-step,-4,5,-21],0x24333b);
    poly([-5,-34,2,-36,7,-30,6,-15,9,-10,-3,-12,-8,-9,-7,-29],0x080d13);
    poly([-4,-32,1,-34,5,-29,4,-14,6,-12,-2,-14,-6,-12,-5,-28],book?0x928269:c);
    poly([-4,-32,0,-28,-2,-15,-6,-12],0x45443a);
    poly([1,-33,4,-29,2,-21,-1,-28],0xe3d4b3);
    poly([1,-29,3,-27,2,-19,0,-22],0x854538);
    poly([-4,-44,2,-46,6,-42,5,-38,7,-36,3,-33,-3,-35,-5,-40],0x080d13);
    poly([-2,-42,3,-43,4,-38,6,-36,2,-34,-2,-36],0xb9aa89);
    poly([-3,-42,0,-43,0,-36,-2,-37],0x665e4a);
    this.rect(x-3,y-45,6,2,0x45443a);
    this.rect(x-2,y-40,7,1,0x080d13);
    this.rect(x+2,y-39,2,1,0x758080);
    this.hatch(x-5,y-27,8,9,0x080d13,3);
    this.rect(x-9+step,y,7,2,0x080d13);
    this.rect(x+2-step,y,8,2,0x080d13);
`+s.slice(pe);
// Remove old face rectangles (new face is higher), retain book mechanics.
const f=s.indexOf('      this.rect(x - 6, y - 34',s.indexOf('  person('));const e=s.indexOf('      const swing',f);s=s.slice(0,f)+s.slice(e);
// Player rear silhouette; retain damage/exhaust/brake feedback.
const cs=s.indexOf('    this.rect(x - 15 + lean, 136');const ce=s.indexOf('    if (this.keys.DOWN.isDown)',cs);
s=s.slice(0,cs)+'    this.rearCar(x,169,37,32,0x928269,lean);\n'+s.slice(ce);
const ds=s.indexOf('    this.rect(x - 15, 154');const de=s.indexOf('    this.vehicleDamage(x, 165);',ds);s=s.slice(0,ds)+s.slice(de);
// Traffic uses the same body language.
const ts=s.indexOf('        const paint = o.type === 2');const te=s.indexOf('\n      }',ts);s=s.slice(0,ts)+`        this.rearCar(p.x,p.y,w,h*.82,o.type===2?0x526064:0x854538);
`+s.slice(te);
// Replace cute side-view car with a low, sloped saloon.
const as=s.indexOf('    this.rect(carX - 20, 117');const ae=s.indexOf('    this.vehicleDamage(carX, 146, true);',as);
s=s.slice(0,as)+`    this.shape([carX-34,147,carX-33,134,carX-23,132,carX-14,120,carX+12,120,carX+23,131,carX+34,134,carX+35,147],0x080d13);
    this.shape([carX-31,144,carX-30,135,carX-21,134,carX-12,122,carX+10,122,carX+22,133,carX+32,135,carX+32,144],0x928269);
    this.shape([carX-18,132,carX-11,124,carX+9,124,carX+17,132],0x141e27);
    this.rect(carX,124,2,9,0x758080);
    this.rect(carX-31,138,63,2,0xb9aa89);
    for(const dx of [-21,23]){this.g.fillStyle(0x080d13);this.g.fillCircle(carX+dx,147,6);this.g.fillStyle(0x758080);this.g.fillCircle(carX+dx,147,2);}
    this.hatch(carX-15,141,31,4);
`+s.slice(ae);
// HUD: steel and paper, replacing the green plastic housing.
s=s.replace('this.rect(0, 179, 320, 61, 0x51645c)','this.rect(0, 179, 320, 61, 0x141e27)').replace('this.rect(0, 179, 320, 2, 0x8d9781)','this.rect(0, 179, 320, 2, 0xb9aa89)');
s=s.replace('    this.rect(0, 179, 320, 61,','    if (["road","free","receive","arrival","arrivalFade","school","opening"].includes(this.phase)) this.sceneInk();\n    this.rect(0, 179, 320, 61,');
s=s.replace('    this.schoolAtmosphere();',`    this.schoolAtmosphere();
    // Long cast shadows and exposed brick replace flat pastel wall expanses.
    if(this.room!==0){
      this.shape([7,35,71,35,124,151,90,151],0x080d13,.24);
      this.shape([190,34,207,34,264,151,228,151],0x080d13,.3);
      for(let row=0;row<4;row++)for(let col=0;col<5-row;col++){
        const bx=14+col*11+(row%2)*5,by=111+row*8;
        this.rect(bx,by,9,6,row%2?0x665e4a:0x45443a);
        this.rect(bx,by+5,9,1,0x080d13);
      }
      this.hatch(130,124,64,25,0x080d13,4);
    }
`);
// Road verge materials: ground bands project with their world coordinates.
s=s.replace('      const left = Math.max(7, c - half),',`      const district=Math.floor((this.travel+d)/750)%3;
      this.rect(7,y,306,1,district===0?0x45443a:district===1?0x526064:0x665e4a);
      const left = Math.max(7, c - half),`);
// One text palette. Reserve bright rust for threats.
s=s.replace('        color: c,','        color: c === "#d3dfb6" ? "#e3d4b3" : c,');
fs.writeFileSync(p,s);
let html=fs.readFileSync('index.html','utf8').replace('#24302b','#24333b').replace('#101715','#10161e').replace('#080d0d','#080d13').replace('#abb8ae','#b9aa89').replace('#d6df91','#e5ae60');fs.writeFileSync('index.html',html);
for(const f of ['package.json','package-lock.json']){let t=fs.readFileSync(f,'utf8').replaceAll('0.15.0','0.16.0');fs.writeFileSync(f,t);}
