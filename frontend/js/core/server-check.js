// Comprobacion del servidor (backend). La usan el arranque y el diagnostico.
import { CONFIG } from './config.js';
import { report } from './registry.js';

export async function checkHealth() {
  const t0 = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.apiTimeoutMs);
  try {
    const res = await fetch('/api/health', { signal: controller.signal, cache: 'no-store', credentials: 'same-origin' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!json || json.ok !== true) throw new Error('Respuesta inesperada del servidor');
    report('server', 'Servidor', 'backend/server.js', 'ok', 'v' + json.version, performance.now() - t0);
    return true;
  } catch (err) {
    const detail = err && err.name === 'AbortError' ? 'Sin respuesta (tiempo agotado)' : (err && err.message) || 'Sin conexion';
    report('server', 'Servidor', 'backend/server.js', 'error', detail, performance.now() - t0);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
