import { loadTemplates, cloneTemplate } from '../ui/runtime/mount.js';
import { GameApp } from '../legacy/context.js';

const TEMPLATES = ['/templates/gameShell.html'];

export async function bootGame(mountEl) {
  const debug = new URL(window.location.href).searchParams.has('debug');
  mountEl.textContent = '';
  await loadTemplates(TEMPLATES);
  mountEl.appendChild(cloneTemplate('tpl-game-shell'));
  await import('../legacy/installGame.js');
  if (debug) {
    const { installDebug } = await import('../debug/index.js');
    installDebug(GameApp, { getGame: () => GameApp.Runtime?.getGame?.() ?? null });
  }
  if (GameApp.JoystickDialog?.initJoystickForDesktop) {
    await GameApp.JoystickDialog.initJoystickForDesktop();
  }
  GameApp.Boot?.start?.();
}
