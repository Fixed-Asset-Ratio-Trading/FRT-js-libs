// Minimal CORS proxy for browser RPC access to local validators
// Usage:
//   TARGET_RPC=http://192.168.2.88:8899 PORT=8787 node examples/dev-proxy.js
// Then in the demo page, set CORS Proxy to: http://localhost:8787

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const DEFAULT_TARGET = process.env.TARGET_RPC || 'http://192.168.2.88:8899';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  // For Private Network Access (Chrome)
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
}

function getTargetFromReq(req) {
  try {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    const path = reqUrl.pathname || '/';
    // Supported styles:
    // 1) /rpc -> DEFAULT_TARGET
    // 2) /http://host:port -> absolute target in path
    // 3) /proxy?target=<encoded-absolute-url>
    if (path === '/rpc') return new URL(DEFAULT_TARGET);
    if (path.startsWith('/http://') || path.startsWith('/https://')) {
      return new URL(path.slice(1));
    }
    const t = reqUrl.searchParams.get('target');
    if (t) return new URL(t);
    return new URL(DEFAULT_TARGET);
  } catch (e) {
    return new URL(DEFAULT_TARGET);
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.writeHead(204).end();
    return;
  }

  const targetUrl = getTargetFromReq(req);
  const isHttps = targetUrl.protocol === 'https:';

  const headers = { ...req.headers };
  // Remove hop-by-hop headers
  delete headers['host'];
  delete headers['origin'];
  delete headers['referer'];

  const options = {
    protocol: targetUrl.protocol,
    hostname: targetUrl.hostname,
    port: targetUrl.port || (isHttps ? 443 : 80),
    method: req.method,
    path: targetUrl.pathname + (targetUrl.search || ''),
    headers,
  };

  const proxyReq = (isHttps ? https : http).request(options, (proxyRes) => {
    setCors(res);
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    setCors(res);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`CORS proxy listening on http://localhost:${PORT}`);
  console.log(`Default target: ${DEFAULT_TARGET} (override with TARGET_RPC env var)`);
});


