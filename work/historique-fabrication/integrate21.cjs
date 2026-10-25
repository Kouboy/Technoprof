const fs=require('fs');
fs.writeFileSync('src/car-data.ts','export const CAR_DATA = '+JSON.stringify('data:image/png;base64,'+fs.readFileSync('art/car-21/service.png').toString('base64'))+';\n');
let s=fs.readFileSync('src/main.ts','utf8');
s='import { CarArt } from "./car-art";\n'+s;
s=s.replace('  art?: SliceArt;','  art?: SliceArt;\n  carArt?: CarArt;\n  sceneGraphics?: Phaser.GameObjects.Graphics;\n  foreground?: Phaser.GameObjects.Graphics;');
s=s.replace('    SliceArt.preload(this);','    SliceArt.preload(this);\n    CarArt.preload(this);');
s=s.replace('    this.art = new SliceArt(this);','    this.art = new SliceArt(this);\n    this.sceneGraphics = this.g;\n    this.carArt = new CarArt(this);\n    this.foreground = this.add.graphics().setDepth(3.2);');
s=s.replace('    this.art?.hide();','    this.art?.hide();\n    this.carArt?.hide();\n    this.foreground?.clear();\n    if(this.sceneGraphics) this.g = this.sceneGraphics;');
s=s.replace('    this.rearCar(x, 169, 37, 32, 0x928269, lean, true);','    if(this.carArt && this.foreground) {\n      this.carArt.rear(x,this.speed,this.steerVelocity,this.ambienceClock,this.vehicle);\n      this.g=this.foreground;\n    } else this.rearCar(x, 169, 37, 32, 0x928269, lean, true);');
s=s.replace('this.rect(x - 13, 158, 7, 3, 0xffbc78);','this.rect(x - 18, 155, 7, 2, 0xff7352);').replace('this.rect(x + 6, 158, 7, 3, 0xffbc78);','this.rect(x + 11, 155, 7, 2, 0xff7352);');
const start=s.indexOf('    this.shape(',s.indexOf('    // The vehicle decelerates'));
const end=s.indexOf('    this.vehicleDamage(carX, 146, true);',start);
s=s.slice(0,start)+'    if(this.carArt && this.foreground) {\n      this.carArt.side(carX);\n      this.g=this.foreground;\n    } else {\n'+s.slice(start,end)+'    }\n'+s.slice(end);
s=s.replace('      } else if (preview === "chocs") {','      } else if (preview === "voiture") {\n        this.notified=false;\n        this.phase="free";\n        this.speed=80;\n      } else if (preview === "chocs") {');
fs.writeFileSync('src/main.ts',s);
let p=JSON.parse(fs.readFileSync('package.json'));p.version='0.21.0';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
for(const f of ['LIRE-MOI-LOCAL.txt','index.html']){fs.writeFileSync(f,fs.readFileSync(f,'utf8').replaceAll('0.20','0.21'));}
