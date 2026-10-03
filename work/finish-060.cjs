const fs=require('fs');
function edit(p,f){fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));}
edit('src/missions.ts',s=>s.replace('  28:{role:"student",name:"ELEVE",lines:["Le labo, c’est tout au bout.","Si on vous laisse passer."]},\n',''));
edit('work/check-056.cjs',s=>s.replaceAll('mission-results-059','mission-results-060'));
edit('work/test-harness.cjs',s=>s.replace('missionEnemies,TRAFFIC','missionEnemies,DAY_LOAD,TRAFFIC'));
edit('src/main.ts',s=>s.replace('    if (name.startsWith("bruel") || name.startsWith("pro-")) {',`    const workloadRooms: Record<string, [number, number]> = {
      "bruel-workload": [1, 40],
      "bruel-workload-dialogue": [1, 44],
      "pro-workload": [2, 60],
      "pro-workload-dialogue": [2, 70],
      "pro-workload-end": [2, 88],
    };
    if (name in workloadRooms) {
      [this.mission] = workloadRooms[name];
      this.begin();
      this.notified = true;
      this.school();
      this.enterRoom(workloadRooms[name][1], 50);
      this.schoolFade = 0;
      this.session.record("scenario", this.mission, this.room, { name });
      this.draw();
      return;
    }
    if (name.startsWith("bruel") || name.startsWith("pro-")) {`));
edit('src/workshop.ts',s=>s.replace('  mission: "Première affectation / parcours complet",',`  "bruel-workload": "Midi / ailes supplémentaires",
  "bruel-workload-dialogue": "Midi / nouvelle rencontre",
  "pro-workload": "Crépuscule / ailes supplémentaires",
  "pro-workload-dialogue": "Crépuscule / nouvelle rencontre",
  "pro-workload-end": "Crépuscule / fin de parcours",
  mission: "Première affectation / parcours complet",`));
