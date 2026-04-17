import { GameApp as __GameApp } from '../legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const { levelBadge, hpFill, expFill, skillCountEl, powerBadgeEl, bladeBadgeEl } = GameApp.DOM;
  const { clamp, nowSec } = GameApp.Deps.utils;

  // 获取职业武器徽章元素
  const classWeaponBadgeEl = document.getElementById("classWeaponBadge");

  let game = null;
  let lastClassWeaponUpdate = "";
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

    // 更新职业和武器显示
    if (classWeaponBadgeEl) {
      const cls = game.selectedClass;
      const weapon = game.selectedWeapon;
      if (cls && weapon) {
        const key = `${cls.id}_${weapon.id}`;
        if (key !== lastClassWeaponUpdate) {
          lastClassWeaponUpdate = key;
          classWeaponBadgeEl.innerHTML = `
            <span class="cw-badge-item" style="color: ${cls.color}">${cls.icon} ${cls.name}</span>
            <span class="cw-badge-sep">·</span>
            <span class="cw-badge-item" style="color: ${weapon.color}">${weapon.icon} ${weapon.name}</span>
          `;
          classWeaponBadgeEl.style.display = "flex";
        }
      } else {
        classWeaponBadgeEl.style.display = "none";
      }
    }

    // 飞刀数量显示
    if (bladeBadgeEl) {
      const bladeCount = game.bladeOrbitCount || 0;
      if (bladeCount > 0) {
        bladeBadgeEl.style.display = "block";
        bladeBadgeEl.textContent = `🔪 飞刀: ${bladeCount}`;
      } else {
        bladeBadgeEl.style.display = "none";
      }
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
