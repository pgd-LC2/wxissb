/**
 * 技能配置文件
 * 包含所有技能数据，便于修改和扩展
 */

// 技能等级名称
function tierName(tier) {
  return tier === 2 ? "稀有" : (tier === 3 ? "传说" : "普通");
}

// 技能等级 CSS 类名
function tierClass(tier) {
  return tier === 2 ? "tier2" : (tier === 3 ? "tier3" : "tier1");
}

// 图标映射（SF Symbols -> 表情符号）
function iconFallback(iconStr) {
  const map = {
    "bolt.fill": "⚡",
    "timer": "⏱",
    "hare.fill": "🐇",
    "circle.fill": "●",
    "heart.fill": "❤",
    "arrow.up.right": "↗",
    "scope": "⌖",
    "target": "◎",
    "exclamationmark.triangle.fill": "!",
    "magnet": "🧲",
    "shield.fill": "🛡",
    "book.fill": "📘",
    "star.fill": "★",
    "wind": "〰",
    "cross.fill": "✚",
    "arrow.branch": "⎇",
    "arrow.right.to.line": "⇥",
    "arrow.triangle.branch": "⎇",
    "location.north.fill": "📍",
    "arrow.uturn.right": "↩",
    "snowflake": "❄",
    "flame.fill": "🔥",
    "leaf.fill": "☘",
    "bolt.horizontal.fill": "↯",
    "burst.fill": "💥",
    "sun.max.fill": "☀",
    "tornado": "🌀",
    "shield.lefthalf.filled": "🛡",
    "allergens": "✳",
    "figure.dodge": "🌀",
    "clock.badge.checkmark": "⏱",
    "drop.fill": "🩸",
    "bandage.fill": "🩹",
    "bird.fill": "🕊",
    "hand.raised.fill": "✋",
    "airplane": "✈",
    "fan.fill": "🗡",
    "moon.fill": "☾",
    "flame": "🔥",
    "globe.americas.fill": "☄",
    "sparkles": "✨",
    "person.2.fill": "👥",
    "gearshape.fill": "⚙",
    "figure.run": "🏃",
    "repeat.circle.fill": "⟲",
    "waveform": "〰",
    "circle.and.line.horizontal.fill": "⦿",
    "dice.fill": "🎲",
    "crown.fill": "👑",
  };
  return map[iconStr] || "✦";
}

// 生成所有技能
function generateAllSkills(baseBladeSkills = []) {
  const skills = [];

  // ------------------------------
  // 基础属性类 (1-15)
  // ------------------------------
  skills.push({ name:"强力子弹", description:"伤害 +15%", tier:1, icon:"bolt.fill", effect:(s)=>{ s.bulletDamage *= 1.15; }});
  skills.push({ name:"极速射击", description:"射速 +12%", tier:1, icon:"timer", effect:(s)=>{ s.shootInterval *= 0.88; }});
  skills.push({ name:"疾风步", description:"移动速度 +15%", tier:1, icon:"hare.fill", effect:(s)=>{ s.playerSpeedMulti *= 1.15; }});
  skills.push({ name:"大弹仓", description:"子弹体积 +25%", tier:1, icon:"circle.fill", effect:(s)=>{ s.bulletScale *= 1.25; }});
  skills.push({ name:"生命强化", description:"最大生命 +30", tier:1, icon:"heart.fill", effect:(s)=>{ s.playerMaxHealth += 30; s.playerHealth += 30; s.updateHealthUI(); }});
  skills.push({ name:"弹道加速", description:"子弹飞行速度 +20%", tier:1, icon:"arrow.up.right", effect:(s)=>{ s.bulletSpeedMulti *= 1.2; }});
  skills.push({ name:"远程打击", description:"子弹存活时间 +0.5秒", tier:1, icon:"scope", effect:(s)=>{ s.bulletLifetime += 0.5; }});
  skills.push({ name:"精准射手", description:"暴击率 +8%", tier:1, icon:"target", effect:(s)=>{ s.critRate += 0.08; }});
  skills.push({ name:"暴击大师", description:"暴击伤害 +30%", tier:1, icon:"exclamationmark.triangle.fill", effect:(s)=>{ s.critDamageMulti += 0.3; }});
  skills.push({ name:"磁铁体质", description:"拾取范围 +40%", tier:1, icon:"magnet", effect:(s)=>{ s.pickupRange *= 1.4; }});
  skills.push({ name:"基础护甲", description:"受到伤害 -10%", tier:1, icon:"shield.fill", effect:(s)=>{ s.damageReduction += 0.1; }});
  skills.push({ name:"学习天赋", description:"获得经验 +15%", tier:1, icon:"book.fill", effect:(s)=>{ s.expMultiplier *= 1.15; }});
  skills.push({ name:"幸运星", description:"稀有掉落率 +10%", tier:1, icon:"star.fill", effect:(s)=>{ s.luckBonus += 0.1; }});
  skills.push({ name:"轻量化", description:"移动时不降低射速", tier:1, icon:"wind", effect:(s)=>{ s.moveShootPenalty = false; }});
  skills.push({ name:"快速恢复", description:"每秒恢复 0.5 生命", tier:1, icon:"cross.fill", effect:(s)=>{ s.regenRate += 0.5; }});

  // ------------------------------
  // 子弹变体类 (16-35)
  // ------------------------------
  skills.push({ name:"多重射击", description:"子弹数量 +1", tier:2, icon:"arrow.up.forward.and.arrow.down.backward", effect:(s)=>{ s.bulletCount += 1; }});
  skills.push({ name:"散弹枪", description:"+3 子弹，散布角度增大", tier:2, icon:"arrow.branch", effect:(s)=>{ s.bulletCount += 3; s.spreadAngle += 0.25; }});
  skills.push({ name:"穿透弹", description:"子弹可穿透 1 个敌人", tier:2, icon:"arrow.right.to.line", effect:(s)=>{ s.pierceCount += 1; }});
  skills.push({ name:"分裂弹", description:"子弹击中敌人后分裂成 2 发", tier:3, icon:"arrow.triangle.branch", effect:(s)=>{ s.splitOnHit = true; s.splitCount = 2; }});
  skills.push({ name:"追踪导弹", description:"子弹会轻微追踪敌人", tier:2, icon:"location.north.fill", effect:(s)=>{ s.homingStrength += 0.3; }});
  skills.push({ name:"强力追踪", description:"大幅增强子弹追踪能力", tier:3, icon:"location.north.line.fill", effect:(s)=>{ s.homingStrength += 0.7; }});
  skills.push({ name:"反弹弹", description:"子弹撞墙后反弹 1 次", tier:2, icon:"arrow.uturn.right", effect:(s)=>{ s.bounceCount += 1; }});
  skills.push({ name:"超级反弹", description:"子弹可反弹 3 次", tier:3, icon:"arrow.triangle.2.circlepath", effect:(s)=>{ s.bounceCount += 3; }});
  skills.push({ name:"冰冻弹", description:"子弹有 20% 几率冰冻敌人 1秒", tier:2, icon:"snowflake", effect:(s)=>{ s.freezeChance += 0.2; s.freezeDuration = Math.max(s.freezeDuration, 1.0); }});
  skills.push({ name:"寒冰大师", description:"冰冻几率 +30%，持续 +1秒", tier:3, icon:"snowflake.circle.fill", effect:(s)=>{ s.freezeChance += 0.3; s.freezeDuration += 1.0; }});
  skills.push({ name:"燃烧弹", description:"子弹点燃敌人，3秒内造成额外伤害", tier:2, icon:"flame.fill", effect:(s)=>{ s.burnChance = 1.0; s.burnDamage = 5; s.burnDuration = 3.0; }});
  skills.push({ name:"地狱火", description:"燃烧伤害 +100%，蔓延给附近敌人", tier:3, icon:"flame.circle.fill", effect:(s)=>{ s.burnDamage *= 2; s.burnSpread = true; }});
  skills.push({ name:"毒弹", description:"敌人中毒，持续掉血 5秒", tier:2, icon:"leaf.fill", effect:(s)=>{ s.poisonChance = 1.0; s.poisonDamage = 3; s.poisonDuration = 5.0; }});
  skills.push({ name:"剧毒", description:"毒伤害 +100%，中毒敌人死亡时爆炸", tier:3, icon:"leaf.circle.fill", effect:(s)=>{ s.poisonDamage *= 2; s.poisonExplode = true; }});
  skills.push({ name:"闪电链", description:"子弹击中后跳跃至附近 2 个敌人", tier:3, icon:"bolt.horizontal.fill", effect:(s)=>{ s.chainLightning = true; s.chainCount = 2; }});
  skills.push({ name:"超导闪电", description:"闪电跳跃 +2 次，伤害不衰减", tier:3, icon:"bolt.circle.fill", effect:(s)=>{ s.chainCount += 2; s.chainDamageDecay = 1.0; }});
  skills.push({ name:"爆炸弹头", description:"子弹击中产生小范围爆炸", tier:2, icon:"burst.fill", effect:(s)=>{ s.areaDamageRadius = 30; }});
  skills.push({ name:"核爆", description:"爆炸范围 +100%，击退敌人", tier:3, icon:"sun.max.fill", effect:(s)=>{ s.areaDamageRadius *= 2; s.explosionKnockback = true; }});
  skills.push({ name:"引力弹", description:"子弹吸引附近敌人靠近弹道", tier:2, icon:"tornado", effect:(s)=>{ s.bulletGravityPull = 50; }});
  skills.push({ name:"黑洞弹", description:"子弹消失时产生吸引敌人的黑洞", tier:3, icon:"circle.hexagongrid.fill", effect:(s)=>{ s.blackHoleOnDeath = true; }});

  // ------------------------------
  // 防御与生存类 (36-55)
  // ------------------------------
  skills.push({ name:"能量护盾", description:"生成 1 个绕身旋转的护盾球", tier:2, icon:"shield.lefthalf.filled", effect:(s)=>{ s.orbitalShieldCount += 1; }});
  skills.push({ name:"护盾矩阵", description:"护盾球 +2，旋转速度提升", tier:3, icon:"shield.checkered", effect:(s)=>{ s.orbitalShieldCount += 2; s.orbitalShieldSpeed *= 1.5; }});
  skills.push({ name:"荆棘护甲", description:"受击时反弹 30% 伤害给攻击者", tier:2, icon:"allergens", effect:(s)=>{ s.thornsDamagePercent += 0.3; }});
  skills.push({ name:"荆棘大师", description:"反弹伤害 +50%，附带减速效果", tier:3, icon:"allergens.fill", effect:(s)=>{ s.thornsDamagePercent += 0.5; s.thornsSlow = true; }});
  skills.push({ name:"闪避大师", description:"20% 几率完全闪避伤害", tier:2, icon:"figure.dodge", effect:(s)=>{ s.dodgeChance += 0.2; }});
  skills.push({ name:"幻影", description:"闪避成功后短暂无敌", tier:3, icon:"figure.2.arms.open", effect:(s)=>{ s.dodgeInvincibility = true; }});
  skills.push({ name:"无敌帧强化", description:"受伤后无敌时间 +0.5秒", tier:2, icon:"clock.badge.checkmark", effect:(s)=>{ s.iFrameDuration += 0.5; }});
  skills.push({ name:"最后一搏", description:"生命低于 20% 时，伤害 +50%", tier:2, icon:"heart.slash.fill", effect:(s)=>{ s.lowHpDamageBoost = true; s.lowHpThreshold = 0.2; s.lowHpDamageMulti = 1.5; }});
  skills.push({ name:"狂战士", description:"生命低于 30% 时，攻速 +100%", tier:3, icon:"figure.martial.arts", effect:(s)=>{ s.berserkerMode = true; s.berserkerThreshold = 0.3; }});
  skills.push({ name:"吸血鬼", description:"10% 几率吸取伤害的 20% 为生命", tier:2, icon:"drop.fill", effect:(s)=>{ s.lifestealChance += 0.1; s.lifestealPercent = 0.2; }});
  skills.push({ name:"血之契约", description:"吸血几率 100%，但最大生命 -20%", tier:3, icon:"drop.triangle.fill", effect:(s)=>{ s.lifestealChance = 1.0; s.lifestealPercent = 0.15; s.playerMaxHealth *= 0.8; s.playerHealth = Math.min(s.playerHealth, s.playerMaxHealth); }});
  skills.push({ name:"再生", description:"每秒恢复 2 点生命", tier:2, icon:"bandage.fill", effect:(s)=>{ s.regenRate += 2; }});
  skills.push({ name:"超级再生", description:"受伤后 5秒 内再生效果 x3", tier:3, icon:"bandage", effect:(s)=>{ s.combatRegenBoost = true; }});
  skills.push({ name:"紧急修复", description:"生命低于 25% 时每秒回复 5%", tier:2, icon:"cross.circle.fill", effect:(s)=>{ s.emergencyHealActive = true; }});
  skills.push({ name:"不死鸟", description:"死亡时有 50% 几率复活并回复 30% 血量", tier:3, icon:"bird.fill", effect:(s)=>{ s.phoenixRevive = true; s.phoenixChance = 0.5; }});
  skills.push({ name:"坚韧", description:"单次伤害上限为最大生命的 25%", tier:3, icon:"figure.strengthtraining.traditional", effect:(s)=>{ s.damageCap = 0.25; }});
  skills.push({ name:"适应性护甲", description:"连续受到相同类型伤害时减伤增加", tier:2, icon:"circle.dotted", effect:(s)=>{ s.adaptiveArmor = true; }});
  skills.push({ name:"回光返照", description:"致命伤害时有3秒无敌但之后必死", tier:3, icon:"sparkle", effect:(s)=>{ s.lastStand = true; }});
  skills.push({ name:"格挡", description:"正面受击有 15% 几率完全格挡", tier:2, icon:"hand.raised.fill", effect:(s)=>{ s.blockChance += 0.15; }});
  skills.push({ name:"完美格挡", description:"格挡成功时反击造成 200% 伤害", tier:3, icon:"hand.raised.circle.fill", effect:(s)=>{ s.perfectBlockCounter = true; }});

  // ------------------------------
  // 召唤物与自动武器 (56-75)
  // ------------------------------
  skills.push({ name:"攻击无人机", description:"召唤 1 架自动攻击无人机", tier:2, icon:"airplane", effect:(s)=>{ s.droneCount += 1; }});
  skills.push({ name:"无人机编队", description:"无人机 +2，攻击力提升", tier:3, icon:"airplane.circle.fill", effect:(s)=>{ s.droneCount += 2; s.droneDamage *= 1.5; }});
  skills.push({ name:"地雷部署", description:"移动时留下地雷，敌人踩中爆炸", tier:2, icon:"circle.hexagongrid", effect:(s)=>{ s.mineDropEnabled = true; s.mineDropInterval = 2.0; }});
  skills.push({ name:"地雷专家", description:"地雷伤害 +100%，爆炸范围 +50%", tier:3, icon:"circle.hexagongrid.fill", effect:(s)=>{ s.mineDamage *= 2; s.mineRadius *= 1.5; }});
  skills.push({ name:"自动炮塔", description:"召唤固定炮塔持续攻击", tier:2, icon:"building.columns.fill", effect:(s)=>{ s.turretCount += 1; }});
  skills.push({ name:"重型炮塔", description:"炮塔攻击造成范围伤害", tier:3, icon:"building.2.fill", effect:(s)=>{ s.turretAOE = true; s.turretDamage *= 1.5; }});
  skills.push({ name:"刃旋", description:"环绕玩家的旋转刀片", tier:2, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 2; }});
  skills.push({ name:"死亡之舞", description:"刀片数量 +4，范围扩大", tier:3, icon:"fan.and.light.ceiling.fill", effect:(s)=>{ s.bladeOrbitCount += 4; s.bladeOrbitRadius *= 1.5; }});
  skills.push({ name:"幽灵", description:"召唤幽灵自动攻击最近敌人", tier:2, icon:"moon.fill", effect:(s)=>{ s.ghostCount += 1; }});
  skills.push({ name:"幽灵军团", description:"幽灵 +3，攻击带有减速效果", tier:3, icon:"moon.stars.fill", effect:(s)=>{ s.ghostCount += 3; s.ghostSlow = true; }});
  skills.push({ name:"火焰轨迹", description:"移动时留下火焰路径伤害敌人", tier:2, icon:"flame", effect:(s)=>{ s.fireTrailEnabled = true; }});
  skills.push({ name:"地狱之路", description:"火焰伤害 +100%，减速敌人", tier:3, icon:"flame.fill", effect:(s)=>{ s.fireTrailDamage *= 2; s.fireTrailSlow = true; }});
  skills.push({ name:"召唤陨石", description:"每 10秒 随机召唤陨石轰炸", tier:2, icon:"globe.americas.fill", effect:(s)=>{ s.meteorEnabled = true; s.meteorInterval = 10.0; }});
  skills.push({ name:"流星雨", description:"陨石数量 x3，间隔减半", tier:3, icon:"sparkles", effect:(s)=>{ s.meteorCount *= 3; s.meteorInterval *= 0.5; }});
  skills.push({ name:"闪电光环", description:"周围敌人持续受到闪电伤害", tier:2, icon:"bolt.ring.closed", effect:(s)=>{ s.lightningAuraEnabled = true; s.lightningAuraRadius = 100; }});
  skills.push({ name:"雷神", description:"光环范围 +100%，伤害 +50%", tier:3, icon:"bolt.shield.fill", effect:(s)=>{ s.lightningAuraRadius *= 2; s.lightningAuraDamage *= 1.5; }});
  skills.push({ name:"影子克隆", description:"召唤 1 个复制你攻击的影子", tier:3, icon:"person.2.fill", effect:(s)=>{ s.shadowCloneCount += 1; }});
  skills.push({ name:"分身术", description:"影子克隆 +2，持续时间增加", tier:3, icon:"person.3.fill", effect:(s)=>{ s.shadowCloneCount += 2; s.shadowCloneDuration *= 1.5; }});
  skills.push({ name:"黑洞", description:"每 15秒 生成黑洞吸引并伤害敌人", tier:3, icon:"circle.dotted.circle", effect:(s)=>{ s.blackHoleAbility = true; }});
  skills.push({ name:"奇点", description:"黑洞吸引力和伤害提升 100%", tier:3, icon:"circle.circle.fill", effect:(s)=>{ s.blackHolePower *= 2; }});

  // ------------------------------
  // 触发与连锁类 (76-90)
  // ------------------------------
  skills.push({ name:"连杀奖励", description:"连续击杀增加临时伤害加成", tier:2, icon:"flame.circle", effect:(s)=>{ s.killStreakEnabled = true; }});
  skills.push({ name:"杀戮狂欢", description:"连杀奖励上限提高，衰减减慢", tier:3, icon:"flame.circle.fill", effect:(s)=>{ s.killStreakMaxBonus *= 2; s.killStreakDecay *= 0.5; }});
  skills.push({ name:"击杀回血", description:"击杀敌人回复 2 点生命", tier:2, icon:"heart.text.square.fill", effect:(s)=>{ s.killHealAmount = 2; }});
  skills.push({ name:"噬魂", description:"击杀回复 5 生命，暂时提升攻速", tier:3, icon:"person.crop.circle.badge.checkmark", effect:(s)=>{ s.killHealAmount = 5; s.killAttackSpeedBoost = true; }});
  skills.push({ name:"击杀爆炸", description:"敌人死亡时爆炸伤害周围敌人", tier:2, icon:"burst", effect:(s)=>{ s.deathExplosion = true; s.deathExplosionRadius = 50; }});
  skills.push({ name:"连锁爆炸", description:"爆炸可以触发其他敌人爆炸", tier:3, icon:"waveform.path.ecg", effect:(s)=>{ s.chainExplosion = true; }});
  skills.push({ name:"暴怒", description:"受到伤害后 3秒 内攻击力 +25%", tier:2, icon:"exclamationmark.octagon.fill", effect:(s)=>{ s.rageOnHit = true; s.rageDamageBonus = 0.25; }});
  skills.push({ name:"复仇", description:"受伤后下一次攻击必定暴击", tier:3, icon:"exclamationmark.triangle.fill", effect:(s)=>{ s.revengeEnabled = true; }});
  skills.push({ name:"幸运一击", description:"5% 几率造成 10倍 伤害", tier:2, icon:"star.circle.fill", effect:(s)=>{ s.luckyCritChance = 0.05; s.luckyCritMulti = 10.0; }});
  skills.push({ name:"欧皇附体", description:"幸运一击几率翻倍", tier:3, icon:"crown.fill", effect:(s)=>{ s.luckyCritChance *= 2; }});
  skills.push({ name:"处决", description:"对低血量敌人造成额外伤害", tier:2, icon:"scissors", effect:(s)=>{ s.executeEnabled = true; s.executeThreshold = 0.3; }});
  skills.push({ name:"斩杀", description:"直接击杀 20% 血量以下的敌人", tier:3, icon:"scissors.badge.ellipsis", effect:(s)=>{ s.instantKillThreshold = 0.2; }});
  skills.push({ name:"超载", description:"暴击时有几率再次攻击", tier:2, icon:"bolt.badge.a.fill", effect:(s)=>{ s.overloadChance = 0.3; }});
  skills.push({ name:"无限超载", description:"超载可以连锁触发", tier:3, icon:"bolt.badge.clock.fill", effect:(s)=>{ s.overloadChain = true; }});
  skills.push({ name:"时间扭曲", description:"击杀敌人有几率短暂减慢时间", tier:3, icon:"clock.arrow.circlepath", effect:(s)=>{ s.timeWarpOnKill = true; }});

  // ------------------------------
  // 特殊机制类 (91-115)
  // ------------------------------
  const TAU = window.GameUtils.TAU;  // 从工具模块导入，避免重复定义
  skills.push({ name:"加特林模式", description:"射速 x2，单发伤害 -40%", tier:3, icon:"gearshape.fill", effect:(s)=>{ s.shootInterval *= 0.5; s.bulletDamage *= 0.6; }});
  skills.push({ name:"狙击模式", description:"射速 -50%，伤害 x2，射程无限", tier:3, icon:"scope", effect:(s)=>{ s.shootInterval *= 2; s.bulletDamage *= 2; s.bulletLifetime = 10.0; }});
  skills.push({ name:"霰弹模式", description:"+5 子弹，大散布，短射程", tier:3, icon:"list.bullet", effect:(s)=>{ s.bulletCount += 5; s.spreadAngle = 0.8; s.bulletLifetime *= 0.5; }});
  skills.push({ name:"蓄力攻击", description:"站立不动时积攒能量，下次攻击伤害提升", tier:2, icon:"bolt.fill", effect:(s)=>{ s.chargeAttackEnabled = true; }});
  skills.push({ name:"超级蓄力", description:"蓄力速度 +100%，最大加成提升", tier:3, icon:"bolt.batteryblock.fill", effect:(s)=>{ s.chargeSpeed *= 2; s.chargeMaxBonus *= 1.5; }});
  skills.push({ name:"冲刺", description:"双击方向可以冲刺", tier:2, icon:"figure.run", effect:(s)=>{ s.dashEnabled = true; s.dashCooldown = 3.0; }});
  skills.push({ name:"闪电冲刺", description:"冲刺伤害路径上的敌人", tier:3, icon:"figure.run.circle.fill", effect:(s)=>{ s.dashDamage = true; }});
  skills.push({ name:"弹药回收", description:"未击中的子弹有 30% 几率返还", tier:2, icon:"arrow.uturn.backward", effect:(s)=>{ s.ammoRecoveryChance = 0.3; }});
  skills.push({ name:"永动机", description:"击中敌人时有几率不消耗射击间隔", tier:2, icon:"repeat.circle.fill", effect:(s)=>{ s.freeAttackChance = 0.2; }});
  skills.push({ name:"近战反击", description:"敌人近身时自动释放冲击波", tier:2, icon:"waveform", effect:(s)=>{ s.meleeCounterEnabled = true; }});
  skills.push({ name:"弹幕", description:"同时向所有方向射击", tier:3, icon:"circle.and.line.horizontal.fill", effect:(s)=>{ s.bulletCount += 8; s.spreadAngle = TAU / s.bulletCount; s.allDirectionFire = true; }});
  skills.push({ name:"后座力", description:"射击时向后推动自己，增加灵活性", tier:2, icon:"arrow.backward.to.line", effect:(s)=>{ s.recoilPush = true; }});
  skills.push({ name:"压制射击", description:"射击方向的敌人移动速度降低", tier:2, icon:"arrow.down.to.line.compact", effect:(s)=>{ s.suppressionEnabled = true; }});
  skills.push({ name:"脆弱标记", description:"击中的敌人受到额外伤害持续 3秒", tier:2, icon:"tag.fill", effect:(s)=>{ s.vulnerabilityMark = true; s.vulnerabilityBonus = 0.3; }});
  skills.push({ name:"移动射击", description:"移动时射速 +30%", tier:2, icon:"arrow.right.and.line.vertical.and.arrow.left", effect:(s)=>{ s.movingFireRateBonus = 0.3; }});
  skills.push({ name:"静止强化", description:"站定时伤害 +40%", tier:2, icon:"stop.fill", effect:(s)=>{ s.stationaryDamageBonus = 0.4; }});
  skills.push({ name:"玻璃大炮", description:"伤害 +100%，但生命值 -50%", tier:3, icon:"sparkle.magnifyingglass", effect:(s)=>{ s.bulletDamage *= 2; s.playerMaxHealth *= 0.5; s.playerHealth = Math.min(s.playerHealth, s.playerMaxHealth); }});
  skills.push({ name:"坦克", description:"生命 +100%，移动速度 -20%", tier:3, icon:"shield.fill", effect:(s)=>{ s.playerMaxHealth *= 2; s.playerHealth *= 2; s.playerSpeedMulti *= 0.8; }});
  skills.push({ name:"赌徒", description:"每次攻击伤害在 50%-200% 之间随机", tier:2, icon:"dice.fill", effect:(s)=>{ s.gamblerMode = true; }});
  skills.push({ name:"临界状态", description:"生命越接近 50%，伤害越高", tier:3, icon:"gauge.badge.plus", effect:(s)=>{ s.criticalStateEnabled = true; }});
  skills.push({ name:"共生", description:"附近每有 1 个敌人，伤害 +5%（上限50%）", tier:2, icon:"person.3.sequence.fill", effect:(s)=>{ s.symbiosisEnabled = true; }});
  skills.push({ name:"清场", description:"屏幕内敌人 <5 时，伤害 +50%", tier:2, icon:"rectangle.badge.minus", effect:(s)=>{ s.clearingBonus = true; }});
  skills.push({ name:"人海战术克星", description:"屏幕内敌人 >10 时，获得范围伤害", tier:2, icon:"rectangle.badge.plus", effect:(s)=>{ s.crowdControl = true; }});
  skills.push({ name:"动量", description:"连续移动时速度逐渐提升", tier:2, icon:"figure.walk.motion", effect:(s)=>{ s.momentumEnabled = true; }});
  skills.push({ name:"终极动量", description:"动量也会增加伤害", tier:3, icon:"figure.run.motion", effect:(s)=>{ s.momentumDamage = true; }});

  // ------------------------------
  // 额外：飞刀（刃旋）升级分支（只在已有飞刀后进入卡池）
  // ------------------------------
  for (const sk of baseBladeSkills) skills.push(sk);

  return skills;
}

// 生成额外的飞刀技能
function generateExtraBladeSkills() {
  return [
    { name:"飞刀精通", description:"飞刀伤害 +30%", tier:1, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitDamage *= 1.30; } },
    { name:"刀阵扩张", description:"飞刀半径 +20", tier:1, icon:"circle.dotted", effect:(s)=>{ s.bladeOrbitRadius += 20; } },
    { name:"刀舞加速", description:"飞刀旋转速度 +25%", tier:1, icon:"timer", effect:(s)=>{ s.bladeOrbitSpeed *= 1.25; } },
    { name:"利刃增殖", description:"飞刀数量 +1", tier:2, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 1; } },
    { name:"锋刃风暴", description:"飞刀数量 +3，旋转速度 +20%", tier:3, icon:"wind", effect:(s)=>{ s.bladeOrbitCount += 3; s.bladeOrbitSpeed *= 1.20; } },
    { name:"巨刃", description:"飞刀体积 +35%，伤害 +15%", tier:2, icon:"circle.fill", effect:(s)=>{ s.bladeOrbitScale *= 1.35; s.bladeOrbitDamage *= 1.15; } },
    { name:"寒刃", description:"飞刀命中 20% 冰冻 0.8秒", tier:2, icon:"snowflake", effect:(s)=>{ s.bladeOrbitFreezeChance = Math.min(1, s.bladeOrbitFreezeChance + 0.20); s.bladeOrbitFreezeDuration = Math.max(s.bladeOrbitFreezeDuration, 0.8); } },
    { name:"灼刃", description:"飞刀命中 30% 点燃 2秒", tier:2, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitBurnChance = Math.min(1, s.bladeOrbitBurnChance + 0.30); s.bladeOrbitBurnDuration = Math.max(s.bladeOrbitBurnDuration, 2.0); s.bladeOrbitBurnDamage = Math.max(s.bladeOrbitBurnDamage, 4); } },
    { name:"毒刃", description:"飞刀命中 30% 中毒 3秒", tier:2, icon:"leaf.fill", effect:(s)=>{ s.bladeOrbitPoisonChance = Math.min(1, s.bladeOrbitPoisonChance + 0.30); s.bladeOrbitPoisonDuration = Math.max(s.bladeOrbitPoisonDuration, 3.0); s.bladeOrbitPoisonDamage = Math.max(s.bladeOrbitPoisonDamage, 3); } },
    { name:"吸血飞刃", description:"飞刀命中 15% 吸血（伤害的 20%）", tier:3, icon:"drop.fill", effect:(s)=>{ s.bladeOrbitLifestealChance = Math.min(1, s.bladeOrbitLifestealChance + 0.15); s.bladeOrbitLifestealPercent = Math.max(s.bladeOrbitLifestealPercent, 0.20); } },
  ];
}

// 导出函数供其他模块使用
window.SkillSystem = {
  tierName,
  tierClass,
  iconFallback,
  generateAllSkills,
  generateExtraBladeSkills
};
