// Comandos de texto locales (Fase 1). En la Fase 2 se podran decir por voz con las mismas reglas.
import { byId } from '../core/dom.js';
import { say, echoUser, sayComingSoon, openModule } from '../core/assistant.js';
import * as sound from '../core/sound.js';
import * as panels from '../core/panels.js';
import { CONFIG } from '../core/config.js';

const MAX_LENGTH = 200;

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fmt(options) {
  try {
    return new Intl.DateTimeFormat('es-EC', options);
  } catch {
    return new Intl.DateTimeFormat('es', options);
  }
}

// El orden importa: las reglas mas especificas van primero.
const INTENTS = [
  { re: /\b(ayuda|que puedes|comandos|opciones)\b/, run: () => say('Puedes decirme: "ver portafolio", "estado del sistema", "qué hora es", "qué día es", "silencio" o "activar voz". Pronto: agenda, estudio y conversación con IA.') },
  { re: /\b(activar|activa|encender|enciende|con) (el )?(sonido|voz)\b|\bunmute\b/, run: () => { sound.setMuted(false); sound.play('ping'); return say('Voz y sonidos activados.'); } },
  { re: /\b(silencio|silenciar|callate|mute|sin voz|sin sonido)\b/, run: () => { sound.setMuted(true); return say('Voz y sonidos silenciados.', { voice: false }); } },
  { re: /\b(hora)\b/, run: () => say('Son las ' + fmt({ hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) + '.') },
  { re: /\b(fecha|que dia|dia es|dia estamos)\b/, run: () => say('Hoy es ' + fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()) + '.') },
  { re: /\b(portafolio|portfolio|proyectos?|certificados?|curriculum|cv|habilidades)\b/, run: () => openModule('open-portfolio') },
  { re: /\b(diagnostico|estado|sistema|errores|modulos)\b/, run: () => openModule('open-diagnostics') },
  { re: /\b(cerrar|volver|inicio|atras)\b/, run: () => { panels.close(); return say('Listo, volvemos al inicio.'); } },
  { re: /\b(tareas?|agenda|recordatorios?|calendario|habitos?)\b/, run: () => sayComingSoon('La agenda y los recordatorios', 4) },
  { re: /\b(estudi\w*|quiz|flashcards?|resumen|resumir|estadistica)\b/, run: () => sayComingSoon('El modo estudio', 5) },
  { re: /\b(codigo|programar|programa|diagrama|documento|informe)\b/, run: () => sayComingSoon('El trabajo con código y documentos', 6) },
  { re: /\b(conversar|charlar|hablar|pregunta)\b/, run: () => sayComingSoon('La conversación con IA', 3) },
  { re: /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|jony|que tal)\b/, run: () => say('Hola, ' + CONFIG.userName + '. ¿En qué te ayudo?') },
];

export async function handle(raw) {
  const text = String(raw).trim().slice(0, MAX_LENGTH);
  if (!text) return;
  echoUser(text);
  sound.play('ping');
  const clean = normalize(text);
  const intent = INTENTS.find((i) => i.re.test(clean));
  if (!intent) {
    sound.play('error');
    return say('Todavía no entiendo eso. Escribe "ayuda" para ver lo que puedo hacer. Con la IA de la Fase 3 podré conversar de verdad.');
  }
  return intent.run();
}

export function init() {
  const form = byId('cmd-form');
  const input = byId('cmd-input');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value;
    input.value = '';
    Promise.resolve(handle(value)).catch(() => say('Algo salió mal con ese comando.'));
  });
}
