// Test driver: uses only visible traffic and held keys, including steering inertia.
exports.driveInput=(g,preference=-1)=>{
 const traffic=g.obstacles.filter(o=>o.z-g.travel>-6&&o.z-g.travel<280);
 const half=o=>(42+[52,68,46][o.type])/210+.08;
 const lanes=[-.68,0,.68];
 const free=lanes.filter(x=>traffic.every(o=>Math.abs(o.x-x)>half(o)));
 let target=g.botTarget??0;
 if(!free.includes(target)&&free.length)target=free.sort((a,b)=>(Math.abs(a-g.car)-preference*a*.8)-(Math.abs(b-g.car)-preference*b*.8))[0];
 g.botTarget=target;
 const anticipate=g.car+g.steerVelocity*.24;
 g.keys.RIGHT.isDown=anticipate<target-.04;
 g.keys.LEFT.isDown=anticipate>target+.04;
 const blocked=traffic.some(o=>o.z-g.travel<100&&Math.abs(o.x-g.car)<half(o));
 g.keys.DOWN.isDown=free.length===0&&blocked&&g.speed>85;
 g.keys.UP.isDown=!g.keys.DOWN.isDown;
};
