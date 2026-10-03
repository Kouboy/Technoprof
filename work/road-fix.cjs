const fs=require('fs');let s=fs.readFileSync('src/main.ts','utf8');
s=s.replace("const bend=Math.sin(this.travel/430)*.75;this.car=Phaser.Math.Clamp(this.car+((this.keys.RIGHT.isDown?1:0)-(this.keys.LEFT.isDown?1:0))*dt*1.4-bend*(this.speed/180)**2*dt*.7,-1.15,1.15);", "const steer=(this.keys.RIGHT.isDown?1:0)-(this.keys.LEFT.isDown?1:0);this.car=Phaser.Math.Clamp(this.car+steer*dt*(.45+Math.min(1,this.speed/100)*.85),-1.15,1.15);");
s=s.replace("if(this.phase==='arrival')this.banner('AFFECTATION NOTIFIEE');", "if(this.phase==='receive'){this.rect(41,13,238,16,0x111c1b);this.txt(48,17,'AFFECTATION NOTIFIEE',11,'#e6be65');}if(this.phase==='arrival')this.banner('ETABLISSEMENT ATTEINT');");
let a=s.indexOf(' drawRoad(){'),b=s.indexOf(' drawSchool(){',a);
s=s.slice(0,a)+` drawRoad(){
 const horizon=77+Math.sin(this.travel/950)*4, bottom=169;
 // One depth projection for road, markings, traffic and verges.
 const project=(d:number,lane=0)=>{const scale=100/(100+d);const bend=54*Math.sin((this.travel+d*.4)/650);return {x:160+bend*(1-scale)**2+lane*105*scale,y:horizon+(bottom-horizon)*scale,scale};};
 this.rect(7,7,306,168,[0x7d9daa,0x9cb3a5,0x815762][this.mission]);this.rect(7,horizon,306,175-horizon,0x384a3c);
 for(let y=Math.ceil(horizon+1);y<=175;y++){const scale=(Math.min(y,bottom)-horizon)/(bottom-horizon),d=100/scale-100,c=project(d).x,half=125*scale;const left=Math.max(7,c-half),right=Math.min(313,c+half);if(right>left)this.rect(left,y,right-left,1,Math.floor((this.travel+d)/65)%2?0x55565a:0x515256);for(const lane of [-1,1])this.rect(c+lane*half-1,y,Math.max(1,2*scale),1,0xc2bba4);if(Math.floor((this.travel+d)/55)%2===0)this.rect(c-scale,y,Math.max(1,2*scale),1,0xd1ccad);}
 const scenery=[];for(let i=0;i<12;i++){const d=1100-((this.travel+i*95)%1100);for(const lane of [-1.45,1.45])scenery.push({d,lane});}
 for(const t of scenery.sort((a,b)=>b.d-a.d)){const p=project(t.d,t.lane);if(p.x<10||p.x>304)continue;this.rect(p.x-2*p.scale,p.y-30*p.scale,4*p.scale,30*p.scale,0x292b23);this.rect(p.x-10*p.scale,p.y-52*p.scale,20*p.scale,30*p.scale,0x243b2d);}
 for(const o of [...(this.phase==='free'?[]:this.obstacles)].sort((a,b)=>b.z-a.z)){const d=o.z-this.road;if(d<0||d>1100)continue;const p=project(d,o.x),w=(o.type===1?36:28)*p.scale,h=(o.type===1?43:27)*p.scale;this.rect(p.x-w/2,p.y-h,w,h,o.type===1?0xada884:0xa74943);this.rect(p.x-w*.35,p.y-h*.85,w*.7,h*.28,0x273c48);this.rect(p.x-w/2,p.y-4*p.scale,5*p.scale,5*p.scale,0x14171a);this.rect(p.x+w/2-5*p.scale,p.y-4*p.scale,5*p.scale,5*p.scale,0x14171a);}
 const x=project(0,this.car).x;this.rect(x-17,148,34,19,0xb78048);this.rect(x-12,139,24,14,0xc49a62);this.rect(x-10,141,20,8,0x283e49);this.rect(x-18,160,5,9,0x11151b);this.rect(x+13,160,5,9,0x11151b);this.rect(x-13,158,7,3,0xe66053);this.rect(x+6,158,7,3,0xe66053);}
 `+s.slice(b);fs.writeFileSync('src/main.ts',s);
