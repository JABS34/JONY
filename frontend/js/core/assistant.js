// Voz y texto de JONY: escribe el mensaje en pantalla, lo dice en voz alta y lo guarda en el historial.
import { byId, sleep, reducedMotion } from './dom.js';
import { CONFIG } from './config.js';
import { bus } from './bus.js';
import * as speech from './speech.js';

const history = [];
let token = 0;

export function greetingFor(date = new Date()) {
  const h = date.getHours();
  const part = h >= 5 && h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  return part + ', ' + CONFIG.userName + '. Soy ' + CONFIG.assistantName + '. ¿Qué se le ofrece hoy?';
}

export async function say(text, { voice = true } = {}) {
  const message = String(text);
  const mine = ++token;
  const line = byId('jony-line');
  byId('jony-live').textContent = message; // lectores de pantalla: el texto completo de una vez
  history.push({ from: 'jony', text: message, at: Date.now() });
  if (history.length > 100) history.shift();

  if (voice) speech.say(message);
  if (reducedMotion()) {
    line.textContent = message;
    return;
  }
  line.textContent = '';
  bus.emit('typing', true);
  for (let i = 1; i <= message.length; i++) {
    if (mine !== token) return; // llego otro mensaje: este se abandona
    line.textContent = message.slice(0, i);
    await sleep(CONFIG.typeDelayMs);
  }
  if (mine === token) bus.emit('typing', false);
}

export function echoUser(text) {
  const message = String(text);
  byId('user-line').textContent = 'Tú: ' + message;
  history.push({ from: 'user', text: message, at: Date.now() });
  if (history.length > 100) history.shift();
}

export function sayComingSoon(name, phase) {
  return say(name + ' llega en la Fase ' + phase + '. Por ahora puedo mostrarte tu portafolio o el estado del sistema.');
}

// Abre un modulo por evento; si el modulo no cargo, avisa en vez de quedarse callado.
export function openModule(eventName) {
  if (bus.has(eventName)) {
    bus.emit(eventName);
    return true;
  }
  say('Ese módulo no está disponible ahora. Abre el diagnóstico para ver qué falló.');
  return false;
}

export function getHistory() {
  return history.slice();
}
