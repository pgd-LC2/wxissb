(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { utils, SFX, GameConfig, nextId } = GameApp.Deps;
  const { TAU, clamp, lerp, rand, nowSec, hypot, colorWithAlpha } = utils;
  const { canvas, ctx } = GameApp.DOM;

  function makeGame() {
    // ------------------------------
    // Numeric safety (prevent overflow / NaN / Infinity)
    // ------------------------------
    const NUM_CAP = 9e15; // < Number.MAX_SAFE_INTEGER (~9.007e15)
    const clampFinite = (n, min, max) => {
      n = Number.isFinite(n) ? n : min;
      if (n < min) return min;
      if (n > max) return max;
      return n;
    };
    const safeNumber = (n, fallback = 0) => {
      n = Number.isFinite(n) ? n : fallback;
      if (n > NUM_CAP) return NUM_CAP;
      if (n < -NUM_CAP) return -NUM_CAP;
      return n;
    };
    const safeNonNeg = (n, fallback = 0) => clampFinite(safeNumber(n, fallback), 0, NUM_CAP);

    const formatShort = (n) => {
      n = safeNumber(n, 0);
      const sign = n < 0 ? "-" : "";
      let abs = Math.abs(n);
      if (abs < 1000) return sign + String(Math.round(abs));
      const units = [
        { v: 1e15, s: "Q" },
        { v: 1e12, s: "T" },
        { v: 1e9, s: "B" },
        { v: 1e6, s: "M" },
        { v: 1e3, s: "K" },
      ];
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (abs >= u.v) {
          const val = abs / u.v;
          const dp = val >= 100 ? 0 : (val >= 10 ? 1 : 2);
          return sign + val.toFixed(dp) + u.s;
        }
      }
      return sign + String(Math.round(abs));
    };

    const g = {
      // Callbacks (like SwiftUI layer)
      onLevelUp: null,
      onStateChange: null,
      onGameOver: null,

      // Entities
      player: { x: 0, y: 0, r: 15, lastHit: -999, color: "#00d7ff" },
      camera: { x: 0, y: 0, shakeEnd: 0, shakeAmp: 0 },
      enemies: [],
      bullets: [],
      expOrbs: [],
      orbitals: [],       // {type:'shield'|'blade', x,y, r/w/h, rot, colliding:Set}
      drones: [],         // {x,y,lastShot}
      ghosts: [],         // {x,y}
      mines: [],          // {x,y, damage, radius, born}
      fireTrails: [],     // {x,y, born, lastTick}
      warnings: [],       // meteor warning {x,y, born}
      blackHoles: [],     // {x,y, radius, end, fadeEnd, nextTick, small}
      poisonClouds: [],   // {x,y, born, ticks, nextTick, fadeStart, fadeEnd}
      enemyBullets: [],   // NEW: enemy projectiles {x,y,vx,vy,damage,born}
      effects: [],        // visuals
      particles: [],      // juicy particles
      screenFlash: null,  // {color, intensity, start, end}
      hitStopEnd: 0,
      hitStopScale: 1.0,

      // MARK: 属性系统 - 基础
      playerSpeedMulti: 1.0,
      bulletDamage: 15,
      shootInterval: 0.6,
      bulletCount: 1,
      bulletSpeedMulti: 1.0,
      bulletScale: 1.0,
      bulletLifetime: 1.5,
      knockbackForce: 0,
      spreadAngle: 0.15,
      pickupRange: 100,
      expMagnetAll: false,  // 自动吸取所有经验球
      critRate: 0.05,
      critDamageMulti: 2.0,
      damageReduction: 0,
      expMultiplier: 1.0,
      regenRate: 0,

      // MARK: 属性系统 - 子弹变体
      pierceCount: 0,
      lifestealChance: 0.0,
      lifestealPercent: 0.2,
      areaDamageRadius: 0,
      homingStrength: 0,
      splitOnHit: false,
      splitCount: 0,
      freezeChance: 0,
      freezeDuration: 0,
      burnChance: 0,
      burnDamage: 0,
      burnDuration: 0,
      burnSpread: false,
      poisonChance: 0,
      poisonDamage: 0,
      poisonDuration: 0,
      poisonExplode: false,
      chainLightning: false,
      chainCount: 0,
      chainDamageDecay: 0.7,
      explosionKnockback: false,
      blackHoleOnDeath: false,

      // MARK: 属性系统 - 防御
      orbitalShieldCount: 0,
      orbitalShieldSpeed: 1.0,
      orbitalShieldDamage: 20,
      thornsDamagePercent: 0,
      thornsSlow: false,
      dodgeChance: 0,
      dodgeInvincibility: false,
      iFrameDuration: 0.5,
      lowHpDamageBoost: false,
      lowHpThreshold: 0.2,
      lowHpDamageMulti: 1.5,
      berserkerMode: false,
      berserkerThreshold: 0.3,
      emergencyHealActive: false,
      phoenixRevive: false,
      phoenixChance: 0,
      damageCap: 1.0,
      lastStand: false,
      blockChance: 0,
      perfectBlockCounter: false,
      combatRegenBoost: false,
      lastDamageTime: 0,

      // MARK: 属性系统 - 召唤物
      droneCount: 0,
      droneDamage: 10,
      mineDropEnabled: false,
      mineDropInterval: 2.0,
      mineDamage: 50,
      mineRadius: 60,
      bladeOrbitCount: 0,
      bladeOrbitRadius: 120,
      bladeOrbitDamage: 12,
      ghostCount: 0,
      ghostSlow: false,
      fireTrailEnabled: false,
      fireTrailDamage: 15,
      fireTrailSlow: false,
      meteorEnabled: false,
      meteorInterval: 10.0,
      meteorCount: 1,
      meteorDamage: 80,
      lightningAuraEnabled: false,
      lightningAuraRadius: 0,
      lightningAuraDamage: 5,
      blackHoleAbility: false,
      blackHolePower: 1.0,

      // MARK: 属性系统 - 触发机制
      killStreakEnabled: false,
      killStreakMaxBonus: 1.0,
      killStreakDecay: 1.0,
      killStreak: 0,
      lastKillTime: 0,
      killHealAmount: 0,
      deathExplosion: false,
      deathExplosionRadius: 50,
      rageOnHit: false,
      rageDamageBonus: 0,
      rageEndTime: 0,
      revengeEnabled: false,
      revengeNextCrit: false,
      luckyCritChance: 0,
      luckyCritMulti: 10.0,
      executeEnabled: false,
      executeThreshold: 0,
      instantKillThreshold: 0,
      overloadChance: 0,
      overloadChain: false,
      timeWarpOnKill: false,
      timeWarpActive: false,
      timeWarpEndTime: 0,

      // MARK: 属性系统 - 特殊
      chargeAttackEnabled: false,
      chargeSpeed: 1.0,
      chargeMaxBonus: 2.0,
      currentCharge: 0,
      allDirectionFire: false,
      recoilPush: false,
      suppressionEnabled: false,
      vulnerabilityMark: false,
      vulnerabilityBonus: 0,
      movingFireRateBonus: 0,
      stationaryDamageBonus: 0,
      gamblerMode: false,
      criticalStateEnabled: false,
      symbiosisEnabled: false,
      clearingBonus: false,
      crowdControl: false,
      momentumEnabled: false,
      momentumDamage: false,
      currentMomentum: 0,

      // 额外：飞刀升级参数（不改变原版，默认=0/1）
      bladeOrbitSpeed: 1.0,
      bladeOrbitScale: 1.0,
      bladeOrbitFreezeChance: 0,
      bladeOrbitFreezeDuration: 0,
      bladeOrbitBurnChance: 0,
      bladeOrbitBurnDamage: 0,
      bladeOrbitBurnDuration: 0,
      bladeOrbitPoisonChance: 0,
      bladeOrbitPoisonDamage: 0,
      bladeOrbitPoisonDuration: 0,
      bladeOrbitLifestealChance: 0,
      bladeOrbitLifestealPercent: 0.2,

      // 飞刀新增属性 - 伤害修正
      bladeOrbitArmorPen: 0,           // 破甲飞刃：无视敌人护甲比例
      bladeOrbitCritChance: 0,         // 飞刀暴击率
      bladeOrbitCritDamage: 1.5,       // 飞刀暴击倍率
      bladeOrbitChargeBonus: 0,        // 蓄力飞刀：每圈伤害加成
      bladeOrbitRageDamage: false,     // 怒刃：低生命高伤害
      bladeOrbitExecute: false,        // 死亡飞刀：斩杀效果
      bladeOrbitExecuteThreshold: 0,   // 斩杀血线
      bladeOrbitExecuteMult: 1,        // 斩杀倍率
      bladeOrbitFrozenBonusDamage: 1,  // 冰碎：对冰冻敌人额外倍率
      bladeOrbitBurnBonusDamage: 1,    // 火焰爆发：对燃烧敌人额外倍率

      // 飞刀新增属性 - 冰霜效果
      bladeOrbitSlowChance: 0,         // 减速几率
      bladeOrbitSlowAmount: 0,         // 减速比例
      bladeOrbitSlowDuration: 0,       // 减速持续
      bladeOrbitFrostAura: false,      // 寒气弥漫
      bladeOrbitFreezeSpread: false,   // 冰刃连锁
      bladeOrbitIceExplosion: false,   // 冰晶爆裂
      bladeOrbitPermaFrost: false,     // 永冻飞刃
      bladeOrbitPermaFrostSlow: 0,     // 永冻减速量

      // 飞刀新增属性 - 火焰效果
      bladeOrbitBurnExplosion: false,  // 引爆
      bladeOrbitFireTrail: false,      // 火环
      bladeOrbitLavaPool: false,       // 熔岩飞刃
      bladeOrbitPhoenixWings: false,   // 凤凰之翼
      bladeOrbitEternalFlame: false,   // 业火飞刃

      // 飞刀新增属性 - 毒素效果
      bladeOrbitPoisonSpread: false,   // 瘟疫之刃
      bladeOrbitPoisonAura: false,     // 毒雾弥漫
      bladeOrbitPoisonWeaken: 0,       // 致命毒素
      bladeOrbitPoisonSlow: 0,         // 神经毒素
      bladeOrbitPoisonInstakill: false,// 致死毒刃
      bladeOrbitPoisonInstakillStacks: 5, // 致死所需层数

      // 飞刀新增属性 - 雷电效果
      bladeOrbitShockChance: 0,        // 闪电触发几率
      bladeOrbitChainCount: 0,         // 闪电弹射数量
      bladeOrbitStunChance: 0,         // 眩晕几率
      bladeOrbitStunDuration: 0,       // 眩晕持续
      bladeOrbitMagneticPull: false,   // 磁暴飞刃
      bladeOrbitMagneticRange: 0,      // 磁场范围
      bladeOrbitKillLightning: false,  // 雷神之怒

      // 飞刀新增属性 - 特殊机制
      bladeOrbitHoming: false,         // 追踪飞刃
      bladeOrbitHomingRange: 0,        // 追踪范围
      bladeOrbitHomingAccuracy: 0.5,   // 追踪精度
      bladeOrbitExplosion: false,      // 爆裂飞刃
      bladeOrbitExplosionRadius: 30,   // 爆炸半径
      bladeOrbitSplit: 0,              // 分裂数量
      bladeOrbitSplitChain: false,     // 连锁分裂
      bladeOrbitBoomerang: false,      // 回旋飞刀
      bladeOrbitReflect: false,        // 刀刃反射
      bladeOrbitReflectDamage: 1,      // 反射伤害倍率
      bladeOrbitShadowBlade: false,    // 影刃
      bladeOrbitShadowDamageMult: 0.5, // 影刃伤害倍率
      bladeOrbitResonance: false,      // 共振飞刃
      bladeOrbitTimeStop: false,       // 时停飞刀
      bladeOrbitTimeStopDuration: 0.3, // 时停持续
      bladeOrbitDualRing: false,       // 双层刀阵
      bladeOrbitPierce: 0,             // 穿透数量
      bladeOrbitBounce: 0,             // 弹射数量

      // 飞刀新增属性 - 防御与治疗
      bladeOrbitDamageReduction: 0,    // 刀盾减伤（每把）
      bladeOrbitDeathSave: false,      // 刃之守护
      bladeOrbitCounterAttack: false,  // 反击飞刃
      bladeOrbitCounterBonus: 0,       // 反击伤害加成
      bladeOrbitThornHeal: false,      // 荆棘飞刀
      bladeOrbitCCImmune: false,       // 绝对防御
      bladeOrbitCCImmuneThreshold: 10, // CC免疫飞刀数量阈值
      bladeOrbitRegenPerBlade: 0,      // 每把飞刀每秒回血
      bladeOrbitBloodSacrifice: false, // 血祭飞刃
      bladeOrbitOverhealShield: false, // 不死之刃

      // 飞刀新增属性 - 终极技能
      bladeOrbitSkyfall: false,        // 天降飞刀
      bladeOrbitSkyfallInterval: 3.0,  // 天降间隔
      bladeOrbitBurst: false,          // 刀阵自爆
      bladeOrbitExpBonus: 0,           // 轮回飞刃：额外经验几率

      // 飞刀运行时状态
      _bladeChargeRotations: 0,        // 蓄力圈数计数
      _bladeCounterEnd: 0,             // 反击加成结束时间
      _bladeLastSkyfallTime: 0,        // 上次天降时间
      _bladeLastRegenTime: 0,          // 上次飞刀回血时间
      _bladeLastAuraTime: 0,           // 上次光环伤害时间
      _bladeOverhealShield: 0,         // 过量治疗护盾值

      // MARK: 游戏状态
      playerHealth: 100,
      playerMaxHealth: 100,
      currentExp: 0,
      maxExp: 70,
      level: 1,
      isPausedGame: false,

      // ------------------------------
      // NEW: Tech Knockback System (赛博朋克击退科技系统)
      // ------------------------------
      tech: {
        // 1. Gravity Pulse
        pulseActive: false,
        pulseInterval: 3.0,
        pulseNext: 0,
        pulseRange: 180,
        pulseForce: 150,

        // 2. Sonic Shotgun
        sonicActive: false,
        sonicCounter: 0,
        sonicThreshold: 3,
        sonicArc: 0.8, // radians
        sonicForce: 250,

        // 3. Repulsor Field
        repulsorActive: false,
        repulsorRange: 70,
        repulsorForce: 15, // Constant low force

        // 4. Kinetic Dash (Trail)
        dashTrailActive: false,
        dashTrailInterval: 0.2,
        dashTrailNext: 0,

        // 5. Force Mine
        forceMineActive: false,
        forceMineChance: 0.0, // Chance on shoot or move? Let's do drop on move like regular mines but separate
        forceMineInterval: 2.5,
        forceMineNext: 0,

        // 6. Railgun
        railgunActive: false,
        railgunChance: 0.10,
        railgunForce: 600,

        // 7. Shockwave Stomp
        stompActive: false,
        stompChargeTime: 1.0,
        stompTimer: 0,
        stompForce: 400,
        stompRange: 250,
        stompReady: false,

        // 8. Kinetic Barrier (Orbital)
        barrierActive: false,
        barrierCount: 0,
        barrierList: [], // {ang: 0}

        // 9. Pulse Drone
        droneActive: false,
        droneCount: 0,
        droneList: [], // {x, y, lastShot}

        // 10. Anti-Gravity Singularity
        singularityActive: false,
        singularityChance: 0.05 // On kill
      },

      // ------------------------------
      // NEW: Cyber Arsenal System (赛博军械库)
      // ------------------------------
      cyber: {
        drones: [], // {type, behavior, level, id, lastShot, x, y}
        bladeType: null, // "razor", "saw", "energy"
        // Elements and hacks are stored as keys like "elem_plasma_bullet": 1.5
      },

      lastShootTime: 0,
      lastRegenTime: 0,
      lastMineTime: 0,
      lastMeteorTime: 0,
      lastBlackHoleTime: 0,
      lastFireTrailTime: 0,
      joystickVector: { dx: 0, dy: 0 },
      wasMovingLastFrame: false,

      // UI/bookkeeping
      acquiredSkills: [],
      acquiredSkillMeta: [],
      isLevelingUp: false,
      isGameOver: false,
      skillChoices: [],
      allSkills: [],
    };

    // ------------------------------
    // Internal queues (avoid deep recursion)
    // ------------------------------
    g._killQueue = [];

    // ------------------------------
    // Helpers like Swift
    // ------------------------------
    g.updateHealthUI = () => g.updateUI();

    g.updateUI = () => {
      if (typeof g.onStateChange === "function") {
        g.onStateChange(g.currentExp / g.maxExp, g.playerHealth / g.playerMaxHealth, g.level);
      }
    };


    // ------------------------------
    // Combat Power System (30s window, multi-factor, smoothed)
    // Used for: enemy director (数量/强度) + local leaderboard
    // ------------------------------
    g.stats = {
      startTime: 0,
      kills: 0,
      dmgDealt: 0,
      dmgTaken: 0,
      expGained: 0
    };

    g.combat = {
      window: 30.0,
      events: { kills: [], dmgDealt: [], dmgTaken: [], exp: [], levelUps: [] },
      _acc: { kills: 0, dmgDealt: 0, dmgTaken: 0, exp: 0, levelUps: 0 },
      rating: 0,
      ratingSmooth: 0,
      tier: "D",
      tierColor: "rgba(255,255,255,.92)",
      peak: 0,
      integral: 0,
      lastEval: 0
    };

    g._pushCombatEvent = (arr, t, v) => {
      if (!arr) return;
      arr.push({ t, v: safeNonNeg(v, 0) });
    };

    g._pruneCombatEvents = (arr, t, windowSec) => {
      const cutoff = t - windowSec;
      while (arr.length > 0 && arr[0].t < cutoff) arr.shift();
    };

    g._sumCombatEvents = (arr, t, windowSec) => {
      g._pruneCombatEvents(arr, t, windowSec);
      let sum = 0;
      for (let i = 0; i < arr.length; i++) sum += arr[i].v;
      return safeNonNeg(sum, 0);
    };

    g.estimateBuildDps = () => {
      const crit = 1 + clamp(g.critRate, 0, 1) * (safeNumber(g.critDamageMulti, 2.0) - 1);
      const si = Math.max(0.06, safeNumber(g.shootInterval, 0.6));
      const sps = 1 / si;
      const bulletDps = safeNonNeg(safeNumber(g.bulletDamage, 0) * crit * safeNumber(g.bulletCount, 1) * sps, 0);

      // drones fire ~ every 0.8s, not all shots hit (so add a conservative hit factor)
      const dc = safeNumber(g.droneCount, 0);
      const droneSps = (dc > 0) ? (dc * (1/0.8) * 0.65) : 0;
      const droneDps = safeNonNeg(safeNumber(g.bulletDamage, 0) * crit * droneSps, 0);

      // orbitals are contact-based: approximate
      const bladeDps = safeNonNeg(safeNumber(g.bladeOrbitCount, 0) * safeNumber(g.bladeOrbitDamage, 0) * safeNumber(g.bladeOrbitSpeed, 1.0) * 0.55, 0);
      const shieldDps = safeNonNeg(safeNumber(g.orbitalShieldCount, 0) * safeNumber(g.orbitalShieldDamage, 0) * safeNumber(g.orbitalShieldSpeed, 1.0) * 0.35, 0);

      const auraDps = g.lightningAuraEnabled ? safeNonNeg(safeNumber(g.lightningAuraDamage, 0) * 1.2, 0) : 0;

      return safeNonNeg(bulletDps + droneDps + bladeDps + shieldDps + auraDps, 0);
    };

    g.estimateSkillScore = () => {
      // use meta if available; otherwise fall back to skill count
      const meta = g.acquiredSkillMeta || [];
      if (!meta || meta.length === 0) return safeNonNeg(g.acquiredSkills.length, 0) * 1.0;
      let score = 0;
      const tierScore = [0, 1.0, 1.6, 2.3, 3.2, 4.2];
      for (let i = 0; i < meta.length; i++) {
        const tier = meta[i].tier || 1;
        const t = Math.max(1, Math.min(5, tier));
        score += tierScore[t] || 1.0;
      }
      return safeNonNeg(score, 0);
    };

    g._combatTierFromScore = (score) => {
      // 无限战力段位系统 - 超过1000后继续增加更高段位
      if (score >= 5000) return { tier:"X",    color:"#ff00ff" };  // 传说级
      if (score >= 3000) return { tier:"EX",   color:"#00ffff" };  // 超越级
      if (score >= 2000) return { tier:"SSSS", color:"#ff1493" };  // 神话级
      if (score >= 1500) return { tier:"SSS+", color:"#ff6b6b" };  // 超凡级
      if (score >= 920)  return { tier:"SSS",  color:"#ff3b30" };
      if (score >= 820)  return { tier:"SS",   color:"#ff9f0a" };
      if (score >= 700)  return { tier:"S",    color:"#ffd60a" };
      if (score >= 560)  return { tier:"A",    color:"#34c759" };
      if (score >= 420)  return { tier:"B",    color:"#4aa3ff" };
      if (score >= 280)  return { tier:"C",    color:"#9ca3af" };
      return { tier:"D", color:"rgba(255,255,255,.92)" };
    };

    g.computeCombatRating = (t) => {
      const c = g.combat;
      const W = c.window;

      const kills = g._sumCombatEvents(c.events.kills, t, W);
      const dmg = g._sumCombatEvents(c.events.dmgDealt, t, W);
      const dmgTaken = g._sumCombatEvents(c.events.dmgTaken, t, W);
      const exp = g._sumCombatEvents(c.events.exp, t, W);
      const lvlups = g._sumCombatEvents(c.events.levelUps, t, W);

      const kpm = kills * 60 / W;
      const dps = dmg / W;
      const dtps = dmgTaken / W;
      const xps = exp / W;
      const lpm = lvlups * 60 / W;

      const buildDps = g.estimateBuildDps();
      const skillScore = g.estimateSkillScore();
      const hpRatio = clamp(g.playerHealth / Math.max(1, g.playerMaxHealth), 0, 1);
      const sinceHit = (g.lastDamageTime ? (t - g.lastDamageTime) : W);
      const calm = clamp(sinceHit / W, 0, 1);
      const efficiency = dps / Math.max(1, dtps);

      // normalize with log scaling - 移除上限限制，允许战力无限增长
      // 当超过基准值时，战力会继续增长但速度变慢（对数增长）
      const nK = Math.max(0, Math.log1p(kpm) / Math.log1p(80));
      const nD = Math.max(0, Math.log1p(dps) / Math.log1p(900));
      const nB = Math.max(0, Math.log1p(buildDps) / Math.log1p(1200));
      const nX = Math.max(0, Math.log1p(xps) / Math.log1p(120));
      const nL = Math.max(0, Math.log1p(lpm) / Math.log1p(10));
      const nS = Math.max(0, Math.log1p(skillScore) / Math.log1p(120));
      const nE = Math.max(0, Math.log1p(efficiency) / Math.log1p(12));

      const raw =
        0.18 * nB +
        0.18 * nD +
        0.16 * nK +
        0.12 * nX +
        0.10 * nL +
        0.10 * nS +
        0.08 * nE +
        0.05 * calm +
        0.03 * hpRatio;

      // 移除1000上限，允许战力无限增长
      const rating = Math.max(0, 1000 * raw);
      const tc = g._combatTierFromScore(rating);

      return {
        rating,
        kpm,
        dps,
        xps,
        buildDps,
        hpRatio,
        tier: tc.tier,
        tierColor: tc.color
      };
    };

    g.updateCombatRating = (t) => {
      const c = g.combat;
      if (!c) return;

      // flush accumulators (reduces event spam from DOT, multi-hit, etc.)
      const acc = c._acc;
      if (acc.kills > 0) { g._pushCombatEvent(c.events.kills, t, acc.kills); acc.kills = 0; }
      if (acc.dmgDealt > 0) { g._pushCombatEvent(c.events.dmgDealt, t, acc.dmgDealt); acc.dmgDealt = 0; }
      if (acc.dmgTaken > 0) { g._pushCombatEvent(c.events.dmgTaken, t, acc.dmgTaken); acc.dmgTaken = 0; }
      if (acc.exp > 0) { g._pushCombatEvent(c.events.exp, t, acc.exp); acc.exp = 0; }
      if (acc.levelUps > 0) { g._pushCombatEvent(c.events.levelUps, t, acc.levelUps); acc.levelUps = 0; }

      // update at most ~6-7 times per second
      if (c.lastEval && (t - c.lastEval) < 0.15) return;

      const dt = c.lastEval ? Math.min(0.25, Math.max(0, t - c.lastEval)) : 0;
      c.lastEval = t;

      const res = g.computeCombatRating(t);
      c.rating = res.rating;

      const alpha = clamp(dt * 2.2, 0.04, 0.25);
      c.ratingSmooth = (c.ratingSmooth === 0) ? c.rating : lerp(c.ratingSmooth, c.rating, alpha);

      c.peak = Math.max(c.peak, c.ratingSmooth);
      c.integral = safeNonNeg(c.integral + c.ratingSmooth * dt, 0);

      c.tier = res.tier;
      c.tierColor = res.tierColor;
      c.snapshot = res;
    };

    // ------------------------------
    // Enemy Director (dynamic spawn & scaling based on combat rating)
    // ------------------------------
    g.director = {
      lastT: 0,
      spawnBudget: 0,
      spawnRate: 1.8,      // enemies / sec (increased from 1.2)
      strength: 0,         // derived from combat rating
      diff: 1.0,           // used as enemy HP scaling
      dmgMul: 1.0,         // used as enemy contact damage scaling
      speedMul: 1.0,       // NEW: enemy speed scaling
      targetEnemies: 15,   // increased from 12
      // 动态怪物最小数量 - 基于玩家战力动态调整
      minEnemies: 4,       // 最小怪物数量
      eliteChance: 0.06,   // increased from 0.04
      progress: 0.0,
    };

    g.directorStep = (t) => {
      // Use real delta time even when paused, so the director doesn't "burst-spawn" after resuming.
      const d = g.director;
      let dtBase = 0.016;
      if (d.lastT) {
        dtBase = t - d.lastT;
        if (!Number.isFinite(dtBase) || dtBase <= 0) dtBase = 0.016;
      }
      dtBase = clamp(dtBase, 0.001, 0.05);
      d.lastT = t;

      if (g.isPausedGame || g.isGameOver) return;

      // keep director in sync with simulation time scaling
      const timeScale = (g.timeWarpActive && t < g.timeWarpEndTime) ? 0.55 : 1.0;

      // hit stop: optional (see GameConfig.hitStopEnabled)
      let hitScale = 1.0;
      if (GameConfig.hitStopEnabled) {
        hitScale = (g.hitStopEnd && t < g.hitStopEnd) ? (g.hitStopScale || 0.25) : 1.0;
      }

      const dt = dtBase * timeScale * hitScale;

      // update combat rating first (so spawns react to current performance)
      g.updateCombatRating(t);

      const p = (g.combat && g.combat.ratingSmooth) ? g.combat.ratingSmooth : 0;
      const strength = clamp(p / 650, 0, 1.8);
      d.strength = strength;

      const timeAlive = g._startTime ? Math.max(0, t - g._startTime) : 0;
      const timeProg = clamp(timeAlive / 240, 0, 1);  // 0~1 in first 4 minutes
      d.progress = clamp(0.55 * timeProg + 0.45 * clamp(strength / 1.2, 0, 1), 0, 1);

      // difficulty multipliers (bounded) - ENHANCED for more challenge
      // 玩家攻击力缩放因子：让怪物HP和属性跟随玩家输出成长
      const playerDmg = safeNumber(g.bulletDamage, 15);
      const dmgFactor = clamp(Math.log2(Math.max(1, playerDmg / 15)), 0, 4); // 攻击力每翻倍+1
      d.diff = clamp(1.0 + (g.level - 1) * 0.13 + strength * 1.1 + dmgFactor * 0.6, 1.0, 16.0);
      d.dmgMul = clamp(1.0 + (g.level - 1) * 0.12 + strength * 0.35 + dmgFactor * 0.15, 1.0, 8.0);
      // NEW: speed multiplier - enemies get faster over time
      d.speedMul = clamp(1.0 + (g.level - 1) * 0.04 + strength * 0.25 + timeProg * 0.3, 1.0, 2.0);

      // ========================================
      // 动态怪物数量系统
      // 基于玩家等级（对数增长）+ 战力（小权重）
      // ========================================
      
      // 等级因子
      const level = g.level;
      
      // ========================================
      // NB Mode 僵尸围城：怪物刷新无上限
      // ========================================
      if (g.nbModeActive) {
        const timeAliveNB = g._startTime ? Math.max(0, t - g._startTime) : 0;
        const nbTimeFactor = clamp(timeAliveNB / 60, 0, 10);
        d.minEnemies = 30 + Math.round(nbTimeFactor * 20);
        d.targetEnemies = 100000000;
        const nbBaseRate = 12 + nbTimeFactor * 4;
        d.spawnRate = clamp(nbBaseRate + level * 0.5 + strength * 2, 12, 60);
        d.eliteChance = clamp(0.10 + 0.06 * strength + 0.06 * d.progress, 0.10, 0.45);
        d.spawnBudget = safeNonNeg(d.spawnBudget + d.spawnRate * dt, 0);
        let spawnedNB = 0;
        const maxLoopNB = 30;
        while (d.spawnBudget >= 1 && spawnedNB < maxLoopNB) {
          g.spawnEnemy(t);
          d.spawnBudget -= 1;
          spawnedNB++;
        }
        return;
      }

      // ========================================
      // 动态最小怪物数量 - 基于玩家等级（对数增长）
      // ========================================
      // 最小怪物数量：保证场上始终有一定数量的怪物
      // 等级1: 4, 等级10: 12, 等级25: 15
      // 使用对数增长：minEnemies = 4 + 8 * log10(level)
      d.minEnemies = Math.round(4 + 8 * Math.log10(Math.max(1, level)));
      d.minEnemies = clamp(d.minEnemies, 4, 20);
      
      // 目标怪物数量公式（对数增长）：
      // 等级1: 6
      // 等级10: 6 + 44 * log10(10) + 战力 ≈ 50
      // 等级25: 6 + 44 * log10(25) + 战力 ≈ 67
      // 等级100: 6 + 44 * 2 + 战力 ≈ 94
      const baseEnemies = 6;
      const levelContrib = 44 * Math.log10(Math.max(1, level));  // 对数增长
      const strengthContrib = strength * 3;  // 战力小权重（最多贡献约5.4）
      let targetRaw = Math.round(baseEnemies + levelContrib + strengthContrib);
      // 确保目标不低于最小值（无最大值限制）
      d.targetEnemies = Math.max(targetRaw, d.minEnemies);

      // 生成速率公式（基于等级 + 战力小权重）：
      // 等级1: ~1.0/秒，等级25: ~5/秒
      const baseRate = 1.0;
      const rateTimeScale = Math.pow(timeProg, 0.5);
      let rate = clamp(
        baseRate + rateTimeScale * 1.5 + (level - 1) * 0.15 + strength * 0.5,
        0.8,
        8.0
      );
      
      // ========================================
      // 智能生成速率调节 - 接近目标时平滑减速，达到目标时变很慢（但不停止）
      // ========================================
      const currentCount = g.enemies.length;
      const densityRatio = currentCount / Math.max(1, d.targetEnemies);
      
      // 当怪物数量低于最小值时，大幅加速生成
      if (currentCount < d.minEnemies) {
        const deficit = (d.minEnemies - currentCount) / d.minEnemies;
        rate *= 1.5 + deficit * 1.5;  // 最多 3x 加速
      }
      // 当达到或超过目标数量时，变得很慢（但不完全停止）
      else if (currentCount >= d.targetEnemies) {
        rate *= 0.08;  // 保持 8% 的速率，非常慢但不停止
      }
      // 当接近目标数量时，开始减速（使用平滑曲线）
      else if (densityRatio > 0.8) {
        // 使用平滑的减速曲线，越接近目标减速越明显
        const slowFactor = 1.0 - Math.pow((densityRatio - 0.8) / 0.2, 0.8) * 0.85;
        rate *= clamp(slowFactor, 0.1, 1.0);
      }

      d.spawnRate = rate;

      // elite chance grows with strength + progress - INCREASED for more challenge
      d.eliteChance = clamp(0.04 + 0.08 * strength + 0.08 * d.progress, 0.04, 0.30);

      // ========================================
      // Boss 生成系统
      // 每隔一定时间/等级触发Boss出现
      // ========================================
      if (!d._lastBossLevel) d._lastBossLevel = 0;
      if (!d._bossCount) d._bossCount = 0;
      const bossLevelInterval = 8; // 每8级出现一个Boss
      if (g.level >= bossLevelInterval && g.level - d._lastBossLevel >= bossLevelInterval) {
        d._lastBossLevel = g.level;
        d._bossCount++;
        const bossIds = ["boss_titan", "boss_storm", "boss_hive", "boss_phantom", "boss_fortress"];
        const bossId = bossIds[(d._bossCount - 1) % bossIds.length];
        const bossDef = g.getEnemyDef(bossId);
        // Boss从屏幕外随机方向生成
        const bossAng = rand(0, TAU);
        const bossDist = 600;
        const bossX = g.player.x + Math.cos(bossAng) * bossDist;
        const bossY = g.player.y + Math.sin(bossAng) * bossDist;
        g.createEnemyFromDef(bossDef, bossX, bossY, t);
      }

      // budgeted spawn
      d.spawnBudget = safeNonNeg(d.spawnBudget + d.spawnRate * dt, 0);

      let spawned = 0;
      const maxLoop = 10;
      // 无最大值限制，只要有预算就生成
      while (d.spawnBudget >= 1 && spawned < maxLoop) {
        g.spawnEnemy(t);
        d.spawnBudget -= 1;
        spawned++;
      }
    };

    // ------------------------------
    // Enemy Definitions (13 types total = 原有3 + 新增10)
    // 简约建模 + 不同参数/行为
    // ------------------------------
    g.enemyDefs = [
      { id:"grunt",    name:"小兵",   model:"square",      color:"#ff3b30", w:30, h:30, hp:30,  speed:1.00, damage:1.00, exp:1.00, ai:"chase",   weight:45, unlock:0.00 },
      { id:"runner",   name:"跑者",   model:"diamond",     color:"#34c759", w:24, h:24, hp:22,  speed:1.55, damage:0.95, exp:0.85, ai:"chase",   weight:25, unlock:0.00 },

      // 新增威胁性怪物
      { id:"brute",    name:"蛮牛",   model:"rectWide",    color:"#ff9f0a", w:44, h:30, hp:60,  speed:0.85, damage:1.30, exp:1.60, ai:"chase",   weight:12, unlock:0.15 },
      { id:"tank",     name:"坦克",   model:"squareHeavy", color:"#b91c1c", w:52, h:52, hp:110, speed:0.70, damage:1.45, exp:2.40, ai:"chase",   weight:8,  unlock:0.30 },
      { id:"shielder", name:"盾兵",   model:"squareShield",color:"#9ca3af", w:34, h:34, hp:48,  speed:1.00, damage:1.10, exp:1.50, ai:"chase",   weight:10, unlock:0.20, armor:0.35 },
      { id:"zigzag",   name:"游走者", model:"triangle",    color:"#4aa3ff", w:30, h:30, hp:40,  speed:1.15, damage:1.05, exp:1.35, ai:"zigzag",  weight:10, unlock:0.25 },
      { id:"orbiter",  name:"环绕者", model:"circle",      color:"#22d3ee", w:30, h:30, hp:42,  speed:1.10, damage:1.05, exp:1.40, ai:"orbit",   weight:9,  unlock:0.30, orbitR:170 },
      { id:"dasher",   name:"冲锋者", model:"diamondSharp",color:"#ffd60a", w:28, h:28, hp:36,  speed:1.05, damage:1.25, exp:1.45, ai:"dash",    weight:10, unlock:0.20 },
      { id:"ranger",   name:"游侠",   model:"capsule",     color:"#60a5fa", w:34, h:22, hp:46,  speed:1.10, damage:1.10, exp:1.50, ai:"kite",    weight:7,  unlock:0.35, keepDist:200 },
      { id:"spawner",  name:"召唤者", model:"pentagon",    color:"#e5e7eb", w:38, h:38, hp:70,  speed:0.80, damage:1.20, exp:2.20, ai:"spawner", weight:5,  unlock:0.45, spawnMinions:true },
      { id:"splitter", name:"分裂体", model:"circleDot",   color:"#a855f7", w:40, h:40, hp:78,  speed:0.90, damage:1.25, exp:2.60, ai:"chase",   weight:4,  unlock:0.50, splitOnDeath:true, splitCount:3, splitType:"swarm" },
      { id:"swarm",    name:"蜂群",   model:"tiny",        color:"#fbbf24", w:18, h:18, hp:14,  speed:1.80, damage:0.80, exp:0.55, ai:"chase",   weight:6,  unlock:0.00, minion:true },

      // 新增高威胁怪物类型
      { id:"predictor",name:"预言者", model:"eye",         color:"#ff6b6b", w:32, h:32, hp:45,  speed:1.20, damage:1.15, exp:1.70, ai:"predict", weight:8,  unlock:0.25 },
      { id:"flanker",  name:"侧翼者", model:"arrow",       color:"#10b981", w:26, h:26, hp:35,  speed:1.35, damage:1.10, exp:1.40, ai:"flank",   weight:9,  unlock:0.20 },
      { id:"shooter",  name:"射手",   model:"star",        color:"#f472b6", w:28, h:28, hp:32,  speed:0.75, damage:1.00, exp:1.80, ai:"ranged",  weight:6,  unlock:0.35, shootInterval:1.8, bulletSpeed:280 },

      // 原有精英（依然保留，但生成由 director.eliteChance 控制）- 增强
      { id:"elite",    name:"精英",   model:"hex",         color:"#a855f7", w:58, h:58, hp:180, speed:1.00, damage:1.90, exp:4.20, ai:"chase",   weight:2,  unlock:0.55, elite:true },

      // ========== Boss 敌人 ==========
      // Boss在特定进度阶段由director生成，拥有极高血量和特殊行为
      { id:"boss_titan",    name:"泰坦",     model:"squareHeavy", color:"#dc2626", w:80, h:80, hp:2000,  speed:0.55, damage:3.00, exp:20.0, ai:"chase",   weight:0, unlock:1.0, boss:true, armor:0.25 },
      { id:"boss_storm",    name:"风暴领主", model:"hex",         color:"#7c3aed", w:72, h:72, hp:1500,  speed:1.20, damage:2.50, exp:18.0, ai:"orbit",   weight:0, unlock:1.0, boss:true, orbitR:200, shootInterval:1.2, bulletSpeed:350 },
      { id:"boss_hive",     name:"虫巢母体", model:"pentagon",    color:"#065f46", w:90, h:90, hp:2500,  speed:0.40, damage:2.00, exp:25.0, ai:"spawner", weight:0, unlock:1.0, boss:true, spawnMinions:true },
      { id:"boss_phantom",  name:"幻影刺客", model:"diamondSharp",color:"#e11d48", w:50, h:50, hp:1200,  speed:1.60, damage:3.50, exp:22.0, ai:"dash",    weight:0, unlock:1.0, boss:true },
      { id:"boss_fortress", name:"钢铁堡垒", model:"squareShield",color:"#475569", w:100,h:100,hp:4000,  speed:0.30, damage:2.00, exp:30.0, ai:"chase",   weight:0, unlock:1.0, boss:true, armor:0.50, shootInterval:2.0, bulletSpeed:220 }
    ];

    g.getEnemyDef = (id) => {
      for (let i = 0; i < g.enemyDefs.length; i++) if (g.enemyDefs[i].id === id) return g.enemyDefs[i];
      return g.enemyDefs[0];
    };

    g.pickEnemyDef = (t) => {
      const d = g.director || { progress: 0, eliteChance: 0.04 };
      const prog = clamp(d.progress || 0, 0, 1);

      // elite roll (separate: prevents weight explosion)
      if (Math.random() < (d.eliteChance || 0.04)) return g.getEnemyDef("elite");

      // weighted pick among non-elite, gated by progress
      let total = 0;
      for (let i = 0; i < g.enemyDefs.length; i++) {
        const def = g.enemyDefs[i];
        if (def.elite) continue;
        if (def.boss) continue;
        const unlock = def.unlock || 0;
        if (prog < unlock) continue;

        const w = safeNonNeg(def.weight || 1, 1) * (1 + (d.strength || 0) * 0.35);
        total += w;
      }
      if (total <= 0) return g.getEnemyDef("grunt");

      let r = Math.random() * total;
      for (let i = 0; i < g.enemyDefs.length; i++) {
        const def = g.enemyDefs[i];
        if (def.elite) continue;
        if (def.boss) continue;
        const unlock = def.unlock || 0;
        if (prog < unlock) continue;

        const w = safeNonNeg(def.weight || 1, 1) * (1 + (d.strength || 0) * 0.35);
        r -= w;
        if (r <= 0) return def;
      }
      return g.getEnemyDef("grunt");
    };

    g.createEnemyFromDef = (def, x, y, t, opts = null) => {
      const d = g.director || { diff: 1.0 };
      const diff = safeNumber(d.diff, 1.0);

      const w = safeNonNeg(def.w, 30);
      const h = safeNonNeg(def.h, 30);

      const hpBase = safeNonNeg(def.hp, 30);
      // Boss类型享受额外的玩家攻击力缩放加成
      let hpMul = diff;
      if (def.boss) {
        const playerDmg = safeNumber(g.bulletDamage, 15);
        const bossDmgScale = 1.0 + clamp(Math.log2(Math.max(1, playerDmg / 15)), 0, 5) * 0.8;
        hpMul *= bossDmgScale;
      }
      const hp = clamp(hpBase * hpMul, 1, 500000);

      // Apply speed multiplier based on player speed and combat power
      // "让敌人的速度不是基于战力是基于我的移速 再根据我的战力提升一点"
      const playerSpeed = GameConfig.basePlayerSpeed * safeNumber(g.playerSpeedMulti, 1.0);
      const baseRatio = 0.45; // 基础速度比率 (敌人速度约为玩家的45%)
      const strengthMod = 1.0 + safeNumber(d.strength, 0) * 0.12; // 战力微调 (0.12系数)
      
      const speed = safeNonNeg(playerSpeed * baseRatio * safeNonNeg(def.speed, 1.0) * strengthMod, 10);

      const enemy = {
        id: nextId(),
        typeId: def.id,
        typeName: def.name,
        model: def.model,
        ai: def.ai || "chase",
        x, y,
        w, h,
        rot: 0,
        color: def.color,
        baseColor: def.color,
        hp,
        maxHp: hp,
        speed,
        armor: clamp(safeNumber(def.armor, 0), 0, 0.85),
        damageMul: clamp(safeNumber(def.damage, 1.0), 0.2, 5.0),
        expMul: clamp(safeNumber(def.exp, 1.0), 0.1, 50.0),

        // behavior params
        orbitR: def.orbitR || 180,
        keepDist: def.keepDist || 220,
        spawnMinions: !!def.spawnMinions,
        splitOnDeath: !!def.splitOnDeath,
        splitCount: def.splitCount || 0,
        splitType: def.splitType || "swarm",

        // NEW: ranged attack params for shooter type
        shootInterval: def.shootInterval || 2.0,
        bulletSpeed: def.bulletSpeed || 250,
        nextShot: t + rand(0.5, 1.5),

        // runtime
        frozenUntil: 0,
        slowedUntil: 0,
        burnEnd: null,
        poisonEnd: null,
        nextDash: 0,
        dashEnd: 0,
        nextSpawn: 0,
        aiSeed: rand(0, 1000),

        // NEW: prediction and flanking state
        predictedX: x,
        predictedY: y,
        flankAngle: rand(0, TAU),
      };

      if (opts && opts.isMinion) enemy._minion = true;
      if (def.boss) enemy.isBoss = true;

      g.enemies.push(enemy);
      return enemy;
    };

    g.spawnMinions = (fromEnemy, count, t) => {
      const def = g.getEnemyDef("swarm");
      const n = Math.max(1, count | 0);
      for (let i = 0; i < n; i++) {
        const ang = rand(0, TAU);
        const rr = rand(10, 22);
        g.createEnemyFromDef(def, fromEnemy.x + Math.cos(ang)*rr, fromEnemy.y + Math.sin(ang)*rr, t, { isMinion: true });
      }
    };

    g.computeExpDrop = (enemy, t) => {
      // Base exp: type multiplier + difficulty + some "risk bonus"
      const d = g.director || { diff: 1.0 };
      const diff = safeNumber(d.diff, 1.0);
      const hpRatio = clamp(g.playerHealth / Math.max(1, g.playerMaxHealth), 0, 1);

      const base = 10;
      const typeMul = clamp(safeNumber(enemy.expMul, 1.0), 0.1, 50.0);

      // grow moderately with sqrt(diff) to avoid overflow
      const diffMul = 1 + Math.sqrt(Math.max(0, diff - 1)) * 0.55;

      // low HP comeback bonus (up to +25%)
      const risk = clamp((0.35 - hpRatio) / 0.35, 0, 1);
      const riskMul = 1 + 0.25 * risk;

      // slight streak bonus (up to +15%)
      const streakMul = 1 + Math.min(0.15, (g.killStreak || 0) * 0.01);

      const rng = rand(0.92, 1.08);

      let xp = clamp(base * typeMul * diffMul * riskMul * streakMul * rng, 1, 1200);
      if (enemy && enemy._minion) xp *= 0.65;
      return xp;
    };

  g.getClosestEnemy = (pos = null) => {
      const fromX = pos ? pos.x : g.player.x;
      const fromY = pos ? pos.y : g.player.y;
      let best = null;
      let bestD2 = Infinity;
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead || e._killQueued) continue;
        const dx = e.x - fromX;
        const dy = e.y - fromY;
        const d2 = dx*dx + dy*dy;
        if (d2 < bestD2) { bestD2 = d2; best = e; }
      }
      return best;
    };

    g.findEnemyCluster = (searchRadius = 300) => {
      const aliveEnemies = g.enemies.filter(e => !e._dead && !e._killQueued);
      if (aliveEnemies.length === 0) return null;
      if (aliveEnemies.length === 1) return { x: aliveEnemies[0].x, y: aliveEnemies[0].y };

      let bestPos = null;
      let bestCount = 0;

      for (let i = 0; i < aliveEnemies.length; i++) {
        const center = aliveEnemies[i];
        let count = 0;
        for (let j = 0; j < aliveEnemies.length; j++) {
          const e = aliveEnemies[j];
          const dx = e.x - center.x;
          const dy = e.y - center.y;
          if (dx * dx + dy * dy < searchRadius * searchRadius) {
            count++;
          }
        }
        if (count > bestCount) {
          bestCount = count;
          bestPos = { x: center.x, y: center.y };
        }
      }

      return bestPos;
    };

    g.isEnemyInFiringDirection = (enemy) => {
      const target = g.getClosestEnemy();
      if (!target) return false;
      const firingAngle = Math.atan2(target.y - g.player.y, target.x - g.player.x);
      const enemyAngle = Math.atan2(enemy.y - g.player.y, enemy.x - g.player.x);
      return Math.abs(firingAngle - enemyAngle) < 0.5;
    };

    // ------------------------------
    // Effects (visual)
    // ------------------------------
    g.createHitEffect = (pos, t) => {
      g.effects.push({ kind:"hit", x: pos.x, y: pos.y, start: t, end: t + 0.10 });
    };

    g.createExplosionEffect = (pos, radius, t) => {
      const r = radius != null ? radius : g.areaDamageRadius;
      g.effects.push({ kind:"explosion", x: pos.x, y: pos.y, r, start: t, end: t + 0.20 });
    };

    g.showDamageNum = (pos, val, isCrit, isLucky, t) => {
      // Always keep the UI stable (no NaN/Infinity / crazy-long strings)
      const num = (typeof val === "number") ? safeNonNeg(val, 0) : safeNonNeg(parseFloat(val), 0);
      const text = (typeof val === "string") ? val : formatShort(num);

      g.effects.push({
        kind:"damageText",
        x: pos.x,
        y: pos.y - 10,
        val: text,
        isCrit: !!isCrit,
        isLucky: !!isLucky,
        start: t,
        end: t + 0.50
      });
    };

    // ------------------------------
    // Damage numbers: always show (DOT is auto-aggregated to prevent spam)
    // ------------------------------
    g.damageTextDotInterval = 0.12;
    g.damageTextMin = 0.75;

    g._accumulateDamageText = (enemy, amount, t, isCrit, isLucky) => {
      if (!enemy) return;

      if (!enemy._dmgText) {
        enemy._dmgText = { acc: 0, crit: false, lucky: false, next: 0 };
      }
      const st = enemy._dmgText;
      st.acc = safeNonNeg(st.acc + amount, 0);
      st.crit = st.crit || !!isCrit;
      st.lucky = st.lucky || !!isLucky;

      if (!st.next || st.next < t) st.next = t + g.damageTextDotInterval;

      if (t >= st.next) {
        // Avoid "0" spam: only show when it has built up a bit.
        if (st.acc >= g.damageTextMin) {
          g.showDamageNum({x:enemy.x, y:enemy.y}, st.acc, st.crit, st.lucky, t);
          st.acc = 0;
          st.crit = false;
          st.lucky = false;
        }
        st.next = t + g.damageTextDotInterval;
      }
    };

    g.flushDamageText = (enemy, t) => {
      const st = enemy && enemy._dmgText;
      if (st && st.acc > 0) {
        g.showDamageNum({x:enemy.x, y:enemy.y}, st.acc, st.crit, st.lucky, t);
        st.acc = 0;
        st.crit = false;
        st.lucky = false;
        st.next = t + g.damageTextDotInterval;
      }
    };

    // ------------------------------
    // Kill queue (avoid recursive kill chains / stack overflow)
    // ------------------------------
    g.queueKill = (enemy, t) => {
      if (!enemy || enemy._killed || enemy._killQueued) return;
      enemy._killQueued = true;
      g._killQueue.push({ enemy, t });
    };

    g.processKillQueue = (t) => {
      let guard = 0;
      let idx = 0;
      const q = g._killQueue;
      while (idx < q.length && guard < 20000) {
        const item = q[idx++];
        const e = item.enemy;
        if (!e || e._killed) { guard++; continue; }

        // Flush any pending DOT number so the final damage doesn't get lost
        g.flushDamageText(e, item.t);

        e._killed = true;
        e._killQueued = false;
        g.killEnemy(e, item.t);

        guard++;
      }
      if (idx > 0) {
        if (idx >= q.length) q.length = 0;
        else q.splice(0, idx);
      }
      if (guard >= 20000) {
        console.warn("processKillQueue: guard tripped, clearing queue to prevent freeze.");
        g._killQueue.length = 0;
      }
    };

  g.showDodgeEffect = (t) => {
      g.effects.push({ kind:"label", text:"DODGE!", x:g.player.x, y:g.player.y, start:t, end:t+0.50, color:"#00d7ff" });
    };
    g.showBlockEffect = (t) => {
      g.effects.push({ kind:"label", text:"BLOCK!", x:g.player.x, y:g.player.y, start:t, end:t+0.50, color:"#ffffff" });
    };
    g.showPhoenixEffect = (t) => {
      g.effects.push({ kind:"phoenix", x:g.player.x, y:g.player.y, start:t, end:t+0.50 });
    };

    g.flash = (color, intensity, duration, t) => {
      g.screenFlash = { color, intensity, start: t, end: t + duration };
    };

    g.hitStop = (duration, scale, t) => {
      // scale < 1 => slow motion (hit stop)
      // 注意：默认关闭“减速时间”的 hit stop，避免出现“移动卡一下”（FPS 仍然 60）的错觉。
      // 需要时可在 GameConfig.hitStopEnabled 打开。
      if (!GameConfig.hitStopEnabled) return;
      g.hitStopEnd = Math.max(g.hitStopEnd || 0, t + duration);
      g.hitStopScale = Math.min(g.hitStopScale || 1.0, scale);
    };

    g.emitBurst = (pos, count, color, t, speed = 420) => {
      // Budget particles per-frame to avoid kill spikes freezing the main thread.
      const totalCap = 900;
      const frameCap = 240;
      const remainTotal = totalCap - g.particles.length;
      const remainFrame = frameCap - (g._fxParticlesThisFrame || 0);
      const n = Math.min(count || 0, remainTotal, remainFrame);
      if (n <= 0) return;

      g._fxParticlesThisFrame = (g._fxParticlesThisFrame || 0) + n;

      for (let i = 0; i < n; i++) {
        const ang = rand(0, TAU);
        const sp = rand(speed * 0.35, speed);
        const life = rand(0.18, 0.42);
        const r = rand(1.5, 3.8);
        g.particles.push({
          kind: "spark",
          x: pos.x, y: pos.y,
          px: pos.x, py: pos.y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          r,
          color,
          born: t,
          die: t + life
        });
      }
    };

    g.emitSparks = (pos, count, color, t, baseAngle = null) => {
      // Budget particles per-frame to avoid kill spikes freezing the main thread.
      const totalCap = 900;
      const frameCap = 240;
      const remainTotal = totalCap - g.particles.length;
      const remainFrame = frameCap - (g._fxParticlesThisFrame || 0);
      const n = Math.min(count || 0, remainTotal, remainFrame);
      if (n <= 0) return;

      g._fxParticlesThisFrame = (g._fxParticlesThisFrame || 0) + n;

      for (let i = 0; i < n; i++) {
        const ang = (baseAngle == null) ? rand(0, TAU) : (baseAngle + rand(-0.9, 0.9));
        const sp = rand(260, 680);
        const life = rand(0.10, 0.24);
        const r = rand(1.2, 3.0);
        g.particles.push({
          kind: "spark",
          x: pos.x, y: pos.y,
          px: pos.x, py: pos.y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          r,
          color,
          born: t,
          die: t + life
        });
      }
    };

    g.shakeCamera = (duration, amp, t) => {
      // backward compatible: shakeCamera(duration, t)
      if (t === undefined) { t = amp; amp = 5; }
      g.camera.shakeEnd = Math.max(g.camera.shakeEnd, t + duration);
      g.camera.shakeAmp = Math.max(g.camera.shakeAmp || 0, amp || 5);
    };

    // ------------------------------
    // Combat / Status
    // ------------------------------
    g.calculateDamage = (baseValue, target, t) => {
      let damage = baseValue;

      // 背水一战
      if (g.lowHpDamageBoost) {
        const hpRatio = g.playerHealth / g.playerMaxHealth;
        if (hpRatio < g.lowHpThreshold) damage *= g.lowHpDamageMulti;
      }

      // 临界状态
      if (g.criticalStateEnabled) {
        const hpRatio = g.playerHealth / g.playerMaxHealth;
        const bonus = 1.0 + (0.5 - Math.abs(hpRatio - 0.5)) * 2;
        damage *= bonus;
      }

      // 连杀加成
      if (g.killStreakEnabled) {
        const bonus = Math.min(g.killStreak * 0.1, g.killStreakMaxBonus);
        damage *= (1 + bonus);
      }

      // 暴怒
      if (g.rageOnHit && t < g.rageEndTime) {
        damage *= (1 + g.rageDamageBonus);
      }

      // 静止加成
      if (g.stationaryDamageBonus > 0 && !g.wasMovingLastFrame) {
        damage *= (1 + g.stationaryDamageBonus);
      }

      // 动量伤害
      if (g.momentumDamage) {
        damage *= (1 + g.currentMomentum * 0.5);
      }

      // 共生
      if (g.symbiosisEnabled) {
        const enemyCount = g.enemies.length;
        const bonus = Math.min(enemyCount * 0.05, 0.5);
        damage *= (1 + bonus);
      }

      // 清场/人海
      const nearbyEnemies = (g._nearbyEnemyCount == null) ? 0 : g._nearbyEnemyCount;
      if (g.clearingBonus && nearbyEnemies < 5) damage *= 1.5;
      if (g.crowdControl && nearbyEnemies > 10) {
        // Swift 里留空，这里保持不实现
      }

      // 赌徒模式
      if (g.gamblerMode) {
        damage *= rand(0.5, 2.0);
      }

      // 处决
      if (g.executeEnabled) {
        const targetHp = target.hp;
        const targetMaxHp = target.maxHp || targetHp;
        if ((targetHp / targetMaxHp) < g.executeThreshold) damage *= 2;
      }

      return safeNonNeg(damage, 0);
    };

    g.applyStatusEffects = (enemy, t) => {
      // 冰冻
      if (g.freezeChance > 0 && Math.random() < g.freezeChance) {
        enemy.frozenUntil = Math.max(enemy.frozenUntil || 0, t + g.freezeDuration);
        enemy.color = "#00d7ff";
        enemy.baseColorAfterFreeze = "#ff3b30"; // Swift: 解冻后强制变红
      }

      // 燃烧
      if (g.burnChance > 0 && Math.random() < g.burnChance) {
        enemy.burnEnd = t + g.burnDuration;
        enemy.burnDmg = g.burnDamage;

        if (g.burnSpread) {
          for (let i = 0; i < g.enemies.length; i++) {
            const near = g.enemies[i];
          if (near === enemy) continue;
          if (near._dead) continue;
            const dx = near.x - enemy.x, dy = near.y - enemy.y;
            if (dx*dx + dy*dy < 50*50) {
              near.burnEnd = t + g.burnDuration * 0.5;
              near.burnDmg = g.burnDamage * 0.5;
            }
          }
        }
      }

      // 毒
      if (g.poisonChance > 0 && Math.random() < g.poisonChance) {
        enemy.poisonEnd = t + g.poisonDuration;
        enemy.poisonDmg = g.poisonDamage;
      }
    };

    // 飞刀命中附加状态效果（完整实现所有飞刀技能的命中效果）
    g.applyBladeStatusEffects = (enemy, t) => {
      // === 冰冻效果 ===
      if (g.bladeOrbitFreezeChance > 0 && Math.random() < g.bladeOrbitFreezeChance) {
        // 冰晶爆裂：已冰冻的敌人被再次命中时爆炸
        if (g.bladeOrbitIceExplosion && enemy.frozenUntil && t < enemy.frozenUntil) {
          const radius = 60;
          g.createExplosionEffect({x: enemy.x, y: enemy.y}, radius, t);
          g.emitBurst({x: enemy.x, y: enemy.y}, 15, "#88ddff", t, 400);
          for (let i = 0; i < g.enemies.length; i++) {
            const near = g.enemies[i];
            if (near === enemy || near._dead) continue;
            const dx = near.x - enemy.x, dy = near.y - enemy.y;
            if (dx*dx + dy*dy < radius*radius) {
              g.applyDamageToEnemy(near, g.bladeOrbitDamage * 0.6, t);
              near.frozenUntil = Math.max(near.frozenUntil || 0, t + g.bladeOrbitFreezeDuration * 0.5);
              near.color = "#00d7ff";
              near.baseColorAfterFreeze = "#ff3b30";
            }
          }
        }

        enemy.frozenUntil = Math.max(enemy.frozenUntil || 0, t + g.bladeOrbitFreezeDuration);
        enemy.color = "#00d7ff";
        enemy.baseColorAfterFreeze = "#ff3b30";

        // 冰刃连锁：冰冻扩散到附近敌人
        if (g.bladeOrbitFreezeSpread) {
          for (let i = 0; i < g.enemies.length; i++) {
            const near = g.enemies[i];
            if (near === enemy || near._dead) continue;
            const dx = near.x - enemy.x, dy = near.y - enemy.y;
            if (dx*dx + dy*dy < 80*80) {
              near.frozenUntil = Math.max(near.frozenUntil || 0, t + g.bladeOrbitFreezeDuration * 0.5);
              near.color = "#00d7ff";
              near.baseColorAfterFreeze = "#ff3b30";
            }
          }
        }

        // 永冻飞刃：永久减速叠加
        if (g.bladeOrbitPermaFrost) {
          enemy._permaFrostSlow = Math.min((enemy._permaFrostSlow || 0) + g.bladeOrbitPermaFrostSlow, 0.80);
        }
      }

      // === 减速效果 ===
      if (g.bladeOrbitSlowChance > 0 && Math.random() < g.bladeOrbitSlowChance) {
        enemy.slowed = true;
        enemy._bladeSlowEnd = t + g.bladeOrbitSlowDuration;
        enemy._bladeSlowAmount = g.bladeOrbitSlowAmount;
      }

      // === 燃烧效果 ===
      if (g.bladeOrbitBurnChance > 0 && Math.random() < g.bladeOrbitBurnChance) {
        // 引爆：燃烧的敌人被飞刀命中时爆炸
        if (g.bladeOrbitBurnExplosion && enemy.burnEnd && t < enemy.burnEnd) {
          const radius = 50;
          g.createExplosionEffect({x: enemy.x, y: enemy.y}, radius, t);
          g.emitBurst({x: enemy.x, y: enemy.y}, 15, "#ff6600", t, 400);
          for (let i = 0; i < g.enemies.length; i++) {
            const near = g.enemies[i];
            if (near === enemy || near._dead) continue;
            const dx = near.x - enemy.x, dy = near.y - enemy.y;
            if (dx*dx + dy*dy < radius*radius) {
              g.applyDamageToEnemy(near, g.bladeOrbitDamage * 0.5, t);
              near.burnEnd = t + g.bladeOrbitBurnDuration * 0.5;
              near.burnDmg = g.bladeOrbitBurnDamage * 0.5;
            }
          }
        }

        let burnDmg = g.bladeOrbitBurnDamage;
        // 业火飞刃：燃烧伤害随时间增加
        if (g.bladeOrbitEternalFlame && enemy.burnEnd && t < enemy.burnEnd) {
          burnDmg *= 1.5; // 已经在燃烧的敌人，加重燃烧
        }

        enemy.burnEnd = t + g.bladeOrbitBurnDuration;
        enemy.burnDmg = burnDmg;
      }

      // === 中毒效果 ===
      if (g.bladeOrbitPoisonChance > 0 && Math.random() < g.bladeOrbitPoisonChance) {
        enemy.poisonEnd = t + g.bladeOrbitPoisonDuration;
        enemy.poisonDmg = g.bladeOrbitPoisonDamage;

        // 瘟疫之刃：中毒蔓延到附近敌人
        if (g.bladeOrbitPoisonSpread) {
          for (let i = 0; i < g.enemies.length; i++) {
            const near = g.enemies[i];
            if (near === enemy || near._dead) continue;
            const dx = near.x - enemy.x, dy = near.y - enemy.y;
            if (dx*dx + dy*dy < 80*80) {
              near.poisonEnd = t + g.bladeOrbitPoisonDuration * 0.5;
              near.poisonDmg = g.bladeOrbitPoisonDamage * 0.5;
            }
          }
        }

        // 致死毒刃：累积中毒层数，达到阈值杀死非Boss
        if (g.bladeOrbitPoisonInstakill) {
          enemy._bladePoisonStacks = (enemy._bladePoisonStacks || 0) + 1;
          if (enemy._bladePoisonStacks >= g.bladeOrbitPoisonInstakillStacks) {
            if (enemy.typeId !== "boss" && enemy.typeId !== "elite") {
              enemy.hp = 0;
              enemy._dead = true;
              g.queueKill(enemy, t);
              g.emitBurst({x: enemy.x, y: enemy.y}, 20, "#00ff00", t, 500);
            }
          }
        }

        // 神经毒素：中毒的敌人减速
        if (g.bladeOrbitPoisonSlow > 0) {
          enemy.slowed = true;
          enemy._bladePoisonSlowEnd = t + g.bladeOrbitPoisonDuration;
        }
      }

      // === 眩晕效果 ===
      if (g.bladeOrbitStunChance > 0 && Math.random() < g.bladeOrbitStunChance) {
        enemy.frozenUntil = Math.max(enemy.frozenUntil || 0, t + g.bladeOrbitStunDuration);
        enemy.color = "#ffff00";
        enemy.baseColorAfterFreeze = "#ff3b30";
      }
    };

    g.applyDamageToEnemy = (enemy, damage, t, meta = null) => {
      if (!enemy || enemy._dead || enemy._killed) return;

      let dmg = safeNonNeg(damage, 0);
      if (dmg <= 0) return;

      // armor（盾兵等）：按比例削减最终承受伤害
      const armor = clamp(safeNumber(enemy.armor, 0), 0, 0.85);
      if (armor > 0) dmg *= (1 - armor);
      dmg = safeNonNeg(dmg, 0);
      if (dmg <= 0) return;

      // stats / combat window
      if (g.stats) g.stats.dmgDealt = safeNonNeg((g.stats.dmgDealt || 0) + dmg, 0);
      if (g.combat && g.combat._acc) g.combat._acc.dmgDealt = safeNonNeg((g.combat._acc.dmgDealt || 0) + dmg, 0);

      // Always show damage numbers on enemies:
      // - direct hits (bullet / mine / orbital / meteor...) => immediate
      // - DOT (burn/poison/aura/blackhole...) => aggregated to avoid spam
      const isCrit = !!(meta && meta.isCrit);
      const isLucky = !!(meta && meta.isLucky);
      const immediate = !!(meta && meta.immediate);
      if (immediate) {
        g.showDamageNum({x:enemy.x, y:enemy.y}, dmg, isCrit, isLucky, t);
      } else {
        g._accumulateDamageText(enemy, dmg, t, isCrit, isLucky);
      }

      enemy.hp = safeNonNeg((enemy.hp || 0) - dmg, 0);

      // 斩杀 / 处决
      if (g.instantKillThreshold > 0 && enemy.maxHp) {
        const ratio = enemy.hp / enemy.maxHp;
        if (ratio < g.instantKillThreshold) enemy.hp = 0;
      }

      if (enemy.hp <= 0) {
        enemy.hp = 0;
        enemy._dead = true;
        g.queueKill(enemy, t);
      } else {
        // Swift: colorize flash（这里用一个短特效代替）
        const lastFx = enemy._lastHitFx || 0;
        if ((t - lastFx) > 0.08 && g.effects.length < 1200) {
          enemy._lastHitFx = t;
          g.effects.push({ kind:"enemyHit", x: enemy.x, y: enemy.y, start:t, end:t+0.10 });
        }
      }
    };

    g.killEnemy = (enemy, t) => {
      if (!enemy || enemy._removed) return;
      enemy._removed = true;

      const pos = { x: enemy.x, y: enemy.y };

      // 爽感：击杀爆裂 + 震屏 + 音效（精英更猛）
      const isElite = (enemy.typeId === "elite") || (enemy.maxHp >= 140);
      SFX.kill(t, isElite);
      g.hitStop(isElite ? 0.07 : 0.05, isElite ? 0.16 : 0.22, t);
      g.shakeCamera(isElite ? 0.18 : 0.12, isElite ? 12 : 8, t);
      g.flash("#ff9f0a", isElite ? 0.18 : 0.12, 0.12, t);
      g.emitBurst(pos, isElite ? 28 : 18, isElite ? "#ff9f0a" : "#ffd60a", t, isElite ? 720 : 560);

      // 死亡爆炸
      if (g.deathExplosion) {
        g.createExplosionEffect(pos, g.deathExplosionRadius, t);
        for (let i = 0; i < g.enemies.length; i++) {
          const near = g.enemies[i];
          if (near === enemy) continue;
          const dx = near.x - pos.x, dy = near.y - pos.y;
          if (dx*dx + dy*dy < g.deathExplosionRadius*g.deathExplosionRadius) {
            g.applyDamageToEnemy(near, g.bulletDamage * 0.5, t);
          }
        }
      }

      // 毒爆
      if (g.poisonExplode && enemy.poisonEnd != null) {
        g.createPoisonExplosion(pos, t);
      }

      // 连杀
      g.killStreak += 1;
      g.lastKillTime = t;

      // stats / combat window
      if (g.stats) g.stats.kills = (g.stats.kills || 0) + 1;
      if (g.combat && g.combat._acc) g.combat._acc.kills = (g.combat._acc.kills || 0) + 1;

      // 击杀回血
      if (g.killHealAmount > 0) g.heal(g.killHealAmount);

      // 时间扭曲
      if (g.timeWarpOnKill && Math.random() < 0.1) {
        g.timeWarpActive = true;
        g.timeWarpEndTime = t + 2.0;
      }

      // 掉落经验（按类型/强度/风险）
      const xp = g.computeExpDrop(enemy, t);
      g.spawnExpOrb(pos, xp, enemy.baseColor);

      // 分裂（分裂体死亡后生成蜂群）
      if (enemy.splitOnDeath && enemy.splitCount > 0) {
        g.spawnMinions(enemy, enemy.splitCount, t);
      }

      // Note: we no longer splice the enemies array here (that caused O(n) shifts + frame hitches).
      // Actual removal happens in the main cleanup pass (swap-remove).
      
      // === 飞刀击杀效果 ===
      if (enemy._lastHitByBlade) {
        // 雷神之怒：飞刀击杀后释放闪电
        if (g.bladeOrbitKillLightning) {
          g.triggerChainLightning(enemy, g.bladeOrbitDamage * 0.8, 3, t);
          g.emitBurst(pos, 12, "#88ddff", t, 400);
        }

        // 天降飞刀：击杀触发天降
        if (g.bladeOrbitSkyfall) {
          // 击杀时有30%几率额外触发天降
          if (Math.random() < 0.3) {
            g.triggerBladeSkyfall(t);
          }
        }

        // 刀阵自爆：击杀时有20%几率触发爆发
        if (g.bladeOrbitBurst) {
          if (Math.random() < 0.2) {
            g.triggerBladeBurst(t);
          }
        }

        // 轮回飞刃：飞刀击杀额外经验
        if (g.bladeOrbitExpBonus > 0 && Math.random() < g.bladeOrbitExpBonus) {
          const bonusXp = g.computeExpDrop(enemy, t) * 0.5;
          g.spawnExpOrb(pos, bonusXp, "#88ff88");
        }
      }

      // NEW: 魔法系统击杀回调
      if (window.MagicSystemLogic && window.MagicSystemLogic.onMagicKill) {
        window.MagicSystemLogic.onMagicKill(g, enemy, t);
      }
    };

    g.triggerChainLightning = (fromEnemy, damage, remaining, t) => {
      if (remaining <= 0) return;

      // Swift: 遍历 children，找到第一个满足距离的敌人
      let target = null;
      let bestD2 = Infinity;
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead) continue;
        if (e === fromEnemy) continue;
        const dx = e.x - fromEnemy.x, dy = e.y - fromEnemy.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < 150*150 && d2 < bestD2) { bestD2 = d2; target = e; }
      }
      if (!target) return;

      // Lightning visual
      g.effects.push({ kind:"line", x1: fromEnemy.x, y1: fromEnemy.y, x2: target.x, y2: target.y, start:t, end:t+0.20 });

      g.applyDamageToEnemy(target, damage, t, { immediate: true });
      g.triggerChainLightning(target, damage * g.chainDamageDecay, remaining - 1, t);
    };

    // ------------------------------
    // Projectile creation
    // ------------------------------
    g.createBullet = (angle, t, override = null) => {
      const scale = g.bulletScale;
      const w = 8 * scale;
      const h = 20 * scale;

      const speed = (override && override.speed != null) ? override.speed : (GameConfig.baseBulletSpeed * g.bulletSpeedMulti);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      // charge bonus
      let bonusDamage = 1.0;
      if (!override?.noCharge && g.chargeAttackEnabled && g.currentCharge > 0) {
        bonusDamage = 1.0 + g.currentCharge;
        g.currentCharge = 0;
      }

      const bullet = {
        id: nextId(),
        x: g.player.x,
        y: g.player.y,
        w,
        h,
        rot: angle - Math.PI/2,
        vx,
        vy,
        born: t,
        die: t + (override && override.life != null ? override.life : g.bulletLifetime),
        pierceLeft: (override && override.pierceLeft != null) ? override.pierceLeft : g.pierceCount,
        chargeBonus: (override && override.chargeBonus != null) ? override.chargeBonus : bonusDamage,
        hitIds: []
      };
      g.bullets.push(bullet);
    };

    g.createSplitBullet = (pos, angle, t) => {
      const speed = GameConfig.baseBulletSpeed * 0.7;
      const b = {
        id: nextId(),
        x: pos.x,
        y: pos.y,
        w: 6,
        h: 12,
        rot: angle - Math.PI/2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        born: t,
        die: t + 0.8,
        pierceLeft: 0,
        chargeBonus: 1.0,
        hitIds: []
      };
      g.bullets.push(b);
    };

    // Drone bullet uses same bullet system
    g.fireDroneBullet = (drone, target, t) => {
      const dx = target.x - drone.x, dy = target.y - drone.y;
      const angle = Math.atan2(dy, dx);
      const speed = 400;
      const b = {
        id: nextId(),
        x: drone.x,
        y: drone.y,
        w: 4,
        h: 8,
        rot: angle - Math.PI/2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        born: t,
        die: t + 1.5,
        pierceLeft: 0,
        chargeBonus: 1.0,
        hitIds: [],
        droneBullet: true
      };
      g.bullets.push(b);
    };

    g.shoot = (t) => {
      const target = g.getClosestEnemy();
      if (!target) return;

      const dx = target.x - g.player.x;
      const dy = target.y - g.player.y;
      const baseAngle = Math.atan2(dy, dx);

      // SFX + muzzle flash
      SFX.shoot(t);
      g.effects.push({ kind:"muzzle", x:g.player.x, y:g.player.y, ang: baseAngle, start:t, end:t+0.06 });

      if (g.allDirectionFire) {
        for (let i = 0; i < g.bulletCount; i++) {
          const angle = i * (TAU / g.bulletCount);
          g.createBullet(angle, t);
        }
      } else {
        const totalSpread = (g.bulletCount - 1) * g.spreadAngle;
        const startAngle = baseAngle - totalSpread / 2;
        for (let i = 0; i < g.bulletCount; i++) {
          const angle = startAngle + i * g.spreadAngle;
          g.createBullet(angle, t);
        }
      }

      // recoil
      if (g.recoilPush) {
        g.player.x -= Math.cos(baseAngle) * 5;
        g.player.y -= Math.sin(baseAngle) * 5;
      }
      
      // NEW: 魔法系统射击回调
      if (window.MagicSystemLogic && window.MagicSystemLogic.onMagicShoot) {
        window.MagicSystemLogic.onMagicShoot(g, t);
      }
    };

    // ------------------------------
    // Collisions handlers
    // ------------------------------
    g.handleBulletHit = (bullet, enemy, t) => {
      // Damage
      let damage = g.calculateDamage(g.bulletDamage, enemy, t);

      // charge bonus
      damage *= (bullet.chargeBonus || 1.0);

      // vulnerability
      if (enemy.vulnerableUntil != null && t < enemy.vulnerableUntil) {
        damage *= (1 + g.vulnerabilityBonus);
      }

      // crit
      let isCrit = false;
      let actualCritRate = g.critRate;
      if (g.revengeEnabled && g.revengeNextCrit) {
        actualCritRate = 1.0;
        g.revengeNextCrit = false;
      }
      if (Math.random() < actualCritRate) {
        damage *= g.critDamageMulti;
        isCrit = true;
      }

      // lucky crit
      let isLucky = false;
      const luckyRoll = Math.random();
      if (luckyRoll < g.luckyCritChance) {
        isLucky = true;
        damage *= g.luckyCritMulti;
      }

      // apply (always show damage number on enemy)
      g.applyDamageToEnemy(enemy, damage, t, { isCrit, isLucky, immediate: true });

      // juice feedback
      const bigHit = (isCrit || isLucky);
      SFX.hit(t, bigHit);
      g.hitStop(bigHit ? 0.05 : 0.03, bigHit ? 0.22 : 0.34, t);
      g.shakeCamera(bigHit ? 0.10 : 0.06, bigHit ? 7 : 3, t);
      g.emitSparks({x:enemy.x, y:enemy.y}, bigHit ? 12 : 7, "#ffd60a", t, Math.atan2(bullet.vy, bullet.vx));

      // NEW: Cyber Bullet Effects
      if (g.cyber) {
          // Plasma Bullet (Explosion)
          if (g.cyber.elem_plasma_bullet) {
              g.createExplosionEffect({x:enemy.x, y:enemy.y}, 30, t);
              // Area dmg
              const pDmg = damage * 0.3 * g.cyber.elem_plasma_bullet;
              for(let i=0; i<g.enemies.length; i++) {
                 const e = g.enemies[i];
                 if(e===enemy || e._dead) continue;
                 const d2 = (e.x-enemy.x)**2 + (e.y-enemy.y)**2;
                 if(d2 < 30*30) g.applyDamageToEnemy(e, pDmg, t);
              }
          }
          // Neon Bullet (Chain + Stun)
          if (g.cyber.elem_neon_bullet) {
             if (Math.random() < 0.2) {
                enemy.slowed = true; 
                enemy._ghostSlowUntil = t + 0.5 + 0.1 * g.cyber.elem_neon_bullet;
             }
             if (Math.random() < 0.2) {
                 g.triggerChainLightning(enemy, damage * 0.4, Math.floor(g.cyber.elem_neon_bullet), t);
             }
          }
          // Void Bullet (Execute)
          if (g.cyber.elem_void_bullet) {
             const hpRatio = enemy.hp / enemy.maxHp;
             if (hpRatio < 0.05 * g.cyber.elem_void_bullet) {
                 g.applyDamageToEnemy(enemy, 999999, t, { immediate:true, isCrit:true });
                 // Small blackhole chance
                 if(Math.random()<0.05) g.createBlackHole({x:enemy.x, y:enemy.y}, t, true);
             }
          }
      }

      // status
      g.applyStatusEffects(enemy, t);

      // knockback
      let kForce = g.knockbackForce;

      // Fix: Explosion knockback should also affect the primary target
      if (g.explosionKnockback) kForce += 150; 

      // NEW: Tech overrides
      if (bullet.isPulse) kForce += 300;
      if (g.tech && g.tech.railgunActive && Math.random() < g.tech.railgunChance) {
        kForce += g.tech.railgunForce;
        // Railgun effect
        g.emitSparks({x:enemy.x, y:enemy.y}, 5, "#00ffff", t);
      }

      if (kForce > 0) {
        const vx = enemy.x - bullet.x, vy = enemy.y - bullet.y;
        const len = hypot(vx, vy) || 1;
        // Fix: Increased knockback multiplier from 0.1 to 0.4 so it's actually noticeable
        enemy.x += (vx/len) * kForce * 0.4;
        enemy.y += (vy/len) * kForce * 0.4;
      }

      // area damage
      if (g.areaDamageRadius > 0) {
        g.createExplosionEffect({x:enemy.x, y:enemy.y}, g.areaDamageRadius, t);
        for (let i = 0; i < g.enemies.length; i++) {
          const near = g.enemies[i];
          if (near === enemy) continue;
          const dx = near.x - enemy.x, dy = near.y - enemy.y;
          if (dx*dx + dy*dy < g.areaDamageRadius*g.areaDamageRadius) {
            g.applyDamageToEnemy(near, damage * 0.5, t, { isCrit, isLucky, immediate: true });
            if (g.explosionKnockback) {
              const len = hypot(dx, dy) || 1;
              near.x += (dx/len) * 50;
              near.y += (dy/len) * 50;
            }
          }
        }
      } else {
        g.createHitEffect({x:bullet.x, y:bullet.y}, t);
      }

      // chain lightning
      if (g.chainLightning) {
        g.triggerChainLightning(enemy, damage * g.chainDamageDecay, g.chainCount, t);
      }

      // split
      if (g.splitOnHit) {
        const currentAngle = Math.atan2(bullet.vy, bullet.vx);
        const half = Math.floor(g.splitCount / 2);
        for (let i = 0; i < g.splitCount; i++) {
          const splitAngle = currentAngle + (i - half) * 0.5;
          g.createSplitBullet({x:enemy.x, y:enemy.y}, splitAngle, t);
        }
      }

      // lifesteal
      if (Math.random() < g.lifestealChance) {
        g.heal(damage * g.lifestealPercent);
      }

      // vulnerability mark
      if (g.vulnerabilityMark) {
        enemy.vulnerableUntil = t + 3.0;
      }

      // pierce
      if (bullet.pierceLeft > 0) {
        bullet.pierceLeft -= 1;
      } else {
        bullet._dead = true;
      }

      // overload
      if (Math.random() < g.overloadChance) {
        g.shoot(t);
      }
      
      // NEW: 魔法系统子弹命中回调
      if (window.MagicSystemLogic && window.MagicSystemLogic.onMagicBulletHit) {
        window.MagicSystemLogic.onMagicBulletHit(g, bullet, enemy, t, isCrit);
      }
    };

    g.handleOrbitalHit = (orbital, enemy, t) => {
      // 按类型分别计算基础伤害
      let damage;
      if (orbital.type === "shield") {
        damage = g.orbitalShieldDamage;
        g.applyDamageToEnemy(enemy, damage, t, { immediate: true });
        return;
      }
      // ---- 以下全部是飞刀(blade)逻辑 ----
      damage = g.bladeOrbitDamage;

      // 破甲飞刃：无视敌人护甲（临时降低）
      let savedArmor = 0;
      if (g.bladeOrbitArmorPen > 0 && enemy.armor > 0) {
        savedArmor = enemy.armor;
        enemy.armor = Math.max(0, enemy.armor * (1 - g.bladeOrbitArmorPen));
      }

      // 蓄力飞刀：根据旋转圈数增加伤害
      if (g.bladeOrbitChargeBonus > 0) {
        damage *= (1 + g.bladeOrbitChargeBonus * g._bladeChargeRotations);
      }

      // 怒刃：生命越低伤害越高（最高+100%）
      if (g.bladeOrbitRageDamage && g.playerMaxHealth > 0) {
        const hpRatio = g.playerHealth / g.playerMaxHealth;
        damage *= (1 + (1 - hpRatio));
      }

      // 反击飞刃：受伤后短时间加成
      if (g.bladeOrbitCounterAttack && t < g._bladeCounterEnd) {
        damage *= (1 + g.bladeOrbitCounterBonus);
      }

      // 冰碎：对冰冻敌人额外伤害
      if (g.bladeOrbitFrozenBonusDamage > 1 && enemy.frozenUntil && t < enemy.frozenUntil) {
        damage *= g.bladeOrbitFrozenBonusDamage;
      }

      // 火焰爆发：对燃烧敌人额外伤害
      if (g.bladeOrbitBurnBonusDamage > 1 && enemy.burnEnd && t < enemy.burnEnd) {
        damage *= g.bladeOrbitBurnBonusDamage;
      }

      // 致命毒素：中毒敌人受到所有伤害增加
      if (g.bladeOrbitPoisonWeaken > 0 && enemy.poisonEnd && t < enemy.poisonEnd) {
        damage *= (1 + g.bladeOrbitPoisonWeaken);
      }

      // 死亡飞刀：斩杀低血量敌人
      if (g.bladeOrbitExecute && enemy.maxHp > 0) {
        const ratio = enemy.hp / enemy.maxHp;
        if (ratio < g.bladeOrbitExecuteThreshold) {
          damage *= g.bladeOrbitExecuteMult;
        }
      }

      // 飞刀暴击系统
      let isCrit = false;
      if (g.bladeOrbitCritChance > 0 && Math.random() < g.bladeOrbitCritChance) {
        damage *= g.bladeOrbitCritDamage;
        isCrit = true;
      }

      // 血祭飞刃：消耗当前生命5%增加伤害（已在技能定义中×2伤害）
      if (g.bladeOrbitBloodSacrifice) {
        const cost = g.playerHealth * 0.005; // 每次命中消耗0.5%
        if (g.playerHealth > cost + 1) {
          g.playerHealth -= cost;
        }
      }

      // 应用伤害
      g.applyDamageToEnemy(enemy, damage, t, { immediate: true, isCrit: isCrit });

      // 恢复护甲
      if (savedArmor > 0) enemy.armor = savedArmor;

      // 爽感：飞刀命中受击颜色 + 刀光 + 火花 + 音效
      enemy.hitFlashEnd = Math.max(enemy.hitFlashEnd || 0, t + 0.08);
      g.effects.push({ kind:"slash", x: enemy.x, y: enemy.y, ang: orbital.rot, start: t, end: t + 0.12 });
      g.emitSparks({x:enemy.x, y:enemy.y}, isCrit ? 18 : 10, isCrit ? "#ffff00" : "#ffffff", t, orbital.rot);
      SFX.blade(t);
      g.hitStop(0.02, 0.35, t);
      g.shakeCamera(isCrit ? 0.10 : 0.07, isCrit ? 6 : 4, t);

      // 飞刀命中附加状态效果
      g.applyBladeStatusEffects(enemy, t);

      // 吸血飞刃
      if (g.bladeOrbitLifestealChance > 0 && Math.random() < g.bladeOrbitLifestealChance) {
        const healAmt = damage * g.bladeOrbitLifestealPercent;
        if (g.bladeOrbitOverhealShield && g.playerHealth >= g.playerMaxHealth) {
          g._bladeOverhealShield = Math.min((g._bladeOverhealShield || 0) + healAmt, g.playerMaxHealth * 0.5);
        } else {
          g.heal(healAmt);
        }
      }

      // 荆棘飞刀：命中敌人后标记，攻击该敌人回复生命
      if (g.bladeOrbitThornHeal) {
        g.heal(1);
      }

      // 爆裂飞刃：命中产生爆炸
      if (g.bladeOrbitExplosion) {
        const radius = g.bladeOrbitExplosionRadius || 30;
        g.createExplosionEffect({x: enemy.x, y: enemy.y}, radius, t);
        for (let i = 0; i < g.enemies.length; i++) {
          const near = g.enemies[i];
          if (near === enemy || near._dead) continue;
          const dx = near.x - enemy.x, dy = near.y - enemy.y;
          if (dx*dx + dy*dy < radius*radius) {
            g.applyDamageToEnemy(near, damage * 0.5, t);
          }
        }
      }

      // 分裂飞刀：命中后分裂出小飞刀弹射攻击附近敌人
      if (g.bladeOrbitSplit > 0) {
        let splitTargets = 0;
        for (let i = 0; i < g.enemies.length && splitTargets < g.bladeOrbitSplit; i++) {
          const near = g.enemies[i];
          if (near === enemy || near._dead) continue;
          const dx = near.x - enemy.x, dy = near.y - enemy.y;
          if (dx*dx + dy*dy < 120*120) {
            g.applyDamageToEnemy(near, damage * 0.4, t, { immediate: true });
            g.effects.push({ kind:"line", x1: enemy.x, y1: enemy.y, x2: near.x, y2: near.y, start: t, end: t + 0.15 });
            splitTargets++;
          }
        }
      }

      // 弹射飞刀：命中后弹射到附近敌人
      if (g.bladeOrbitBounce > 0) {
        let bounceFrom = enemy;
        let remaining = g.bladeOrbitBounce;
        let bounceDmg = damage * 0.6;
        const bounced = new Set([enemy.id]);
        while (remaining > 0) {
          let best = null, bestD2 = 150*150;
          for (let i = 0; i < g.enemies.length; i++) {
            const e = g.enemies[i];
            if (e._dead || bounced.has(e.id)) continue;
            const dx = e.x - bounceFrom.x, dy = e.y - bounceFrom.y;
            const d2 = dx*dx + dy*dy;
            if (d2 < bestD2) { bestD2 = d2; best = e; }
          }
          if (!best) break;
          bounced.add(best.id);
          g.applyDamageToEnemy(best, bounceDmg, t, { immediate: true });
          g.effects.push({ kind:"line", x1: bounceFrom.x, y1: bounceFrom.y, x2: best.x, y2: best.y, start: t, end: t + 0.12 });
          bounceFrom = best;
          bounceDmg *= 0.7;
          remaining--;
        }
      }

      // 闪电弹射
      if (g.bladeOrbitShockChance > 0 && Math.random() < g.bladeOrbitShockChance && g.bladeOrbitChainCount > 0) {
        g.triggerChainLightning(enemy, damage * 0.5, g.bladeOrbitChainCount, t);
      }

      // 时停飞刀：暴击时冻结时间
      if (g.bladeOrbitTimeStop && isCrit) {
        g.timeWarpActive = true;
        g.timeWarpEndTime = t + (g.bladeOrbitTimeStopDuration || 0.3);
        g.flash("#88ddff", 0.15, 0.10, t);
      }

      // 熔岩飞刃：命中留下熔岩地面
      if (g.bladeOrbitLavaPool) {
        g.createFireTrail({x: enemy.x, y: enemy.y}, t);
      }

      // 标记飞刀击杀来源（供killEnemy使用）
      enemy._lastHitByBlade = true;
      enemy._lastBladeHitTime = t;
    };

    g.handleMineHit = (mine, t) => {
      const pos = { x: mine.x, y: mine.y };
      const damage = mine.damage;
      const radius = mine.radius;

      g.createExplosionEffect(pos, radius, t);
      SFX.kill(t, true);
      g.flash("#ff9f0a", 0.12, 0.12, t);
      g.shakeCamera(0.14, 11, t);
      g.hitStop(0.06, 0.20, t);
      g.emitBurst(pos, 26, "#ff9f0a", t, 780);

      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead) continue;
        const dx = e.x - pos.x, dy = e.y - pos.y;
        if (dx*dx + dy*dy < radius*radius) {
          g.applyDamageToEnemy(e, damage, t, { immediate: true });

          // NEW: Tech Force Mine Knockback
          if (mine.isTechForce && mine.force) {
             const dist = Math.sqrt(dx*dx + dy*dy) || 1;
             e.x += (dx/dist) * mine.force;
             e.y += (dy/dist) * mine.force;
          }
        }
      }

      mine._dead = true;
    };

    g.handlePlayerHit = (enemy, t) => {
      if (t - g.player.lastHit < g.iFrameDuration) return;

      // 绝对防御：飞刀数量超过阈值免疫控制
      if (g.bladeOrbitCCImmune && g.bladeOrbitCount >= g.bladeOrbitCCImmuneThreshold) {
        // CC免疫（但仍受伤害）
      }

      // Dodge
      if (Math.random() < g.dodgeChance) {
        g.showDodgeEffect(t);
        if (g.dodgeInvincibility) g.player.lastHit = t;
        return;
      }

      // Block
      if (Math.random() < g.blockChance) {
        g.showBlockEffect(t);
        if (g.perfectBlockCounter) {
          g.applyDamageToEnemy(enemy, g.bulletDamage * 2, t);
        }
        return;
      }

      // Damage calc
      const baseDmg = 9;
      const d = g.director || null;
      const dirMul = d ? safeNumber(d.dmgMul, 1.0) : (1.0 + (g.level - 1) * 0.085);
      const typeMul = clamp(safeNumber(enemy.damageMul, 1.0), 0.2, 5.0);
      let damage = baseDmg * dirMul * typeMul;

      damage *= (1 - g.damageReduction);

      // 刀盾减伤：每把飞刀提供额外减伤
      if (g.bladeOrbitDamageReduction > 0 && g.bladeOrbitCount > 0) {
        const bladeReduction = Math.min(g.bladeOrbitDamageReduction * g.bladeOrbitCount, 0.50); // 最多50%
        damage *= (1 - bladeReduction);
      }

      // 过量治疗护盾：先消耗护盾
      if (g._bladeOverhealShield > 0) {
        if (g._bladeOverhealShield >= damage) {
          g._bladeOverhealShield -= damage;
          damage = 0;
        } else {
          damage -= g._bladeOverhealShield;
          g._bladeOverhealShield = 0;
        }
      }

      damage = Math.min(damage, g.playerMaxHealth * g.damageCap);

      // Thorns
      if (g.thornsDamagePercent > 0) {
        g.applyDamageToEnemy(enemy, damage * g.thornsDamagePercent, t);
        if (g.thornsSlow) enemy.slowed = true;
      }

      g.takeDamage(damage, t);

      // 反击飞刃：受伤后激活反击加成
      if (g.bladeOrbitCounterAttack) {
        g._bladeCounterEnd = t + 3.0; // 3秒反击窗口
        g.emitBurst({x:g.player.x, y:g.player.y}, 8, "#ff6600", t, 300);
      }

      // Rage
      if (g.rageOnHit) g.rageEndTime = t + 3.0;

      // Revenge
      if (g.revengeEnabled) g.revengeNextCrit = true;

      g.player.lastHit = t;
      g.lastDamageTime = t;

      SFX.hit(t, true);
      g.hitStop(0.06, 0.22, t);
      g.shakeCamera(0.28, 16, t);
      g.emitBurst({x:g.player.x, y:g.player.y}, 18, "#ff3b30", t, 520);
    };

    // ------------------------------
    // Player state
    // ------------------------------
    g.takeDamage = (val, t) => {
      val = safeNonNeg(val, 0);
      
      // NEW: 魔法系统受伤回调（可能会减少伤害）
      if (window.MagicSystemLogic && window.MagicSystemLogic.onMagicTakeDamage) {
        val = window.MagicSystemLogic.onMagicTakeDamage(g, val, t);
      }

      if (g.stats) g.stats.dmgTaken = safeNonNeg((g.stats.dmgTaken || 0) + val, 0);
      if (g.combat && g.combat._acc) g.combat._acc.dmgTaken = safeNonNeg((g.combat._acc.dmgTaken || 0) + val, 0);
      g.playerHealth = safeNonNeg((g.playerHealth || 0) - val, 0);

      g.flash("#ff3b30", 0.30, 0.20, t);

      if (g.playerHealth <= 0) {
        // 刃之守护：飞刀数量足够时免死一次
        if (g.bladeOrbitDeathSave && g.bladeOrbitCount >= 5) {
          g.playerHealth = safeNonNeg(g.playerMaxHealth * 0.25, 1);
          g.bladeOrbitDeathSave = false; // 只触发一次
          g.flash("#00ffff", 0.30, 0.20, t);
          g.emitBurst({x: g.player.x, y: g.player.y}, 30, "#00ffff", t, 600);
          // 触发刀阵爆发作为反击
          if (g.bladeOrbitCount > 0) {
            g.triggerBladeBurst(t);
          }
        } else if (g.phoenixRevive && Math.random() < g.phoenixChance) {
          g.playerHealth = safeNonNeg(g.playerMaxHealth * 0.3, 1);
          g.phoenixRevive = false;
          g.showPhoenixEffect(t);
        } else if (g.lastStand) {
          g.playerHealth = 1;
          g.lastStand = false;
          // 3 seconds later die
          g._pendingDeathAt = t + 3.0;
        } else {
          g.playerHealth = 0;
          g.isPausedGame = true;
          g.isGameOver = true;
          if (typeof g.onGameOver === "function") g.onGameOver();
        }
      }
      g.updateUI();
    };

    g.heal = (val) => {
      val = safeNonNeg(val, 0);
      const maxHp = safeNonNeg(g.playerMaxHealth, 0);
      g.playerHealth = clampFinite(safeNonNeg((g.playerHealth || 0) + val, 0), 0, maxHp);
      g.updateUI();
    };

    g.addExp = (val, t) => {
      // 让开局升级更快一点：前 90 秒额外经验加成（不影响后期节奏）
      let boost = 1.0;
      if (g._startTime != null) {
        const elapsed = t - g._startTime;
        if (elapsed < 45) boost = 1.35;
        else if (elapsed < 90) boost = 1.15;
      }

      val = safeNonNeg(val, 0);
      const gained = val * boost * g.expMultiplier;

      // stats / combat window
      if (g.stats) g.stats.expGained = safeNonNeg((g.stats.expGained || 0) + gained, 0);
      if (g.combat && g.combat._acc) g.combat._acc.exp = safeNonNeg((g.combat._acc.exp || 0) + gained, 0);

      g.currentExp = safeNonNeg((g.currentExp || 0) + gained, 0);

      if (g.currentExp >= g.maxExp) {
        g.currentExp = safeNonNeg((g.currentExp || 0) - (g.maxExp || 0), 0);

        // 经验曲线：前期更平滑更快，后期回归原版 1.2
        // 经验值上限：达到 500 后不再递增
        const MAX_EXP_CAP = 500;
        const nextLevel = g.level + 1;
        let mult = 1.20;
        if (nextLevel <= 6) mult = 1.12;
        else if (nextLevel <= 12) mult = 1.16;

        const newMaxExp = safeNonNeg((g.maxExp || 0) * mult, 1);
        g.maxExp = Math.min(newMaxExp, MAX_EXP_CAP);
        g.level = nextLevel;

        // 爽感反馈：闪屏 + 抖动 + 短暂停顿 + 金色爆裂
        g.isPausedGame = true;
        g.flash("#ffd60a", 0.22, 0.18, t);
        g.shakeCamera(0.22, 10, t);
        g.hitStop(0.10, 0.18, t);
        g.emitBurst({x:g.player.x, y:g.player.y}, 26, "#ffd60a", t, 520);

        SFX.levelup(t);

        if (typeof g.onLevelUp === "function") g.onLevelUp();
      }

      g.updateUI();
    };

    // ------------------------------
    // Spawns / Summons
    // ------------------------------
    g.spawnEnemy = (t) => {
      const def = g.pickEnemyDef(t);

      // Spawn enemies **outside** the current viewport so they don't pop in as a "wall".
      // This also removes the old mapSize clamp (it created spawn lines / invisible boundaries
      // when the player moved far from the origin).
      let w = 800, h = 600;
      try {
        if (GameApp.Canvas && GameApp.Canvas.getCssSize) {
          const sz = GameApp.Canvas.getCssSize();
          w = sz.w || w;
          h = sz.h || h;
        } else {
          const rect = canvas.getBoundingClientRect();
          w = rect.width || w;
          h = rect.height || h;
        }
      } catch (e) { /* ignore */ }

      const pad = 160; // spawn padding outside the screen
      const halfW = w * 0.5 + pad;
      const halfH = h * 0.5 + pad;

      const r = Math.random();
      let x = g.player.x;
      let y = g.player.y;

      if (r < 0.25) {
        // left
        x = g.player.x - halfW;
        y = g.player.y + rand(-halfH, halfH);
      } else if (r < 0.50) {
        // right
        x = g.player.x + halfW;
        y = g.player.y + rand(-halfH, halfH);
      } else if (r < 0.75) {
        // top
        x = g.player.x + rand(-halfW, halfW);
        y = g.player.y - halfH;
      } else {
        // bottom
        x = g.player.x + rand(-halfW, halfW);
        y = g.player.y + halfH;
      }

      // small jitter to avoid perfect lines
      x += rand(-40, 40);
      y += rand(-40, 40);

      g.createEnemyFromDef(def, x, y, t);
    };

    g.spawnExpOrb = (pos, value = 12, color = null) => {
      const v = clamp(safeNonNeg(value == null ? 12 : value, 12), 1, 2000);
      const r = clamp(3.5 + Math.sqrt(v) * 0.32, 4, 11);
      const col = color || "#34c759";
      g.expOrbs.push({ id: nextId(), x: pos.x, y: pos.y, r, val: v, color: col });
    };

    g.createOrbitalShield = () => {
      g.orbitals.push({ id: nextId(), type:"shield", x:g.player.x, y:g.player.y, r: 12, rot: 0, colliding: new Set() });
    };

    g.createOrbitalBlade = () => {
      g.orbitals.push({ id: nextId(), type:"blade", x:g.player.x, y:g.player.y, w: 30, h: 6, rot: 0, colliding: new Set() });
    };

    g.createDrone = () => {
      g.drones.push({ id: nextId(), x: g.player.x, y: g.player.y + 60, lastShot: 0 });
    };

    g.createGhost = () => {
      g.ghosts.push({ id: nextId(), x: g.player.x, y: g.player.y });
    };

    g.dropMine = (pos, t) => {
      g.mines.push({
        id: nextId(),
        x: pos.x,
        y: pos.y,
        r: 10,
        damage: g.mineDamage,
        radius: g.mineRadius,
        born: t
      });
    };

    g.createFireTrail = (pos, t) => {
      g.fireTrails.push({ id: nextId(), x: pos.x, y: pos.y, r: 15, born: t, die: t + 3.0, lastTick: t });
    };

    g.summonMeteor = (t) => {
      const cluster = g.findEnemyCluster(300);
      let x, y;
      if (cluster) {
        x = cluster.x + rand(-50, 50);
        y = cluster.y + rand(-50, 50);
      } else {
        x = g.player.x + rand(-200, 200);
        y = g.player.y + rand(-200, 200);
      }
      g.warnings.push({ id: nextId(), x, y, born: t });
    };

    g.createBlackHole = (pos, t, small=false) => {
      const radius = small ? 50 : 100;
      const duration = small ? 1.5 : 3.0;
      g.blackHoles.push({
        id: nextId(),
        x: pos.x,
        y: pos.y,
        radius,
        end: t + duration,
        fadeEnd: t + duration + 0.3,
        nextTick: t,
        small
      });
    };

    // === 飞刀天降效果 ===
    g.triggerBladeSkyfall = (t) => {
      // 在屏幕范围内随机位置生成多把飞刀从天而降
      const count = Math.min(g.bladeOrbitCount, 20); // 最多20把天降
      for (let i = 0; i < count; i++) {
        const x = g.player.x + rand(-250, 250);
        const y = g.player.y + rand(-250, 250);
        // 对落点附近敌人造成伤害
        const damage = g.bladeOrbitDamage * 1.5;
        const radius = 40;
        g.createExplosionEffect({x, y}, radius, t);
        g.effects.push({ kind:"slash", x, y, ang: Math.random() * TAU, start: t, end: t + 0.2 });
        for (let j = 0; j < g.enemies.length; j++) {
          const e = g.enemies[j];
          if (e._dead) continue;
          const dx = e.x - x, dy = e.y - y;
          if (dx*dx + dy*dy < radius*radius) {
            g.applyDamageToEnemy(e, damage, t, { immediate: true });
          }
        }
      }
      SFX.blade(t);
      g.shakeCamera(0.15, 10, t);
      g.flash("#88ccff", 0.12, 0.10, t);
    };

    // === 飞刀蓄能爆发 ===
    g.triggerBladeBurst = (t) => {
      // 所有飞刀同时向外爆发，对环形范围内所有敌人造成大伤害
      const damage = g.bladeOrbitDamage * g.bladeOrbitCount * 0.3;
      const radius = g.bladeOrbitRadius * 2;
      g.createExplosionEffect({x: g.player.x, y: g.player.y}, radius, t);
      g.emitBurst({x: g.player.x, y: g.player.y}, 30, "#ff9f0a", t, 800);
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead) continue;
        const dx = e.x - g.player.x, dy = e.y - g.player.y;
        if (dx*dx + dy*dy < radius*radius) {
          g.applyDamageToEnemy(e, damage, t, { immediate: true });
        }
      }
      SFX.kill(t, true);
      g.shakeCamera(0.25, 15, t);
      g.flash("#ff9f0a", 0.20, 0.15, t);
      g.hitStop(0.08, 0.25, t);
    };

    g.createPoisonExplosion = (pos, t) => {
      g.poisonClouds.push({
        id: nextId(),
        x: pos.x,
        y: pos.y,
        radius: 60,
        born: t,
        ticks: 0,
        nextTick: t,
        fadeStart: t + 3.0,
        fadeEnd: t + 3.5
      });
    };

    // NEW: Create enemy bullet (for ranged enemies)
    g.createEnemyBullet = (enemy, t) => {
      const dx = g.player.x - enemy.x;
      const dy = g.player.y - enemy.y;
      const dist = Math.max(1, hypot(dx, dy));
      const speed = enemy.bulletSpeed || 250;
      
      // Calculate damage based on director
      const d = g.director || { dmgMul: 1.0 };
      const baseDmg = 6;
      const damage = baseDmg * safeNumber(d.dmgMul, 1.0) * safeNumber(enemy.damageMul, 1.0);
      
      g.enemyBullets.push({
        id: nextId(),
        x: enemy.x,
        y: enemy.y,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        damage: damage,
        born: t,
        r: 6,
        color: enemy.color || "#f472b6",
        sourceEnemy: enemy  // 存储源敌人引用，用于荆棘伤害和完美格挡反击
      });
    };

    // NEW: Update enemy bullets
    g.updateEnemyBullets = (dt, t) => {
      for (let i = g.enemyBullets.length - 1; i >= 0; i--) {
        const b = g.enemyBullets[i];
        
        // Move bullet
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        
        // Check lifetime (3 seconds max)
        if (t - b.born > 3.0) {
          g.enemyBullets.splice(i, 1);
          continue;
        }
        
        // Check collision with player
        const dx = g.player.x - b.x;
        const dy = g.player.y - b.y;
        const dist = hypot(dx, dy);
        const hitDist = g.player.r + b.r;
        
        if (dist < hitDist) {
          // Hit player - use similar logic to handlePlayerHit but simplified
          if (t - g.player.lastHit >= g.iFrameDuration) {
            // 获取源敌人引用（用于荆棘伤害和完美格挡反击）
            const sourceEnemy = b.sourceEnemy;
            const enemyAlive = sourceEnemy && !sourceEnemy._dead;
            
            // Dodge check
            if (Math.random() < g.dodgeChance) {
              g.showDodgeEffect(t);
              if (g.dodgeInvincibility) g.player.lastHit = t;
            } else if (Math.random() < g.blockChance) {
              // Block check
              g.showBlockEffect(t);
              // 完美格挡反击：格挡成功时反应造成200%伤害
              if (g.perfectBlockCounter && enemyAlive) {
                g.applyDamageToEnemy(sourceEnemy, g.bulletDamage * 2, t);
              }
            } else {
              // Take damage
              let damage = b.damage * (1 - g.damageReduction);
              damage = Math.min(damage, g.playerMaxHealth * g.damageCap);
              
              // 荆棘伤害：受击时反弹伤害给攻击者
              if (g.thornsDamagePercent > 0 && enemyAlive) {
                g.applyDamageToEnemy(sourceEnemy, damage * g.thornsDamagePercent, t);
                if (g.thornsSlow) sourceEnemy.slowed = true;
              }
              
              g.takeDamage(damage, t);
              g.player.lastHit = t;
              g.lastDamageTime = t;
              SFX.hit(t, false);
              g.shakeCamera(0.15, 8, t);
              g.emitBurst({x: g.player.x, y: g.player.y}, 10, "#ff3b30", t, 400);
              
              // Rage (same as handlePlayerHit)
              if (g.rageOnHit) g.rageEndTime = t + 3.0;
              // Revenge (same as handlePlayerHit)
              if (g.revengeEnabled) g.revengeNextCrit = true;
            }
          }
          g.enemyBullets.splice(i, 1);
          continue;
        }
        
        // Check if bullet is too far from player (cleanup)
        if (dist > 1500) {
          g.enemyBullets.splice(i, 1);
        }
      }
    };

    // ------------------------------
    // Update Systems (ported)
    // ------------------------------
    g.updateEnemies = (dt, t) => {
      // 获取屏幕尺寸用于计算距离阈值
      let screenW = 800, screenH = 600;
      try {
        if (GameApp.Canvas && GameApp.Canvas.getCssSize) {
          const sz = GameApp.Canvas.getCssSize();
          screenW = sz.w || screenW;
          screenH = sz.h || screenH;
        } else {
          const rect = canvas.getBoundingClientRect();
          screenW = rect.width || screenW;
          screenH = rect.height || screenH;
        }
      } catch (e) { /* ignore */ }

      // 4个屏幕距离的阈值（取屏幕对角线的4倍）
      const screenDiagonal = hypot(screenW, screenH);
      const maxDistThreshold = screenDiagonal * 4;
      const maxDistThreshold2 = maxDistThreshold * maxDistThreshold;

      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];

        // 检测敌人是否距离玩家过远（超出4个屏幕距离）
        // 如果过远，则将敌人传送到屏幕外附近
        const distX = e.x - g.player.x;
        const distY = e.y - g.player.y;
        const dist2 = distX * distX + distY * distY;
        
        if (dist2 > maxDistThreshold2) {
          // 将敌人传送到屏幕外附近（约1.5个屏幕距离处）
          const pad = 160; // 屏幕外边距
          const halfW = screenW * 0.5 + pad;
          const halfH = screenH * 0.5 + pad;

          // 随机选择一个方向（上下左右）
          const r = Math.random();
          if (r < 0.25) {
            // 左侧
            e.x = g.player.x - halfW + rand(-40, 40);
            e.y = g.player.y + rand(-halfH, halfH);
          } else if (r < 0.50) {
            // 右侧
            e.x = g.player.x + halfW + rand(-40, 40);
            e.y = g.player.y + rand(-halfH, halfH);
          } else if (r < 0.75) {
            // 上方
            e.x = g.player.x + rand(-halfW, halfW);
            e.y = g.player.y - halfH + rand(-40, 40);
          } else {
            // 下方
            e.x = g.player.x + rand(-halfW, halfW);
            e.y = g.player.y + halfH + rand(-40, 40);
          }
        }

        // thaw (restore color after freeze)
        if (e.frozenUntil && t >= e.frozenUntil) {
          e.frozenUntil = 0;
          if (e.baseColorAfterFreeze) {
            e.color = e.baseColorAfterFreeze;
            e.baseColorAfterFreeze = null;
          } else {
            e.color = e.baseColor || e.color;
          }
        }

        // clear timed slow from ghost
        if (e._ghostSlowUntil != null && t >= e._ghostSlowUntil) {
          e.slowed = false;
          e._ghostSlowUntil = null;
        }

        // 飞刀减速效果到期清除
        if (e._bladeSlowEnd != null && t >= e._bladeSlowEnd) {
          if (!e._ghostSlowUntil && !e._bladePoisonSlowEnd) {
            e.slowed = false;
          }
          e._bladeSlowEnd = null;
          e._bladeSlowAmount = 0;
        }

        // 飞刀毒素减速到期清除
        if (e._bladePoisonSlowEnd != null && t >= e._bladePoisonSlowEnd) {
          if (!e._ghostSlowUntil && !e._bladeSlowEnd) {
            e.slowed = false;
          }
          e._bladePoisonSlowEnd = null;
        }

        const frozen = (e.frozenUntil && t < e.frozenUntil);

        if (!frozen) {
          const dx = g.player.x - e.x;
          const dy = g.player.y - e.y;
          const dist = Math.max(0.001, hypot(dx, dy));
          let angle = Math.atan2(dy, dx);

          let speed = safeNonNeg(e.speed, GameConfig.baseEnemySpeed);

          // suppression
          if (g.suppressionEnabled && g.isEnemyInFiringDirection(e)) speed *= 0.6;

          // slowed
          if (e.slowed) speed *= 0.5;

          // AI behaviors
          switch (e.ai) {
            case "zigzag": {
              angle += Math.sin(t * 3.2 + (e.aiSeed || 0)) * 0.9;
              break;
            }
            case "orbit": {
              const targetR = e.orbitR || 180;
              const tang = angle + Math.PI / 2;
              const err = clamp((dist - targetR) / targetR, -0.75, 0.75);
              angle = tang + err;
              break;
            }
            case "dash": {
              if (!e.nextDash || e.nextDash < 1e-6) e.nextDash = t + rand(1.0, 2.2);
              if (t >= e.nextDash) {
                e.dashEnd = t + 0.28;
                e.nextDash = t + rand(1.8, 3.2);
              }
              if (t < (e.dashEnd || 0)) speed *= 2.6;
              break;
            }
            case "kite": {
              const keep = e.keepDist || 220;
              if (dist < keep * 0.85) {
                angle += Math.PI; // run away
                speed *= 1.05;
              } else if (dist < keep * 1.10) {
                angle += Math.PI / 2; // strafe
                speed *= 0.95;
              }
              break;
            }
            case "spawner": {
              // summon minions periodically
              speed *= 0.85;
              if (!e.nextSpawn || e.nextSpawn < 1e-6) e.nextSpawn = t + rand(1.6, 2.6);

              if (t >= e.nextSpawn) {
                const s = safeNumber(g.director && g.director.strength, 0);
                const count = clamp(2 + Math.floor(s * 1.3) + (Math.random() < 0.25 ? 1 : 0), 2, 5);
                g.spawnMinions(e, count, t);

                const cd = rand(2.2, 3.8) / (1 + s * 0.35);
                e.nextSpawn = t + cd;
              }
              break;
            }
            // NEW AI: Predictor - predicts player movement and intercepts
            case "predict": {
              // Calculate player velocity based on joystick input
              const jv = g.joystickVector || { dx: 0, dy: 0 };
              const playerVelX = jv.dx * GameConfig.basePlayerSpeed * g.playerSpeedMulti;
              const playerVelY = jv.dy * GameConfig.basePlayerSpeed * g.playerSpeedMulti;
              
              // Predict where player will be in ~0.8 seconds
              const predictTime = 0.8;
              e.predictedX = g.player.x + playerVelX * predictTime;
              e.predictedY = g.player.y + playerVelY * predictTime;
              
              // Move towards predicted position
              const pdx = e.predictedX - e.x;
              const pdy = e.predictedY - e.y;
              angle = Math.atan2(pdy, pdx);
              speed *= 1.15; // Slightly faster to intercept
              break;
            }
            // NEW AI: Flanker - tries to approach from the side
            case "flank": {
              // Update flank angle slowly to circle around player
              e.flankAngle = (e.flankAngle || 0) + dt * 0.8;
              
              // Target position is offset from player
              const flankDist = 120;
              const targetX = g.player.x + Math.cos(e.flankAngle) * flankDist;
              const targetY = g.player.y + Math.sin(e.flankAngle) * flankDist;
              
              // If close to flank position, rush towards player
              const toTargetDist = hypot(targetX - e.x, targetY - e.y);
              if (toTargetDist < 50) {
                // Rush towards player
                angle = Math.atan2(dy, dx);
                speed *= 1.4;
              } else {
                // Move to flank position
                angle = Math.atan2(targetY - e.y, targetX - e.x);
              }
              break;
            }
            // NEW AI: Ranged - keeps distance and shoots projectiles
            case "ranged": {
              const keepDist = 180;
              if (dist < keepDist * 0.7) {
                // Too close, retreat
                angle += Math.PI;
                speed *= 1.1;
              } else if (dist < keepDist * 1.2) {
                // Good distance, strafe
                angle += Math.PI / 2 * (Math.sin(t * 2 + e.aiSeed) > 0 ? 1 : -1);
                speed *= 0.8;
              }
              // else: chase to get in range
              
              // Shoot at player
              if (t >= (e.nextShot || 0)) {
                g.createEnemyBullet(e, t);
                e.nextShot = t + (e.shootInterval || 2.0) * rand(0.8, 1.2);
              }
              break;
            }
            default:
              break;
          }

          e.x += Math.cos(angle) * speed * dt;
          e.y += Math.sin(angle) * speed * dt;

          e.rot = angle - Math.PI/2;
        }

        // burn damage (ticks even if frozen)
        if (e.burnEnd != null && t < e.burnEnd) {
          const burnDmg = e.burnDmg || 0;
          g.applyDamageToEnemy(e, burnDmg * dt * 10, t);
        }

        // poison damage (ticks even if frozen)
        if (e.poisonEnd != null && t < e.poisonEnd) {
          const poisonDmg = e.poisonDmg || 0;
          g.applyDamageToEnemy(e, poisonDmg * dt * 10, t);
        }

        // vulnerable auto-clear
        if (e.vulnerableUntil != null && t >= e.vulnerableUntil) e.vulnerableUntil = null;
      }
    };

    g.updateOrbitals = (dt, t) => {
      // Ensure counts (single scan, no Array.filter allocations each frame)
      let shieldCount = 0;
      let bladeCount = 0;
      for (let i = 0; i < g.orbitals.length; i++) {
        const o = g.orbitals[i];
        if (o.type === "shield") shieldCount++;
        else if (o.type === "blade") bladeCount++;
      }
      while (shieldCount < g.orbitalShieldCount) { g.createOrbitalShield(); shieldCount++; }
      while (bladeCount < g.bladeOrbitCount) { g.createOrbitalBlade(); bladeCount++; }

      // 蓄力飞刀：累计旋转圈数
      g._bladeChargeRotations = (g._bladeChargeRotations || 0) + dt * g.bladeOrbitSpeed * 3 / TAU;

      const shieldStep = TAU / Math.max(1, g.orbitalShieldCount);
      const bladeStep  = TAU / Math.max(1, g.bladeOrbitCount);

      // 双环飞刀：总数的一半放在内环，一半放在外环
      const dualRing = g.bladeOrbitDualRing;
      const innerCount = dualRing ? Math.ceil(g.bladeOrbitCount / 2) : g.bladeOrbitCount;
      const outerCount = dualRing ? Math.floor(g.bladeOrbitCount / 2) : 0;
      const innerStep = TAU / Math.max(1, innerCount);
      const outerStep = outerCount > 0 ? TAU / Math.max(1, outerCount) : 0;

      // Update positions
      let sIdx = 0;
      let bIdx = 0;
      let innerIdx = 0;
      let outerIdx = 0;
      for (let i = 0; i < g.orbitals.length; i++) {
        const o = g.orbitals[i];
        if (o.type === "shield") {
          const angle = (t * 2 * g.orbitalShieldSpeed) + sIdx * shieldStep;
          o.x = g.player.x + Math.cos(angle) * 70;
          o.y = g.player.y + Math.sin(angle) * 70;
          o.rot = angle;
          sIdx++;
        } else if (o.type === "blade") {
          let angle, radius;

          if (dualRing && bIdx >= innerCount) {
            // 外环：反向旋转，更大半径
            angle = -(t * 2.5 * g.bladeOrbitSpeed) + outerIdx * outerStep;
            radius = g.bladeOrbitRadius * 1.5;
            outerIdx++;
          } else {
            // 内环（或单环）
            angle = (t * 3 * g.bladeOrbitSpeed) + (dualRing ? innerIdx : bIdx) * (dualRing ? innerStep : bladeStep);
            radius = g.bladeOrbitRadius;
            if (dualRing) innerIdx++;
          }

          // 追踪飞刀：飞刀向最近敌人偏移
          if (g.bladeOrbitHoming) {
            const target = g.getClosestEnemy({x: g.player.x, y: g.player.y});
            if (target) {
              const dx = target.x - g.player.x;
              const dy = target.y - g.player.y;
              const d = Math.sqrt(dx*dx + dy*dy);
              if (d < (g.bladeOrbitHomingRange || 200)) {
                const targetAngle = Math.atan2(dy, dx);
                const accuracy = g.bladeOrbitHomingAccuracy || 0.3;
                // 偏移飞刀角度朝向敌人
                const diff = ((targetAngle - angle + Math.PI * 3) % TAU) - Math.PI;
                angle += diff * accuracy * dt * 5;
              }
            }
          }

          // 回旋飞刀：半径脉冲式伸缩
          if (g.bladeOrbitBoomerang) {
            const phase = (t * 2 + bIdx * 0.5) % 2;
            if (phase < 1) {
              radius *= (1 + phase * 0.8); // 展开
            } else {
              radius *= (1 + (2 - phase) * 0.8); // 回收
            }
          }

          o.x = g.player.x + Math.cos(angle) * radius;
          o.y = g.player.y + Math.sin(angle) * radius;
          o.rot = angle;
          o.w = 30 * g.bladeOrbitScale;
          o.h = 6 * g.bladeOrbitScale;
          bIdx++;
        }
      }

      // === 飞刀周期效果 ===

      // 霜冻光环：周期性减速附近敌人
      if (g.bladeOrbitFrostAura && t - (g._bladeLastAuraTime || 0) > 0.5) {
        g._bladeLastAuraTime = t;
        const auraRange = g.bladeOrbitRadius + 30;
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e._dead) continue;
          const dx = e.x - g.player.x, dy = e.y - g.player.y;
          if (dx*dx + dy*dy < auraRange*auraRange) {
            e.slowed = true;
            e._bladeSlowEnd = t + 0.6;
            e._bladeSlowAmount = 0.5;
          }
        }
      }

      // 毒素光环：周期性毒化附近敌人
      if (g.bladeOrbitPoisonAura && t - (g._bladeLastAuraTime || 0) > 1.0) {
        g._bladeLastAuraTime = t;
        const auraRange = g.bladeOrbitRadius + 20;
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e._dead) continue;
          const dx = e.x - g.player.x, dy = e.y - g.player.y;
          if (dx*dx + dy*dy < auraRange*auraRange) {
            e.poisonEnd = t + 2.0;
            e.poisonDmg = g.bladeOrbitPoisonDamage || 3;
          }
        }
      }

      // 火焰轨迹：飞刀路径留下火焰
      if (g.bladeOrbitFireTrail && t - (g._bladeLastFireTrailTime || 0) > 0.3) {
        g._bladeLastFireTrailTime = t;
        for (let i = 0; i < g.orbitals.length; i++) {
          const o = g.orbitals[i];
          if (o.type !== "blade") continue;
          g.createFireTrail({x: o.x, y: o.y}, t);
          break; // 只从第一个飞刀生成轨迹，避免过多
        }
      }

      // 凤凰之翼：飞刀击中后在轨道留下凤凰火焰视觉效果
      if (g.bladeOrbitPhoenixWings && g.effects.length < 800) {
        for (let i = 0; i < g.orbitals.length && i < 4; i++) {
          const o = g.orbitals[i];
          if (o.type !== "blade") continue;
          if (Math.random() < 0.1) {
            g.effects.push({ kind:"spark", x: o.x, y: o.y, vx: (Math.random()-0.5)*50, vy: (Math.random()-0.5)*50, color:"#ff6600", start:t, end:t+0.3 });
          }
        }
      }

      // 磁力飞刃：吸引附近敌人
      if (g.bladeOrbitMagneticPull) {
        const pullRange = g.bladeOrbitMagneticRange || 100;
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e._dead) continue;
          const dx = g.player.x - e.x, dy = g.player.y - e.y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < pullRange && d > 20) {
            const pull = 30 * dt;
            e.x += (dx / d) * pull;
            e.y += (dy / d) * pull;
          }
        }
      }

      // 影刃：生成影子飞刀（视觉效果，不占数量但增加伤害范围）
      if (g.bladeOrbitShadowBlade && g.effects.length < 600) {
        for (let i = 0; i < g.orbitals.length && i < 3; i++) {
          const o = g.orbitals[i];
          if (o.type !== "blade") continue;
          // 影子飞刀在半透明位置
          const shadowAngle = o.rot + Math.PI;
          const sx = g.player.x + Math.cos(shadowAngle) * g.bladeOrbitRadius;
          const sy = g.player.y + Math.sin(shadowAngle) * g.bladeOrbitRadius;
          // 影子飞刀碰撞检测
          for (let ei = 0; ei < g.enemies.length; ei++) {
            const e = g.enemies[ei];
            if (e._dead) continue;
            const dx = e.x - sx, dy = e.y - sy;
            const r = Math.max(o.w, o.h) / 2 + Math.max(e.w, e.h) / 2;
            if (dx*dx + dy*dy <= r*r) {
              if (!e._shadowHitTime || t - e._shadowHitTime > 0.3) {
                e._shadowHitTime = t;
                g.applyDamageToEnemy(e, g.bladeOrbitDamage * (g.bladeOrbitShadowDamageMult || 0.5), t, { immediate: true });
              }
            }
          }
        }
      }

      // 飞刀每秒回血
      if (g.bladeOrbitRegenPerBlade > 0 && t - (g._bladeLastRegenTime || 0) > 1.0) {
        g._bladeLastRegenTime = t;
        g.heal(g.bladeOrbitRegenPerBlade * g.bladeOrbitCount);
      }

      // 天降飞刀（周期性）
      if (g.bladeOrbitSkyfall && t - (g._bladeLastSkyfallTime || 0) > (g.bladeOrbitSkyfallInterval || 3.0)) {
        g._bladeLastSkyfallTime = t;
        g.triggerBladeSkyfall(t);
      }

      // 飞刀蓄能爆发
      if (g.bladeOrbitBurst && g._bladeChargeRotations >= 10) {
        g._bladeChargeRotations = 0;
        g.triggerBladeBurst(t);
      }

      // Orbital vs enemy contact begin (reuse Sets to avoid per-frame GC)
      for (let oi = 0; oi < g.orbitals.length; oi++) {
        const o = g.orbitals[oi];
        const prev = o.colliding || (o.colliding = new Set());
        let next = o._collidingNext;
        if (!next) { next = new Set(); o._collidingNext = next; }
        next.clear();

        for (let ei = 0; ei < g.enemies.length; ei++) {
          const e = g.enemies[ei];
          if (e._dead) continue;
          const dx = e.x - o.x, dy = e.y - o.y;
          const rr = (o.type === "shield")
            ? (o.r + Math.max(e.w, e.h) / 2)
            : (Math.max(o.w, o.h) / 2 + Math.max(e.w, e.h) / 2);
          if (dx*dx + dy*dy <= rr*rr) {
            next.add(e.id);
            if (!prev.has(e.id)) g.handleOrbitalHit(o, e, t);
          }
        }

        // swap buffers
        o.colliding = next;
        o._collidingNext = prev;
      }
    };

    g.updateDrones = (t) => {
      // Ensure count
      while (g.drones.length < g.droneCount) g.createDrone();

      for (let i = 0; i < g.drones.length; i++) {
        const d = g.drones[i];
        if (t - d.lastShot > 0.8) {
          const target = g.getClosestEnemy({x:d.x, y:d.y});
          if (target) {
            g.fireDroneBullet(d, target, t);
            d.lastShot = t;
          }
        }
        // follow player with jitter target
        const targetX = g.player.x + rand(-50, 50);
        const targetY = g.player.y + rand(50, 80);
        d.x += (targetX - d.x) * 0.02;
        d.y += (targetY - d.y) * 0.02;
      }
    };

    g.updateGhosts = (t) => {
      while (g.ghosts.length < g.ghostCount) g.createGhost();

      for (let i = 0; i < g.ghosts.length; i++) {
        const gh = g.ghosts[i];
        const target = g.getClosestEnemy({x:gh.x, y:gh.y});
        if (target) {
          const dx = target.x - gh.x;
          const dy = target.y - gh.y;
          const dist = hypot(dx, dy);
          if (dist > 30) {
            gh.x += dx / dist * 3;
            gh.y += dy / dist * 3;
          } else {
            g.applyDamageToEnemy(target, 5, t);
            if (g.ghostSlow) {
              target.slowed = true;
              target._ghostSlowUntil = t + 1.0;
            }
          }
        } else {
          gh.x += (g.player.x - gh.x) * 0.05;
          gh.y += (g.player.y - gh.y) * 0.05;
        }
      }

      // clear ghost slow
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead) continue;
        if (e._ghostSlowUntil != null && t >= e._ghostSlowUntil) {
          e.slowed = false;
          e._ghostSlowUntil = null;
        }
      }
    };

    g.updateBulletHoming = (dt, t) => {
      if (g.homingStrength <= 0) return;

      for (let i = 0; i < g.bullets.length; i++) {
        const b = g.bullets[i];
        const target = g.getClosestEnemy({x:b.x, y:b.y});
        if (!target) continue;

        const dx = target.x - b.x;
        const dy = target.y - b.y;
        const targetAngle = Math.atan2(dy, dx);

        let currentAngle = Math.atan2(b.vy, b.vx);

        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= TAU;
        while (angleDiff < -Math.PI) angleDiff += TAU;

        currentAngle += angleDiff * g.homingStrength * dt * 10;

        const speed = hypot(b.vx, b.vy);
        b.vx = Math.cos(currentAngle) * speed;
        b.vy = Math.sin(currentAngle) * speed;
        b.rot = currentAngle - Math.PI/2;
      }
    };

    g.updateLightningAura = (dt, t) => {
      if (!g.lightningAuraEnabled) return;
      const r2 = g.lightningAuraRadius * g.lightningAuraRadius;
      const dps = g.lightningAuraDamage;

      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead) continue;
        const dx = e.x - g.player.x, dy = e.y - g.player.y;
        if (dx*dx + dy*dy < r2) {
          // lightningAuraDamage is treated as DPS => scale by real dt
          g.applyDamageToEnemy(e, dps * dt, t);
        }
      }
    };

    g.updateExpOrbs = (t) => {
      for (let i = 0; i < g.expOrbs.length; i++) {
        const orb = g.expOrbs[i];
        const dx = g.player.x - orb.x;
        const dy = g.player.y - orb.y;
        const dist = hypot(dx, dy);

        // 如果启用了全局经验吸取，所有经验球都会被吸引
        if (g.expMagnetAll || dist < g.pickupRange) {
          const speed = g.expMagnetAll ? 0.15 : 0.1;  // 全局吸取时速度稍快
          orb.x += dx * speed;
          orb.y += dy * speed;
        }

        // pickup
        if (dist < (g.player.r + orb.r)) {
          orb._dead = true;
          SFX.pickup(t);
          g.emitSparks({x:orb.x, y:orb.y}, 6, orb.color || "#34c759", t);
          g.addExp(orb.val || 12, t);
        }
      }
    };

    // ------------------------------
    // Skills: generate choices (mirrors Swift weighting)
    // ------------------------------
    g.generateSkills = () => {
      // True randomness (weighted), but **do not** offer already-owned skills.
      // This fixes the "always刷到已拥有技能" problem.
      const acquired = new Set(g.acquiredSkills || []);
      const candidates = [];

      // Lazy-init fallback repeatable skills (so level-up can never softlock)
      if (!g._fallbackSkills) {
        g._fallbackSkills = [
          {
            name: "训练：伤害 +5%",
            description: "可重复。基础伤害提升 5%",
            tier: 1,
            icon: "bolt.fill",
            _repeatable: true,
            effect: (gg) => { gg.bulletDamage *= 1.05; }
          },
          {
            name: "训练：射速 +5%",
            description: "可重复。攻击间隔降低 5%（射速更快）",
            tier: 1,
            icon: "timer",
            _repeatable: true,
            effect: (gg) => { gg.shootInterval *= 0.95; }
          },
          {
            name: "训练：生命 +10",
            description: "可重复。最大生命 +10，并立刻回复 +10",
            tier: 1,
            icon: "heart.fill",
            _repeatable: true,
            effect: (gg) => {
              gg.playerMaxHealth += 10;
              gg.playerHealth = Math.min(gg.playerMaxHealth, gg.playerHealth + 10);
              gg.updateHealthUI();
            }
          }
        ];
      }

      for (let i = 0; i < g.allSkills.length; i++) {
        const sk = g.allSkills[i];

        // Extra blade upgrades: only if blades exist
        if (sk._requiresBlades && g.bladeOrbitCount <= 0) continue;

        // No repeats
        if (acquired.has(sk.name)) continue;

        const tier = sk.tier || 1;
        let weight = 1;
        if (window.SkillDropRates && window.SkillDropRates.calculateWeight) {
          weight = window.SkillDropRates.calculateWeight(tier, g.level);
        } else {
          if (tier === 1) weight = Math.max(2, 14 - Math.floor(g.level / 3));
          else if (tier === 2) weight = Math.min(8, 3 + Math.floor(g.level / 4));
          else if (tier === 3) weight = Math.min(5, 1 + Math.floor(g.level / 5));
          else if (tier === 4) weight = Math.min(3, Math.floor(g.level / 7));
          else if (tier === 5) weight = Math.min(1, Math.floor(g.level / 10));
        }

        weight = safeNonNeg(weight, 0);
        if (weight <= 0) continue;
        candidates.push({ sk, w: weight });
      }

      function pickIndexWeighted(list) {
        let total = 0;
        for (let i = 0; i < list.length; i++) total += list[i].w;
        if (total <= 0) return -1;
        let r = Math.random() * total;
        for (let i = 0; i < list.length; i++) {
          r -= list[i].w;
          if (r <= 0) return i;
        }
        return list.length - 1;
      }

      const chosen = [];
      const tmp = candidates.slice();

      // 万有引力保底机制：前50个技能选择中必定出现
      // 追踪累计技能提供次数（每次升级提供3个选择，计为1次）
      g._skillOfferCount = (g._skillOfferCount || 0) + 1;
      if (g._skillOfferCount <= 50 && !acquired.has("万有引力")) {
        // 在前50次技能选择中，如果还没获得万有引力，强制加入候选
        const gravityIdx = tmp.findIndex(c => c.sk.name === "万有引力");
        if (gravityIdx >= 0) {
          // 找到了万有引力，强制选入第一个位置
          chosen.push(tmp[gravityIdx].sk);
          tmp[gravityIdx] = tmp[tmp.length - 1];
          tmp.pop();
        }
      }

      while (chosen.length < 3 && tmp.length > 0) {
        const idx = pickIndexWeighted(tmp);
        if (idx < 0) break;
        chosen.push(tmp[idx].sk);
        tmp[idx] = tmp[tmp.length - 1];
        tmp.pop();
      }

      // If we can't provide 3 unique skills (very late game), fill with safe repeatable training.
      while (chosen.length < 3) {
        chosen.push(g._fallbackSkills[chosen.length % g._fallbackSkills.length]);
      }

      // Defensive: unique by name for the UI
      const seen = new Set();
      const unique = [];
      for (let i = 0; i < chosen.length; i++) {
        const sk = chosen[i];
        if (!sk || seen.has(sk.name)) continue;
        seen.add(sk.name);
        unique.push(sk);
      }

      // If de-dupe reduced options, fill again with fallback
      let f = 0;
      while (unique.length < 3) {
        const sk = g._fallbackSkills[f % g._fallbackSkills.length];
        f++;
        if (!seen.has(sk.name)) {
          seen.add(sk.name);
          unique.push(sk);
        }
      }

      g.skillChoices = unique;
    };

    g.selectSkill = (skill) => {
      skill.effect(g);

      // Default behavior: one-time skills are recorded and will not appear again.
      // Repeatable skills (our fallback training) are NOT added to acquiredSkills.
      if (!skill._repeatable) {
        g.acquiredSkills.push(skill.name);
        if (g.acquiredSkillMeta) g.acquiredSkillMeta.push({ name: skill.name, tier: skill.tier || 1 });
      }

      g.isLevelingUp = false;
      g.isPausedGame = false;
      g.updateUI();
    };

    g.resetGame = () => {
      // Reset everything by reinitializing (simpler)
    };

    // ------------------------------
    // Main update loop (ported from Swift update)
    // ------------------------------
    // ------------------------------
    // NEW: Tech System Logic (赛博朋克击退科技)
    // ------------------------------
    g.updateTechSystem = (dt, t) => {
      const tech = g.tech;
      if (!tech) return;

      // 1. Gravity Pulse (重力脉冲)
      if (tech.pulseActive) {
        if (t >= tech.pulseNext) {
          tech.pulseNext = t + tech.pulseInterval;
          // Trigger visual
          g.effects.push({ kind:"shockwave", x:g.player.x, y:g.player.y, r:tech.pulseRange, color:"#00ffff", start:t, end:t+0.3 });
          SFX.shoot(t); // Reuse sound or new one

          // Push enemies
          const r2 = tech.pulseRange * tech.pulseRange;
          for (let i = 0; i < g.enemies.length; i++) {
            const e = g.enemies[i];
            if (e._dead) continue;
            const dx = e.x - g.player.x;
            const dy = e.y - g.player.y;
            const d2 = dx*dx + dy*dy;
            if (d2 < r2) {
              const dist = Math.sqrt(d2) || 1;
              const force = tech.pulseForce * (1 - dist/tech.pulseRange); // Stronger closer
              e.x += (dx/dist) * force;
              e.y += (dy/dist) * force;
              // Stun briefly
              e.slowed = true;
              e._ghostSlowUntil = t + 0.5;
            }
          }
        }
      }

      // 3. Repulsor Field (排斥力场)
      if (tech.repulsorActive) {
        const r2 = tech.repulsorRange * tech.repulsorRange;
        // Visual (faint) every frame? Too heavy. Every 0.5s
        if ((g._frameId % 30) === 0) {
           g.effects.push({ kind:"ring", x:g.player.x, y:g.player.y, r:tech.repulsorRange, color:"rgba(0,255,255,0.1)", start:t, end:t+0.1 });
        }
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e._dead) continue;
          const dx = e.x - g.player.x;
          const dy = e.y - g.player.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < r2) {
            const dist = Math.sqrt(d2) || 1;
            // Constant push away
            const force = tech.repulsorForce * dt * 10; 
            e.x += (dx/dist) * force;
            e.y += (dy/dist) * force;
          }
        }
      }

      // 7. Shockwave Stomp (震荡践踏)
      if (tech.stompActive) {
        const isMoving = g.wasMovingLastFrame;
        if (!isMoving) {
          tech.stompTimer += dt;
          // Visual charge up
          if (Math.random() < 0.1) {
             g.emitSparks({x:g.player.x, y:g.player.y}, 1, "#ff00ff", t);
          }
          
          if (tech.stompTimer >= tech.stompChargeTime) {
             // BOOM
             tech.stompTimer = 0;
             g.effects.push({ kind:"shockwave", x:g.player.x, y:g.player.y, r:tech.stompRange, color:"#ff00ff", start:t, end:t+0.4 });
             g.shakeCamera(0.3, 10, t);
             SFX.kill(t, true); // Big sound

             const r2 = tech.stompRange * tech.stompRange;
             for (let i = 0; i < g.enemies.length; i++) {
               const e = g.enemies[i];
               if (e._dead) continue;
               const dx = e.x - g.player.x;
               const dy = e.y - g.player.y;
               const d2 = dx*dx + dy*dy;
               if (d2 < r2) {
                 const dist = Math.sqrt(d2) || 1;
                 const force = tech.stompForce;
                 e.x += (dx/dist) * force;
                 e.y += (dy/dist) * force;
                 g.applyDamageToEnemy(e, g.bulletDamage * 2, t); // Also dmg
               }
             }
          }
        } else {
          tech.stompTimer = 0;
        }
      }

      // 4. Kinetic Dash (Trail)
      if (tech.dashTrailActive && g.wasMovingLastFrame) {
        if (t >= tech.dashTrailNext) {
          tech.dashTrailNext = t + tech.dashTrailInterval;
          // Create a "Force Mine" that explodes instantly or lingers short time
          // Reusing mine system but with specific type
          g.mines.push({
            id: nextId(),
            x: g.player.x,
            y: g.player.y,
            r: 10,
            damage: 10, // Low damage
            radius: 80,
            born: t,
            isTechForce: true, // Special flag
            force: 200,
            color: "#00ffff"
          });
        }
      }

      // 5. Force Mine
      if (tech.forceMineActive && g.wasMovingLastFrame) {
         if (t >= tech.forceMineNext) {
             tech.forceMineNext = t + tech.forceMineInterval;
             g.mines.push({
                id: nextId(),
                x: g.player.x,
                y: g.player.y,
                r: 12,
                damage: 50,
                radius: 120,
                born: t,
                isTechForce: true,
                force: 400,
                color: "#ff00ff"
             });
         }
      }

      // 8. Kinetic Barrier (Orbital Wall)
      if (tech.barrierActive) {
         // Ensure barriers
         while (tech.barrierList.length < tech.barrierCount) {
             tech.barrierList.push({ ang: (TAU / tech.barrierCount) * tech.barrierList.length });
         }
         
         const speed = 1.0;
         const dist = 100;
         const w = 40;
         const h = 10;
         
         for (let i = 0; i < tech.barrierList.length; i++) {
             const b = tech.barrierList[i];
             b.ang += dt * speed;
             const bx = g.player.x + Math.cos(b.ang) * dist;
             const by = g.player.y + Math.sin(b.ang) * dist;
             
             // Visual
             // g.effects.push... (Too heavy per frame, render system should handle, but we don't have access to render loop here easily without modifying renderWithCssSize.js. We can use particles or fake it)
             if ((g._frameId % 5) === 0) {
                 g.particles.push({
                    kind: "spark", x: bx, y: by, vx: 0, vy: 0, r: 4, color: "#00ffff", born: t, die: t+0.2
                 });
             }

             // Collision
             for (let j = 0; j < g.enemies.length; j++) {
                 const e = g.enemies[j];
                 if (e._dead) continue;
                 const dx = e.x - bx;
                 const dy = e.y - by;
                 if (dx*dx + dy*dy < 40*40) { // Rough circle col
                     const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                     // Push OUT from player center, not barrier center (keeps them out)
                     const pdx = e.x - g.player.x;
                     const pdy = e.y - g.player.y;
                     const pdist = Math.sqrt(pdx*pdx + pdy*pdy) || 1;
                     
                     e.x += (pdx/pdist) * 20;
                     e.y += (pdy/pdist) * 20;
                 }
             }
         }
      }

      // 9. Pulse Drone
      if (tech.droneActive) {
         while (tech.droneList.length < tech.droneCount) {
             tech.droneList.push({ x: g.player.x, y: g.player.y, lastShot: 0 });
         }
         
         for (let i = 0; i < tech.droneList.length; i++) {
             const d = tech.droneList[i];
             // Follow player
             const tx = g.player.x + Math.cos(t + i) * 60;
             const ty = g.player.y + Math.sin(t + i) * 60;
             d.x += (tx - d.x) * 0.1;
             d.y += (ty - d.y) * 0.1;

             // Visual
             if ((g._frameId % 10) === 0) {
                 g.particles.push({ kind: "square", x: d.x, y: d.y, r: 3, color: "#ffff00", born: t, die: t+0.1 });
             }

             if (t - d.lastShot > 1.5) {
                 const target = g.getClosestEnemy({x:d.x, y:d.y});
                 if (target) {
                     d.lastShot = t;
                     // Shoot pulse bullet
                     // Custom logic: create bullet with special flag
                     const dx = target.x - d.x;
                     const dy = target.y - d.y;
                     const angle = Math.atan2(dy, dx);
                     const speed = 500;
                     
                     g.bullets.push({
                        id: nextId(),
                        x: d.x, y: d.y, w: 8, h: 8, rot: angle,
                        vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
                        born: t, die: t+1.0, pierceLeft: 0,
                        isPulse: true, // Special
                        hitIds: []
                     });
                 }
             }
         }
      }
    };

    // ------------------------------
    // NEW: Cyber System Logic (赛博军械库逻辑)
    // ------------------------------
    g.updateCyberSystem = (dt, t) => {
      const cyber = g.cyber;
      if (!cyber) return;

      // 1. Elements - Aura (光环)
      // elem_plasma_aura, elem_neon_aura, etc.
      if (cyber.elem_plasma_aura) {
         if ((g._frameId % 30) === 0) {
             const dmg = 10 * cyber.elem_plasma_aura;
             const range = 100;
             g.effects.push({ kind:"ring", x:g.player.x, y:g.player.y, r:range, color:"#00ffff", start:t, end:t+0.1 });
             for(let i=0; i<g.enemies.length; i++) {
                 const e = g.enemies[i];
                 if(e._dead) continue;
                 const d2 = (e.x-g.player.x)**2 + (e.y-g.player.y)**2;
                 if(d2 < range*range) g.applyDamageToEnemy(e, dmg, t);
             }
         }
      }
      if (cyber.elem_bio_aura) {
         if ((g._frameId % 60) === 0) {
             // Poison cloud around player
             g.createPoisonExplosion({x:g.player.x, y:g.player.y}, t);
         }
      }

      // 2. Drones
      if (cyber.drones && cyber.drones.length > 0) {
          for(let i=0; i<cyber.drones.length; i++) {
              const d = cyber.drones[i];
              if (d.x == null) { d.x = g.player.x; d.y = g.player.y; }
              
              // Movement (Orbit or Follow)
              const angle = t * 0.5 + (i * (TAU / cyber.drones.length));
              const tx = g.player.x + Math.cos(angle) * (60 + (i%2)*20);
              const ty = g.player.y + Math.sin(angle) * (60 + (i%2)*20);
              d.x += (tx - d.x) * 0.05;
              d.y += (ty - d.y) * 0.05;
              
              // Action
              const interval = d.behavior === 'rapid' ? 0.4 : (d.behavior === 'heavy' ? 1.5 : 0.8);
              if (t - (d.lastShot||0) > interval) {
                  const target = g.getClosestEnemy({x:d.x, y:d.y});
                  if (target) {
                      d.lastShot = t;
                      const damage = g.droneDamage * (d.level || 1) * (d.behavior==='heavy'?2:1) * (d.behavior==='swarm'?0.5:1);
                      
                      if (d.type === 'assault' || d.type === 'guard') {
                          g.fireDroneBullet({x:d.x, y:d.y}, target, t); // Reuse existing, modify dmg later or separate
                          // Or create specific cyber bullet
                          const dx = target.x - d.x, dy = target.y - d.y;
                          const ang = Math.atan2(dy, dx);
                          g.bullets.push({
                              id: nextId(), x:d.x, y:d.y, w:5, h:10, rot:ang,
                              vx:Math.cos(ang)*400, vy:Math.sin(ang)*400,
                              born:t, die:t+2, pierceLeft:0,
                              chargeBonus: damage / g.bulletDamage, // Hack to scale damage
                              hitIds: []
                          });
                      } else if (d.type === 'bomber') {
                          g.dropMine({x:d.x, y:d.y}, t);
                      } else if (d.type === 'laser') {
                          // Instant hit
                          g.effects.push({ kind:"line", x1:d.x, y1:d.y, x2:target.x, y2:target.y, start:t, end:t+0.1, color:"#ff0000" });
                          g.applyDamageToEnemy(target, damage * 0.5, t);
                      }
                  }
              }
          }
      }
    };

    g.update = (t) => {
      // --- frame delta (real dt) ---
      // Use real dt to keep movement consistent and reduce stutter sensitivity.
      // (Old code used a fixed 0.016 which made long frames feel worse.)
      let dtBase = 0.016;
      if (g._lastUpdateT != null) {
        dtBase = t - g._lastUpdateT;
        if (!Number.isFinite(dtBase) || dtBase <= 0) dtBase = 0.016;
      }
      dtBase = clamp(dtBase, 0.001, 0.05);
      g._lastUpdateT = t;

      // Per-frame FX budget reset
      g._frameId = (g._frameId || 0) + 1;
      g._fxParticlesThisFrame = 0;

      // Always process queued kills to keep state consistent
      if (g._killQueue && g._killQueue.length) g.processKillQueue(t);

      if (g.isPausedGame) return;

      // time warp end
      if (g.timeWarpActive && t > g.timeWarpEndTime) g.timeWarpActive = false;

      // cache nearby enemies (used by clearing/crowd damage logic)
      let nearby = 0;
      const px = g.player.x, py = g.player.y;
      const range2 = 300 * 300;
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead) continue;
        const dx = e.x - px, dy = e.y - py;
        if (dx * dx + dy * dy < range2) nearby++;
      }
      g._nearbyEnemyCount = nearby;

      const timeScale = g.timeWarpActive ? 0.5 : 1.0;

      // hit stop: optional slow-motion on hit/kill (for "juicy" feel)
      // 默认关闭：否则会出现“敌人一死移动就卡一下”（FPS 仍然 60）
      // 如需开启：把 GameConfig.hitStopEnabled 改成 true
      let hitScale = 1.0;
      if (GameConfig.hitStopEnabled) {
        if (t < (g.hitStopEnd || 0)) {
          hitScale = g.hitStopScale || 0.25;
        } else {
          g.hitStopScale = 1.0;
        }
      }

      const dt = dtBase * timeScale * hitScale;

      // pending death (last stand)
      if (g._pendingDeathAt != null && t >= g._pendingDeathAt) {
        if (g.playerHealth <= 1) {
          g.playerHealth = 0;
          g.isPausedGame = true;
          g.isGameOver = true;
          if (typeof g.onGameOver === "function") g.onGameOver();
        }
        g._pendingDeathAt = null;
      }

      // 1. movement
      const isMoving = (g.joystickVector.dx !== 0 || g.joystickVector.dy !== 0);
      if (isMoving) {
        let actualSpeed = GameConfig.basePlayerSpeed * g.playerSpeedMulti;

        // momentum
        if (g.momentumEnabled) {
          g.currentMomentum = Math.min(g.currentMomentum + dt * 2, 1.0);
          actualSpeed *= (1.0 + g.currentMomentum * 0.5);
        }

        g.player.x += g.joystickVector.dx * actualSpeed * dt;
        g.player.y += g.joystickVector.dy * actualSpeed * dt;

        // fire trail
        if (g.fireTrailEnabled && (t - g.lastFireTrailTime) > 0.1) {
          g.createFireTrail({x:g.player.x, y:g.player.y}, t);
          g.lastFireTrailTime = t;
        }
      } else {
        // charge
        if (g.chargeAttackEnabled) {
          g.currentCharge = Math.min(g.currentCharge + dt * g.chargeSpeed, g.chargeMaxBonus);
        }
        // momentum decay
        if (g.momentumEnabled) {
          g.currentMomentum = Math.max(g.currentMomentum - dt * 3, 0);
        }
      }
      g.wasMovingLastFrame = isMoving;

      // camera follows player
      g.camera.x = g.player.x;
      g.camera.y = g.player.y;

      // 2. auto shoot
      let effectiveShootInterval = g.shootInterval;
      if (isMoving && g.movingFireRateBonus > 0) {
        effectiveShootInterval *= (1.0 - g.movingFireRateBonus);
      }
      if (g.berserkerMode && (g.playerHealth / g.playerMaxHealth) < g.berserkerThreshold) {
        effectiveShootInterval *= 0.5;
      }
      if ((t - g.lastShootTime) > effectiveShootInterval) {
        if (g.enemies.length > 0) {
          g.shoot(t);
          g.lastShootTime = t;
        }
      }

      // 3. regen
      let effectiveRegen = g.regenRate;
      if (g.combatRegenBoost && (t - g.lastDamageTime) < 5.0) effectiveRegen *= 3;
      if (g.emergencyHealActive && (g.playerHealth / g.playerMaxHealth) < 0.25) {
        effectiveRegen += g.playerMaxHealth * 0.05;
      }
      if (effectiveRegen > 0 && (t - g.lastRegenTime) > 1.0) {
        g.heal(effectiveRegen);
        g.lastRegenTime = t;
      }

      // 4. mine drop
      if (g.mineDropEnabled && isMoving && (t - g.lastMineTime) > g.mineDropInterval) {
        g.dropMine({x:g.player.x, y:g.player.y}, t);
        g.lastMineTime = t;
      }

      // 5. meteor
      if (g.meteorEnabled && (t - g.lastMeteorTime) > g.meteorInterval) {
        for (let i = 0; i < g.meteorCount; i++) g.summonMeteor(t);
        g.lastMeteorTime = t;
      }

      // 6. black hole
      if (g.blackHoleAbility && (t - g.lastBlackHoleTime) > 15.0) {
        const cluster = g.findEnemyCluster(300);
        const pos = cluster || { x: g.player.x, y: g.player.y };
        g.createBlackHole(pos, t, false);
        g.lastBlackHoleTime = t;
      }

      // 7. kill streak decay
      if (g.killStreakEnabled && (t - g.lastKillTime) > 3.0) {
        g.killStreak = Math.max(0, g.killStreak - 1);
      }

      // 8. systems update
      g.updateEnemies(dt, t);
      g.updateTechSystem(dt, t);
      g.updateCyberSystem(dt, t); // NEW: Cyber system update
      g.updateOrbitals(dt, t);
      g.updateDrones(t);
      g.updateGhosts(t);
      g.updateBulletHoming(dt, t);
      g.updateLightningAura(dt, t);
      g.updateEnemyBullets(dt, t);  // NEW: update enemy projectiles
      
      // NEW: 魔法系统更新
      if (window.MagicSystemLogic && window.MagicSystemLogic.updateMagicSystem) {
        window.MagicSystemLogic.updateMagicSystem(g, dt, t);
      }

      // Move bullets (physics)
      for (let i = 0; i < g.bullets.length; i++) {
        const b = g.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }

      // Fire trail damage tick + lifetime
      for (let i = 0; i < g.fireTrails.length; i++) {
        const ft = g.fireTrails[i];
        if (t >= ft.die) { ft._dead = true; continue; }
        if ((t - ft.lastTick) >= 0.2) {
          for (let j = 0; j < g.enemies.length; j++) {
            const e = g.enemies[j];
            if (e._dead) continue;
            const dx = e.x - ft.x, dy = e.y - ft.y;
            if (dx*dx + dy*dy < 20*20) {
              g.applyDamageToEnemy(e, g.fireTrailDamage, t);
              if (g.fireTrailSlow) e.slowed = true; // Swift: no clear
            }
          }
          ft.lastTick = t;
        }
      }

      // Meteor warnings resolve
      for (let i = 0; i < g.warnings.length; i++) {
        const w = g.warnings[i];
        if ((t - w.born) > 1.0 && !w._done) {
          w._done = true;
          g.createExplosionEffect({x:w.x, y:w.y}, 80, t);
          SFX.kill(t, true);
          g.flash("#ff3b30", 0.10, 0.10, t);
          g.shakeCamera(0.16, 12, t);
          g.hitStop(0.05, 0.22, t);
          g.emitBurst({x:w.x, y:w.y}, 30, "#ff3b30", t, 820);
          for (let j = 0; j < g.enemies.length; j++) {
            const e = g.enemies[j];
            if (e._dead) continue;
            const dx = e.x - w.x, dy = e.y - w.y;
            if (dx*dx + dy*dy < 80*80) {
              g.applyDamageToEnemy(e, g.meteorDamage, t, { immediate: true });
            }
          }
        }
        if ((t - w.born) > 1.05) w._dead = true;
      }

      // Black holes tick + lifetime
      for (let i = 0; i < g.blackHoles.length; i++) {
        const bh = g.blackHoles[i];
        if (t >= bh.nextTick && t <= bh.end) {
          bh.nextTick += 0.05;
          for (let j = 0; j < g.enemies.length; j++) {
            const e = g.enemies[j];
            if (e._dead) continue;
            const dx = bh.x - e.x, dy = bh.y - e.y;
            const dist = hypot(dx, dy);
            if (dist < bh.radius * 2) {
              const pull = g.blackHolePower * 5;
              const len = dist || 1;
              e.x += (dx / len) * pull;
              e.y += (dy / len) * pull;
              if (dist < 30) g.applyDamageToEnemy(e, 10, t);
            }
          }
        }
        if (t > bh.fadeEnd) bh._dead = true;
      }

      // Poison clouds tick + lifetime
      for (let i = 0; i < g.poisonClouds.length; i++) {
        const pc = g.poisonClouds[i];
        if (t >= pc.nextTick && pc.ticks < 10) {
          pc.nextTick += 0.3;
          pc.ticks += 1;
          for (let j = 0; j < g.enemies.length; j++) {
            const e = g.enemies[j];
            if (e._dead) continue;
            const dx = e.x - pc.x, dy = e.y - pc.y;
            if (dx*dx + dy*dy < pc.radius*pc.radius) {
              g.applyDamageToEnemy(e, g.poisonDamage, t);
            }
          }
        }
        if (t > pc.fadeEnd) pc._dead = true;
      }

      // Exp orbs
      g.updateExpOrbs(t);

      // Collisions: bullets vs enemies
      for (let bi = 0; bi < g.bullets.length; bi++) {
        const b = g.bullets[bi];
        if (t >= b.die) {
          if (g.blackHoleOnDeath) g.createBlackHole({x:b.x, y:b.y}, t, true);
          b._dead = true;
          continue;
        }
        for (let ei = 0; ei < g.enemies.length; ei++) {
          const e = g.enemies[ei];
          if (e._dead) continue;
          // Prevent multi-hit on the same enemy for piercing projectiles (cheap small array scan)
          if (b.hitIds && b.hitIds.length) {
            let already = false;
            for (let hi = 0; hi < b.hitIds.length; hi++) {
              if (b.hitIds[hi] === e.id) { already = true; break; }
            }
            if (already) continue;
          }

          // rough collision: circle vs circle
          const dx = e.x - b.x, dy = e.y - b.y;
          const rr = (Math.max(e.w,e.h)/2 + Math.max(b.w,b.h)/2);
          if (dx*dx + dy*dy <= rr*rr) {
            if (!b.hitIds) b.hitIds = [];
            b.hitIds.push(e.id);
            g.handleBulletHit(b, e, t);
            if (b._dead) break;
          }
        }
      }

      // Collisions: mines vs enemies
      for (let mi = 0; mi < g.mines.length; mi++) {
        const m = g.mines[mi];
        for (let ei = 0; ei < g.enemies.length; ei++) {
          const e = g.enemies[ei];
          if (e._dead) continue;
          const dx = e.x - m.x, dy = e.y - m.y;
          const rr = m.r + Math.max(e.w,e.h)/2;
          if (dx*dx + dy*dy <= rr*rr) {
            g.handleMineHit(m, t);
            break;
          }
        }
      }

      // Collisions: player vs enemy
      for (let ei = 0; ei < g.enemies.length; ei++) {
        const e = g.enemies[ei];
        if (e._dead) continue;
        const dx = e.x - g.player.x, dy = e.y - g.player.y;
        const rr = g.player.r + Math.max(e.w,e.h)/2;
        if (dx*dx + dy*dy <= rr*rr) {
          g.handlePlayerHit(e, t);
        }
      }

      // Process queued kills (avoid recursive kill chains)
      g.processKillQueue(t);

      // Particles update
      for (let i = 0; i < g.particles.length; i++) {
        const p = g.particles[i];
        p.px = p.x; p.py = p.y;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.90;
        p.vy *= 0.90;
        if (t > p.die) p._dead = true;
      }

      // Cleanup (in-place, avoid GC spikes from Array.filter allocations)
      // enemies
      for (let i = g.enemies.length - 1; i >= 0; i--) {
        const e = g.enemies[i];
        if (e._dead || e._removed) {
          g.enemies[i] = g.enemies[g.enemies.length - 1];
          g.enemies.pop();
        }
      }

      for (let i = g.bullets.length - 1; i >= 0; i--) {
        if (g.bullets[i]._dead) {
          g.bullets[i] = g.bullets[g.bullets.length - 1];
          g.bullets.pop();
        }
      }
      for (let i = g.expOrbs.length - 1; i >= 0; i--) {
        if (g.expOrbs[i]._dead) {
          g.expOrbs[i] = g.expOrbs[g.expOrbs.length - 1];
          g.expOrbs.pop();
        }
      }
      for (let i = g.mines.length - 1; i >= 0; i--) {
        if (g.mines[i]._dead) {
          g.mines[i] = g.mines[g.mines.length - 1];
          g.mines.pop();
        }
      }
      for (let i = g.fireTrails.length - 1; i >= 0; i--) {
        if (g.fireTrails[i]._dead) {
          g.fireTrails[i] = g.fireTrails[g.fireTrails.length - 1];
          g.fireTrails.pop();
        }
      }
      for (let i = g.warnings.length - 1; i >= 0; i--) {
        if (g.warnings[i]._dead) {
          g.warnings[i] = g.warnings[g.warnings.length - 1];
          g.warnings.pop();
        }
      }
      for (let i = g.blackHoles.length - 1; i >= 0; i--) {
        if (g.blackHoles[i]._dead) {
          g.blackHoles[i] = g.blackHoles[g.blackHoles.length - 1];
          g.blackHoles.pop();
        }
      }
      for (let i = g.poisonClouds.length - 1; i >= 0; i--) {
        if (g.poisonClouds[i]._dead) {
          g.poisonClouds[i] = g.poisonClouds[g.poisonClouds.length - 1];
          g.poisonClouds.pop();
        }
      }
      for (let i = g.particles.length - 1; i >= 0; i--) {
        if (g.particles[i]._dead) {
          g.particles[i] = g.particles[g.particles.length - 1];
          g.particles.pop();
        }
      }
      for (let i = g.effects.length - 1; i >= 0; i--) {
        if (t >= g.effects[i].end) {
          g.effects[i] = g.effects[g.effects.length - 1];
          g.effects.pop();
        }
      }
    };

    // ------------------------------
    // Rendering
    // ------------------------------
    g.render = (t) => {
      const w = canvas.width;
      const h = canvas.height;

      // camera shake
      let camX = g.camera.x;
      let camY = g.camera.y;
      if (t < g.camera.shakeEnd) {
        const amp = g.camera.shakeAmp;
        camX += rand(-amp, amp);
        camY += rand(-amp, amp);
      }

      // background
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = "#000";
      ctx.fillRect(0,0,w,h);

      // grid tiles (like Swift)
      const gridSize = 200;
      const worldLeft = camX - w/2;
      const worldRight = camX + w/2;
      const worldTop = camY - h/2;
      const worldBottom = camY + h/2;

      const gx0 = Math.floor(worldLeft / gridSize) - 1;
      const gx1 = Math.floor(worldRight / gridSize) + 1;
      const gy0 = Math.floor(worldTop / gridSize) - 1;
      const gy1 = Math.floor(worldBottom / gridSize) + 1;

      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let gx = gx0; gx <= gx1; gx++) {
        for (let gy = gy0; gy <= gy1; gy++) {
          if (((gx + gy) & 1) === 0) {
            const x = gx * gridSize - camX + w/2;
            const y = gy * gridSize - camY + h/2;
            ctx.fillRect(x - gridSize/2, y - gridSize/2, gridSize, gridSize);
          }
        }
      }

      // helper: world->screen
      const sx = (x) => (x - camX + w/2);
      const sy = (y) => (y - camY + h/2);

      // black holes
      for (let i = 0; i < g.blackHoles.length; i++) {
        const bh = g.blackHoles[i];
        const alpha = (t > bh.end) ? clamp(1 - (t - bh.end)/0.3, 0, 1) : 1;
        ctx.beginPath();
        ctx.arc(sx(bh.x), sy(bh.y), bh.radius, 0, TAU);
        ctx.fillStyle = `rgba(168,85,247,${0.35*alpha})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(168,85,247,${0.8*alpha})`;
        ctx.stroke();
      }

      // poison clouds
      for (let i = 0; i < g.poisonClouds.length; i++) {
        const pc = g.poisonClouds[i];
        let alpha = 0.4;
        if (t > pc.fadeStart) alpha *= clamp(1 - (t - pc.fadeStart)/(pc.fadeEnd - pc.fadeStart), 0, 1);
        ctx.beginPath();
        ctx.arc(sx(pc.x), sy(pc.y), pc.radius, 0, TAU);
        ctx.fillStyle = `rgba(52,199,89,${alpha})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(52,199,89,${alpha})`;
        ctx.stroke();
      }

      // fire trails
      for (let i = 0; i < g.fireTrails.length; i++) {
        const ft = g.fireTrails[i];
        const duration = ft.die - ft.born;
        const life = clamp((ft.die - t) / duration, 0, 1);
        ctx.beginPath();
        ctx.arc(sx(ft.x), sy(ft.y), ft.r * (0.5 + 0.5*life), 0, TAU);
        ctx.fillStyle = `rgba(255,149,0,${0.55*life})`;
        ctx.fill();
      }

      // mines
      for (let i = 0; i < g.mines.length; i++) {
        const m = g.mines[i];
        const pulse = 0.5 + 0.5*Math.sin((t - m.born)*8);
        ctx.beginPath();
        ctx.arc(sx(m.x), sy(m.y), m.r, 0, TAU);
        ctx.fillStyle = `rgba(255,149,0,${0.65 + 0.2*pulse})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,59,48,0.9)";
        ctx.stroke();
      }

      // exp orbs
      for (let i = 0; i < g.expOrbs.length; i++) {
        const o = g.expOrbs[i];
        ctx.beginPath();
        ctx.arc(sx(o.x), sy(o.y), o.r, 0, TAU);
        ctx.fillStyle = o.color || "#34c759";
        ctx.fill();
      }

      // enemies (simple but distinct models)
      const roundRectPath = (x, y, w, h, r) => {
        const rr = clamp(r, 0, Math.min(w, h) * 0.5);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + w - rr, y);
        ctx.arcTo(x + w, y, x + w, y + rr, rr);
        ctx.lineTo(x + w, y + h - rr);
        ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
        ctx.lineTo(x + rr, y + h);
        ctx.arcTo(x, y + h, x, y + h - rr, rr);
        ctx.lineTo(x, y + rr);
        ctx.arcTo(x, y, x + rr, y, rr);
        ctx.closePath();
      };

      const drawPoly = (sides, radius, rot0 = -Math.PI/2) => {
        ctx.beginPath();
        for (let k = 0; k < sides; k++) {
          const a = rot0 + k * (TAU / sides);
          const px = Math.cos(a) * radius;
          const py = Math.sin(a) * radius;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      };

      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        ctx.save();
        ctx.translate(sx(e.x), sy(e.y));
        ctx.rotate(e.rot || 0);

        const col = e.color || "#ff3b30";
        ctx.fillStyle = col;

        const w = e.w || 30;
        const h = e.h || 30;
        const hw = w * 0.5;
        const hh = h * 0.5;

        switch (e.model) {
          case "circle": {
            const r = Math.max(hw, hh);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TAU);
            ctx.fill();
            break;
          }
          case "tiny": {
            const r = Math.max(6, Math.min(hw, hh));
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TAU);
            ctx.fill();
            break;
          }
          case "triangle": {
            ctx.beginPath();
            ctx.moveTo(0, -hh);
            ctx.lineTo(hw, hh);
            ctx.lineTo(-hw, hh);
            ctx.closePath();
            ctx.fill();
            break;
          }
          case "diamond": {
            ctx.beginPath();
            ctx.moveTo(0, -hh);
            ctx.lineTo(hw, 0);
            ctx.lineTo(0, hh);
            ctx.lineTo(-hw, 0);
            ctx.closePath();
            ctx.fill();
            break;
          }
          case "diamondSharp": {
            ctx.beginPath();
            ctx.moveTo(0, -hh * 1.15);
            ctx.lineTo(hw * 0.85, 0);
            ctx.lineTo(0, hh * 1.15);
            ctx.lineTo(-hw * 0.85, 0);
            ctx.closePath();
            ctx.fill();
            break;
          }
          case "rectWide": {
            ctx.fillRect(-hw, -hh, w, h);
            ctx.fillStyle = colorWithAlpha("#000000", 0.18);
            ctx.fillRect(-hw, -3, w, 6);
            break;
          }
          case "squareHeavy": {
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeStyle = colorWithAlpha("#000000", 0.35);
            ctx.lineWidth = 3;
            ctx.strokeRect(-hw + 1.5, -hh + 1.5, w - 3, h - 3);
            break;
          }
          case "squareShield": {
            ctx.fillRect(-hw, -hh, w, h);
            ctx.strokeStyle = colorWithAlpha("#ffffff", 0.55);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -hh * 0.65);
            ctx.lineTo(hw * 0.55, -hh * 0.10);
            ctx.lineTo(hw * 0.38, hh * 0.55);
            ctx.lineTo(0, hh * 0.75);
            ctx.lineTo(-hw * 0.38, hh * 0.55);
            ctx.lineTo(-hw * 0.55, -hh * 0.10);
            ctx.closePath();
            ctx.stroke();
            break;
          }
          case "capsule": {
            const r = Math.min(hw, hh) * 0.95;
            roundRectPath(-hw, -hh, w, h, r);
            ctx.fill();
            break;
          }
          case "pentagon": {
            drawPoly(5, Math.max(hw, hh));
            ctx.fill();
            break;
          }
          case "hex": {
            drawPoly(6, Math.max(hw, hh));
            ctx.fill();
            break;
          }
          case "circleDot": {
            const r = Math.max(hw, hh);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TAU);
            ctx.fill();
            ctx.fillStyle = colorWithAlpha("#000000", 0.22);
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(2.5, r * 0.25), 0, TAU);
            ctx.fill();
            break;
          }
          // NEW: Eye model for predictor enemy
          case "eye": {
            const r = Math.max(hw, hh);
            // Outer eye
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TAU);
            ctx.fill();
            // Inner pupil (dark)
            ctx.fillStyle = colorWithAlpha("#000000", 0.75);
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.45, 0, TAU);
            ctx.fill();
            // Highlight
            ctx.fillStyle = colorWithAlpha("#ffffff", 0.65);
            ctx.beginPath();
            ctx.arc(-r * 0.2, -r * 0.2, r * 0.15, 0, TAU);
            ctx.fill();
            break;
          }
          // NEW: Arrow model for flanker enemy
          case "arrow": {
            ctx.beginPath();
            // Arrow pointing right (will be rotated by e.rot)
            ctx.moveTo(hw, 0);           // tip
            ctx.lineTo(-hw * 0.3, -hh);  // top back
            ctx.lineTo(-hw * 0.1, 0);    // notch
            ctx.lineTo(-hw * 0.3, hh);   // bottom back
            ctx.closePath();
            ctx.fill();
            break;
          }
          // NEW: Star model for shooter enemy
          case "star": {
            const r = Math.max(hw, hh);
            const innerR = r * 0.45;
            const points = 5;
            ctx.beginPath();
            for (let k = 0; k < points * 2; k++) {
              const a = -Math.PI / 2 + k * (Math.PI / points);
              const rad = (k % 2 === 0) ? r : innerR;
              const px = Math.cos(a) * rad;
              const py = Math.sin(a) * rad;
              if (k === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            break;
          }
          default: {
            ctx.fillRect(-hw, -hh, w, h);
          }
        }

        // HP bar for elites / big units / bosses
        const isBig = (e.typeId === "elite") || e.isBoss || ((e.maxHp || 0) >= 140);
        if (isBig) {
          const bw = Math.max(38, w);
          const bh = 4;
          ctx.fillStyle = "rgba(0,0,0,.45)";
          ctx.fillRect(-bw/2, -hh - 12, bw, bh);
          ctx.fillStyle = "#34c759";
          ctx.fillRect(-bw/2, -hh - 12, bw * clamp((e.hp || 0) / Math.max(1, e.maxHp || 1), 0, 1), bh);
        }

        ctx.restore();
      }

      // orbitals
      for (let i = 0; i < g.orbitals.length; i++) {
        const o = g.orbitals[i];
        if (o.type === "shield") {
          ctx.beginPath();
          ctx.arc(sx(o.x), sy(o.y), o.r, 0, TAU);
          ctx.fillStyle = "rgba(0,122,255,0.55)";
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "rgba(0,215,255,0.95)";
          ctx.stroke();
        } else {
          // blade: draw as a simple knife-like shape
          ctx.save();
          ctx.translate(sx(o.x), sy(o.y));
          ctx.rotate(o.rot);
          const bw = o.w, bh = o.h;

          // body
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.fillRect(-bw/2, -bh/2, bw, bh);

          // tip
          ctx.beginPath();
          ctx.moveTo(bw/2, -bh/2);
          ctx.lineTo(bw/2 + bh*1.2, 0);
          ctx.lineTo(bw/2, bh/2);
          ctx.closePath();
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.fill();

          // tiny guard
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(-bw/2 - 2, -bh/2, 4, bh);

          ctx.restore();
        }
      }

      // drones
      for (let i = 0; i < g.drones.length; i++) {
        const d = g.drones[i];
        ctx.fillStyle = "rgba(180,180,180,0.95)";
        ctx.fillRect(sx(d.x) - 10, sy(d.y) - 10, 20, 20);
      }

      // ghosts
      for (let i = 0; i < g.ghosts.length; i++) {
        const gh = g.ghosts[i];
        ctx.beginPath();
        ctx.arc(sx(gh.x), sy(gh.y), 15, 0, TAU);
        ctx.fillStyle = "rgba(168,85,247,0.45)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(168,85,247,0.85)";
        ctx.stroke();
      }

      // bullets
      for (let i = 0; i < g.bullets.length; i++) {
        const b = g.bullets[i];
        ctx.save();
        ctx.translate(sx(b.x), sy(b.y));
        ctx.rotate(b.rot);

        // trail
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(-1, 2, 2, 10);

        // body
        ctx.fillStyle = b.droneBullet ? "rgba(255,149,0,0.95)" : "rgba(255,214,10,0.95)";
        ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
        ctx.restore();
      }

      // NEW: enemy bullets (projectiles from shooter enemies)
      for (let i = 0; i < g.enemyBullets.length; i++) {
        const eb = g.enemyBullets[i];
        ctx.beginPath();
        ctx.arc(sx(eb.x), sy(eb.y), eb.r, 0, TAU);
        ctx.fillStyle = eb.color || "#f472b6";
        ctx.fill();
        // Add a glow effect
        ctx.beginPath();
        ctx.arc(sx(eb.x), sy(eb.y), eb.r * 1.5, 0, TAU);
        ctx.fillStyle = colorWithAlpha(eb.color || "#f472b6", 0.3);
        ctx.fill();
      }

      // meteor warning circles
      for (let i = 0; i < g.warnings.length; i++) {
        const w0 = g.warnings[i];
        const alpha = clamp(1 - (t - w0.born)/1.0, 0, 1);
        ctx.beginPath();
        ctx.arc(sx(w0.x), sy(w0.y), 50, 0, TAU);
        ctx.fillStyle = `rgba(255,59,48,${0.20 + 0.15*alpha})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(255,59,48,${0.65 + 0.25*alpha})`;
        ctx.stroke();
      }

      // player
      ctx.fillStyle = g.player.color;
      ctx.fillRect(sx(g.player.x) - 15, sy(g.player.y) - 15, 30, 30);

      // effects
      for (let i = 0; i < g.effects.length; i++) {
        const ef = g.effects[i];
        const life = clamp((t - ef.start) / (ef.end - ef.start), 0, 1);
        const inv = 1 - life;

        if (ef.kind === "hit") {
          ctx.beginPath();
          ctx.arc(sx(ef.x), sy(ef.y), 3 * inv, 0, TAU);
          ctx.fillStyle = `rgba(255,214,10,${inv})`;
          ctx.fill();
        } else if (ef.kind === "explosion") {
          ctx.beginPath();
          ctx.arc(sx(ef.x), sy(ef.y), ef.r, 0, TAU);
          ctx.fillStyle = `rgba(255,149,0,${0.5*inv})`;
          ctx.fill();
        } else if (ef.kind === "damageText") {
          const y = ef.y - life * 30;
          let fs = ef.isLucky ? 32 : (ef.isCrit ? 24 : 16);
          ctx.font = `bold ${fs}px sans-serif`;
          const col = ef.isLucky ? "#ffd60a" : (ef.isCrit ? "#ff3b30" : "#ffffff");
          ctx.fillStyle = `rgba(${parseInt(col.slice(1,3),16)},${parseInt(col.slice(3,5),16)},${parseInt(col.slice(5,7),16)},${inv})`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(ef.val), sx(ef.x), sy(y));
        } else if (ef.kind === "label") {
          const y = ef.y - life * 30;
          ctx.font = "bold 20px sans-serif";
          ctx.fillStyle = colorWithAlpha(ef.color || "#ffffff", inv);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ef.text, sx(ef.x), sy(y));
        } else if (ef.kind === "phoenix") {
          const scale = 1 + life;
          ctx.beginPath();
          ctx.arc(sx(ef.x), sy(ef.y), 100 * scale, 0, TAU);
          ctx.fillStyle = `rgba(255,149,0,${0.35*inv})`;
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = `rgba(255,149,0,${0.85*inv})`;
          ctx.stroke();
        } else if (ef.kind === "line") {
          ctx.beginPath();
          ctx.moveTo(sx(ef.x1), sy(ef.y1));
          ctx.lineTo(sx(ef.x2), sy(ef.y2));
          ctx.strokeStyle = `rgba(0,215,255,${inv})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (ef.kind === "enemyHit") {
          ctx.beginPath();
          ctx.arc(sx(ef.x), sy(ef.y), 16 * inv, 0, TAU);
          ctx.strokeStyle = `rgba(255,255,255,${0.45*inv})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // screen flash
      if (g.screenFlash && t < g.screenFlash.end) {
        const a = clamp(1 - (t - g.screenFlash.start) / (g.screenFlash.end - g.screenFlash.start), 0, 1);
        ctx.fillStyle = g.screenFlash.color.replace("0.30", (0.30 * a).toFixed(3));
        ctx.fillRect(0,0,w,h);
      }
    };

    return g;
  }

  GameApp.makeGame = makeGame;
})();
