const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/main.ts',s=>s.replace('      this.room,\n      this.encounterTime > 0 || this.schoolFade > 0 || !!this.roomTransition,','      this.roomSpec()?.frame===0 ? 0 : this.room,\n      this.encounterTime > 0 || this.schoolFade > 0 || !!this.roomTransition,').replaceAll('technoprof-056-essai','technoprof-057-essai'));
for(const p of ['src/workshop.ts','index.html'])edit(p,s=>s.replaceAll('0.56','0.57'));
edit('package.json',s=>s.replace('0.56.0','0.57.0').replace('node work/check-056.cjs"','node work/check-056.cjs && node work/check-057.cjs"'));
edit('package-lock.json',s=>s.replaceAll('"version": "0.56.0"','"version": "0.57.0"'));
