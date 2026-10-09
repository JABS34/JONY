// Panel de diagnostico: que cargo, que fallo y en que archivo.
import { byId, el } from '../core/dom.js';
import { bus } from '../core/bus.js';
import * as panels from '../core/panels.js';
import * as registry from '../core/registry.js';
import { checkHealth } from '../core/server-check.js';
import { say } from '../core/assistant.js';
import { CONFIG } from '../core/config.js';

const STATUS_TEXT = { ok: 'Listo', error: 'Falló', warn: 'Aviso' };
let unsubscribe = null;

function capabilities() {
  const media = Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  return [
    ['Voz de JONY (síntesis)', 'speechSynthesis' in window],
    ['Escucha por voz (Fase 2)', 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window],
    ['Micrófono (Fase 2)', media],
    ['Cámara (Fase 7)', media],
    ['Sonidos', Boolean(window.AudioContext || window.webkitAudioContext)],
    ['Almacenamiento local', (() => { try { return Boolean(window.localStorage); } catch { return false; } })()],
  ];
}

function render() {
  const body = byId('diag-body');
  const items = registry.all();
  const errors = registry.errorList();

  const rows = items.map((i) =>
    el('tr', {}, [
      el('th', { attrs: { scope: 'row' }, text: i.name }),
      el('td', { class: 'file', text: i.file }),
      el('td', {}, el('span', { class: 'badge ' + i.status, text: STATUS_TEXT[i.status] || i.status })),
      el('td', { class: 'num', text: i.ms ? i.ms + ' ms' : '—' }),
      el('td', { class: 'detail', text: i.detail || '' }),
    ])
  );

  const table = el('div', { class: 'table-wrap' }, el('table', { class: 'diag' }, [
    el('thead', {}, el('tr', {}, ['Componente', 'Archivo', 'Estado', 'Tiempo', 'Detalle'].map((h) => el('th', { attrs: { scope: 'col' }, text: h })))),
    el('tbody', {}, rows),
  ]));

  const caps = el('ul', { class: 'caps' }, capabilities().map(([name, ok]) =>
    el('li', {}, [el('span', { text: name }), el('span', { class: 'badge ' + (ok ? 'ok' : 'warn'), text: ok ? 'Disponible' : 'No disponible' })])
  ));

  const errBlock = errors.length
    ? el('ul', { class: 'errors' }, errors.map((e) =>
        el('li', {}, [
          el('span', { class: 'file', text: e.source }),
          el('span', { text: e.message }),
        ])
      ))
    : el('p', { class: 'muted', text: 'Sin errores registrados.' });

  const hadFocus = document.activeElement && document.activeElement.id === 'diag-recheck';
  const recheck = el('button', {
    class: 'btn',
    attrs: { type: 'button', id: 'diag-recheck' },
    text: 'Volver a comprobar el servidor',
    on: { click: async () => { await checkHealth(); } },
  });

  body.replaceChildren(
    el('p', { class: 'muted', text: CONFIG.assistantName + ' ' + CONFIG.version + '. Si algo falla, busca aquí el archivo exacto.' }),
    el('h3', { text: 'Componentes' }),
    table,
    recheck,
    el('h3', { text: 'Capacidades del navegador' }),
    caps,
    el('h3', { text: 'Errores recientes' }),
    errBlock
  );
  if (hadFocus) recheck.focus({ preventScroll: true });
}

function open() {
  panels.open('panel-diag');
  render();
  if (unsubscribe) unsubscribe();
  unsubscribe = registry.onChange(render);
  const summary = registry.all();
  const failed = summary.filter((i) => i.status === 'error');
  say(failed.length
    ? 'Hay ' + failed.length + ' componente' + (failed.length > 1 ? 's' : '') + ' con fallos. El detalle está en pantalla.'
    : 'Todo funciona correctamente.');
}

export function init() {
  bus.on('open-diagnostics', open);
  bus.on('panel-closed', () => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  });
}
