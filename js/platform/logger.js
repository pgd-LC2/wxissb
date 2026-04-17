export function createLogger(debug = false) {
  return {
    info(...args) {
      if (debug) console.info('[wxissb]', ...args);
    },
    warn(...args) {
      console.warn('[wxissb]', ...args);
    },
    error(...args) {
      console.error('[wxissb]', ...args);
    },
  };
}
