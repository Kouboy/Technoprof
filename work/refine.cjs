const fs=require('fs');let s=fs.readFileSync('src/main.ts','utf8');
s=s.replace("room=0; travel=0;", "interactLock=0; trafficHit=0; room=0; travel=0;");
s=s.replace("this.speed=65", "this.speed=40");
s=s.replace("this.travel=0;this.arena", "this.travel=0;this.trafficHit=0;this.arena");
s=s.replace('this.room=room;this.px=x;', 'this.room=room;this.interactLock=.35;this.px=x;');
s=s.replace("this.speed=Phaser.Math.Clamp(this.speed+(this.keys.UP.isDown?70:cruising?(65-this.speed)*2:-18)*dt-(this.keys.DOWN.isDown?130*dt:0),0,180);", "const throttle=this.keys.UP.isDown,brake=this.keys.DOWN.isDown;const acceleration=brake?-95:throttle?45*(1-this.speed/230):-1.5-this.speed*.012;this.speed=Phaser.Math.Clamp(this.speed+acceleration*dt,0,180);");
s=s.replace("this.travel+=this.speed*dt;", `this.trafficHit=Math.max(0,this.trafficHit-dt);this.travel+=this.speed*dt;
 for(const o of this.obstacles){const previous=o.z-this.travel+this.speed*dt;o.z+=(o.type===1?20:32)*dt;const distance=o.z-this.travel;if(this.trafficHit===0&&Math.min(previous,distance)<12&&Math.max(previous,distance)>-12&&Math.abs(o.x-this.car)<(o.type===1?.3:.24)){this.speed*=.55;this.trafficHit=1.2;this.cameras.main.shake(80,.003);}if(distance < -90 || distance>3400)o.z=this.travel+2400+(o.type*180);}
 `);
s=s.replace("this.road=0;this.obstacles=Array.from({length:22},(_,i)=>({z:220+i*150,x:[-.65,.25,.7,-.2][i%4],type:i%3}));", "this.road=0;");
const a=s.indexOf('for(const o of this.obstacles){if(o.z>this.road'),b=s.indexOf("if(this.phase==='receive'&&",a);if(a<0||b<0)throw Error('traffic match');s=s.slice(0,a)+s.slice(b);
s=s.replace("[...(this.phase==='free'?[]:this.obstacles)]", "[...this.obstacles]").replace('const d=o.z-this.road;', 'const d=o.z-this.travel;');
s=s.replace('const horizon=77+Math.sin(this.travel/950)*4', 'const horizon=67+Math.sin(this.travel/950)*3');
s=s.replace('this.remaining-=dt;this.inv=', 'this.interactLock=Math.max(0,this.interactLock-dt);this.remaining-=dt;this.inv=');
const c=s.indexOf(" else if(this.room===4){"),d=s.indexOf('  }this.draw();}',c);
s=s.slice(0,c)+` else {const action=this.interaction();if(action&&this.interactLock===0&&this.py===159&&(this.keys[action.key].isDown||just(action.key))){if(action.target===-1)this.finish(true);else this.enterRoom(action.target,action.spawn);}
 else if(this.room===0&&this.px>298)this.enterRoom(1,18);
 else if(this.room===1){if(this.px<12)this.enterRoom(0,290);else if(this.px>298)this.enterRoom(2,20);}
 else if(this.room===2&&this.px<12)this.enterRoom(1,290);
 else if(this.room===3&&this.px>298)this.enterRoom(4,25);}
 `+s.slice(d);
const m=s.indexOf(' hurt(){');s=s.slice(0,m)+` interaction(){
 const targets:Record<number,{from:number,to:number,key:string,label:string,target:number,spawn:number}[]>={
 1:[{from:48,to:112,key:'UP',label:'HAUT : ENTRER 12A',target:5,spawn:50}],
 2:[{from:112,to:295,key:'UP',label:'HAUT : MONTER AU 1ER',target:3,spawn:28}],
 3:[{from:10,to:70,key:'DOWN',label:'BAS : DESCENDRE',target:2,spawn:130}],
 5:[{from:10,to:80,key:'DOWN',label:'BAS : REVENIR AU HALL',target:1,spawn:80}],
 4:this.cleared.has(4)?[{from:245,to:302,key:'UP',label:'HAUT : OUVRIR 42C',target:-1,spawn:0}]:[]};
 return targets[this.room]?.find(t=>this.px>=t.from&&this.px<=t.to);}
 `+s.slice(m);
// Contextual prompts use exactly the interaction bounds.
s=s.replace("this.txt(12,12,['COUR", "const hint=this.interaction();if(hint&&this.phase==='school'){this.rect(42,139,236,16,0x142924);this.txt(49,143,hint.label,9,'#f0d287');}\n this.txt(12,12,['COUR");
s=s.replace("this.txt(39,113,'HAUT : ENTRER',7);",'');s=s.replace("this.txt(171,80,'HAUT : MONTER',8);",'');s=s.replace("this.txt(13,111,'BAS : RDC',7);", "this.rect(16,91,28,65,0x293938);this.txt(18,105,'RDC',8);");s=s.replace("this.txt(13,118,'BAS : SORTIR',8);",'');
// Suppress damage-free punching through the boss edge.
s=s.replace('e.x+=this.face*13;', 'e.x=Phaser.Math.Clamp(e.x+this.face*13,22,287);');
// Speed bar makes coasting and acceleration perceptible.
s=s.replace("this.txt(211,198,`${Math.round(this.speed)} KM/H`,12);", "this.txt(211,198,`${Math.round(this.speed)} KM/H`,12);this.rect(211,221,99,2,0x35463e);this.rect(211,221,this.speed/180*99,2,0xe6be65);");
fs.writeFileSync('src/main.ts',s);
