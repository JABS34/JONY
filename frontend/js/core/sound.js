// Sonidos sintetizados con Web Audio (sin archivos). Silenciables.
import * as store from './storage.js';
import { bus } from './bus.js';

let ctx = null;
let muted = false;

const PRESETS = {
  boot:   [{ freq: 110, to: 440, dur: 0.9, type: 'sawtooth', vol: 0.02 }, { freq: 880, to: 1320, dur: 0.25, delay: 0.8, vol: 0.03 }],
  online: [{ freq: 660, dur: 0.1, vol: 0.035 }, { freq: 990, dur: 0.18, delay: 0.1, vol: 0.035 }],
  ping:   [{ freq: 880, to: 1200, dur: 0.09, vol: 0.035 }],
  open:   [{ freq: 400, to: 900, dur: 0.14, vol: 0.035 }],
  close:  [{ freq: 900, to: 400, dur: 0.12, vol: 0.03 }],
  error:  [{ freq: 200, to: 120, dur: 0.25, type: 'square', vol: 0.025 }],
};

function getContext(force = false) {
  if (muted) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const active = navigator.userActivation ? navigator.userActivation.hasBeenActive : true;
    if (!active && !force) return null; // el navegador no deja sonar antes de un gesto
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(c, { freq, to = freq, dur = 0.12, type = 'sine', vol = 0.03, delay = 0 }) {
  const start = c.currentTime + delay;
  const end = start + dur;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), end);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + Math.min(0.02, dur / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(c.destination);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  osc.start(start);
  osc.stop(end + 0.02);
}

export function init() {
  if (!(window.AudioContext || window.webkitAudioContext)) {
    throw new Error('Web Audio no esta disponible en este navegador');
  }
  muted = store.get('muted') === '1';
  const unlock = () => getContext(true);
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

export function play(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  const c = getContext();
  if (!c || c.state !== 'running') return;
  try {
    for (const t of preset) tone(c, t);
  } catch {
    /* un fallo de audio nunca debe romper la interfaz */
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = Boolean(value);
  store.set('muted', muted ? '1' : '0');
  bus.emit('mute-changed', muted);
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}
