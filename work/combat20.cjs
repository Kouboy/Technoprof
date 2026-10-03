const fs=require('fs');let s=fs.readFileSync('src/main.ts','utf8');fs.copyFileSync('src/main.ts','work/main-before20.ts.bak');
s=s.replace('  impactX = 0;','  impactX = 0;\n  impactY = 132;\n  impactKind = "hit";\n  openingFrom = 280;');
s=s.replace('    if (ok) {\n      this.won++;','    if (ok) {\n      this.openingFrom=this.px;\n      this.won++;');
s=s.replace('if (this.age > 1.8) {','if (this.age > (this.usesSliceArt()?3.4:1.8)) {');
s=s.replace('      this.fadeViewport(Math.min(1, this.age / 1.8));','      this.fadeViewport(this.usesSliceArt()?Phaser.Math.Clamp((this.age-2.5)/.9,0,1):Math.min(1,this.age/1.8));');
s=s.replace('      this.px = Phaser.Math.Clamp(\n        this.px + dir * (this.attack > 0 ? 34 : 85) * dt,','      const previousX=this.px;\n      this.px = Phaser.Math.Clamp(\n        this.px + dir * (this.attack > 0 ? (this.usesSliceArt()?0:34) : 85) * dt,');
s=s.replace('      if (dir && this.py === 159) {','      if(this.usesSliceArt()) this.separateFighters(previousX);\n      if (dir && this.py === 159 && this.attack===0 && Math.abs(this.px-previousX)>.01) {');
s=s.replace('Math.abs(e.x - this.px) > 44','Math.abs(e.x - this.px) > (this.usesSliceArt()?74:44)');
s=s.replace('            this.impactX = e.x;','            this.impactX = this.usesSliceArt()?e.x-this.face*15:e.x;\n            this.impactY = this.usesSliceArt()?this.py-69:132;\n            this.impactKind="block";\n            if(this.usesSliceArt())this.hitStop=.04;');
s=s.replace('          e.hp--;','          const contactX=this.usesSliceArt()?e.x-this.face*15:e.x;\n          e.hp--;\n          if(e.hp<=0)e.downTime=1.1;');
s=s.replace('          this.burst(e.x, 132, 0xeee2b9);','          this.burst(contactX, this.usesSliceArt()?this.py-69:132, 0xeee2b9);');
s=s.replace('          this.impactX = e.x;','          this.impactX = contactX;\n          this.impactY=this.usesSliceArt()?this.py-69:132;\n          this.impactKind="hit";');
s=s.replace('      for (const e of this.enemies) {\n        if (e.hp <= 0) continue;','      for (const e of this.enemies) {\n        if(e.downTime)e.downTime=Math.max(0,e.downTime-dt);\n        if (e.hp <= 0) continue;');
s=s.replace('const range = e.boss && e.pattern % 2 === 0 ? 42 : 32;\n            if (Math.abs(this.px - e.x) < range && this.py > 130) this.hurt();',`const range = this.usesSliceArt()?(e.pattern%2===0?78:64):(e.boss&&e.pattern%2===0?42:32);
            const facing=e.facing??Math.sign(this.px-e.x);
            if (Math.abs(this.px-e.x)<range && this.py>130 && (!this.usesSliceArt()||(this.px-e.x)*facing>0)) {
              const vulnerable=this.inv<=0;this.hurt();
              if(vulnerable&&this.usesSliceArt()){
                this.impact=.16;this.impactKind="hurt";this.impactX=this.px-facing*10;this.impactY=e.pattern%2===0?125:113;
                this.burst(this.impactX,this.impactY,0xbf6648);this.hitStop=.065;
                this.px=Phaser.Math.Clamp(this.px+facing*10,22,298);
              }
            }`);
s=s.replace('        if (Math.abs(d) > 31)','        const oldEnemyX=e.x;\n        if (Math.abs(d) > (this.usesSliceArt()?58:31))');
s=s.replace('        if (Math.abs(d) < (e.boss ? 95 : 35) && e.cool <= 0) {','        e.walk=(e.walk??0)+Math.abs(e.x-oldEnemyX);\n        if(this.usesSliceArt())this.separateFighters(this.px);\n        if (Math.abs(d) < (e.boss ? (this.usesSliceArt()?82:95) : 35) && e.cool <= 0) {\n          e.facing=Math.sign(d)||-1;');
const marker='  hurt() {';s=s.replace(marker,`  separateFighters(previousX:number) {
    for(const e of this.enemies){
      if(e.hp<=0||!e.boss||this.py<135)continue;
      const side=previousX<e.x?-1:1;
      if((this.px-e.x)*side<52){
        this.px=Phaser.Math.Clamp(e.x+side*52,22,298);
        if(Math.abs(this.px-e.x)<52)e.x=this.px-side*52;
      }
    }
  }
`+marker);
a=s.indexOf('    if (this.impact > 0) {',s.indexOf('  drawSliceSchool()'));b=s.indexOf('    const hint =',a);
s=s.slice(0,a)+`    if(this.impact>0){
      const radius=this.impactKind==='block'?5:9;
      const x=this.impactX,y=this.impactY;
      this.g.lineStyle(2,0x080d13);this.g.strokeCircle(x,y,radius);
      this.g.lineStyle(1,this.impactKind==='hurt'?0xbf6648:this.impactKind==='block'?0x758080:0xe5ae60);
      for(let i=0;i<6;i++){const angle=i*Math.PI/3;this.g.lineBetween(x+Math.cos(angle)*3,y+Math.sin(angle)*3,x+Math.cos(angle)*radius,y+Math.sin(angle)*radius);}
      this.rect(x-1,y-1,3,3,this.impactKind==='block'?0x758080:0xe3d4b3);
    }
`+s.slice(b);
fs.writeFileSync('src/main.ts',s);
let w=fs.readFileSync('src/world.ts','utf8').replace('  parent?: boolean;','  parent?: boolean;\n  facing?: number;\n  walk?: number;\n  downTime?: number;');fs.writeFileSync('src/world.ts',w);
let art=fs.readFileSync('src/slice-art.ts','utf8');
art=art.replace('  backdrop: Phaser.GameObjects.Image;','  backdrop: Phaser.GameObjects.Image;\n  door: Phaser.GameObjects.Graphics;');
art=art.replace('    this.teacher = scene.add.image','    this.door=scene.add.graphics().setDepth(1.5);\n    this.teacher = scene.add.image');
art=art.replace('    this.backdrop.setVisible(false);','    this.door?.clear();\n    this.backdrop.setVisible(false);');
art=art.replace('.setScale(role === "prof" ? 0.225 : 0.238)\n      .setFlipX(flip)', '.setScale((role === "prof" ? 0.225 : 0.238)*(flip?-1:1),role === "prof" ? 0.225 : 0.238)\n      .setFlipX(false)');
art=art.replace('    age: number;','    age: number;\n    openingFrom?: number;');
art=art.replace('      if (enemy.boss && enemy.hp > 0) {','      if (enemy.boss && (enemy.hp > 0 || (enemy.downTime??0)>0)) {');
art=art.replace('Math.abs(state.px - enemy.x) > 32','Math.abs(state.px - enemy.x) > 58');
art=art.replace('          enemy.stun > 0','          enemy.hp<=0 || enemy.stun > 0');
art=art.replace('Math.floor(state.ambienceClock * 7) % 4','Math.floor((enemy.walk??0)/8) % 4');
art=art.replace('          state.px < enemy.x ? -1 : 1,','          (enemy.wind>0||enemy.recovery>0)?(enemy.facing??(state.px<enemy.x?-1:1)):(state.px<enemy.x?-1:1),');
art=art.replace('        );\n      }\n  }','        ).setAlpha(enemy.hp<=0?Math.min(1,(enemy.downTime??0)*1.5):1);\n        if(enemy.hp<=0)this.inspector.y+=Math.min(10,(1.1-(enemy.downTime??0))*12);\n      }\n    if(state.phase==="opening"){\n      const t=state.age;const open=Math.min(1,t/.7);\n      this.door.fillStyle(0x080d13);this.door.fillRect(258,25,49,112);\n      this.door.fillStyle(0x66523a);this.door.fillRect(258,25,Math.max(3,49*(1-open)),112);\n      const walk=Math.max(0,Math.min(1,(t-.6)/1.1));\n      const direction=(state.openingFrom??state.px)>281?-1:1;\n      const actor=this.pose("prof",walk>0&&walk<1?[1,2,3,2][Math.floor(t*8)%4]:0,(state.openingFrom??state.px)+(281-(state.openingFrom??state.px))*walk,159-22*walk,direction);\n      const depth=1-.13*walk;actor.setScale(actor.scaleX*depth,actor.scaleY*depth).setAlpha(1-Math.max(0,Math.min(1,(t-1.7)/.7)));\n    }\n  }');
fs.writeFileSync('src/slice-art.ts',art);
for(const f of ['package.json','package-lock.json'])fs.writeFileSync(f,fs.readFileSync(f,'utf8').replaceAll('0.19.0','0.20.0'));
