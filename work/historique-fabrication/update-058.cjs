const fs=require('fs');
function edit(file,change){fs.writeFileSync(file,change(fs.readFileSync(file,'utf8')));}
for(const file of ['package.json','package-lock.json']) edit(file,s=>s.replaceAll('"version": "0.57.0"','"version": "0.58.0"'));
for(const file of ['src/session-log.ts','src/workshop.ts','index.html']) edit(file,s=>s.replaceAll('0.57','0.58'));
for(const file of ['work/test-harness.cjs','work/check.cjs']) edit(file,s=>s.replace('combat(){}','combat(){} enemyGesture(){}'));
edit('work/check-057.cjs',s=>s.replace("assert.equal(r.journal.version,'0.57')","assert.equal(r.journal.version,JSON.parse(fs.readFileSync('package.json')).version.split('.').slice(0,2).join('.'))"));
edit('work/resource-budget.cjs',s=>s.replace('resource-budget-057.json','resource-budget-058.json'));
edit('package.json',s=>s.replace('node work/check-057.cjs','node work/check-057.cjs && node work/check-058.cjs'));
