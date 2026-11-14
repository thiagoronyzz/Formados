export async function handleMarket(req, res, pathname) {
  const url = new URL(req.url, 'http://localhost');
    const query = url.searchParams.get(pathname === '/api/search' ? 'q' : 'symbols') || '';
    if (!query || query.length > 300) { res.writeHead(400); return res.end('{}'); }
    if (pathname === '/api/quotes') {
      try {
        const symbols = query.split(',').slice(0, 30);
        const getChart = async symbol => { const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`, {headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(7000)}); if (!r.ok) throw new Error(); return (await r.json()).chart.result[0].meta; };
        const results = await Promise.allSettled([...symbols.map(getChart), getChart('USDBRL=X')]);
        const exchange = results.pop(); const usd = exchange.status === 'fulfilled' ? exchange.value.regularMarketPrice : null;
        const quotes = results.map((r,i) => { if (r.status !== 'fulfilled') return null; const m = r.value; const rate = m.currency === 'BRL' ? 1 : m.currency === 'USD' ? usd : null; return rate && Number.isFinite(m.regularMarketPrice) ? {symbol:symbols[i],price:m.regularMarketPrice * rate,currency:m.currency,marketTime:m.regularMarketTime} : null; }).filter(Boolean);
        res.writeHead(200, {'Content-Type':'application/json','Cache-Control':'no-store'}); return res.end(JSON.stringify({quotes}));
      } catch { res.writeHead(503, {'Content-Type':'application/json'}); return res.end(JSON.stringify({error:'Serviço de cotações indisponível no momento.'})); }
    }
    const endpoint = pathname === '/api/search'
      ? `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`
      : `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(query)}`;
    try {
      const response = await fetch(endpoint, {headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(7000)});
      if (!response.ok) throw new Error('provider unavailable');
      const data = await response.json();
      res.writeHead(200, {'Content-Type':'application/json','Cache-Control':'no-store'}); return res.end(JSON.stringify(data));
    } catch { res.writeHead(503, {'Content-Type':'application/json'}); return res.end(JSON.stringify({error:'Serviço de cotações indisponível no momento.'})); }
}
