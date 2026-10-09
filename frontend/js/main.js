// Punto de entrada. Cada pieza se inicia por separado y se registra para el diagnostico.
import { byId } from './core/dom.js';
import { report, logError, installGlobalHandlers } from './core/registry.js';
import * as sound from './core/sound.js';
import * as speech from './core/speech.js';
import * as particles from './core/particles.js';
import * as panels from './core/panels.js';
import * as hud from './core/hud.js';
import * as boot from './core/boot.js';
import * as moduleLoader from './core/moduleLoader.js';
import { checkHealth } from './core/server-check.js';
import { say, greetingFor } from './core/assistant.js';

installGlobalHandlers();

function guard(id, name, file, fn, optional = false) {
  const t0 = performance.now();
  try {
    fn();
    report(id, name, file, 'ok', '', performance.now() - t0);
    return true;
  } catch (err) {
    report(id, name, file, optional ? 'warn' : 'error', err && err.message, performance.now() - t0);
    return false;
  }
}

function showFatal() {
  const fatal = document.getElementById('fatal');
  const bootEl = document.getElementById('boot');
  if (bootEl) bootEl.hidden = true;
  if (fatal) fatal.hidden = false;
}

async function start() {
  guard('hud', 'Panel de sistema', 'frontend/js/core/hud.js', () => hud.init());
  guard('panels', 'Paneles', 'frontend/js/core/panels.js', () => panels.init());
  guard('sound', 'Sonidos', 'frontend/js/core/sound.js', () => sound.init(), true);
  guard('speech', 'Voz de JONY', 'frontend/js/core/speech.js', () => speech.init(), true);
  guard('particles', 'Fondo de partículas', 'frontend/js/core/particles.js', () => particles.start(byId('bg')), true);

  try {
    await boot.runBoot(async (log, progress) => {
      await moduleLoader.loadAll(log, progress);
      log('Conectando con el servidor');
      const online = await checkHealth();
      log(online ? 'Servidor en línea' : 'Servidor sin conexión', online ? 'ok' : 'err');
    });
  } catch (err) {
    // Si la animacion falla, la app sigue: solo se pierde el efecto.
    logError('boot.js', err && err.message);
    const bootEl = document.getElementById('boot');
    if (bootEl) bootEl.remove();
    await Promise.all([moduleLoader.loadAll(() => {}, () => {}), checkHealth()]);
  }

  document.body.classList.remove('booting');
  document.body.classList.add('ready');
  window.__JONY_READY__ = true;
  say(greetingFor());
}

start().catch((err) => {
  logError('main.js', err && err.message);
  showFatal();
});
