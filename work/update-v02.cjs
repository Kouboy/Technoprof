const fs=require('fs');let s=fs.readFileSync('src/main.ts','utf8');
s=s.replace("phase='title';", "room=0; travel=0; arena=false; cleared=new Set<number>(); phase='title';");
s=s.replace("this.speed=0;this.road=0;", "this.speed=65;this.road=0;this.travel=0;this.arena=false;this.cleared.clear();");
let start=s.indexOf(' school(){'),end=s.indexOf(' finish(',start);
s=s.slice(0,start)+` school(){this.phase='school';this.age=0;this.room=0;this.enterRoom(0,25);}
 enterRoom(room:number,x:number){this.room=room;this.px=x;this.py=159;this.vy=0;this.cam=0;this.inv=.5;this.attack=0;this.arena=room===4;this.enemies=this.cleared.has(room)?[]:room===4?[{x:235,hp:5+this.mission,boss:true,cool:0,wind:0}]:room===1||room===3?[{x:210,hp:2,boss:false,cool:0,wind:0}]:[];}
 `+s.slice(end);
s=s.replace("this.phase=ok?'course':'fail'", "this.phase=ok?'opening':'fail'");
s=s.replace("else if(this.phase==='course'||this.phase==='fail'){if(this.age>2&&just('ENTER'))this.next();}","else if(this.phase==='opening'){if(this.age>1.2){this.phase='course';this.age=0;}} else if(this.phase==='course'){if(this.age>3.2)this.next();} else if(this.phase==='fail'){if(this.age>2&&just('ENTER'))this.next();}");
start=s.indexOf(" this.speed=Phaser.Math.Clamp");end=s.indexOf(" }else if(this.phase==='school')",start);
s=s.slice(0,start)+` const cruising=this.phase==='free';
 this.speed=Phaser.Math.Clamp(this.speed+(this.keys.UP.isDown?70:cruising?(65-this.speed)*2:-18)*dt-(this.keys.DOWN.isDown?130*dt:0),0,180);
 const bend=Math.sin(this.travel/430)*.75;this.car=Phaser.Math.Clamp(this.car+((this.keys.RIGHT.isDown?1:0)-(this.keys.LEFT.isDown?1:0))*dt*1.4-bend*(this.speed/180)**2*dt*.7,-1.15,1.15);if(Math.abs(this.car)>1)this.speed=Math.max(0,this.speed-100*dt);
 this.travel+=this.speed*dt;
 if(cruising&&this.age>8){this.phase='receive';this.age=0;this.road=0;this.obstacles=Array.from({length:22},(_,i)=>({z:220+i*150,x:[-.65,.25,.7,-.2][i%4],type:i%3}));}
 if(this.phase==='receive'||this.phase==='road'){this.remaining-=dt;this.road+=this.speed*dt;for(const o of this.obstacles){if(o.z>this.road-15&&o.z<this.road+15&&Math.abs(o.x-this.car)<(o.type===1?.3:.22)){this.speed*=.25;o.z=-100;this.cameras.main.shake(90,.004);}}if(this.phase==='receive'&&this.age>2){this.phase='road';this.age=0;}if(this.remaining<=0)this.finish(false);else if(this.road>=2200){this.phase='arrival';this.age=0;}}
 `+s.slice(end);
s=s.replace('this.px+dir*85*dt,10,960','this.px+dir*85*dt,10,302');
start=s.indexOf(' if(((this.px>365');end=s.indexOf(' }this.draw();}',start);
s=s.slice(0,start)+` if(this.room===1&&this.px>140&&this.px<166&&this.py===159&&this.inv===0){this.hurt();this.px=125;}
 if(this.enemies.every(e=>e.hp<=0))this.cleared.add(this.room);
 if(this.remaining<=0||this.hp<=0)this.finish(false);
 else if(this.room===4){if(this.cleared.has(4)&&this.px>268&&just('UP'))this.finish(true);}
 else if(this.room===0&&this.px>298)this.enterRoom(1,18);
 else if(this.room===1){if(this.px<12)this.enterRoom(0,290);else if(this.px>298)this.enterRoom(2,20);else if(Math.abs(this.px-80)<20&&just('UP'))this.enterRoom(5,45);}
 else if(this.room===2){if(this.px<12)this.enterRoom(1,290);else if(this.px>245&&just('UP'))this.enterRoom(3,25);}
 else if(this.room===3){if(this.px<35&&just('DOWN'))this.enterRoom(2,245);else if(this.px>298)this.enterRoom(4,25);}
 else if(this.room===5&&this.px<35&&just('DOWN'))this.enterRoom(1,80);
 `+s.slice(end);
s=s.replace("['school','course','fail']", "['school','opening','course','fail']");
s=s.replace("!['title','free'].includes(this.phase)","!['title','free','report'].includes(this.phase)");
start=s.indexOf("if(this.phase==='receive'){let h=");end=s.indexOf('\n this.txt(123',start);
s=s.slice(0,start)+`if(this.phase==='receive'){this.rect(88,193,18,29,0x677867);this.rect(91,196,12,24,0x263c34);this.rect(88,193+27*Math.min(1,this.age/2),18,2,0xe6be65);}}
 `+s.slice(end);
s=s.replace("`${Math.floor(Math.max(0,this.remaining)/60)}:${String(Math.floor(Math.max(0,this.remaining)%60)).padStart(2,'0')}`", "['title','free','report'].includes(this.phase)?'--:--':`${Math.floor(Math.max(0,this.remaining)/60)}:${String(Math.floor(Math.max(0,this.remaining)%60)).padStart(2,'0')}`");
s=s.replace("this.txt(211,213,`${Math.max(0,Math.ceil(1800-this.road))} M`,8);", "if(this.phase!=='free')this.txt(211,213,`${Math.max(0,Math.ceil(2200-this.road))} M`,8);");
start=s.indexOf("if(this.phase==='course'){this.banner");end=s.indexOf("if(this.phase==='fail')",start);
s=s.slice(0,start)+`if(this.phase==='opening'){this.g.fillStyle(0x000000,Math.min(1,this.age/1.2));this.g.fillRect(5,5,310,172);}if(this.phase==='course'){this.rect(5,5,310,172,0x000000);this.txt(61,78,'Bon. Reprenons.',17);this.txt(77,117,'UNE HEURE PLUS TARD',8);}`+s.slice(end);
start=s.indexOf(' drawRoad(){');end=s.indexOf(' drawSchool(){',start);
s=s.slice(0,start)+` drawRoad(){const sky=[0x7d9daa,0x9cb3a5,0x815762][this.mission];let horizon=76+Math.sin(this.travel/650)*14;this.rect(7,7,306,168,sky);this.rect(7,horizon,306,175-horizon,0x384a3c);const curve=Math.sin(this.travel/430)*70;
 const center=(p:number)=>160+curve*(1-p)**2;
 for(let y=Math.ceil(horizon);y<175;y++){let p=(y-horizon)/(175-horizon),half=9+p*145,c=center(p);this.rect(Math.max(7,c-half),y,Math.min(313,c+half)-Math.max(7,c-half),1,Math.floor(this.travel/35+p*18)%2?0x55565a:0x515256);if(Math.floor(p*20+this.travel/50)%3!==0)this.rect(c-1,y,2+p*3,1,0xb5b3a1);}
 const obs=this.phase==='free'?[]:this.obstacles;
 for(const o of [...obs].sort((a,b)=>b.z-a.z)){let d=o.z-this.road;if(d<0||d>900)continue;let p=(1-d/900)**2,y=horizon+p*(175-horizon),x=center(p)+o.x*(9+p*120),w=5+p*(o.type===1?30:19),h=5+p*24;this.rect(x-w/2,y-h,w,h,o.type===1?0xada884:0xa74943);this.rect(x-w/2+2,y-h+3,w-4,h*.25,0x273c48);this.rect(x-w/2,y-3,4,5,0x14171a);this.rect(x+w/2-4,y-3,4,5,0x14171a);}
 for(let i=0;i<5;i++)for(const side of [-1,1]){let p=((this.travel/700+i/5)%1),x=center(p)+side*(18+p*155),y=horizon+p*(175-horizon);if(x>9&&x<302){this.rect(x,y-18*p,3+4*p,18*p,0x242e25);this.rect(x-4*p,y-30*p,12*p,17*p,0x243b2d);}}
 let x=160+this.car*105;this.rect(x-17,148,34,19,0xb78048);this.rect(x-12,139,24,14,0xc49a62);this.rect(x-10,141,20,8,0x283e49);this.rect(x-18,160,5,9,0x11151b);this.rect(x+13,160,5,9,0x11151b);this.rect(x-13,158,7,3,0xe66053);this.rect(x+6,158,7,3,0xe66053);}
 `+s.slice(end);
start=s.indexOf(' drawSchool(){');end=s.indexOf('\n}\nnew Phaser',start);
s=s.slice(0,start)+` drawSchool(){this.rect(7,7,306,167,[0x646960,0x777366,0x42484a][this.mission]);
 if(this.room===0){this.rect(7,7,306,65,0x849a9c);for(let x=10;x<312;x+=25){this.rect(x,80,3,79,0x303d3c);this.rect(x,100,25,2,0x303d3c);}this.txt(160,64,'ENTREE C >',12);}
 else {for(let i=0;i<12;i++){let x=8+i*26;this.rect(x,30,1,129,0x404d48);this.rect(x+4,53+(i%3)*28,13,3,0x50574e);this.rect(x+9,110,7,26,0x48524a);}for(let x=45;x<300;x+=100)this.rect(x,31,48,3,0xb9bda0);}
 this.rect(7,160,306,15,0x343c38);
 const door=(x:number,n:string,open=false)=>{this.rect(x,85,30,74,0x242e30);this.rect(x+3,88,open?5:24,70,0x786e53);this.rect(x+5,91,20,11,0xcabb93);this.txt(x+6,93,n,7,'#222a28');};
 if(this.room===1){door(65,'12A');door(215,'18A');this.rect(140,159,26,16,0x10151a);this.txt(173,63,'ESCALIERS >',9);this.txt(39,113,'HAUT : ENTRER',7);}
 if(this.room===2){for(let i=0;i<10;i++)this.rect(125+i*14,150-i*7,14,9+i*7,0x77786b);this.txt(120,62,'ETAGE 1 / 40C-49C',9);this.txt(171,80,'HAUT : MONTER',8);}
 if(this.room===3){door(120,'40C');door(210,'41C');this.txt(200,60,'42C-49C >',10);this.txt(13,111,'BAS : RDC',7);}
 if(this.room===5){door(25,'12A');this.txt(70,62,'ANNEXE A / SALLES 10-19',9);this.txt(68,89,'BATIMENT C : PAR LE HALL',8);this.txt(13,118,'BAS : SORTIR',8);}
 if(this.room===4){door(270,'42C',this.phase==='opening');this.txt(88,40,this.cleared.has(4)?'ACCES LIBERE':'INSPECTEUR DE SERVICE',10);if(this.cleared.has(4))this.txt(130,64,'DEVANT LA PORTE : HAUT',8);}
 for(const e of this.enemies)if(e.hp>0){this.person(e.x,159,e.boss?0x8c4962:0x6d8559);if(e.wind>0)this.txt(e.x-3,119,'!',14,'#ffdc72');if(e.boss){this.rect(106,57,110,4,0x271c27);this.rect(106,57,e.hp*110/(5+this.mission),4,0xd8aa64);}}
 if(this.inv===0||Math.floor(this.inv*12)%2===0)this.person(this.px,this.py,0x9f855c,true);
 this.txt(12,12,['COUR / BATIMENT C','HALL / REZ-DE-CHAUSSEE','CAGE D\x27ESCALIER','ETAGE 1 / COULOIR C','SALLE 42C / ACCES','ANNEXE A'][this.room],9);}
 `+s.slice(end);
// Escape the apostrophe in generated room label.
s=s.replace("'CAGE D'ESCALIER'",'"CAGE D\'ESCALIER"');
fs.writeFileSync('src/main.ts',s);
