(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { nowSec } = GameApp.Deps.utils;

  let game = null;
  GameApp.Runtime.onGameChange((g) => { game = g; });

  function tick() {
    const t = nowSec();

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

      // HUD（每帧刷新：战力徽章/技能数）
      const ui = GameApp.UI;
      if (ui && ui.updateHUD) {
        ui.updateHUD(game.currentExp / game.maxExp, game.playerHealth / game.playerMaxHealth, game.level);
      }

      // If game over triggered inside update
      if (game.isGameOver && !game._gameOverShown) {
        game.isPausedGame = true;
        game._gameOverShown = true;
        if (ui && ui.showGameOverOverlay) ui.showGameOverOverlay(game);
      }

      // HUD is updated via callback
    }

    requestAnimationFrame(tick);
  }

  GameApp.Loop = { tick };
})();
