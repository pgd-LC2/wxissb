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
    "arrow_loop": "🔄"
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
  skills.push({ name:"磁铁体质", description:"拾取范围 +40%", tier:1, icon:"magnet", effect:(s)=>{ s.pickupRange *= 1.4; }});
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
  
  // REMOVED: 时间扭曲 (Time Warp)

  // ------------------------------
  // 特殊机制类 (原有)
  // ------------------------------
  const TAU = window.GameUtils.TAU;
  skills.push({ name:"加特林模式", description:"射速 x2，单发伤害 -40%", tier:4, icon:"gearshape.fill", effect:(s)=>{ s.shootInterval *= 0.5; s.bulletDamage *= 0.6; }});
  skills.push({ name:"狙击模式", description:"射速 -50%，伤害 x2，射程无限", tier:4, icon:"scope", effect:(s)=>{ s.shootInterval *= 2; s.bulletDamage *= 2; s.bulletLifetime = 10.0; }});
  skills.push({ name:"霰弹模式", description:"+5 子弹，大散布，短射程", tier:4, icon:"list.bullet", effect:(s)=>{ s.bulletCount += 5; s.spreadAngle = 0.8; s.bulletLifetime *= 0.5; }});
  skills.push({ name:"蓄力攻击", description:"站立不动时积攒能量，下次攻击伤害提升", tier:3, icon:"bolt.fill", effect:(s)=>{ s.chargeAttackEnabled = true; }});
  skills.push({ name:"超级蓄力", description:"蓄力速度 +100%，最大加成提升", tier:4, icon:"bolt.batteryblock.fill", effect:(s)=>{ s.chargeSpeed *= 2; s.chargeMaxBonus *= 1.5; }});
  skills.push({ name:"弹幕", description:"同时向所有方向射击", tier:5, icon:"circle.and.line.horizontal.fill", effect:(s)=>{ s.bulletCount += 8; s.spreadAngle = TAU / s.bulletCount; s.allDirectionFire = true; }});
  skills.push({ name:"后座力", description:"射击时向后推动自己，增加灵活性", tier:2, icon:"arrow.backward.to.line", effect:(s)=>{ s.recoilPush = true; }});
  skills.push({ name:"压制射击", description:"射击方向的敌人移动速度降低", tier:2, icon:"arrow.down.to.line.compact", effect:(s)=>{ s.suppressionEnabled = true; }});
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
  // Operation Tech Arsenal (新增 100 科技技能)
  // ------------------------------
  const techSkills = generateSciFiSkills();
  for (const sk of techSkills) skills.push(sk);

  return skills;
}

// ------------------------------
// 科技军械库：五大科技体系
// ------------------------------
function generateSciFiSkills() {
    const s = [];

    // 1. 赛博义体 (Cybernetics) - 基础属性增强
    s.push({name:"皮下装甲 Mk.I", description:"受到的伤害减少 5%", tier:1, icon:"cpu", effect:(p)=>{ p.damageReduction += 0.05; }});
    s.push({name:"皮下装甲 Mk.II", description:"受到的伤害减少 10%", tier:2, icon:"cpu", effect:(p)=>{ p.damageReduction += 0.10; }});
    s.push({name:"神经加速器", description:"移动速度 +10%，闪避 +5%", tier:2, icon:"network", effect:(p)=>{ p.playerSpeedMulti *= 1.1; p.dodgeChance += 0.05; }});
    s.push({name:"合成心脏", description:"最大生命 +50，每秒回复 +1", tier:3, icon:"heart.fill", effect:(p)=>{ p.playerMaxHealth += 50; p.playerHealth += 50; p.regenRate += 1; p.updateHealthUI(); }});
    s.push({name:"仿生眼球", description:"暴击率 +10%，视野范围 +20%", tier:2, icon:"eye", effect:(p)=>{ p.critRate += 0.1; p.pickupRange *= 1.2; }});
    s.push({name:"钛合金骨骼", description:"最大生命 +20%", tier:2, icon:"arm", effect:(p)=>{ p.playerMaxHealth *= 1.2; p.playerHealth *= 1.2; p.updateHealthUI(); }});
    s.push({name:"突触增强", description:"射速 +15%", tier:1, icon:"network", effect:(p)=>{ p.shootInterval *= 0.87; }});
    s.push({name:"高分子肌肉", description:"子弹伤害 +15%，击退 +20%", tier:1, icon:"arm", effect:(p)=>{ p.bulletDamage *= 1.15; p.knockbackForce += 2; }});
    s.push({name:"纳米修复群", description:"每秒回复 1.5 生命", tier:3, icon:"lab", effect:(p)=>{ p.regenRate += 1.5; }});
    s.push({name:"外骨骼支架", description:"移动速度 -10%，护甲 +20%", tier:2, icon:"robot", effect:(p)=>{ p.playerSpeedMulti *= 0.9; p.damageReduction += 0.2; }});
    s.push({name:"脑机接口", description:"经验获取 +25%", tier:2, icon:"chip", effect:(p)=>{ p.expMultiplier *= 1.25; }});
    s.push({name:"痛觉阻断", description:"受到伤害后无敌时间 +1秒", tier:3, icon:"shield_tech", effect:(p)=>{ p.iFrameDuration += 1.0; }});
    s.push({name:"视觉辅助", description:"子弹散布减少 50%", tier:2, icon:"scope", effect:(p)=>{ p.spreadAngle *= 0.5; }});
    s.push({name:"辅助供能", description:"射速 +10%", tier:1, icon:"battery", effect:(p)=>{ p.shootInterval *= 0.9; }});
    s.push({name:"磁性植入体", description:"拾取范围 +100%", tier:2, icon:"magnet_tech", effect:(p)=>{ p.pickupRange *= 2.0; }});
    s.push({name:"应急血库", description:"解锁不死鸟复活（死亡时回复30%）", tier:4, icon:"syringe", effect:(p)=>{ p.phoenixRevive = true; p.phoenixChance = 0.5; }});
    s.push({name:"钢铁之躯", description:"单次受击上限锁为 15% 最大生命", tier:5, icon:"shield.fill", effect:(p)=>{ p.damageCap = 0.15; }});
    s.push({name:"记忆体扩容", description:"经验获取 +10%", tier:1, icon:"chip", effect:(p)=>{ p.expMultiplier *= 1.1; }});
    s.push({name:"光学迷彩", description:"闪避几率 +10%", tier:2, icon:"ghost", effect:(p)=>{ p.dodgeChance += 0.1; }});
    s.push({name:"动能回收", description:"受到伤害时回复 5 生命(需击杀触发)", tier:3, icon:"recycle", effect:(p)=>{ p.killHealAmount += 5; }});

    // 2. 能量武器 (Energy Weapons) - 子弹特性
    s.push({name:"高能激光", description:"子弹穿透 +2，伤害 +10%", tier:3, icon:"laser", effect:(p)=>{ p.pierceCount += 2; p.bulletDamage *= 1.1; }});
    s.push({name:"聚变弹头", description:"子弹伤害 +40%，范围伤害", tier:4, icon:"atom", effect:(p)=>{ p.bulletDamage *= 1.4; p.areaDamageRadius = Math.max(p.areaDamageRadius || 0, 40); }});
    s.push({name:"离子中继器", description:"子弹在敌人间弹射 3 次", tier:4, icon:"network", effect:(p)=>{ p.chainLightning = true; p.chainCount = (p.chainCount||0) + 3; }});
    s.push({name:"等离子火炮", description:"极慢射速，极大伤害和范围", tier:4, icon:"explosion", effect:(p)=>{ p.shootInterval *= 1.5; p.bulletDamage *= 3.0; p.bulletScale *= 2.0; p.areaDamageRadius = 80; }});
    s.push({name:"光子聚焦", description:"子弹体积变小，但伤害 +50%", tier:3, icon:"target", effect:(p)=>{ p.bulletScale *= 0.5; p.bulletDamage *= 1.5; }});
    s.push({name:"特斯拉线圈", description:"周围周期性释放电击", tier:3, icon:"bolt.horizontal.fill", effect:(p)=>{ p.lightningAuraEnabled = true; p.lightningAuraDamage = (p.lightningAuraDamage||10) * 1.5; }});
    s.push({name:"粒子加速", description:"子弹速度 +50%", tier:1, icon:"arrow.up.right", effect:(p)=>{ p.bulletSpeedMulti *= 1.5; }});
    s.push({name:"反物质弹", description:"子弹击中后消除敌人并产生黑洞", tier:5, icon:"circle.hexagongrid.fill", effect:(p)=>{ p.blackHoleOnDeath = true; p.blackHolePower *= 1.5; }});
    s.push({name:"太阳耀斑", description:"燃烧伤害范围扩大", tier:3, icon:"sun.max.fill", effect:(p)=>{ p.burnSpread = true; p.burnDamage *= 1.5; }});
    s.push({name:"极寒光束", description:"子弹必定冰冻敌人 0.5秒", tier:4, icon:"snowflake", effect:(p)=>{ p.freezeChance = 1.0; p.freezeDuration = 0.5; }});
    s.push({name:"重力井", description:"子弹击中生成微型黑洞", tier:4, icon:"magnet_tech", effect:(p)=>{ p.blackHoleOnDeath = true; }});
    s.push({name:"分裂光束", description:"分裂数量 +3", tier:4, icon:"arrow.triangle.branch", effect:(p)=>{ p.splitOnHit = true; p.splitCount += 3; }});
    s.push({name:"幽灵协议", description:"子弹无限穿透，伤害 -20%", tier:5, icon:"ghost", effect:(p)=>{ p.pierceCount = 999; p.bulletDamage *= 0.8; }});
    s.push({name:"过载电容", description:"子弹伤害 +20%", tier:2, icon:"battery", effect:(p)=>{ p.bulletDamage *= 1.2; }});
    s.push({name:"频率干扰", description:"子弹附带 15% 眩晕(冰冻代替)", tier:3, icon:"wave", effect:(p)=>{ p.freezeChance += 0.15; p.freezeDuration = 0.5; }});
    s.push({name:"脉冲步枪", description:"击退 +100%", tier:2, icon:"wind", effect:(p)=>{ p.knockbackForce = (p.knockbackForce||5) * 2; }});
    s.push({name:"伽马射线", description:"子弹附带持续辐射伤害", tier:3, icon:"radioactive", effect:(p)=>{ p.poisonChance = 1.0; p.poisonDamage *= 1.5; }});
    s.push({name:"弧光生成器", description:"闪电链伤害不衰减", tier:4, icon:"bolt.fill", effect:(p)=>{ p.chainDamageDecay = 1.0; }});
    s.push({name:"虚空投射", description:"子弹无视距离衰减(寿命+2s)", tier:3, icon:"circle.dotted", effect:(p)=>{ p.bulletLifetime += 2.0; }});
    s.push({name:"能量虹吸", description:"造成伤害吸血 20% (10%几率)", tier:4, icon:"shield_tech", effect:(p)=>{ p.lifestealChance += 0.1; p.lifestealPercent = 0.2; }});

    // 3. 纳米科技 (Nanotech) - 状态与辅助
    s.push({name:"吞噬者病毒", description:"击杀敌人 100% 爆炸", tier:4, icon:"bio", effect:(p)=>{ p.deathExplosion = true; }});
    s.push({name:"物质回收仪", description:"拾取范围 +50%，回复提升", tier:3, icon:"recycle", effect:(p)=>{ p.pickupRange *= 1.5; p.regenRate += 1; }});
    s.push({name:"灰蛊风暴", description:"全屏造成微量电击伤害(光环)", tier:5, icon:"cloud.fill", effect:(p)=>{ p.lightningAuraEnabled = true; p.lightningAuraRadius = 9999; p.lightningAuraDamage = 5; }});
    s.push({name:"纳米护盾", description:"增加 1 个旋转护盾", tier:3, icon:"shield.fill", effect:(p)=>{ p.orbitalShieldCount += 1; }});
    s.push({name:"寄生纳米", description:"子弹附带吸血 5%", tier:3, icon:"drop.fill", effect:(p)=>{ p.lifestealChance = 1.0; p.lifestealPercent = 0.05; }});
    s.push({name:"增殖程序", description:"子弹数量 +2", tier:3, icon:"plus.circle", effect:(p)=>{ p.bulletCount += 2; }});
    s.push({name:"腐蚀云", description:"中毒敌人死亡爆炸", tier:3, icon:"smoke.fill", effect:(p)=>{ p.poisonExplode = true; }});
    s.push({name:"分子重组", description:"生命恢复速度 +3", tier:2, icon:"arrow.up.circle", effect:(p)=>{ p.regenRate += 3; }});
    s.push({name:"智能瞄准", description:"子弹追踪力 +100%", tier:2, icon:"target", effect:(p)=>{ p.homingStrength += 1.0; }});
    s.push({name:"适应性装甲", description:"减伤 +15%", tier:4, icon:"shield.checkered", effect:(p)=>{ p.damageReduction += 0.15; }});
    s.push({name:"生物质转化", description:"击杀回血 +3", tier:5, icon:"heart.circle", effect:(p)=>{ p.killHealAmount += 3; }});
    s.push({name:"纳米解构", description:"直接处决 25% 以下血量敌人", tier:3, icon:"scissors", effect:(p)=>{ p.instantKillThreshold = Math.max(p.instantKillThreshold || 0, 0.25); }});
    s.push({name:"蜂群思维", description:"无人机数量 +3", tier:4, icon:"ant.fill", effect:(p)=>{ p.droneCount += 3; }});
    s.push({name:"快速复制", description:"子弹分裂数量 +2", tier:3, icon:"timer", effect:(p)=>{ p.splitCount += 2; p.splitOnHit = true; }});
    s.push({name:"硬化凝胶", description:"护甲 +10%，击退抗性", tier:2, icon:"cube.fill", effect:(p)=>{ p.damageReduction += 0.1; }});
    s.push({name:"代谢加速", description:"移动速度 +20%", tier:3, icon:"flame", effect:(p)=>{ p.playerSpeedMulti *= 1.2; }});
    s.push({name:"孢子喷射", description:"死亡时爆炸", tier:2, icon:"burst", effect:(p)=>{ p.deathExplosion = true; }});
    s.push({name:"基因锁", description:"全属性 +5%", tier:4, icon:"lock.open", effect:(p)=>{ p.bulletDamage*=1.05; p.playerSpeedMulti*=1.05; p.playerMaxHealth*=1.05; }});
    s.push({name:"微型工厂", description:"自动布雷", tier:2, icon:"gear_tech", effect:(p)=>{ p.mineDropEnabled = true; }});
    s.push({name:"净化协议", description:"每秒生命回复 +1", tier:3, icon:"shield.slash", effect:(p)=>{ p.regenRate += 1; }});

    // 4. 战术装置 (Tactical Systems) - 控场与防御
    s.push({name:"偏导护盾", description:"护盾球数量 +2，旋转速度提升", tier:3, icon:"shield.lefthalf.filled", effect:(p)=>{ p.orbitalShieldCount += 2; p.orbitalShieldSpeed *= 1.2; }});
    s.push({name:"重力发生器", description:"周期性产生黑洞", tier:4, icon:"magnet", effect:(p)=>{ p.blackHoleAbility = true; }});
    s.push({name:"全息诱饵", description:"闪避率 +15%", tier:3, icon:"person.2.fill", effect:(p)=>{ p.dodgeChance += 0.15; }});
    s.push({name:"震荡冲击", description:"子弹击退距离 +100%", tier:2, icon:"wave", effect:(p)=>{ p.knockbackForce = (p.knockbackForce||10) * 2; }});
    s.push({name:"战术扫描", description:"暴击率 +15%", tier:1, icon:"location.viewfinder", effect:(p)=>{ p.critRate += 0.15; }});
    s.push({name:"静滞力场", description:"周围敌人持续受到伤害(光环)", tier:4, icon:"snowflake", effect:(p)=>{ p.lightningAuraEnabled = true; p.lightningAuraDamage = 2; }});
    s.push({name:"电磁脉冲", description:"受击反伤 +100%", tier:3, icon:"bolt.circle", effect:(p)=>{ p.thornsDamagePercent += 1.0; }});
    s.push({name:"自动炮塔", description:"无人机数量 +1，伤害 +20%", tier:3, icon:"video.fill", effect:(p)=>{ p.droneCount += 1; p.droneDamage *= 1.2; }});
    s.push({name:"烟雾弹", description:"闪避率 +10%", tier:3, icon:"cloud", effect:(p)=>{ p.dodgeChance += 0.1; }});
    s.push({name:"反应装甲", description:"反弹 50% 伤害", tier:3, icon:"shield.fill", effect:(p)=>{ p.thornsDamagePercent += 0.5; }});
    s.push({name:"弱点分析", description:"暴击率 +20%", tier:2, icon:"target", effect:(p)=>{ p.critRate += 0.2; }});
    s.push({name:"火力压制", description:"射速 +50%，散布 +20%", tier:3, icon:"burst.fill", effect:(p)=>{ p.shootInterval *= 0.66; p.spreadAngle += 0.2; }});
    s.push({name:"弹药箱", description:"子弹数量 +2", tier:3, icon:"square.fill", effect:(p)=>{ p.bulletCount += 2; }});
    s.push({name:"战术目镜", description:"暴击伤害 +50%", tier:2, icon:"eyeglasses", effect:(p)=>{ p.critDamageMulti += 0.5; }});
    s.push({name:"闪光弹", description:"子弹有 10% 几率冰冻敌人", tier:3, icon:"sun.max", effect:(p)=>{ p.freezeChance += 0.1; }});
    s.push({name:"雷达干扰", description:"闪避 +5%，拾取 +20%", tier:2, icon:"wifi.slash", effect:(p)=>{ p.dodgeChance += 0.05; p.pickupRange *= 1.2; }});
    s.push({name:"近防炮", description:"旋转刀片 +2", tier:3, icon:"shield.slash", effect:(p)=>{ p.bladeOrbitCount += 2; }});
    s.push({name:"引力波", description:"击退力 +50%", tier:2, icon:"wave", effect:(p)=>{ p.knockbackForce += 10; }});
    s.push({name:"相位移动", description:"闪避后无敌", tier:3, icon:"arrow.right", effect:(p)=>{ p.dodgeInvincibility = true; }});
    s.push({name:"最后防线", description:"静止时伤害 +50%", tier:4, icon:"lock.shield", effect:(p)=>{ p.stationaryDamageBonus = 0.5; }});

    // 5. 实验性超频 (Overclocking) - 高风险高回报
    s.push({name:"反应堆过载", description:"伤害 +100%，生命上限减半", tier:5, icon:"radioactive", effect:(p)=>{ p.bulletDamage *= 2.0; p.playerMaxHealth *= 0.5; p.playerHealth = Math.min(p.playerHealth, p.playerMaxHealth); }});
    s.push({name:"不稳定核心", description:"子弹大小 +50%，散布 +30%", tier:3, icon:"dice", effect:(p)=>{ p.bulletScale *= 1.5; p.spreadAngle += 0.3; }});
    s.push({name:"量子纠缠弹", description:"双倍子弹，射速减半", tier:3, icon:"arrow.left.and.right", effect:(p)=>{ p.bulletCount *= 2; p.shootInterval *= 2; }});
    s.push({name:"故障协议", description:"射速 x3，但精度极差 (+60度散布)", tier:4, icon:"exclamationmark.triangle", effect:(p)=>{ p.shootInterval *= 0.33; p.spreadAngle += 1.0; }});
    s.push({name:"玻璃反应堆", description:"伤害 x3，最大生命 -80%", tier:5, icon:"skull_tech", effect:(p)=>{ p.bulletDamage *= 3.0; p.playerMaxHealth *= 0.2; p.playerHealth = Math.min(p.playerHealth, p.playerMaxHealth); }});
    s.push({name:"随机代码", description:"全属性随机变动 (+/- 10%)", tier:3, icon:"questionmark.circle", effect:(p)=>{ p.bulletDamage *= 1.1; p.shootInterval *= 0.9; }});
    s.push({name:"内存泄漏", description:"经验 +100%，生命上限 -30%", tier:4, icon:"drop.triangle", effect:(p)=>{ p.expMultiplier *= 2.0; p.playerMaxHealth *= 0.7; p.updateHealthUI(); }});
    s.push({name:"无限循环", description:"子弹穿透 +10，存活时间 +5秒", tier:4, icon:"infinity", effect:(p)=>{ p.pierceCount += 10; p.bulletLifetime += 5.0; }});
    s.push({name:"堆栈溢出", description:"子弹数量 +10，伤害 -80%", tier:5, icon:"list.bullet", effect:(p)=>{ p.bulletCount += 10; p.bulletDamage *= 0.2; }});
    s.push({name:"蓝屏死机", description:"冰冻时间 +2秒", tier:4, icon:"display", effect:(p)=>{ p.freezeDuration += 2.0; }});
    s.push({name:"错误修正", description:"护甲 +30%", tier:4, icon:"hammer", effect:(p)=>{ p.damageReduction += 0.3; }});
    s.push({name:"逻辑炸弹", description:"爆炸范围 +100%，击退", tier:4, icon:"bomb.fill", effect:(p)=>{ p.areaDamageRadius = (p.areaDamageRadius||30) * 2; p.explosionKnockback = true; }});
    s.push({name:"超频运算", description:"射速 +50%，移速 +50%", tier:4, icon:"timer", effect:(p)=>{ p.shootInterval *= 0.66; p.playerSpeedMulti *= 1.5; }});
    s.push({name:"幽灵数据", description:"闪避率 +30%，最大生命 -30%", tier:3, icon:"ghost", effect:(p)=>{ p.dodgeChance += 0.3; p.playerMaxHealth *= 0.7; p.updateHealthUI(); }});
    s.push({name:"递归攻击", description:"子弹分裂次数 +2", tier:4, icon:"arrow.triangle.branch", effect:(p)=>{ p.splitCount += 2; p.splitOnHit = true; }});
    s.push({name:"野指针", description:"子弹飞行速度 +100%，精度下降", tier:2, icon:"scribble", effect:(p)=>{ p.bulletSpeedMulti *= 2.0; p.spreadAngle += 0.5; }});
    s.push({name:"强制垃圾回收", description:"拾取范围 +500%", tier:5, icon:"trash", effect:(p)=>{ p.pickupRange *= 5.0; }});
    s.push({name:"死循环", description:"敌人死后生成黑洞", tier:3, icon:"arrow.counterclockwise", effect:(p)=>{ p.blackHoleOnDeath = true; }});
    s.push({name:"调试模式", description:"暴击率 100%，伤害 -50%", tier:1, icon:"gear", effect:(p)=>{ p.critRate = 1.0; p.bulletDamage *= 0.5; }});
    s.push({name:"Beta测试版", description:"运气(幸运暴击) +10%", tier:3, icon:"dice.fill", effect:(p)=>{ p.luckyCritChance += 0.1; }});

    return s;
}

// 生成额外的飞刀技能
function generateExtraBladeSkills() {
  return [
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
