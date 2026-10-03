const fs=require('fs');let s=fs.readFileSync('src/main.ts','utf8');s=s.replace(/const TUNING=.*?;\ntype Enemy=.*?;\n/,"import { TUNING, ROOM_NAMES, EXITS, makeEnemies, type Enemy } from './world';\nimport { AudioKit } from './audio';\n");
s=s.replace('g!:Phaser.GameObjects.Graphics;', 'audio=new AudioKit(); bossIntro=0;walkClock=0;stepClock=0;impact=0;impactX=0;attackHit=false;schoolFade=0;roomEnemies=new Map<number,Enemy[]>(); g!:Phaser.GameObjects.Graphics;');
s=s.replace("SPACE,X,ENTER,P'", "SPACE,X,ENTER,P,M,F2,F3,F4'");
s=s.replace("this.input.keyboard!.on('keydown',()=>{", "this.input.keyboard!.on('keydown',()=>{this.audio.unlock();");
s=s.replace('this.cleared.clear();', 'this.cleared.clear();this.roomEnemies.clear();');
s=s.replace("this.phase='school';this.age=0;", "this.phase='school';this.schoolFade=.7;this.age=0;");
let a=s.indexOf('this.enemies=this.cleared.has(room)?'),b=s.indexOf('\n  finish',a);
s=s.slice(0,a)+`this.bossIntro=room===4&&!this.cleared.has(4)?1.1:0;if(!this.roomEnemies.has(room))this.roomEnemies.set(room,makeEnemies(room,this.mission));this.enemies=this.roomEnemies.get(room)!;this.audio.tone(180,.06,.013,110);}
 `+s.slice(b);
s=s.replace("if(ok)this.won++;", "if(ok){this.won++;this.audio.tone(430,.22,.03,670);}");
s=s.replace("if(just('P')&&", "if(just('M'))this.audio.muted=!this.audio.muted;if(just('F2')){this.begin();this.notified=true;this.school();}if(just('F3')){this.begin();this.notified=true;this.school();this.enterRoom(4,80);}if(just('F4')){this.begin();this.notified=true;this.phase='arrival';this.parkSpeed=100;this.age=0;}this.audio.motor(this.speed,!this.paused&&['free','receive','road','arrival'].includes(this.phase));if(just('P')&&");
s=s.replace("this.notified=true;this.age=0;this.road=0;", "this.notified=true;this.audio.tone(700,.22,.025,1050);this.age=0;this.road=0;");
a=s.indexOf(' this.interactLock=Math.max'),b=s.indexOf(' if(this.room===1&&this.px>',a);
s=s.slice(0,a)+` this.schoolFade=Math.max(0,this.schoolFade-dt);this.bossIntro=Math.max(0,this.bossIntro-dt);this.impact=Math.max(0,this.impact-dt);this.interactLock=Math.max(0,this.interactLock-dt);this.remaining-=dt;this.inv=Math.max(0,this.inv-dt);
 if(this.bossIntro>0){this.draw();return;}
 this.attack=Math.max(0,this.attack-dt);const dir=(this.keys.RIGHT.isDown?1:0)-(this.keys.LEFT.isDown?1:0);if(dir&&this.attack===0)this.face=dir;this.px=Phaser.Math.Clamp(this.px+dir*(this.attack>0?34:85)*dt,10,302);
 if(dir&&this.py===159){this.walkClock+=dt*13;this.stepClock+=dt;if(this.stepClock>.27){this.stepClock=0;this.audio.tone(85,.025,.007,45);}}
 if(just('SPACE')&&this.py===159){this.vy=-220;this.audio.tone(220,.07,.012,330);}this.vy+=600*dt;this.py+=this.vy*dt;if(this.py>=159){this.py=159;this.vy=0;}
 if(just('X')&&this.attack===0){this.attack=.48;this.attackHit=false;this.audio.tone(180,.09,.015,85);}
 if(this.attack>0&&this.attack<=.34&&!this.attackHit){this.attackHit=true;for(const e of this.enemies){if(e.hp<=0||Math.abs(e.x-this.px)>44||(e.x-this.px)*this.face< -8||this.py<125)continue;if(e.boss&&e.recovery<=0&&e.stun<=0){this.audio.tone(800,.05,.02,450);this.impact=.10;this.impactX=e.x;continue;}e.hp--;e.stun=.22;e.x=Phaser.Math.Clamp(e.x+this.face*14,22,287);this.impact=.15;this.impactX=e.x;this.audio.tone(110,.1,.04,35);}}
 for(const e of this.enemies){if(e.hp<=0)continue;e.stun=Math.max(0,e.stun-dt);if(e.stun>0)continue;if(e.recovery>0){e.recovery-=dt;continue;}if(e.wind>0){e.wind-=dt;if(e.wind<=0){const range=e.boss&&e.pattern%2===0?90:38;if(Math.abs(this.px-e.x)<range&&this.py>130)this.hurt();e.recovery=e.boss?1.1:.6;this.audio.tone(e.boss?65:100,.12,.025,35);}continue;}e.cool-=dt;const d=this.px-e.x;if(Math.abs(d)>31)e.x=Phaser.Math.Clamp(e.x+Math.sign(d)*(e.boss?27:24)*dt,22,287);if(Math.abs(d)<(e.boss?95:35)&&e.cool<=0){e.pattern++;e.wind=e.boss?(e.pattern%2===0?.8:.55):.45;e.cool=1.1;}}
 `+s.slice(b);
s=s.replace("else if(this.room===3&&this.px>298)this.enterRoom(4,25);", "else if(this.room===3&&this.px>298)this.enterRoom(4,25);else if(this.room===6&&this.px>298)this.enterRoom(7,28);else if(this.room===7&&this.px<12)this.enterRoom(6,280);");
a=s.indexOf(' const targets:Record'),b=s.indexOf('  visualSpeed()',a);
s=s.slice(0,a)+` const targets=this.room===4?(this.cleared.has(4)?[{from:245,to:302,key:'UP',label:'HAUT : OUVRIR 42C',target:-1,spawn:0}]:[]):EXITS[this.room];return targets?.find(t=>this.px>=t.from&&this.px<=t.to);}
 `+s.slice(b);
s=s.replace('this.hp--;this.inv=1.2;', 'this.hp--;this.inv=1.2;this.audio.tone(130,.15,.025,45);');
a=s.indexOf(' person('),b=s.indexOf(' draw(){',a);
s=s.slice(0,a)+` person(x:number,y:number,c:number,book=false){
 const moving=book&&((this.phase==='school'&&(this.keys.LEFT.isDown||this.keys.RIGHT.isDown))||this.phase==='arrival');const step=moving?Math.sin(this.phase==='arrival'?this.age*13:this.walkClock)*3:0;
 this.rect(x-9,y-2,20,3,0x283431);this.rect(x-6,y-34,12,5,0x4a4036);this.rect(x-5,y-29,10,9,0xcfa784);this.rect(x-5,y-27,12,2,0x30383b);this.rect(x+5,y-26,2,3,0xcfa784);
 this.rect(x-8,y-20,16,14,c);this.rect(x-1,y-19,3,13,0xd5c9aa);this.rect(x,y-17,2,10,0x6b4540);this.rect(x-7+step,y-6,5,7,0x252d31);this.rect(x+2-step,y-6,5,7,0x252d31);this.rect(x-8+step,y,7,2,0x141b20);this.rect(x+1-step,y,7,2,0x141b20);
 if(book){const swing=this.attack>.34?-5:this.attack>.17?20:10;const bx=x+this.face*swing;this.rect(x-this.face*12-4,y-15,8,11,0x5b493d);this.rect(bx-7,y-24,14,17,0xa68142);this.rect(bx-5,y-22,10,13,0xe1d6ae);this.rect(bx-4,y-20,8,2,0x4b4c3b);this.rect(bx-3,y-17,6,1,0x777057);this.rect(x+this.face*7,y-15,Math.abs(swing-7)+3,4,0xcfa784);}}
 `+s.slice(b);
s=s.replace("this.txt(6,230,`SERVICES", "for(const x of [4,113,204,313]){this.rect(x,180,2,2,0x9ca995);this.rect(x,225,2,2,0x26342f);}this.txt(6,230,`SERVICES");
s=s.replace("if(this.paused)this.banner('PAUSE');", "if(this.phase==='school'&&this.bossIntro>0)this.banner('INSPECTION EN COURS');if(this.phase==='school'&&this.schoolFade>0)this.fadeViewport(this.schoolFade/.7);if(this.paused)this.banner('PAUSE');");
s=s.replace("this.txt(173,63,'ESCALIERS >',9);", "this.txt(165,63,'ESCALIER CENTRAL >',8);");
s=s.replace("this.txt(120,62,'ETAGE 1 / 40C-49C',9);", "for(let i=0;i<8;i++)this.rect(115+i*20,106-i*3,15,5,0xc4a951);this.txt(43,56,'ESCALIER CONDAMNE',13,'#eed09a');this.txt(30,78,'42C : ANNEXE > 2E > SERVICE > 1ER',8);this.txt(35,95,'< RETOUR AU HALL',9);");
s=s.replace("this.txt(70,62,'ANNEXE A / SALLES 10-19',9);this.txt(68,89,'BATIMENT C : PAR LE HALL',8);", "this.txt(65,61,'ACCES AILE C : PAR LE 2E',9);this.txt(170,86,'ESCALIER >',9);for(let i=0;i<6;i++)this.rect(204+i*14,151-i*8,14,8+i*8,0x777b6c);");
s=s.replace("for(const e of this.enemies)if(e.hp>0){", "if(this.room===6){this.txt(36,61,'PASSERELLE / 2E ETAGE',11);this.txt(137,85,'SERVICE : DESCENDRE >',8);for(let i=0;i<9;i++){this.rect(20+i*32,107,2,51,0x3e4e48);this.rect(20+i*32,108,30,2,0xa0a58b);}}if(this.room===7){this.txt(47,61,'ESCALIER DE SERVICE',11);this.txt(73,82,'42C : DESCENDRE AU 1ER',9);for(let i=0;i<8;i++)this.rect(165+i*15,104+i*7,15,55-i*7,0x747968);}\n for(const e of this.enemies)if(e.hp>0){");
s=s.replace("if(e.wind>0)this.txt(e.x-3,119,'!',14,'#ffdc72');", "if(e.boss&&e.recovery<=0){this.rect(e.x-13,139,12,15,0x4d5b68);this.rect(e.x-11,141,8,2,0xc8c6a8);}if(e.wind>0){this.txt(e.x-5,111,'!',14,'#ffdc72');if(e.boss)this.txt(72,78,e.pattern%2===0?'BALAYAGE : SAUTEZ':'TAMPON : RECULEZ',9,'#f0bc7b');}if(e.recovery>0&&e.boss)this.txt(107,78,'OUVERTURE !',10,'#bdd99b');");
s=s.replace('e.hp*110/(5+this.mission)','e.hp*110/(6+this.mission)');
s=s.replace("const hint=this.interaction();", "if(this.impact>0){this.rect(this.impactX-12,130,24,3,0xffe5a0);this.rect(this.impactX-2,120,3,23,0xffe5a0);this.txt(this.impactX-12,105,'PAF',9,'#ffe5a0');}const hint=this.interaction();");
a=s.indexOf("this.txt(12,12,['COUR"),b=s.indexOf(',9);}',a);s=s.slice(0,a)+"this.txt(12,12,ROOM_NAMES[this.room]"+s.slice(b);
// A few consistent signs of neglect, without obscuring traversable surfaces.
s=s.replace('this.rect(7,160,306,15,0x343c38);', "this.rect(7,160,306,15,0x343c38);for(let i=0;i<22;i++){this.rect(9+i*14,164,12,1,0x586359);}if(this.room!==0){this.rect(92,33,3,66,0x475a4c);this.rect(86,150,17,8,0x82968b);this.rect(83,157,25,2,0x748b80);this.rect(93,40+((this.age*34)%107),1,4,0xadc5b1);this.rect(13,53,39,24,0xb4aa8b);this.txt(16,57,'TRAVAUX',7,'#3d453c');this.txt(16,67,'PREVUS',7,'#3d453c');}");
fs.writeFileSync('src/main.ts',s);
