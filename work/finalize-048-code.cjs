const fs=require('fs');
const edit=(f,fn)=>fs.writeFileSync(f,fn(fs.readFileSync(f,'utf8')));
edit('src/main.ts',s=>s.replace(/          \/\/ The player's deliberate contact ends[\s\S]*?\n          if \(e.boss/, '          if (e.boss')
 .replace('        // Presentation suppresses aggression only; collision and reactions stay active.\n        if (!e.boss && this.encounterTime > 0) continue;\n','')
 .replace('(this.phase === "school" &&\n          (this.keys.LEFT','(this.phase === "school" && !this.encounterTime &&\n          (this.keys.LEFT')
 .replace(': !!enemy &&\n        enemy.wind',': !!enemy && !this.encounterTime &&\n        enemy.wind')
 .replace('this.obstacles = [{ z: 160, x: 0, type: 1, speed: 62 }];','this.obstacles = [{ z: 160 * DRIVE.motionScale, x: 0, type: 1, speed: 62 }];')
 .replace('      boss: 4,','      boss: 4,\n      sweep: 4,')
 .replace('["whiff", "hit", "block", "hurt", "success", "exhausted"].includes(', '["whiff", "hit", "block", "hurt", "success", "exhausted", "sweep"].includes(')
 .replace('      if (name === "late")', '      if (name === "sweep") {\n        this.px = 150;\n        this.enemies[0].x = 220;\n        this.enemies[0].pattern = 2;\n        this.enemies[0].wind = BOSS.sweepWind;\n        this.enemies[0].facing = -1;\n      }\n      if (name === "late")')
 .replace('e.strikeTime = view === "inspectrice-recul" ? 0 : 0.12;', 'e.strikeTime = view === "inspectrice-recul" ? 0 : view === "inspectrice-pied" ? BOSS.sweepPose : BOSS.stampPose;')
 );
edit('src/workshop.ts',s=>s.replace('  boss: "Inspectrice / confrontation",','  boss: "Inspectrice / confrontation",\n  sweep: "Inspectrice / balayage",').replace('Frapper (X)','Action / dialogue (X)'));
edit('src/player-experience.ts',s=>s.replace('["Dans le collège", "← → marcher · ESPACE sauter · X frapper au livre"],','["Dans le collège", "← → marcher · ESPACE sauter · X frapper au livre"],\n      ["Pendant un dialogue", "X afficher la réplique · X suivant · délai suspendu"],'));
edit('index.html',s=>s.replace('X : bouquin','X : action / dialogue'));
for(const f of ['src/workshop.ts','src/session-log.ts','index.html'])edit(f,s=>s.replaceAll('0.47','0.48'));
for(const f of ['package.json','package-lock.json'])edit(f,s=>s.replaceAll('"version": "0.47.0"','"version": "0.48.0"'));
edit('work/check-043.cjs',s=>{
 const end=s.indexOf('\n{\n const {g,advance,press}');
 return `const assert=require('assert');
const {createGame}=require('./test-harness.cjs');
const contact=(room,art)=>{
 const {g,advance,press}=createGame();g.begin();g.school();g.schoolFade=0;g.enterRoom(room,175);
 if(art)g.art={};const e=g.enemies[0];e.x=215;g.face=1;
 const before=[g.px,g.py,g.remaining,e.x,e.hp];
 g.keys.RIGHT.isDown=true;advance(.3);g.keys.RIGHT.isDown=false;
 assert.deepEqual([g.px,g.py,g.remaining,e.x,e.hp],before);assert.equal(e.wind,0);
 press('X');assert(g.encounterTime>0);press('X');press('X');press('X');
 assert.equal(g.encounterTime,0);assert.equal(g.attack,0);assert.equal(e.hp,before[4]);
 press('X');advance(.2);assert.equal(e.hp,room===1?2:1);
 return [e.hp,g.px,g.py,g.remaining,g.punches];
};
for(const room of [1,3,6])assert.deepEqual(contact(room,false),contact(room,true));
console.log('PASS locked conversation, reveal then advance, no accidental attack, identical rules with/without art');
`+s.slice(end).replace('g.enterRoom(6,300);g.py','g.enterRoom(6,300);g.encounterTime=0;g.py');
});
edit('work/check.cjs',s=>s.replace('const press=k=>{step(18);', 'const acknowledge=()=>{for(let i=0;g.encounterTime>0&&i<50;i++){g.keys.X.just=true;step(1);}assert.equal(g.encounterTime,0);};const press=k=>{acknowledge();step(18);')
 .replace('g.keys[k].just=true;step(1);};','g.keys[k].just=true;step(1);acknowledge();};')
 .replaceAll('g.bossIntro=0;', 'g.bossIntro=0;g.encounterTime=0;')
 .replace('function walkTo(x){const startRoom', 'function walkTo(x){acknowledge();const startRoom')
 .replace('// Wait out intro, dodge', 'acknowledge();\n// Finish dialogue, dodge')
 );
edit('work/check-school.cjs',s=>s.replace('smaller dialogue lettering and two 4.5-second pages','smaller dialogue lettering and legacy static page previews'));
edit('package.json',s=>s.replace('node work/check-047.cjs"', 'node work/check-047.cjs && node work/check-048.cjs"'));
