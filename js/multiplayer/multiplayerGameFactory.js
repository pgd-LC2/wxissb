/**
 * 联机游戏工厂模块
 * 基于 gameFactory.js 改造，支持多玩家
 * 
 * 核心改动：
 * 1. player → players 对象 (支持多个玩家)
 * 2. 每个玩家有独立的 PlayerState (stats, skills, exp, level)
 * 3. 子弹携带 ownerId 和 ownerStatsSnapshot
 * 4. Host 权威模型：只有 Host 运行世界逻辑
 */
(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};

  /**
   * 创建玩家状态对象
   * 每个玩家独立的成长数据
   */
  function createPlayerState(playerId, playerIndex, playerName) {
    const colors = ['#00d7ff', '#ff6b6b']; // 玩家1: 青色, 玩家2: 红色
    
    return {
      // 基础信息
      id: playerId,
      index: playerIndex,
      name: playerName,
      color: colors[playerIndex] || '#00d7ff',
      
      // 位置
      x: playerIndex === 0 ? -50 : 50,
      y: 0,
      r: 15,
      lastHit: -999,
      
      // 生命值
      health: 100,
      maxHealth: 100,
      
      // 经验和等级
      exp: 0,
      maxExp: 70,
      level: 1,
      isLevelingUp: false,
      
      // 输入
      joystickVector: { dx: 0, dy: 0 },
      
      // 技能相关
      acquiredSkills: [],
      acquiredSkillMeta: [],
      skillChoices: [],
      
      // ========== 属性系统 ==========
      // 基础属性
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
      expMagnetAll: false,
      critRate: 0.05,
      critDamageMulti: 2.0,
      damageReduction: 0,
      expMultiplier: 1.0,
      regenRate: 0,
      
      // 子弹变体
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
      
      // 防御属性
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
      
      // 召唤物
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
      
      // 触发机制
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
      
      // 特殊属性
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
      
      // 飞刀升级参数
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
      
      // 时间记录
      lastShootTime: 0,
      lastRegenTime: 0,
      lastMineTime: 0,
      lastMeteorTime: 0,
      lastBlackHoleTime: 0,
      lastFireTrailTime: 0,
      wasMovingLastFrame: false,
      
      // 统计
      stats: {
        kills: 0,
        dmgDealt: 0,
        dmgTaken: 0,
        expGained: 0
      }
    };
  }

  /**
   * 创建属性快照 (用于子弹伤害计算)
   */
  function createStatsSnapshot(playerState) {
    return {
      bulletDamage: playerState.bulletDamage,
      critRate: playerState.critRate,
      critDamageMulti: playerState.critDamageMulti,
      pierceCount: playerState.pierceCount,
      lifestealChance: playerState.lifestealChance,
      lifestealPercent: playerState.lifestealPercent,
      areaDamageRadius: playerState.areaDamageRadius,
      freezeChance: playerState.freezeChance,
      freezeDuration: playerState.freezeDuration,
      burnChance: playerState.burnChance,
      burnDamage: playerState.burnDamage,
      burnDuration: playerState.burnDuration,
      poisonChance: playerState.poisonChance,
      poisonDamage: playerState.poisonDamage,
      poisonDuration: playerState.poisonDuration,
      chainLightning: playerState.chainLightning,
      chainCount: playerState.chainCount,
      chainDamageDecay: playerState.chainDamageDecay,
      knockbackForce: playerState.knockbackForce,
      explosionKnockback: playerState.explosionKnockback,
      lowHpDamageBoost: playerState.lowHpDamageBoost,
      lowHpThreshold: playerState.lowHpThreshold,
      lowHpDamageMulti: playerState.lowHpDamageMulti,
      executeEnabled: playerState.executeEnabled,
      executeThreshold: playerState.executeThreshold,
      instantKillThreshold: playerState.instantKillThreshold
    };
  }

  /**
   * 创建联机游戏实例
   */
  function makeMultiplayerGame(isHost, myPlayerId, playersInfo) {
    const { utils, SFX, GameConfig, nextId } = GameApp.Deps;
    const { TAU, clamp, lerp, rand, nowSec, hypot, colorWithAlpha } = utils;
    const { canvas, ctx } = GameApp.DOM;

    // 数值安全函数
    const NUM_CAP = 9e15;
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

    // 格式化数字
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

    // ========== 游戏状态 ==========
    const g = {
      // 联机相关
      isHost: isHost,
      myPlayerId: myPlayerId,
      
      // 回调
      onLevelUp: null,
      onStateChange: null,
      onGameOver: null,
      onPlayerLevelUp: null, // 联机专用：某玩家升级
      
      // 玩家对象 (多人)
      players: {},
      
      // 相机 (跟随本地玩家)
      camera: { x: 0, y: 0, shakeEnd: 0, shakeAmp: 0 },
      
      // 共享实体 (Host 权威)
      enemies: [],
      bullets: [],
      expOrbs: [],
      orbitals: [],
      drones: [],
      ghosts: [],
      mines: [],
      fireTrails: [],
      warnings: [],
      blackHoles: [],
      poisonClouds: [],
      enemyBullets: [],
      effects: [],
      particles: [],
      screenFlash: null,
      hitStopEnd: 0,
      hitStopScale: 1.0,
      
      // Director (Host 权威)
      director: {
        diff: 1.0,
        strength: 0.0,
        lastSpawn: 0,
        targetCount: 10,
        spawnRate: 1.0
      },
      
      // 游戏状态
      isPausedGame: false,
      isGameOver: false,
      gameStartTime: 0,
      
      // 内部队列
      _killQueue: [],
      _lastUpdateT: null,
      _frameId: 0,
      _fxParticlesThisFrame: 0
    };

    // 初始化玩家
    playersInfo.forEach((info, index) => {
      g.players[info.id] = createPlayerState(info.id, index, info.name);
    });

    // ========== 辅助函数 ==========
    
    // 获取本地玩家
    g.getMyPlayer = () => g.players[myPlayerId];
    
    // 获取所有玩家数组
    g.getPlayersArray = () => Object.values(g.players);
    
    // 更新 UI
    g.updateUI = () => {
      if (typeof g.onStateChange === "function") {
        const myPlayer = g.getMyPlayer();
        if (myPlayer) {
          g.onStateChange(
            myPlayer.exp / myPlayer.maxExp,
            myPlayer.health / myPlayer.maxHealth,
            myPlayer.level
          );
        }
      }
    };

    // ========== 敌人定义 ==========
    g.enemyDefs = [
      { type: "basic", baseHp: 30, speed: 1.0, size: 25, color: "#ff4444", ai: "chase", exp: 10, unlock: 0.0, model: "circle" },
      { type: "fast", baseHp: 20, speed: 1.8, size: 20, color: "#ffaa00", ai: "zigzag", exp: 15, unlock: 0.1, model: "triangle" },
      { type: "tank", baseHp: 80, speed: 0.6, size: 35, color: "#8844ff", ai: "chase", exp: 25, unlock: 0.2, model: "square" },
      { type: "swarm", baseHp: 15, speed: 1.3, size: 18, color: "#44ff44", ai: "swarm", exp: 8, unlock: 0.15, model: "circle" },
      { type: "shooter", baseHp: 40, speed: 0.8, size: 28, color: "#ff44ff", ai: "kite", exp: 20, unlock: 0.25, model: "diamond", shoots: true },
      { type: "elite", baseHp: 150, speed: 0.9, size: 40, color: "#ffd700", ai: "chase", exp: 50, unlock: 0.4, model: "star" }
    ];

    g.getEnemyDef = (type) => g.enemyDefs.find(d => d.type === type) || g.enemyDefs[0];

    g.pickEnemyDef = (progress) => {
      const available = g.enemyDefs.filter(d => d.unlock <= progress);
      if (available.length === 0) return g.enemyDefs[0];
      
      // 加权随机
      const weights = available.map((d, i) => Math.pow(1.5, i));
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (let i = 0; i < available.length; i++) {
        r -= weights[i];
        if (r <= 0) return available[i];
      }
      return available[available.length - 1];
    };

    // ========== 敌人创建 ==========
    g.createEnemyFromDef = (def, x, y, t) => {
      const hp = Math.round(def.baseHp * g.director.diff);
      const enemy = {
        id: nextId(),
        type: def.type,
        x: x,
        y: y,
        hp: hp,
        maxHp: hp,
        speed: def.speed * GameConfig.baseEnemySpeed,
        w: def.size,
        h: def.size,
        color: def.color,
        ai: def.ai,
        exp: def.exp,
        model: def.model,
        shoots: def.shoots || false,
        lastShot: t,
        frozenUntil: 0,
        burnEnd: 0,
        burnDamage: 0,
        poisonEnd: 0,
        poisonDamage: 0,
        _dead: false,
        _marked: false,
        _vulnerability: 0
      };
      return enemy;
    };

    // ========== 子弹创建 (带 ownerId) ==========
    g.createBullet = (ownerId, x, y, vx, vy, t) => {
      const owner = g.players[ownerId];
      if (!owner) return null;
      
      const bullet = {
        id: nextId(),
        ownerId: ownerId,
        ownerStats: createStatsSnapshot(owner),
        x: x,
        y: y,
        vx: vx * owner.bulletSpeedMulti,
        vy: vy * owner.bulletSpeedMulti,
        w: 8 * owner.bulletScale,
        h: 8 * owner.bulletScale,
        born: t,
        die: t + owner.bulletLifetime,
        pierceLeft: owner.pierceCount,
        chargeBonus: owner.currentCharge || 0,
        hitEnemies: new Set()
      };
      
      g.bullets.push(bullet);
      return bullet;
    };

    // ========== 射击 ==========
    g.shootForPlayer = (playerId, t) => {
      const player = g.players[playerId];
      if (!player) return;
      
      // 找最近敌人
      let closest = null;
      let minDist = Infinity;
      for (const e of g.enemies) {
        if (e._dead) continue;
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          closest = e;
        }
      }
      
      if (!closest) return;
      
      const dx = closest.x - player.x;
      const dy = closest.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) return;
      
      const baseAngle = Math.atan2(dy, dx);
      const bulletSpeed = GameConfig.baseBulletSpeed;
      
      for (let i = 0; i < player.bulletCount; i++) {
        let angle = baseAngle;
        if (player.bulletCount > 1) {
          const spread = player.spreadAngle * (player.bulletCount - 1);
          angle = baseAngle - spread / 2 + (spread * i / (player.bulletCount - 1));
        }
        
        const vx = Math.cos(angle) * bulletSpeed;
        const vy = Math.sin(angle) * bulletSpeed;
        g.createBullet(playerId, player.x, player.y, vx, vy, t);
      }
      
      player.lastShootTime = t;
    };

    // ========== 伤害计算 ==========
    g.calculateDamage = (ownerStats, enemy) => {
      let damage = ownerStats.bulletDamage;
      let isCrit = false;
      
      // 暴击
      if (Math.random() < ownerStats.critRate) {
        damage *= ownerStats.critDamageMulti;
        isCrit = true;
      }
      
      // 处决
      if (ownerStats.executeEnabled && enemy.hp / enemy.maxHp < ownerStats.executeThreshold) {
        damage *= 2;
      }
      
      return { damage: Math.round(damage), isCrit };
    };

    // ========== 敌人受伤 ==========
    g.applyDamageToEnemy = (enemy, damage, ownerId, t) => {
      if (enemy._dead) return;
      
      enemy.hp -= damage;
      
      const owner = g.players[ownerId];
      if (owner) {
        owner.stats.dmgDealt += damage;
      }
      
      if (enemy.hp <= 0) {
        g.queueKill(enemy, ownerId, t);
      }
    };

    // ========== 击杀队列 ==========
    g.queueKill = (enemy, killerId, t) => {
      if (enemy._dead) return;
      enemy._dead = true;
      g._killQueue.push({ enemy, killerId, t });
    };

    g.processKillQueue = (t) => {
      while (g._killQueue.length > 0) {
        const { enemy, killerId, t: killTime } = g._killQueue.shift();
        g.killEnemy(enemy, killerId, killTime);
      }
    };

    g.killEnemy = (enemy, killerId, t) => {
      // 移除敌人
      const idx = g.enemies.indexOf(enemy);
      if (idx !== -1) {
        g.enemies.splice(idx, 1);
      }
      
      // 掉落经验球
      const expVal = enemy.exp || 10;
      g.spawnExpOrb(enemy.x, enemy.y, expVal);
      
      // 记录击杀
      const killer = g.players[killerId];
      if (killer) {
        killer.stats.kills++;
        killer.lastKillTime = t;
        
        // 击杀回血
        if (killer.killHealAmount > 0) {
          killer.health = Math.min(killer.maxHealth, killer.health + killer.killHealAmount);
        }
      }
    };

    // ========== 经验球 ==========
    g.spawnExpOrb = (x, y, val) => {
      g.expOrbs.push({
        id: nextId(),
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        val: val,
        r: 8
      });
    };

    // ========== 玩家拾取经验 ==========
    g.collectExpForPlayer = (playerId, orb, t) => {
      const player = g.players[playerId];
      if (!player) return;
      
      const expGain = Math.round(orb.val * player.expMultiplier);
      player.exp += expGain;
      player.stats.expGained += expGain;
      
      // 升级检查
      while (player.exp >= player.maxExp) {
        player.exp -= player.maxExp;
        player.level++;
        player.maxExp = Math.round(70 * Math.pow(1.15, player.level - 1));
        player.isLevelingUp = true;
        
        // 触发升级回调
        if (typeof g.onPlayerLevelUp === "function") {
          g.onPlayerLevelUp(playerId, player.level);
        }
      }
    };

    // ========== 玩家受伤 ==========
    g.damagePlayer = (playerId, damage, t) => {
      const player = g.players[playerId];
      if (!player) return;
      
      // 减伤
      const actualDamage = Math.round(damage * (1 - player.damageReduction));
      player.health -= actualDamage;
      player.stats.dmgTaken += actualDamage;
      player.lastHit = t;
      player.lastDamageTime = t;
      
      // 死亡检查
      if (player.health <= 0) {
        player.health = 0;
        g.checkGameOver();
      }
    };

    // ========== 游戏结束检查 ==========
    g.checkGameOver = () => {
      // V1: 任一玩家死亡则游戏结束
      for (const player of Object.values(g.players)) {
        if (player.health <= 0) {
          g.isGameOver = true;
          g.isPausedGame = true;
          if (typeof g.onGameOver === "function") {
            g.onGameOver();
          }
          return;
        }
      }
    };

    // ========== 技能选择 ==========
    g.generateSkillsForPlayer = (playerId) => {
      const player = g.players[playerId];
      if (!player) return;
      
      // 使用全局技能系统
      if (!g.allSkills || g.allSkills.length === 0) {
        if (window.SkillSystem && window.SkillSystem.generateAllSkills) {
          g.allSkills = window.SkillSystem.generateAllSkills();
        } else {
          g.allSkills = [];
        }
      }
      
      // 过滤已获得的技能
      const available = g.allSkills.filter(s => !player.acquiredSkills.includes(s.name));
      
      // 随机选择 3 个
      const chosen = [];
      const tmp = [...available];
      while (chosen.length < 3 && tmp.length > 0) {
        const idx = Math.floor(Math.random() * tmp.length);
        chosen.push(tmp[idx]);
        tmp.splice(idx, 1);
      }
      
      // 后备技能
      const fallbacks = [
        { name: "基础训练", description: "伤害 +5%", tier: 1, _repeatable: true, effect: (s) => { s.bulletDamage *= 1.05; } },
        { name: "体能训练", description: "生命 +10", tier: 1, _repeatable: true, effect: (s) => { s.maxHealth += 10; s.health += 10; } },
        { name: "速度训练", description: "移速 +3%", tier: 1, _repeatable: true, effect: (s) => { s.playerSpeedMulti *= 1.03; } }
      ];
      
      while (chosen.length < 3) {
        chosen.push(fallbacks[chosen.length % fallbacks.length]);
      }
      
      player.skillChoices = chosen;
    };

    g.selectSkillForPlayer = (playerId, skillIndex) => {
      const player = g.players[playerId];
      if (!player || !player.skillChoices || skillIndex >= player.skillChoices.length) return;
      
      const skill = player.skillChoices[skillIndex];
      
      // 应用技能效果到玩家状态
      if (skill.effect) {
        skill.effect(player);
      }
      
      // 记录技能
      if (!skill._repeatable) {
        player.acquiredSkills.push(skill.name);
        player.acquiredSkillMeta.push({ name: skill.name, tier: skill.tier || 1 });
      }
      
      player.isLevelingUp = false;
      player.skillChoices = [];
    };

    // ========== 敌人生成 (Host only) ==========
    g.spawnEnemy = (t) => {
      if (!g.isHost) return;
      
      // 计算进度
      const elapsed = t - g.gameStartTime;
      const progress = Math.min(1, elapsed / 600); // 10分钟达到最大难度
      
      // 选择敌人类型
      const def = g.pickEnemyDef(progress);
      
      // 在玩家周围生成
      const players = g.getPlayersArray();
      if (players.length === 0) return;
      
      const targetPlayer = players[Math.floor(Math.random() * players.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist = 400 + Math.random() * 200;
      const x = targetPlayer.x + Math.cos(angle) * dist;
      const y = targetPlayer.y + Math.sin(angle) * dist;
      
      const enemy = g.createEnemyFromDef(def, x, y, t);
      g.enemies.push(enemy);
    };

    // ========== Director (Host only) ==========
    g.directorStep = (t) => {
      if (!g.isHost) return;
      
      // 计算平均等级
      const players = g.getPlayersArray();
      const avgLevel = players.reduce((sum, p) => sum + p.level, 0) / players.length;
      
      // 更新难度
      g.director.diff = 1 + avgLevel * 0.1;
      g.director.strength = Math.min(1, (t - g.gameStartTime) / 600);
      
      // 目标敌人数量
      g.director.targetCount = Math.round(8 + avgLevel * 0.75 + g.director.strength * 16);
      
      // 生成敌人
      const spawnInterval = 1.0 / (1 + g.director.strength);
      if (t - g.director.lastSpawn > spawnInterval && g.enemies.length < g.director.targetCount) {
        g.spawnEnemy(t);
        g.director.lastSpawn = t;
      }
    };

    // ========== 主更新循环 (Host only) ==========
    g.update = (t) => {
      // 帧时间
      let dtBase = 0.016;
      if (g._lastUpdateT != null) {
        dtBase = t - g._lastUpdateT;
        if (!Number.isFinite(dtBase) || dtBase <= 0) dtBase = 0.016;
      }
      dtBase = clamp(dtBase, 0.001, 0.05);
      g._lastUpdateT = t;
      
      g._frameId++;
      g._fxParticlesThisFrame = 0;
      
      // 处理击杀队列
      if (g._killQueue.length) g.processKillQueue(t);
      
      if (g.isPausedGame) return;
      
      const dt = dtBase;
      
      // 更新每个玩家
      for (const player of Object.values(g.players)) {
        if (player.health <= 0) continue;
        
        // 移动
        const isMoving = player.joystickVector.dx !== 0 || player.joystickVector.dy !== 0;
        if (isMoving) {
          const speed = GameConfig.basePlayerSpeed * player.playerSpeedMulti;
          player.x += player.joystickVector.dx * speed * dt;
          player.y += player.joystickVector.dy * speed * dt;
        }
        
        // 自动射击
        let effectiveShootInterval = player.shootInterval;
        if (isMoving && player.movingFireRateBonus > 0) {
          effectiveShootInterval *= (1 - player.movingFireRateBonus);
        }
        if (t - player.lastShootTime > effectiveShootInterval && g.enemies.length > 0) {
          g.shootForPlayer(player.id, t);
        }
        
        // 回血
        if (player.regenRate > 0 && t - player.lastRegenTime > 1.0) {
          player.health = Math.min(player.maxHealth, player.health + player.regenRate);
          player.lastRegenTime = t;
        }
      }
      
      // 相机跟随本地玩家
      const myPlayer = g.getMyPlayer();
      if (myPlayer) {
        g.camera.x = myPlayer.x;
        g.camera.y = myPlayer.y;
      }
      
      // Host 专属逻辑
      if (g.isHost) {
        // Director
        g.directorStep(t);
        
        // 更新敌人
        g.updateEnemies(t, dt);
        
        // 更新子弹
        g.updateBullets(t, dt);
        
        // 更新经验球
        g.updateExpOrbs(t, dt);
      }
    };

    // ========== 敌人更新 ==========
    g.updateEnemies = (t, dt) => {
      const players = g.getPlayersArray().filter(p => p.health > 0);
      if (players.length === 0) return;
      
      for (let i = g.enemies.length - 1; i >= 0; i--) {
        const e = g.enemies[i];
        if (e._dead) continue;
        
        // 冻结检查
        if (e.frozenUntil > t) continue;
        
        // 找最近玩家
        let closest = players[0];
        let minDist = Infinity;
        for (const p of players) {
          const dx = p.x - e.x;
          const dy = p.y - e.y;
          const dist = dx * dx + dy * dy;
          if (dist < minDist) {
            minDist = dist;
            closest = p;
          }
        }
        
        // 移动向玩家
        const dx = closest.x - e.x;
        const dy = closest.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          e.x += (dx / dist) * e.speed * dt;
          e.y += (dy / dist) * e.speed * dt;
        }
        
        // 碰撞检测
        for (const p of players) {
          const pdx = p.x - e.x;
          const pdy = p.y - e.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist < p.r + e.w / 2) {
            // 玩家受伤
            if (t - p.lastHit > p.iFrameDuration) {
              g.damagePlayer(p.id, 10, t);
            }
          }
        }
        
        // 燃烧伤害
        if (e.burnEnd > t && e.burnDamage > 0) {
          e.hp -= e.burnDamage * dt;
          if (e.hp <= 0) {
            g.queueKill(e, null, t);
          }
        }
        
        // 中毒伤害
        if (e.poisonEnd > t && e.poisonDamage > 0) {
          e.hp -= e.poisonDamage * dt;
          if (e.hp <= 0) {
            g.queueKill(e, null, t);
          }
        }
      }
    };

    // ========== 子弹更新 ==========
    g.updateBullets = (t, dt) => {
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        const b = g.bullets[i];
        
        // 移动
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        
        // 超时移除
        if (t > b.die) {
          g.bullets.splice(i, 1);
          continue;
        }
        
        // 碰撞检测
        for (const e of g.enemies) {
          if (e._dead) continue;
          if (b.hitEnemies.has(e.id)) continue;
          
          const dx = e.x - b.x;
          const dy = e.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < e.w / 2 + b.w / 2) {
            // 命中
            b.hitEnemies.add(e.id);
            
            const { damage, isCrit } = g.calculateDamage(b.ownerStats, e);
            g.applyDamageToEnemy(e, damage, b.ownerId, t);
            
            // 状态效果
            if (b.ownerStats.freezeChance > 0 && Math.random() < b.ownerStats.freezeChance) {
              e.frozenUntil = t + b.ownerStats.freezeDuration;
            }
            if (b.ownerStats.burnChance > 0 && Math.random() < b.ownerStats.burnChance) {
              e.burnEnd = t + b.ownerStats.burnDuration;
              e.burnDamage = b.ownerStats.burnDamage;
            }
            if (b.ownerStats.poisonChance > 0 && Math.random() < b.ownerStats.poisonChance) {
              e.poisonEnd = t + b.ownerStats.poisonDuration;
              e.poisonDamage = b.ownerStats.poisonDamage;
            }
            
            // 吸血
            if (b.ownerStats.lifestealChance > 0 && Math.random() < b.ownerStats.lifestealChance) {
              const owner = g.players[b.ownerId];
              if (owner) {
                const heal = Math.round(damage * b.ownerStats.lifestealPercent);
                owner.health = Math.min(owner.maxHealth, owner.health + heal);
              }
            }
            
            // 穿透检查
            if (b.pierceLeft <= 0) {
              g.bullets.splice(i, 1);
              break;
            }
            b.pierceLeft--;
          }
        }
      }
    };

    // ========== 经验球更新 ==========
    g.updateExpOrbs = (t, dt) => {
      const players = g.getPlayersArray().filter(p => p.health > 0);
      
      for (let i = g.expOrbs.length - 1; i >= 0; i--) {
        const orb = g.expOrbs[i];
        
        // 检查每个玩家的拾取范围
        for (const p of players) {
          const dx = p.x - orb.x;
          const dy = p.y - orb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // 磁吸效果
          if (dist < p.pickupRange || p.expMagnetAll) {
            const speed = 300;
            orb.x += (dx / dist) * speed * dt;
            orb.y += (dy / dist) * speed * dt;
          }
          
          // 拾取
          if (dist < p.r + orb.r) {
            g.collectExpForPlayer(p.id, orb, t);
            g.expOrbs.splice(i, 1);
            break;
          }
        }
      }
    };

    // ========== 渲染 ==========
    g.render = (t) => {
      if (!ctx || !canvas) return;
      
      const W = canvas.width;
      const H = canvas.height;
      
      // 清屏
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);
      
      // 相机变换
      ctx.save();
      ctx.translate(W / 2 - g.camera.x, H / 2 - g.camera.y);
      
      // 绘制网格
      const gridSize = 50;
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      const startX = Math.floor((g.camera.x - W / 2) / gridSize) * gridSize;
      const startY = Math.floor((g.camera.y - H / 2) / gridSize) * gridSize;
      for (let x = startX; x < g.camera.x + W / 2; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, g.camera.y - H / 2);
        ctx.lineTo(x, g.camera.y + H / 2);
        ctx.stroke();
      }
      for (let y = startY; y < g.camera.y + H / 2; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(g.camera.x - W / 2, y);
        ctx.lineTo(g.camera.x + W / 2, y);
        ctx.stroke();
      }
      
      // 绘制经验球
      for (const orb of g.expOrbs) {
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 绘制敌人
      for (const e of g.enemies) {
        if (e._dead) continue;
        
        ctx.fillStyle = e.frozenUntil > t ? '#88ccff' : e.color;
        
        if (e.model === 'circle') {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.model === 'square') {
          ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
        } else if (e.model === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(e.x, e.y - e.h / 2);
          ctx.lineTo(e.x - e.w / 2, e.y + e.h / 2);
          ctx.lineTo(e.x + e.w / 2, e.y + e.h / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // 血条
        if (e.hp < e.maxHp) {
          const barW = e.w;
          const barH = 4;
          const barY = e.y - e.h / 2 - 8;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(e.x - barW / 2, barY, barW, barH);
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(e.x - barW / 2, barY, barW * (e.hp / e.maxHp), barH);
        }
      }
      
      // 绘制子弹
      for (const b of g.bullets) {
        const owner = g.players[b.ownerId];
        ctx.fillStyle = owner ? owner.color : '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 绘制玩家
      for (const player of Object.values(g.players)) {
        if (player.health <= 0) continue;
        
        // 玩家圆形
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
        ctx.fill();
        
        // 玩家边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 玩家名字
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.x, player.y - player.r - 8);
        
        // 血条
        const barW = 40;
        const barH = 4;
        const barY = player.y + player.r + 6;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(player.x - barW / 2, barY, barW, barH);
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x - barW / 2, barY, barW * (player.health / player.maxHealth), barH);
      }
      
      ctx.restore();
    };

    // ========== 设置输入 ==========
    g.setPlayerInput = (playerId, dx, dy) => {
      const player = g.players[playerId];
      if (player) {
        player.joystickVector.dx = dx;
        player.joystickVector.dy = dy;
      }
    };

    // ========== 初始化 ==========
    g.gameStartTime = nowSec();
    g.allSkills = [];
    
    return g;
  }

  // 导出
  GameApp.makeMultiplayerGame = makeMultiplayerGame;
  GameApp.createPlayerState = createPlayerState;
  GameApp.createStatsSnapshot = createStatsSnapshot;
})();
