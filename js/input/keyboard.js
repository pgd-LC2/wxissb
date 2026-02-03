(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { hypot } = GameApp.Deps.utils;
  const { SFX } = GameApp.Deps;

  let game = null;
  GameApp.Runtime.onGameChange((g) => { game = g; });

  const keys = new Set();

  // ------------------------------
  // 作弊码系统：按顺序输入 qwertyuiopasdfghjklzxcvbnm 激活所有技能
  // ------------------------------
  const CHEAT_SEQUENCE = "qwertyuiopasdfghjklzxcvbnm";
  let cheatProgress = 0;  // 当前已匹配的字符数
  let cheatActivated = false;  // 是否已激活作弊

  function checkCheatSequence(key) {
    if (cheatActivated) return;  // 已激活则不再检测

    const expectedKey = CHEAT_SEQUENCE[cheatProgress];
    if (key === expectedKey) {
      cheatProgress++;
      // 可选：显示进度提示
      if (cheatProgress > 5 && cheatProgress < CHEAT_SEQUENCE.length) {
        console.log(`[作弊码] 进度: ${cheatProgress}/${CHEAT_SEQUENCE.length}`);
      }
      if (cheatProgress === CHEAT_SEQUENCE.length) {
        activateCheat();
      }
    } else {
      // 输入错误，重置进度（但如果按的是序列的第一个字符，从1开始）
      cheatProgress = (key === CHEAT_SEQUENCE[0]) ? 1 : 0;
    }
  }

  function activateCheat() {
    if (!game || cheatActivated) return;
    cheatActivated = true;

    console.log("[作弊码] 开挂模式激活！获得所有技能！");

    // 获取所有技能并应用
    const allSkills = game.allSkills || [];
    const extraBladeSkills = window.SkillSystem && window.SkillSystem.generateExtraBladeSkills
      ? window.SkillSystem.generateExtraBladeSkills()
      : [];

    // 合并所有技能（包括飞刀分支技能）
    const skillsToApply = [...allSkills, ...extraBladeSkills];

    let appliedCount = 0;
    for (const skill of skillsToApply) {
      if (!skill || !skill.effect) continue;
      // 跳过已拥有的技能
      if (game.acquiredSkills && game.acquiredSkills.includes(skill.name)) continue;

      try {
        skill.effect(game);
        if (!skill._repeatable) {
          game.acquiredSkills.push(skill.name);
          if (game.acquiredSkillMeta) {
            game.acquiredSkillMeta.push({ name: skill.name, tier: skill.tier || 1 });
          }
        }
        appliedCount++;
      } catch (e) {
        console.warn(`[作弊码] 应用技能 "${skill.name}" 失败:`, e);
      }
    }

    // 更新UI
    if (game.updateUI) game.updateUI();

    // 视觉反馈：屏幕闪烁金色
    if (game.flash) {
      game.flash("#ffd700", 0.8);  // 金色闪烁
    }

    // 震动屏幕
    if (game.shakeCamera) {
      game.shakeCamera(15, 0.5);
    }

    // 播放升级音效
    if (SFX && SFX.levelup) {
      const t = performance.now() / 1000;
      SFX.levelup(t);
      // 多播放几次增强效果
      setTimeout(() => SFX.levelup(t + 0.1), 100);
      setTimeout(() => SFX.levelup(t + 0.2), 200);
    }

    console.log(`[作弊码] 成功应用 ${appliedCount} 个技能！`);

    // 显示提示文字（如果有伤害数字显示功能）
    if (game.showDamageNum) {
      game.showDamageNum(game.player.x, game.player.y - 50, "开挂成功!", "#ffd700", true);
    }
  }
  function recomputeKeyVector() {
    let dx = 0, dy = 0;
    if (keys.has("w")) dy -= 1;
    if (keys.has("s")) dy += 1;
    if (keys.has("a")) dx -= 1;
    if (keys.has("d")) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = hypot(dx, dy);
      dx /= len;
      dy /= len;
    }
    return { dx, dy };
  }

  window.addEventListener("keydown", (e) => {
    // 如果焦点在输入框中，完全不处理，让浏览器默认行为处理输入
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      return; // 直接返回，不阻止任何默认行为
    }

    const k = e.key.toLowerCase();

    // 检测作弊码序列
    checkCheatSequence(k);

    // unlock audio on user gesture (autoplay policies)
    SFX.unlock();

    // toggle mute
    if (k === "m") {
      SFX.setMuted(!SFX.isMuted());
      const ui = GameApp.UI;
      if (ui && ui.refreshSoundIcon) ui.refreshSoundIcon();
      e.preventDefault();
      return;
    }

    if (["w", "a", "s", "d"].includes(k)) {
      keys.add(k);
      e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener("keyup", (e) => {
    // 如果焦点在输入框中，完全不处理
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      return; // 直接返回，不阻止任何默认行为
    }

    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(k)) {
      keys.delete(k);
      e.preventDefault();
    }
  }, { passive: false });

  function clearMovementInputs() {
    keys.clear();
    if (game) game.joystickVector = { dx: 0, dy: 0 };
    const input = GameApp.Input;
    if (input && input.setJoyKnob) input.setJoyKnob(0, 0);
  }
  window.addEventListener("blur", clearMovementInputs);
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearMovementInputs(); });

  const input = GameApp.Input = GameApp.Input || {};
  input.recomputeKeyVector = recomputeKeyVector;
  input.clearMovementInputs = clearMovementInputs;
})();
