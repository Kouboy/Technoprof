const fs=require('fs');
fs.writeFileSync('src/arrival-data.ts','export const ARRIVAL_DATA = '+JSON.stringify('data:image/png;base64,'+fs.readFileSync('art/arrival-24/college.png').toString('base64'))+';\n');
let s=fs.readFileSync('src/main.ts','utf8');
s='import { ARRIVAL_DATA } from "./arrival-data";\n'+s;
s=s.replace('  art?: SliceArt;','  art?: SliceArt;\n  arrivalBackdrop?: Phaser.GameObjects.Image;\n  arrivalGate?: Phaser.GameObjects.Graphics;');
s=s.replace('    SliceArt.preload(this);','    SliceArt.preload(this);\n    this.load.image("arrival-college",ARRIVAL_DATA);');
s=s.replace('    this.art = new SliceArt(this);',`    this.art = new SliceArt(this);
    this.textures.get('arrival-college').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.arrivalBackdrop=this.add.image(7,7,'arrival-college').setOrigin(0).setDisplaySize(306,168).setDepth(3.005).setVisible(false);
    this.arrivalGate=this.add.graphics().setDepth(3.14);`);
s=s.replace('    this.art?.hide();','    this.art?.hide();\n    this.arrivalBackdrop?.setVisible(false);\n    this.arrivalGate?.clear();');
s=s.replace('(location.pathname.endsWith("Jouer-Salle42C.html") ? "atelier" : null)','(location.pathname.endsWith("Jouer-Arrivee.html") ? "arrivee" : location.pathname.endsWith("Jouer-Salle42C.html") ? "atelier" : null)');
s=s.replace('  drawArrival() {','  drawArrival() {\n    if(this.arrivalBackdrop && this.art && this.carArt && this.foreground){this.drawPulpArrival();return;}');
const method=`  drawPulpArrival() {
    const t=this.phase==='arrivalFade'?5.8:this.age;
    this.arrivalBackdrop!.setVisible(true);
    const p=Math.min(1,t/1.8), carX=40+71*(1-(1-p)**3);
    this.carArt!.side(carX);
    this.g=this.foreground!;
    this.vehicleDamage(carX,146,true);
    this.txt(181,62,'COLLEGE ST-HANOUNA',7,'#e3d4b3',true);
    // The gate pivots at the actual masonry opening, before the teacher arrives.
    const gate=this.arrivalGate!;
    const opening=Phaser.Math.Clamp((t-3.65)/.7,0,1);
    const width=29*(1-opening)+3*opening;
    for(const side of [-1,1]){
      const hinge=side===-1?190:252;
      const end=hinge-side*width;
      gate.lineStyle(1.1,0x17292c);
      gate.lineBetween(hinge,94,end,94+opening*3);
      gate.lineBetween(hinge,123,end,123+opening*3);
      for(let bar=0;bar<=6;bar++){
        const x=hinge-side*width*bar/6;
        gate.lineBetween(x,91+opening*bar*.5,x,128);
      }
      gate.lineStyle(.45,0x79837a);
      gate.lineBetween(hinge,94,end,94+opening*3);
    }
    if(t>1.9 && t<2.85){
      const angle=Math.sin(Math.PI*Phaser.Math.Clamp((t-1.9)/.95,0,1));
      this.shape([carX+1,128,carX+13+angle*8,132,carX+13+angle*8,149,carX+1,144],0x526064);
      this.shape([carX+3,130,carX+10+angle*7,133,carX+10+angle*7,138,carX+3,136],0x17262d);
      this.rect(carX+5,140,3,1,0xb9aa89);
    }
    if(t>2.25){
      const walk=Phaser.Math.Clamp((t-2.25)/2.35,0,1);
      const recede=Phaser.Math.Clamp((t-4.6)/1.2,0,1);
      const x=123+(220-123)*walk;
      const feet=146-16*walk-19*recede;
      const frame=[1,2,3,2][Math.floor(t*7)%4];
      const teacher=this.art!.pose('prof',frame,x,feet,1);
      teacher.setDepth(3.15).setScale(.105*(1-.2*recede)).setAlpha(Math.min(1,(t-2.25)/.22));
    }
  }
`;
s=s.replace('  drawSliceSchool() {',method+'  drawSliceSchool() {');fs.writeFileSync('src/main.ts',s);
s=fs.readFileSync('src/slice-art.ts','utf8').replace('    this.teacher.setVisible(false);','    this.teacher.setVisible(false).setDepth(2);');fs.writeFileSync('src/slice-art.ts',s);
fs.appendFileSync('work/export-local.cjs',"\nfs.writeFileSync(path.join(root, 'Jouer-Arrivee.html'), html);\n");
for(const f of ['package.json','package-lock.json']){const p=JSON.parse(fs.readFileSync(f));p.version='0.24.0';if(p.packages)p.packages[''].version=p.version;fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');}
