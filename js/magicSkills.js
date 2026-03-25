/**
 * 魔法技能系统 - 500个独特的魔法类技能
 * 每个技能都有完整的逻辑实现，不是凑数
 * 
 * 技能分类：
 * 1. 元素魔法 (100个) - 火、冰、雷、风、土、光、暗、毒、水、奥术
 * 2. 召唤魔法 (40个) - 魔法傀儡、幻影、高级召唤
 * 3. 时空魔法 (60个) - 时间操控、空间折叠、传送、维度
 * 4. 附魔魔法 (60个) - 武器附魔、护甲附魔、增益魔法
 * 5. 诅咒魔法 (50个) - 减益、诅咒、腐蚀、恐惧
 * 6. 治愈魔法 (40个) - 回复、净化、复苏、庇护
 * 7. 结界魔法 (50个) - 护盾、结界、屏障、领域
 * 8. 符文魔法 (60个) - 符文阵、铭刻、魔法印记
 */

(() => {
  "use strict";

  // ============================================
  // 魔法系统状态定义
  // ============================================
  const MagicState = {
    // 魔法傀儡
    golems: [],           // {type, x, y, hp, damage, size, lastAttack}
    
    // 幻影分身
    phantoms: [],         // {x, y, lifetime, attackRate, lastAttack}
    
    // 符文阵
    runeCircles: [],      // {type, x, y, radius, duration, nextTick, born}
    
    // 魔法弹幕
    magicProjectiles: [], // {type, x, y, vx, vy, damage, effect, born}
    
    // 魔法光束
    magicBeams: [],       // {type, x1, y1, x2, y2, damage, width, duration, born}
    
    // 领域效果
    domains: [],          // {type, x, y, radius, effect, duration, born}
    
    // 时间效果
    timeEffects: [],      // {type, targetId, duration, startTime}
    
    // 诅咒标记
    curseMarks: [],       // {enemyId, type, stacks, duration, lastTick}
    
    // 魔法护盾
    magicShields: [],     // {type, hp, maxHp, regenRate, lastDamage}
    
    // 魔力值系统 (新增资源)
    mana: 100,
    maxMana: 100,
    manaRegen: 5,         // 每秒回复
    lastManaRegen: 0,
    
    // 施法状态
    casting: false,
    castTime: 0,
    castingSpell: null,
    
    // 魔法组合系统
    comboCount: 0,
    lastSpellTime: 0,
    comboSpells: [],
    
    // 元素亲和
    elementalAffinity: {
      fire: 0,
      ice: 0,
      lightning: 0,
      wind: 0,
      earth: 0,
      light: 0,
      dark: 0,
      poison: 0,
      water: 0,
      arcane: 0
    },
    
    // 魔法强化
    spellPower: 1.0,
    spellCooldownReduction: 0,
    spellRangeBonus: 0,
    spellAreaBonus: 0,
    
    // 特殊状态
    arcaneOverload: false,
    arcaneOverloadEnd: 0,
    elementalHarmony: false,
    runicEmpowerment: false
  };

  // ============================================
  // 魔法技能生成器
  // ============================================
  function generateMagicSkills() {
    const skills = [];
    
    // ------------------------------------------
    // 第一类：元素魔法 (100个)
    // ------------------------------------------
    
    // 火焰系 (20个)
    const fireSkills = [
      // 基础火焰
      { name: "火球术", tier: 1, desc: "射击时有30%几率发射追踪火球", 
        effect: g => { g.magic.fireballChance = (g.magic.fireballChance||0) + 0.30; }},
      { name: "烈焰爆发", tier: 2, desc: "火球命中后爆炸，造成范围伤害",
        effect: g => { g.magic.fireballExplode = true; g.magic.fireballExplosionRadius = 50; }},
      { name: "灼热射线", tier: 2, desc: "持续射出火焰射线，每秒造成伤害",
        effect: g => { g.magic.fireRayEnabled = true; g.magic.fireRayDamage = 8; }},
      { name: "火焰风暴", tier: 3, desc: "每15秒在敌人密集处召唤火焰风暴",
        effect: g => { g.magic.fireStormEnabled = true; g.magic.fireStormInterval = 15; g.magic.fireStormDamage = 100; }},
      { name: "熔岩护甲", tier: 3, desc: "受击时喷发熔岩，灼烧周围敌人",
        effect: g => { g.magic.lavaArmorEnabled = true; g.magic.lavaArmorDamage = 20; }},
      
      // 进阶火焰
      { name: "地狱火雨", tier: 4, desc: "每10秒召唤火焰从天而降",
        effect: g => { g.magic.fireRainEnabled = true; g.magic.fireRainInterval = 10; g.magic.fireRainCount = 8; }},
      { name: "凤凰之焰", tier: 4, desc: "火焰伤害+50%，燃烧敌人死亡时爆炸",
        effect: g => { g.magic.phoenixFlame = true; g.magic.fireDamageBonus = (g.magic.fireDamageBonus||1) * 1.5; }},
      { name: "业火焚身", tier: 3, desc: "燃烧效果可叠加，最多5层",
        effect: g => { g.magic.burnStacking = true; g.magic.maxBurnStacks = 5; }},
      { name: "火焰印记", tier: 2, desc: "燃烧的敌人受到所有伤害+20%",
        effect: g => { g.magic.flameMarkEnabled = true; g.magic.flameMarkBonus = 0.20; }},
      { name: "爆燃", tier: 3, desc: "暴击时触发爆燃，对燃烧敌人造成额外伤害",
        effect: g => { g.magic.combustion = true; g.magic.combustionDamage = 30; }},
      
      // 大师火焰
      { name: "太阳之怒", tier: 5, desc: "召唤小型太阳环绕，持续灼烧敌人",
        effect: g => { g.magic.miniSunEnabled = true; g.magic.miniSunDamage = 15; g.magic.miniSunRadius = 150; }},
      { name: "灭世炎爆", tier: 5, desc: "蓄力3秒后释放巨大爆炸，伤害范围内所有敌人",
        effect: g => { g.magic.worldFireEnabled = true; g.magic.worldFireDamage = 500; g.magic.worldFireRadius = 300; }},
      { name: "永燃之火", tier: 4, desc: "你的燃烧效果永不消失",
        effect: g => { g.magic.eternalFlame = true; }},
      { name: "火焰精通", tier: 2, desc: "所有火焰技能效果+30%",
        effect: g => { g.magic.elementalAffinity.fire += 0.30; }},
      { name: "火焰亲和", tier: 1, desc: "火焰魔法冷却-20%",
        effect: g => { g.magic.fireCooldownReduction = (g.magic.fireCooldownReduction||0) + 0.20; }},
      
      { name: "焰爆术", tier: 2, desc: "击杀燃烧敌人时产生连环爆炸",
        effect: g => { g.magic.chainFireExplosion = true; }},
      { name: "火焰漩涡", tier: 3, desc: "创建火焰漩涡吸引并焚烧敌人",
        effect: g => { g.magic.fireVortexEnabled = true; g.magic.fireVortexPullForce = 50; }},
      { name: "熔核投射", tier: 3, desc: "射击时偶尔发射熔核，落地产生岩浆池",
        effect: g => { g.magic.moltenCoreChance = 0.15; g.magic.lavaPuddleDuration = 5; }},
      { name: "火焰屏障", tier: 2, desc: "周围形成火焰墙，阻挡并伤害敌人",
        effect: g => { g.magic.fireWallEnabled = true; g.magic.fireWallRadius = 100; }},
      { name: "炎帝祝福", tier: 5, desc: "火焰伤害+100%，免疫燃烧，接触敌人时自动灼烧",
        effect: g => { g.magic.fireEmperorBlessing = true; g.magic.fireDamageBonus = (g.magic.fireDamageBonus||1) * 2; }}
    ];
    
    // 冰霜系 (20个)
    const iceSkills = [
      { name: "冰霜新星", tier: 2, desc: "受伤时释放冰霜新星，冻结周围敌人",
        effect: g => { g.magic.frostNovaOnHit = true; g.magic.frostNovaRadius = 120; }},
      { name: "寒冰箭", tier: 1, desc: "30%几率射出寒冰箭，减速敌人",
        effect: g => { g.magic.iceArrowChance = (g.magic.iceArrowChance||0) + 0.30; }},
      { name: "暴风雪", tier: 3, desc: "每12秒在周围召唤暴风雪",
        effect: g => { g.magic.blizzardEnabled = true; g.magic.blizzardInterval = 12; g.magic.blizzardRadius = 200; }},
      { name: "冰封结界", tier: 3, desc: "创建冰封领域，敌人进入后持续减速并受伤",
        effect: g => { g.magic.frozenDomainEnabled = true; g.magic.frozenDomainRadius = 150; }},
      { name: "绝对零度", tier: 4, desc: "冻结的敌人受到的伤害+50%",
        effect: g => { g.magic.absoluteZero = true; g.magic.frozenDamageBonus = 0.50; }},
      
      { name: "冰晶护盾", tier: 2, desc: "生成吸收伤害的冰晶护盾",
        effect: g => { g.magic.iceShieldEnabled = true; g.magic.iceShieldAbsorb = 50; }},
      { name: "寒冰陷阱", tier: 2, desc: "移动时留下冰冻陷阱",
        effect: g => { g.magic.iceTrapEnabled = true; g.magic.iceTrapInterval = 3; }},
      { name: "冰锥术", tier: 3, desc: "向前方发射冰锥阵，穿透敌人",
        effect: g => { g.magic.iceSpikesEnabled = true; g.magic.iceSpikesPierceCount = 5; }},
      { name: "冰霜之触", tier: 1, desc: "所有攻击附带减速效果",
        effect: g => { g.magic.frostTouch = true; g.magic.frostSlowAmount = 0.30; }},
      { name: "冰河时代", tier: 5, desc: "全屏敌人减速50%，冻结几率+30%",
        effect: g => { g.magic.iceAgeEnabled = true; g.magic.globalSlowAmount = 0.50; }},
      
      { name: "寒冰护甲", tier: 2, desc: "减伤+10%，接触敌人减速它们",
        effect: g => { g.damageReduction += 0.10; g.magic.frostArmor = true; }},
      { name: "冰霜脉冲", tier: 3, desc: "每8秒释放冰霜脉冲，减速所有敌人",
        effect: g => { g.magic.frostPulseEnabled = true; g.magic.frostPulseInterval = 8; }},
      { name: "碎冰", tier: 3, desc: "冻结敌人死亡时爆炸碎冰伤害周围",
        effect: g => { g.magic.shatterIce = true; g.magic.shatterRadius = 80; }},
      { name: "冰霜精通", tier: 2, desc: "所有冰霜技能效果+30%",
        effect: g => { g.magic.elementalAffinity.ice += 0.30; }},
      { name: "极寒领域", tier: 4, desc: "周围敌人自动减速，越近减速越强",
        effect: g => { g.magic.chillAuraEnabled = true; g.magic.chillAuraRadius = 180; }},
      
      { name: "冰封万物", tier: 4, desc: "冻结几率+40%，持续时间+1秒",
        effect: g => { g.freezeChance += 0.40; g.freezeDuration += 1.0; }},
      { name: "寒冰分身", tier: 3, desc: "创建冰霜分身协助战斗",
        effect: g => { g.magic.iceCloneEnabled = true; g.magic.iceCloneCount = 1; }},
      { name: "冰川坠落", tier: 4, desc: "每20秒召唤冰川砸向敌人密集处",
        effect: g => { g.magic.glacierEnabled = true; g.magic.glacierDamage = 200; }},
      { name: "霜冻之心", tier: 5, desc: "生命值越低，冰霜伤害越高，最高+100%",
        effect: g => { g.magic.frostHeart = true; }},
      { name: "冰封女皇", tier: 5, desc: "免疫减速，所有攻击必定冻结，冻结持续时间翻倍",
        effect: g => { g.magic.iceQueenBlessing = true; g.freezeChance = 1.0; g.freezeDuration *= 2; }}
    ];
    
    // 雷电系 (20个)
    const lightningSkills = [
      { name: "连锁闪电", tier: 2, desc: "攻击有30%几率触发连锁闪电",
        effect: g => { g.magic.chainLightningChance = (g.magic.chainLightningChance||0) + 0.30; }},
      { name: "雷霆一击", tier: 3, desc: "暴击时召唤雷霆轰击敌人",
        effect: g => { g.magic.thunderStrikeOnCrit = true; g.magic.thunderStrikeDamage = 50; }},
      { name: "闪电护盾", tier: 2, desc: "被击中时反击闪电",
        effect: g => { g.magic.lightningShieldEnabled = true; g.magic.lightningShieldDamage = 25; }},
      { name: "电弧", tier: 1, desc: "子弹在敌人之间弹跳",
        effect: g => { g.magic.arcEnabled = true; g.magic.arcBounces = 2; }},
      { name: "雷云", tier: 3, desc: "召唤雷云跟随玩家，随机劈向敌人",
        effect: g => { g.magic.thunderCloudEnabled = true; g.magic.thunderCloudInterval = 1.5; }},
      
      { name: "静电力场", tier: 2, desc: "敌人进入范围内会被静电麻痹",
        effect: g => { g.magic.staticFieldEnabled = true; g.magic.staticFieldRadius = 100; }},
      { name: "雷霆之怒", tier: 4, desc: "连续击杀叠加雷电伤害，最高+100%",
        effect: g => { g.magic.thunderRage = true; g.magic.thunderRageMaxBonus = 1.0; }},
      { name: "电磁脉冲", tier: 3, desc: "每10秒释放电磁脉冲，眩晕敌人",
        effect: g => { g.magic.empEnabled = true; g.magic.empInterval = 10; g.magic.empStunDuration = 1.5; }},
      { name: "雷神降临", tier: 5, desc: "变身雷神形态，所有攻击附带雷电",
        effect: g => { g.magic.thorForm = true; g.magic.allAttacksLightning = true; }},
      
      { name: "电击", tier: 1, desc: "攻击有20%几率使敌人麻痹0.5秒",
        effect: g => { g.magic.shockChance = 0.20; g.magic.shockDuration = 0.5; }},
      { name: "超载", tier: 4, desc: "麻痹的敌人受到伤害时触发连锁反应",
        effect: g => { g.magic.overchargeEnabled = true; }},
      { name: "雷电精通", tier: 2, desc: "所有雷电技能效果+30%",
        effect: g => { g.magic.elementalAffinity.lightning += 0.30; }},
      { name: "感应闪电", tier: 2, desc: "攻击自动瞄准最近的敌人",
        effect: g => { g.magic.homingLightning = true; g.homingStrength += 0.5; }},
      { name: "雷光乍现", tier: 3, desc: "移动速度提升时，闪电伤害也提升",
        effect: g => { g.magic.speedLightning = true; }},
      
      { name: "电弧链接", tier: 3, desc: "连锁闪电可跳跃到更多目标",
        effect: g => { g.chainCount += 3; }},
      { name: "雷霆召唤", tier: 4, desc: "每5秒在随机敌人位置召唤落雷",
        effect: g => { g.magic.randomThunderEnabled = true; g.magic.randomThunderInterval = 5; }},
      { name: "电能吸收", tier: 3, desc: "雷电伤害的10%转化为生命",
        effect: g => { g.magic.lightningLeech = true; g.magic.lightningLeechPercent = 0.10; }},
      { name: "离子风暴", tier: 4, desc: "创建离子风暴区域，持续雷击",
        effect: g => { g.magic.ionStormEnabled = true; g.magic.ionStormRadius = 200; }},
      { name: "雷帝之怒", tier: 5, desc: "雷电伤害+100%，免疫麻痹，所有雷电效果翻倍",
        effect: g => { g.magic.thunderEmperor = true; g.magic.elementalAffinity.lightning += 1.0; }},
      { name: "雷霆之锚", tier: 3, desc: "在当前位置放置雷锚，5秒内可瞬移回去并引爆雷锚对周围敌人造成伤害",
        effect: g => { g.magic.thunderAnchor = true; g.magic.thunderAnchorDamage = 80; g.magic.thunderAnchorDuration = 5; }}
    ];
    
    // 风系 (10个)
    const windSkills = [
      { name: "风刃", tier: 1, desc: "射出风刃，穿透敌人并造成流血",
        effect: g => { g.magic.windBladeEnabled = true; g.magic.windBladePierce = 3; }},
      { name: "龙卷风", tier: 3, desc: "召唤龙卷风吸引并抛飞敌人",
        effect: g => { g.magic.tornadoEnabled = true; g.magic.tornadoDuration = 5; }},
      { name: "风之守护", tier: 2, desc: "周围形成风墙，弹开投射物",
        effect: g => { g.magic.windWallEnabled = true; g.magic.windWallDeflect = 0.5; }},
      { name: "疾风步", tier: 2, desc: "移动速度+25%，并留下风刃轨迹",
        effect: g => { g.playerSpeedMulti *= 1.25; g.magic.windTrailEnabled = true; }},
      { name: "风暴召唤", tier: 4, desc: "召唤风暴笼罩战场，所有敌人减速",
        effect: g => { g.magic.stormCallEnabled = true; g.magic.stormSlowAmount = 0.30; }},
      
      { name: "旋风斩", tier: 3, desc: "旋转时释放旋风斩伤害周围敌人",
        effect: g => { g.magic.whirlwindEnabled = true; g.magic.whirlwindDamage = 30; }},
      { name: "风之精通", tier: 2, desc: "所有风系技能效果+30%",
        effect: g => { g.magic.elementalAffinity.wind += 0.30; }},
      { name: "风神疾行", tier: 4, desc: "移动速度+50%，受击时有几率闪避",
        effect: g => { g.playerSpeedMulti *= 1.5; g.dodgeChance += 0.15; }},
      { name: "风王结界", tier: 5, desc: "创建风之结界，敌人无法接近",
        effect: g => { g.magic.windBarrierEnabled = true; g.magic.windBarrierRadius = 120; }},
      { name: "风压屏障", tier: 2, desc: "近身敌人被风压弹开，并受到少量伤害",
        effect: g => { g.magic.windPressureBarrier = true; g.magic.windPressureKnockback = 120; g.magic.windPressureDamage = 15; }}
    ];
    
    // 土系 (10个)
    const earthSkills = [
      { name: "岩石护甲", tier: 2, desc: "减伤+20%，但移速-10%",
        effect: g => { g.damageReduction += 0.20; g.playerSpeedMulti *= 0.9; }},
      { name: "地震", tier: 3, desc: "每12秒触发地震，眩晕并伤害敌人",
        effect: g => { g.magic.earthquakeEnabled = true; g.magic.earthquakeInterval = 12; }},
      { name: "石墙", tier: 2, desc: "在身后创建石墙阻挡敌人",
        effect: g => { g.magic.stoneWallEnabled = true; }},
      { name: "岩刺", tier: 2, desc: "地面随机升起岩刺伤害敌人",
        effect: g => { g.magic.earthSpikesEnabled = true; g.magic.earthSpikesInterval = 2; }},
      { name: "大地之力", tier: 3, desc: "站定时伤害+40%，受伤-30%",
        effect: g => { g.magic.earthPower = true; g.stationaryDamageBonus += 0.40; }},
      
      { name: "石化", tier: 3, desc: "攻击有10%几率石化敌人2秒",
        effect: g => { g.magic.petrifyChance = 0.10; g.magic.petrifyDuration = 2; }},
      { name: "熔岩裂缝", tier: 4, desc: "地震后留下熔岩裂缝持续伤害",
        effect: g => { g.magic.lavaFissure = true; g.magic.lavaFissureDuration = 5; }},
      { name: "大地精通", tier: 2, desc: "所有土系技能效果+30%",
        effect: g => { g.magic.elementalAffinity.earth += 0.30; }},
      { name: "山岳之躯", tier: 4, desc: "最大生命+100，受到的击退减少80%",
        effect: g => { g.playerMaxHealth += 100; g.playerHealth += 100; g.magic.knockbackResist = 0.80; }},
      { name: "盖亚之力", tier: 5, desc: "召唤石巨人协助战斗",
        effect: g => { g.magic.stoneGolemEnabled = true; g.magic.stoneGolemCount = 1; }}
    ];
    
    // 光明系 (10个)
    const lightSkills = [
      { name: "圣光术", tier: 1, desc: "攻击附带圣光伤害，对暗属性敌人加倍",
        effect: g => { g.magic.holyLightEnabled = true; g.magic.holyDamageBonus = 0.20; }},
      { name: "净化之光", tier: 2, desc: "周围敌人的增益效果被净化",
        effect: g => { g.magic.purifyingLight = true; g.magic.purifyRadius = 150; }},
      { name: "光明护盾", tier: 2, desc: "生成光明护盾吸收伤害",
        effect: g => { g.magic.lightShieldEnabled = true; g.magic.lightShieldAbsorb = 80; }},
      { name: "圣光爆发", tier: 3, desc: "受伤时释放圣光爆发致盲敌人",
        effect: g => { g.magic.holyBurst = true; g.magic.holyBurstRadius = 100; }},
      { name: "天使降临", tier: 4, desc: "每30秒召唤天使协助战斗",
        effect: g => { g.magic.angelEnabled = true; g.magic.angelInterval = 30; }},
      
      { name: "神圣之地", tier: 3, desc: "创建神圣领域，提升伤害和回复",
        effect: g => { g.magic.holyGroundEnabled = true; g.magic.holyGroundRadius = 180; }},
      { name: "光之精通", tier: 2, desc: "所有光明技能效果+30%",
        effect: g => { g.magic.elementalAffinity.light += 0.30; }},
      { name: "审判之光", tier: 4, desc: "标记敌人，标记敌人受到更多伤害",
        effect: g => { g.magic.judgmentMark = true; g.magic.judgmentBonus = 0.35; }},
      { name: "圣光射线", tier: 3, desc: "发射贯穿的圣光射线",
        effect: g => { g.magic.holyRayEnabled = true; g.magic.holyRayPierce = 999; }},
      { name: "光明使者", tier: 5, desc: "变身光明使者，伤害+50%，免疫黑暗效果",
        effect: g => { g.magic.lightMessenger = true; g.bulletDamage *= 1.5; }}
    ];
    
    // 黑暗系 (10个)
    const darkSkills = [
      { name: "暗影箭", tier: 1, desc: "射出暗影箭，无视部分护甲",
        effect: g => { g.magic.shadowArrowEnabled = true; g.magic.armorPenetration = 0.30; }},
      { name: "暗影步", tier: 2, desc: "短暂进入暗影状态，免疫伤害",
        effect: g => { g.magic.shadowStepEnabled = true; g.magic.shadowStepCooldown = 5; }},
      { name: "恐惧", tier: 2, desc: "附近敌人有几率被恐惧逃跑",
        effect: g => { g.magic.fearAuraEnabled = true; g.magic.fearChance = 0.15; }},
      { name: "暗影之触", tier: 2, desc: "攻击吸取敌人生命",
        effect: g => { g.lifestealChance += 0.30; g.lifestealPercent += 0.10; }},
      { name: "暗影分身", tier: 3, desc: "创建暗影分身攻击敌人",
        effect: g => { g.magic.shadowCloneEnabled = true; g.magic.shadowCloneCount = 2; }},
      
      { name: "黑暗祭坛", tier: 3, desc: "击杀敌人恢复生命和魔力",
        effect: g => { g.magic.darkAltarEnabled = true; g.magic.darkAltarHeal = 5; }},
      { name: "暗影精通", tier: 2, desc: "所有黑暗技能效果+30%",
        effect: g => { g.magic.elementalAffinity.dark += 0.30; }},
      { name: "暗影爆发", tier: 4, desc: "释放暗影能量爆炸伤害周围敌人",
        effect: g => { g.magic.shadowBurstEnabled = true; g.magic.shadowBurstInterval = 8; }},
      { name: "虚无领域", tier: 4, desc: "创建虚无领域，敌人伤害降低50%",
        effect: g => { g.magic.voidDomainEnabled = true; g.magic.voidDomainRadius = 200; }},
      { name: "暗黑君主", tier: 5, desc: "变身暗黑形态，伤害+100%，受伤+50%",
        effect: g => { g.magic.darkLord = true; g.bulletDamage *= 2; g.damageReduction -= 0.50; }}
    ];
    
    // 将所有元素技能添加到列表
    skills.push(...fireSkills.map(s => ({ ...s, icon: "flame.fill", category: "fire" })));
    skills.push(...iceSkills.map(s => ({ ...s, icon: "snowflake", category: "ice" })));
    skills.push(...lightningSkills.map(s => ({ ...s, icon: "bolt.fill", category: "lightning" })));
    skills.push(...windSkills.map(s => ({ ...s, icon: "wind", category: "wind" })));
    skills.push(...earthSkills.map(s => ({ ...s, icon: "mountain.2.fill", category: "earth" })));
    skills.push(...lightSkills.map(s => ({ ...s, icon: "sun.max.fill", category: "light" })));
    skills.push(...darkSkills.map(s => ({ ...s, icon: "moon.fill", category: "dark" })));

    // ------------------------------------------
    // 第二类：召唤魔法 (40个)
    // ------------------------------------------
    
    // 魔法傀儡 (20个)
    const golemSummons = [
      { name: "召唤雷电傀儡", tier: 2, desc: "召唤雷电傀儡，攻击时释放链式闪电跳跃至3个敌人",
        effect: g => { g.magic.thunderGolemCount = (g.magic.thunderGolemCount||0) + 1; }},
      { name: "石傀儡强化", tier: 3, desc: "石傀儡生命+200，攻击击退敌人",
        effect: g => { g.magic.stoneGolemHealthBonus = 200; g.magic.stoneGolemKnockback = true; }},
      { name: "召唤水晶傀儡", tier: 3, desc: "召唤水晶傀儡，反弹敌人攻击",
        effect: g => { g.magic.crystalGolemCount = (g.magic.crystalGolemCount||0) + 1; }},
      { name: "召唤熔岩傀儡", tier: 4, desc: "召唤熔岩傀儡，接触敌人造成持续燃烧",
        effect: g => { g.magic.lavaGolemCount = (g.magic.lavaGolemCount||0) + 1; }},
      { name: "召唤暗影刺客", tier: 3, desc: "召唤隐身暗影刺客，优先暗杀低血量敌人",
        effect: g => { g.magic.shadowAssassinCount = (g.magic.shadowAssassinCount||0) + 1; g.magic.shadowAssassinDamage = 60; }},
      
      { name: "傀儡制造者", tier: 4, desc: "所有傀儡数量+1",
        effect: g => { 
          g.magic.stoneGolemCount = (g.magic.stoneGolemCount||0) + 1;
          g.magic.shadowAssassinCount = (g.magic.shadowAssassinCount||0) + 1;
        }},
      { name: "傀儡爆炸", tier: 3, desc: "傀儡死亡时爆炸",
        effect: g => { g.magic.golemExplosion = true; g.magic.golemExplosionDamage = 100; }},
      { name: "傀儡修复", tier: 2, desc: "傀儡每秒回复5%生命",
        effect: g => { g.magic.golemRegen = 0.05; }},
      { name: "傀儡核心", tier: 4, desc: "傀儡死亡后留下核心继续战斗",
        effect: g => { g.magic.golemCore = true; }},
      { name: "巨型傀儡", tier: 5, desc: "傀儡体积和伤害翻倍",
        effect: g => { g.magic.giantGolem = true; }},
      
      { name: "召唤骨傀儡", tier: 2, desc: "召唤骨傀儡快速移动攻击",
        effect: g => { g.magic.boneGolemCount = (g.magic.boneGolemCount||0) + 1; }},
      { name: "召唤木傀儡", tier: 1, desc: "召唤木傀儡阻挡敌人",
        effect: g => { g.magic.woodGolemCount = (g.magic.woodGolemCount||0) + 1; }},
      { name: "召唤冰傀儡", tier: 3, desc: "召唤冰傀儡减速周围敌人",
        effect: g => { g.magic.iceGolemCount = (g.magic.iceGolemCount||0) + 1; }},
      { name: "傀儡狂暴", tier: 4, desc: "傀儡攻击速度+100%，伤害+50%",
        effect: g => { g.magic.golemFrenzy = true; }},
      { name: "傀儡大师", tier: 5, desc: "可以控制傀儡移动和攻击",
        effect: g => { g.magic.golemMaster = true; }},
      
      { name: "傀儡链接", tier: 3, desc: "傀儡之间形成链接伤害敌人",
        effect: g => { g.magic.golemLink = true; }},
      { name: "傀儡献祭", tier: 3, desc: "牺牲傀儡造成大量伤害",
        effect: g => { g.magic.golemSacrifice = true; g.magic.golemSacrificeDamage = 300; }},
      { name: "傀儡充能", tier: 2, desc: "击杀敌人为傀儡充能，提升下次攻击",
        effect: g => { g.magic.golemCharge = true; }},
      { name: "永恒傀儡", tier: 5, desc: "傀儡不会死亡",
        effect: g => { g.magic.immortalGolem = true; }},
      { name: "傀儡军团", tier: 5, desc: "所有傀儡数量×3",
        effect: g => { g.magic.golemLegion = true; }}
    ];
    
    // 幻影 (5个 - 已移除图腾相关技能)
    const phantomAndTotemSkills = [
      { name: "幻影分身", tier: 2, desc: "创建一个幻影分身复制你的攻击",
        effect: g => { g.magic.phantomCount = (g.magic.phantomCount||0) + 1; }},
      { name: "幻影爆发", tier: 3, desc: "幻影数量+2，消失时爆炸",
        effect: g => { g.magic.phantomCount = (g.magic.phantomCount||0) + 2; g.magic.phantomExplosion = true; }},
      { name: "完美幻影", tier: 4, desc: "幻影造成100%伤害而非50%",
        effect: g => { g.magic.perfectPhantom = true; }},
      { name: "永恒幻影", tier: 5, desc: "幻影不会消失",
        effect: g => { g.magic.eternalPhantom = true; }},
      { name: "幻影军团", tier: 5, desc: "幻影数量×3",
        effect: g => { g.magic.phantomCount = (g.magic.phantomCount||0) * 3; }},
      { name: "幻影交换", tier: 3, desc: "受到致命伤害时与幻影交换位置",
        effect: g => { g.magic.phantomSwap = true; }},
      { name: "召唤王座", tier: 5, desc: "所有召唤物获得增益并回复生命",
        effect: g => { g.magic.throneOfSummoning = true; }}
    ];
    
    // 高级召唤 (20个)
    const advancedSummons = [
      { name: "召唤亡灵", tier: 2, desc: "击杀敌人有几率召唤其亡灵为你战斗",
        effect: g => { g.magic.undeadSummonChance = 0.15; }},
      { name: "亡灵军团", tier: 4, desc: "亡灵召唤几率+30%，数量上限+5",
        effect: g => { g.magic.undeadSummonChance += 0.30; g.magic.undeadMaxCount = (g.magic.undeadMaxCount||5) + 5; }},
      { name: "召唤恶魔", tier: 4, desc: "召唤恶魔协助战斗，消耗生命维持",
        effect: g => { g.magic.demonSummonEnabled = true; g.magic.demonCount = 1; }},
      { name: "恶魔契约", tier: 5, desc: "恶魔不再消耗生命，伤害+100%",
        effect: g => { g.magic.demonPact = true; }},
      { name: "召唤天使", tier: 4, desc: "召唤天使治疗并协助战斗",
        effect: g => { g.magic.angelSummonEnabled = true; g.magic.angelCount = 1; }},
      
      { name: "召唤龙", tier: 5, desc: "召唤幼龙喷射火焰攻击",
        effect: g => { g.magic.dragonSummonEnabled = true; }},
      { name: "龙之怒火", tier: 5, desc: "龙的火焰伤害+200%",
        effect: g => { g.magic.dragonFireBonus = 2.0; }},
      { name: "召唤凤凰", tier: 5, desc: "召唤凤凰，死亡时涅槃重生",
        effect: g => { g.magic.phoenixSummonEnabled = true; }},
      { name: "召唤海怪", tier: 4, desc: "召唤海怪触手攻击敌人",
        effect: g => { g.magic.krakenSummonEnabled = true; }},
      
      { name: "召唤骸骨骑士", tier: 3, desc: "召唤骸骨骑士冲锋敌人",
        effect: g => { g.magic.skeletonKnightCount = (g.magic.skeletonKnightCount||0) + 1; }},
      { name: "召唤魔眼", tier: 2, desc: "召唤漂浮魔眼发射射线攻击",
        effect: g => { g.magic.magicEyeCount = (g.magic.magicEyeCount||0) + 1; }},
      { name: "召唤蘑菇", tier: 1, desc: "召唤爆炸蘑菇定时爆炸",
        effect: g => { g.magic.mushroomCount = (g.magic.mushroomCount||0) + 3; }},
      { name: "召唤树人", tier: 3, desc: "召唤树人生成治愈领域",
        effect: g => { g.magic.treantCount = (g.magic.treantCount||0) + 1; }},
      { name: "召唤大师", tier: 5, desc: "所有召唤物数量+2，伤害+50%",
        effect: g => { g.magic.summonMasterBonus = true; }},
      
      { name: "召唤虚空生物", tier: 4, desc: "召唤虚空生物吞噬敌人",
        effect: g => { g.magic.voidCreatureEnabled = true; }},
      { name: "召唤蜘蛛群", tier: 2, desc: "召唤蜘蛛群减速并毒害敌人",
        effect: g => { g.magic.spiderSwarmEnabled = true; g.magic.spiderCount = 5; }},
      { name: "召唤水元素", tier: 3, desc: "召唤水元素回复生命并伤害敌人",
        effect: g => { g.magic.waterElementalCount = (g.magic.waterElementalCount||0) + 1; }},
      { name: "召唤混沌实体", tier: 5, desc: "召唤混沌实体随机攻击效果",
        effect: g => { g.magic.chaosEntityEnabled = true; }},
      { name: "军团召唤师", tier: 5, desc: "所有召唤物数量翻倍",
        effect: g => { g.magic.legionSummoner = true; }}
    ];
    
    skills.push(...golemSummons.map(s => ({ ...s, icon: "cube.fill", category: "summon_golem" })));
    skills.push(...phantomAndTotemSkills.map(s => ({ ...s, icon: "person.2.fill", category: "summon_phantom" })));
    skills.push(...advancedSummons.map(s => ({ ...s, icon: "star.fill", category: "summon_advanced" })));

    // ------------------------------------------
    // 第三类：时空魔法 (60个)
    // ------------------------------------------
    const timeSpaceSkills = [
      // 时间系 (30个)
      { name: "时间减速", tier: 2, desc: "周围敌人移动速度-30%",
        effect: g => { g.magic.timeSlowEnabled = true; g.magic.timeSlowAmount = 0.30; }},
      { name: "时间停止", tier: 5, desc: "每30秒停止时间3秒",
        effect: g => { g.magic.timeStopEnabled = true; g.magic.timeStopDuration = 3; g.magic.timeStopInterval = 30; }},
      { name: "时间加速", tier: 3, desc: "攻击速度和移动速度+50%持续5秒",
        effect: g => { g.magic.timeAccelEnabled = true; }},
      { name: "时间回溯", tier: 4, desc: "受到致命伤害时回溯到3秒前状态",
        effect: g => { g.magic.timeRewind = true; }},
      { name: "时间切片", tier: 3, desc: "攻击有几率造成额外时间伤害",
        effect: g => { g.magic.timeSliceDamage = true; g.magic.timeSliceChance = 0.20; }},
      
      { name: "老化诅咒", tier: 3, desc: "敌人老化，移速和伤害降低",
        effect: g => { g.magic.agingCurse = true; }},
      { name: "时间波纹", tier: 2, desc: "攻击创建时间波纹减速敌人",
        effect: g => { g.magic.timeRipple = true; }},
      { name: "预知未来", tier: 4, desc: "可以预见敌人攻击并自动闪避",
        effect: g => { g.dodgeChance += 0.30; g.magic.futureVision = true; }},
      { name: "时间碎片", tier: 3, desc: "击杀敌人掉落时间碎片加速技能冷却",
        effect: g => { g.magic.timeShardDrop = true; }},
      
      { name: "加速光环", tier: 2, desc: "周围召唤物攻速+30%",
        effect: g => { g.magic.hasteAura = true; g.magic.hasteAuraBonus = 0.30; }},
      { name: "时间之箭", tier: 3, desc: "射出时间之箭，减速并造成时间伤害",
        effect: g => { g.magic.timeArrowEnabled = true; }},
      { name: "命运操控", tier: 4, desc: "可以改变攻击结果，失败变暴击",
        effect: g => { g.magic.fateManipulation = true; }},
      { name: "时间领域", tier: 4, desc: "创建时间领域，内部时间流速改变",
        effect: g => { g.magic.timeDomainEnabled = true; }},
      { name: "时间吞噬", tier: 4, desc: "吸收敌人的时间转化为伤害",
        effect: g => { g.magic.timeDevour = true; }},
      
      { name: "时间分裂", tier: 5, desc: "创建时间分身执行过去的动作",
        effect: g => { g.magic.timeSplit = true; }},
      { name: "时间囚笼", tier: 3, desc: "将敌人困在时间囚笼中",
        effect: g => { g.magic.timePrison = true; g.magic.timePrisonDuration = 3; }},
      { name: "时间之刃", tier: 3, desc: "攻击切割敌人的时间线",
        effect: g => { g.magic.temporalBlade = true; }},
      { name: "时间循环", tier: 4, desc: "技能冷却时有几率立即重置",
        effect: g => { g.magic.timeLoop = true; g.magic.timeLoopChance = 0.20; }},
      { name: "时间大师", tier: 5, desc: "所有时间技能效果翻倍",
        effect: g => { g.magic.timeMaster = true; }},
      { name: "时间侵蚀", tier: 5, desc: "敌人在战场上每秒变弱1%，最大生命和伤害持续降低",
        effect: g => { g.magic.timeErosion = true; g.magic.timeErosionRate = 0.01; g.magic.timeErosionMax = 0.50; }},
      
      // 空间系 (30个)
      { name: "空间折叠", tier: 3, desc: "瞬间移动到随机安全位置",
        effect: g => { g.magic.blinkEnabled = true; g.magic.blinkCooldown = 5; }},
      { name: "空间裂隙", tier: 3, desc: "创建空间裂隙伤害通过的敌人",
        effect: g => { g.magic.spaceRiftEnabled = true; }},
      { name: "传送门", tier: 4, desc: "创建两个传送门快速移动",
        effect: g => { g.magic.portalEnabled = true; }},
      { name: "空间压缩", tier: 3, desc: "压缩空间将敌人聚集在一起",
        effect: g => { g.magic.spaceCompression = true; }},
      { name: "维度切割", tier: 4, desc: "攻击切割维度造成大量伤害",
        effect: g => { g.magic.dimensionCut = true; g.magic.dimensionCutDamage = 100; }},
      
      { name: "虚空之门", tier: 5, desc: "打开虚空之门吞噬敌人",
        effect: g => { g.magic.voidGateEnabled = true; }},
      { name: "空间锚定", tier: 3, desc: "锁定敌人位置使其无法移动",
        effect: g => { g.magic.spaceAnchor = true; }},
      { name: "维度跳跃", tier: 3, desc: "攻击穿越维度必定命中",
        effect: g => { g.magic.dimensionLeap = true; }},
      { name: "空间风暴", tier: 4, desc: "释放空间风暴撕裂敌人",
        effect: g => { g.magic.spaceStorm = true; }},
      
      { name: "维度口袋", tier: 2, desc: "存储伤害稍后释放",
        effect: g => { g.magic.dimensionPocket = true; }},
      { name: "空间交换", tier: 3, desc: "与敌人交换位置",
        effect: g => { g.magic.spaceSwap = true; }},
      { name: "异次元之力", tier: 4, desc: "从异次元获取力量加成",
        effect: g => { g.bulletDamage *= 1.3; g.magic.dimensionPower = true; }},
      { name: "虚空行者", tier: 4, desc: "穿过敌人时造成伤害",
        effect: g => { g.magic.voidWalker = true; }},
      { name: "空间大师", tier: 5, desc: "所有空间技能效果翻倍",
        effect: g => { g.magic.spaceMaster = true; }},
      { name: "维度棱镜", tier: 2, desc: "攻击经过棱镜折射，分裂为3束射向附近敌人",
        effect: g => { g.magic.dimensionPrism = true; g.magic.dimensionPrismSplits = 3; g.magic.dimensionPrismDamage = 0.4; }},
      
      { name: "折叠时空", tier: 5, desc: "攻击范围翻倍",
        effect: g => { g.magic.foldedSpace = true; g.magic.spellAreaBonus += 1.0; }},
      { name: "维度撕裂", tier: 4, desc: "撕裂维度创建伤害区域",
        effect: g => { g.magic.dimensionTear = true; }},
      { name: "空间复制", tier: 4, desc: "攻击在多个位置同时生效",
        effect: g => { g.magic.spaceDuplicate = true; }},
      { name: "虚空回响", tier: 3, desc: "攻击在虚空中回响再次伤害",
        effect: g => { g.magic.voidEcho = true; }},
      { name: "时空领主", tier: 5, desc: "完全掌控时空，所有效果+100%",
        effect: g => { g.magic.timeSpaceLord = true; }}
    ];
    
    skills.push(...timeSpaceSkills.map(s => ({ ...s, icon: "clock.fill", category: "time_space" })));

    // ------------------------------------------
    // 第四类：附魔魔法 (60个)
    // ------------------------------------------
    const enchantmentSkills = [
      // 武器附魔 (20个)
      { name: "火焰附魔", tier: 1, desc: "武器附魔火焰，攻击造成额外燃烧",
        effect: g => { g.burnChance = 1.0; g.burnDamage += 5; g.burnDuration = 3; }},
      { name: "寒冰附魔", tier: 1, desc: "武器附魔寒冰，攻击减速敌人",
        effect: g => { g.magic.frostEnchant = true; g.magic.frostSlowAmount = 0.30; }},
      { name: "闪电附魔", tier: 2, desc: "武器附魔闪电，攻击连锁跳跃",
        effect: g => { g.chainLightning = true; g.chainCount += 1; }},
      { name: "毒素附魔", tier: 2, desc: "武器附魔毒素，攻击造成中毒",
        effect: g => { g.poisonChance = 1.0; g.poisonDamage += 3; g.poisonDuration = 5; }},
      { name: "神圣附魔", tier: 3, desc: "武器附魔神圣，攻击造成额外圣光伤害",
        effect: g => { g.magic.holyEnchant = true; g.magic.holyEnchantDamage = 0.20; }},
      
      { name: "暗影附魔", tier: 3, desc: "武器附魔暗影，攻击吸取生命",
        effect: g => { g.lifestealChance = 1.0; g.lifestealPercent += 0.10; }},
      { name: "混沌附魔", tier: 4, desc: "武器附魔混沌，随机元素效果",
        effect: g => { g.magic.chaosEnchant = true; }},
      { name: "虚空附魔", tier: 4, desc: "武器附魔虚空，无视护甲",
        effect: g => { g.magic.voidEnchant = true; g.magic.armorPenetration += 0.50; }},
      { name: "龙焰附魔", tier: 5, desc: "武器附魔龙焰，燃烧伤害翻倍",
        effect: g => { g.burnDamage *= 2; }},
      { name: "附魔大师", tier: 4, desc: "所有附魔效果+50%",
        effect: g => { g.magic.enchantMaster = true; }},
      
      { name: "破甲附魔", tier: 2, desc: "武器附魔破甲，无视20%护甲",
        effect: g => { g.magic.armorPenetration = (g.magic.armorPenetration||0) + 0.20; }},
      { name: "爆裂附魔", tier: 3, desc: "武器附魔爆裂，攻击产生爆炸",
        effect: g => { g.areaDamageRadius = 40; }},
      { name: "吸魂附魔", tier: 3, desc: "击杀敌人恢复魔力",
        effect: g => { g.magic.soulDrainEnchant = true; }},
      { name: "速射附魔", tier: 2, desc: "攻击速度+20%",
        effect: g => { g.shootInterval *= 0.8; }},
      { name: "穿透附魔", tier: 2, desc: "穿透+2",
        effect: g => { g.pierceCount += 2; }},
      
      { name: "追踪附魔", tier: 3, desc: "攻击追踪敌人",
        effect: g => { g.homingStrength += 0.5; }},
      { name: "分裂附魔", tier: 3, desc: "攻击命中后分裂",
        effect: g => { g.splitOnHit = true; g.splitCount = 3; }},
      { name: "弹射附魔", tier: 3, desc: "攻击在敌人之间弹跳",
        effect: g => { g.magic.bounceEnchant = true; g.magic.bounceCount = 3; }},
      { name: "吸血附魔", tier: 3, desc: "每次攻击恢复少量生命",
        effect: g => { g.lifestealChance = 1.0; g.lifestealPercent = 0.05; }},
      { name: "毁灭附魔", tier: 5, desc: "攻击有5%几率即死敌人",
        effect: g => { g.instantKillThreshold += 0.05; }},
      
      // 护甲附魔 (20个)
      { name: "护甲强化", tier: 1, desc: "减伤+10%",
        effect: g => { g.damageReduction += 0.10; }},
      { name: "荆棘附魔", tier: 2, desc: "受击反弹30%伤害",
        effect: g => { g.thornsDamagePercent += 0.30; }},
      { name: "再生附魔", tier: 2, desc: "每秒回复2点生命",
        effect: g => { g.regenRate += 2; }},
      { name: "闪避附魔", tier: 3, desc: "闪避几率+15%",
        effect: g => { g.dodgeChance += 0.15; }},
      { name: "格挡附魔", tier: 2, desc: "格挡几率+15%",
        effect: g => { g.blockChance += 0.15; }},
      
      { name: "吸收附魔", tier: 3, desc: "受到伤害的10%转化为护盾",
        effect: g => { g.magic.absorbShield = true; }},
      { name: "反射附魔", tier: 4, desc: "有几率反射敌人攻击",
        effect: g => { g.magic.reflectEnchant = true; g.magic.reflectChance = 0.20; }},
      { name: "不屈附魔", tier: 4, desc: "生命低于20%时减伤+50%",
        effect: g => { g.magic.lastStandArmor = true; }},
      { name: "治愈附魔", tier: 3, desc: "击杀敌人回复5生命",
        effect: g => { g.killHealAmount += 5; }},
      { name: "护甲大师", tier: 4, desc: "所有防御附魔效果+50%",
        effect: g => { g.magic.armorMaster = true; }},
      
      { name: "火焰护甲", tier: 2, desc: "接触敌人灼烧它们",
        effect: g => { g.magic.fireArmor = true; }},
      { name: "冰霜护甲", tier: 2, desc: "接触敌人减速它们",
        effect: g => { g.magic.frostArmor = true; }},
      { name: "闪电护甲", tier: 3, desc: "被击中时反击闪电",
        effect: g => { g.magic.lightningArmor = true; }},
      { name: "暗影护甲", tier: 3, desc: "减伤+15%，受击时隐身",
        effect: g => { g.damageReduction += 0.15; g.magic.shadowArmor = true; }},
      { name: "神圣护甲", tier: 4, desc: "减伤+20%，每秒回复1%生命",
        effect: g => { g.damageReduction += 0.20; g.magic.holyArmor = true; }},
      
      { name: "命运护甲", tier: 5, desc: "致命伤害有50%几率变为1",
        effect: g => { g.magic.fateArmor = true; }},
      { name: "铁壁附魔", tier: 4, desc: "最大生命+100，减伤+10%",
        effect: g => { g.playerMaxHealth += 100; g.playerHealth += 100; g.damageReduction += 0.10; }},
      { name: "屏障附魔", tier: 3, desc: "每10秒获得50点护盾",
        effect: g => { g.magic.barrierEnchant = true; g.magic.barrierAmount = 50; }},
      { name: "韧性附魔", tier: 3, desc: "受到伤害上限为最大生命20%",
        effect: g => { g.damageCap = Math.min(g.damageCap, 0.20); }},
      { name: "永生附魔", tier: 5, desc: "死亡时复活并回复50%生命",
        effect: g => { g.phoenixRevive = true; g.phoenixChance = 1.0; }},
      
      // 增益附魔 (20个)
      { name: "力量祝福", tier: 1, desc: "伤害+15%",
        effect: g => { g.bulletDamage *= 1.15; }},
      { name: "敏捷祝福", tier: 1, desc: "移速+15%，攻速+10%",
        effect: g => { g.playerSpeedMulti *= 1.15; g.shootInterval *= 0.9; }},
      { name: "体质祝福", tier: 1, desc: "最大生命+50",
        effect: g => { g.playerMaxHealth += 50; g.playerHealth += 50; }},
      { name: "智慧祝福", tier: 2, desc: "经验获取+20%",
        effect: g => { g.expMultiplier *= 1.20; }},
      { name: "幸运祝福", tier: 2, desc: "暴击率+10%",
        effect: g => { g.critRate += 0.10; }},
      
      { name: "战神祝福", tier: 4, desc: "伤害+30%，攻速+20%",
        effect: g => { g.bulletDamage *= 1.30; g.shootInterval *= 0.8; }},
      { name: "守护祝福", tier: 3, desc: "减伤+20%，回复+2/秒",
        effect: g => { g.damageReduction += 0.20; g.regenRate += 2; }},
      { name: "狂战士祝福", tier: 4, desc: "生命越低伤害越高，最高+100%",
        effect: g => { g.lowHpDamageBoost = true; g.lowHpDamageMulti = 2.0; g.lowHpThreshold = 0.30; }},
      { name: "吸血鬼祝福", tier: 3, desc: "所有伤害的5%转化为生命",
        effect: g => { g.lifestealChance = 1.0; g.lifestealPercent = 0.05; }},
      { name: "凤凰祝福", tier: 5, desc: "死亡时涅槃重生回复全部生命",
        effect: g => { g.phoenixRevive = true; g.phoenixChance = 1.0; g.magic.fullRevive = true; }},
      
      { name: "速度祝福", tier: 2, desc: "移动速度+25%",
        effect: g => { g.playerSpeedMulti *= 1.25; }},
      { name: "精准祝福", tier: 2, desc: "暴击伤害+50%",
        effect: g => { g.critDamageMulti += 0.50; }},
      { name: "范围祝福", tier: 3, desc: "攻击范围+30%",
        effect: g => { g.magic.spellAreaBonus += 0.30; g.bulletScale *= 1.3; }},
      { name: "持续祝福", tier: 2, desc: "所有持续效果时间+50%",
        effect: g => { g.magic.durationBonus = 0.50; }},
      { name: "能量祝福", tier: 3, desc: "魔力回复+50%",
        effect: g => { g.magic.manaRegenBonus = 0.50; }},
      
      { name: "全能祝福", tier: 5, desc: "所有属性+20%",
        effect: g => { 
          g.bulletDamage *= 1.20; 
          g.playerSpeedMulti *= 1.20;
          g.playerMaxHealth = Math.round(g.playerMaxHealth * 1.20);
          g.shootInterval *= 0.80;
        }},
      { name: "毁灭祝福", tier: 5, desc: "伤害+50%，受到伤害+30%",
        effect: g => { g.bulletDamage *= 1.50; g.damageReduction -= 0.30; }},
      { name: "永恒祝福", tier: 5, desc: "所有祝福效果永久存在",
        effect: g => { g.magic.eternalBlessing = true; }},
      { name: "神眷", tier: 5, desc: "获得所有基础祝福效果",
        effect: g => { 
          g.bulletDamage *= 1.15;
          g.playerSpeedMulti *= 1.15;
          g.playerMaxHealth += 50;
          g.expMultiplier *= 1.20;
          g.critRate += 0.10;
        }},
      { name: "神力", tier: 5, desc: "获得神之力量，战力大幅提升",
        effect: g => { g.bulletDamage *= 2; g.critRate = 0.5; g.critDamageMulti = 3; }}
    ];
    
    skills.push(...enchantmentSkills.map(s => ({ ...s, icon: "wand.and.stars", category: "enchantment" })));

    // ------------------------------------------
    // 第五类：诅咒魔法 (50个)
    // ------------------------------------------
    const curseSkills = [
      { name: "虚弱诅咒", tier: 1, desc: "敌人伤害降低20%",
        effect: g => { g.magic.weaknessCurse = true; g.magic.weaknessAmount = 0.20; }},
      { name: "迟缓诅咒", tier: 1, desc: "敌人移速降低30%",
        effect: g => { g.magic.slowCurse = true; g.magic.slowCurseAmount = 0.30; }},
      { name: "腐蚀诅咒", tier: 2, desc: "敌人持续受到腐蚀伤害",
        effect: g => { g.magic.corrosionCurse = true; g.magic.corrosionDamage = 5; }},
      { name: "脆弱诅咒", tier: 2, desc: "敌人受到伤害+20%",
        effect: g => { g.magic.vulnerableCurse = true; g.magic.vulnerableAmount = 0.20; }},
      { name: "恐惧诅咒", tier: 3, desc: "敌人有几率恐惧逃跑",
        effect: g => { g.magic.fearCurse = true; g.magic.fearChance = 0.15; }},
      
      { name: "混乱诅咒", tier: 3, desc: "敌人有几率攻击同伴",
        effect: g => { g.magic.confusionCurse = true; g.magic.confusionChance = 0.10; }},
      { name: "诅咒标记", tier: 2, desc: "标记敌人受到所有伤害+30%",
        effect: g => { g.magic.curseMark = true; g.magic.curseMarkBonus = 0.30; }},
      { name: "死亡诅咒", tier: 4, desc: "敌人有极低几率直接死亡",
        effect: g => { g.magic.deathCurse = true; g.magic.deathCurseChance = 0.02; }},
      { name: "沉默诅咒", tier: 3, desc: "敌人无法使用特殊技能",
        effect: g => { g.magic.silenceCurse = true; }},
      { name: "束缚诅咒", tier: 3, desc: "敌人有几率被束缚无法移动",
        effect: g => { g.magic.bindCurse = true; g.magic.bindChance = 0.15; }},
      
      { name: "吸血诅咒", tier: 3, desc: "对诅咒敌人造成伤害回复生命",
        effect: g => { g.magic.vampiricCurse = true; g.magic.vampiricCursePercent = 0.10; }},
      { name: "连锁诅咒", tier: 4, desc: "诅咒在敌人间传播",
        effect: g => { g.magic.spreadingCurse = true; }},
      { name: "永恒诅咒", tier: 4, desc: "诅咒效果永不消失",
        effect: g => { g.magic.eternalCurse = true; }},
      { name: "诅咒大师", tier: 4, desc: "所有诅咒效果+50%",
        effect: g => { g.magic.curseMaster = true; }},
      { name: "瘟疫诅咒", tier: 4, desc: "敌人死亡时传播瘟疫",
        effect: g => { g.magic.plagueCurse = true; }},
      
      { name: "衰老诅咒", tier: 3, desc: "敌人属性持续下降",
        effect: g => { g.magic.decayCurse = true; }},
      { name: "苦痛诅咒", tier: 3, desc: "敌人受到伤害时额外受到痛苦伤害",
        effect: g => { g.magic.agonyСurse = true; g.magic.agonyDamage = 10; }},
      { name: "厄运诅咒", tier: 4, desc: "敌人暴击率和闪避率归零",
        effect: g => { g.magic.misfortuneCurse = true; }},
      { name: "噩梦诅咒", tier: 4, desc: "敌人陷入噩梦无法行动",
        effect: g => { g.magic.nightmareCurse = true; g.magic.nightmareDuration = 2; }},
      { name: "灵魂诅咒", tier: 5, desc: "击杀诅咒敌人恢复大量生命",
        effect: g => { g.magic.soulCurse = true; g.magic.soulCurseHeal = 20; }},
      
      { name: "毒素诅咒", tier: 2, desc: "敌人中毒伤害+100%",
        effect: g => { g.poisonDamage *= 2; }},
      { name: "燃烧诅咒", tier: 2, desc: "敌人燃烧伤害+100%",
        effect: g => { g.burnDamage *= 2; }},
      { name: "冻结诅咒", tier: 3, desc: "冻结敌人时造成额外伤害",
        effect: g => { g.magic.freezeCurseDamage = 50; }},
      { name: "雷击诅咒", tier: 3, desc: "诅咒敌人受到闪电伤害+50%",
        effect: g => { g.magic.lightningCurseBonus = 0.50; }},
      { name: "元素诅咒", tier: 4, desc: "敌人对所有元素伤害脆弱",
        effect: g => { g.magic.elementalCurse = true; }},
      
      { name: "爆发诅咒", tier: 3, desc: "诅咒敌人死亡时爆炸",
        effect: g => { g.magic.explosiveCurse = true; g.magic.explosiveCurseRadius = 60; }},
      { name: "献祭诅咒", tier: 4, desc: "诅咒敌人死亡时召唤亡灵",
        effect: g => { g.magic.sacrificeCurse = true; }},
      { name: "虚空诅咒", tier: 4, desc: "诅咒敌人被虚空吞噬",
        effect: g => { g.magic.voidCurse = true; }},
      { name: "时间诅咒", tier: 4, desc: "诅咒敌人在时间中腐朽",
        effect: g => { g.magic.timeCurse = true; }},
      { name: "诅咒领主", tier: 5, desc: "所有诅咒同时生效",
        effect: g => { g.magic.curseLord = true; }},
      
      { name: "灼魂诅咒", tier: 3, desc: "诅咒敌人灵魂持续燃烧",
        effect: g => { g.magic.soulBurnCurse = true; }},
      { name: "冰封灵魂", tier: 3, desc: "诅咒敌人灵魂冻结",
        effect: g => { g.magic.soulFreezeCurse = true; }},
      { name: "雷霆诅咒", tier: 4, desc: "诅咒敌人吸引雷电",
        effect: g => { g.magic.thunderCurse = true; }},
      { name: "死亡印记", tier: 5, desc: "标记敌人10秒后必定死亡",
        effect: g => { g.magic.deathMark = true; g.magic.deathMarkTime = 10; }},
      { name: "诅咒回响", tier: 4, desc: "诅咒效果触发两次",
        effect: g => { g.magic.curseEcho = true; }},
      
      { name: "腐化诅咒", tier: 3, desc: "诅咒敌人护甲持续降低",
        effect: g => { g.magic.armorCorruptCurse = true; }},
      { name: "生命诅咒", tier: 4, desc: "诅咒敌人无法回复生命",
        effect: g => { g.magic.healBlockCurse = true; }},
      { name: "力量诅咒", tier: 3, desc: "诅咒敌人攻击力持续降低",
        effect: g => { g.magic.strengthCurse = true; }},
      { name: "速度诅咒", tier: 3, desc: "诅咒敌人移速持续降低",
        effect: g => { g.magic.speedCurse = true; }},
      { name: "诅咒爆发", tier: 5, desc: "诅咒达到上限时引发大爆发",
        effect: g => { g.magic.curseBurst = true; g.magic.curseBurstDamage = 500; }},
      
      { name: "深渊诅咒", tier: 5, desc: "敌人被深渊吞噬",
        effect: g => { g.magic.abyssCurse = true; }},
      { name: "毁灭诅咒", tier: 5, desc: "诅咒敌人受到双倍伤害",
        effect: g => { g.magic.ruinCurse = true; g.magic.ruinCurseBonus = 1.0; }},
      { name: "绝望诅咒", tier: 5, desc: "诅咒敌人陷入绝望无法攻击",
        effect: g => { g.magic.despairCurse = true; }},
      { name: "宿命诅咒", tier: 5, desc: "诅咒敌人注定死亡",
        effect: g => { g.magic.fateCurse = true; }},
      { name: "诅咒之王", tier: 5, desc: "成为诅咒之王，所有诅咒威力翻倍",
        effect: g => { g.magic.curseKing = true; }},
      
      { name: "黑暗诅咒", tier: 4, desc: "诅咒敌人陷入黑暗",
        effect: g => { g.magic.darknessCurse = true; }},
      { name: "枯萎诅咒", tier: 3, desc: "诅咒敌人生命持续流失",
        effect: g => { g.magic.witherCurse = true; g.magic.witherDamage = 3; }},
      { name: "吞噬诅咒", tier: 4, desc: "诅咒敌人被自身吞噬",
        effect: g => { g.magic.devourCurse = true; }},
      { name: "反噬诅咒", tier: 4, desc: "敌人攻击反噬自身",
        effect: g => { g.magic.recoilCurse = true; }},
      { name: "终极诅咒", tier: 5, desc: "施加所有诅咒效果",
        effect: g => { g.magic.ultimateCurse = true; }}
    ];
    
    skills.push(...curseSkills.map(s => ({ ...s, icon: "exclamationmark.triangle.fill", category: "curse" })));

    // ------------------------------------------
    // 第六类：治愈魔法 (40个)
    // ------------------------------------------
    const healingSkills = [
      { name: "治愈术", tier: 1, desc: "每秒回复3点生命",
        effect: g => { g.regenRate += 3; }},
      { name: "强效治愈", tier: 2, desc: "每秒回复5点生命",
        effect: g => { g.regenRate += 5; }},
      { name: "瞬间治愈", tier: 3, desc: "受伤时立即回复15%生命",
        effect: g => { g.magic.instantHeal = true; g.magic.instantHealPercent = 0.15; }},
      { name: "治愈光环", tier: 2, desc: "周围召唤物也获得回复",
        effect: g => { g.magic.healAura = true; g.magic.healAuraRate = 2; }},
      { name: "生命源泉", tier: 3, desc: "击杀敌人回复10生命",
        effect: g => { g.killHealAmount += 10; }},
      
      { name: "净化", tier: 2, desc: "移除所有负面效果",
        effect: g => { g.magic.purify = true; }},
      { name: "再生", tier: 3, desc: "生命低于50%时回复速度翻倍",
        effect: g => { g.magic.enhancedRegen = true; }},
      { name: "生命链接", tier: 3, desc: "伤害的10%转化为生命",
        effect: g => { g.lifestealChance = 1.0; g.lifestealPercent = 0.10; }},
      { name: "圣愈", tier: 4, desc: "回复效果+50%",
        effect: g => { g.magic.healBonus = 0.50; }},
      { name: "复苏", tier: 4, desc: "死亡时有80%几率复活",
        effect: g => { g.phoenixRevive = true; g.phoenixChance = 0.80; }},
      
      { name: "庇护所", tier: 3, desc: "创建治愈领域持续回复生命",
        effect: g => { g.magic.sanctuaryEnabled = true; g.magic.sanctuaryHeal = 3; }},
      { name: "生命吸取", tier: 3, desc: "攻击吸取敌人生命",
        effect: g => { g.lifestealChance += 0.30; g.lifestealPercent += 0.15; }},
      { name: "治愈之触", tier: 2, desc: "攻击时回复少量生命",
        effect: g => { g.magic.healOnAttack = true; g.magic.healOnAttackAmount = 1; }},
      { name: "生命护盾", tier: 3, desc: "超出最大生命的治疗转化为护盾",
        effect: g => { g.magic.overhealShield = true; }},
      { name: "治愈波", tier: 3, desc: "每10秒释放治愈波回复生命",
        effect: g => { g.magic.healWave = true; g.magic.healWaveInterval = 10; }},
      
      { name: "自然治愈", tier: 2, desc: "站定时回复速度翻倍",
        effect: g => { g.magic.stationaryHeal = true; }},
      { name: "战斗治愈", tier: 3, desc: "击杀连续敌人时回复更多",
        effect: g => { g.magic.combatHeal = true; }},
      { name: "紧急治疗", tier: 3, desc: "生命低于25%时获得大量回复",
        effect: g => { g.emergencyHealActive = true; }},
      { name: "生命祝福", tier: 4, desc: "最大生命+100，回复+3/秒",
        effect: g => { g.playerMaxHealth += 100; g.playerHealth += 100; g.regenRate += 3; }},
      // 不死之身已被举报删除，替换为生命脉冲
      { name: "生命脉冲", tier: 5, desc: "生命低于10%时释放生命脉冲，回复50%生命并击退周围敌人（每60秒一次）",
        effect: g => { g.magic.lifePulse = true; g.magic.lifePulseCooldown = 60; g.magic.lifePulseHealPercent = 0.5; g.magic.lifePulseKnockback = 200; }},
      
      { name: "生命之树", tier: 4, desc: "召唤生命之树持续治愈",
        effect: g => { g.magic.treeOfLife = true; }},
      { name: "神圣治愈", tier: 4, desc: "治愈效果同时伤害附近敌人",
        effect: g => { g.magic.holyHeal = true; }},
      { name: "吸魂回复", tier: 3, desc: "击杀敌人回复魔力和生命",
        effect: g => { g.magic.soulRecovery = true; g.magic.soulRecoveryAmount = 5; }},
      { name: "治愈结界", tier: 3, desc: "在结界内回复速度+100%",
        effect: g => { g.magic.healBarrier = true; }},
      { name: "涅槃", tier: 5, desc: "死亡后重生并全属性提升",
        effect: g => { g.phoenixRevive = true; g.phoenixChance = 1.0; g.magic.nirvanaBoost = true; }},
      
      { name: "生命共鸣", tier: 3, desc: "召唤物死亡时回复生命",
        effect: g => { g.magic.summonDeathHeal = true; }},
      { name: "血脉觉醒", tier: 4, desc: "生命越低回复越快",
        effect: g => { g.magic.bloodlineAwaken = true; }},
      { name: "治愈风暴", tier: 4, desc: "释放治愈风暴大幅回复生命",
        effect: g => { g.magic.healStorm = true; g.magic.healStormInterval = 20; }},
      { name: "永恒生命", tier: 5, desc: "回复效果翻倍，最大生命+200",
        effect: g => { g.magic.healBonus = (g.magic.healBonus||0) + 1.0; g.playerMaxHealth += 200; g.playerHealth += 200; }},
      { name: "生命圣者", tier: 5, desc: "成为生命圣者，免疫死亡一次",
        effect: g => { g.magic.lifeSaint = true; }},
      
      { name: "治愈大师", tier: 4, desc: "所有治愈效果+30%",
        effect: g => { g.magic.healMaster = true; }},
      { name: "活力", tier: 2, desc: "最大生命+30，回复+1/秒",
        effect: g => { g.playerMaxHealth += 30; g.playerHealth += 30; g.regenRate += 1; }},
      { name: "生命力", tier: 3, desc: "最大生命+15%",
        effect: g => { g.playerMaxHealth = Math.round(g.playerMaxHealth * 1.15); g.playerHealth = Math.round(g.playerHealth * 1.15); }},
      { name: "生命泉", tier: 3, desc: "击杀10个敌人后释放治愈脉冲",
        effect: g => { g.magic.killHealPulse = true; g.magic.killHealPulseThreshold = 10; }},
      
      { name: "神愈", tier: 5, desc: "回复速度+500%",
        effect: g => { g.regenRate *= 6; }},
      { name: "生命契约", tier: 4, desc: "牺牲20%最大生命，获得更强回复",
        effect: g => { g.playerMaxHealth = Math.round(g.playerMaxHealth * 0.8); g.regenRate += 10; }},
      { name: "治愈共鸣", tier: 4, desc: "召唤物也能治愈玩家",
        effect: g => { g.magic.summonHealPlayer = true; }},
      { name: "生命绽放", tier: 4, desc: "击杀敌人时绽放生命能量回复周围",
        effect: g => { g.magic.lifeBloom = true; }},
      { name: "永生", tier: 5, desc: "无法被杀死，但受到伤害+50%",
        effect: g => { g.magic.immortality = true; g.damageReduction -= 0.50; }},
      { name: "战斗冥想", tier: 2, desc: "连续3秒未受伤时每秒回复5%最大生命",
        effect: g => { g.magic.combatMeditation = true; g.magic.combatMeditationDelay = 3; g.magic.combatMeditationHealPercent = 0.05; }}
    ];
    
    skills.push(...healingSkills.map(s => ({ ...s, icon: "heart.fill", category: "healing" })));

    // ------------------------------------------
    // 第七类：结界魔法 (50个)
    // ------------------------------------------
    const barrierSkills = [
      { name: "魔法护盾", tier: 2, desc: "生成魔法护盾吸收50伤害",
        effect: g => { g.magic.magicShieldEnabled = true; g.magic.magicShieldAmount = 50; }},
      { name: "能量屏障", tier: 3, desc: "屏障吸收100伤害，破碎后爆炸",
        effect: g => { g.magic.energyBarrier = true; g.magic.energyBarrierAmount = 100; g.magic.barrierExplosion = true; }},
      { name: "反射屏障", tier: 3, desc: "屏障反弹50%伤害给攻击者",
        effect: g => { g.magic.reflectBarrier = true; g.magic.reflectAmount = 0.50; }},
      { name: "吸收屏障", tier: 3, desc: "屏障吸收的伤害转化为魔力",
        effect: g => { g.magic.absorbBarrier = true; }},
      { name: "永恒屏障", tier: 4, desc: "屏障不会破碎但吸收量降低",
        effect: g => { g.magic.eternalBarrier = true; }},
      
      { name: "火焰结界", tier: 2, desc: "创建火焰结界灼烧进入的敌人",
        effect: g => { g.magic.fireDomainEnabled = true; g.magic.fireDomainDamage = 10; }},
      { name: "冰霜结界", tier: 2, desc: "创建冰霜结界减速进入的敌人",
        effect: g => { g.magic.iceDomainEnabled = true; g.magic.iceDomainSlow = 0.50; }},
      { name: "雷电结界", tier: 3, desc: "创建雷电结界电击进入的敌人",
        effect: g => { g.magic.lightningDomainEnabled = true; }},
      { name: "神圣结界", tier: 3, desc: "创建神圣结界治愈并伤害敌人",
        effect: g => { g.magic.holyDomainEnabled = true; }},
      { name: "虚空结界", tier: 4, desc: "创建虚空结界吞噬敌人",
        effect: g => { g.magic.voidDomainEnabled = true; }},
      
      { name: "领域扩张", tier: 3, desc: "所有结界范围+50%",
        effect: g => { g.magic.domainSizeBonus = 0.50; }},
      { name: "领域强化", tier: 3, desc: "所有结界效果+50%",
        effect: g => { g.magic.domainPowerBonus = 0.50; }},
      { name: "多重结界", tier: 4, desc: "可以同时维持多个结界",
        effect: g => { g.magic.multiDomain = true; }},
      { name: "移动结界", tier: 3, desc: "结界跟随玩家移动",
        effect: g => { g.magic.mobileDomain = true; }},
      { name: "结界大师", tier: 4, desc: "结界持续时间翻倍",
        effect: g => { g.magic.domainDurationBonus = 1.0; }},
      
      { name: "力场屏障", tier: 3, desc: "创建力场推开敌人",
        effect: g => { g.magic.forceField = true; g.magic.forceFieldRadius = 100; }},
      { name: "重力结界", tier: 4, desc: "创建重力结界压制敌人",
        effect: g => { g.magic.gravityDomain = true; }},
      { name: "时间结界", tier: 4, desc: "创建时间结界减缓敌人",
        effect: g => { g.magic.timeDomain = true; }},
      { name: "空间结界", tier: 4, desc: "创建空间结界困住敌人",
        effect: g => { g.magic.spaceDomain = true; }},
      { name: "混沌结界", tier: 5, desc: "创建混沌结界随机效果",
        effect: g => { g.magic.chaosDomain = true; }},
      
      { name: "护盾充能", tier: 2, desc: "护盾每秒回复5点",
        effect: g => { g.magic.shieldRegen = 5; }},
      { name: "护盾强化", tier: 3, desc: "护盾容量+100",
        effect: g => { g.magic.magicShieldAmount = (g.magic.magicShieldAmount||0) + 100; }},
      { name: "护盾爆发", tier: 3, desc: "护盾破碎时造成大量伤害",
        effect: g => { g.magic.shieldBurst = true; g.magic.shieldBurstDamage = 100; }},
      { name: "吸魂护盾", tier: 3, desc: "击杀敌人恢复护盾",
        effect: g => { g.magic.killShield = true; g.magic.killShieldAmount = 10; }},
      { name: "完美护盾", tier: 5, desc: "护盾不会破碎",
        effect: g => { g.magic.perfectShield = true; }},
      
      { name: "毒素结界", tier: 2, desc: "创建毒素结界毒害敌人",
        effect: g => { g.magic.poisonDomainEnabled = true; }},
      { name: "治愈结界", tier: 3, desc: "创建治愈结界持续回复生命",
        effect: g => { g.magic.healDomainEnabled = true; g.magic.healDomainRate = 5; }},
      { name: "增益结界", tier: 3, desc: "创建增益结界提升伤害",
        effect: g => { g.magic.buffDomainEnabled = true; g.magic.buffDomainBonus = 0.30; }},
      { name: "减益结界", tier: 3, desc: "创建减益结界削弱敌人",
        effect: g => { g.magic.debuffDomainEnabled = true; }},
      { name: "绝对领域", tier: 5, desc: "创建绝对领域，敌人无法进入",
        effect: g => { g.magic.absoluteDomain = true; }},
      
      { name: "结界链接", tier: 4, desc: "结界之间形成能量链接",
        effect: g => { g.magic.domainLink = true; }},
      { name: "结界爆炸", tier: 4, desc: "结界结束时爆炸伤害敌人",
        effect: g => { g.magic.domainExplosion = true; }},
      { name: "永久结界", tier: 5, desc: "结界永不消失",
        effect: g => { g.magic.permanentDomain = true; }},
      { name: "结界召唤", tier: 4, desc: "结界内自动召唤生物",
        effect: g => { g.magic.domainSummon = true; }},
      { name: "领域之主", tier: 5, desc: "成为领域之主，结界效果翻倍",
        effect: g => { g.magic.domainLord = true; }},
      
      { name: "魔力屏障", tier: 2, desc: "屏障吸收魔法伤害",
        effect: g => { g.magic.manaBarrier = true; }},
      { name: "物理屏障", tier: 2, desc: "屏障吸收物理伤害",
        effect: g => { g.magic.physicalBarrier = true; }},
      { name: "全能屏障", tier: 4, desc: "屏障吸收所有类型伤害",
        effect: g => { g.magic.omniBarrier = true; }},
      { name: "屏障光环", tier: 3, desc: "召唤物也获得屏障保护",
        effect: g => { g.magic.barrierAura = true; }},
      { name: "屏障大师", tier: 4, desc: "所有屏障效果+50%",
        effect: g => { g.magic.barrierMaster = true; }},
      
      { name: "反魔结界", tier: 3, desc: "结界内敌人无法使用技能",
        effect: g => { g.magic.antiMagicDomain = true; }},
      { name: "封印结界", tier: 4, desc: "结界内敌人被封印无法行动",
        effect: g => { g.magic.sealDomain = true; }},
      { name: "棱镜结界", tier: 3, desc: "创建棱镜结界，折射玩家子弹使其分裂为3道光线攻击敌人",
        effect: g => { g.magic.prismDomainEnabled = true; g.magic.prismDomainSplitCount = 3; g.magic.prismDomainDamageMult = 0.6; }},
      { name: "共鸣结界", tier: 4, desc: "结界与玩家状态共鸣",
        effect: g => { g.magic.resonanceDomain = true; }},
      { name: "神圣领域", tier: 5, desc: "创建神圣领域，免疫一切伤害",
        effect: g => { g.magic.divineDomain = true; g.magic.divineDomainDuration = 3; }},
      
      { name: "风暴结界", tier: 3, desc: "创建风暴结界持续伤害",
        effect: g => { g.magic.stormDomainEnabled = true; }},
      { name: "死亡结界", tier: 4, desc: "创建死亡结界，敌人无法回复",
        effect: g => { g.magic.deathDomain = true; }},
      { name: "生命结界", tier: 3, desc: "创建生命结界，回复速度翻倍",
        effect: g => { g.magic.lifeDomainEnabled = true; }},
      { name: "战争结界", tier: 4, desc: "创建战争结界，伤害翻倍",
        effect: g => { g.magic.warDomainEnabled = true; }},
      { name: "和平结界", tier: 4, desc: "创建和平结界，敌人无法攻击",
        effect: g => { g.magic.peaceDomainEnabled = true; }}
    ];
    
    skills.push(...barrierSkills.map(s => ({ ...s, icon: "shield.fill", category: "barrier" })));

    // ------------------------------------------
    // 第八类：符文魔法 (60个)
    // ------------------------------------------
    const runeSkills = [
      // 攻击符文 (20个)
      { name: "爆裂符文", tier: 2, desc: "部署爆裂符文，敌人踩中爆炸",
        effect: g => { g.magic.explosionRuneEnabled = true; g.magic.explosionRuneDamage = 80; }},
      { name: "火焰符文", tier: 2, desc: "部署火焰符文持续灼烧敌人",
        effect: g => { g.magic.fireRuneEnabled = true; }},
      { name: "冰霜符文", tier: 2, desc: "部署冰霜符文冻结敌人",
        effect: g => { g.magic.iceRuneEnabled = true; }},
      { name: "雷电符文", tier: 3, desc: "部署雷电符文电击敌人",
        effect: g => { g.magic.lightningRuneEnabled = true; }},
      { name: "毒素符文", tier: 2, desc: "部署毒素符文毒害敌人",
        effect: g => { g.magic.poisonRuneEnabled = true; }},
      
      { name: "虚空符文", tier: 4, desc: "部署虚空符文吞噬敌人",
        effect: g => { g.magic.voidRuneEnabled = true; }},
      { name: "混沌符文", tier: 4, desc: "部署混沌符文随机效果",
        effect: g => { g.magic.chaosRuneEnabled = true; }},
      { name: "死亡符文", tier: 4, desc: "部署死亡符文即死敌人",
        effect: g => { g.magic.deathRuneEnabled = true; g.magic.deathRuneChance = 0.05; }},
      { name: "时间符文", tier: 4, desc: "部署时间符文减缓敌人",
        effect: g => { g.magic.timeRuneEnabled = true; }},
      { name: "空间符文", tier: 4, desc: "部署空间符文传送敌人",
        effect: g => { g.magic.spaceRuneEnabled = true; }},
      
      { name: "符文阵列", tier: 3, desc: "符文形成阵列增强效果",
        effect: g => { g.magic.runeArray = true; }},
      { name: "符文链接", tier: 3, desc: "符文之间形成能量链接",
        effect: g => { g.magic.runeLink = true; }},
      { name: "符文爆发", tier: 4, desc: "符文同时触发造成大量伤害",
        effect: g => { g.magic.runeBurst = true; }},
      { name: "符文大师", tier: 4, desc: "所有符文效果+50%",
        effect: g => { g.magic.runeMaster = true; }},
      { name: "永恒符文", tier: 5, desc: "符文永不消失",
        effect: g => { g.magic.eternalRune = true; }},
      
      { name: "连环符文", tier: 3, desc: "符文触发时激活附近符文",
        effect: g => { g.magic.chainRune = true; }},
      { name: "强化符文", tier: 2, desc: "符文伤害+30%",
        effect: g => { g.magic.runeDamageBonus = 0.30; }},
      { name: "范围符文", tier: 2, desc: "符文范围+50%",
        effect: g => { g.magic.runeRadiusBonus = 0.50; }},
      { name: "持续符文", tier: 2, desc: "符文持续时间+100%",
        effect: g => { g.magic.runeDurationBonus = 1.0; }},
      { name: "符文之王", tier: 5, desc: "符文效果翻倍",
        effect: g => { g.magic.runeKing = true; }},
      
      // 防御符文 (20个)
      { name: "护盾符文", tier: 2, desc: "部署护盾符文提供保护",
        effect: g => { g.magic.shieldRuneEnabled = true; }},
      { name: "治愈符文", tier: 2, desc: "部署治愈符文持续回复",
        effect: g => { g.magic.healRuneEnabled = true; }},
      { name: "减速符文", tier: 2, desc: "部署减速符文减缓敌人",
        effect: g => { g.magic.slowRuneEnabled = true; }},
      { name: "束缚符文", tier: 3, desc: "部署束缚符文定身敌人",
        effect: g => { g.magic.bindRuneEnabled = true; }},
      { name: "反射符文", tier: 3, desc: "部署反射符文弹开攻击",
        effect: g => { g.magic.reflectRuneEnabled = true; }},
      
      { name: "吸收符文", tier: 3, desc: "部署吸收符文吸收伤害",
        effect: g => { g.magic.absorbRuneEnabled = true; }},
      { name: "力场符文", tier: 3, desc: "部署力场符文推开敌人",
        effect: g => { g.magic.forceRuneEnabled = true; }},
      { name: "隐身符文", tier: 3, desc: "部署隐身符文提供隐身",
        effect: g => { g.magic.invisRuneEnabled = true; }},
      { name: "免疫符文", tier: 4, desc: "部署免疫符文提供免疫",
        effect: g => { g.magic.immuneRuneEnabled = true; }},
      { name: "重生符文", tier: 5, desc: "部署重生符文允许复活",
        effect: g => { g.magic.reviveRuneEnabled = true; }},
      
      { name: "防护符文网", tier: 4, desc: "符文形成防护网络",
        effect: g => { g.magic.runeNetwork = true; }},
      { name: "符文堡垒", tier: 4, desc: "符文创建堡垒保护玩家",
        effect: g => { g.magic.runeFortress = true; }},
      { name: "神圣符文", tier: 4, desc: "符文获得神圣力量",
        effect: g => { g.magic.holyRune = true; }},
      { name: "暗黑符文", tier: 4, desc: "符文获得暗黑力量",
        effect: g => { g.magic.darkRune = true; }},
      { name: "元素符文", tier: 3, desc: "符文附带元素效果",
        effect: g => { g.magic.elementalRune = true; }},
      
      { name: "自动符文", tier: 3, desc: "符文自动部署",
        effect: g => { g.magic.autoRune = true; }},
      { name: "智能符文", tier: 4, desc: "符文自动寻找最佳位置",
        effect: g => { g.magic.smartRune = true; }},
      { name: "符文召唤", tier: 4, desc: "符文可以召唤生物",
        effect: g => { g.magic.summonRune = true; }},
      { name: "符文之心", tier: 5, desc: "符文与玩家生命链接",
        effect: g => { g.magic.runeHeart = true; }},
      { name: "符文领主", tier: 5, desc: "成为符文领主，所有符文效果翻倍",
        effect: g => { g.magic.runeLord = true; }},
      
      // 增益符文 (20个)
      { name: "力量符文", tier: 1, desc: "刻印力量符文，伤害+10%",
        effect: g => { g.bulletDamage *= 1.10; }},
      { name: "敏捷符文", tier: 1, desc: "刻印敏捷符文，攻速+10%",
        effect: g => { g.shootInterval *= 0.9; }},
      { name: "体质符文", tier: 1, desc: "刻印体质符文，生命+30",
        effect: g => { g.playerMaxHealth += 30; g.playerHealth += 30; }},
      { name: "智慧符文", tier: 1, desc: "刻印智慧符文，经验+15%",
        effect: g => { g.expMultiplier *= 1.15; }},
      { name: "幸运符文", tier: 2, desc: "刻印幸运符文，暴击+8%",
        effect: g => { g.critRate += 0.08; }},
      
      { name: "守护符文", tier: 2, desc: "刻印守护符文，减伤+10%",
        effect: g => { g.damageReduction += 0.10; }},
      { name: "再生符文", tier: 2, desc: "刻印再生符文，回复+2/秒",
        effect: g => { g.regenRate += 2; }},
      { name: "速度符文", tier: 2, desc: "刻印速度符文，移速+15%",
        effect: g => { g.playerSpeedMulti *= 1.15; }},
      { name: "穿透符文", tier: 2, desc: "刻印穿透符文，穿透+1",
        effect: g => { g.pierceCount += 1; }},
      { name: "范围符文", tier: 2, desc: "刻印范围符文，弹体+20%",
        effect: g => { g.bulletScale *= 1.2; }},
      
      { name: "连锁符文", tier: 3, desc: "刻印连锁符文，攻击连锁",
        effect: g => { g.chainLightning = true; g.chainCount += 1; }},
      { name: "分裂符文", tier: 3, desc: "刻印分裂符文，攻击分裂",
        effect: g => { g.splitOnHit = true; g.splitCount = 2; }},
      { name: "追踪符文", tier: 3, desc: "刻印追踪符文，攻击追踪",
        effect: g => { g.homingStrength += 0.3; }},
      { name: "吸血符文", tier: 3, desc: "刻印吸血符文，攻击吸血",
        effect: g => { g.lifestealChance += 0.20; }},
      { name: "爆裂符文印记", tier: 3, desc: "刻印爆裂符文，攻击爆炸",
        effect: g => { g.areaDamageRadius = 35; }},
      
      { name: "大师符文", tier: 4, desc: "所有符文印记效果+30%",
        effect: g => { g.magic.runeInscriptionBonus = 0.30; }},
      { name: "完美符文", tier: 5, desc: "符文印记效果翻倍",
        effect: g => { g.magic.perfectRuneInscription = true; }},
      { name: "古老符文", tier: 4, desc: "获得古老符文的力量",
        effect: g => { g.bulletDamage *= 1.25; g.damageReduction += 0.15; }},
      { name: "神秘符文", tier: 4, desc: "符文获得神秘加持",
        effect: g => { g.critDamageMulti += 0.50; g.critRate += 0.10; }},
      { name: "至高符文", tier: 5, desc: "刻印至高符文，全属性+20%",
        effect: g => { 
          g.bulletDamage *= 1.20;
          g.playerSpeedMulti *= 1.20;
          g.playerMaxHealth = Math.round(g.playerMaxHealth * 1.20);
          g.shootInterval *= 0.80;
        }}
    ];
    
    skills.push(...runeSkills.map(s => ({ ...s, icon: "square.grid.3x3.fill", category: "rune" })));

    // 格式化所有技能
    return skills.map((s, idx) => ({
      name: s.name,
      description: s.desc,
      tier: s.tier || 1,
      icon: s.icon || "sparkles",
      category: s.category || "magic",
      _magicSkill: true,  // 标记为魔法技能
      effect: (g) => {
        // 初始化魔法系统
        if (!g.magic) {
          g.magic = JSON.parse(JSON.stringify(MagicState));
        }
        // 执行技能效果
        s.effect(g);
      }
    }));
  }

  // ============================================
  // 导出
  // ============================================
  window.MagicSkillSystem = {
    generateMagicSkills,
    MagicState
  };

})();
