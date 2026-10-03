const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {stripTypeScriptTypes}=require('node:module');
let source=fs.readFileSync('src/car-art.ts','utf8').replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\r?\n/gm,'').replaceAll('export ','');
const context={};vm.createContext(context);
vm.runInContext(stripTypeScriptTypes(source,{mode:'transform'})+'\nthis.CarArt=CarArt; this.frames=CAR_FRAMES;',context);
const calls={};const sprite={};
for(const method of ['setOrigin','setTexture','setVisible','setFlipX','setPosition','setDisplaySize','setAngle','setAlpha'])sprite[method]=(...args)=>{calls[method]=args;return sprite;};
const art=Object.create(context.CarArt.prototype);art.sprite=sprite;art.turn=0;
for(const [x,y,w,h] of context.frames){assert(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);}
art.rear(160,110,0,0,100);assert.equal(calls.setTexture[1],0);assert.equal(calls.setFlipX[0],false);
art.rear(160,110,-.4,0,100);assert.equal(calls.setTexture[1],1);assert.equal(calls.setFlipX[0],false);
art.rear(160,110,-.2,0,100);assert.equal(calls.setTexture[1],1);
art.rear(160,110,0,0,100);assert.equal(calls.setTexture[1],0);
art.rear(160,110,.4,0,100);assert.equal(calls.setFlipX[0],false);assert.equal(calls.setTexture[0],"service-right");assert.equal(calls.setTexture[1],3);
art.side(111);assert.equal(calls.setTexture[1],2);assert.equal(calls.setFlipX[0],false);assert.equal(calls.setAngle[0],0);assert.equal(calls.setPosition[1],153);
art.hide();assert.equal(calls.setVisible[0],false);
console.log('PASS car atlas bounds, dedicated left/right steering, view hysteresis, side profile reset and cleanup');

// Same roof-to-tire height in both driving views, larger side profile at parking.
art.rear(160,0,0,0,100);const straight=calls.setDisplaySize[1]*288/context.frames[0][3];const straightFoot=calls.setOrigin[1];
art.rear(160,0,-.5,0,100);const bent=calls.setDisplaySize[1]*292/context.frames[1][3];assert(Math.abs(straight-bent)<.001);assert.equal(straight,34);assert.equal(calls.setPosition[1],170);
art.side(111);assert(Math.abs(calls.setDisplaySize[1]*266/context.frames[2][3]-40)<.001);assert(calls.setDisplaySize[0]>90);console.log('PASS equal driving body height and parking scale');

art.rear(160,0,.5,0,100);assert.equal(calls.setFlipX[0],false);assert(Math.abs(calls.setDisplaySize[1]*458/context.frames[3][3]-34)<.001);const leftLamp=art.anchor('leftLamp'),rightLamp=art.anchor('rightLamp'),pipe=art.anchor('exhaust');assert(leftLamp.x<rightLamp.x);assert(pipe.x<160);assert(pipe.y>leftLamp.y);assert(leftLamp.y>150&&leftLamp.y<165);art.rear(160,0,.2,0,100);assert.equal(calls.setTexture[1],3);art.rear(160,0,0,0,100);assert.equal(calls.setTexture[1],0);console.log('PASS right-view scale, unmirrored rendering, view hysteresis and lamp/exhaust anchors');
