const fs = require('fs'), vm = require('vm'), assert = require('assert');
const files = fs.readdirSync('.').filter(f => /^Jouer-.+\.html$/.test(f) && !/\d\.\d/.test(f));
const main = fs.readFileSync('Jouer-Technoprof.html', 'utf8');
const day = fs.readFileSync('Jouer-Technoprof-Journee-Atelier.html', 'utf8');
assert(!/<script\b[^>]*\ssrc=/i.test(main), 'standalone must not depend on an external script');
assert(!/<script\b[^>]*\ssrc=/i.test(day), 'complete day stays autonomous');
assert(Buffer.byteLength(day) < Buffer.byteLength(main) * 0.85, 'day must omit actual historical image payload');
const ateliers = {
 'Jouer-Technoprof-Atelier-Bruel.html':'bruel-navigation',
 'Jouer-Technoprof-Atelier-Bruel-A2.html':'bruel-navigation-a2',
 'Jouer-Technoprof-Atelier-Bruel-A3.html':'bruel-navigation-a3',
 'Jouer-Technoprof-Atelier-Hanouna-H1.html':'hanouna-navigation-h1',
 'Jouer-Technoprof-Atelier-InShape-I1.html':'inshape-navigation-i1',
 'Jouer-Technoprof-Atelier-InShape-I2.html':'inshape-navigation-i2',
};
let total = Buffer.byteLength(main)+Buffer.byteLength(day), count = 0;
for (const file of files.filter(f => !['Jouer-Technoprof.html','Jouer-Technoprof-Journee-Atelier.html'].includes(f))) {
  const html = fs.readFileSync(file, 'utf8');
  assert(Buffer.byteLength(html) < 2048, file + ' must not duplicate the assets');
  total += Buffer.byteLength(html); count++;
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  for (const search of ['', '?vue=fx-parent', '?essai=voiture', '?scenario=road&foo=1']) {
    let destination;
    vm.runInNewContext(script, {URLSearchParams, location: {search, hash: '#test', replace(url){destination=url;}}});
    const url = new URL(destination, 'file:///C:/jeu/' + file);
    assert.equal(url.pathname, '/C:/jeu/Jouer-Technoprof.html');
    assert(url.searchParams.get('essai'));assert.equal(url.hash, '#test');
    if(search.includes('vue'))assert.equal(url.searchParams.get('vue'),'fx-parent');
    if(search.includes('voiture'))assert.equal(url.searchParams.get('essai'),'voiture');
    if(search.includes('scenario=road'))assert.equal(url.searchParams.get('scenario'),'road');
    if(ateliers[file]&&!search.includes('essai=voiture')){
      assert.equal(url.searchParams.get('essai'),'labo');
      if(!search.includes('scenario=road'))assert.equal(url.searchParams.get('scenario'),ateliers[file]);
    }
  }
}
assert.equal(count,19);assert(total < Buffer.byteLength(main)+Buffer.byteLength(day) + 40000);
console.log('PASS two autonomous HTMLs, 19 small local shortcuts, query/hash preservation; ' + total + ' bytes total');
