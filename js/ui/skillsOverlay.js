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

  function showLevelUpOverlay(g) {
    overlay.classList.add("show");
    overlay.classList.add("mode-levelup");
    overlay.classList.remove("mode-gameover");

    const input = GameApp.Input;
    if (input && input.clearMovementInputs) input.clearMovementInputs();

    overlayTitle.textContent = "LEVEL UP!";
    overlayTitle.style.color = "#ffd60a";
    overlaySubtitle.textContent = "选择一个技能升级";
    gameoverStatsEl.style.display = "none";
    restartRow.style.display = "none";

    choicesEl.innerHTML = "";
    for (const sk of g.skillChoices) {
      const btn = document.createElement("div");
      btn.className = "skillBtn";
      btn.innerHTML = `
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
      });
      choicesEl.appendChild(btn);
    }
  }

  const ui = GameApp.UI = GameApp.UI || {};
  ui.buildSkillPool = buildSkillPool;
  ui.showLevelUpOverlay = showLevelUpOverlay;
})();
