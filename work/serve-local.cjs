// Optional loopback preview of the exact exported files; no npm server needed to play.
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
http.createServer((req,res) => {
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  const name = pathname === '/' ? 'Jouer-Technoprof.html' : pathname.slice(1);
  if (!/^Jouer-[A-Za-z0-9.-]+\.html$/.test(name) || !fs.existsSync(path.join(root,name))) {
    res.writeHead(404);res.end();return;
  }
  res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});
  fs.createReadStream(path.join(root,name)).pipe(res);
}).listen(5173, '127.0.0.1', () => console.log('Local exported game: http://127.0.0.1:5173'));
