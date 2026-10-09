'use strict';
// Levanta el servidor en un puerto libre y prueba rutas, cabeceras y defensas.
// Uso: npm run smoke
const http = require('http');
const { createApp } = require('../backend/server');

function request(port, path, { method = 'GET', host } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method, headers: { Host: host || 'localhost:' + port } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

const failures = [];
let count = 0;
function expect(name, cond, extra = '') {
  count++;
  if (!cond) failures.push(name + (extra ? ' -> ' + extra : ''));
}

(async () => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const { port } = server.address();
  try {
    const home = await request(port, '/');
    expect('GET / responde 200', home.status === 200, home.status);
    expect('index contiene JONY', home.body.includes('JONY'));
    const csp = home.headers['content-security-policy'] || '';
    expect('CSP presente y sin unsafe-inline', csp.includes("default-src 'self'") && !csp.includes('unsafe-inline'), csp);
    expect('CSP bloquea frames ajenos', csp.includes("frame-ancestors 'none'"));
    expect('nosniff', home.headers['x-content-type-options'] === 'nosniff');
    expect('sin x-powered-by', !home.headers['x-powered-by']);
    expect('Permissions-Policy', Boolean(home.headers['permissions-policy']));

    const health = await request(port, '/api/health');
    expect('health 200', health.status === 200);
    expect('health ok:true', JSON.parse(health.body).ok === true);

    const pf = await request(port, '/api/portfolio');
    const pfJson = JSON.parse(pf.body);
    expect('portfolio 200', pf.status === 200, pf.status);
    expect('portfolio tiene listas', Array.isArray(pfJson.skills) && Array.isArray(pfJson.projects));

    for (const p of ['/js/main.js', '/js/core/boot.js', '/js/modules/diagnostics.js', '/js/portfolio/portfolio.js', '/css/core/hud.css']) {
      const r = await request(port, p);
      expect('estatico ' + p, r.status === 200, r.status);
    }
    const js = await request(port, '/js/main.js');
    expect('JS con tipo correcto', /javascript/.test(js.headers['content-type'] || ''), js.headers['content-type']);

    expect('/api desconocido = 404 JSON', (await request(port, '/api/nada')).status === 404);
    expect('ruta desconocida = 404', (await request(port, '/nada')).status === 404);

    // Ataques tipicos
    for (const p of ['/../package.json', '/%2e%2e/package.json', '/..%2fpackage.json', '/js/../../backend/server.js', '/%00', '/.env', '/backend/server.js', '/package.json']) {
      const r = await request(port, p);
      expect('bloquea ' + p, r.status >= 400 && !r.body.includes('"name": "jony"') && !r.body.includes('createApp'), r.status);
    }
    expect('Host falso = 421', (await request(port, '/', { host: 'evil.example.com' })).status === 421);
    expect('POST = 405', (await request(port, '/api/health', { method: 'POST' })).status === 405);
    expect('DELETE = 405', (await request(port, '/', { method: 'DELETE' })).status === 405);

    // Limite de peticiones (120/min en /api)
    let limited = false;
    for (let i = 0; i < 130 && !limited; i++) limited = (await request(port, '/api/health')).status === 429;
    expect('rate limit activo', limited);
  } finally {
    server.close();
  }
  if (failures.length) {
    console.error('\nFallaron ' + failures.length + ' de ' + count + ' pruebas:\n');
    for (const f of failures) console.error(' - ' + f);
    process.exit(1);
  }
  console.log('Pruebas de humo OK (' + count + ' pruebas).');
})().catch((e) => { console.error(e); process.exit(1); });
