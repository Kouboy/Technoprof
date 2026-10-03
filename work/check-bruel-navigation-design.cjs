// Design analysis only: this graph is intentionally not loaded by the game.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { stripTypeScriptTypes } = require('node:module');
const vm = require('node:vm');
const d = JSON.parse(fs.readFileSync(path.join(__dirname, process.argv[2] ?? 'bruel-navigation-design.json'), 'utf8'));
const zones = new Map(d.zones.map(z => [z.id, z]));
assert.equal(d.status, 'proposal-not-runtime');
assert.equal(zones.size, d.zones.length, 'duplicate zone');
assert.equal(zones.size, 12);
const gameplay = fs.readFileSync(path.join(__dirname, '../src/gameplay.ts'), 'utf8');
const walk = Number(gameplay.match(/walk:\s*(\d+)/)[1]);
assert.equal(d.walkSpeed, walk, 'design cost must use current walk speed');
const ts = stripTypeScriptTypes(fs.readFileSync(path.join(__dirname, '../src/missions.ts'), 'utf8'))
  .replace(/import[\s\S]*?from\s*"[^\"]+";/g, '').replace(/\bexport\s+/g, '');
// Stubs provide only Hanouna's old fallbacks. Bruel/pro specs are explicit.
const spec = vm.runInNewContext(ts + '\nMISSIONS[1]', {
  ROOM_NAMES: Array(9).fill('legacy'), BLOCKED_EDGES: Array(9).fill([]),
  roomPassages: () => [], ENCOUNTERS: {},
});
const expected = [11, 13, 14, 41, 44, 47];
assert.deepEqual(d.zones.filter(z => z.encounterSource !== undefined).map(z => z.encounterSource).sort((a,b) => a-b), expected);
for (const z of zones.values()) {
  assert([0,1].includes(z.floor));
  if (z.encounterSource !== undefined) assert(spec.rooms[z.encounterSource]?.role, 'encounter must already exist');
  assert.equal(new Set(z.exits.map(e => e.to)).size, z.exits.length);
  for (const e of z.exits) {
    assert(zones.has(e.to), `missing destination ${e.to}`);
    assert(e.sign.length && e.x >= 10 && e.x <= 302 && e.spawn >= 10 && e.spawn <= 302);
    assert(['LEFT','RIGHT','UP','DOWN'].includes(e.kind));
    const target = zones.get(e.to);
    if (z.floor !== target.floor) {
      assert(e.stairs, 'floor change must name a staircase');
      assert.equal(e.kind, z.floor < target.floor ? 'UP' : 'DOWN');
    }
    if (e.to !== d.target) assert(target.exits.some(back => back.to === z.id), 'missing return');
  }
}
function reachable(from, skip) {
  const seen = new Set([from]), queue = [from];
  for (const id of queue) for (const e of zones.get(id).exits)
    if (e.to !== skip && !seen.has(e.to)) { seen.add(e.to); queue.push(e.to); }
  return seen;
}
assert.equal(reachable(d.start).size, zones.size, 'every zone must be reachable');
assert(reachable(d.start, d.health.zone).has(d.target), 'care cannot be mandatory');
for (const z of zones.values()) if (z.encounterSource !== undefined && z.id !== d.start && z.id !== d.target)
  assert(!reachable(d.start, z.id).has(d.target), 'an unintended route bypasses an encounter zone');
for (const z of zones.values()) if (!z.boss) assert(reachable(z.id).has(d.start), 'unintended trap before arena');
assert.equal(zones.get(d.target).exits.length, 0, 'arena is a terminal in the orientation graph');
function measure(route, care = false) {
  let x = route[0] === d.start ? d.startX : 20, seconds = 0, cared = false;
  for (let i = 0; i < route.length; i++) {
    const z = zones.get(route[i]); assert(z);
    if (care && z.id === d.health.zone && !cared) {
      seconds += Math.abs(x - d.health.x) / walk + d.health.seconds;
      x = d.health.x; cared = true;
    }
    if (i === route.length - 1) {
      if (z.id === d.target) seconds += Math.abs(x - d.classDoorX) / walk;
      break;
    }
    const e = z.exits.find(e => e.to === route[i+1]); assert(e, 'route must follow a real exit');
    seconds += Math.abs(x - e.x) / walk; x = e.spawn;
  }
  return { visits: route.length, uniqueZones: new Set(route).size,
    encounters: [...new Set(route)].filter(id => zones.get(id).encounterSource !== undefined).length,
    movementAndCareSeconds: +seconds.toFixed(3), careApplied: cared };
}
const routes = Object.fromEntries(Object.entries(d.routes).map(([k,r]) => [k, measure(r, k.endsWith('WithCare'))]));
for (const [k,r] of Object.entries(routes)) if (k !== 'orientationLoop') {
  assert.equal(r.encounters, 6, 'shortcut must not remove encounters or repeat them');
  assert.equal(d.routes[k].at(-1), d.target);
}
assert(routes.known.movementAndCareSeconds < routes.discovery.movementAndCareSeconds);
// Entry coordinates are part of the state: a zone-only shortest path would be wrong.
function shortest() {
  const pending = [{id:d.start,x:d.startX,cost:0,route:[d.start]}], best = new Map();
  let answer = null;
  while (pending.length) {
    pending.sort((a,b) => a.cost-b.cost);
    const s = pending.shift(), key = `${s.id}:${s.x}`;
    if ((best.get(key) ?? Infinity) <= s.cost) continue;
    best.set(key,s.cost);
    if (s.id === d.target) {
      const cost = s.cost + Math.abs(s.x-d.classDoorX)/walk;
      if (!answer || cost < answer.cost) answer = {...s,cost};
      continue;
    }
    for (const e of zones.get(s.id).exits) pending.push({id:e.to,x:e.spawn,
      cost:s.cost+Math.abs(s.x-e.x)/walk, route:[...s.route,e.to]});
  }
  return answer;
}
const optimal = shortest();
assert.deepEqual(optimal.route,d.routes.known,'the advertised route must actually be the shortest walk');
assert(Math.abs(optimal.cost-routes.known.movementAndCareSeconds)<0.001);
const delta = (a,b) => +(routes[a].movementAndCareSeconds - routes[b].movementAndCareSeconds).toFixed(3);
const report = { status: d.status,
  method: 'Static proposed graph, exact entry/exit offsets at current walk speed. No combat, hesitation, human comprehension or actual gameplay simulated.',
  zones: zones.size, levels: 2, encountersFromExistingBruel: expected, routes,
  branchZones:d.zones.filter(z=>z.exits.length>=3).map(z=>z.id),
  knownRouteSavingSeconds: delta('discovery','known'),
  careExtraDiscoverySeconds: delta('discoveryWithCare','discovery'),
  careExtraKnownSeconds: delta('knownWithCare','known'),
  wrongTurnExtraSeconds: delta('correctedWrongTurn','known') };
if(process.argv[3] !== '-') fs.writeFileSync(path.join(__dirname, process.argv[3] ?? 'bruel-navigation-measures.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
console.log('PASS design graph: valid destinations/spawns, returns, explicit floor changes, reachable optional care, real loop, six existing common encounters and shorter known route. Not an implementation test.');
