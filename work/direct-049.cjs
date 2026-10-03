const fs=require('fs');const edit=(f,fn)=>fs.writeFileSync(f,fn(fs.readFileSync(f,'utf8')));
edit('src/controls.ts',s=>s.slice(0,s.indexOf('export function pointerActions')));
edit('src/main.ts',s=>s.replace('ActionInput, BINDINGS, installPointerControls','ActionInput, BINDINGS').replace('import { ActionInput, BINDINGS } from "./controls";','import { ActionInput, BINDINGS } from "./controls";\nimport { DirectInput, installDirectInput } from "./direct-input";')
 .replace('  syncPointerUI?: () => void;','  direct?: DirectInput;')
 .replace('  screenControls = false;','  pointerMode = false;')
 .replace('this.syncPointerUI = installPointerControls(this);','this.direct = installDirectInput(this);')
 .replace('    this.controls?.reset();\n    const keyboard','    this.controls?.reset();\n    this.direct?.cancel();\n    const keyboard')
 .replace('    if (value !== this.paused) this.controls?.reset();','    if (value !== this.paused) { this.controls?.reset(); this.direct?.cancel(); }')
 .replace('  enterRoom(room: number, x: number)', '  enterRoom(room: number, x: number)')
 .replace('    const just = (k: string) => Phaser.Input.Keyboard.JustDown(this.keys[k]);','    this.direct?.tick(dt);\n    const just = (k: string) => Phaser.Input.Keyboard.JustDown(this.keys[k]);')
 .replace('this.screenControls ? "ACTION" : "X/F"','this.pointerMode ? "TOUCHER" : "X/F"')
 .replace('    this.syncPointerUI?.();','')
 .replace('  interaction() {\n    const targets =', '  pointerExits() {\n    return (')
 .replace('        : EXITS[this.room];\n    return targets?.find((t) => this.px >= t.from && this.px <= t.to);','        : EXITS[this.room]) ?? [];\n  }\n  interaction() {\n    return this.pointerExits().find((t) => this.px >= t.from && this.px <= t.to);')
 .replace('    if (this.paused && !this.workshop && !this.syncPlayerUI) {','    const feedback = this.direct?.feedback;\n    if (feedback && !this.paused && ["school","free","receive","road"].includes(this.phase)) {\n      const x = feedback.x, y = feedback.y;\n      this.g.lineStyle(1, feedback.kind === "attack" ? 0xd97561 : 0xe5ae60, Math.min(1,feedback.life/.2));\n      this.g.strokeRect(x-4,y-4,8,8);\n      this.g.lineBetween(x-8,y,x-5,y);this.g.lineBetween(x+5,y,x+8,y);\n    }\n    if (this.paused && !this.workshop && !this.syncPlayerUI) {')
 );
// UI: keep the image clear; explain gestures in the existing controls page.
edit('src/player-experience.ts',s=>s.replace(/\[\s*"Souris \/ tactile",[\s\S]*?\],\r?\n/, '["Souris / tactile", "Touchez le sol pour marcher, un adversaire pour aller le frapper, un passage pour l’emprunter. Glissez vers le haut pour sauter ; en diagonale pour sauter dans cette direction."],\n      ["Conduite directe", "Maintenez dans la scène pour accélérer. Glissez à gauche/droite pour diriger ; vers le bas pour freiner. Relâchez pour laisser rouler."],\n      ["Dialogue / après le cours", "Un clic ou toucher révèle la réplique puis la poursuit. Après le cours ou un échec, touchez pour continuer."],\n')
 .replace('Souris et tactile : commandes à l’écran.','Souris et tactile : interactions directement dans la scène.')
 .replace('Une touche ou le bouton Continuer','Une touche ou un toucher')
 );
edit('index.html',s=>{
 const start=s.indexOf('    #screen-toggle'),end=s.indexOf('    @media (min-width: 1100px)',start);
 if(start<0||end<0)throw Error('CSS control block');
 s=s.slice(0,start)+`    #game { touch-action: none; -webkit-user-select: none; user-select: none; }
    @media (pointer: coarse), (max-width: 600px) {
      body { place-content: start center; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); box-sizing: border-box; }
      #player-toolbar button, #player-panel button { min-height: 44px; }
      #player-panel { inset: 0; }
      #player-panel h1 { font-size: 23px; }
      #player-panel p { margin: 8px 0; line-height: 1.4; }
      #player-feedback { min-height: 0; }
    }
    @media (orientation: landscape) and (max-height: 540px) {
      body:not(.lab) #game { width: min(96vw, calc((100svh - 112px) * 1.3333)); }
      body:not(.lab) #player-toolbar { padding: 2px; }
      body:not(.lab) #player-toolbar button { min-height: 40px; padding: 3px 6px; }
      body:not(.lab) #player-feedback { max-width: min(96vw, 700px); }
      body:not(.lab) #player-feedback p { font-size: 11px; line-height: 1.3; margin: 3px; }
    }
`+s.slice(end);
 const a=s.indexOf('  <div id="screen-controls"'),b=s.indexOf('  <div id="player-feedback"',a);
 if(a<0||b<0)throw Error('HTML controls block');
 return s.slice(0,a)+s.slice(b);
 });
for(const f of ['work/test-harness.cjs','work/check.cjs'])edit(f,s=>s.replace("'dialogue','gameplay'","'dialogue','gameplay','direct-input'"));
