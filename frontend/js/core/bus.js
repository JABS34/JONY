// Bus de eventos minimo: los modulos se hablan sin importarse entre si.
import { logError } from './registry.js';

const handlers = new Map();

export const bus = {
  on(event, fn) {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event).add(fn);
    return () => handlers.get(event).delete(fn);
  },
  has(event) {
    const set = handlers.get(event);
    return Boolean(set && set.size);
  },
  emit(event, data) {
    const set = handlers.get(event);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        const result = fn(data);
        if (result && typeof result.catch === 'function') {
          result.catch((err) => logError('evento:' + event, err && err.message));
        }
      } catch (err) {
        logError('evento:' + event, err && err.message);
      }
    }
  },
};
