const fs=require('fs'),Module=require('module'),path=require('path');
let src=fs.readFileSync(__dirname+'/day-runner-057.cjs','utf8');
src=src.replace('const dt=1/fps, rooms=[]','const overlaps=[],previousHit=new WeakMap(),states={},dt=1/fps, rooms=[]');
src=src.replace('step(1000/fps);elapsed+=dt;',`step(1000/fps);elapsed+=dt;
for(const o of g.obstacles){if(o.hit&&o.sounded&&!previousHit.get(o))overlaps.push({mission:g.mission+1,elapsed,lane:o.x,type:o.type,distance:o.z-g.travel});previousHit.set(o,o.hit);}
if(g.phase==='school'&&!g.encounterTime&&g.enemies[0]){const e=g.enemies[0],s=states[g.mission+':'+g.room]??={role:e.role,hpAtEntry:e.hp,secondsAlive:0,sawWind:false,sawStrike:false,hpAtEnd:e.hp};if(e.hp>0)s.secondsAlive+=dt;s.sawWind||=e.wind>0;s.sawStrike||=(e.strikeTime??0)>0;s.hpAtEnd=e.hp;}`);
src=src.replace('return {seed,fps,mode,path,driveStyle,','return {overlaps,states,seed,fps,mode,path,driveStyle,');
const m=new Module(__dirname+'/review-060-instrument.cjs',module);m.filename=__dirname+'/review-060-instrument.cjs';m.paths=module.paths;m._compile(src,m.filename);
const reports=[];
for(const mode of ['keyboard','direct'])for(const branch of ['detour','shortcut']){
const r=m.exports.runDay({mode,path:branch});reports.push({mode,branch,overlaps:r.overlaps,states:r.states});}
fs.writeFileSync(__dirname+'/review-060-reference-results.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
