// Read current runtime encounters, preserving which validated rooms share text.
// Never overwrite a writer's edited document.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const { createGame } = require('../work/test-harness.cjs');
const output = process.argv[2];
if (!output) throw Error('Usage: node tools/export-texts.cjs <new-document.md>');
if (fs.existsSync(output)) throw Error('Refusing to overwrite an existing writing document: ' + output);
const source = ['dialogue','player-experience','bruel-recovery'].map(name =>
  fs.readFileSync('src/' + name + '.ts','utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'')
).join('\n');
const scope = {};
vm.createContext(scope);
vm.runInContext(stripTypeScriptTypes(source, {mode:'transform'}) + '\nglobalThis.texts={RADIO_NAME,RADIO_SPOKEN_NAME,RADIO_BULLETINS,INFIRMARY};', scope);
const { g } = createGame(), grouped = new Map();
for (let mission=0;mission<3;mission++) {
  g.validatedDay=true; g.mission=mission; g.begin();
  for (const room of Object.values(g.navigationSpec().rooms)) {
    g.room=room.id;
    const encounter=g.encounter();
    if (!encounter) continue;
    const speaker=mission===0&&room.boss?'INSPECTRICE':encounter.name;
    const key=JSON.stringify([speaker,encounter.pages]);
    if (!grouped.has(key)) grouped.set(key,{speaker,pages:encounter.pages,locations:[]});
    grouped.get(key).locations.push(g.missionSpec().school+' — '+room.name+' (salle technique '+room.id+')');
  }
}
const lines=[
  '# TECHNOPROF — Textes à réécrire', '',
  'Document de travail extrait de la journée actuelle : Ormeaux H1, Auguste-Berthelot A3, Trois-Ponts I2.', '',
  'Tu peux modifier librement les textes dans les citations, les noms et le nombre de pages. Garde les identifiants (RADIO-1, DIALOGUE-01…) et les indications de lieu pour que je retrouve les passages. Ajoute tes intentions ou variantes sous « Notes ». Je m’occuperai ensuite des retours à la ligne et de la place dans les bulles : inutile de caler tes phrases sur les lignes du pixel art.', '',
  'Ce document est une proposition de réécriture à me renvoyer ; le modifier ne change pas automatiquement le jeu. Les textes identiques utilisés dans plusieurs pièces sont regroupés. Les panneaux de navigation et les libellés techniques de l’interface ne sont pas inclus.', '',
  '## Radio', '', 'Nom affiché : **'+scope.texts.RADIO_NAME+'**. Nom transmis à la voix : **'+scope.texts.RADIO_SPOKEN_NAME+'**.', '',
];
function pages(p) { p.forEach((page,index)=>lines.push('**Page '+(index+1)+'**','', '> '+page.join(' '),'')); }
scope.texts.RADIO_BULLETINS.forEach((text,index)=>lines.push('### RADIO-'+(index+1)+' — '+['matin / Ormeaux','midi / Berthelot','crépuscule / Trois-Ponts'][index], '', '> '+text,'','Notes :',''));
lines.push('## Rencontres dans les établissements','');
let n=0;
for (const entry of grouped.values()) {
  lines.push('### DIALOGUE-'+String(++n).padStart(2,'0')+' — '+entry.speaker,'','Lieux :','');
  for(const location of entry.locations) lines.push('- '+location);
  lines.push(''); pages(entry.pages); lines.push('Notes :','');
}
lines.push('## Respiration à l’infirmerie','','### SOIN-1 — Infirmière (les trois établissements)','','Accueil bienveillant, sans gag ni menace. Une seule visite par affectation.','');
pages(scope.texts.INFIRMARY.encounter.pages); lines.push('Notes :','');
lines.push('## Après le cours','','### COURS-1 — Professeur','','> Bon. Reprenons.','','### COURS-2 — Ellipse','','> Une heure plus tard…','','Notes :','');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,lines.join('\n'),'utf8');
console.log('Writing document created: '+output+'; '+grouped.size+' unique encounters, 3 radio bulletins and infirmary. Existing files are never overwritten.');
