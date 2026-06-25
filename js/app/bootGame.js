import { loadTemplates, cloneTemplate } from '../ui/runtime/mount.js';
import { createServices } from '../platform/services.js';
import { GameSession } from './GameSession.js';
import { GameApp } from '../legacy/context.js';

const TEMPLATES = ['/assets/templates/gameShell.html'];

function readEnv() {
  const url = new URL(window.location.href);
  return {
    debug: url.searchParams.has('debug'),
  };
}

export async function bootGame(mountEl) {
  const env = readEnv();
  const services = createServices(env);
  mountEl.textContent = '';
  await loadTemplates(TEMPLATES);
  mountEl.appendChild(cloneTemplate('tpl-game-shell'));
  await import('../legacy/installGame.js');
  const session = new GameSession({ mountEl, services });
  if (env.debug) {
    const { installDebug } = await import('../debug/index.js');
    installDebug(GameApp, session);
  }
  await session.start();
  return session;
}
