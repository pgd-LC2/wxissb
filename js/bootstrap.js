(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { nowSec } = GameApp.Deps.utils;
  const { overlay, restartBtn, homeBtn } = GameApp.DOM;
  const runtime = GameApp.Runtime;

  function resetGame() {
    const game = GameApp.makeGame();
    GameApp.Canvas.wrapRender(game);

    runtime.setGame(game);

    game._startTime = nowSec();
    game._runId = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    if (game.stats) game.stats.startTime = game._startTime;
    game._runRecorded = false;
    game._gameOverShown = false;

    const ui = GameApp.UI;
    if (ui && ui.buildSkillPool) ui.buildSkillPool(game);

    game.onStateChange = ui && ui.updateHUD ? ui.updateHUD : null;
    game.onLevelUp = () => {
      game.generateSkills();
      game.isLevelingUp = true;
      if (ui && ui.showLevelUpOverlay) ui.showLevelUpOverlay(game);
    };
    game.onGameOver = () => {
      // showGameOverOverlay 现在由 tick 函数统一处理，避免重复调用
    };

    // initial HUD
    game.updateUI();

    // initial spawn loop timer
    runtime.spawnTimer = nowSec();

    // 重置暂停菜单提交按钮状态
    if (ui && ui.resetPauseState) ui.resetPauseState();
  }

  function start() {
    GameApp.Canvas.init();
    resetGame();

    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        overlay.classList.remove("show");
        resetGame();
      });
    }

    if (homeBtn) {
      homeBtn.addEventListener("click", () => {
        window.location.href = "../index.html";
      });
    }

    requestAnimationFrame(GameApp.Loop.tick);
  }

  GameApp.Boot = { resetGame, start };
})();
