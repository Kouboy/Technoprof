const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/session-log.ts',s=>s.replace('version: "0.56"','version: "0.57"'));
edit('src/player-experience.ts',s=>s.replace('12:00 — Lycée Patrick Bruel. Trafic plus dense et délai réduit.','12:00 — Deuxième service. Trafic plus dense et délai réduit.').replace('17:00 — Lycée professionnel Tibo InShape. Dernier service ; la voiture conserve ses dégâts.','17:00 — Dernier service. La voiture conserve ses dégâts ; le trafic se resserre.'));
edit('RETOURS-TEST.txt',s=>s.replace("4. Comment avez-vous essayé de passer l'inspection ?","4. Comment avez-vous essayé de passer chacun des boss rencontrés ?").replace('7. Avec la souris','7. Les trois lieux vous ont-ils paru différents ? Comment ?\n\n8. Avec la souris'));
edit('work/check-057.cjs',s=>s.replace('  const events=r.journal.events, wins=','  assert.equal(r.journal.version,\'0.57\');\n  const events=r.journal.events, wins='));
