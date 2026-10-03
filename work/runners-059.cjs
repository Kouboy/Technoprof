const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('work/check-055.cjs',s=>s.replace('assert.equal(g.room,4)','assert.equal(g.room,30)'));
fs.copyFileSync('work/mission-runner.cjs','work/backup-0.58/mission-runner.cjs');
edit('work/mission-runner.cjs',s=>s.replaceAll('3:4','3:30,30:31,31:32,32:4'));
edit('work/check-056.cjs',s=>s.replaceAll('7,3,4','7,3,30,31,32,4').replaceAll('8,3,4','8,3,30,31,32,4').replace('r.remaining>145','r.remaining>130').replaceAll('mission-results-056','mission-results-059'));
edit('work/resource-budget.cjs',s=>s.replaceAll('resource-budget-058','resource-budget-059'));
