const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/new-school-art.ts',s=>s.replace('r.frame===0?.13:.225','r.frame===0?.18:.225'));
edit('src/main.ts',s=>s.replace('      if(name.endsWith("drive"))','      if(name.endsWith("arrival")){this.phase="arrival";this.notified=true;this.age=0;this.parkSpeed=100;this.session.record("scenario",this.mission,this.room,{name});this.draw();return;}\n      if(name.endsWith("drive"))'));
edit('src/workshop.ts',s=>s.replace('  "bruel-boss":','  "bruel-arrival": "Bruel / arrivée",\n  "pro-arrival": "Lycée pro / arrivée",\n  "bruel-boss":'));
