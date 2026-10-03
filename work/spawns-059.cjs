const fs=require('fs');
let p='src/missions.ts',s=fs.readFileSync(p,'utf8');
const a=s.indexOf('const extendWing ='),b=s.indexOf('extendWing(collegeRooms',a);
let wing=s.slice(a,b).replace('spawn: 22','spawn: 45').replace('first + 1, 24','first + 1, 45').replace('first + 2, 24','first + 2, 45');
fs.writeFileSync(p,s.slice(0,a)+wing+s.slice(b));
for(const p of ['work/check-054.cjs','work/check-055.cjs']){
 let s=fs.readFileSync(p,'utf8').replace("[3,299,'RIGHT',30,22]","[3,299,'RIGHT',30,45]").replace('target:30,spawn:22','target:30,spawn:45');fs.writeFileSync(p,s);
}
