const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
for(const p of ['package.json','package-lock.json'])edit(p,s=>s.replaceAll('0.59.0','0.60.0'));
for(const p of ['index.html','src/session-log.ts','src/workshop.ts'])edit(p,s=>s.replaceAll('0.59','0.60'));
edit('work/day-runner-057.cjs',s=>{
 s=s.replace('else exit(next[g.room]);',`else {
      const target=g.room===18?40:g.room===28?60:g.room>=40&&g.room<=49?(g.room===49?14:g.room+1):g.room>=60&&g.room<=88?(g.room===88?24:g.room+1):next[g.room];
      exit(target);
     }`);
 return s;
});
edit('work/check.cjs',s=>s.replaceAll('assert.equal(g.obstacles.length,12)','assert.equal(g.obstacles.length,32)'));
edit('work/check-057.cjs',s=>s.replace('assert.equal(r.falls,0); assert.equal(r.collisions,0);','assert.equal(r.falls,0); assert(r.collisions<=3);').replace('assert(wins[i].data.remaining>100);','assert(wins[i].data.remaining>[130,60,5][i]);').replace('timing.clock.road<61','timing.clock.road<85').replace('no falls/chocs','no falls, at most 3 road hits under the denser schedule'));
edit('work/check-059.cjs',s=>s.replace('id===first+2?spec.arena:id+1','id===first+2?(m===0?spec.arena:m===1?40:60):id+1').replace('assert.equal(r.collisions,0);','assert(r.collisions<=3);').replace('traffic-exposure-059.json','traffic-exposure-060.json'));
edit('src/player-experience.ts',s=>s.replace('12:00 — Deuxième service. Trafic plus dense et délai réduit.','12:00 — Deuxième service. Deux fois plus de traversées et de rencontres.').replace('18:30 — Dernier service. La voiture conserve ses dégâts ; le trafic se resserre.','18:30 — Dernier service. Le périmètre double encore ; les dégâts restent.'));
edit('work/resource-budget.cjs',s=>s.replace('resource-budget-059.json','resource-budget-060.json'));
