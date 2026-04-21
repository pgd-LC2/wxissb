import { GameApp as __GameApp } from '../../legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const Progression = GameApp.Progression = GameApp.Progression || {};

  function attachSkillSelection(game, helpers) {
    const { safeNonNeg } = helpers;
    const healingKeywords = ["回血", "回复", "恢复", "再生", "吸血", "治疗", "回春", "修复", "噬魂", "渴血"];
    const healingWeightMultiplier = 2.4;

    function isHealingSkill(skill) {
      const text = `${skill && skill.name ? skill.name : ""} ${skill && skill.description ? skill.description : ""}`;
      return healingKeywords.some((keyword) => text.includes(keyword));
    }

    game.generateSkills = () => {
      const acquired = new Set(game.acquiredSkills || []);
      const candidates = [];

      if (!game._fallbackSkills) {
        game._fallbackSkills = [
          {
            name: "训练：伤害 +5%",
            description: "可重复。基础伤害提升 5%",
            tier: 1,
            icon: "bolt.fill",
            _repeatable: true,
            effect: (current) => { current.bulletDamage *= 1.05; }
          },
          {
            name: "训练：射速 +5%",
            description: "可重复。攻击间隔降低 5%（射速更快）",
            tier: 1,
            icon: "timer",
            _repeatable: true,
            effect: (current) => { current.shootInterval *= 0.95; }
          },
          {
            name: "训练：生命 +10",
            description: "可重复。最大生命 +10，并立刻回复 +10",
            tier: 1,
            icon: "heart.fill",
            _repeatable: true,
            effect: (current) => {
              current.playerMaxHealth += 10;
              current.playerHealth = Math.min(current.playerMaxHealth, current.playerHealth + 10);
              current.updateHealthUI();
            }
          }
        ];
      }

      for (let i = 0; i < game.allSkills.length; i++) {
        const skill = game.allSkills[i];

        if (skill._requiresBlades && game.bladeOrbitCount <= 0) continue;
        if (acquired.has(skill.name)) continue;

        const tier = skill.tier || 1;
        let weight = 1;
        const skillDropRates = Progression.SkillDropRates;
        if (skillDropRates && skillDropRates.calculateWeight) {
          weight = skillDropRates.calculateWeight(tier, game.level);
        } else {
          if (tier === 1) weight = Math.max(2, 14 - Math.floor(game.level / 3));
          else if (tier === 2) weight = Math.min(8, 3 + Math.floor(game.level / 4));
          else if (tier === 3) weight = Math.min(5, 1 + Math.floor(game.level / 5));
          else if (tier === 4) weight = Math.min(3, Math.floor(game.level / 7));
          else if (tier === 5) weight = Math.min(1, Math.floor(game.level / 10));
        }

        if (isHealingSkill(skill)) {
          weight *= healingWeightMultiplier;
        }

        weight = safeNonNeg(weight, 0);
        if (weight <= 0) continue;
        candidates.push({ sk: skill, w: weight });
      }

      function pickIndexWeighted(list) {
        let total = 0;
        for (let i = 0; i < list.length; i++) total += list[i].w;
        if (total <= 0) return -1;

        let roll = Math.random() * total;
        for (let i = 0; i < list.length; i++) {
          roll -= list[i].w;
          if (roll <= 0) return i;
        }
        return list.length - 1;
      }

      const chosen = [];
      const temp = candidates.slice();

      game._skillOfferCount = (game._skillOfferCount || 0) + 1;
      if (game._skillOfferCount <= 50 && !acquired.has("万有引力")) {
        const gravityIdx = temp.findIndex((candidate) => candidate.sk.name === "万有引力");
        if (gravityIdx >= 0) {
          chosen.push(temp[gravityIdx].sk);
          temp[gravityIdx] = temp[temp.length - 1];
          temp.pop();
        }
      }

      while (chosen.length < 3 && temp.length > 0) {
        const index = pickIndexWeighted(temp);
        if (index < 0) break;
        chosen.push(temp[index].sk);
        temp[index] = temp[temp.length - 1];
        temp.pop();
      }

      while (chosen.length < 3) {
        chosen.push(game._fallbackSkills[chosen.length % game._fallbackSkills.length]);
      }

      const seen = new Set();
      const unique = [];
      for (let i = 0; i < chosen.length; i++) {
        const skill = chosen[i];
        if (!skill || seen.has(skill.name)) continue;
        seen.add(skill.name);
        unique.push(skill);
      }

      let fillIndex = 0;
      while (unique.length < 3) {
        const skill = game._fallbackSkills[fillIndex % game._fallbackSkills.length];
        fillIndex += 1;
        if (!seen.has(skill.name)) {
          seen.add(skill.name);
          unique.push(skill);
        }
      }

      game.skillChoices = unique;
    };

    game.selectSkill = (skill) => {
      skill.effect(game);
      if (typeof game.rebalanceStats === "function") game.rebalanceStats();
      if (!skill._repeatable) {
        game.acquiredSkills.push(skill.name);
        if (game.acquiredSkillMeta) game.acquiredSkillMeta.push({ name: skill.name, tier: skill.tier || 1 });
      }

      game.isLevelingUp = false;
      game.isPausedGame = false;
      game.updateUI();
    };

    game.resetGame = () => {};
  }

  Progression.attachSkillSelection = attachSkillSelection;
})();
