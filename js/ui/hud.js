(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { levelBadge, hpFill, expFill, skillCountEl, powerBadgeEl } = GameApp.DOM;
  const { clamp, nowSec } = GameApp.Deps.utils;

  let game = null;
  GameApp.Runtime.onGameChange((g) => { game = g; });

  function updateHUD(exp, hp, lv) {
    levelBadge.textContent = String(lv);
    hpFill.style.width = `${clamp(hp, 0, 1) * 100}%`;
    expFill.style.width = `${clamp(exp, 0, 1) * 100}%`;

    if (!game) return;
    if (game.acquiredSkills.length > 0) {
      skillCountEl.style.display = "block";
      skillCountEl.textContent = `技能: ${game.acquiredSkills.length}`;
    } else {
      skillCountEl.style.display = "none";
    }

    // 战斗水平（用于动态难度 & 本地排行榜）
    // 使用与排行榜提交相同的计算公式: 0.72×平均战力 + 0.28×峰值战力
    if (powerBadgeEl) {
      const t = nowSec();
      const timeAlive = game._startTime ? Math.max(0, t - game._startTime) : 0;
      const peak = Math.round((game.combat && game.combat.peak) ? game.combat.peak : 0);
      const avg = Math.round((game.combat && timeAlive > 0) ? (game.combat.integral / timeAlive) : ((game.combat && game.combat.ratingSmooth) ? game.combat.ratingSmooth : 0));
      const p = Math.round(0.72 * avg + 0.28 * peak);
      const tierObj = (game._combatTierFromScore ? game._combatTierFromScore(p) : { tier: "D", color: "rgba(255,255,255,.92)" });
      powerBadgeEl.innerHTML = `战力: <b>${p}</b><span class="tier">${tierObj.tier}</span>`;
      powerBadgeEl.style.color = tierObj.color;
    }
  }

  const ui = GameApp.UI = GameApp.UI || {};
  ui.updateHUD = updateHUD;
})();
