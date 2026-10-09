// Voz de JONY (sintesis del navegador). La escucha por microfono llega en la Fase 2.
import { bus } from './bus.js';
import * as sound from './sound.js';

const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const PREFERRED = ['es-EC', 'es-MX', 'es-US', 'es-419', 'es-CO', 'es-AR', 'es-ES'];

let voice = null;
let pending = null; // texto que el navegador no dejo decir sin un gesto previo

function pickVoice() {
  const voices = window.speechSynthesis.getVoices().filter((v) => /^es(-|_|$)/i.test(v.lang));
  if (!voices.length) { voice = null; return; }
  for (const lang of PREFERRED) {
    const found = voices.find((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
    if (found) { voice = found; return; }
  }
  voice = voices[0];
}

function flushPending() {
  if (!pending) return;
  const text = pending;
  pending = null;
  say(text);
}

export function init() {
  if (!supported) throw new Error('La voz de JONY no esta disponible en este navegador');
  pickVoice();
  window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
  bus.on('mute-changed', (isMuted) => { if (isMuted) cancel(); });
  window.addEventListener('pointerdown', flushPending, { once: true });
  window.addEventListener('keydown', flushPending, { once: true });
  window.addEventListener('pagehide', cancel);
}

export function cancel() {
  if (!supported) return;
  pending = null;
  window.speechSynthesis.cancel();
  bus.emit('speaking', false);
}

export function say(text) {
  if (!supported || sound.isMuted() || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.lang = voice ? voice.lang : 'es-ES';
  if (voice) utterance.voice = voice;
  utterance.rate = 1.02;
  utterance.pitch = 0.9;
  utterance.onstart = () => bus.emit('speaking', true);
  utterance.onend = () => bus.emit('speaking', false);
  utterance.onerror = (event) => {
    bus.emit('speaking', false);
    if (event.error === 'not-allowed') pending = String(text); // se dira al primer clic o tecla
  };
  window.speechSynthesis.speak(utterance);
}
