const fs=require('fs');
const edit=(f,fn)=>fs.writeFileSync(f,fn(fs.readFileSync(f,'utf8')));
edit('src/main.ts',s=>s.replace('import { drawComicFX }','import { ActionInput, BINDINGS, installPointerControls } from "./controls";\nimport { drawComicFX }')
 .replace('  syncPlayerUI?: () => void;','  syncPlayerUI?: () => void;\n  syncPointerUI?: () => void;\n  controls?: ActionInput;\n  screenControls = false;\n  physicalKeys?: Record<string, Phaser.Input.Keyboard.Key>;')
 .replace('    this.keys = this.input.keyboard!.addKeys(\n      "LEFT,RIGHT,UP,DOWN,SPACE,X,ENTER,P,M,F2,F3,F4",\n    ) as typeof this.keys;','    this.physicalKeys = this.input.keyboard!.addKeys(Object.values(BINDINGS).flat().join(",")) as typeof this.keys;\n    this.controls = new ActionInput();\n    this.keys = this.controls.keys as unknown as typeof this.keys;')
 .replace('    this.draw();\n  }\n  inkCache', '    if (!preview || preview === "accueil" || preview === "labo") this.syncPointerUI = installPointerControls(this);\n    this.draw();\n  }\n  refreshLayout() { this.scale?.refresh(); }\n  inkCache')
 .replace('    this.playerMenu = open;', '    this.playerMenu = open;\n    this.controls?.reset();')
 .replace('    this.paused = value;','    if (value !== this.paused) this.controls?.reset();\n    this.paused = value;')
 .replace('    this.workshopScenario = name;','    this.controls?.reset();\n    this.workshopScenario = name;')
 .replace('  update(_t: number, ms: number) {','  update(_t: number, ms: number) {\n    if (this.controls && this.physicalKeys) this.controls.sampleKeyboard(this.physicalKeys, k => Phaser.Input.Keyboard.JustDown(this.physicalKeys![k]));')
 .replace('        this.dialogue,\n      );','        this.dialogue,\n        this.screenControls ? "ACTION" : "X/F",\n      );')
 .replace('    this.syncPlayerUI?.();\n  }\n  fadeViewport', '    this.syncPlayerUI?.();\n    this.syncPointerUI?.();\n  }\n  fadeViewport')
 );
// Preserve the pixel text's short layout while advertising both keyboard choices.
edit('src/school-props.ts',s=>s.replaceAll('  state?: DialogueState,','  state?: DialogueState,\n  actionLabel = "X/F",').replaceAll('"X : AFFICHER"','actionLabel + " : AFFICHER"').replaceAll('"X : SUITE"','actionLabel + " : SUITE"').replaceAll('"X : TERMINER"','actionLabel + " : TERMINER"').replace('dialogueLayout(room, remaining, speakerX, female, state)','dialogueLayout(room, remaining, speakerX, female, state, actionLabel)'));
edit('src/player-experience.ts',s=>s.replace('Une touche pour poursuivre après le cours.','Une touche ou le bouton Continuer pour poursuivre après le cours.')
 .replace('↑ accélérer · ↓ freiner · ← → diriger.','Z/↑ accélérer · S/↓ freiner · Q D/← → diriger.')
 .replace('X : se défendre','F/X : se défendre')
 .replace('"↑ accélérer · ↓ freiner · ← → diriger"','"Z/↑ accélérer · S/↓ freiner · Q D/← → diriger"')
 .replace('"← → marcher · ESPACE sauter · X frapper au livre"','"Q D ou ← → marcher · ESPACE sauter · F ou X frapper"')
 .replace('"X afficher la réplique · X suivant · délai suspendu"','"F ou X afficher, puis poursuivre · délai suspendu"')
 .replace('"↑ ou ↓, selon la touche affichée près du passage"','"Z/↑ ou S/↓, selon la flèche affichée près du passage"')
 .replace('["À tout moment",','["Souris / tactile", "Activez les commandes à l’écran. Maintenez les directions ; les diagonales combinent direction et gaz sur route, direction et saut à pied. Plusieurs doigts peuvent agir ensemble."],\n      ["À tout moment",')
 .replace('Jeu au clavier · ← → ↑ ↓ · ESPACE · X · P','Clavier : ZQSD ou flèches · ESPACE · F/X. Souris et tactile : commandes à l’écran. Paysage conseillé sur téléphone.')
 );
for(const f of ['work/check.cjs','work/test-harness.cjs'])edit(f,s=>s.replace("'world','dialogue'","'world','controls','dialogue'"));
edit('work/check-048.cjs',s=>s.replaceAll("'X : AFFICHER'","'X/F : AFFICHER'").replaceAll("'X : TERMINER'","'X/F : TERMINER'").replaceAll("'X : SUITE'","'X/F : SUITE'"));
for(const f of ['src/session-log.ts','src/workshop.ts','index.html'])edit(f,s=>s.replaceAll('0.48','0.49'));
for(const f of ['package.json','package-lock.json'])edit(f,s=>s.replaceAll('"version": "0.48.0"','"version": "0.49.0"'));
edit('package.json',s=>s.replace('node work/check-048.cjs"','node work/check-048.cjs && node work/check-049.cjs"'));
