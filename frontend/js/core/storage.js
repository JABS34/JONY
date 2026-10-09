// localStorage con proteccion: si el navegador lo bloquea, JONY sigue funcionando.
const PREFIX = 'jony:';

export function get(key) {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function set(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, String(value));
    return true;
  } catch {
    return false;
  }
}
