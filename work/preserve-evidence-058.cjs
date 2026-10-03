// Preserve the previous evidence independently of future regression runs.
// Replay the original 0.57 source snapshot; never relabel a current-run journal.
const fs=require('fs'),path=require('path');
fs.copyFileSync('work/day-results-057.json','work/day-results-058.json');
const originalRead=fs.readFileSync;
fs.readFileSync=function(file,...rest){
 const p=String(file).replaceAll('\\','/');
 if(p.startsWith('src/')||p==='package.json') return originalRead.call(fs,path.join('work/backup-0.57',p),...rest);
 return originalRead.call(fs,file,...rest);
};
require('./check-057.cjs');
