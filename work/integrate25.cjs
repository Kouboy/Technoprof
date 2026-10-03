const fs=require('fs');
fs.writeFileSync('src/court-data.ts','export const COURT_DATA = '+JSON.stringify('data:image/png;base64,'+fs.readFileSync('art/court-25/cour.png').toString('base64'))+';\n');
let s=fs.readFileSync('src/main.ts','utf8');s='import { COURT_DATA } from "./court-data";\n'+s;
s=s.replace('  art?: SliceArt;','  art?: SliceArt;\n  courtBackdrop?: Phaser.GameObjects.Image;\n  usesCourtArt(){return !!this.courtBackdrop && this.room===0 && ["school","fail"].includes(this.phase) && !this.brokenRoad;}');
s=s.replace('    SliceArt.preload(this);','    SliceArt.preload(this);\n    this.load.image("courtyard",COURT_DATA);');
s=s.replace('    this.art = new SliceArt(this);',`    this.art = new SliceArt(this);
    const courtyard=this.textures.get('courtyard');
    const courtSource=courtyard.getSourceImage() as HTMLImageElement;
    // Frame the background so its actual doorway threshold meets y=159.
    courtyard.add('playable',0,0,0,courtSource.width,Math.round(courtSource.height*.802));
    courtyard.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.courtBackdrop=this.add.image(7,7,'courtyard','playable').setOrigin(0).setDisplaySize(306,168).setDepth(1).setVisible(false);`);
s=s.replace('    this.art?.hide();','    this.art?.hide();\n    this.courtBackdrop?.setVisible(false);');
s=s.replace('    if (!this.usesSliceArt()) {','    if (!this.usesSliceArt() && !this.usesCourtArt()) {');
s=s.replace('      this.usesSliceArt() ||','      this.usesSliceArt() || this.usesCourtArt() ||');
s=s.replace('  drawSchool() {','  drawSchool() {\n    if(this.usesCourtArt()){this.drawCourtyard();return;}');
s=s.replace('  drawSliceSchool() {',`  drawCourtyard(){
    this.courtBackdrop!.setVisible(true);
    const moving=this.keys.LEFT.isDown||this.keys.RIGHT.isDown;
    const frame=this.attack>.34?4:this.attack>.17?5:this.attack>0?6:this.py<158?7:moving?[1,2,3,2][Math.floor(this.walkClock/1.5)%4]:0;
    this.art!.pose('prof',frame,this.px,this.py,this.face).setScale(.13*this.face,.13).setAlpha(this.inv>0 && Math.floor(this.age*12)%2===0?.5:1);
    this.txt(239,75,'BATIMENT C >',8,'#e3d4b3',true);
  }
  drawSliceSchool() {`);
s=s.replace('location.pathname.endsWith("Jouer-Arrivee.html")','location.pathname.endsWith("Jouer-Cour.html") ? "cour" : location.pathname.endsWith("Jouer-Arrivee.html")');
fs.writeFileSync('src/main.ts',s);
fs.appendFileSync('work/export-local.cjs',"\nfs.writeFileSync(path.join(root, 'Jouer-Cour.html'), html);\n");
for(const f of ['package.json','package-lock.json']){const p=JSON.parse(fs.readFileSync(f));p.version='0.25.0';if(p.packages)p.packages[''].version=p.version;fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');}
