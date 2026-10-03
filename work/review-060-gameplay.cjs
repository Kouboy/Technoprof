const fs=require('fs'),Module=require('module'),path=require('path');
const original=fs.readFileSync(path.join(__dirname,'day-runner-057.cjs'),'utf8');
function variant(kind){
 let src=original;
 if(kind==='evade') {
  src=src.replace('if(e&&(g.roomSpec()?.role!=="parent"))','if(e&&g.arena)');
  src=src.replace('if(gap&&g.px>=gap[0]-18', 'if(e&&!g.arena&&e.x-g.px>0&&e.x-g.px<70&&g.py===159)jump(1);\n     else if(gap&&g.px>=gap[0]-18');
 }
 if(kind==='hesitate') {
  src=src.replace('elapsed=0,notificationClock', 'elapsed=0,orientationWait=0,notificationClock');
  src=src.replace('lastRoom=g.room;dialogueWait=0;', 'lastRoom=g.room;dialogueWait=0;orientationWait=1;');
  src=src.replace('else if(g.falling||g.playerRecovery||g.hitStop){}', 'else if(orientationWait>0){orientationWait-=dt;}\n   else if(g.falling||g.playerRecovery||g.hitStop){}');
 }
 const m=new Module(path.join(__dirname,'review-060-'+kind+'.cjs'),module);
 m.filename=path.join(__dirname,'review-060-'+kind+'.cjs');m.paths=module.paths;m._compile(src,m.filename);return m.exports.runDay;
}
const cases=[];
for(const strategy of ['reference','evade','hesitate'])for(const control of ['keyboard','direct'])for(const branch of ['detour','shortcut']) {
 const r=variant(strategy)({seed:4301,mode:control,path:branch});
 const events=r.journal.events;
 const byMission=[1,2,3].map(m=>({mission:m,timing:r.journal.missionTiming[m],rooms:events.filter(e=>e.mission===m&&e.kind==='room').map(e=>e.room),attacks:events.filter(e=>e.mission===m&&e.kind==='attack').length,contacts:events.filter(e=>e.mission===m&&e.kind==='contact').length,hurt:events.filter(e=>e.mission===m&&e.kind==='hurt').length,passes:events.filter(e=>e.mission===m&&['pass','near-pass'].includes(e.kind)).length,result:events.find(e=>e.mission===m&&['success','failure'].includes(e.kind))}));
 cases.push({strategy,control,branch,outcome:r.results,elapsed:r.elapsed,end:r.end,byMission});
}
fs.writeFileSync(path.join(__dirname,'review-060-gameplay-results.json'),JSON.stringify({method:'Input-only full-day runner independently re-executed. evade ignores non-boss attacks and jumps when approaching an actor. hesitate adds one second of no input after each introduction/entry. No gameplay state writes beyond deterministic initial setup.',cases},null,2));
for(const r of cases) console.log(JSON.stringify({...r,byMission:r.byMission.map(m=>({...m,timing:m.timing,rooms:m.rooms.length,result:m.result?.data}))}));
