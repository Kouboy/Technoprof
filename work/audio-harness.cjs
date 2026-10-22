const fs=require('fs'),vm=require('vm'),{stripTypeScriptTypes}=require('node:module');
const strip=s=>s.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
const bank=strip(fs.readFileSync('src/audio-materials.ts','utf8'));
exports.source='const {DRIVE}=(()=>{'+strip(fs.readFileSync('src/driving.ts','utf8'))+';return {DRIVE};})();\nconst {AUDIO,FOLEY,makeMaterial,engineState,passState}=(()=>{'+bank+';return {AUDIO,FOLEY,makeMaterial,engineState,passState};})();\n'+strip(fs.readFileSync('src/audio.ts','utf8'));
exports.load=(globals={})=>{
 const ctx={...globals};vm.createContext(ctx);
 vm.runInContext(stripTypeScriptTypes(exports.source,{mode:'transform'})+';this.AudioKit=AudioKit;this.bank={AUDIO,FOLEY,makeMaterial,engineState,passState};',ctx);
 return ctx;
};
