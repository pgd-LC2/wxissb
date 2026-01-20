(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { nowSec } = GameApp.Deps.utils;

  let game = null;
  GameApp.Runtime.onGameChange((g) => { game = g; });

  let lastT = 0;
  let fpsSmooth = 60;
  let lastFpsDomT = -1e9;
  let lastHudT = -1e9;

  function tick() {
    const t = nowSec();
    const dt = lastT ? (t - lastT) : (1 / 60);
    lastT = t;

    // FPS (smoothed) — update DOM at low frequency to avoid layout cost
    if (dt > 0 && dt < 1) {
      const fps = 1 / dt;
      fpsSmooth = fpsSmooth * 0.90 + fps * 0.10;
    }
    const dom = GameApp.DOM;
    if (dom && dom.fpsCounter && (t - lastFpsDomT) > 0.25) {
      dom.fpsCounter.textContent = `FPS: ${Math.max(0, Math.round(fpsSmooth))}`;
      lastFpsDomT = t;
    }

    if (game) {
      // Input: joystick active => use joystickVector, otherwise always use held keys
      const input = GameApp.Input;
      const keyVec = input ? input.recomputeKeyVector() : { dx: 0, dy: 0 };
      if (!input || !input.isJoyActive || !input.isJoyActive()) {
        game.joystickVector = keyVec;
      }

      // Update (simulation)
      game.update(t);

      // Enemy Director: spawn + dynamic scaling (based on combat power)
      if (typeof game.directorStep === "function") game.directorStep(t);

      // Render
      game.render(t);

      // HUD — throttled to reduce DOM/layout work
      const ui = GameApp.UI;
      if (ui && ui.updateHUD && !game.isGameOver && !game.isLevelingUp) {
        if ((t - lastHudT) > 0.10) {
          ui.updateHUD(game.currentExp / game.maxExp, game.playerHealth / game.playerMaxHealth, game.level);
          lastHudT = t;
        }
      }

      // If game over triggered inside update
      if (game.isGameOver && !game._gameOverShown) {
        game.isPausedGame = true;
        game._gameOverShown = true;
        if (ui && ui.showGameOverOverlay) ui.showGameOverOverlay(game);
      }
    }

    requestAnimationFrame(tick);
  }

  GameApp.Loop = { tick };
})();
