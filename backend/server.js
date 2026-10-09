'use strict';
const express = require('express');
const config = require('./config');
const { applySecurity } = require('./middleware/security');
const healthRoute = require('./routes/health');
const portfolioRoute = require('./routes/portfolio');

function createApp() {
  const app = express();
  app.disable('x-powered-by');

  applySecurity(app);

  app.use('/api', healthRoute);
  app.use('/api', portfolioRoute);
  app.use('/api', (req, res) => res.status(404).json({ error: 'No encontrado' }));

  app.use(
    express.static(config.FRONTEND_DIR, {
      dotfiles: 'ignore',
      index: 'index.html',
      etag: true,
      setHeaders(res) {
        // Revalida siempre (rapido por ETag/304) para que tus cambios se vean al recargar.
        res.setHeader('Cache-Control', 'no-cache');
      },
    })
  );

  app.use((req, res) => res.status(404).type('text/plain').send('404 - No encontrado'));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = Number(err && (err.status || err.statusCode));
    if (status >= 400 && status < 500) {
      return res.status(status).json({ error: 'Solicitud no valida' });
    }
    console.error('[error]', err && err.message ? err.message : err);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

function start() {
  const app = createApp();
  const server = app.listen(config.PORT, config.HOST, () => {
    const { port } = server.address();
    console.log('');
    console.log('  JONY en linea  ->  http://localhost:' + port);
    console.log('  (Ctrl+C para apagar)');
    console.log('');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('El puerto ' + config.PORT + ' ya esta en uso. Cierra el otro programa o usa otro puerto:');
      console.error('  Windows (cmd):  set PORT=3100 && npm start');
    } else {
      console.error('No se pudo iniciar el servidor:', err.message);
    }
    process.exit(1);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return server;
}

if (require.main === module) start();

module.exports = { createApp, start };
