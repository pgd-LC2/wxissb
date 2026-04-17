import { createEventBus } from './eventBus.js';
import { createStorage } from './storage.js';
import { createLogger } from './logger.js';

export function createServices(env = {}) {
  return {
    bus: createEventBus(),
    storage: createStorage(),
    logger: createLogger(Boolean(env.debug)),
    env,
  };
}
