const fs=require('fs');
const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/driving.ts',s=>s.replace('export type Traffic =','// One queue capacity across the day: density comes from spacing, not a longer tail.\nexport const TRAFFIC = { capacity: 12, spacing: [1, 0.64, 0.44] };\nexport type Traffic =').replace('(mission === 0 ? 1 : mission === 1 ? 0.94 : 0.88)','TRAFFIC.spacing[Math.max(0, Math.min(2, mission))]'));
edit('src/main.ts',s=>s.replace('  trafficCue,','  trafficCue,\n  TRAFFIC,').replace('const trafficCount = [5, 8, 11][Math.min(this.mission, 2)];','const trafficCount = TRAFFIC.capacity;'));
edit('src/missions.ts',s=>{
 s=s.replace('  frame?: number;','  frame?: number;\n  quietFrame?: number;\n  quietMirror?: boolean;');
 const add=`// Quiet wings extend both routes without adding encounters or floor hazards.
const extendWing = (rooms: Record<number, RoomSpec>, approaches: number[], first: number, arena: number, classroom: string, classFrame: number) => {
 for (const id of approaches) {
  const r=rooms[id];
  r.exits=(r.exits ?? roomPassages(id,false)).map(e=>e.target===arena ? {...e,target:first,spawn:22,label:"DROITE : LIAISON / "+classroom}:e);
  r.signs=[[176,51,106,[classroom+" / LIAISON >"]]];
 }
 rooms[first]=room(first,"LIAISON / "+classroom,1,[edge("LEFT",approaches[0],280,"GAUCHE : RETOUR"),edge("RIGHT",first+1,24,"DROITE : SALLE D’ETUDE")],{quietFrame:3,signs:[[164,51,126,["ETUDE > / "+classroom]]]});
 rooms[first+1]=room(first+1,"SALLE D’ETUDE / TRAVERSEE",1,[door("DOWN",45,first,278,"BAS : LIAISON"),door("UP",281,first+2,24,"HAUT : HALL / "+classroom)],{quietFrame:classFrame,labels:[[281,43,"HALL"]],signs:[[171,51,104,["HALL / "+classroom+" >"]]]});
 rooms[first+2]=room(first+2,"HALL / AILE "+classroom,1,[edge("LEFT",first+1,260,"GAUCHE : ETUDE"),edge("RIGHT",arena,45,"DROITE : SALLE "+classroom)],{quietFrame:3,quietMirror:true,signs:[[179,51,105,["SALLE "+classroom+" >"]]]});
};
extendWing(collegeRooms,[3],30,4,"42C",0);
extendWing(bruelRooms,[13],16,14,"B12",1);
extendWing(proRooms,[22,23],26,24,"T03",2);
`;
 s=s.replace('export const MISSIONS:',add+'\nexport const MISSIONS:');
 s=s.replace('if (m.id === "hanouna" || !m.rooms[id]) return roomPassages(id, cleared);','if (!m.rooms[id] || (m.id === "hanouna" && !r?.exits)) return roomPassages(id, cleared);');
 return s;
});
const atlas='data:image/png;base64,'+fs.readFileSync('art/quiet-backgrounds-059.png').toString('base64');
fs.writeFileSync('src/quiet-school-data.ts','// Original atlas retained in art/quiet-backgrounds-059.png.\nexport const QUIET_SCHOOL_DATA = '+JSON.stringify(atlas)+';\n');
edit('src/new-school-art.ts',s=>s.replace('import { NEW_SCHOOL_DATA }','import { QUIET_SCHOOL_DATA } from "./quiet-school-data";\nimport { NEW_SCHOOL_DATA }').replace('    this.background = scene.add',`    const quiet = scene.textures.get("quiet-backgrounds");
    [[0,0,833,469],[840,0,832,469],[0,475,833,443],[840,475,832,443]].forEach(([x,y,w,h],i)=>quiet.add(i,0,x,y,w,h));
    quiet.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.background = scene.add`).replace('  static preload(scene: Phaser.Scene) {','  static preload(scene: Phaser.Scene) {\n    scene.load.image("quiet-backgrounds", QUIET_SCHOOL_DATA);').replace('    this.showBackground(s.mission, r.frame ?? 0);','    if (r.quietFrame !== undefined) this.background.setTexture("quiet-backgrounds",r.quietFrame).setDisplaySize(306,168).setVisible(true);\n    else this.showBackground(s.mission, r.frame ?? 0);\n    this.background.setFlipX(!!r.quietMirror);'));
edit('src/presentation.ts',s=>s.replace('Matin · 08:00','Aube · 07:00').replace('0xd4dfdd','0xa7bacd').replace('0xf0f3ee','0xd7e3ee').replace('0xc9d7e0','0x8297b5').replace('0x334957','0x25364b').replace('opacity: 0.08','opacity: 0.11').replace('0xeee4cc','0xfff1d3').replace('0xf1e6cb','0xf5edd6').replace('Fin de journée · 17:00','Crépuscule · 18:30').replace('0xacb8cb','0x9292ac').replace('0xdce3f0','0xddc9c0').replace('0xa9b1c9','0x715a7c').replace('0x27304c','0x2b203d').replace('opacity: 0.19','opacity: 0.23'));
for(const p of ['src/player-experience.ts','src/cadre.ts'])edit(p,s=>s.replaceAll('08:00','07:00').replaceAll('17:00','18:30'));
edit('work/day-runner-057.cjs',s=>s.replaceAll('3:4','3:30,30:31,31:32,32:4').replaceAll('13:14','13:16,16:17,17:18,18:14').replaceAll('22:24','22:26,26:27,27:28,28:24').replaceAll('23:24','23:26,26:27,27:28,28:24'));
for(const p of ['package.json','package-lock.json'])edit(p,s=>s.replaceAll('0.58.0','0.59.0'));
for(const p of ['src/main.ts','index.html'])edit(p,s=>s.replaceAll('0.58','0.59'));
