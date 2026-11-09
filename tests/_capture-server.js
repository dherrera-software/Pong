const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'dist');
const server = http.createServer((req, res) => {
  let filePath = path.join(root, req.url === '/' ? 'index.html' : decodeURI(req.url));
  const normalizedRoot = path.normalize(root);
  const normalizedFile = path.normalize(filePath);
  if (!normalizedFile.startsWith(normalizedRoot + path.sep) && normalizedFile !== normalizedRoot) {
    res.writeHead(403); res.end('forbidden'); return;
  }
  const ext = path.extname(normalizedFile).toLowerCase();
  fs.exists(normalizedFile, exists => {
    if (!exists) filePath = path.join(root, 'index.html');
    const ct = ext === '.html' ? 'text/html' : ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : ext === '.png' ? 'image/png' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': ct });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(8081, '127.0.0.1', () => console.log('Servidor listo en http://127.0.0.1:8081'));
server.on('error', err => { console.error('Error servidor:', err); process.exit(1); });
