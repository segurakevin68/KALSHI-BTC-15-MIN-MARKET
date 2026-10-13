exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const path = params.path || '/markets';
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { 'content-type': 'application/json', 'allow': 'GET' }, body: JSON.stringify({ error: 'GET only' }) };
  }
  // Only allow market list and individual market lookups; never accept a caller-supplied host.
  if (!(path === '/markets' || /^\/markets\/[A-Za-z0-9._-]+$/.test(path))) {
    return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Unsupported Kalshi API path' }) };
  }
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'path' && value != null && /^[A-Za-z0-9_]+$/.test(key)) query.set(key, value);
  }
  const url = `https://external-api.kalshi.com/trade-api/v2${path}${query.toString() ? `?${query}` : ''}`;
  try {
    const upstream = await fetch(url, { headers: { accept: 'application/json' } });
    const body = await upstream.text();
    return {
      statusCode: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' },
      body
    };
  } catch (error) {
    return { statusCode: 502, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify({ error: 'Kalshi upstream request failed', detail: String(error && error.message || error) }) };
  }
};
