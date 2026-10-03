// A design experiment, deliberately separate from the running workshop.
const fs=require('node:fs');
const path=require('node:path');
const file=name=>path.join(__dirname,name);
const d=JSON.parse(fs.readFileSync(file('bruel-navigation-design.json'),'utf8'));
const z=id=>d.zones.find(z=>z.id==='bruel-'+id);
const exit=(target,x,spawn,kind,sign,stairs=false)=>({to:'bruel-'+target,x,spawn,kind,sign,...(stairs?{stairs:true}:{})});
d.revision='A2-proposal';
// The annexe screen now represents the upper landing of the existing staircase.
// Hall -> annexe carries the floor change rather than annexe -> junction.
z('hall').exits=z('hall').exits.filter(e=>e.to!=='bruel-escalier-annexe');
z('hall').exits.push(exit('escalier-annexe',285,55,'UP','ESCALIER ANNEXE / 1ER',true));
z('escalier-annexe').floor=1;
z('escalier-annexe').exits=[
 exit('hall',60,278,'DOWN','HALL / RDC',true),
 exit('palier-principal',10,230,'LEFT','PALIER PRINCIPAL / 1ER'),
 exit('jonction-b',298,55,'RIGHT','JONCTION / 1ER'),
];
z('palier-principal').exits.push(exit('escalier-annexe',230,55,'UP','LIAISON ANNEXE / 1ER'));
const back=z('jonction-b').exits.find(e=>e.to==='bruel-escalier-annexe');
back.kind='UP';back.sign='ANNEXE / 1ER';delete back.stairs;
const base=d.routes.discovery;
d.routes.midcourseChoice=[...base.slice(0,5),'bruel-escalier-annexe',...base.slice(6)];
fs.writeFileSync(file('bruel-navigation-a2-design.json'),JSON.stringify(d,null,2)+'\n');
console.log('A2 proposal written; no runtime source or asset modified.');
