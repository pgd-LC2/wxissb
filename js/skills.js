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
  // 赛博朋克 490 大军械库
  // ------------------------------
  const cyberSkills = generateCyberpunkArsenal();
  for (const sk of cyberSkills) skills.push(sk);
  
  // 保留旧的科技技能逻辑，以防万一有依赖，但它们被整合进 generateCyberpunkArsenal 或作为补充
  // const techSkills = generateSciFiSkills(); // 已废弃，使用新生成器覆盖
  
  return skills;
}

// ------------------------------
// 赛博朋克军械库生成器 - 生成 490+ 独特技能
// ------------------------------
function generateCyberpunkArsenal() {
  const skills = [];
  let idCounter = 1000;

  // 1. 元素武器系统 (100个)
  // 5 种元素 x 4 种形态 x 5 个等级
  const elements = [
    { id: "plasma", name: "等离子", icon: "atom", color: "#00ffff", desc: "爆炸并熔化护甲" },
    { id: "neon",   name: "霓虹",   icon: "bolt.fill", color: "#ff00ff", desc: "连锁闪电与眩晕" },
    { id: "void",   name: "虚空",   icon: "circle.hexagongrid.fill", color: "#600080", desc: "黑洞引力与斩杀" },
    { id: "bio",    name: "生化",   icon: "leaf.fill", color: "#00ff00", desc: "剧毒云与蔓延" },
    { id: "glitch", name: "故障",   icon: "glitch", color: "#ffffff", desc: "随机Debuff与混乱" }
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
     {name: "液压臂", attr: "近战/击退", var1: "强力", var2: "粉碎"},
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
    {name: "幽灵模式", desc: "静止不动时隐身(无敌)", icon: "ghost"},
    {name: "数据虹吸", desc: "每秒偷取周围敌人生命", icon: "network"},
    {name: "防火墙",   desc: "生成阻挡敌人的火墙", icon: "shield_tech"},
    {name: "根权限",   desc: "所有技能效果提升10%", icon: "key"}
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
              }
          });
      });
  });
  
  // 6. 实验性武器 (50个)
  const weapons = [
      {name: "磁轨炮", desc: "极高穿透与击退"},
      {name: "声波炮", desc: "宽范围震退敌人"},
      {name: "奇点枪", desc: "子弹生成微型黑洞"},
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
              }
          });
      });
  });
  
  // 7. 外骨骼装甲 (50个) - 纯防御/辅助倾向
  const suits = [
      {name: "泰坦", desc: "极大提升生命与护甲"},
      {name: "游侠", desc: "提升移速与闪避"},
      {name: "虚空", desc: "受伤瞬移"},
      {name: "反应", desc: "受击自动反击"},
      {name: "医疗", desc: "大幅提升回复"},
      {name: "工兵", desc: "自动布雷与维修无人机"},
      {name: "幽灵", desc: "穿透敌人移动"},
      {name: "要塞", desc: "静止时无敌"},
      {name: "狂徒", desc: "血量越低伤害越高"},
      {name: "主宰", desc: "免疫控制与击退"}
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
