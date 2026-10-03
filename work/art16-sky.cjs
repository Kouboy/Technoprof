const fs=require('fs');let s=fs.readFileSync('src/main.ts','utf8');
let a=s.indexOf('  roadSky(horizon: number) {'),b=s.indexOf('  roomLandmark()',a);
s=s.slice(0,a)+`  roadSky(horizon:number) {
    const dusk=this.mission===2;
    this.rect(7,7,306,horizon-7,dusk?0x512e32:0x38494c);
    this.shape([7,horizon-23,59,horizon-20,134,horizon-28,207,horizon-21,313,horizon-25,313,horizon,7,horizon],dusk?0x854538:0x758080);
    this.g.fillStyle(dusk?0xe5ae60:0xb9aa89);this.g.fillCircle(dusk?68:253,horizon-25,8);
    this.shape([7,15,70,18,109,14,151,23,211,17,264,21,313,15,313,28,231,30,163,28,91,32,7,26],0x24333b);
    this.hatch(8,19,300,8,0x080d13,9);
    for(let i=0;i<18;i++){
      const x=7+(((i*23-this.travel*.004)%306)+306)%306,h=7+(i*7%19),w=Math.min(17,313-x);
      this.shape([x,horizon,x,horizon-h,x+w*.5,horizon-h-3,x+w,horizon-h,x+w,horizon],0x24333b);
      if(w>10){this.rect(x+3,horizon-h+3,1,h-4,0x526064);for(let j=0;j<3;j++)this.rect(x+7,horizon-h+4+j*5,3,1,0x665e4a);}
    }
    this.rect(7,horizon-2,306,2,0x141e27);
  }
`+s.slice(b);
s=s.replace('Math.floor((this.travel + d) / 14) % 2 ? 0x55565a : 0x515256','Math.floor((this.travel + d) / 14) % 2 ? 0x38494c : 0x38494c');
// Replace rectangular roadside vegetation with ragged branches.
a=s.indexOf('      this.rect(\n        p.x - 2 * p.scale,',s.indexOf('    const scenery ='));b=s.indexOf('\n    }\n    for (const o of',a);
if(a<0||b<0)throw Error('tree anchor');
s=s.slice(0,a)+`      const tree=(pts:number[],c:number)=>this.shape(pts.map((v,i)=>i%2?p.y+v*p.scale:p.x+v*p.scale),c);
      tree([-3,0,-2,-34,-10,-43,-7,-44,0,-35,3,-54,5,-53,3,-29,8,-38,10,-38,4,-24,3,0],0x141e27);
      tree([0,-61,-8,-49,-4,-49,-15,-37,-9,-38,-18,-26,-8,-27,-13,-20,15,-22,9,-31,16,-31,7,-42,10,-43],0x24333b);
      tree([0,-58,-5,-48,1,-50,-9,-38,-3,-39,-10,-29,1,-33,5,-45],0x45443a);
`+s.slice(b);
fs.writeFileSync('src/main.ts',s);
