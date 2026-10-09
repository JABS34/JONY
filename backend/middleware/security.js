'use strict';
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config');

function hostnameOf(hostHeader) {
  const h = String(hostHeader || '').toLowerCase();
  if (h.startsWith('[')) {
    const end = h.indexOf(']');
    return end === -1 ? h : h.slice(0, end + 1);
  }
  return h.split(':')[0];
}

function hostGuard(req, res, next) {
  if (!config.ALLOWED_HOSTS.includes(hostnameOf(req.headers.host))) {
    return res.status(421).type('text/plain').send('Host no permitido');
  }
  next();
}

function methodGuard(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.set('Allow', 'GET, HEAD');
    return res.status(405).type('text/plain').send('Metodo no permitido');
  }
  next();
}

function permissionsPolicy(req, res, next) {
  // Micro y camara quedan reservados para las fases de voz y gestos (solo este sitio).
  res.setHeader(
    'Permissions-Policy',
    'microphone=(self), camera=(self), geolocation=(), payment=(), usb=(), serial=()'
  );
  next();
}

function applySecurity(app) {
  app.use(hostGuard);
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          mediaSrc: ["'self'"],
          workerSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'no-referrer' },
    })
  );
  app.use(permissionsPolicy);
  app.use(methodGuard);
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Demasiadas peticiones, espera un momento.' },
    })
  );
}

module.exports = { applySecurity, hostnameOf };
