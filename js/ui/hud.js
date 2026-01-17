(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { levelBadge, hpFill, expFill, skillCountEl, powerBadgeEl } = GameApp.DOM;
  const { clamp } = GameApp.Deps.utils;

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
    if (powerBadgeEl) {
      const p = Math.round((game.combat && game.combat.ratingSmooth) ? game.combat.ratingSmooth : 0);
      const tier = (game.combat && game.combat.tier) ? game.combat.tier : "D";
      powerBadgeEl.innerHTML = `战力: <b>${p}</b><span class="tier">${tier}</span>`;
      powerBadgeEl.style.color = (game.combat && game.combat.tierColor) ? game.combat.tierColor : "rgba(255,255,255,.92)";
    }
  }

  const ui = GameApp.UI = GameApp.UI || {};
  ui.updateHUD = updateHUD;
})();
