const {runDay}=require('./day-runner-057.cjs');
for(const seed of [1,4301,8317]){
 const r=runDay({seed,path:'shortcut'});
 console.log(JSON.stringify({seed,passed:[1,2,3].map(m=>r.journal.events.filter(e=>e.mission===m&&['pass','near-pass'].includes(e.kind)).length),wins:r.journal.events.filter(e=>e.kind==='success'),collisions:r.journal.events.filter(e=>e.kind==='collision'),timing:r.journal.missionTiming}));
}
