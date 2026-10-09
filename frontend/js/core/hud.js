// Panel de sistema (reloj, estado) y botones de la barra superior.
import { byId } from './dom.js';
import { bus } from './bus.js';
import * as sound from './sound.js';
import * as registry from './registry.js';
import { say, openModule } from './assistant.js';

function formatter(options) {
  try {
    return new Intl.DateTimeFormat('es-EC', options);
  } catch {
    return new Intl.DateTimeFormat('es', options);
  }
}

export function init() {
  const time = byId('clock-time');
  const date = byId('clock-date');
  const core = byId('core');
  const timeFmt = formatter({ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateFmt = formatter({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const tick = () => {
    const now = new Date();
    time.textContent = timeFmt.format(now);
    date.textContent = dateFmt.format(now);
  };
  tick();
  setInterval(() => { if (!document.hidden) tick(); }, 1000);

  // Animacion del nucleo mientras JONY habla o escribe.
  let speaking = false;
  let typing = false;
  const refresh = () => core.classList.toggle('speaking', speaking || typing);
  bus.on('speaking', (v) => { speaking = Boolean(v); refresh(); });
  bus.on('typing', (v) => { typing = Boolean(v); refresh(); });

  // Boton de sonido.
  const soundBtn = byId('btn-sound');
  const paintSound = () => {
    const muted = sound.isMuted();
    soundBtn.textContent = muted ? 'Sonido: silenciado' : 'Sonido: activado';
    soundBtn.setAttribute('aria-pressed', String(muted));
  };
  soundBtn.addEventListener('click', () => {
    const muted = sound.toggleMuted();
    if (!muted) sound.play('ping');
    say(muted ? 'Voz y sonidos silenciados.' : 'Voz y sonidos activados.', { voice: !muted });
  });
  bus.on('mute-changed', paintSound);
  paintSound();

  byId('btn-diag').addEventListener('click', () => openModule('open-diagnostics'));

  // Estado del sistema en el panel izquierdo.
  const comp = byId('stat-components');
  const server = byId('stat-server');
  const paint = () => {
    const items = registry.all().filter((i) => i.id !== 'server');
    const ok = items.filter((i) => i.status === 'ok').length;
    const bad = items.filter((i) => i.status === 'error').length;
    comp.textContent = ok + ' de ' + items.length + ' listos';
    comp.dataset.state = bad ? 'error' : ok === items.length ? 'ok' : 'warn';
    const s = registry.all().find((i) => i.id === 'server');
    server.textContent = !s ? 'Comprobando…' : s.status === 'ok' ? 'En línea' : 'Sin conexión';
    server.dataset.state = !s ? 'warn' : s.status === 'ok' ? 'ok' : 'error';
  };
  registry.onChange(paint);
  paint();
}
