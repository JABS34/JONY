// Carga cada modulo por separado: si uno falla, los demas siguen y el diagnostico dice cual.
import { CONFIG } from './config.js';
import { withTimeout } from './dom.js';
import { report } from './registry.js';

// Para agregar un modulo nuevo en una fase futura: anadelo aqui y crea su archivo.
export const MANIFEST = [
  { id: 'quick-actions', name: 'Botones rápidos', path: 'frontend/js/modules/quick-actions.js', load: () => import('../modules/quick-actions.js') },
  { id: 'commands',      name: 'Comandos de texto', path: 'frontend/js/modules/commands.js',      load: () => import('../modules/commands.js') },
  { id: 'portfolio',     name: 'Portafolio',       path: 'frontend/js/portfolio/portfolio.js',    load: () => import('../portfolio/portfolio.js') },
  { id: 'diagnostics',   name: 'Diagnóstico',      path: 'frontend/js/modules/diagnostics.js',    load: () => import('../modules/diagnostics.js') },
];

export async function loadAll(log, progress) {
  let done = 0;
  log('Cargando módulos');
  await Promise.all(
    MANIFEST.map(async (mod) => {
      const t0 = performance.now();
      try {
        const loaded = await withTimeout(mod.load(), CONFIG.moduleTimeoutMs, 'La carga de ' + mod.path);
        if (typeof loaded.init !== 'function') throw new Error('El archivo no exporta init()');
        await withTimeout(Promise.resolve(loaded.init()), CONFIG.moduleTimeoutMs, 'init() de ' + mod.path);
        report(mod.id, mod.name, mod.path, 'ok', '', performance.now() - t0);
        log(mod.name, 'ok');
      } catch (err) {
        const message = err && err.message ? err.message : 'Error desconocido';
        report(mod.id, mod.name, mod.path, 'error', message, performance.now() - t0);
        log(mod.name + ': falló', 'err');
      } finally {
        done += 1;
        progress(0.15 + (done / MANIFEST.length) * 0.65);
      }
    })
  );
}
