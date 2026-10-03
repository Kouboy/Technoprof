const fs = require('fs'), vm = require('vm'), assert = require('assert');
const ts = require('typescript');
let source = ['gameplay','combat-poses','slice-art'].map(n=>fs.readFileSync('src/'+n+'.ts','utf8')).join('\n').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
source += '\nglobalThis.SliceArt=SliceArt;globalThis.POSES=POSES;';
const scope={};vm.createContext(scope);vm.runInContext(require('node:module').stripTypeScriptTypes(source,{mode:'transform'}),scope);
function sprite(){const s={};for(const k of ['setAngle','setDepth','setVisible','setTexture','setOrigin','setPosition','setScale','setFlipX','setAlpha'])s[k]=(...args)=>{s[k+'Args']=args;if(k==='setScale'){s.scaleX=args[0];s.scaleY=args[1]??args[0];}return s;};return s;}
const art=Object.create(scope.SliceArt.prototype);art.backdrop=sprite();art.teacher=sprite();art.inspector=sprite();
for(const role of ['prof','inspecteur'])for(let i=0;i<8;i++){
 const [x,y,w,h,ax,ay]=scope.POSES[role][i];assert(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);assert(ax>=x&&ax<=x+w);assert(ay>=y);
 art.pose(role,i,100,159,1);const right=art[role==='prof'?'teacher':'inspector'].setScaleArgs[0];art.pose(role,i,100,159,-1);assert.notEqual(right,art[role==='prof'?'teacher':'inspector'].setScaleArgs[0]);
}
const enemy={x:220,hp:6,boss:true,wind:0,recovery:0,stun:0,pattern:1};
const state={px:80,py:159,face:1,attack:.4,walkClock:0,ambienceClock:0,inv:0,phase:'school',age:0,keys:{LEFT:{isDown:false},RIGHT:{isDown:false}},enemies:[enemy]};
art.render(state);assert.equal(art.teacher.setTextureArgs[1],4);
state.attack=.25;art.render(state);assert.equal(art.teacher.setTextureArgs[1],5);
state.attack=.1;art.render(state);assert.equal(art.teacher.setTextureArgs[1],6);
state.attack=0;state.py=130;art.render(state);assert.equal(art.teacher.setTextureArgs[1],7);
enemy.wind=.4;art.render(state);assert.equal(art.inspector.setTextureArgs[1],4);
enemy.wind=0;enemy.recovery=1;enemy.strikeTime=.12;art.render(state);assert.equal(art.inspector.setTextureArgs[1],5);
enemy.pattern=0;art.render(state);assert.equal(art.inspector.setTextureArgs[1],6);
enemy.recovery=.5;enemy.strikeTime=0;art.render(state);assert.equal(art.inspector.setTextureArgs[1],7);
enemy.recovery=1;enemy.strikeTime=0;art.render(state);assert.equal(art.inspector.setTextureArgs[1],7,'cancelled attacks cannot reappear during recovery');
art.hide();assert.equal(art.backdrop.setVisibleArgs[0],false);assert.equal(art.teacher.setVisibleArgs[0],false);assert.equal(art.inspector.setVisibleArgs[0],false);
console.log('PASS atlas bounds, left/right poses, attack anticipation/strike/recovery, jump, boss stamp/sweep/recovery, scene cleanup');
enemy.female=true;art.render(state);assert.equal(art.inspector.setTextureArgs[0],'inspectrice');
enemy.female=false;art.render(state);assert.equal(art.inspector.setTextureArgs[0],'inspecteur');
console.log('PASS female and male inspector atlas selection');



art.door={fillStyle(){},fillRect(){},clear(){}};state.phase='opening';state.openingFrom=270;state.age=1;state.py=159;state.attack=0;state.enemies=[];art.render(state);assert(art.teacher.setPositionArgs[0]>270);assert(art.teacher.setPositionArgs[1]<159);assert(Number.isFinite(art.teacher.scaleX));state.age=2.45;art.render(state);assert.equal(art.teacher.setAlphaArgs[0],0);art.hide();console.log('PASS classroom walk enters doorway before fading to black');


let hallSource=fs.readFileSync('src/hall-art.ts','utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
hallSource+=';globalThis.HallArt=HallArt;globalThis.PARENT_FRAMES=PARENT_FRAMES;';
const hs={};vm.createContext(hs);vm.runInContext(require('node:module').stripTypeScriptTypes(hallSource,{mode:'transform'}),hs);
const hall=Object.create(hs.HallArt.prototype);hall.parent=sprite();hall.background=sprite();
hs.PARENT_FRAMES.forEach(([x,y,w,h,anchor],i)=>{assert(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);assert(anchor>=x&&anchor<=x+w);assert(773>=y&&773<=y+h);hall.pose(i,100,-1);assert.deepEqual(hall.parent.setPositionArgs,[100,159]);assert.equal(hall.parent.scaleX,-.14);assert.equal(hall.parent.scaleY,.14);});
hall.hide();assert.equal(hall.parent.setVisibleArgs[0],false);assert.equal(hall.background.setVisibleArgs[0],false);
console.log('PASS parent atlas bounds, foot anchors, facing and cleanup');

let guardSource=fs.readFileSync('src/bridge-art.ts','utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');guardSource+=';globalThis.BridgeArt=BridgeArt;globalThis.GUARD_FRAMES=GUARD_FRAMES;globalThis.GUARD_OUTLINES=GUARD_OUTLINES;';const gs={};vm.createContext(gs);vm.runInContext(require('node:module').stripTypeScriptTypes(guardSource,{mode:'transform'}),gs);const ba=Object.create(gs.BridgeArt.prototype);ba.background=sprite();ba.guard=sprite();gs.GUARD_FRAMES.forEach(([x,y,w,h,anchor],i)=>{assert(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);assert(anchor>=x&&anchor<=x+w);for(const [px,py]of gs.GUARD_OUTLINES[i])assert(px>=x&&px<=x+w&&py>=y&&py<=y+h);ba.pose(i,150,-1);assert.deepEqual(ba.guard.setPositionArgs,[150,159]);assert.equal(ba.guard.scaleX,-.14);});ba.hide();assert.equal(ba.guard.setVisibleArgs[0],false);console.log('PASS guard atlas, silhouette bounds, anchors and cleanup');

let studentSource=fs.readFileSync('src/wing-art.ts','utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');studentSource+=';globalThis.WingArt=WingArt;globalThis.STUDENT_FRAMES=STUDENT_FRAMES;globalThis.STUDENT_OUTLINES=STUDENT_OUTLINES;';const ss={};vm.createContext(ss);vm.runInContext(require('node:module').stripTypeScriptTypes(studentSource,{mode:'transform'}),ss);const wa=Object.create(ss.WingArt.prototype);wa.background=sprite();wa.student=sprite();ss.STUDENT_FRAMES.forEach(([x,y,w,h,anchor],i)=>{assert(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);assert(anchor>=x&&anchor<=x+w);for(const [px,py]of ss.STUDENT_OUTLINES[i])assert(px>=x&&px<=x+w&&py>=y&&py<=y+h);for(const facing of [-1,1]){wa.pose(i,150,facing);assert.deepEqual(wa.student.setPositionArgs,[150,159]);assert.equal(wa.student.scaleX,.11*facing);assert.equal(wa.student.scaleY,.11);}});wa.hide();assert.equal(wa.student.setVisibleArgs[0],false);console.log('PASS student atlas, silhouette bounds, foot anchors, both orientations and cleanup');
