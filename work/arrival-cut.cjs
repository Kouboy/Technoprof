const fs=require('fs');let s=fs.readFileSync('src/main.ts','utf8');let a=s.indexOf("else if(this.phase==='arrival'){"),b=s.indexOf("else if(this.phase==='arrivalFade')",a);s=s.slice(0,a)+"else if(this.phase==='arrival'){this.speed=this.parkSpeed*(1-Math.min(1,this.age/1.8));if(this.age>5.8){this.phase='arrivalFade';this.age=0;}}"+s.slice(b);
s=s.replace("['road','free','receive','arrival','arrivalFade'].includes(this.phase))this.drawRoad();", "['road','free','receive'].includes(this.phase))this.drawRoad();else if(['arrival','arrivalFade'].includes(this.phase))this.drawArrival();");
a=s.indexOf(" if(['arrival','arrivalFade'].includes(this.phase)){this.rect(214");b=s.indexOf('\n const x=project',a);s=s.slice(0,a)+s.slice(b);
a=s.indexOf('  drawSchool(){');s=s.slice(0,a)+` drawArrival(){
 const t=this.phase==='arrivalFade'?5.8:this.age;
 this.rect(7,7,306,168,[0x859ea6,0xa7b2a0,0x755b69][this.mission]);
 this.rect(87,35,216,76,0x898674);this.rect(83,31,224,6,0x414c47);
 for(let row=0;row<2;row++)for(let col=0;col<8;col++){const x=95+col*25,y=44+row*29;this.rect(x,y,15,20,0x354b50);this.rect(x+6,y,2,20,0x6c7c76);}
 this.rect(119,85,177,15,0xc6b99b);this.txt(125,89,'COLLEGE SAINT-HANOUNA',9,'#313d37');
 this.rect(7,110,306,30,0x65716a);this.rect(7,140,306,35,0x454b4e);this.rect(7,138,306,3,0xb5af98);
 for(let x=10;x<310;x+=39)this.rect(x,164,20,2,0xbcbba4);
 // The vehicle decelerates into a fixed parking place in this side-on shot.
 const p=Math.min(1,t/1.8),carX=18+93*(1-(1-p)**3);
 this.rect(carX-32,132,66,18,0xb98149);this.rect(carX-18,121,36,14,0xc89961);this.rect(carX-14,123,27,9,0x314954);this.rect(carX-26,145,12,10,0x182023);this.rect(carX+17,145,12,10,0x182023);this.rect(carX-22,148,5,4,0x77817a);this.rect(carX+21,148,5,4,0x77817a);
 if(t>1.9&&t<2.8){this.rect(carX+2,131,21,18,0xdbc094);this.rect(carX+4,133,16,7,0x354d55);}
 // Exit with the book, walk to the opening, then recede into the courtyard.
 if(t>2.25){const walk=Math.min(1,(t-2.25)/2.35),x=carX+13+(239-carX-13)*walk,depth=Math.max(0,Math.min(1,(t-4.6)/1.2));const y=145-depth*27;this.person(x,y,0x9f855c,true);if(walk<1){this.rect(x-6+Math.sin(t*15)*2,y-3,4,5,0x191c23);}}
 const gateOpen=t>3.8;
 for(let x=12;x<312;x+=10){if(x>218&&x<258)continue;this.rect(x,101,2,37,0x293e39);}this.rect(7,107,211,2,0x293e39);this.rect(260,107,53,2,0x293e39);
 this.rect(214,95,6,45,0x424f45);this.rect(259,95,6,45,0x424f45);
 if(!gateOpen){for(let x=223;x<256;x+=8)this.rect(x,102,2,35,0x293e39);this.rect(220,109,39,2,0x293e39);}else {this.rect(218,101,6,36,0x293e39);this.rect(255,101,5,36,0x293e39);}
 }
 `+s.slice(a);fs.writeFileSync('src/main.ts',s);
