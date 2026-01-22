/**
 * 技能爆率配置文件
 * 定义各等级技能的掉落权重
 */

(function() {
  "use strict";

  /**
   * 技能等级权重配置
   * 每个等级的权重会根据玩家等级动态调整
   * 
   * 配置说明：
   * - baseWeight: 基础权重
   * - levelFactor: 每多少级增加/减少一次权重
   * - maxWeight: 最大权重上限
   * - minWeight: 最小权重下限
   * - direction: 'increase' 随等级增加权重, 'decrease' 随等级减少权重
   */
  const SKILL_DROP_RATES = {
    // Tier 1 (普通) - 前期高概率，后期降低
    tier1: {
      baseWeight: 14,
      levelFactor: 3,
      maxWeight: 14,
      minWeight: 2,
      direction: 'decrease'
    },
    // Tier 2 (优秀) - 中等概率，随等级略微增加
    tier2: {
      baseWeight: 3,
      levelFactor: 4,
      maxWeight: 8,
      minWeight: 3,
      direction: 'increase'
    },
    // Tier 3 (稀有) - 较低概率，随等级增加
    tier3: {
      baseWeight: 1,
      levelFactor: 5,
      maxWeight: 5,
      minWeight: 1,
      direction: 'increase'
    },
    // Tier 4 (史诗) - 低概率，需要一定等级才能出现
    tier4: {
      baseWeight: 0,
      levelFactor: 7,
      maxWeight: 3,
      minWeight: 0,
      direction: 'increase'
    },
    // Tier 5 (传说) - 极低概率，需要高等级才能出现
    tier5: {
      baseWeight: 0,
      levelFactor: 10,
      maxWeight: 1,
      minWeight: 0,
      direction: 'increase'
    }
  };

  /**
   * 根据玩家等级计算技能权重
   * @param {number} tier - 技能等级 (1-5)
   * @param {number} playerLevel - 玩家等级
   * @returns {number} 计算后的权重
   */
  function calculateSkillWeight(tier, playerLevel) {
    const config = SKILL_DROP_RATES['tier' + tier];
    if (!config) return 1;

    let weight;
    if (config.direction === 'decrease') {
      weight = Math.max(config.minWeight, config.baseWeight - Math.floor(playerLevel / config.levelFactor));
    } else {
      weight = Math.min(config.maxWeight, config.baseWeight + Math.floor(playerLevel / config.levelFactor));
    }

    return Math.max(0, weight);
  }

  // 导出到全局
  window.SkillDropRates = {
    config: SKILL_DROP_RATES,
    calculateWeight: calculateSkillWeight
  };
})();
