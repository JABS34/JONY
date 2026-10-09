// Animacion de arranque. Las lineas que se muestran son el estado REAL de la carga.
import { byId, el, sleep, reducedMotion } from './dom.js';
import { CONFIG } from './config.js';
import * as sound from './sound.js';

export async function runBoot(loadTask) {
  const root = byId('boot');
  const list = byId('boot-lines');
  const bar = byId('boot-bar');
  const skipBtn = byId('boot-skip');
  const fast = reducedMotion();
  let skipped = false;
  let chain = Promise.resolve();

  const skip = () => { skipped = true; };
  const onKey = (event) => { if (event.key === 'Escape') skip(); };
  skipBtn.addEventListener('click', skip);
  window.addEventListener('keydown', onKey);
  skipBtn.focus({ preventScroll: true });

  const pause = (ms) => (skipped || fast ? Promise.resolve() : sleep(ms));

  // Las lineas se encolan para mostrarse con ritmo aunque lleguen todas juntas.
  const log = (text, state = '') => {
    chain = chain.then(async () => {
      list.append(el('li', { class: state, text }));
      while (list.children.length > 7) list.firstElementChild.remove();
      await pause(170);
    });
  };
  const progress = (fraction) => {
    bar.style.width = Math.round(Math.max(0, Math.min(1, fraction)) * 100) + '%';
  };

  const started = performance.now();
  sound.play('boot');
  log('Iniciando núcleo de ' + CONFIG.assistantName);
  progress(0.1);

  const overall = new Promise((resolve) => setTimeout(resolve, CONFIG.bootMaxMs));
  await Promise.race([loadTask(log, progress), overall]);

  log('Sistema en línea', 'ok');
  progress(1);
  await chain;

  // Duracion minima para que la animacion se aprecie (se puede saltar).
  while (!skipped && !fast && performance.now() - started < CONFIG.bootMinMs) await sleep(50);

  root.classList.add('done');
  await pause(550);
  window.removeEventListener('keydown', onKey);
  skipBtn.removeEventListener('click', skip);
  root.remove();
  sound.play('online');
}
