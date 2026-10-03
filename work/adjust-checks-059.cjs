const fs=require('fs');
let p='work/check.cjs',s=fs.readFileSync(p,'utf8');
s=s.replace("edge(301,'RIGHT');assert.equal(g.room,4);","edge(301,'RIGHT');assert.equal(g.room,30);edge(301,'RIGHT');assert.equal(g.room,31);g.px=281;press('UP');assert.equal(g.room,32);edge(301,'RIGHT');assert.equal(g.room,4);");
s=s.replace("edge(299,'RIGHT');assert.equal(g.room,4);","edge(299,'RIGHT');assert.equal(g.room,30);");
s=s.replace('assert.equal(g.obstacles.length,5)','assert.equal(g.obstacles.length,12)').replace('assert.equal(g.obstacles.length,8)','assert.equal(g.obstacles.length,12)').replace('assert.equal(g.obstacles.length,11)','assert.equal(g.obstacles.length,12)').replace('progressive traffic: 5 / 8 / 11, first mission spaced','equal traffic queue capacity, first mission spaced; actual encounter progression checked in 059');
fs.writeFileSync(p,s);
p='work/check-058.cjs';s=fs.readFileSync(p,'utf8').replace("'setDisplaySize']","'setDisplaySize','setFlipX']");fs.writeFileSync(p,s);
