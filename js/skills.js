/**
 * 技能配置文件
 * 包含所有技能数据，便于修改和扩展
 */

// 技能等级名称
const TIER_LABELS = ["", "普通", "优秀", "稀有", "史诗", "传说"];

function clampTier(tier) {
  const t = Number.isFinite(tier) ? Math.round(tier) : 1;
  return Math.max(1, Math.min(5, t));
}

function tierName(tier) {
  return TIER_LABELS[clampTier(tier)] || TIER_LABELS[1];
}

// 技能等级 CSS 类名
function tierClass(tier) {
  return "tier" + clampTier(tier);
}

// 图标映射（SF Symbols -> 表情符号）
function iconFallback(iconStr) {
  const map = {
    // 基础映射
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
    "gearshape.fill": "⚙",
    "circle.and.line.horizontal.fill": "⦿",
    "dice.fill": "🎲",
    "crown.fill": "👑",
    // 科技军械库新增映射
    "cpu": "💾",
    "network": "🌐",
    "atom": "⚛️",
    "dna": "🧬",
    "arm": "🦾",
    "lab": "🧪",
    "satellite": "🛰️",
    "chip": "📼",
    "robot": "🤖",
    "laser": "⚡",
    "radioactive": "☢️",
    "bio": "☣️",
    "shield_tech": "🛡️",
    "skull_tech": "☠️",
    "rocket": "🚀",
    "ufo": "🛸",
    "battery": "🔋",
    "plug": "🔌",
    "magnet_tech": "🧲",
    "gear_tech": "⚙️",
    "eye": "👁️",
    "syringe": "💉",
    "pill": "💊",
    "explosion": "💥",
    "ghost": "👻",
    "wave": "〰️",
    "lock": "🔒",
    "key": "🔑",
    "cloud": "☁️",
    "recycle": "♻️",
    "trash": "🗑️",
    "infinity": "∞",
    "display": "🖥️",
    "hammer": "🔨",
    "scribble": "➰",
    "questionmark": "❓",
    "ant": "🐜",
    "cube": "🧊",
    "wifi": "📶",
    "lock_shield": "🔐",
    "arrow_left_right": "↔️",
    "bomb": "💣",
    "arrow_loop": "🔄",
    "glitch": "👾",
    "drone_attack": "⚔️",
    "drone_defend": "🛡️",
    "drone_mine": "💣",
    "blade_cyber": "⚔️",
    "blade_saw": "⚙️",
    "scanner": "📡",
    "router": "📶"
  };
  return map[iconStr] || "✦";
}

// 生成所有技能
function generateAllSkills(baseBladeSkills = []) {
  const skills = [];

  // ------------------------------
  // 基础属性类 (原有)
  // ------------------------------
  skills.push({ name:"强力子弹", description:"伤害 +15%", tier:1, icon:"bolt.fill", effect:(s)=>{ s.bulletDamage *= 1.15; }});
  skills.push({ name:"极速射击", description:"射速 +12%", tier:1, icon:"timer", effect:(s)=>{ s.shootInterval *= 0.88; }});
  skills.push({ name:"疾风步", description:"移动速度 +15%", tier:1, icon:"hare.fill", effect:(s)=>{ s.playerSpeedMulti *= 1.15; }});
  skills.push({ name:"大弹仓", description:"子弹体积 +25%", tier:1, icon:"circle.fill", effect:(s)=>{ s.bulletScale *= 1.25; }});
  skills.push({ name:"生命强化", description:"最大生命 +30", tier:1, icon:"heart.fill", effect:(s)=>{ s.playerMaxHealth += 30; s.playerHealth += 30; s.updateHealthUI(); }});
  skills.push({ name:"弹道加速", description:"子弹飞行速度 +20%", tier:1, icon:"arrow.up.right", effect:(s)=>{ s.bulletSpeedMulti *= 1.2; }});
  skills.push({ name:"远程打击", description:"子弹存活时间 +0.5秒", tier:1, icon:"scope", effect:(s)=>{ s.bulletLifetime += 0.5; }});
  skills.push({ name:"精准射手", description:"暴击率 +8%", tier:1, icon:"target", effect:(s)=>{ s.critRate += 0.08; }});
  skills.push({ name:"暴击大师", description:"暴击伤害 +30%", tier:2, icon:"exclamationmark.triangle.fill", effect:(s)=>{ s.critDamageMulti += 0.3; }});
  skills.push({ name:"重力场", description:"敌人被轻微拉向玩家，更容易命中", tier:1, icon:"magnet", effect:(s)=>{ s.gravityFieldEnabled = true; s.gravityFieldStrength = (s.gravityFieldStrength||0) + 30; }});
  skills.push({ name:"万有引力", description:"自动吸取所有经验球，无需靠近", tier:3, icon:"sparkles", effect:(s)=>{ s.expMagnetAll = true; }});
  skills.push({ name:"基础护甲", description:"受到伤害 -10%", tier:1, icon:"shield.fill", effect:(s)=>{ s.damageReduction += 0.1; }});
  skills.push({ name:"学习天赋", description:"获得经验 +15%", tier:1, icon:"book.fill", effect:(s)=>{ s.expMultiplier *= 1.15; }});
  skills.push({ name:"快速恢复", description:"每秒恢复 0.5 生命", tier:2, icon:"cross.fill", effect:(s)=>{ s.regenRate += 0.5; }});

  // ------------------------------
  // 子弹变体类 (原有)
  // ------------------------------
  skills.push({ name:"多重射击", description:"子弹数量 +1", tier:3, icon:"arrow.up.forward.and.arrow.down.backward", effect:(s)=>{ s.bulletCount += 1; }});
  skills.push({ name:"散弹枪", description:"+3 子弹，散布角度增大", tier:3, icon:"arrow.branch", effect:(s)=>{ s.bulletCount += 3; s.spreadAngle += 0.25; }});
  skills.push({ name:"穿透弹", description:"子弹可穿透 1 个敌人", tier:2, icon:"arrow.right.to.line", effect:(s)=>{ s.pierceCount += 1; }});
  skills.push({ name:"分裂弹", description:"子弹击中敌人后分裂成 2 发", tier:4, icon:"arrow.triangle.branch", effect:(s)=>{ s.splitOnHit = true; s.splitCount = 2; }});
  skills.push({ name:"追踪导弹", description:"子弹会轻微追踪敌人", tier:2, icon:"location.north.fill", effect:(s)=>{ s.homingStrength += 0.3; }});
  skills.push({ name:"强力追踪", description:"大幅增强子弹追踪能力", tier:3, icon:"location.north.line.fill", effect:(s)=>{ s.homingStrength += 0.7; }});
  skills.push({ name:"冰冻弹", description:"子弹有 20% 几率冰冻敌人 1秒", tier:3, icon:"snowflake", effect:(s)=>{ s.freezeChance += 0.2; s.freezeDuration = Math.max(s.freezeDuration, 1.0); }});
  skills.push({ name:"寒冰大师", description:"冰冻几率 +30%，持续 +1秒", tier:4, icon:"snowflake.circle.fill", effect:(s)=>{ s.freezeChance += 0.3; s.freezeDuration += 1.0; }});
  skills.push({ name:"燃烧弹", description:"子弹点燃敌人，3秒内造成额外伤害", tier:3, icon:"flame.fill", effect:(s)=>{ s.burnChance = 1.0; s.burnDamage = 5; s.burnDuration = 3.0; }});
  skills.push({ name:"地狱火", description:"燃烧伤害 +100%，蔓延给附近敌人", tier:4, icon:"flame.circle.fill", effect:(s)=>{ s.burnDamage *= 2; s.burnSpread = true; }});
  skills.push({ name:"毒弹", description:"敌人中毒，持续掉血 5秒", tier:3, icon:"leaf.fill", effect:(s)=>{ s.poisonChance = 1.0; s.poisonDamage = 3; s.poisonDuration = 5.0; }});
  skills.push({ name:"剧毒", description:"毒伤害 +100%，中毒敌人死亡时爆炸", tier:4, icon:"leaf.circle.fill", effect:(s)=>{ s.poisonDamage *= 2; s.poisonExplode = true; }});
  skills.push({ name:"闪电链", description:"子弹击中后跳跃至附近 2 个敌人", tier:4, icon:"bolt.horizontal.fill", effect:(s)=>{ s.chainLightning = true; s.chainCount = 2; }});
  skills.push({ name:"超导闪电", description:"闪电跳跃 +2 次，伤害不衰减", tier:5, icon:"bolt.circle.fill", effect:(s)=>{ s.chainCount += 2; s.chainDamageDecay = 1.0; }});
  skills.push({ name:"爆炸弹头", description:"子弹击中产生小范围爆炸", tier:3, icon:"burst.fill", effect:(s)=>{ s.areaDamageRadius = 30; }});
  skills.push({ name:"核爆", description:"爆炸范围 +100%，击退敌人", tier:4, icon:"sun.max.fill", effect:(s)=>{ s.areaDamageRadius *= 2; s.explosionKnockback = true; }});
  skills.push({ name:"黑洞弹", description:"子弹消失时产生吸引敌人的黑洞", tier:4, icon:"circle.hexagongrid.fill", effect:(s)=>{ s.blackHoleOnDeath = true; }});

  // ------------------------------
  // 防御与生存类 (原有)
  // ------------------------------
  skills.push({ name:"能量护盾", description:"生成 1 个绕身旋转的护盾球", tier:3, icon:"shield.lefthalf.filled", effect:(s)=>{ s.orbitalShieldCount += 1; }});
  skills.push({ name:"护盾矩阵", description:"护盾球 +2，旋转速度提升", tier:4, icon:"shield.checkered", effect:(s)=>{ s.orbitalShieldCount += 2; s.orbitalShieldSpeed *= 1.5; }});
  skills.push({ name:"荆棘护甲", description:"受击时反弹 30% 伤害给攻击者", tier:2, icon:"allergens", effect:(s)=>{ s.thornsDamagePercent += 0.3; }});
  skills.push({ name:"荆棘大师", description:"反弹伤害 +50%，附带减速效果", tier:4, icon:"allergens.fill", effect:(s)=>{ s.thornsDamagePercent += 0.5; s.thornsSlow = true; }});
  skills.push({ name:"闪避大师", description:"20% 几率完全闪避伤害", tier:3, icon:"figure.dodge", effect:(s)=>{ s.dodgeChance += 0.2; }});
  skills.push({ name:"幻影", description:"闪避成功后短暂无敌", tier:4, icon:"figure.2.arms.open", effect:(s)=>{ s.dodgeInvincibility = true; }});
  skills.push({ name:"无敌帧强化", description:"受伤后无敌时间 +0.5秒", tier:2, icon:"clock.badge.checkmark", effect:(s)=>{ s.iFrameDuration += 0.5; }});
  skills.push({ name:"最后一搏", description:"生命低于 20% 时，伤害 +50%", tier:3, icon:"heart.slash.fill", effect:(s)=>{ s.lowHpDamageBoost = true; s.lowHpThreshold = 0.2; s.lowHpDamageMulti = 1.5; }});
  skills.push({ name:"狂战士", description:"生命低于 30% 时，攻速 +100%", tier:4, icon:"figure.martial.arts", effect:(s)=>{ s.berserkerMode = true; s.berserkerThreshold = 0.3; }});
  skills.push({ name:"吸血鬼", description:"10% 几率吸取伤害的 20% 为生命", tier:3, icon:"drop.fill", effect:(s)=>{ s.lifestealChance += 0.1; s.lifestealPercent = 0.2; }});
  skills.push({ name:"血之契约", description:"吸血几率 100%，但最大生命 -20%", tier:4, icon:"drop.triangle.fill", effect:(s)=>{ s.lifestealChance = 1.0; s.lifestealPercent = 0.15; s.playerMaxHealth *= 0.8; s.playerHealth = Math.min(s.playerHealth, s.playerMaxHealth); }});
  skills.push({ name:"再生", description:"每秒恢复 2 点生命", tier:3, icon:"bandage.fill", effect:(s)=>{ s.regenRate += 2; }});
  skills.push({ name:"超级再生", description:"受伤后 5秒 内再生效果 x3", tier:4, icon:"bandage", effect:(s)=>{ s.combatRegenBoost = true; }});
  skills.push({ name:"紧急修复", description:"生命低于 25% 时每秒回复 5%", tier:3, icon:"cross.circle.fill", effect:(s)=>{ s.emergencyHealActive = true; }});
  skills.push({ name:"不死鸟", description:"死亡时有 50% 几率复活并回复 30% 血量", tier:5, icon:"bird.fill", effect:(s)=>{ s.phoenixRevive = true; s.phoenixChance = 0.5; }});
  skills.push({ name:"坚韧", description:"单次伤害上限为最大生命的 25%", tier:5, icon:"figure.strengthtraining.traditional", effect:(s)=>{ s.damageCap = 0.25; }});
  skills.push({ name:"回光返照", description:"致命伤害时有3秒无敌但之后必死", tier:4, icon:"sparkle", effect:(s)=>{ s.lastStand = true; }});
  skills.push({ name:"格挡", description:"正面受击有 15% 几率完全格挡", tier:2, icon:"hand.raised.fill", effect:(s)=>{ s.blockChance += 0.15; }});
  skills.push({ name:"完美格挡", description:"格挡成功时反击造成 200% 伤害", tier:4, icon:"hand.raised.circle.fill", effect:(s)=>{ s.perfectBlockCounter = true; }});

  // ------------------------------
  // 召唤物与自动武器 (原有)
  // ------------------------------
  skills.push({ name:"攻击无人机", description:"召唤 1 架自动攻击无人机", tier:3, icon:"airplane", effect:(s)=>{ s.droneCount += 1; }});
  skills.push({ name:"无人机编队", description:"无人机 +2，攻击力提升", tier:4, icon:"airplane.circle.fill", effect:(s)=>{ s.droneCount += 2; s.droneDamage *= 1.5; }});
  skills.push({ name:"地雷部署", description:"移动时留下地雷，敌人踩中爆炸", tier:3, icon:"circle.hexagongrid", effect:(s)=>{ s.mineDropEnabled = true; s.mineDropInterval = 2.0; }});
  skills.push({ name:"地雷专家", description:"地雷伤害 +100%，爆炸范围 +50%", tier:4, icon:"circle.hexagongrid.fill", effect:(s)=>{ s.mineDamage *= 2; s.mineRadius *= 1.5; }});
  skills.push({ name:"刃旋", description:"环绕玩家的旋转刀片", tier:3, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 2; }});
  skills.push({ name:"死亡之舞", description:"刀片数量 +4，范围扩大", tier:4, icon:"fan.and.light.ceiling.fill", effect:(s)=>{ s.bladeOrbitCount += 4; s.bladeOrbitRadius *= 1.5; }});
  skills.push({ name:"幽灵", description:"召唤幽灵自动攻击最近敌人", tier:3, icon:"moon.fill", effect:(s)=>{ s.ghostCount += 1; }});
  skills.push({ name:"幽灵军团", description:"幽灵 +3，攻击带有减速效果", tier:4, icon:"moon.stars.fill", effect:(s)=>{ s.ghostCount += 3; s.ghostSlow = true; }});
  skills.push({ name:"火焰轨迹", description:"移动时留下火焰路径伤害敌人", tier:3, icon:"flame", effect:(s)=>{ s.fireTrailEnabled = true; }});
  skills.push({ name:"地狱之路", description:"火焰伤害 +100%，减速敌人", tier:4, icon:"flame.fill", effect:(s)=>{ s.fireTrailDamage *= 2; s.fireTrailSlow = true; }});
  skills.push({ name:"召唤陨石", description:"每 10秒 随机召唤陨石轰炸", tier:3, icon:"globe.americas.fill", effect:(s)=>{ s.meteorEnabled = true; s.meteorInterval = 10.0; }});
  skills.push({ name:"流星雨", description:"陨石数量 x3，间隔减半", tier:4, icon:"sparkles", effect:(s)=>{ s.meteorCount *= 3; s.meteorInterval *= 0.5; }});
  skills.push({ name:"闪电光环", description:"周围敌人持续受到闪电伤害", tier:3, icon:"bolt.ring.closed", effect:(s)=>{ s.lightningAuraEnabled = true; s.lightningAuraRadius = 100; }});
  skills.push({ name:"雷神", description:"光环范围 +100%，伤害 +50%", tier:4, icon:"bolt.shield.fill", effect:(s)=>{ s.lightningAuraRadius *= 2; s.lightningAuraDamage *= 1.5; }});
  skills.push({ name:"黑洞", description:"每 15秒 生成黑洞吸引并伤害敌人", tier:4, icon:"circle.dotted.circle", effect:(s)=>{ s.blackHoleAbility = true; }});
  skills.push({ name:"奇点", description:"黑洞吸引力和伤害提升 100%", tier:5, icon:"circle.circle.fill", effect:(s)=>{ s.blackHolePower *= 2; }});

  // ------------------------------
  // 触发与连锁类 (原有)
  // ------------------------------
  skills.push({ name:"连杀奖励", description:"连续击杀增加临时伤害加成", tier:2, icon:"flame.circle", effect:(s)=>{ s.killStreakEnabled = true; }});
  skills.push({ name:"杀戮狂欢", description:"连杀奖励上限提高，衰减减慢", tier:4, icon:"flame.circle.fill", effect:(s)=>{ s.killStreakMaxBonus *= 2; s.killStreakDecay *= 0.5; }});
  skills.push({ name:"击杀回血", description:"击杀敌人回复 2 点生命", tier:2, icon:"heart.text.square.fill", effect:(s)=>{ s.killHealAmount = 2; }});
  skills.push({ name:"噬魂", description:"击杀回复 5 生命", tier:4, icon:"person.crop.circle.badge.checkmark", effect:(s)=>{ s.killHealAmount = 5; }});
  skills.push({ name:"击杀爆炸", description:"敌人死亡时爆炸伤害周围敌人", tier:3, icon:"burst", effect:(s)=>{ s.deathExplosion = true; s.deathExplosionRadius = 50; }});
  skills.push({ name:"暴怒", description:"受到伤害后 3秒 内攻击力 +25%", tier:3, icon:"exclamationmark.octagon.fill", effect:(s)=>{ s.rageOnHit = true; s.rageDamageBonus = 0.25; }});
  skills.push({ name:"复仇", description:"受伤后下一次攻击必定暴击", tier:4, icon:"exclamationmark.triangle.fill", effect:(s)=>{ s.revengeEnabled = true; }});
  skills.push({ name:"幸运一击", description:"5% 几率造成 10倍 伤害", tier:4, icon:"star.circle.fill", effect:(s)=>{ s.luckyCritChance = 0.05; s.luckyCritMulti = 10.0; }});
  skills.push({ name:"欧皇附体", description:"幸运一击几率翻倍", tier:5, icon:"crown.fill", effect:(s)=>{ s.luckyCritChance *= 2; }});
  skills.push({ name:"处决", description:"对低血量敌人造成额外伤害", tier:3, icon:"scissors", effect:(s)=>{ s.executeEnabled = true; s.executeThreshold = 0.3; }});
  skills.push({ name:"斩杀", description:"直接击杀 20% 血量以下的敌人", tier:4, icon:"scissors.badge.ellipsis", effect:(s)=>{ s.instantKillThreshold = 0.2; }});
  skills.push({ name:"超载", description:"暴击时有几率再次攻击", tier:3, icon:"bolt.badge.a.fill", effect:(s)=>{ s.overloadChance = 0.3; }});
  skills.push({ name:"无限超载", description:"超载可以连锁触发", tier:5, icon:"bolt.badge.clock.fill", effect:(s)=>{ s.overloadChain = true; }});
  
  // ------------------------------
  // 特殊机制类 (原有)
  // ------------------------------
  const TAU = window.GameUtils ? window.GameUtils.TAU : Math.PI * 2;
  skills.push({ name:"加特林模式", description:"射速 x2，单发伤害 -40%", tier:4, icon:"gearshape.fill", effect:(s)=>{ s.shootInterval *= 0.5; s.bulletDamage *= 0.6; }});
  skills.push({ name:"狙击模式", description:"射速 -50%，伤害 x2，射程无限", tier:4, icon:"scope", effect:(s)=>{ s.shootInterval *= 2; s.bulletDamage *= 2; s.bulletLifetime = 10.0; }});
  skills.push({ name:"霰弹模式", description:"+5 子弹，大散布，短射程", tier:4, icon:"list.bullet", effect:(s)=>{ s.bulletCount += 5; s.spreadAngle = 0.8; s.bulletLifetime *= 0.5; }});
  skills.push({ name:"蓄力攻击", description:"站立不动时积攒能量，下次攻击伤害提升", tier:3, icon:"bolt.fill", effect:(s)=>{ s.chargeAttackEnabled = true; }});
  skills.push({ name:"超级蓄力", description:"蓄力速度 +100%，最大加成提升", tier:4, icon:"bolt.batteryblock.fill", effect:(s)=>{ s.chargeSpeed *= 2; s.chargeMaxBonus *= 1.5; }});
  skills.push({ name:"弹幕", description:"同时向所有方向射击", tier:5, icon:"circle.and.line.horizontal.fill", effect:(s)=>{ s.bulletCount += 8; s.spreadAngle = TAU / s.bulletCount; s.allDirectionFire = true; }});
  skills.push({ name:"后座力", description:"射击时向后推动自己，增加灵活性", tier:2, icon:"arrow.backward.to.line", effect:(s)=>{ s.recoilPush = true; }});
  skills.push({ name:"弹道偏转", description:"子弹击中敌人后有30%概率弹射至附近敌人", tier:2, icon:"arrow.triangle.branch", effect:(s)=>{ s.bulletBounceChance = 0.3; s.bulletBounceCount = 1; }});
  skills.push({ name:"脆弱标记", description:"击中的敌人受到额外伤害持续 3秒", tier:3, icon:"tag.fill", effect:(s)=>{ s.vulnerabilityMark = true; s.vulnerabilityBonus = 0.3; }});
  skills.push({ name:"移动射击", description:"移动时射速 +30%", tier:2, icon:"arrow.right.and.line.vertical.and.arrow.left", effect:(s)=>{ s.movingFireRateBonus = 0.3; }});
  skills.push({ name:"静止强化", description:"站定时伤害 +40%", tier:2, icon:"stop.fill", effect:(s)=>{ s.stationaryDamageBonus = 0.4; }});
  skills.push({ name:"玻璃大炮", description:"伤害 +100%，但生命值 -50%", tier:5, icon:"sparkle.magnifyingglass", effect:(s)=>{ s.bulletDamage *= 2; s.playerMaxHealth *= 0.5; s.playerHealth = Math.min(s.playerHealth, s.playerMaxHealth); }});
  skills.push({ name:"坦克", description:"生命 +100%，移动速度 -20%", tier:5, icon:"shield.fill", effect:(s)=>{ s.playerMaxHealth *= 2; s.playerHealth *= 2; s.playerSpeedMulti *= 0.8; }});
  skills.push({ name:"赌徒", description:"每次攻击伤害在 50%-200% 之间随机", tier:3, icon:"dice.fill", effect:(s)=>{ s.gamblerMode = true; }});
  skills.push({ name:"临界状态", description:"生命越接近 50%，伤害越高", tier:4, icon:"gauge.badge.plus", effect:(s)=>{ s.criticalStateEnabled = true; }});
  skills.push({ name:"共生", description:"附近每有 1 个敌人，伤害 +5%（上限50%）", tier:3, icon:"person.3.sequence.fill", effect:(s)=>{ s.symbiosisEnabled = true; }});
  skills.push({ name:"清场", description:"屏幕内敌人 <5 时，伤害 +50%", tier:3, icon:"rectangle.badge.minus", effect:(s)=>{ s.clearingBonus = true; }});
  skills.push({ name:"人海战术克星", description:"屏幕内敌人 >10 时，获得范围伤害", tier:3, icon:"rectangle.badge.plus", effect:(s)=>{ s.crowdControl = true; }});
  skills.push({ name:"动量", description:"连续移动时速度逐渐提升", tier:2, icon:"figure.walk.motion", effect:(s)=>{ s.momentumEnabled = true; }});
  skills.push({ name:"终极动量", description:"动量也会增加伤害", tier:4, icon:"figure.run.motion", effect:(s)=>{ s.momentumDamage = true; }});

  // ------------------------------
  // 额外：飞刀（刃旋）升级分支（只在已有飞刀后进入卡池）
  // ------------------------------
  for (const sk of baseBladeSkills) skills.push(sk);

  // ------------------------------
  // 赛博朋克 490 大军械库
  // ------------------------------
  const cyberSkills = generateCyberpunkArsenal();
  for (const sk of cyberSkills) skills.push(sk);
  
  // 保留旧的科技技能逻辑，以防万一有依赖，但它们被整合进 generateCyberpunkArsenal 或作为补充
  // const techSkills = generateSciFiSkills(); // 已废弃，使用新生成器覆盖
  
  // ------------------------------
  // 魔法技能系统 500个 (新增)
  // ------------------------------
  if (window.MagicSkillSystem && window.MagicSkillSystem.generateMagicSkills) {
    const magicSkills = window.MagicSkillSystem.generateMagicSkills();
    for (const sk of magicSkills) skills.push(sk);
  }
  
  return skills;
}

// ------------------------------
// 赛博朋克军械库生成器 - 生成 490+ 独特技能
// ------------------------------
function generateCyberpunkArsenal() {
  const skills = [];
  let idCounter = 1000;

  // 1. 元素武器系统 (80个)
  // 4 种元素 x 4 种形态 x 5 个等级（已移除故障/混乱元素）
  const elements = [
    { id: "plasma", name: "等离子", icon: "atom", color: "#00ffff", desc: "爆炸并熔化护甲" },
    { id: "neon",   name: "霓虹",   icon: "bolt.fill", color: "#ff00ff", desc: "连锁闪电与眩晕" },
    { id: "void",   name: "虚空",   icon: "circle.hexagongrid.fill", color: "#600080", desc: "黑洞引力与斩杀" },
    { id: "bio",    name: "生化",   icon: "leaf.fill", color: "#00ff00", desc: "剧毒云与蔓延" }
  ];

  const forms = [
    { id: "bullet", name: "弹头", desc: "你的子弹附带" },
    { id: "nova",   name: "新星", desc: "受击释放" },
    { id: "aura",   name: "光环", desc: "周围持续释放" },
    { id: "mine",   name: "陷阱", desc: "部署" }
  ];
  
  const levels = ["I", "II", "III", "IV", "V"];
  const levelMult = [1.0, 1.5, 2.2, 3.0, 5.0];

  elements.forEach(elem => {
    forms.forEach(form => {
      // 跳过被举报的生化弹头组合
      if (elem.id === 'bio' && form.id === 'bullet') return;
      // 跳过被举报的虚空陷阱系列（替换为等离子陷阱增强版，见下方）
      if (elem.id === 'void' && form.id === 'mine') return;
      levels.forEach((lvl, idx) => {
        const tier = idx + 1;
        const power = levelMult[idx];
        skills.push({
          name: `${elem.name}${form.name} ${lvl}`,
          description: `${form.desc}${elem.name}能量，造成${Math.round(20*power)}点${elem.desc}伤害。`,
          tier: tier,
          icon: elem.icon,
          effect: (g) => {
            if (!g.cyber) g.cyber = {};
            // 启用对应的元素系统
            const key = `elem_${elem.id}_${form.id}`;
            g.cyber[key] = (g.cyber[key] || 0) + power;
            
            // 基础数值提升
            if (form.id === 'bullet') g.bulletDamage *= (1 + 0.05 * idx);
          }
        });
      });
    });
  });

  // 替换被举报的虚空陷阱系列：重力井陷阱（全新元素组合）
  // 5个等级的重力井陷阱，拥有独特的引力塌缩机制
  levels.forEach((lvl, idx) => {
    const tier = idx + 1;
    const power = levelMult[idx];
    skills.push({
      name: `重力井陷阱 ${lvl}`,
      description: `部署重力井陷阱，将范围内敌人拉向中心并造成${Math.round(15*power)}点挤压伤害。持续${(2 + idx).toFixed(0)}秒。`,
      tier: tier,
      icon: "magnet_tech",
      effect: (g) => {
        if (!g.cyber) g.cyber = {};
        const key = 'gravity_well_trap';
        g.cyber[key] = (g.cyber[key] || 0) + power;
        // 增强重力场效果
        g.gravityFieldEnabled = true;
        g.gravityFieldStrength = (g.gravityFieldStrength || 0) + 20 * (idx + 1);
      }
    });
  });

  // 2. 科技无人机群 (80个)
  // 4 种类型 x 4 种行为 x 5 个等级
  const droneTypes = [
    { id: "assault", name: "突击", icon: "drone_attack", desc: "自动射击" },
    { id: "guard",   name: "护卫", icon: "drone_defend", desc: "拦截子弹并反击" },
    { id: "bomber",  name: "轰炸", icon: "drone_mine", desc: "投放炸弹" },
    { id: "laser",   name: "激光", icon: "laser", desc: "持续照射" }
  ];
  
  const droneBehaviors = [
    { id: "swarm", name: "蜂群", desc: "数量+1，伤害降低" },
    { id: "heavy", name: "重型", desc: "伤害x2，射速降低" },
    { id: "rapid", name: "速射", desc: "射速x2" },
    { id: "elite", name: "精英", desc: "全属性提升" }
  ];

  droneTypes.forEach(type => {
    droneBehaviors.forEach(beh => {
      levels.forEach((lvl, idx) => {
        skills.push({
          name: `${beh.name}${type.name}无人机 ${lvl}`,
          description: `部署一台${beh.desc}的${type.desc}无人机 (等级 ${lvl})`,
          tier: idx + 1,
          icon: type.icon,
          effect: (g) => {
             if (!g.cyber) g.cyber = {};
             if (!g.cyber.drones) g.cyber.drones = [];
             g.cyber.drones.push({
                type: type.id,
                behavior: beh.id,
                level: idx + 1,
                id: Date.now() + Math.random() // Unique ID
             });
             // 同时也增加通用无人机计数以兼容旧逻辑
             g.droneCount++;
          }
        });
      });
    });
  });

  // 3. 纳米飞刃系统 (60个)
  // 3 种形态 x 4 种强化 x 5 个等级
  const bladeTypes = [
    { id: "razor", name: "剃刀", icon: "blade_cyber", desc: "高伤害，流血" },
    { id: "saw",   name: "锯齿", icon: "blade_saw", desc: "持续切割，破甲" },
    { id: "energy",name: "光剑", icon: "bolt.fill", desc: "高攻速，能量伤害" }
  ];
  
  const bladeBuffs = [
    { id: "expand", name: "扩张", desc: "范围加大" },
    { id: "accel",  name: "加速", desc: "旋转加快" },
    { id: "copy",   name: "复制", desc: "数量加倍" },
    { id: "vamp",   name: "渴血", desc: "命中回血" }
  ];

  bladeTypes.forEach(type => {
    bladeBuffs.forEach(buff => {
      levels.forEach((lvl, idx) => {
        skills.push({
          name: `${type.name}飞刃：${buff.name} ${lvl}`,
          description: `${type.desc}飞刃获得${buff.desc}效果 (Lv.${lvl})`,
          tier: idx + 1,
          icon: type.icon,
          effect: (g) => {
            // 基础加成
            g.bladeOrbitCount = Math.max(1, g.bladeOrbitCount + 1);
            if (buff.id === 'expand') g.bladeOrbitRadius += 15 * (idx+1);
            if (buff.id === 'accel') g.bladeOrbitSpeed *= (1 + 0.1 * (idx+1));
            if (buff.id === 'copy') g.bladeOrbitCount += (idx+1);
            if (buff.id === 'vamp') { g.bladeOrbitLifestealChance += 0.1; g.bladeOrbitLifestealPercent += 0.05 * (idx+1); }
            
            // 记录特殊类型
            if (!g.cyber) g.cyber = {};
            g.cyber.bladeType = type.id;
          }
        });
      });
    });
  });

  // 4. 赛博义体改造 (100个)
  // 10 个部位 x 2 种倾向 x 5 个等级
  const parts = [
     {name: "光学义眼", attr: "暴击", var1: "精准", var2: "致命"},
     {name: "液压臂", attr: "近战/击退", var1: "强力", var2: "冲击"},
     {name: "强化骨骼", attr: "生命", var1: "钛金", var2: "复合"},
     {name: "突触加速器", attr: "攻速", var1: "超频", var2: "反应"},
     {name: "皮下护甲", attr: "减伤", var1: "石墨烯", var2: "力场"},
     {name: "喷射脚踝", attr: "移速", var1: "冲刺", var2: "闪避"},
     {name: "辅助心脏", attr: "回复", var1: "再生", var2: "应急"},
     {name: "脑机接口", attr: "经验", var1: "下载", var2: "学习"},
     {name: "纳米肺", attr: "耐力", var1: "深呼吸", var2: "过滤"}, // 随便加点效果
     {name: "武器挂载", attr: "伤害", var1: "重型", var2: "突击"}
  ];

  parts.forEach(part => {
     levels.forEach((lvl, idx) => {
         // Var 1
         skills.push({
             name: `${part.var1}${part.name} ${lvl}`,
             description: `大幅提升${part.attr}属性，偏向${part.var1}强化。`,
             tier: idx + 1,
             icon: "chip",
             effect: (g) => {
                 const m = 1 + 0.1 * (idx+1);
                 if(part.attr==="暴击") g.critRate += 0.05 * (idx+1);
                 if(part.attr==="击退") g.knockbackForce += 50 * (idx+1);
                 if(part.attr==="生命") g.playerMaxHealth *= m;
                 if(part.attr==="攻速") g.shootInterval /= m;
                 if(part.attr==="减伤") g.damageReduction += 0.05 * (idx+1);
                 if(part.attr==="移速") g.playerSpeedMulti *= m;
                 if(part.attr==="回复") g.regenRate += 1 * (idx+1);
                 if(part.attr==="经验") g.expMultiplier *= m;
                 if(part.attr==="耐力") g.iFrameDuration += 0.2 * (idx+1);
                 if(part.attr==="伤害") g.bulletDamage *= m;
             }
         });
         // Var 2 (Slightly different trade-off logic could be added, here simplistic)
         skills.push({
             name: `${part.var2}${part.name} ${lvl}`,
             description: `极大提升${part.attr}效率，附带${part.var2}特效。`,
             tier: idx + 1,
             icon: "cpu",
             effect: (g) => {
                 const m = 1 + 0.15 * (idx+1); // Stronger but maybe...
                 if(part.attr==="暴击") g.critDamageMulti += 0.2 * (idx+1);
                 if(part.attr==="击退") g.knockbackForce += 80 * (idx+1);
                 if(part.attr==="生命") { g.playerMaxHealth += 50 * (idx+1); g.playerHealth+=50*(idx+1); }
                 if(part.attr==="攻速") g.shootInterval *= (1 - 0.05 * (idx+1));
                 if(part.attr==="减伤") { g.damageReduction += 0.03 * (idx+1); g.thornsDamagePercent += 0.1 * (idx+1); }
                 if(part.attr==="移速") { g.playerSpeedMulti *= (1 + 0.08 * (idx+1)); g.dodgeChance += 0.05 * (idx+1); }
                 if(part.attr==="回复") { g.lifestealChance += 0.05; g.lifestealPercent += 0.05 * (idx+1); }
                 if(part.attr==="经验") { g.pickupRange *= m; }
                 if(part.attr==="耐力") g.damageCap = Math.max(0.1, 0.5 - 0.05 * (idx+1));
                 if(part.attr==="伤害") { g.bulletDamage *= m; g.bulletScale *= 1.1; }
             }
         });
     });
  });

  // 5. 战术黑客协议 (50个)
  const hacks = [
    {name: "系统崩溃", desc: "全屏敌人瘫痪3秒", icon: "lock_shield"},
    {name: "病毒上传", desc: "击杀敌人时传染DoT", icon: "wifi"},
    {name: "逻辑炸弹", desc: "受击时释放EMP冲击波", icon: "bomb"},
    {name: "内存溢出", desc: "经验球爆炸造成伤害", icon: "chip"},
    {name: "过热协议", desc: "射击附带燃烧，由于过热偶尔扣血", icon: "flame"},
    {name: "时间膨胀", desc: "敌人子弹速度减半", icon: "timer"},
    {name: "量子纠缠", desc: "子弹命中后在敌人间产生量子链接，共享伤害", icon: "atom"},
    {name: "数据虹吸", desc: "每秒偷取周围敌人生命", icon: "network"},
    {name: "根权限",   desc: "所有技能效果提升10%", icon: "key"},
    {name: "入侵协议", desc: "黑入敌人系统使其攻击友方", icon: "glitch"}
  ];
  
  hacks.forEach(hack => {
      levels.forEach((lvl, idx) => {
          skills.push({
              name: `协议：${hack.name} ${lvl}`,
              description: `${hack.desc} (Ver.${idx}.0)`,
              tier: idx + 1,
              icon: hack.icon,
              effect: (g) => {
                  if (!g.cyber) g.cyber = {};
                  g.cyber[`hack_${hack.name}`] = (idx+1);
                  // Apply simple generic buffs alongside specific logic (handled in gameFactory)
                  if(hack.name === "根权限") g.bulletDamage *= 1.1;
                  if(hack.name === "量子纠缠") { g.quantumEntangleChance = Math.max(g.quantumEntangleChance, 0.15 + 0.05 * (idx+1)); g.quantumEntangleDamageShare = Math.max(g.quantumEntangleDamageShare, 0.2 + 0.1 * idx); }
              }
          });
      });
  });
  
  // 6. 实验性武器 (50个)
  const weapons = [
      {name: "磁轨炮", desc: "极高穿透与击退"},
      {name: "声波炮", desc: "宽范围震退敌人"},
      {name: "脉冲波", desc: "发射震荡脉冲波击退并眩晕敌人"},
      {name: "反物质", desc: "子弹湮灭敌人"},
      {name: "聚变枪", desc: "产生核爆"},
      {name: "冰河",   desc: "绝对零度冻结"},
      {name: "特斯拉", desc: "全屏闪电"},
      {name: "生化枪", desc: "腐蚀大地"},
      {name: "智能枪", desc: "必定命中"},
      {name: "光棱塔", desc: "折射激光"}
  ];
  
  weapons.forEach(w => {
      levels.forEach((lvl, idx) => {
          skills.push({
              name: `实验武器：${w.name} ${lvl}`,
              description: `装备${w.name}，${w.desc} (Mk.${idx+1})`,
              tier: idx + 1,
              icon: "hammer",
              effect: (g) => {
                   if (!g.cyber) g.cyber = {};
                   g.cyber[`weapon_${w.name}`] = (idx+1);
                   g.bulletDamage *= 1.2; // Base buff
                   if(w.name === "脉冲波") { g.pulseWaveKnockback = Math.max(g.pulseWaveKnockback, 80 + 40 * (idx+1)); g.pulseWaveStunChance = Math.max(g.pulseWaveStunChance, 0.2 + 0.05 * idx); g.pulseWaveStunDuration = Math.max(g.pulseWaveStunDuration, 0.5 + 0.2 * idx); }
              }
          });
      });
  });
  
  // 7. 外骨骼装甲 (50个) - 纯防御/辅助倾向
  const suits = [
      {name: "泰坦", desc: "极大提升生命与护甲"},
      {name: "游侠", desc: "提升移速与闪避"},
      {name: "虚空", desc: "受伤瞬移"},
      {name: "医疗", desc: "大幅提升回复"},
      {name: "掠食者", desc: "击杀后获得攻速与暴击加成"},
      {name: "幽灵", desc: "穿透敌人移动"},
      {name: "要塞", desc: "静止时无敌"},
      {name: "狂徒", desc: "血量越低伤害越高"},
      {name: "主宰", desc: "免疫控制与击退"},
      {name: "聚能", desc: "受击积累能量释放冲击波"}
  ];

  suits.forEach(s => {
      levels.forEach((lvl, idx) => {
          skills.push({
              name: `外骨骼：${s.name} ${lvl}`,
              description: `装备${s.name}型装甲，${s.desc} (Model-${idx+1})`,
              tier: idx + 1,
              icon: "shield_tech",
              effect: (g) => {
                   if(s.name==="泰坦") { g.playerMaxHealth *= 1.2; g.damageReduction += 0.05; }
                   if(s.name==="游侠") { g.playerSpeedMulti *= 1.1; g.dodgeChance += 0.05; }
                   if(s.name==="医疗") { g.regenRate += 2; g.combatRegenBoost = true; }
                   if(s.name==="狂徒") { g.lowHpDamageBoost = true; g.lowHpDamageMulti += 0.5; }
                   if(s.name==="掠食者") { g.predatorMode = true; g.predatorAtkSpeedBonus = Math.max(g.predatorAtkSpeedBonus, 0.08 * (idx+1)); g.predatorCritBonus = Math.max(g.predatorCritBonus, 0.04 * (idx+1)); g.predatorDuration = Math.max(g.predatorDuration, 3.0 + 0.5 * idx); }
                   // ... others imply generic buffs
                   g.damageReduction += 0.01 * (idx+1);
              }
          });
      });
  });

  return skills;
}

// 生成额外的飞刀技能
function generateExtraBladeSkills() {
  return [
    // ===== 原有飞刀技能 (11个) =====
    { name:"飞刀精通", description:"飞刀伤害 +30%", tier:2, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitDamage *= 1.30; } },
    { name:"刀阵扩张", description:"飞刀半径 +20", tier:1, icon:"circle.dotted", effect:(s)=>{ s.bladeOrbitRadius += 20; } },
    { name:"刀舞加速", description:"飞刀旋转速度 +25%", tier:1, icon:"timer", effect:(s)=>{ s.bladeOrbitSpeed *= 1.25; } },
    { name:"利刃增殖", description:"飞刀数量 +1", tier:3, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 1; } },
    { name:"锋刃风暴", description:"飞刀数量 +3，旋转速度 +20%", tier:4, icon:"wind", effect:(s)=>{ s.bladeOrbitCount += 3; s.bladeOrbitSpeed *= 1.20; } },
    { name:"巨刃", description:"飞刀体积 +35%，伤害 +15%", tier:2, icon:"circle.fill", effect:(s)=>{ s.bladeOrbitScale *= 1.35; s.bladeOrbitDamage *= 1.15; } },
    { name:"寒刃", description:"飞刀命中 20% 冰冻 0.8秒", tier:3, icon:"snowflake", effect:(s)=>{ s.bladeOrbitFreezeChance = Math.min(1, s.bladeOrbitFreezeChance + 0.20); s.bladeOrbitFreezeDuration = Math.max(s.bladeOrbitFreezeDuration, 0.8); } },
    { name:"灼刃", description:"飞刀命中 30% 点燃 2秒", tier:3, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitBurnChance = Math.min(1, s.bladeOrbitBurnChance + 0.30); s.bladeOrbitBurnDuration = Math.max(s.bladeOrbitBurnDuration, 2.0); s.bladeOrbitBurnDamage = Math.max(s.bladeOrbitBurnDamage, 4); } },
    { name:"毒刃", description:"飞刀命中 30% 中毒 3秒", tier:3, icon:"leaf.fill", effect:(s)=>{ s.bladeOrbitPoisonChance = Math.min(1, s.bladeOrbitPoisonChance + 0.30); s.bladeOrbitPoisonDuration = Math.max(s.bladeOrbitPoisonDuration, 3.0); s.bladeOrbitPoisonDamage = Math.max(s.bladeOrbitPoisonDamage, 3); } },
    { name:"吸血飞刃", description:"飞刀命中 15% 吸血（伤害的 20%）", tier:4, icon:"drop.fill", effect:(s)=>{ s.bladeOrbitLifestealChance = Math.min(1, s.bladeOrbitLifestealChance + 0.15); s.bladeOrbitLifestealPercent = Math.max(s.bladeOrbitLifestealPercent, 0.20); } },

    // ===== 新增100个飞刀技能 =====

    // --- 基础伤害类 (15个) ---
    { name:"磨刃", description:"飞刀伤害 +10%", tier:1, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitDamage *= 1.10; } },
    { name:"淬火飞刃", description:"飞刀伤害 +20%", tier:1, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitDamage *= 1.20; } },
    { name:"精钢飞刀", description:"飞刀伤害 +50%", tier:3, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitDamage *= 1.50; } },
    { name:"陨铁飞刃", description:"飞刀伤害 +80%", tier:4, icon:"star.fill", effect:(s)=>{ s.bladeOrbitDamage *= 1.80; } },
    { name:"神兵飞刀", description:"飞刀伤害 +120%", tier:5, icon:"sparkles", effect:(s)=>{ s.bladeOrbitDamage *= 2.20; } },
    { name:"锋利打磨", description:"飞刀伤害 +15%，体积 +10%", tier:1, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitDamage *= 1.15; s.bladeOrbitScale *= 1.10; } },
    { name:"重刃术", description:"飞刀伤害 +40%，旋转速度 -10%", tier:2, icon:"circle.fill", effect:(s)=>{ s.bladeOrbitDamage *= 1.40; s.bladeOrbitSpeed *= 0.90; } },
    { name:"轻刃术", description:"飞刀旋转速度 +30%，伤害 +10%", tier:2, icon:"timer", effect:(s)=>{ s.bladeOrbitSpeed *= 1.30; s.bladeOrbitDamage *= 1.10; } },
    { name:"刃上淬毒", description:"飞刀伤害 +25%，命中 10% 中毒", tier:2, icon:"leaf.fill", effect:(s)=>{ s.bladeOrbitDamage *= 1.25; s.bladeOrbitPoisonChance = Math.min(1, (s.bladeOrbitPoisonChance||0) + 0.10); s.bladeOrbitPoisonDuration = Math.max(s.bladeOrbitPoisonDuration||0, 2.0); s.bladeOrbitPoisonDamage = Math.max(s.bladeOrbitPoisonDamage||0, 2); } },
    { name:"破甲飞刃", description:"飞刀无视 20% 敌人护甲", tier:3, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitArmorPen = (s.bladeOrbitArmorPen||0) + 0.20; } },
    { name:"穿甲利刃", description:"飞刀无视 40% 敌人护甲", tier:4, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitArmorPen = (s.bladeOrbitArmorPen||0) + 0.40; } },
    { name:"绝甲之刃", description:"飞刀无视 100% 敌人护甲", tier:5, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitArmorPen = 1.0; } },
    { name:"蓄力飞刀", description:"飞刀每旋转一圈伤害 +5%（可叠加）", tier:3, icon:"timer", effect:(s)=>{ s.bladeOrbitChargeBonus = (s.bladeOrbitChargeBonus||0) + 0.05; } },
    { name:"怒刃", description:"生命越低飞刀伤害越高（最高+100%）", tier:4, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitRageDamage = true; } },
    { name:"死亡飞刀", description:"飞刀对低于 20% 生命的敌人造成 3 倍伤害", tier:5, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitExecute = true; s.bladeOrbitExecuteThreshold = 0.20; s.bladeOrbitExecuteMult = 3.0; } },

    // --- 数量与范围类 (35个，含20个新增飞刀数量技能) ---
    { name:"飞刀入门", description:"飞刀数量 +1", tier:1, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 1; } },
    { name:"刀扇展开", description:"飞刀数量 +2", tier:2, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 2; } },
    { name:"刀雨", description:"飞刀数量 +4", tier:4, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 4; } },
    { name:"万刃齐发", description:"飞刀数量 +8", tier:5, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 8; } },

    // --- 新增20个飞刀数量技能 ---
    { name:"学徒飞刀", description:"飞刀数量 +1", tier:1, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 1; } },
    { name:"双刃齐飞", description:"飞刀数量 +2", tier:1, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 2; } },
    { name:"三刃旋风", description:"飞刀数量 +3", tier:2, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 3; } },
    { name:"四象飞刀", description:"飞刀数量 +4", tier:2, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 4; } },
    { name:"五行飞刃", description:"飞刀数量 +5", tier:3, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 5; } },
    { name:"六合刀阵", description:"飞刀数量 +6", tier:3, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 6; } },
    { name:"七星飞刀", description:"飞刀数量 +7", tier:3, icon:"star.fill", effect:(s)=>{ s.bladeOrbitCount += 7; } },
    { name:"八方刀雨", description:"飞刀数量 +8，伤害 +10%", tier:4, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 8; s.bladeOrbitDamage *= 1.10; } },
    { name:"九天飞刃", description:"飞刀数量 +9", tier:4, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 9; } },
    { name:"十面埋伏", description:"飞刀数量 +10", tier:4, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 10; } },
    { name:"十二连环刀", description:"飞刀数量 +12", tier:4, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 12; } },
    { name:"十五刃风暴", description:"飞刀数量 +15，旋转速度 +15%", tier:4, icon:"wind", effect:(s)=>{ s.bladeOrbitCount += 15; s.bladeOrbitSpeed *= 1.15; } },
    { name:"二十刃旋涡", description:"飞刀数量 +20", tier:5, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 20; } },
    { name:"三十刃天幕", description:"飞刀数量 +30，体积 -20%", tier:5, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 30; s.bladeOrbitScale *= 0.80; } },
    { name:"五十刃天罗", description:"飞刀数量 +50，体积 -40%，伤害 +30%", tier:5, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 50; s.bladeOrbitScale *= 0.60; s.bladeOrbitDamage *= 1.30; } },
    { name:"百刃齐舞", description:"飞刀数量 +100，体积 -60%", tier:5, icon:"sparkles", effect:(s)=>{ s.bladeOrbitCount += 100; s.bladeOrbitScale *= 0.40; } },
    { name:"刀阵倍增", description:"飞刀数量翻倍（当前×2）", tier:4, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount *= 2; } },
    { name:"刀阵三倍化", description:"飞刀数量三倍化（当前×3）", tier:5, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount *= 3; } },
    { name:"密集飞刃", description:"飞刀数量 +6，半径 -15", tier:2, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 6; s.bladeOrbitRadius = Math.max(30, s.bladeOrbitRadius - 15); } },
    { name:"扩散飞刃", description:"飞刀数量 +4，半径 +30", tier:3, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitCount += 4; s.bladeOrbitRadius += 30; } },
    { name:"小刀阵", description:"飞刀半径 +10", tier:1, icon:"circle.dotted", effect:(s)=>{ s.bladeOrbitRadius += 10; } },
    { name:"中刀阵", description:"飞刀半径 +30", tier:2, icon:"circle.dotted", effect:(s)=>{ s.bladeOrbitRadius += 30; } },
    { name:"大刀阵", description:"飞刀半径 +50", tier:3, icon:"circle.dotted", effect:(s)=>{ s.bladeOrbitRadius += 50; } },
    { name:"巨型刀阵", description:"飞刀半径 +80，伤害 +20%", tier:4, icon:"circle.dotted", effect:(s)=>{ s.bladeOrbitRadius += 80; s.bladeOrbitDamage *= 1.20; } },
    { name:"天旋地转", description:"飞刀旋转速度 +50%", tier:2, icon:"timer", effect:(s)=>{ s.bladeOrbitSpeed *= 1.50; } },
    { name:"极速旋刃", description:"飞刀旋转速度 +100%", tier:3, icon:"timer", effect:(s)=>{ s.bladeOrbitSpeed *= 2.0; } },
    { name:"光速刀环", description:"飞刀旋转速度 +200%，伤害 +30%", tier:5, icon:"timer", effect:(s)=>{ s.bladeOrbitSpeed *= 3.0; s.bladeOrbitDamage *= 1.30; } },
    { name:"微型飞刃", description:"飞刀体积 -30%，数量 +3", tier:2, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitScale *= 0.70; s.bladeOrbitCount += 3; } },
    { name:"巨刃II", description:"飞刀体积 +60%，伤害 +25%", tier:3, icon:"circle.fill", effect:(s)=>{ s.bladeOrbitScale *= 1.60; s.bladeOrbitDamage *= 1.25; } },
    { name:"泰坦飞刃", description:"飞刀体积 +100%，伤害 +50%，速度 -20%", tier:4, icon:"circle.fill", effect:(s)=>{ s.bladeOrbitScale *= 2.0; s.bladeOrbitDamage *= 1.50; s.bladeOrbitSpeed *= 0.80; } },
    { name:"双层刀阵", description:"增加第二层飞刀轨道，数量 +2，半径 +40", tier:4, icon:"circle.dotted", effect:(s)=>{ s.bladeOrbitCount += 2; s.bladeOrbitRadius += 40; s.bladeOrbitDualRing = true; } },

    // --- 冰霜效果类 (10个) ---
    { name:"冰晶飞刃", description:"飞刀命中 10% 冰冻 0.5秒", tier:1, icon:"snowflake", effect:(s)=>{ s.bladeOrbitFreezeChance = Math.min(1, (s.bladeOrbitFreezeChance||0) + 0.10); s.bladeOrbitFreezeDuration = Math.max(s.bladeOrbitFreezeDuration||0, 0.5); } },
    { name:"极寒之刃", description:"飞刀冰冻几率 +15%，冰冻时间 +0.5秒", tier:2, icon:"snowflake", effect:(s)=>{ s.bladeOrbitFreezeChance = Math.min(1, (s.bladeOrbitFreezeChance||0) + 0.15); s.bladeOrbitFreezeDuration = (s.bladeOrbitFreezeDuration||0) + 0.5; } },
    { name:"冰封刀舞", description:"飞刀冰冻几率 +25%，冰冻持续 1.5秒", tier:3, icon:"snowflake", effect:(s)=>{ s.bladeOrbitFreezeChance = Math.min(1, (s.bladeOrbitFreezeChance||0) + 0.25); s.bladeOrbitFreezeDuration = Math.max(s.bladeOrbitFreezeDuration||0, 1.5); } },
    { name:"绝对零度", description:"飞刀必定冰冻敌人 2秒", tier:5, icon:"snowflake", effect:(s)=>{ s.bladeOrbitFreezeChance = 1.0; s.bladeOrbitFreezeDuration = Math.max(s.bladeOrbitFreezeDuration||0, 2.0); } },
    { name:"霜刃减速", description:"飞刀命中减速敌人 30%，持续 2秒", tier:2, icon:"snowflake", effect:(s)=>{ s.bladeOrbitSlowChance = Math.min(1, (s.bladeOrbitSlowChance||0) + 0.50); s.bladeOrbitSlowAmount = 0.30; s.bladeOrbitSlowDuration = 2.0; } },
    { name:"破甲飞旋", description:"飞刀命中使敌人护甲降低25%，持续3秒", tier:3, icon:"snowflake", effect:(s)=>{ s.bladeOrbitArmorShred = true; s.bladeOrbitArmorShredAmount = (s.bladeOrbitArmorShredAmount||0) + 0.25; s.bladeOrbitArmorShredDuration = 3.0; } },
    { name:"寒气弥漫", description:"飞刀半径 +25，命中散发寒气减速周围敌人", tier:3, icon:"snowflake", effect:(s)=>{ s.bladeOrbitRadius += 25; s.bladeOrbitFrostAura = true; } },
    { name:"冰刃连锁", description:"飞刀冰冻敌人时，冰冻效果扩散到附近敌人", tier:4, icon:"snowflake", effect:(s)=>{ s.bladeOrbitFreezeSpread = true; } },
    { name:"冰晶爆裂", description:"冰冻的敌人被再次命中时爆炸，造成范围伤害", tier:4, icon:"snowflake", effect:(s)=>{ s.bladeOrbitIceExplosion = true; } },
    { name:"永冻飞刃", description:"飞刀冰冻永久减速 10%（可叠加）", tier:5, icon:"snowflake", effect:(s)=>{ s.bladeOrbitPermaFrost = true; s.bladeOrbitPermaFrostSlow = 0.10; } },

    // --- 火焰效果类 (10个) ---
    { name:"火星飞溅", description:"飞刀命中 15% 点燃 1秒", tier:1, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitBurnChance = Math.min(1, (s.bladeOrbitBurnChance||0) + 0.15); s.bladeOrbitBurnDuration = Math.max(s.bladeOrbitBurnDuration||0, 1.0); s.bladeOrbitBurnDamage = Math.max(s.bladeOrbitBurnDamage||0, 2); } },
    { name:"烈焰飞刀", description:"飞刀点燃几率 +20%，燃烧伤害 +3", tier:2, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitBurnChance = Math.min(1, (s.bladeOrbitBurnChance||0) + 0.20); s.bladeOrbitBurnDamage = (s.bladeOrbitBurnDamage||0) + 3; } },
    { name:"焚天刃舞", description:"飞刀必定点燃，燃烧持续 3秒", tier:4, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitBurnChance = 1.0; s.bladeOrbitBurnDuration = Math.max(s.bladeOrbitBurnDuration||0, 3.0); s.bladeOrbitBurnDamage = Math.max(s.bladeOrbitBurnDamage||0, 6); } },
    { name:"火焰爆发", description:"燃烧的敌人受到飞刀额外 60% 伤害", tier:3, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitBurnBonusDamage = (s.bladeOrbitBurnBonusDamage||1) * 1.60; } },
    { name:"引爆", description:"飞刀命中燃烧的敌人时引发爆炸", tier:4, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitBurnExplosion = true; } },
    { name:"灰烬之刃", description:"飞刀点燃伤害 +8，持续时间 +1秒", tier:3, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitBurnDamage = (s.bladeOrbitBurnDamage||0) + 8; s.bladeOrbitBurnDuration = (s.bladeOrbitBurnDuration||0) + 1.0; } },
    { name:"火环", description:"飞刀轨道留下火焰痕迹，灼烧经过的敌人", tier:3, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitFireTrail = true; } },
    { name:"熔岩飞刃", description:"飞刀伤害 +40%，命中留下熔岩地面", tier:4, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitDamage *= 1.40; s.bladeOrbitLavaPool = true; } },
    { name:"凤凰之翼", description:"飞刀旋转产生火焰翅膀，伤害 +60%", tier:5, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitDamage *= 1.60; s.bladeOrbitPhoenixWings = true; } },
    { name:"业火飞刃", description:"飞刀燃烧无法被扑灭，伤害随时间增加", tier:5, icon:"flame.fill", effect:(s)=>{ s.bladeOrbitEternalFlame = true; s.bladeOrbitBurnDamage = (s.bladeOrbitBurnDamage||0) + 12; } },

    // --- 毒素效果类 (8个) ---
    { name:"涂毒术", description:"飞刀命中 15% 中毒 2秒", tier:1, icon:"leaf.fill", effect:(s)=>{ s.bladeOrbitPoisonChance = Math.min(1, (s.bladeOrbitPoisonChance||0) + 0.15); s.bladeOrbitPoisonDuration = Math.max(s.bladeOrbitPoisonDuration||0, 2.0); s.bladeOrbitPoisonDamage = Math.max(s.bladeOrbitPoisonDamage||0, 2); } },
    { name:"剧毒飞刃", description:"飞刀中毒几率 +25%，毒伤 +4", tier:2, icon:"leaf.fill", effect:(s)=>{ s.bladeOrbitPoisonChance = Math.min(1, (s.bladeOrbitPoisonChance||0) + 0.25); s.bladeOrbitPoisonDamage = (s.bladeOrbitPoisonDamage||0) + 4; } },
    { name:"瘟疫之刃", description:"飞刀必定中毒，中毒蔓延到附近敌人", tier:4, icon:"leaf.fill", effect:(s)=>{ s.bladeOrbitPoisonChance = 1.0; s.bladeOrbitPoisonSpread = true; } },
    { name:"毒雾弥漫", description:"飞刀轨道散发毒雾，持续伤害周围敌人", tier:3, icon:"leaf.fill", effect:(s)=>{ s.bladeOrbitPoisonAura = true; } },
    { name:"致命毒素", description:"中毒的敌人受到所有伤害 +30%", tier:3, icon:"leaf.fill", effect:(s)=>{ s.bladeOrbitPoisonWeaken = 0.30; } },
    { name:"腐蚀之刃", description:"中毒伤害 +10，持续时间 +2秒", tier:3, icon:"leaf.fill", effect:(s)=>{ s.bladeOrbitPoisonDamage = (s.bladeOrbitPoisonDamage||0) + 10; s.bladeOrbitPoisonDuration = (s.bladeOrbitPoisonDuration||0) + 2.0; } },
    { name:"神经毒素", description:"中毒的敌人移动速度 -50%", tier:4, icon:"leaf.fill", effect:(s)=>{ s.bladeOrbitPoisonSlow = 0.50; } },
    { name:"致死毒刃", description:"中毒层数达到5时直接杀死非Boss敌人", tier:5, icon:"leaf.fill", effect:(s)=>{ s.bladeOrbitPoisonInstakill = true; s.bladeOrbitPoisonInstakillStacks = 5; } },

    // --- 雷电效果类 (8个) ---
    { name:"雷刃", description:"飞刀命中 15% 释放闪电，伤害 +20%", tier:1, icon:"bolt.fill", effect:(s)=>{ s.bladeOrbitShockChance = (s.bladeOrbitShockChance||0) + 0.15; s.bladeOrbitDamage *= 1.20; } },
    { name:"电弧飞刀", description:"飞刀命中弹射闪电到附近1个敌人", tier:2, icon:"bolt.fill", effect:(s)=>{ s.bladeOrbitChainCount = (s.bladeOrbitChainCount||0) + 1; } },
    { name:"连锁闪电刃", description:"飞刀闪电弹射 +2 个目标", tier:3, icon:"bolt.fill", effect:(s)=>{ s.bladeOrbitChainCount = (s.bladeOrbitChainCount||0) + 2; } },
    { name:"雷暴飞刀", description:"飞刀命中 30% 眩晕敌人 0.5秒", tier:2, icon:"bolt.fill", effect:(s)=>{ s.bladeOrbitStunChance = Math.min(1, (s.bladeOrbitStunChance||0) + 0.30); s.bladeOrbitStunDuration = Math.max(s.bladeOrbitStunDuration||0, 0.5); } },
    { name:"麻痹飞刃", description:"飞刀眩晕几率 +20%，眩晕时间 +0.3秒", tier:3, icon:"bolt.fill", effect:(s)=>{ s.bladeOrbitStunChance = Math.min(1, (s.bladeOrbitStunChance||0) + 0.20); s.bladeOrbitStunDuration = (s.bladeOrbitStunDuration||0) + 0.3; } },
    { name:"雷霆万钧", description:"飞刀必定触发闪电，弹射 5 个目标", tier:5, icon:"bolt.fill", effect:(s)=>{ s.bladeOrbitShockChance = 1.0; s.bladeOrbitChainCount = Math.max(s.bladeOrbitChainCount||0, 5); } },
    { name:"磁暴飞刃", description:"飞刀产生磁场吸引附近敌人", tier:3, icon:"bolt.fill", effect:(s)=>{ s.bladeOrbitMagneticPull = true; s.bladeOrbitMagneticRange = 80; } },
    { name:"雷神之怒", description:"每击杀一个敌人释放一道雷电", tier:4, icon:"bolt.fill", effect:(s)=>{ s.bladeOrbitKillLightning = true; } },

    // --- 吸血与治疗类 (8个) ---
    { name:"嗜血之刃", description:"飞刀命中 10% 吸血（伤害的 10%）", tier:2, icon:"drop.fill", effect:(s)=>{ s.bladeOrbitLifestealChance = Math.min(1, (s.bladeOrbitLifestealChance||0) + 0.10); s.bladeOrbitLifestealPercent = Math.max(s.bladeOrbitLifestealPercent||0, 0.10); } },
    { name:"血刃强化", description:"飞刀吸血几率 +15%，吸血比例 +10%", tier:3, icon:"drop.fill", effect:(s)=>{ s.bladeOrbitLifestealChance = Math.min(1, (s.bladeOrbitLifestealChance||0) + 0.15); s.bladeOrbitLifestealPercent = (s.bladeOrbitLifestealPercent||0) + 0.10; } },
    { name:"血族飞刃", description:"飞刀必定吸血（伤害的 30%）", tier:5, icon:"drop.fill", effect:(s)=>{ s.bladeOrbitLifestealChance = 1.0; s.bladeOrbitLifestealPercent = Math.max(s.bladeOrbitLifestealPercent||0, 0.30); } },
    { name:"生命飞刀", description:"每把飞刀每秒回复 0.5 生命", tier:2, icon:"heart.fill", effect:(s)=>{ s.bladeOrbitRegenPerBlade = (s.bladeOrbitRegenPerBlade||0) + 0.5; } },
    { name:"回春之刃", description:"每把飞刀每秒回复 1 生命", tier:3, icon:"heart.fill", effect:(s)=>{ s.bladeOrbitRegenPerBlade = (s.bladeOrbitRegenPerBlade||0) + 1.0; } },
    { name:"生命虹吸", description:"飞刀吸血比例 +15%", tier:3, icon:"drop.fill", effect:(s)=>{ s.bladeOrbitLifestealPercent = (s.bladeOrbitLifestealPercent||0) + 0.15; } },
    { name:"血祭飞刃", description:"消耗 5% 当前生命，飞刀伤害 +100%", tier:4, icon:"drop.fill", effect:(s)=>{ s.bladeOrbitBloodSacrifice = true; s.bladeOrbitDamage *= 2.0; } },
    { name:"不死之刃", description:"飞刀吸血量超出上限时转化为临时护盾", tier:5, icon:"heart.fill", effect:(s)=>{ s.bladeOrbitOverhealShield = true; } },

    // --- 暴击与穿透类 (10个) ---
    { name:"精准飞刀", description:"飞刀暴击率 +10%", tier:1, icon:"scope", effect:(s)=>{ s.bladeOrbitCritChance = (s.bladeOrbitCritChance||0) + 0.10; } },
    { name:"致命飞刃", description:"飞刀暴击率 +15%，暴击伤害 +30%", tier:2, icon:"scope", effect:(s)=>{ s.bladeOrbitCritChance = (s.bladeOrbitCritChance||0) + 0.15; s.bladeOrbitCritDamage = (s.bladeOrbitCritDamage||1.5) + 0.30; } },
    { name:"要害打击", description:"飞刀暴击伤害 +80%", tier:3, icon:"scope", effect:(s)=>{ s.bladeOrbitCritDamage = (s.bladeOrbitCritDamage||1.5) + 0.80; } },
    { name:"百步穿杨", description:"飞刀暴击率 +25%，暴击伤害 +50%", tier:4, icon:"scope", effect:(s)=>{ s.bladeOrbitCritChance = (s.bladeOrbitCritChance||0) + 0.25; s.bladeOrbitCritDamage = (s.bladeOrbitCritDamage||1.5) + 0.50; } },
    { name:"必杀飞刀", description:"飞刀暴击率 +50%，暴击伤害 ×2", tier:5, icon:"scope", effect:(s)=>{ s.bladeOrbitCritChance = (s.bladeOrbitCritChance||0) + 0.50; s.bladeOrbitCritDamage = (s.bladeOrbitCritDamage||1.5) * 2; } },
    { name:"穿刺飞刃", description:"飞刀穿透1个额外敌人", tier:2, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitPierce = (s.bladeOrbitPierce||0) + 1; } },
    { name:"贯穿飞刀", description:"飞刀穿透3个额外敌人", tier:3, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitPierce = (s.bladeOrbitPierce||0) + 3; } },
    { name:"无尽穿透", description:"飞刀穿透无限敌人", tier:5, icon:"fan.fill", effect:(s)=>{ s.bladeOrbitPierce = 9999; } },
    { name:"弹射飞刀", description:"飞刀命中后弹射到附近 1 个敌人", tier:2, icon:"arrow.triangle.branch", effect:(s)=>{ s.bladeOrbitBounce = (s.bladeOrbitBounce||0) + 1; } },
    { name:"多重弹射", description:"飞刀弹射 +2 个目标", tier:3, icon:"arrow.triangle.branch", effect:(s)=>{ s.bladeOrbitBounce = (s.bladeOrbitBounce||0) + 2; } },

    // --- 特殊机制类 (12个) ---
    { name:"追踪飞刃", description:"飞刀自动追踪最近的敌人", tier:3, icon:"location.fill", effect:(s)=>{ s.bladeOrbitHoming = true; s.bladeOrbitHomingRange = 120; } },
    { name:"制导飞刀", description:"飞刀追踪范围 +60，追踪更加精准", tier:4, icon:"location.fill", effect:(s)=>{ s.bladeOrbitHoming = true; s.bladeOrbitHomingRange = (s.bladeOrbitHomingRange||120) + 60; s.bladeOrbitHomingAccuracy = (s.bladeOrbitHomingAccuracy||0.5) + 0.3; } },
    { name:"刀刃反射", description:"飞刀反弹敌人子弹", tier:3, icon:"arrow.uturn.left", effect:(s)=>{ s.bladeOrbitReflect = true; } },
    { name:"全方位防御", description:"飞刀反弹几率 100%，反弹伤害 +100%", tier:5, icon:"arrow.uturn.left", effect:(s)=>{ s.bladeOrbitReflect = true; s.bladeOrbitReflectDamage = (s.bladeOrbitReflectDamage||1) * 2; } },
    { name:"爆裂飞刃", description:"飞刀命中产生小范围爆炸", tier:3, icon:"burst.fill", effect:(s)=>{ s.bladeOrbitExplosion = true; s.bladeOrbitExplosionRadius = 30; } },
    { name:"核爆飞刀", description:"飞刀爆炸范围 +40，伤害 +50%", tier:4, icon:"burst.fill", effect:(s)=>{ s.bladeOrbitExplosion = true; s.bladeOrbitExplosionRadius = (s.bladeOrbitExplosionRadius||30) + 40; s.bladeOrbitDamage *= 1.50; } },
    { name:"分裂飞刀", description:"飞刀命中后分裂成 2 把小飞刀", tier:3, icon:"arrow.branch", effect:(s)=>{ s.bladeOrbitSplit = (s.bladeOrbitSplit||0) + 2; } },
    { name:"连锁分裂", description:"分裂的飞刀也可以分裂", tier:5, icon:"arrow.branch", effect:(s)=>{ s.bladeOrbitSplitChain = true; s.bladeOrbitSplit = Math.max(s.bladeOrbitSplit||0, 2); } },
    { name:"回旋飞刀", description:"飞刀飞出后返回，造成两次伤害", tier:2, icon:"arrow.uturn.backward", effect:(s)=>{ s.bladeOrbitBoomerang = true; } },
    { name:"影刃", description:"每把飞刀生成一把幻影飞刀（50%伤害）", tier:4, icon:"moon.fill", effect:(s)=>{ s.bladeOrbitShadowBlade = true; s.bladeOrbitShadowDamageMult = 0.50; } },
    { name:"共振飞刃", description:"飞刀之间产生能量链，伤害链上的敌人", tier:4, icon:"waveform", effect:(s)=>{ s.bladeOrbitResonance = true; } },
    { name:"时停飞刀", description:"飞刀暴击时冻结时间 0.3秒", tier:5, icon:"clock.fill", effect:(s)=>{ s.bladeOrbitTimeStop = true; s.bladeOrbitTimeStopDuration = 0.3; } },

    // --- 防御与护盾类 (6个) ---
    { name:"刀盾", description:"飞刀提供 5% 伤害减免（每把）", tier:2, icon:"shield.fill", effect:(s)=>{ s.bladeOrbitDamageReduction = (s.bladeOrbitDamageReduction||0) + 0.05; } },
    { name:"铁壁刀阵", description:"飞刀提供 10% 伤害减免（每把）", tier:3, icon:"shield.fill", effect:(s)=>{ s.bladeOrbitDamageReduction = (s.bladeOrbitDamageReduction||0) + 0.10; } },
    // 刃之守护已被举报删除，替换为刀阵漩涡
    { name:"刀阵漩涡", description:"飞刀高速旋转形成漩涡，持续吸引半径内敌人靠近", tier:4, icon:"tornado", effect:(s)=>{ s.bladeOrbitVortex = true; s.bladeOrbitVortexRange = 120; s.bladeOrbitVortexStrength = 60; } },
    { name:"反击飞刃", description:"受到伤害时所有飞刀伤害 +20%（持续3秒）", tier:2, icon:"shield.fill", effect:(s)=>{ s.bladeOrbitCounterAttack = true; s.bladeOrbitCounterBonus = 0.20; } },
    { name:"荆棘飞刀", description:"敌人被飞刀命中后，攻击该敌人回复1生命", tier:3, icon:"leaf.fill", effect:(s)=>{ s.bladeOrbitThornHeal = true; } },
    { name:"绝对防御", description:"飞刀数量>10时，免疫所有控制效果", tier:5, icon:"shield.fill", effect:(s)=>{ s.bladeOrbitCCImmune = true; s.bladeOrbitCCImmuneThreshold = 10; } },

    // --- 终极与组合类 (8个) ---
    { name:"刀神降临", description:"飞刀数量 +5，伤害 +50%，旋转速度 +50%", tier:5, icon:"sparkles", effect:(s)=>{ s.bladeOrbitCount += 5; s.bladeOrbitDamage *= 1.50; s.bladeOrbitSpeed *= 1.50; } },
    { name:"无限刀阵", description:"飞刀数量翻倍", tier:5, icon:"infinity", effect:(s)=>{ s.bladeOrbitCount *= 2; } },
    { name:"万象归一", description:"飞刀获得 冰冻10%+点燃10%+中毒10%+眩晕10%", tier:4, icon:"sparkles", effect:(s)=>{ s.bladeOrbitFreezeChance = Math.min(1, (s.bladeOrbitFreezeChance||0) + 0.10); s.bladeOrbitFreezeDuration = Math.max(s.bladeOrbitFreezeDuration||0, 0.5); s.bladeOrbitBurnChance = Math.min(1, (s.bladeOrbitBurnChance||0) + 0.10); s.bladeOrbitBurnDuration = Math.max(s.bladeOrbitBurnDuration||0, 1.0); s.bladeOrbitBurnDamage = Math.max(s.bladeOrbitBurnDamage||0, 2); s.bladeOrbitPoisonChance = Math.min(1, (s.bladeOrbitPoisonChance||0) + 0.10); s.bladeOrbitPoisonDuration = Math.max(s.bladeOrbitPoisonDuration||0, 1.5); s.bladeOrbitPoisonDamage = Math.max(s.bladeOrbitPoisonDamage||0, 2); s.bladeOrbitStunChance = Math.min(1, (s.bladeOrbitStunChance||0) + 0.10); s.bladeOrbitStunDuration = Math.max(s.bladeOrbitStunDuration||0, 0.3); } },
    { name:"飞刀大师", description:"所有飞刀效果提升 50%", tier:5, icon:"crown.fill", effect:(s)=>{ s.bladeOrbitDamage *= 1.50; s.bladeOrbitScale *= 1.20; s.bladeOrbitSpeed *= 1.20; s.bladeOrbitRadius += 20; } },
    { name:"天降飞刀", description:"每 3 秒从天空降下飞刀攻击随机敌人", tier:3, icon:"arrow.down", effect:(s)=>{ s.bladeOrbitSkyfall = true; s.bladeOrbitSkyfallInterval = 3.0; } },
    { name:"刀阵自爆", description:"按住技能键飞刀全部射出造成巨额伤害，之后重新生成", tier:4, icon:"burst.fill", effect:(s)=>{ s.bladeOrbitBurst = true; } },
    { name:"轮回飞刃", description:"飞刀击杀敌人时有 20% 几率额外获得经验", tier:2, icon:"arrow.clockwise", effect:(s)=>{ s.bladeOrbitExpBonus = 0.20; } },
    { name:"永恒刀阵", description:"飞刀数量 +10，伤害 +100%，半径 +50，全属性强化", tier:5, icon:"crown.fill", effect:(s)=>{ s.bladeOrbitCount += 10; s.bladeOrbitDamage *= 2.0; s.bladeOrbitRadius += 50; s.bladeOrbitSpeed *= 1.30; s.bladeOrbitScale *= 1.30; } },
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
