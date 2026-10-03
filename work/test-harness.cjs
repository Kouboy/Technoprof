const fs=require('fs'),vm=require('vm');
const strip=s=>s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
let main=strip(fs.readFileSync('src/main.ts','utf8'));main=main.slice(0,main.indexOf('new Phaser.Game'));
const road=fs.readFileSync('src/road-art.ts','utf8');
const source=['world','passage-layout','controls','dialogue','gameplay','missions','bruel-navigation','direct-input','session-log','driving','road-structures','presentation','player-experience'].map(n=>strip(fs.readFileSync('src/'+n+'.ts','utf8'))).join('\n')+'\n'+strip(road.slice(road.indexOf('export const VERGE'),road.indexOf('export class RoadArt')))+'\nclass AudioKit {attention(){} talk(){} fx(){} ambienceVolume=1; combat(){} enemyGesture(){} tone(){} radio(){} noise(){} roadImpact(){} pass(){} motor(){} scene(){} unlock(){} muted=false;}\n'+main+'\nglobalThis.Game=Game;globalThis.api={ActionInput,DirectInput,BINDINGS,dialogueLength,passageMarker,BRUEL_NAV,NAV_ID,NAV_CARE};';
const js=require('node:module').stripTypeScriptTypes(source+'\nglobalThis.audit={MISSIONS,missionPassages,missionEnemies,DAY_LOAD,DRIVE,TRAFFIC,trafficCue,DAYLIGHT,drawSchoolWear};');
exports.createGame=()=>{
 const context={Phaser:{Scene:class{},Math:{Clamp:(n,a,b)=>Math.max(a,Math.min(b,n))},Input:{Keyboard:{JustDown:k=>{const v=k.just||k._justDown;k.just=false;k._justDown=false;return v;}}}}};
 vm.createContext(context);vm.runInContext(js,context);const g=new context.Game();
 g.keys=Object.fromEntries(['LEFT','RIGHT','UP','DOWN','SPACE','X','ENTER','P','M','F2','F3','F4'].map(k=>[k,{isDown:false,just:false}]));
 g.draw=()=>{};g.cameras={main:{shake(){}}};g.input={keyboard:{enabled:true,disableGlobalCapture(){},enableGlobalCapture(){},resetKeys(){for(const k of Object.values(g.keys)){k.isDown=false;k.just=false;}}}};
 const step=(ms=20)=>g.update(0,ms);
 const advance=(seconds,fps=50)=>{const count=Math.round(seconds*fps);for(let i=0;i<count;i++)step(seconds*1000/count);};
 const press=key=>{g.keys[key].just=true;step();};
 return {g,step,advance,press,api:context.api,audit:context.audit};
};
