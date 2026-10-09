// Seccion de portafolio. Los datos vienen de backend/data/portfolio.json via /api/portfolio.
import { byId, el, safeUrl } from '../core/dom.js';
import { bus } from '../core/bus.js';
import { CONFIG } from '../core/config.js';
import * as panels from '../core/panels.js';
import { say } from '../core/assistant.js';

let dataPromise = null;

function loadData() {
  if (!dataPromise) {
    dataPromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CONFIG.apiTimeoutMs);
      try {
        const res = await fetch('/api/portfolio', { signal: controller.signal, credentials: 'same-origin' });
        let json = null;
        try { json = await res.json(); } catch { /* respuesta sin JSON */ }
        if (!res.ok) throw new Error((json && json.error) || 'El servidor respondió HTTP ' + res.status);
        return json || {};
      } catch (err) {
        if (err && err.name === 'AbortError') throw new Error('El servidor no respondió a tiempo');
        throw err;
      } finally {
        clearTimeout(timer);
      }
    })();
    dataPromise.catch(() => { dataPromise = null; }); // permite reintentar
  }
  return dataPromise;
}

const str = (v) => (v === undefined || v === null ? '' : String(v));
const list = (v) => (Array.isArray(v) ? v : []);

function empty(message) {
  return el('p', { class: 'muted', text: message });
}

function linkRow(links) {
  const nodes = [];
  for (const link of links) {
    const url = safeUrl(link.url);
    if (!url) continue;
    nodes.push(el('a', { class: 'link', text: str(link.label) || url, attrs: { href: url, target: '_blank', rel: 'noopener noreferrer' } }));
  }
  return nodes.length ? el('p', { class: 'links' }, nodes) : null;
}

function section(title, children) {
  return el('section', { class: 'pf-section' }, [el('h3', { text: title }), ...children]);
}

function renderProfile(profile) {
  const p = profile && typeof profile === 'object' ? profile : {};
  return el('section', { class: 'pf-section' }, [
    el('h3', { class: 'pf-name', text: str(p.name) || CONFIG.userName }),
    p.role ? el('p', { class: 'pf-role', text: str(p.role) }) : null,
    p.summary ? el('p', { text: str(p.summary) }) : null,
    linkRow(list(p.links)),
  ]);
}

function renderSkills(skills) {
  if (!skills.length) return section('Habilidades', [empty('Aún no hay habilidades. Agrégalas en backend/data/portfolio.json.')]);
  const groups = new Map();
  for (const s of skills) {
    const cat = str(s.category) || 'General';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(s);
  }
  const blocks = [];
  for (const [cat, items] of groups) {
    blocks.push(el('h4', { text: cat }));
    blocks.push(el('ul', { class: 'skills' }, items.map((s) => {
      const pct = Math.max(0, Math.min(100, Number(s.percentage) || 0));
      const fill = el('span', { class: 'fill' });
      fill.style.width = pct + '%';
      return el('li', {}, [
        el('span', { class: 'skill-name', text: str(s.name) }),
        el('span', { class: 'meter', attrs: { role: 'img', 'aria-label': str(s.name) + ': ' + pct + '%' } }, fill),
        el('span', { class: 'skill-pct', text: pct + '%' }),
      ]);
    })));
  }
  return section('Habilidades', blocks);
}

function renderProjects(projects) {
  if (!projects.length) return section('Proyectos', [empty('Aún no hay proyectos. Agrégalos en backend/data/portfolio.json.')]);
  return section('Proyectos', projects.map((p) => {
    const tech = Array.isArray(p.technologies) ? p.technologies.map(str).join(', ') : str(p.technologies);
    return el('article', { class: 'card' }, [
      el('h4', { text: str(p.title) || 'Proyecto sin título' }),
      p.description ? el('p', { text: str(p.description) }) : null,
      tech ? el('p', { class: 'muted', text: 'Tecnologías: ' + tech }) : null,
      linkRow([{ label: 'Código', url: p.github_url }, { label: 'Demo', url: p.demo_url }]),
    ]);
  }));
}

function renderDated(title, items, emptyMsg, extra) {
  if (!items.length) return section(title, [empty(emptyMsg)]);
  return section(title, items.map((i) =>
    el('article', { class: 'card' }, [
      el('h4', { text: str(i.title) || 'Sin título' }),
      el('p', { class: 'muted', text: [str(i.issuer), str(i.date), extra(i)].filter(Boolean).join(' · ') }),
    ])
  ));
}

function renderExperience(items) {
  if (!items.length) return section('Experiencia', [empty('Aún no hay experiencia. Agrégala en backend/data/portfolio.json.')]);
  return section('Experiencia', items.map((i) =>
    el('article', { class: 'card' }, [
      el('h4', { text: str(i.role) || 'Puesto' }),
      el('p', { class: 'muted', text: [str(i.company), [str(i.start), str(i.end) || 'actualidad'].filter(Boolean).join(' – ')].filter(Boolean).join(' · ') }),
      i.description ? el('p', { text: str(i.description) }) : null,
    ])
  ));
}

function render(data) {
  const body = byId('portfolio-body');
  body.replaceChildren(
    renderProfile(data.profile),
    renderSkills(list(data.skills)),
    renderProjects(list(data.projects)),
    renderDated('Certificados', list(data.certificates), 'Aún no hay certificados. Agrégalos en backend/data/portfolio.json.', () => ''),
    renderDated('Cursos', list(data.courses), 'Aún no hay cursos. Agrégalos en backend/data/portfolio.json.', (c) => (c.hours ? str(c.hours) + ' h' : '')),
    renderExperience(list(data.experience))
  );
}

async function open() {
  panels.open('panel-portfolio');
  const body = byId('portfolio-body');
  body.setAttribute('aria-busy', 'true');
  body.replaceChildren(empty('Cargando portafolio…'));
  try {
    const data = await loadData();
    render(data);
    say('Aquí tienes tu portafolio, ' + CONFIG.userName + '.');
  } catch (err) {
    body.replaceChildren(
      el('p', { class: 'error-text', text: 'No pude cargar el portafolio: ' + (err && err.message ? err.message : 'error desconocido') }),
      el('p', { class: 'muted', text: 'Comprueba que el servidor esté encendido (INICIAR.bat) y que backend/data/portfolio.json sea válido.' })
    );
    say('No pude cargar el portafolio. Revisa el servidor.');
  } finally {
    body.removeAttribute('aria-busy');
  }
}

export function init() {
  bus.on('open-portfolio', open);
}
