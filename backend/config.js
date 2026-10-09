'use strict';
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function parsePort(value) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n >= 0 && n < 65536 ? n : 3000;
}

// Solo se aceptan peticiones dirigidas a estos nombres de host.
// Evita ataques de "DNS rebinding" contra un servidor que corre en tu PC.
const extraHosts = String(process.env.ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

module.exports = Object.freeze({
  ROOT,
  FRONTEND_DIR: path.join(ROOT, 'frontend'),
  DATA_DIR: path.join(__dirname, 'data'),
  PORT: parsePort(process.env.PORT),
  // 127.0.0.1 = solo tu computadora. Cambia HOST solo si sabes lo que haces.
  HOST: process.env.HOST || '127.0.0.1',
  VERSION: require('../package.json').version,
  ALLOWED_HOSTS: Object.freeze(['localhost', '127.0.0.1', '[::1]', ...extraHosts]),
});
