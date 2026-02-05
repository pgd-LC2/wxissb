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

  function getMovementVector(g, t) {
    if (!g || !g.player || g.isGameOver || g.isPausedGame || g.isLevelingUp) {
      return { dx: 0, dy: 0 };
    }

    const player = g.player;
    const enemies = g.enemies || [];
    const hpRatio = g.playerHealth / g.playerMaxHealth;

    if (enemies.length === 0) {
      return { dx: 0, dy: 0 };
    }

    let nearestEnemy = null;
    let nearestDist = Infinity;
    let dangerSum = { x: 0, y: 0 };
    let dangerCount = 0;

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

      if (dist < 200) {
        const weight = 1 / Math.max(dist, 30);
        dangerSum.x += dx * weight;
        dangerSum.y += dy * weight;
        dangerCount++;
      }
    }

    let moveX = 0;
    let moveY = 0;

    if (hpRatio < 0.3 && dangerCount > 0) {
      moveX = -dangerSum.x;
      moveY = -dangerSum.y;
    } else if (hpRatio < 0.5 && dangerCount > 2) {
      moveX = -dangerSum.x;
      moveY = -dangerSum.y;
    } else if (nearestEnemy) {
      const dx = nearestEnemy.x - player.x;
      const dy = nearestEnemy.y - player.y;
      
      if (nearestDist < 80) {
        const tangentX = -dy;
        const tangentY = dx;
        moveX = tangentX;
        moveY = tangentY;
      } else if (nearestDist > 300) {
        moveX = dx;
        moveY = dy;
      } else {
        const tangentX = -dy;
        const tangentY = dx;
        moveX = dx * 0.3 + tangentX * 0.7;
        moveY = dy * 0.3 + tangentY * 0.7;
      }
    }

    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    if (len > 0.01) {
      moveX /= len;
      moveY /= len;
    } else {
      const angle = t * 0.5;
      moveX = Math.cos(angle);
      moveY = Math.sin(angle);
    }

    return { dx: moveX, dy: moveY };
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
