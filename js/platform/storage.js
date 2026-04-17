export function createStorage(prefix = 'wxissb:') {
  return {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(prefix + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(prefix + key, JSON.stringify(value));
      } catch {}
    },
  };
}
