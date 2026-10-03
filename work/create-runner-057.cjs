const fs=require('fs');let s=fs.readFileSync('work/mission-runner.cjs','utf8');
s=s.replace('exports.runMission=','exports.runDay=').replace('g.mission===0','g.mission<3');
s=s.replace('api.dialogueLength(g.room,g.dialogue)','api.dialogueLength(g.room,g.dialogue,g.encounter())');
s=s.replace('if(e&&(g.room===3||g.room===6||g.room===4)){','if(e&&(g.roomSpec()?.role!=="parent")){');
s=s.replace('     if(g.room===4&&boss===\'read\'){',`     if(e.role==='influential'){
      if((e.chargeTime??0)>0){
        if(Math.abs(d)<58&&g.py===159)jump();
        if((g.px-e.x)*(e.chargeDir??-1)<0 && Math.abs(d)>60)walk(e.x-side*55);
      }else if(e.recovery>.2||e.stun>0){if(Math.abs(d)>61)walk(e.x-side*57);else if(g.py>=130)strike();}
      else if(!e.wind && Math.abs(d)>72)walk(e.x-side*65);
     }else if(e.role==='security'){
      if((g.px-e.x)*(e.facing??-1)<0 || e.recovery>.22 || e.stun>0){if(Math.abs(d)>50)walk(e.x-side*45);else if(g.py>=130)strike();}
      else if(e.wind>0&&e.wind<.4){if(g.py===159)jump(side);walk(e.x+side*38);}
      else if(g.py<159)walk(e.x+side*38);
      else if(Math.abs(d)>48)walk(e.x-side*44);
     }else if(g.room===4&&boss==='read'){`);
s=s.replace('}else if(g.room===4)exit(-1);','}else if(g.arena)exit(-1);');
s=s.replace("const next=path==='detour'?{0:1,1:5,5:6,6:7,7:3,3:4}:{0:1,1:2,2:8,8:3,3:4};", "const next=g.mission===0?(path==='detour'?{0:1,1:5,5:6,6:7,7:3,3:4}:{0:1,1:2,2:8,8:3,3:4}):g.mission===1?(path==='detour'?{10:11,11:12,12:13,13:14}:{10:11,11:15,15:13,13:14}):(path==='detour'?{20:21,21:22,22:24}:{20:21,21:25,25:23,23:24});");
s=s.replace('const gap=g.room===1?[140,166]:g.room===8?(g.px<150?[95,128]:[190,223]):null;', 'const gap=g.floorGaps().find(([l,r])=>g.px<r);');
s=s.replace('fps*500','fps*1500').replace('courseWait>1','courseWait>1');
s=s.replace('outcome:g.results[0]??g.phase','outcome:g.results.join(" / ")||g.phase');
s=s.replace('g.botTarget=probe.botTarget;','g.botTarget=probe.botTarget;');
s=s.replace('nextRemaining:g.remaining,','nextRemaining:g.remaining,results:g.results,');
s=s.replace('exports.runMission({mode,path})','exports.runDay({mode,path})');
fs.writeFileSync('work/day-runner-057.cjs',s);
