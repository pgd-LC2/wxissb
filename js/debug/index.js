import { applyGodMode } from './cheats.js';

export function installDebug(GameApp, session) {
  window.nbmode = () => applyGodMode(session.getGame?.() || GameApp.Runtime?.getGame?.());
}
