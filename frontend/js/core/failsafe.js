// Script clasico (no modulo). Si la aplicacion no arranca, muestra una explicacion en vez de dejar la pantalla en negro.
(function () {
  'use strict';
  function showFatal() {
    var fatal = document.getElementById('fatal');
    var boot = document.getElementById('boot');
    if (boot) boot.hidden = true;
    if (fatal) fatal.hidden = false;
  }
  if (window.location.protocol === 'file:') {
    document.addEventListener('DOMContentLoaded', showFatal);
    return;
  }
  setTimeout(function () {
    if (!window.__JONY_READY__) showFatal();
  }, 14000);
})();
