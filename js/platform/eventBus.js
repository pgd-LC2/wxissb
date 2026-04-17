export function createEventBus() {
  const map = new Map();
  return {
    on(type, fn) {
      if (!map.has(type)) map.set(type, new Set());
      map.get(type).add(fn);
      return () => map.get(type)?.delete(fn);
    },
    emit(type, payload) {
      const listeners = map.get(type);
      if (!listeners) return;
      for (const listener of listeners) listener(payload);
    },
  };
}
