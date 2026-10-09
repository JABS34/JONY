'use strict';
// Revision estatica: sintaxis, imports, ids del HTML, manifiesto de modulos y JSON.
// Uso: npm run check
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const problems = [];
let checks = 0;
const fail = (file, msg) => problems.push(path.relative(ROOT, file) + ': ' + msg);

function walk(dir, ext, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, out);
    else if (full.endsWith(ext)) out.push(full);
  }
  return out;
}

// 1) Sintaxis
for (const file of walk(path.join(ROOT, 'backend'), '.js').concat(walk(path.join(ROOT, 'scripts'), '.js'))) {
  checks++;
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (r.status !== 0) fail(file, 'error de sintaxis\n' + r.stderr.trim());
}
const frontendJs = walk(path.join(ROOT, 'frontend', 'js'), '.js');
for (const file of frontendJs) {
  checks++;
  const isClassic = file.endsWith('failsafe.js');
  const args = isClassic ? ['--check', file] : ['--check', '--input-type=module'];
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', input: isClassic ? undefined : fs.readFileSync(file) });
  if (r.status !== 0) fail(file, 'error de sintaxis\n' + (r.stderr || '').trim());
}

// 2) Imports relativos existen
const importRe = /(?:import\s+(?:[^'"]*?from\s+)?|import\()\s*['"](\.{1,2}\/[^'"]+)['"]/g;
for (const file of frontendJs) {
  const src = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = importRe.exec(src))) {
    checks++;
    const target = path.resolve(path.dirname(file), m[1]);
    if (!fs.existsSync(target)) fail(file, 'importa un archivo que no existe: ' + m[1]);
  }
}

// 3) Ids usados por byId() existen en index.html
const html = fs.readFileSync(path.join(ROOT, 'frontend', 'index.html'), 'utf8');
const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const dupes = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).filter((id, i, a) => a.indexOf(id) !== i);
for (const id of new Set(dupes)) fail(path.join(ROOT, 'frontend', 'index.html'), 'id duplicado: ' + id);
for (const file of frontendJs) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/byId\('([^']+)'\)/g)) {
    checks++;
    if (!htmlIds.has(m[1])) fail(file, 'byId("' + m[1] + '") no existe en index.html');
  }
}

// 4) Recursos que referencia index.html existen
for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]+)"/g)) {
  checks++;
  if (!fs.existsSync(path.join(ROOT, 'frontend', m[1]))) fail(path.join(ROOT, 'frontend', 'index.html'), 'recurso inexistente: ' + m[1]);
}

// 5) Sin inline scripts/estilos (la politica de seguridad los bloquearia)
checks++;
if (/<script(?![^>]*\ssrc=)[^>]*>/i.test(html)) fail(path.join(ROOT, 'frontend', 'index.html'), 'hay un <script> en linea (CSP lo bloquea)');
if (/<style[\s>]/i.test(html) || /\sstyle="/i.test(html)) fail(path.join(ROOT, 'frontend', 'index.html'), 'hay estilos en linea (CSP los bloquea)');
for (const file of frontendJs) {
  const src = fs.readFileSync(file, 'utf8');
  if (/\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|document\.write|\beval\(|new Function\(/.test(src)) fail(file, 'usa una API insegura (innerHTML/eval/...)');
}

// 6) JSON de datos valido
for (const file of walk(path.join(ROOT, 'backend', 'data'), '.json')) {
  checks++;
  try { JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); } catch (e) { fail(file, 'JSON invalido: ' + e.message); }
}

if (problems.length) {
  console.error('\nSe encontraron ' + problems.length + ' problema(s):\n');
  for (const p of problems) console.error(' - ' + p);
  process.exit(1);
}
console.log('Revision OK (' + checks + ' comprobaciones, sin problemas).');
