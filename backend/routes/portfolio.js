'use strict';
const fs = require('fs/promises');
const path = require('path');
const express = require('express');
const config = require('../config');

const router = express.Router();
const FILE = path.join(config.DATA_DIR, 'portfolio.json');
const LIST_KEYS = ['skills', 'projects', 'certificates', 'courses', 'experience'];

let cache = { mtimeMs: -1, data: null };

function normalize(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const profile = src.profile && typeof src.profile === 'object' && !Array.isArray(src.profile) ? src.profile : {};
  const out = { profile };
  for (const key of LIST_KEYS) out[key] = Array.isArray(src[key]) ? src[key] : [];
  return out;
}

router.get('/portfolio', async (req, res, next) => {
  try {
    const stat = await fs.stat(FILE);
    if (!cache.data || stat.mtimeMs !== cache.mtimeMs) {
      const text = (await fs.readFile(FILE, 'utf8')).replace(/^\uFEFF/, '');
      cache = { mtimeMs: stat.mtimeMs, data: normalize(JSON.parse(text)) };
    }
    res.set('Cache-Control', 'no-cache').json(cache.data);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'backend/data/portfolio.json tiene un error de formato (revisa comas y comillas).' });
    }
    if (err && err.code === 'ENOENT') {
      return res.status(404).json({ error: 'No existe backend/data/portfolio.json.' });
    }
    next(err);
  }
});

module.exports = router;
