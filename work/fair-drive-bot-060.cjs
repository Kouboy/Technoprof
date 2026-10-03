// Test-only cautious driver: horizon uses observed vehicles and relative motion.
// It returns held inputs; it never writes world position, vehicle HP or clocks.
exports.driveInput=(g)=>{
 const cars=g.obstacles.filter(o=>o.z-g.travel>-10&&o.z-g.travel<900&&!o.hit);
 let best=null;
 for(const target of [-.94,0,.94])for(const brake of [false,true]){
  let x=g.car,v=g.steerVelocity,speed=g.speed,travel=0,cost=0;
  for(let i=1;i<=30;i++){
   const dt=.08,t=i*dt,anticipate=x+v*.24;
   const steer=anticipate<target-.04?1:anticipate>target+.04?-1:0;
   speed=Math.max(0,Math.min(g.notified?260:110,speed+(brake?-95:38*(1-speed/340))*dt));
   v+=(steer*(.12+Math.min(1,speed/260)*1.8)-v)*(1-Math.exp(-dt/(steer?.24:.18)));
   x=Math.max(-1.15,Math.min(1.15,x+v*dt));travel+=speed*2.4/3.6*dt;
   cost+=Math.max(0,Math.abs(x)-.97)*100;
   for(const o of cars){
    const z=o.z-g.travel+(o.speed??[78,60,68][o.type])*2.4/3.6*t-travel;
    const width=(42+[52,68,46][o.type])/210;
    if(Math.abs(z)<25 && Math.abs(x-o.x)<width+.07)cost+=2000*(1-i/40);
   }
  }
  cost+=(brake?7:0)+Math.abs(target-g.car)*.2;
  if(!best||cost<best.cost)best={target,brake,cost};
 }
 g.botTarget=best.target;
 const anticipate=g.car+g.steerVelocity*.24;
 g.keys.RIGHT.isDown=anticipate<best.target-.04;
 g.keys.LEFT.isDown=anticipate>best.target+.04;
 g.keys.DOWN.isDown=best.brake;g.keys.UP.isDown=!best.brake;
};





