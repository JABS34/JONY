// Botones rapidos: "¿que quieres hacer hoy?"
import { byId, el } from '../core/dom.js';
import { say, sayComingSoon, openModule } from '../core/assistant.js';
import * as sound from '../core/sound.js';

const ACTIONS = [
  { label: 'Ver mi portafolio', hint: 'Proyectos, habilidades y certificados', phase: null, run: () => openModule('open-portfolio') },
  { label: 'Estado del sistema', hint: 'Módulos, servidor y errores', phase: null, run: () => openModule('open-diagnostics') },
  { label: 'Organizar mi día', hint: 'Tareas, agenda y recordatorios', phase: 4, run: () => sayComingSoon('Organizar tu día', 4) },
  { label: 'Estudiar', hint: 'Resúmenes, quizzes y flashcards', phase: 5, run: () => sayComingSoon('El modo estudio', 5) },
  { label: 'Trabajar en un proyecto', hint: 'Código, diagramas y documentos', phase: 6, run: () => sayComingSoon('El trabajo con código y documentos', 6) },
  { label: 'Conversar con JONY', hint: 'Preguntas libres con IA', phase: 3, run: () => sayComingSoon('La conversación con IA', 3) },
];

export function init() {
  const list = byId('quick-list');
  list.replaceChildren();
  for (const action of ACTIONS) {
    const tag = el('span', { class: 'action-tag' + (action.phase ? '' : ' ready'), text: action.phase ? 'Fase ' + action.phase : 'Listo' });
    const button = el(
      'button',
      {
        class: 'action',
        attrs: { type: 'button' },
        on: {
          click: () => {
            sound.play('ping');
            Promise.resolve(action.run()).catch(() => say('No pude completar esa acción.'));
          },
        },
      },
      [
        el('span', { class: 'action-main' }, [
          el('span', { class: 'action-label', text: action.label }),
          el('span', { class: 'action-hint', text: action.hint }),
        ]),
        tag,
      ]
    );
    list.append(el('li', {}, button));
  }
}
