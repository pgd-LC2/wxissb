(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { nowSec } = GameApp.Deps.utils;
  const { overlay, restartBtn, homeBtn } = GameApp.DOM;
  const runtime = GameApp.Runtime;

  // 存储玩家选择的职业和武器
  let pendingClassId = null;
  let pendingWeaponId = null;

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

    // 应用职业和武器选择（如果有）
    const CWS = GameApp.ClassWeaponSystem;
    if (CWS && pendingClassId && pendingWeaponId) {
      CWS.applyClassToGame(game, pendingClassId);
      CWS.applyWeaponToGame(game, pendingWeaponId);
    }

    // initial HUD
    game.updateUI();

    // initial spawn loop timer
    runtime.spawnTimer = nowSec();

    // 重置暂停菜单提交按钮状态
    if (ui && ui.resetPauseState) ui.resetPauseState();
  }

  // 显示职业和武器选择界面
  function showClassWeaponSelection(onComplete) {
    const CWS = GameApp.ClassWeaponSystem;
    if (CWS && CWS.showSelectionScreen) {
      CWS.showSelectionScreen((classId, weaponId) => {
        pendingClassId = classId;
        pendingWeaponId = weaponId;
        if (typeof onComplete === "function") {
          onComplete(classId, weaponId);
        }
      });
    } else {
      // 如果没有职业系统，直接回调
      if (typeof onComplete === "function") {
        onComplete(null, null);
      }
    }
  }

  // 重新开始游戏（带选择界面）
  function restartWithSelection() {
    overlay.classList.remove("show");
    showClassWeaponSelection(() => {
      resetGame();
      // 游戏循环已经在运行，不需要再次启动
    });
  }

  function start() {
    GameApp.Canvas.init();

    // 首次启动：显示职业和武器选择界面
    showClassWeaponSelection(() => {
      resetGame();

      if (restartBtn) {
        restartBtn.addEventListener("click", () => {
          restartWithSelection();
        });
      }

      if (homeBtn) {
        homeBtn.addEventListener("click", () => {
          window.location.href = "../index.html";
        });
      }

      requestAnimationFrame(GameApp.Loop.tick);
    });
  }

  GameApp.Boot = { resetGame, start, showClassWeaponSelection, restartWithSelection };
})();
