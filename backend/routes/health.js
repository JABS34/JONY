'use strict';
const express = require('express');
const config = require('../config');

const router = express.Router();

router.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store').json({
    ok: true,
    name: 'JONY',
    version: config.VERSION,
    uptime: Math.round(process.uptime()),
  });
});

module.exports = router;
