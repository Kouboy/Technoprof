// Build-time selection only. Original PNG bytes and complete workshop data stay
// untouched; omission is explicit rather than inferred from filenames or age.
const DAY_ASSETS = {
  'art-data': { export: 'ART_DATA', keep: ['prof', 'inspecteur'] },
  'hall-data': { export: 'HALL_DATA', keep: ['parent'] },
  'wing-data': { export: 'WING_DATA', keep: ['student'] },
  'bridge-data': { export: 'BRIDGE_DATA', keep: ['guard'] },
  'quiet-school-data': { export: 'QUIET_SCHOOL_DATA' },
  'service-data': { export: 'SERVICE_DATA' },
  'technical-data': { export: 'TECHNICAL_DATA' },
  'central-data': { export: 'CENTRAL_DATA' },
  'stair-data': { export: 'STAIR_DATA' },
  'court-data': { export: 'COURT_DATA' },
};
function selectDayAssets(id, source) {
  const match = id.replaceAll('\\', '/').match(/\/src\/([^/]+)\.ts$/);
  const rule = match && DAY_ASSETS[match[1]];
  if (!rule) return null;
  const declaration = new RegExp('^(?:\\s|//[^\\n]*\\n)*export const ' + rule.export + '\\s*=\\s*([\\s\\S]*?);?\\s*$');
  const data = source.match(declaration);
  if (!data) throw Error('Unexpected asset module: ' + id);
  // These data-only modules use identifier keys and trailing commas, but no
  // executable expressions. Parse their literals without evaluating source code.
  const literal = data[1].replace(/;$/, '')
    .replace(/([{,]\s*)([A-Za-z_][\w-]*)\s*:/g, '$1"$2":')
    .replace(/,\s*([}\]])/g, '$1');
  const original = JSON.parse(literal);
  let selected = '';
  if (rule.keep) {
    selected = {};
    for (const key of rule.keep) {
      if (typeof original[key] !== 'string' || !original[key].startsWith('data:image/'))
        throw Error('Missing required day image: ' + match[1] + '/' + key);
      selected[key] = original[key];
    }
  }
  return 'export const ' + rule.export + ' = ' + JSON.stringify(selected) + ';\n';
}
function dayDocument(html) {
  const bootstrap = /<script>\s*const testView\b[\s\S]*?<\/script>/g;
  if ([...html.matchAll(bootstrap)].length !== 1) throw Error('Day UI bootstrap not found or ambiguous');
  return html.replace(bootstrap, `<script>
// Day player bootstrap: historical URL options belong to the full workshop.
for (const id of ['developer-controls', 'developer-links', 'legacy-tests', 'pose-controls'])
  document.getElementById(id).hidden = true;
document.getElementById('player-feedback').hidden = false;
</script>`);
}
module.exports = { DAY_ASSETS, selectDayAssets, dayDocument };
