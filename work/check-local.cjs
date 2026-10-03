const fs = require('fs'), vm = require('vm'), assert = require('assert');
const files = fs.readdirSync('.').filter(f => /^Jouer-.+\.html$/.test(f) && !/\d\.\d/.test(f));
const main = fs.readFileSync('Jouer-Technoprof.html', 'utf8');
assert(!/<script\b[^>]*\ssrc=/i.test(main), 'standalone must not depend on an external script');
let total = Buffer.byteLength(main), count = 0;
for (const file of files.filter(f => f !== 'Jouer-Technoprof.html')) {
  const html = fs.readFileSync(file, 'utf8');
  assert(Buffer.byteLength(html) < 2048, file + ' must not duplicate the assets');
  total += Buffer.byteLength(html); count++;
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  for (const search of ['', '?vue=fx-parent', '?essai=voiture']) {
    let destination;
    vm.runInNewContext(script, {URLSearchParams, location: {search, hash: '#test', replace(url){destination=url;}}});
    const url = new URL(destination, 'file:///C:/jeu/' + file);
    assert.equal(url.pathname, '/C:/jeu/Jouer-Technoprof.html');
    assert(url.searchParams.get('essai'));assert.equal(url.hash, '#test');
    if(search.includes('vue'))assert.equal(url.searchParams.get('vue'),'fx-parent');
    if(search.includes('voiture'))assert.equal(url.searchParams.get('essai'),'voiture');
  }
}
assert.equal(count,13);assert(total < Buffer.byteLength(main) + 20000);
console.log('PASS single autonomous HTML, 13 small local shortcuts, query/hash preservation; ' + total + ' bytes total');
