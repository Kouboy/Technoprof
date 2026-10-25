// Composer cue sheets derived from the very durations played by the game.
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/cinematic.ts'), 'utf8').replace(/export /g, '');
const scope = {};
vm.createContext(scope);
vm.runInContext(stripTypeScriptTypes(source) + ';this.timecodes=cinematicTimecodes;', scope);
const timecode = seconds => {
  const ms = Math.round(seconds * 1000), s = Math.floor(ms / 1000);
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') + '.' + String(ms % 1000).padStart(3, '0');
};
const dir = path.join(root, 'docs/cinematiques');
fs.mkdirSync(dir, { recursive: true });
for (const kind of ['intro', 'ending']) {
  const rows = scope.timecodes(kind);
  const lines = ['scene,start,end,seconds,cue', ...rows.map(p => [p.id,timecode(p.start),timecode(p.end),p.seconds,p.cue].join(','))];
  fs.writeFileSync(path.join(dir, 'timecodes-' + kind + '.csv'), lines.join('\n') + '\n');
  console.log(kind + ': ' + rows.length + ' scenes, ' + rows.at(-1).end + ' seconds');
}
