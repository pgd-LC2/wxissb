(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const {
    pauseBtn,
    pauseOverlay,
    pauseStats,
    pauseSubmitNameInput,
    pauseSubmitScoreBtn,
    pauseSubmitStatus,
    resumeBtn,
    quitBtn
  } = GameApp.DOM;
  const { nowSec } = GameApp.Deps.utils;
  const { formatTime, getStoredPlayerName, storePlayerName } = GameApp.Helpers;
  const runtime = GameApp.Runtime;

  let game = null;
  runtime.onGameChange((g) => { game = g; });

  function showPauseOverlay() {
    if (!game || game.isGameOver || game.isLevelingUp) return;

    runtime.isPausedByUser = true;
    game.isPausedGame = true;
    const input = GameApp.Input;
    if (input && input.clearMovementInputs) input.clearMovementInputs();

    // 计算当前分数
    const t = nowSec();
    const timeAlive = game._startTime ? Math.max(0, t - game._startTime) : 0;
    const peak = Math.round((game.combat && game.combat.peak) ? game.combat.peak : 0);
    const avg = Math.round((game.combat && timeAlive > 0) ? (game.combat.integral / timeAlive) : ((game.combat && game.combat.ratingSmooth) ? game.combat.ratingSmooth : 0));
    const score = Math.round(0.72 * avg + 0.28 * peak);
    const tierObj = (game._combatTierFromScore ? game._combatTierFromScore(score) : { tier: "", color: "#fff" });
    const kills = (game.stats && game.stats.kills) ? game.stats.kills : 0;

    // 显示当前游戏状态
    if (pauseStats) {
      pauseStats.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div>战力评分: <strong>${score}</strong></div>
          <div>段位: <strong style="color:${tierObj.color}">${tierObj.tier}</strong></div>
          <div>存活时间: <strong>${formatTime(timeAlive)}</strong></div>
          <div>等级: <strong>Lv.${game.level}</strong></div>
          <div>击杀: <strong>${kills}</strong></div>
          <div>技能: <strong>${game.acquiredSkills.length}</strong></div>
        </div>
      `;
    }

    // 设置输入框默认值
    if (pauseSubmitNameInput) {
      pauseSubmitNameInput.value = getStoredPlayerName();
    }

    // 重置提交状态
    if (pauseSubmitStatus) {
      pauseSubmitStatus.textContent = "";
      pauseSubmitStatus.className = "submit-status";
    }

    // 显示暂停菜单
    if (pauseOverlay) {
      pauseOverlay.classList.remove("hidden");
    }
  }

  function hidePauseOverlay() {
    runtime.isPausedByUser = false;
    if (game) game.isPausedGame = false;
    if (pauseOverlay) {
      pauseOverlay.classList.add("hidden");
    }
  }

  function resetPauseState() {
    runtime.pauseScoreSubmitted = false;
    runtime.isPausedByUser = false;
    if (pauseSubmitScoreBtn) {
      pauseSubmitScoreBtn.disabled = false;
      pauseSubmitScoreBtn.textContent = "提交当前分数";
    }
    if (pauseSubmitStatus) {
      pauseSubmitStatus.textContent = "";
      pauseSubmitStatus.className = "submit-status";
    }
  }

  // 暂停按钮点击事件
  if (pauseBtn) {
    pauseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!game || game.isGameOver) return;

      if (runtime.isPausedByUser) {
        hidePauseOverlay();
      } else {
        showPauseOverlay();
      }
    });
  }

  // 继续游戏按钮
  if (resumeBtn) {
    resumeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hidePauseOverlay();
    });
  }

  // 退出游戏按钮
  if (quitBtn) {
    quitBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hidePauseOverlay();
      if (game) {
        game.playerHealth = 0;
        game.isGameOver = true;
      }
    });
  }

  // 暂停菜单中提交分数
  if (pauseSubmitScoreBtn) {
    pauseSubmitScoreBtn.addEventListener("click", async (e) => {
      e.stopPropagation();

      if (!game || !window.SupabaseAPI) {
        if (pauseSubmitStatus) {
          pauseSubmitStatus.textContent = "无法连接到服务器";
          pauseSubmitStatus.className = "submit-status error";
        }
        return;
      }

      const playerName = pauseSubmitNameInput ? pauseSubmitNameInput.value.trim() : "";
      if (!playerName) {
        if (pauseSubmitStatus) {
          pauseSubmitStatus.textContent = "请输入你的名字";
          pauseSubmitStatus.className = "submit-status error";
        }
        return;
      }

      // 保存玩家名字
      storePlayerName(playerName);

      // 计算当前分数
      const t = nowSec();
      const timeAlive = game._startTime ? Math.max(0, t - game._startTime) : 0;
      const peak = Math.round((game.combat && game.combat.peak) ? game.combat.peak : 0);
      const avg = Math.round((game.combat && timeAlive > 0) ? (game.combat.integral / timeAlive) : ((game.combat && game.combat.ratingSmooth) ? game.combat.ratingSmooth : 0));
      const score = Math.round(0.72 * avg + 0.28 * peak);
      const tierObj = (game._combatTierFromScore ? game._combatTierFromScore(score) : { tier: "", color: "#fff" });
      const kills = (game.stats && game.stats.kills) ? game.stats.kills : 0;

      if (pauseSubmitStatus) {
        pauseSubmitStatus.textContent = "提交中...";
        pauseSubmitStatus.className = "submit-status";
      }

      try {
        const result = await window.SupabaseAPI.submitScore(
          playerName,
          score,
          game.level,
          kills,
          Math.round(timeAlive),
          tierObj.tier
        );

        if (result.error) {
          if (pauseSubmitStatus) {
            pauseSubmitStatus.textContent = "提交失败，请重试";
            pauseSubmitStatus.className = "submit-status error";
          }
        } else {
          runtime.pauseScoreSubmitted = true;
          if (pauseSubmitStatus) {
            pauseSubmitStatus.textContent = "提交成功！";
            pauseSubmitStatus.className = "submit-status success";
          }
          // 禁用提交按钮
          if (pauseSubmitScoreBtn) {
            pauseSubmitScoreBtn.disabled = true;
            pauseSubmitScoreBtn.textContent = "已提交";
          }
        }
      } catch (err) {
        if (pauseSubmitStatus) {
          pauseSubmitStatus.textContent = "提交失败，请重试";
          pauseSubmitStatus.className = "submit-status error";
        }
      }
    });
  }

  // ESC 键暂停/继续
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!game || game.isGameOver || game.isLevelingUp) return;

      if (runtime.isPausedByUser) {
        hidePauseOverlay();
      } else {
        showPauseOverlay();
      }
      e.preventDefault();
    }
  });

  const ui = GameApp.UI = GameApp.UI || {};
  ui.resetPauseState = resetPauseState;
})();
