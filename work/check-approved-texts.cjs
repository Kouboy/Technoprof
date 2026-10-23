// Compare the author's approved document with the actual inherited day encounters.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createGame}=require('./test-harness.cjs');
const strip=s=>s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
const doc=fs.readFileSync('docs/ecriture/TEXTES-A-REECRIRE.md','utf8');
const sections=Object.fromEntries([...doc.matchAll(/^### ((?:RADIO|DIALOGUE|SOIN|COURS)-\d+)\b([^\n]*)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)].map(m=>[m[1],{title:m[2],pages:[...m[3].matchAll(/^> (.+)$/gm)].map(q=>q[1].trim())}]));
const ctx={};vm.createContext(ctx);
vm.runInContext(require('node:module').stripTypeScriptTypes(['world','dialogue','gameplay','combat-poses','driving','presentation','small-lettering','cadre','school-props','player-experience','bruel-recovery'].map(n=>strip(fs.readFileSync('src/'+n+'.ts','utf8'))).join('\n')+';globalThis.texts={RADIO_NAME,RADIO_SPOKEN_NAME,RADIO_BULLETINS,dialogueLayout,INFIRMARY};'),ctx);
const a=ctx.texts;
assert.equal(a.RADIO_NAME,doc.match(/Nom affiché : \*\*(.+?)\*\*/)[1]);
assert.equal(a.RADIO_SPOKEN_NAME,doc.match(/Nom transmis à la voix : \*\*(.+?)\*\*/)[1]);
for(let i=0;i<3;i++)assert.equal(a.RADIO_BULLETINS[i],sections['RADIO-'+(i+1)].pages[0]);
const rooms=[[0,201],[0,205],[0,207],[1,100],[1,101],[1,108],[1,109],[1,110],[1,111],[2,300],[2,302],[2,304],[2,308],[2,309],[2,311],[2,312],[2,306]];
for(let index=0;index<rooms.length;index++){
 const [mission,room]=rooms[index],id='DIALOGUE-'+String(index===16?10:index+1).padStart(2,'0');
 const t=createGame(),g=t.g;g.validatedDay=true;g.mission=mission;g.begin();g.notified=true;g.phase='school';g.schoolFade=0;g.enterRoom(room,50);
 const data=g.encounter();assert(data,`missing ${id} room ${room}`);assert(g.encounterTime>0,`${id} first encounter starts its dialogue`);
 assert.deepEqual(Array.from(data.pages,p=>p.join(' ')),sections[id].pages,`${id} room ${room} must match the approved text and page count`);
 for(let page=0;page<data.pages.length;page++){
  assert(data.pages[page].length<=2,'two lines preserve the existing bubble geometry');
  for(const x of [22,150,287]){
   const b=a.dialogueLayout(room,9,x,false,{page,characters:0},'X/F',data);
   assert(b.x>=12&&b.x+b.w<=308,`${id} bubble within the viewport`);
  }
  const before=[g.px,g.py,g.remaining,g.hp,...g.enemies.map(e=>e.x)];
  t.press('X');assert.equal(g.dialogue.page,page,'first action reveals without skipping');
  assert.equal(g.attack,0);assert.deepEqual([g.px,g.py,g.remaining,g.hp,...g.enemies.map(e=>e.x)],before);
  t.press('X');assert.equal(g.attack,0,'advance/close never strikes');
 }
 assert.equal(g.encounterTime,0,'all approved pages can finish');
}
assert.deepEqual(Array.from(a.INFIRMARY.encounter.pages,p=>p.join(' ')),sections['SOIN-1'].pages);
const {g}=createGame();
for(let i=0;i<3;i++)assert.equal(g.radioLines[i],a.RADIO_SPOKEN_NAME+'. '+sections['RADIO-'+(i+1)].pages[0]);
assert(fs.readFileSync('src/cadre.ts','utf8').includes('"EDUCA FRANCE"'),'radio HUD follows the new identity');
console.log('PASS all 16 approved encounters + shared I2 guard, 3 bulletins, displayed/spoken radio identity, nurse unchanged, page sequencing and bubble bounds');
