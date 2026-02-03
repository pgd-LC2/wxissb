(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { overlay, overlayTitle, overlaySubtitle, choicesEl, gameoverStatsEl, restartRow } = GameApp.DOM;
  const { SkillSystem } = GameApp.Deps;
  const { tierName, tierClass, iconFallback, generateAllSkills, generateExtraBladeSkills } = SkillSystem;

  let game = null;
  GameApp.Runtime.onGameChange((g) => { game = g; });

  let allSkillsBase = null;

  function buildSkillPool(g) {
    // extra blade skills: mark requires
    const extra = generateExtraBladeSkills().map((s) => ({ ...s, _requiresBlades: true }));
    allSkillsBase = generateAllSkills(extra);
    g.allSkills = allSkillsBase;
  }

  // 存储当前技能选择按钮，用于作弊模式快捷键选择
  let currentSkillButtons = [];

  function showLevelUpOverlay(g) {
    overlay.classList.add("show");
    overlay.classList.add("mode-levelup");
    overlay.classList.remove("mode-gameover");

    const input = GameApp.Input;
    if (input && input.clearMovementInputs) input.clearMovementInputs();

    // 检查是否开启了作弊模式
    const isCheat = input && input.isCheatActivated && input.isCheatActivated();

    overlayTitle.textContent = "LEVEL UP!";
    overlayTitle.style.color = "#ffd60a";
    // 作弊模式下显示快捷键提示
    overlaySubtitle.textContent = isCheat 
      ? "选择一个技能升级 (按 1/2/3 快速选择)" 
      : "选择一个技能升级";
    gameoverStatsEl.style.display = "none";
    restartRow.style.display = "none";

    choicesEl.innerHTML = "";
    currentSkillButtons = [];  // 重置按钮数组

    g.skillChoices.forEach((sk, index) => {
      const btn = document.createElement("div");
      btn.className = "skillBtn";
      // 作弊模式下显示快捷键数字
      const shortcutHint = isCheat ? `<div class="cheatShortcut">${index + 1}</div>` : "";
      btn.innerHTML = `
        ${shortcutHint}
        <div class="skillIcon ${tierClass(sk.tier)}">${iconFallback(sk.icon)}</div>
        <div class="skillMeta">
          <div class="skillTitleRow">
            <div class="skillName ${tierClass(sk.tier)}">${sk.name}</div>
            <div class="skillTier ${tierClass(sk.tier)}">[${tierName(sk.tier)}]</div>
          </div>
          <div class="skillDesc">${sk.description}</div>
        </div>
        <div style="opacity:.55;font-weight:900">›</div>
      `;
      btn.addEventListener("click", () => {
        if (!game || !game.isLevelingUp) return;
        game.selectSkill(sk);
        overlay.classList.remove("show");
        currentSkillButtons = [];  // 清空按钮数组
      });
      choicesEl.appendChild(btn);
      currentSkillButtons.push({ btn, skill: sk });
    });
  }

  // 作弊模式快捷键选择技能
  function selectSkillByIndex(index) {
    if (!game || !game.isLevelingUp) return false;
    const input = GameApp.Input;
    if (!input || !input.isCheatActivated || !input.isCheatActivated()) return false;
    
    if (index >= 0 && index < currentSkillButtons.length) {
      const { skill } = currentSkillButtons[index];
      game.selectSkill(skill);
      overlay.classList.remove("show");
      currentSkillButtons = [];
      console.log(`[作弊模式] 快捷选择技能 ${index + 1}: ${skill.name}`);
      return true;
    }
    return false;
  }

  // 监听数字键 1/2/3 用于作弊模式快捷选择
  window.addEventListener("keydown", (e) => {
    const input = GameApp.Input;
    if (!input || !input.isCheatActivated || !input.isCheatActivated()) return;
    if (!game || !game.isLevelingUp) return;

    const key = e.key;
    if (key === "1") {
      if (selectSkillByIndex(0)) e.preventDefault();
    } else if (key === "2") {
      if (selectSkillByIndex(1)) e.preventDefault();
    } else if (key === "3") {
      if (selectSkillByIndex(2)) e.preventDefault();
    }
  });

  const ui = GameApp.UI = GameApp.UI || {};
  ui.buildSkillPool = buildSkillPool;
  ui.showLevelUpOverlay = showLevelUpOverlay;
})();
