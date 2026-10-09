// Registro central: que componente cargo bien, cual fallo y en que archivo.
// Lo lee el panel de diagnostico.
const items = new Map();
const errors = [];
const listeners = new Set();
const MAX_ERRORS = 20;

function notify() {
  for (const fn of listeners) {
    try { fn(); } catch { /* un oyente roto no debe afectar a los demas */ }
  }
}

export function report(id, name, file, status, detail = '', ms = 0) {
  items.set(id, { id, name, file, status, detail: String(detail || ''), ms: Math.round(ms) });
  notify();
}

export function all() {
  return [...items.values()];
}

export function logError(source, message) {
  errors.unshift({ source: String(source), message: String(message || 'Error desconocido'), at: new Date() });
  if (errors.length > MAX_ERRORS) errors.length = MAX_ERRORS;
  notify();
}

export function errorList() {
  return errors.slice();
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function shortFile(path) {
  try {
    return new URL(path).pathname.replace(/^\/+/, '');
  } catch {
    return String(path || '');
  }
}

export function installGlobalHandlers() {
  window.addEventListener('error', (event) => {
    const where = event.filename ? shortFile(event.filename) + ':' + event.lineno : 'script';
    logError(where, event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    logError('promesa', reason && reason.message ? reason.message : reason);
  });
}
