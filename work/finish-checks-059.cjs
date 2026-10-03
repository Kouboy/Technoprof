const fs=require('fs');let p='work/check.cjs',s=fs.readFileSync(p,'utf8');
// The held-input navigation exercise now continues through the new wing.
s=s.replace("walkTo(301);g.keys.RIGHT.isDown=true;step(10);g.keys.RIGHT.isDown=false;settle();assert.equal(g.room,4);", "walkTo(301);g.keys.RIGHT.isDown=true;step(10);g.keys.RIGHT.isDown=false;settle();assert.equal(g.room,30);edge(301,'RIGHT');g.px=281;press('UP');edge(301,'RIGHT');assert.equal(g.room,4);");
s=s.replace("walkTo(301);assert.equal(g.room,4);", "walkTo(301);assert.equal(g.room,30);walkTo(301);assert.equal(g.room,31);walkTo(281);press('UP');assert.equal(g.room,32);walkTo(301);assert.equal(g.room,4);");
fs.writeFileSync(p,s);
p='work/check-054.cjs';s=fs.readFileSync(p,'utf8').replace("[3,299,'RIGHT',4,42]","[3,299,'RIGHT',30,22]");fs.writeFileSync(p,s);
