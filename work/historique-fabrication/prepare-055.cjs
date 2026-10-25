const fs = require('fs');
for (const file of ['package.json', 'package-lock.json', 'index.html', 'src/session-log.ts', 'src/workshop.ts', 'LIRE-MOI-TEST.txt', 'RETOURS-TEST.txt']) {
  let s = fs.readFileSync(file, 'utf8').replaceAll('0.54', '0.55');
  if (file === 'package.json') s = s.replace('node work/check-054.cjs"', 'node work/check-054.cjs && node work/check-055.cjs"');
  fs.writeFileSync(file, s);
}
// The VM loaders strip imports, so explicitly include the new pure layout module.
for (const file of ['work/test-harness.cjs', 'work/check.cjs', 'work/check-049.cjs', 'work/check-054.cjs']) {
  const backup = 'work/backup-0.54/' + file.split('/').pop();
  if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);
  const s = fs.readFileSync(file, 'utf8').replaceAll("['world',", "['world','passage-layout',");
  fs.writeFileSync(file, s);
}
const school = 'work/check-school.cjs';
if (!fs.existsSync('work/backup-0.54/check-school.cjs')) fs.copyFileSync(school, 'work/backup-0.54/check-school.cjs');
fs.writeFileSync(school, fs.readFileSync(school, 'utf8').replace("strip(fs.readFileSync('src/passage-hints.ts','utf8'))", "strip(fs.readFileSync('src/passage-layout.ts','utf8'))+'\\n'+strip(fs.readFileSync('src/passage-hints.ts','utf8'))"));
