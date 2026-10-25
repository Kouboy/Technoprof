const fs=require('fs');
let s=fs.readFileSync('work/package-059.ps1','utf8').replaceAll('0.59','0.60').replace('43..59','43..60').replace('33 } else','34 } else');
s=s.replace('$hash = (Get-FileHash',`$recent = (Get-FileHash -LiteralPath 'Jouer-Technoprof-0.59.html' -Algorithm SHA256).Hash
if ($recent -ne '21486F80BFB19166CFB2D31AEA859EF37C9E23B8AC098EEE49EFF3555B183744') { throw '0.59 baseline changed' }
$hash = (Get-FileHash`);
s=s.replace('traffic progression, nine quiet rooms, decay and morning/noon/twilight.','exponential workload: minimum rooms 9/18/36, encounters 3/6/12, actual traffic about 10/20/40.');
s=s.replace('21 scripts','22 scripts').replace('plus 6 exposure runs','plus 6 exposure and 4 progression runs');
s=s.replace('Measured passing exposure: 10 / 12 / 18 on the continuous simulated days; same queue capacity, progressively shorter spacing, no notification respawn.','Measured passing exposure: about 10 / 20-22 / 35-40 in continuous reference days; two clean anticipatory third-road runs reach 42. No notification respawn.');
s=s.replace('Compiled browser observed via localhost: three classes and lighting periods, route at twilight, hall passage. Not standalone file:// or phone validation.','Compiled browser observed via localhost: new Bruel encounter, reveal/confirm without attack, twilight corridor 60 -> classroom 61 through direct input, frozen speech clock, no browser errors. Not file:// or physical-phone validation.');
s=s.replace('"0.58 unchanged: $previous",','"0.59 unchanged: $recent",\n "0.58 unchanged: $previous",');
fs.writeFileSync('work/package-060.ps1',s);
const r=JSON.parse(fs.readFileSync('work/day-results-060.json')).reports;
const values=r.flatMap(x=>x.journal.events.filter(e=>e.kind==='success').map(e=>({m:e.mission,...e.data})));
console.log({fullDays:r.length,maxHits:Math.max(...r.map(x=>x.collisions)),byMission:[1,2,3].map(m=>{const a=values.filter(e=>e.m===m);return {mission:m,remaining:[Math.min(...a.map(e=>e.remaining)),Math.max(...a.map(e=>e.remaining))],minVehicle:Math.min(...a.map(e=>e.vehicle)),minHP:Math.min(...a.map(e=>e.hp))};})});
