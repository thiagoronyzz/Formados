import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const port = process.env.PORT || 3000;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async (req,res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/search' || url.pathname === '/api/quotes') {
    const query = url.searchParams.get(url.pathname === '/api/search' ? 'q' : 'symbols') || '';
    if (!query || query.length > 300) { res.writeHead(400); return res.end('{}'); }
    if (url.pathname === '/api/quotes') {
      try {
        const symbols = query.split(',').slice(0, 30);
        const getChart = async symbol => { const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`, {headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(7000)}); if (!r.ok) throw new Error(); return (await r.json()).chart.result[0].meta; };
        const results = await Promise.allSettled([...symbols.map(getChart), getChart('USDBRL=X')]);
        const exchange = results.pop(); const usd = exchange.status === 'fulfilled' ? exchange.value.regularMarketPrice : null;
        const quotes = results.map((r,i) => { if (r.status !== 'fulfilled') return null; const m = r.value; const rate = m.currency === 'BRL' ? 1 : m.currency === 'USD' ? usd : null; return rate && Number.isFinite(m.regularMarketPrice) ? {symbol:symbols[i],price:m.regularMarketPrice * rate,currency:m.currency,marketTime:m.regularMarketTime} : null; }).filter(Boolean);
        res.writeHead(200, {'Content-Type':'application/json','Cache-Control':'no-store'}); return res.end(JSON.stringify({quotes}));
      } catch { res.writeHead(503, {'Content-Type':'application/json'}); return res.end(JSON.stringify({error:'Serviço de cotações indisponível no momento.'})); }
    }
    const endpoint = url.pathname === '/api/search'
      ? `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`
      : `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(query)}`;
    try {
      const response = await fetch(endpoint, {headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(7000)});
      if (!response.ok) throw new Error('provider unavailable');
      const data = await response.json();
      res.writeHead(200, {'Content-Type':'application/json','Cache-Control':'no-store'}); return res.end(JSON.stringify(data));
    } catch { res.writeHead(503, {'Content-Type':'application/json'}); return res.end(JSON.stringify({error:'Serviço de cotações indisponível no momento.'})); }
  }
  try {
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!['/index.html', '/style.css', '/app.js'].includes(path)) throw new Error();
    const body = await readFile(join(process.cwd(), path));
    res.writeHead(200, {'Content-Type':types[extname(path)] || 'application/octet-stream'}); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port,'0.0.0.0',()=>console.log(`Lumina running on ${port}`));
