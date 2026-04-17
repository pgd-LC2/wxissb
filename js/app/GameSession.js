import { GameApp } from '../legacy/context.js';

export class GameSession {
  constructor({ mountEl, services }) {
    this.mountEl = mountEl;
    this.services = services;
  }

  async start() {
    if (GameApp.JoystickDialog?.initJoystickForDesktop) {
      await GameApp.JoystickDialog.initJoystickForDesktop();
    }
    GameApp.Boot?.start?.();
    this.services.bus.emit('run:start', { game: this.getGame() });
    return this;
  }

  getGame() {
    return GameApp.Runtime?.getGame?.() ?? null;
  }

  pause() {
    const game = this.getGame();
    if (game) game.isPausedGame = true;
  }

  resume() {
    const game = this.getGame();
    if (!game) return;
    game.isPausedGame = false;
    game.lastFrameT = performance.now() / 1000;
    if (GameApp.Loop?.tick) requestAnimationFrame(GameApp.Loop.tick);
  }
}
