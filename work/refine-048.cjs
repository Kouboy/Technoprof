const fs = require('fs');
const edit = (file, replacements) => {
 let text = fs.readFileSync(file,'utf8');
 for(const [from,to] of replacements) {
  if(!text.includes(from)) throw Error(file+' missing '+from.slice(0,100));
  text=text.replace(from,to);
 }
 fs.writeFileSync(file,text);
};
let props=fs.readFileSync('src/school-props.ts','utf8');
const start=props.indexOf('export const ENCOUNTERS:'),end=props.indexOf('export function dialogueLayout',start);
fs.writeFileSync('src/dialogue.ts',props.slice(start,end)+`
// No timeout: X reveals the current page, then a fresh X advances it.
export const DIALOGUE = { charactersPerSecond: 34 };
export type DialogueState = { page: number; characters: number };
export function dialogueLength(room: number, state: DialogueState) {
  return ENCOUNTERS[room]?.pages[state.page]?.join('').length ?? 0;
}
export function dialogueReady(room: number, state: DialogueState) {
  return state.characters >= dialogueLength(room, state);
}
export function advanceDialogue(room: number, state: DialogueState) {
  if (!dialogueReady(room, state)) {
    state.characters = dialogueLength(room, state);
    return 'revealed';
  }
  if (state.page + 1 < (ENCOUNTERS[room]?.pages.length ?? 0)) {
    state.page++;
    state.characters = 0;
    return 'next';
  }
  return 'finished';
}
`);
props=props.slice(0,start)+props.slice(end);
props='import { ENCOUNTERS, dialogueReady, type DialogueState } from "./dialogue";\n'+props;
props=props.replaceAll('  female = false,\n','  female = false,\n  state?: DialogueState,\n').replaceAll('  female = false,\r\n','  female = false,\r\n  state?: DialogueState,\r\n');
props=props.replace('const page = remaining > ENCOUNTER_SECONDS / 2 ? 0 : 1,','const page = state?.page ?? (remaining > ENCOUNTER_SECONDS / 2 ? 0 : 1),');
props=props.replace('    h: 32,','    h: state ? 42 : 32,\n    hint: state ? (!dialogueReady(room, state) ? "X : AFFICHER" : page + 1 < data.pages.length ? "X : SUITE" : "X : TERMINER") : "",');
props=props.replace('dialogueLayout(room, remaining, speakerX, female)','dialogueLayout(room, remaining, speakerX, female, state)');
props=props.replace(/  b.lines.forEach\([\s\S]*?\n  \);\r?\n}/,`  let characters = state ? Math.floor(state.characters) : Infinity;
  b.lines.forEach((line, i) => {
    smallPrint(g, x + 10, y + 14 + i * 8, line.slice(0, Math.max(0, characters)), 0x141e27);
    characters -= line.length;
  });
  if (b.hint) smallPrint(g, x + 10, y + 33, b.hint, 0x854538);
}`);
fs.writeFileSync('src/school-props.ts',props);
// Normalize just the small source files we edit so exact replacements are reliable.
for(const f of ['src/main.ts','src/gameplay.ts','src/driving.ts','src/cadre.ts','src/combat-poses.ts','src/slice-art.ts','src/comic-fx.ts'])fs.writeFileSync(f,fs.readFileSync(f,'utf8').replaceAll('\r\n','\n'));
edit('src/main.ts',[
 ['import { ENCOUNTER_SECONDS } from "./world";', 'import { ENCOUNTER_SECONDS } from "./world";\nimport { DIALOGUE, advanceDialogue, dialogueLength, type DialogueState } from "./dialogue";'],
 ['  encounterTime = 0;', '  encounterTime = 0;\n  dialogue: DialogueState = { page: 0, characters: 0 };'],
 ['    this.bossIntro =\n      room === 4', '    this.dialogue = { page: 0, characters: 0 };\n    this.bossIntro =\n      room === 4'],
 ['    this.encounterTime = Math.max(0, this.encounterTime - dt);','    // Encounter presentation is advanced by the player, never by elapsed time.'],
 ['      const presentation = this.schoolFade > 0 || this.bossIntro > 0;','      const presentation = this.schoolFade > 0 || this.encounterTime > 0 || this.bossIntro > 0;'],
 ['      this.bossIntro = Math.max(0, this.bossIntro - dt);','      this.bossIntro = this.room === 4 ? this.encounterTime : 0;'],
 ['      if (presentation) {\n        this.draw();','      if (presentation) {\n        if (this.schoolFade === 0 && this.encounterTime > 0) {\n          this.dialogue.characters = Math.min(dialogueLength(this.room, this.dialogue), this.dialogue.characters + DIALOGUE.charactersPerSecond * dt);\n          if (attackPressed) {\n            const result = advanceDialogue(this.room, this.dialogue);\n            this.session.record("dialogue", this.mission, this.room, { page: this.dialogue.page, result });\n            this.audio.tone(result === "finished" ? 250 : 380, 0.035, 0.007, 300);\n            if (result === "finished") {\n              this.encounterTime = 0;\n              this.bossIntro = 0;\n              this.roomEnteredAt = this.session.elapsed;\n            }\n          }\n        }\n        // The confirming X is consumed here: it can never also strike.\n        this.attackBuffer = 0;\n        this.draw();'],
 ['            e.strikeTime = 0.12;', '            e.strikeTime = e.pattern % 2 === 0 ? BOSS.sweepPose : BOSS.stampPose;'],
 ['return (this.speed / 3.6) * (1 + 0.65 * rush ** 1.3);','return DRIVE.motionScale * (this.speed / 3.6) * (1 + 0.65 * rush ** 1.3);'],
 ['o.z += (trafficSpeed(o) / 3.6) * dt;', 'o.z += DRIVE.motionScale * (trafficSpeed(o) / 3.6) * dt;'],
 ['const closing = this.visualSpeed() - trafficSpeed(o) / 3.6;', 'const closing = this.visualSpeed() - DRIVE.motionScale * trafficSpeed(o) / 3.6;'],
 ['this.schoolFade === 0 && this.bossIntro === 0)', 'this.schoolFade === 0 && this.bossIntro === 0 && this.encounterTime === 0)'],
 ['        this.enemies[0].female,\n      );', '        this.enemies[0].female,\n        this.dialogue,\n      );'],
 ['COLLEGE SAINT-HANOUNA','COLLEGE C. HANOUNA'],
 ['COLLEGE ST-HANOUNA','COLLEGE C. HANOUNA'],
 ]);
edit('src/gameplay.ts', [['  sweepWind: 0.8,','  sweepWind: 0.8,\n  sweepPose: 0.36,\n  stampPose: 0.18,']]);
edit('src/driving.ts',[
 ['  lanePixels: 105,','  // World scroll gain, shared by moving vehicles and spawn spacing.\n  // Contact projection and mission kilometres remain unchanged.\n  motionScale: 2.4,\n  lanePixels: 105,'],
 ['cue.gap * (mission === 0 ? 1 : mission === 1 ? 0.94 : 0.88) +\n      (index === 0 ? 0 : random * 35),','DRIVE.motionScale * (cue.gap * (mission === 0 ? 1 : mission === 1 ? 0.94 : 0.88) +\n      (index === 0 ? 0 : random * 35)),'],
 ]);
edit('src/cadre.ts',[
 ['s.schoolFade > 0 || s.bossIntro > 0','s.schoolFade > 0 || s.bossIntro > 0 || s.encounterTime > 0'],
 ['"ST-HANOUNA"','"C. HANOUNA"']
 ]);
edit('src/combat-poses.ts',[
 ['  playerRecovery?: number;', '  encounterTime?: number;\n  schoolFade?: number;\n  playerRecovery?: number;'],
 ['s.phase === "school" && (s.keys.LEFT.isDown || s.keys.RIGHT.isDown)', 's.phase === "school" && !(s.encounterTime || s.schoolFade) && (s.keys.LEFT.isDown || s.keys.RIGHT.isDown)']
 ]);
edit('src/slice-art.ts',[
 ['    playerRecovery?: number;', '    encounterTime?: number;\n    playerRecovery?: number;'],
 ['          state.phase === "school" &&','          state.phase === "school" &&\n          !state.encounterTime &&']
 ]);
edit('src/comic-fx.ts',[
 ['  bossIntro: number;', '  bossIntro: number;\n  encounterTime?: number;'],
 ['s.bossIntro > 0) continue;', '(s.bossIntro > 0 || (s.encounterTime ?? 0) > 0)) continue;']
 ]);
for(const file of ['work/test-harness.cjs','work/check.cjs'])edit(file,[["'world','gameplay'","'world','dialogue','gameplay'"]]);
edit('work/check-school.cjs',[["strip(fs.readFileSync('src/school-props.ts','utf8'))","strip(fs.readFileSync('src/dialogue.ts','utf8'))+'\\n'+strip(fs.readFileSync('src/school-props.ts','utf8'))"]]);
