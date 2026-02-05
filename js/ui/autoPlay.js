(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const PREF_AUTOPLAY = "bigear_pref_autoplay";

  let game = null;
  let currentGameId = 0;
  GameApp.Runtime.onGameChange((g) => { 
    game = g;
    currentGameId++;
    state.isChoosingSkill = false;
    state.lastMoveUpdate = 0;
  });

  const state = {
    enabled: false,
    lastMoveUpdate: 0,
    moveUpdateInterval: 0.05,
    pendingSkillChoice: false,
    isChoosingSkill: false
  };

  function isEnabled() {
    return state.enabled;
  }

  function setEnabled(enabled) {
    state.enabled = !!enabled;
    try {
      localStorage.setItem(PREF_AUTOPLAY, state.enabled ? "1" : "0");
    } catch {}
    refreshAutoPlayIcon();
  }

  function toggle() {
    setEnabled(!state.enabled);
  }

  function refreshAutoPlayIcon() {
    const btn = GameApp.DOM && GameApp.DOM.autoPlayToggle;
    if (!btn) return;
    if (state.enabled) {
      btn.classList.add("active");
      btn.textContent = "\uD83E\uDD16";
      btn.title = "AI\u6258\u7BA1\u4E2D\uFF08\u70B9\u51FB\u5173\u95ED\uFF09";
    } else {
      btn.classList.remove("active");
      btn.textContent = "\uD83C\uDFAE";
      btn.title = "AI\u6258\u7BA1\uFF08\u70B9\u51FB\u5F00\u542F\uFF09";
    }
  }

  // 计算子弹最大射程
  function getBulletMaxRange(g) {
    const GameConfig = window.GameConfig || { baseBulletSpeed: 600 };
    const speed = GameConfig.baseBulletSpeed * (g.bulletSpeedMulti || 1.0);
    const lifetime = g.bulletLifetime || 1.5;
    // 保持在最大射程的70%左右，留有余地
    return speed * lifetime * 0.7;
  }

  function getMovementVector(g, t) {
    if (!g || !g.player || g.isGameOver || g.isPausedGame || g.isLevelingUp) {
      return { dx: 0, dy: 0 };
    }

    const player = g.player;
    const enemies = g.enemies || [];
    const expOrbs = g.expOrbs || [];
    
    // 计算理想射程距离
    const idealRange = getBulletMaxRange(g);
    const minSafeDistance = 150; // 最小安全距离
    const surroundThreshold = 4; // 被包围的敌人数量阈值
    const surroundRadius = 250; // 包围检测半径

    // 统计周围敌人情况
    let dangerSum = { x: 0, y: 0 };
    let dangerCount = 0;
    let nearestEnemy = null;
    let nearestDist = Infinity;
    let surroundingEnemies = 0;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e._dead) continue;
      
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = e;
      }

      // 统计包围圈内的敌人
      if (dist < surroundRadius) {
        surroundingEnemies++;
        const weight = 1 / Math.max(dist, 30);
        dangerSum.x += dx * weight;
        dangerSum.y += dy * weight;
        dangerCount++;
      }
    }

    let moveX = 0;
    let moveY = 0;

    // 优先级1：被包围时，优先逃跑（远离敌人重心）
    if (surroundingEnemies >= surroundThreshold && dangerCount > 0) {
      // 计算敌人重心的反方向
      moveX = -dangerSum.x;
      moveY = -dangerSum.y;
    }
    // 优先级2：有敌人时，保持在最大射程距离
    else if (nearestEnemy) {
      const dx = nearestEnemy.x - player.x;
      const dy = nearestEnemy.y - player.y;
      
      if (nearestDist < minSafeDistance) {
        // 太近了，快速远离
        moveX = -dx;
        moveY = -dy;
      } else if (nearestDist < idealRange * 0.8) {
        // 在射程内但太近，边后退边绕行
        const retreatX = -dx;
        const retreatY = -dy;
        const tangentX = -dy;
        const tangentY = dx;
        moveX = retreatX * 0.7 + tangentX * 0.3;
        moveY = retreatY * 0.7 + tangentY * 0.3;
      } else if (nearestDist > idealRange * 1.2) {
        // 超出射程，需要靠近一点，但优先检查是否有经验球可捡
        const nearestOrb = findNearestExpOrb(player, expOrbs);
        if (nearestOrb && nearestOrb.dist < 300) {
          // 附近有经验球，去捡
          moveX = nearestOrb.dx;
          moveY = nearestOrb.dy;
        } else {
          // 没有经验球，稍微靠近敌人
          moveX = dx * 0.3;
          moveY = dy * 0.3;
        }
      } else {
        // 在理想射程范围内，检查是否有经验球可捡
        const nearestOrb = findNearestExpOrb(player, expOrbs);
        if (nearestOrb && nearestOrb.dist < 200) {
          // 附近有经验球，去捡
          moveX = nearestOrb.dx;
          moveY = nearestOrb.dy;
        } else {
          // 保持当前距离，轻微绕行
          const tangentX = -dy;
          const tangentY = dx;
          moveX = tangentX * 0.5;
          moveY = tangentY * 0.5;
        }
      }
    }
    // 优先级3：没有敌人时，去捡经验球
    else {
      const nearestOrb = findNearestExpOrb(player, expOrbs);
      if (nearestOrb) {
        moveX = nearestOrb.dx;
        moveY = nearestOrb.dy;
      }
    }

    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    if (len > 0.01) {
      moveX /= len;
      moveY /= len;
    } else {
      // 没有明确目标时，原地待命
      return { dx: 0, dy: 0 };
    }

    return { dx: moveX, dy: moveY };
  }

  // 找到最近的经验球
  function findNearestExpOrb(player, expOrbs) {
    if (!expOrbs || expOrbs.length === 0) return null;
    
    let nearest = null;
    let nearestDist = Infinity;
    
    for (let i = 0; i < expOrbs.length; i++) {
      const orb = expOrbs[i];
      if (!orb || orb._dead) continue;
      
      const dx = orb.x - player.x;
      const dy = orb.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { dx, dy, dist };
      }
    }
    
    return nearest;
  }

  function evaluateSkill(skill, g) {
    let score = 0;
    const tierBonus = [0, 1, 2, 4, 8, 16];
    score += tierBonus[skill.tier] || 1;

    const hpRatio = g.playerHealth / g.playerMaxHealth;
    const name = skill.name || "";
    const desc = skill.description || "";

    if (hpRatio < 0.5) {
      if (name.includes("\u751F\u547D") || name.includes("\u6062\u590D") || name.includes("\u62A4\u76FE") || 
          name.includes("\u518D\u751F") || name.includes("\u6CBB\u7597") || desc.includes("\u751F\u547D") ||
          name.includes("\u95EA\u907F") || name.includes("\u62A4\u7532")) {
        score += 10;
      }
    }

    if (g.level < 5) {
      if (name.includes("\u4F24\u5BB3") || name.includes("\u5B50\u5F39") || name.includes("\u5C04\u901F") ||
          desc.includes("\u4F24\u5BB3") || desc.includes("+15%") || desc.includes("+12%")) {
        score += 5;
      }
    }

    if (g.bulletCount < 3) {
      if (name.includes("\u591A\u91CD") || name.includes("\u6563\u5F39") || desc.includes("\u5B50\u5F39\u6570\u91CF")) {
        score += 8;
      }
    }

    if (name.includes("\u7A7F\u900F") || name.includes("\u8FFD\u8E2A") || name.includes("\u7206\u70B8") ||
        name.includes("\u95EA\u7535") || name.includes("\u51B0\u51BB") || name.includes("\u71C3\u70E7")) {
      score += 4;
    }

    if (name.includes("\u62A4\u76FE") || name.includes("\u98DE\u5203") || name.includes("\u65E0\u4EBA\u673A")) {
      score += 6;
    }

    if (name.includes("\u5438\u8840") || name.includes("\u7ECF\u9A8C") || name.includes("\u62FE\u53D6")) {
      score += 3;
    }

    score += Math.random() * 2;

    return score;
  }

  function autoSelectSkill(g) {
    if (!g || !g.skillChoices || g.skillChoices.length === 0) return;
    if (state.isChoosingSkill) return;

    state.isChoosingSkill = true;
    const gameIdAtStart = currentGameId;

    const choices = g.skillChoices;
    let bestSkill = choices[0];
    let bestScore = -Infinity;

    for (let i = 0; i < choices.length; i++) {
      const score = evaluateSkill(choices[i], g);
      if (score > bestScore) {
        bestScore = score;
        bestSkill = choices[i];
      }
    }

    setTimeout(() => {
      if (gameIdAtStart !== currentGameId) {
        state.isChoosingSkill = false;
        return;
      }
      if (g.isLevelingUp && g.selectSkill) {
        g.selectSkill(bestSkill);
        const overlay = GameApp.DOM && GameApp.DOM.overlay;
        if (overlay) overlay.classList.remove("show");
      }
      state.isChoosingSkill = false;
    }, 300);
  }

  function update(t) {
    if (!state.enabled || !game) return;

    if (game.isLevelingUp && !state.isChoosingSkill) {
      autoSelectSkill(game);
      return;
    }

    if (game.isGameOver || game.isPausedGame || game.isLevelingUp) return;

    if (t - state.lastMoveUpdate >= state.moveUpdateInterval) {
      state.lastMoveUpdate = t;
      const vec = getMovementVector(game, t);
      game.joystickVector = vec;
    }
  }

  try {
    const pref = localStorage.getItem(PREF_AUTOPLAY);
    if (pref === "1") {
      state.enabled = true;
    }
  } catch {}

  const autoPlayBtn = GameApp.DOM && GameApp.DOM.autoPlayToggle;
  if (autoPlayBtn) {
    autoPlayBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });
  }

  refreshAutoPlayIcon();

  const autoPlay = GameApp.AutoPlay = GameApp.AutoPlay || {};
  autoPlay.isEnabled = isEnabled;
  autoPlay.setEnabled = setEnabled;
  autoPlay.toggle = toggle;
  autoPlay.update = update;
  autoPlay.refreshAutoPlayIcon = refreshAutoPlayIcon;
})();
