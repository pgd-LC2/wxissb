import { GameApp as __GameApp } from '../legacy/context.js';
/**
 * AutoPlay System - AI托管系统
 * 
 * 集成Elite Brain顶级AI决策系统
 * 使用完整的决策树、威胁评估、空间分析和蒙特卡洛模拟
 */
(() => {
  "use strict";

  const GameApp = __GameApp;
  const Storage = GameApp.Infra && GameApp.Infra.Storage ? GameApp.Infra.Storage : null;
  const storageKeys = Storage && Storage.keys ? Storage.keys : {};
  const PREF_AUTOPLAY = storageKeys.autoPlayEnabled || "bigear_pref_autoplay";
  const PREF_ELITE_MODE = storageKeys.eliteAiEnabled || "bigear_pref_elite_ai";

  function safeGet(key, fallback = "") {
    if (Storage && Storage.safeGet) return Storage.safeGet(key, fallback);
    try {
      const value = localStorage.getItem(key);
      return value === null || value === undefined || value === "" ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function safeSet(key, value) {
    if (Storage && Storage.safeSet) {
      Storage.safeSet(key, value);
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {}
  }

  let game = null;
  let currentGameId = 0;
  
  // Elite Brain实例（延迟初始化）
  let eliteBrain = null;
  
  GameApp.Runtime.onGameChange((g) => { 
    game = g;
    currentGameId++;
    state.isChoosingSkill = false;
    state.lastMoveUpdate = 0;
    // 重置Elite Brain状态
    if (eliteBrain) {
      eliteBrain.state = "IDLE";
      eliteBrain.smoothedDirection = { x: 0, y: 0 };
    }
  });

  const state = {
    enabled: false,
    eliteMode: true,  // 默认启用Elite模式
    lastMoveUpdate: 0,
    moveUpdateInterval: 0.016,  // Elite模式下更频繁更新（60fps）
    pendingSkillChoice: false,
    isChoosingSkill: false
  };

  function isEnabled() {
    return state.enabled;
  }

  function setEnabled(enabled) {
    state.enabled = !!enabled;
    safeSet(PREF_AUTOPLAY, state.enabled ? "1" : "0");
    refreshAutoPlayIcon();
  }

  function toggle() {
    setEnabled(!state.enabled);
  }

  function setEliteMode(enabled) {
    state.eliteMode = !!enabled;
    safeSet(PREF_ELITE_MODE, state.eliteMode ? "1" : "0");
    refreshAutoPlayIcon();
  }

  function isEliteMode() {
    return state.eliteMode;
  }

  function toggleEliteMode() {
    setEliteMode(!state.eliteMode);
  }

  function refreshAutoPlayIcon() {
    const btn = GameApp.DOM && GameApp.DOM.autoPlayToggle;
    if (!btn) return;
    if (state.enabled) {
      btn.classList.add("active");
      if (state.eliteMode) {
        btn.textContent = "\uD83E\uDDE0";  // 大脑emoji表示Elite模式
        btn.title = "Elite AI托管中（点击关闭）\n右键切换普通模式";
      } else {
        btn.textContent = "\uD83E\uDD16";
        btn.title = "AI托管中（点击关闭）\n右键切换Elite模式";
      }
    } else {
      btn.classList.remove("active");
      btn.textContent = "\uD83C\uDFAE";
      btn.title = "AI托管（点击开启）";
    }
  }

  // 计算子弹最大射程
  function getBulletMaxRange(g) {
    const GameConfig = GameApp.Config && GameApp.Config.game ? GameApp.Config.game : { baseBulletSpeed: 600 };
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

  // ============================================================================
  // 旧版简单AI（保留作为后备）
  // ============================================================================
  function evaluateSkillSimple(skill, g) {
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

  // ============================================================================
  // Elite Brain技能评估（使用高级AI）
  // ============================================================================
  function evaluateSkillElite(skill, g) {
    // 确保Elite Brain已初始化
    if (!eliteBrain && GameApp.eliteBrainInstance) {
      eliteBrain = GameApp.eliteBrainInstance;
    }
    
    if (eliteBrain && eliteBrain.skillEvaluator) {
      const gameState = eliteBrain.skillEvaluator.analyzeGameState(g);
      return eliteBrain.skillEvaluator.evaluateSkill(skill, g, gameState);
    }
    
    // 后备：使用简单评估
    return evaluateSkillSimple(skill, g);
  }

  function autoSelectSkill(g) {
    if (!g || !g.skillChoices || g.skillChoices.length === 0) return;
    if (state.isChoosingSkill) return;

    state.isChoosingSkill = true;
    const gameIdAtStart = currentGameId;

    const choices = g.skillChoices;
    let bestSkill = choices[0];
    let bestScore = -Infinity;

    // 根据模式选择评估函数
    const evaluateFunc = state.eliteMode ? evaluateSkillElite : evaluateSkillSimple;

    for (let i = 0; i < choices.length; i++) {
      const score = evaluateFunc(choices[i], g);
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
    }, 200);  // Elite模式下更快选择
  }

  // ============================================================================
  // Elite Brain移动决策
  // ============================================================================
  function getMovementVectorElite(g, t) {
    // 确保Elite Brain已初始化
    if (!eliteBrain && GameApp.eliteBrainInstance) {
      eliteBrain = GameApp.eliteBrainInstance;
    }
    
    if (!eliteBrain) {
      // 后备：使用简单AI
      return getMovementVector(g, t);
    }
    
    // 使用Elite Brain进行决策
    return eliteBrain.decide(g, t);
  }

  function update(t) {
    if (!state.enabled || !game) return;

    if (game.isLevelingUp && !state.isChoosingSkill) {
      autoSelectSkill(game);
      return;
    }

    if (game.isGameOver || game.isPausedGame || game.isLevelingUp) return;

    // Elite模式下更频繁更新
    const updateInterval = state.eliteMode ? 0.016 : state.moveUpdateInterval;
    
    if (t - state.lastMoveUpdate >= updateInterval) {
      state.lastMoveUpdate = t;
      
      // 根据模式选择移动向量计算函数
      const vec = state.eliteMode ? getMovementVectorElite(game, t) : getMovementVector(game, t);
      game.joystickVector = vec;
    }
  }

  // 初始化状态
  const pref = safeGet(PREF_AUTOPLAY, "0");
  if (pref === "1") {
    state.enabled = true;
  }
  const elitePref = safeGet(PREF_ELITE_MODE, "1");
  if (elitePref === "0") {
    state.eliteMode = false;
  } else {
    state.eliteMode = true;  // 默认启用Elite模式
  }

  const autoPlayBtn = GameApp.DOM && GameApp.DOM.autoPlayToggle;
  if (autoPlayBtn) {
    // 左键切换AI托管
    autoPlayBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });
    // 右键切换Elite模式
    autoPlayBtn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (state.enabled) {
        toggleEliteMode();
      }
    });
  }

  refreshAutoPlayIcon();

  const autoPlay = GameApp.AutoPlay = GameApp.AutoPlay || {};
  autoPlay.isEnabled = isEnabled;
  autoPlay.setEnabled = setEnabled;
  autoPlay.toggle = toggle;
  autoPlay.update = update;
  autoPlay.refreshAutoPlayIcon = refreshAutoPlayIcon;
  autoPlay.isEliteMode = isEliteMode;
  autoPlay.setEliteMode = setEliteMode;
  autoPlay.toggleEliteMode = toggleEliteMode;
  
  // 获取Elite Brain调试信息
  autoPlay.getDebugInfo = () => {
    if (eliteBrain) {
      return eliteBrain.getDebugInfo();
    }
    return null;
  };
})();
