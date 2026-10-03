const fs=require('fs');let s=fs.readFileSync('src/main.ts','utf8');
const a=s.indexOf('        if (!e.boss && !e.parent) {',s.indexOf('  drawSchool()'));const b=s.indexOf('          if (e.wind > 0)',a);
s=s.slice(0,a)+`        if (!e.boss && !e.parent && this.room===6) {
          this.shape([e.x-6,126,e.x+4,125,e.x+7,147,e.x-6,146],0x24333b);
          this.rect(e.x-5,113,10,3,0x141e27);
          this.rect(e.x-6,116,14,1,0x758080);
          this.rect(e.x+2,129,2,3,0xe3d4b3);
          this.rect(e.x+9,138,2,17,0x080d13);
        } else if(!e.boss && !e.parent) {
          this.shape([e.x-6,126,e.x+3,125,e.x+6,141,e.x-6,142],0x512e32);
          this.shape([e.x-6,124,e.x,128,e.x+4,125,e.x+3,130,e.x-6,127],0xb9aa89);
          this.rect(e.x-9,129,4,13,0x141e27);
        }
        if(e.boss){
          this.shape([e.x-5,125,e.x,127,e.x+4,125,e.x+7,149,e.x-7,149],0x141e27);
          this.shape([e.x-4,125,e.x,129,e.x+3,125,e.x+1,138],0xe3d4b3);
          this.rect(e.x,129,2,11,0x854538);
          this.rect(e.x-4,119,9,1,0x080d13);
          this.rect(e.x+5,131,2,3,0xe5ae60);
        }
        if(e.parent){
          this.shape([e.x-5,125,e.x+3,125,e.x+8,132,e.x+6,145,e.x-8,145,e.x-9,132],0x665e4a);
          this.shape([e.x-4,124,e.x+2,127,e.x+5,123,e.x+4,130,e.x-5,127],0x854538);
          this.rect(e.x+9,134,3,9,0x080d13);
          this.rect(e.x+10,135,1,4,0x758080);
`+s.slice(b);
// World-anchored building side planes, window surrounds and brick joints.
s=s.replace('      if (t.kind === 1) {',`      if (t.kind === 1) {
        this.shape([p.x+20*p.scale,p.y-45*p.scale,p.x+33*p.scale,p.y-38*p.scale,p.x+33*p.scale,p.y-3*p.scale,p.x+20*p.scale,p.y],0x24333b);
`);
s=s.replace('        local(-20, -17, 40, 17, 0x5c6155);',`        for(let row=0;row<5;row++)for(let col=0;col<4;col++)local(-18+col*10+(row%2)*3,-29+row*5,5,1,0x45443a);
        local(-20, -17, 40, 17, 0x5c6155);`);
s=s.replace('    this.schoolAtmosphere();',`    this.schoolAtmosphere();
    if(this.room===0){
      for(let i=0;i<7;i++){
        const x=12+i*43;
        this.shape([x,39,x+3,39,x+3,84,x-2,90],0x24333b);
        this.rect(x+3,85,31,2,0xb9aa89);
        this.hatch(x+6,88,25,12,0x080d13,4);
        for(let j=0;j<3;j++)this.rect(x+7+j*7,102+(i%3)*8,5,1,0x665e4a);
      }
      this.shape([173,89,175,94,172,101,177,110,174,117,175,112,170,101],0x080d13);
    }
`);
// Doors: diagonal recess shadows and split varnish.
s=s.replace('      this.rect(x + 5, 91, 20, 11, 0xcabb93);',`      if(!open){
        this.shape([x+5,106,x+9,106,x+9,126,x+20,126,x+20,129,x+5,129],0x24333b);
        this.hatch(x+7,137,14,12,0x080d13,4);
      }
      this.rect(x + 5, 91, 20, 11, 0xcabb93);`);
fs.writeFileSync('src/main.ts',s);
