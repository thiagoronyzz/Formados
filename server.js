import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { handleMarket } from './lib/market.js';

const port = process.env.PORT || 3000;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/search' || url.pathname === '/api/quotes') {
    return handleMarket(req, res, url.pathname);
  }
  try {
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!['/index.html', '/style.css', '/app.js'].includes(path)) throw new Error();
    const body = await readFile(join(process.cwd(), path));
    res.writeHead(200, {'Content-Type':types[extname(path)] || 'application/octet-stream'});
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '0.0.0.0', () => console.log(`Moneta running on ${port}`));
