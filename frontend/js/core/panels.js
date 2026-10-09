// Paneles laterales (portafolio, diagnostico). Manejan foco, Escape y fondo bloqueado.
import { byId } from './dom.js';
import { bus } from './bus.js';
import * as sound from './sound.js';

let current = null;
let lastFocus = null;

export function init() {
  byId('scrim').addEventListener('click', close);
  for (const panel of document.querySelectorAll('.panel')) {
    const btn = panel.querySelector('.panel-close');
    if (btn) btn.addEventListener('click', close);
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && current) {
      event.preventDefault();
      close();
    }
  });
}

export function open(id) {
  const panel = byId(id);
  if (current === panel) return panel;
  if (current) hide(current);
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  panel.hidden = false;
  byId('scrim').hidden = false;
  byId('stage').inert = true;
  document.body.classList.add('panel-open');
  current = panel;
  const closeBtn = panel.querySelector('.panel-close');
  if (closeBtn) closeBtn.focus({ preventScroll: true });
  sound.play('open');
  return panel;
}

function hide(panel) {
  panel.hidden = true;
}

export function close() {
  if (!current) return;
  hide(current);
  current = null;
  byId('scrim').hidden = true;
  byId('stage').inert = false;
  document.body.classList.remove('panel-open');
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  lastFocus = null;
  sound.play('close');
  bus.emit('panel-closed');
}

export function isOpen() {
  return current !== null;
}
