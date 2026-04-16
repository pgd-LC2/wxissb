(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const Shared = GameApp.UIShared = GameApp.UIShared || {};
  const SkillSystem = GameApp.Deps && GameApp.Deps.SkillSystem ? GameApp.Deps.SkillSystem : GameApp.SkillSystem;

  function getSkillDefinitions() {
    if (!SkillSystem || typeof SkillSystem.generateAllSkills !== "function") {
      return [];
    }

    const extraBladeSkills = typeof SkillSystem.generateExtraBladeSkills === "function"
      ? SkillSystem.generateExtraBladeSkills().map((skill) => ({ ...skill, _requiresBlades: true }))
      : [];

    return SkillSystem.generateAllSkills(extraBladeSkills);
  }

  function getSkillCards(game) {
    if (!game) return [];

    const skillPool = getSkillDefinitions();
    const acquired = game.acquiredSkills || [];
    const meta = game.acquiredSkillMeta || [];
    const cards = [];

    for (let i = 0; i < acquired.length; i++) {
      const name = acquired[i];
      const tier = meta[i] && meta[i].tier ? meta[i].tier : 1;
      const definition = skillPool.find((skill) => skill.name === name);
      const icon = definition
        ? (SkillSystem && SkillSystem.iconFallback ? SkillSystem.iconFallback(definition.icon) : definition.icon)
        : "✦";
      const tierLabel = SkillSystem && SkillSystem.tierName
        ? SkillSystem.tierName(tier)
        : "";

      cards.push({
        name,
        tier,
        icon,
        tierLabel,
        description: definition ? definition.description : ""
      });
    }

    return cards;
  }

  Shared.getSkillDefinitions = getSkillDefinitions;
  Shared.getSkillCards = getSkillCards;
})();

(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const Shared = GameApp.UIShared = GameApp.UIShared || {};

  function getNowSec() {
    if (GameApp.Deps && GameApp.Deps.utils && GameApp.Deps.utils.nowSec) {
      return GameApp.Deps.utils.nowSec();
    }
    return performance.now() / 1000;
  }

  function computeRunSummary(game, nowSecValue = null) {
    if (!game) {
      return {
        timeAlive: 0,
        peak: 0,
        avg: 0,
        score: 0,
        tierObj: { tier: "", color: "#fff" },
        kills: 0,
        skillCount: 0,
        level: 1
      };
    }

    const currentTime = nowSecValue == null ? getNowSec() : nowSecValue;
    const timeAlive = game._startTime ? Math.max(0, currentTime - game._startTime) : 0;
    const peak = Math.round((game.combat && game.combat.peak) ? game.combat.peak : 0);
    const avg = Math.round(
      game.combat && timeAlive > 0
        ? (game.combat.integral / timeAlive)
        : ((game.combat && game.combat.ratingSmooth) ? game.combat.ratingSmooth : 0)
    );
    const score = Math.round(0.72 * avg + 0.28 * peak);
    const tierObj = game._combatTierFromScore
      ? game._combatTierFromScore(score)
      : { tier: "", color: "#fff" };

    return {
      timeAlive,
      peak,
      avg,
      score,
      tierObj,
      kills: game.stats && game.stats.kills ? game.stats.kills : 0,
      skillCount: game.acquiredSkills ? game.acquiredSkills.length : 0,
      level: game.level || 1
    };
  }

  Shared.computeRunSummary = computeRunSummary;
})();

(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const Shared = GameApp.UIShared = GameApp.UIShared || {};
  const Api = GameApp.Infra && GameApp.Infra.Api ? GameApp.Infra.Api : {};

  function createSkillReports(selectedSkills, cards, reason, reasonText, playerName, level, score) {
    const reports = [];

    for (const skillName of selectedSkills) {
      const card = cards.find((item) => item.name === skillName);
      reports.push({
        skill_name: skillName,
        skill_tier: card ? card.tier : 1,
        reason: reason || "没用",
        reason_text: reasonText || "",
        player_name: playerName || "匿名",
        game_level: level || 1,
        game_score: score || 0
      });
    }

    return reports;
  }

  async function submitSkillReports(selectedSkills, cards, reason, reasonText, playerName, level, score) {
    const reports = createSkillReports(selectedSkills, cards, reason, reasonText, playerName, level, score);
    const skillReportApi = Api.skillReport;
    if (!skillReportApi || !skillReportApi.submitSkillReport) {
      throw new Error("Supabase not available");
    }
    return skillReportApi.submitSkillReport(reports);
  }

  Shared.createSkillReports = createSkillReports;
  Shared.submitSkillReports = submitSkillReports;
})();
