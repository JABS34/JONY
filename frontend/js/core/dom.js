// Utilidades de DOM. Nunca se usa innerHTML: todo texto entra con textContent.

export function byId(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error('Falta el elemento #' + id + ' en index.html');
  return node;
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Solo enlaces http(s). Evita javascript: y similares.
export function safeUrl(value) {
  try {
    const url = new URL(String(value), window.location.href);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.text !== undefined && opts.text !== null) node.textContent = String(opts.text);
  if (opts.attrs) {
    for (const [name, raw] of Object.entries(opts.attrs)) {
      const key = name.toLowerCase();
      if (key.startsWith('on') || key === 'style') continue;
      if (key === 'href' || key === 'src') {
        const safe = safeUrl(raw);
        if (safe) node.setAttribute(name, safe);
        continue;
      }
      node.setAttribute(name, String(raw));
    }
  }
  if (opts.on) {
    for (const [event, handler] of Object.entries(opts.on)) node.addEventListener(event, handler);
  }
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

export function withTimeout(promise, ms, label = 'La operacion') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(label + ' tardo mas de ' + ms + ' ms')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
