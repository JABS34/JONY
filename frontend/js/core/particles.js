// Fondo de particulas en canvas 2D. Liviano: pocas particulas, se pausa si la pestana no se ve.
import { reducedMotion } from './dom.js';

export function start(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D no esta disponible');

  const LINK_DIST = 120;
  let width = 0;
  let height = 0;
  let nodes = [];
  let raf = 0;
  let last = 0;
  let resizeTimer = 0;
  const still = reducedMotion();

  function makeNode() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.5) * 16,
      r: 0.8 + Math.random() * 1.4,
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.max(18, Math.min(80, Math.floor((width * height) / 22000)));
    while (nodes.length < target) nodes.push(makeNode());
    if (nodes.length > target) nodes.length = target;
    for (const n of nodes) { n.x = Math.min(n.x, width); n.y = Math.min(n.y, height); }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.22;
          ctx.strokeStyle = 'rgba(53,224,255,' + alpha.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.fillStyle = 'rgba(160,240,255,0.55)';
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(t) {
    const dt = Math.min((t - last) / 1000 || 0, 0.05);
    last = t;
    for (const n of nodes) {
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    }
    draw();
    raf = requestAnimationFrame(frame);
  }

  function run() {
    if (still || raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : run()));

  resize();
  run();
  return { stop: pause };
}
