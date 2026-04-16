/**
 * Elite AI Brain System - 顶级AI决策系统
 * 
 * 使用算力预测操作的风险和收益，实现顶级水平的游戏AI
 * 包含完整的决策树、威胁评估、空间分析和蒙特卡洛模拟
 * 
 * 操作限制：只能WASD移动和看敌人，不修改游戏数据
 */
(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};

  // ============================================================================
  // 常量配置
  // ============================================================================
  const CONFIG = {
    // 决策树配置
    DECISION_TREE_DEPTH: 8,           // 决策树搜索深度（帧数）
    MONTE_CARLO_SAMPLES: 32,          // 蒙特卡洛采样数量
    SIMULATION_DT: 0.05,              // 模拟时间步长（秒）
    
    // 空间分析配置
    GRID_SIZE: 50,                    // 空间网格大小
    GRID_RANGE: 800,                  // 分析范围
    
    // 威胁评估配置
    THREAT_DISTANCE_WEIGHT: 2.0,      // 距离权重
    THREAT_SPEED_WEIGHT: 1.5,         // 速度权重
    THREAT_DAMAGE_WEIGHT: 1.0,        // 伤害权重
    THREAT_HP_WEIGHT: 0.5,            // 血量权重
    
    // 安全距离配置
    MIN_SAFE_DISTANCE: 60,            // 最小安全距离（更激进）
    IDEAL_KITE_DISTANCE: 150,         // 理想风筝距离（更近）
    MAX_ENGAGE_DISTANCE: 300,         // 最大交战距离
    
    // 行为权重
    SURVIVAL_WEIGHT: 100,             // 生存权重
    KITE_WEIGHT: 30,                  // 风筝权重
    COLLECT_WEIGHT: 15,               // 收集权重
    AGGRO_WEIGHT: 5,                  // 进攻权重
    
    // 预测配置
    COLLISION_PREDICTION_TIME: 2.0,   // 碰撞预测时间（秒）
    ENEMY_PREDICTION_FRAMES: 30,      // 敌人预测帧数
    
    // 风险阈值
    CRITICAL_HP_RATIO: 0.15,          // 危险血量比例（更低才逃跑）
    SURROUNDED_THRESHOLD: 8,          // 被包围敌人数量阈值（更高容忍度）
    SURROUNDED_RADIUS: 120,           // 包围检测半径（更小）
  };

  // ============================================================================
  // 数学工具函数
  // ============================================================================
  const MathUtils = {
    // 向量长度
    magnitude: (x, y) => Math.sqrt(x * x + y * y),
    
    // 向量归一化
    normalize: (x, y) => {
      const len = Math.sqrt(x * x + y * y);
      if (len < 0.0001) return { x: 0, y: 0 };
      return { x: x / len, y: y / len };
    },
    
    // 向量点积
    dot: (x1, y1, x2, y2) => x1 * x2 + y1 * y2,
    
    // 向量叉积（2D返回标量）
    cross: (x1, y1, x2, y2) => x1 * y2 - y1 * x2,
    
    // 两点距离
    distance: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    
    // 两点距离平方（避免开方）
    distanceSq: (x1, y1, x2, y2) => (x2 - x1) ** 2 + (y2 - y1) ** 2,
    
    // 角度转向量
    angleToVector: (angle) => ({ x: Math.cos(angle), y: Math.sin(angle) }),
    
    // 向量转角度
    vectorToAngle: (x, y) => Math.atan2(y, x),
    
    // 限制值范围
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    
    // 线性插值
    lerp: (a, b, t) => a + (b - a) * t,
    
    // 平滑步进
    smoothstep: (edge0, edge1, x) => {
      const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
      return t * t * (3 - 2 * t);
    },
    
    // 高斯函数
    gaussian: (x, sigma) => Math.exp(-(x * x) / (2 * sigma * sigma)),
    
    // 随机范围
    randomRange: (min, max) => min + Math.random() * (max - min),
    
    // 随机单位向量
    randomUnitVector: () => {
      const angle = Math.random() * Math.PI * 2;
      return { x: Math.cos(angle), y: Math.sin(angle) };
    },
  };

  // ============================================================================
  // 威胁评估系统 (Threat Assessment System)
  // ============================================================================
  class ThreatAssessment {
    constructor() {
      this.threatCache = new Map();
      this.lastUpdateTime = 0;
    }

    /**
     * 计算单个敌人的威胁值
     */
    calculateEnemyThreat(enemy, player, g) {
      if (!enemy || enemy._dead) return 0;

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = MathUtils.magnitude(dx, dy);
      
      // 距离因子：越近威胁越大（指数衰减）
      const distanceFactor = Math.exp(-distance / 200) * CONFIG.THREAT_DISTANCE_WEIGHT;
      
      // 速度因子：移动速度快的威胁更大
      const enemySpeed = enemy.speed || 100;
      const speedFactor = (enemySpeed / 100) * CONFIG.THREAT_SPEED_WEIGHT;
      
      // 伤害因子：伤害高的威胁更大
      const enemyDamage = enemy.damage || 10;
      const damageFactor = (enemyDamage / 10) * CONFIG.THREAT_DAMAGE_WEIGHT;
      
      // 血量因子：血量高的难以击杀
      const enemyHp = enemy.hp || 50;
      const hpFactor = Math.log10(enemyHp + 1) * CONFIG.THREAT_HP_WEIGHT;
      
      // 预测碰撞时间 (Time To Impact)
      const tti = this.calculateTimeToImpact(enemy, player);
      const ttiFactor = tti < 1.0 ? (2.0 - tti) * 3.0 : 1.0 / (tti + 0.1);
      
      // 敌人类型加成
      const typeFactor = this.getEnemyTypeFactor(enemy);
      
      // 综合威胁值
      const threat = (distanceFactor + speedFactor + damageFactor + hpFactor + ttiFactor) * typeFactor;
      
      return Math.max(0, threat);
    }

    /**
     * 计算碰撞预测时间
     */
    calculateTimeToImpact(enemy, player) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = MathUtils.magnitude(dx, dy);
      
      if (distance < 1) return 0;
      
      // 敌人朝向玩家的速度
      const enemySpeed = enemy.speed || 100;
      const dirX = dx / distance;
      const dirY = dy / distance;
      
      // 简化计算：假设敌人直线追击
      const approachSpeed = enemySpeed;
      
      if (approachSpeed <= 0) return Infinity;
      
      return distance / approachSpeed;
    }

    /**
     * 获取敌人类型因子
     */
    getEnemyTypeFactor(enemy) {
      const type = enemy.type || "normal";
      const factors = {
        "normal": 1.0,
        "fast": 1.5,
        "tank": 0.8,
        "ranged": 1.3,
        "boss": 2.5,
        "elite": 1.8,
        "swarm": 0.6,
      };
      return factors[type] || 1.0;
    }

    /**
     * 评估所有敌人的威胁
     */
    evaluateAllThreats(g) {
      const threats = [];
      const player = g.player;
      const enemies = g.enemies || [];

      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (!enemy || enemy._dead) continue;

        const threat = this.calculateEnemyThreat(enemy, player, g);
        threats.push({
          enemy,
          threat,
          distance: MathUtils.distance(enemy.x, enemy.y, player.x, player.y),
          direction: MathUtils.normalize(enemy.x - player.x, enemy.y - player.y),
          tti: this.calculateTimeToImpact(enemy, player),
        });
      }

      // 按威胁值排序
      threats.sort((a, b) => b.threat - a.threat);
      
      return threats;
    }

    /**
     * 计算总体威胁等级
     */
    calculateOverallThreatLevel(threats) {
      if (threats.length === 0) return 0;

      let totalThreat = 0;
      for (let i = 0; i < threats.length; i++) {
        // 威胁值随排名衰减
        totalThreat += threats[i].threat * Math.pow(0.8, i);
      }

      return totalThreat;
    }

    /**
     * 检测是否被包围
     */
    detectSurrounding(g) {
      const player = g.player;
      const enemies = g.enemies || [];
      const radius = CONFIG.SURROUNDED_RADIUS;
      
      let count = 0;
      let angleSum = { x: 0, y: 0 };
      const angles = [];

      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e || e._dead) continue;
        
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = MathUtils.magnitude(dx, dy);
        
        if (dist < radius) {
          count++;
          const angle = MathUtils.vectorToAngle(dx, dy);
          angles.push(angle);
          angleSum.x += dist > 0.001 ? dx / dist : 0;
          angleSum.y += dist > 0.001 ? dy / dist : 0;
        }
      }

      // 计算角度分布（检测是否真正被包围）
      let isSurrounded = false;
      if (count >= CONFIG.SURROUNDED_THRESHOLD) {
        // 检查敌人是否分布在各个方向
        angles.sort((a, b) => a - b);
        let maxGap = 0;
        for (let i = 0; i < angles.length; i++) {
          const next = (i + 1) % angles.length;
          let gap = angles[next] - angles[i];
          if (gap < 0) gap += Math.PI * 2;
          maxGap = Math.max(maxGap, gap);
        }
        // 如果最大间隙小于90度，认为被包围
        isSurrounded = maxGap < Math.PI / 2;
      }

      return {
        count,
        isSurrounded,
        escapeDirection: MathUtils.normalize(-angleSum.x, -angleSum.y),
        dangerCenter: { x: angleSum.x, y: angleSum.y },
      };
    }
  }

  // ============================================================================
  // 空间分析系统 (Spatial Analysis System)
  // ============================================================================
  class SpatialAnalysis {
    constructor() {
      this.safetyGrid = null;
      this.expValueGrid = null;
      this.lastUpdateTime = 0;
    }

    /**
     * 初始化网格
     */
    initGrids() {
      const size = Math.ceil(CONFIG.GRID_RANGE * 2 / CONFIG.GRID_SIZE);
      this.safetyGrid = new Float32Array(size * size);
      this.expValueGrid = new Float32Array(size * size);
      this.gridSize = size;
    }

    /**
     * 世界坐标转网格索引
     */
    worldToGrid(x, y, centerX, centerY) {
      const localX = x - centerX + CONFIG.GRID_RANGE;
      const localY = y - centerY + CONFIG.GRID_RANGE;
      const gridX = Math.floor(localX / CONFIG.GRID_SIZE);
      const gridY = Math.floor(localY / CONFIG.GRID_SIZE);
      return { gridX, gridY };
    }

    /**
     * 网格索引转世界坐标
     */
    gridToWorld(gridX, gridY, centerX, centerY) {
      const x = gridX * CONFIG.GRID_SIZE - CONFIG.GRID_RANGE + centerX + CONFIG.GRID_SIZE / 2;
      const y = gridY * CONFIG.GRID_SIZE - CONFIG.GRID_RANGE + centerY + CONFIG.GRID_SIZE / 2;
      return { x, y };
    }

    /**
     * 计算安全网格
     */
    calculateSafetyGrid(g, threats) {
      if (!this.safetyGrid) this.initGrids();
      
      const player = g.player;
      const size = this.gridSize;
      
      // 重置网格
      this.safetyGrid.fill(100); // 初始安全值100

      // 根据敌人位置降低安全值
      for (let i = 0; i < threats.length; i++) {
        const t = threats[i];
        const enemy = t.enemy;
        
        // 计算敌人影响范围
        const influenceRadius = 200 + t.threat * 20;
        
        for (let gx = 0; gx < size; gx++) {
          for (let gy = 0; gy < size; gy++) {
            const worldPos = this.gridToWorld(gx, gy, player.x, player.y);
            const dist = MathUtils.distance(worldPos.x, worldPos.y, enemy.x, enemy.y);
            
            if (dist < influenceRadius) {
              const danger = t.threat * MathUtils.gaussian(dist, influenceRadius / 2);
              const idx = gy * size + gx;
              this.safetyGrid[idx] -= danger * 10;
            }
          }
        }
      }

      // 限制安全值范围
      for (let i = 0; i < this.safetyGrid.length; i++) {
        this.safetyGrid[i] = MathUtils.clamp(this.safetyGrid[i], 0, 100);
      }
    }

    /**
     * 计算经验球价值网格
     */
    calculateExpValueGrid(g) {
      if (!this.expValueGrid) this.initGrids();
      
      const player = g.player;
      const expOrbs = g.expOrbs || [];
      const size = this.gridSize;
      
      // 重置网格
      this.expValueGrid.fill(0);

      for (let i = 0; i < expOrbs.length; i++) {
        const orb = expOrbs[i];
        if (!orb || orb._dead) continue;
        
        const orbValue = orb.value || 10;
        const { gridX, gridY } = this.worldToGrid(orb.x, orb.y, player.x, player.y);
        
        if (gridX >= 0 && gridX < size && gridY >= 0 && gridY < size) {
          // 经验球价值扩散到周围网格
          for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
              const nx = gridX + dx;
              const ny = gridY + dy;
              if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                const value = orbValue * MathUtils.gaussian(dist, 1.5);
                this.expValueGrid[ny * size + nx] += value;
              }
            }
          }
        }
      }
    }

    /**
     * 获取位置的安全值
     */
    getSafetyAt(x, y, centerX, centerY) {
      if (!this.safetyGrid) return 50;
      
      const { gridX, gridY } = this.worldToGrid(x, y, centerX, centerY);
      const size = this.gridSize;
      
      if (gridX < 0 || gridX >= size || gridY < 0 || gridY >= size) {
        return 0; // 超出范围不安全
      }
      
      return this.safetyGrid[gridY * size + gridX];
    }

    /**
     * 获取位置的经验价值
     */
    getExpValueAt(x, y, centerX, centerY) {
      if (!this.expValueGrid) return 0;
      
      const { gridX, gridY } = this.worldToGrid(x, y, centerX, centerY);
      const size = this.gridSize;
      
      if (gridX < 0 || gridX >= size || gridY < 0 || gridY >= size) {
        return 0;
      }
      
      return this.expValueGrid[gridY * size + gridX];
    }

    /**
     * 找到最安全的方向
     */
    findSafestDirection(g, numSamples = 16) {
      const player = g.player;
      let bestDir = { x: 0, y: 0 };
      let bestSafety = -Infinity;
      
      for (let i = 0; i < numSamples; i++) {
        const angle = (i / numSamples) * Math.PI * 2;
        const dir = MathUtils.angleToVector(angle);
        
        // 检查该方向上的安全值
        let totalSafety = 0;
        for (let dist = 50; dist <= 300; dist += 50) {
          const testX = player.x + dir.x * dist;
          const testY = player.y + dir.y * dist;
          totalSafety += this.getSafetyAt(testX, testY, player.x, player.y);
        }
        
        if (totalSafety > bestSafety) {
          bestSafety = totalSafety;
          bestDir = dir;
        }
      }
      
      return bestDir;
    }

    /**
     * 找到最佳经验收集方向
     */
    findBestExpDirection(g, numSamples = 16) {
      const player = g.player;
      let bestDir = { x: 0, y: 0 };
      let bestValue = -Infinity;
      
      for (let i = 0; i < numSamples; i++) {
        const angle = (i / numSamples) * Math.PI * 2;
        const dir = MathUtils.angleToVector(angle);
        
        let totalValue = 0;
        for (let dist = 50; dist <= 200; dist += 50) {
          const testX = player.x + dir.x * dist;
          const testY = player.y + dir.y * dist;
          const expValue = this.getExpValueAt(testX, testY, player.x, player.y);
          const safety = this.getSafetyAt(testX, testY, player.x, player.y);
          // 经验价值乘以安全系数
          totalValue += expValue * (safety / 100);
        }
        
        if (totalValue > bestValue) {
          bestValue = totalValue;
          bestDir = dir;
        }
      }
      
      return { direction: bestDir, value: bestValue };
    }
  }

  // ============================================================================
  // 预测系统 (Prediction System)
  // ============================================================================
  class PredictionSystem {
    /**
     * 预测敌人未来位置
     */
    predictEnemyPosition(enemy, player, deltaTime) {
      if (!enemy || enemy._dead) return null;
      
      const speed = enemy.speed || 100;
      
      // 敌人朝向玩家移动
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = MathUtils.magnitude(dx, dy);
      
      if (dist < 1) return { x: enemy.x, y: enemy.y };
      
      const dirX = dx / dist;
      const dirY = dy / dist;
      
      return {
        x: enemy.x + dirX * speed * deltaTime,
        y: enemy.y + dirY * speed * deltaTime,
      };
    }

    /**
     * 预测玩家未来位置
     */
    predictPlayerPosition(player, moveDir, speed, deltaTime) {
      return {
        x: player.x + moveDir.x * speed * deltaTime,
        y: player.y + moveDir.y * speed * deltaTime,
      };
    }

    /**
     * 预测碰撞
     */
    predictCollision(playerPos, playerRadius, enemies, deltaTime) {
      const collisions = [];
      
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (!enemy || enemy._dead) continue;
        
        const enemyPos = this.predictEnemyPosition(enemy, playerPos, deltaTime);
        if (!enemyPos) continue;
        
        const dist = MathUtils.distance(playerPos.x, playerPos.y, enemyPos.x, enemyPos.y);
        const collisionDist = playerRadius + Math.max(enemy.w || 20, enemy.h || 20) / 2;
        
        if (dist < collisionDist) {
          collisions.push({
            enemy,
            distance: dist,
            time: deltaTime,
          });
        }
      }
      
      return collisions;
    }

    /**
     * 模拟未来状态
     */
    simulateFuture(g, moveDir, frames) {
      const player = g.player;
      const enemies = g.enemies || [];
      const playerSpeed = ((GameApp.Config && GameApp.Config.game ? GameApp.Config.game.basePlayerSpeed : 200) || 200) * (g.playerSpeedMulti || 1);
      const playerRadius = player.r || 15;
      
      let simPlayer = { x: player.x, y: player.y };
      let totalDamage = 0;
      let totalExp = 0;
      let minDistance = Infinity;
      
      for (let frame = 0; frame < frames; frame++) {
        const dt = CONFIG.SIMULATION_DT;
        
        // 移动玩家
        simPlayer.x += moveDir.x * playerSpeed * dt;
        simPlayer.y += moveDir.y * playerSpeed * dt;
        
        // 检查碰撞
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i];
          if (!enemy || enemy._dead) continue;
          
          const enemyPos = this.predictEnemyPosition(enemy, simPlayer, dt * (frame + 1));
          if (!enemyPos) continue;
          
          const dist = MathUtils.distance(simPlayer.x, simPlayer.y, enemyPos.x, enemyPos.y);
          minDistance = Math.min(minDistance, dist);
          
          const collisionDist = playerRadius + Math.max(enemy.w || 20, enemy.h || 20) / 2;
          if (dist < collisionDist) {
            totalDamage += enemy.damage || 10;
          }
        }
        
        // 检查经验球收集
        const expOrbs = g.expOrbs || [];
        for (let i = 0; i < expOrbs.length; i++) {
          const orb = expOrbs[i];
          if (!orb || orb._dead) continue;
          
          const dist = MathUtils.distance(simPlayer.x, simPlayer.y, orb.x, orb.y);
          const pickupRange = g.pickupRange || 100;
          if (dist < pickupRange) {
            totalExp += orb.value || 10;
          }
        }
      }
      
      return {
        finalPosition: simPlayer,
        totalDamage,
        totalExp,
        minDistance,
        survivalScore: minDistance > CONFIG.MIN_SAFE_DISTANCE ? 1 : minDistance / CONFIG.MIN_SAFE_DISTANCE,
      };
    }
  }

  // ============================================================================
  // 决策树系统 (Decision Tree System)
  // ============================================================================
  class DecisionTree {
    constructor() {
      this.predictionSystem = new PredictionSystem();
    }

    /**
     * 生成候选移动方向
     */
    generateCandidateMoves(numDirections = 16) {
      const moves = [];
      
      // 8个主要方向 + 8个中间方向
      for (let i = 0; i < numDirections; i++) {
        const angle = (i / numDirections) * Math.PI * 2;
        moves.push({
          x: Math.cos(angle),
          y: Math.sin(angle),
          angle,
        });
      }
      
      // 添加静止选项
      moves.push({ x: 0, y: 0, angle: null });
      
      return moves;
    }

    /**
     * 评估单个移动方向
     */
    evaluateMove(g, moveDir, threats, spatialAnalysis) {
      const player = g.player;
      const playerSpeed = ((GameApp.Config && GameApp.Config.game ? GameApp.Config.game.basePlayerSpeed : 200) || 200) * (g.playerSpeedMulti || 1);
      
      // 模拟未来状态
      const simulation = this.predictionSystem.simulateFuture(g, moveDir, CONFIG.DECISION_TREE_DEPTH);
      
      // 计算各项分数
      let score = 0;
      
      // 1. 生存分数（最重要）
      const survivalScore = simulation.survivalScore * CONFIG.SURVIVAL_WEIGHT;
      score += survivalScore;
      
      // 2. 伤害惩罚
      const damageRatio = simulation.totalDamage / (g.playerMaxHealth || 100);
      const damagePenalty = damageRatio * CONFIG.SURVIVAL_WEIGHT * 2;
      score -= damagePenalty;
      
      // 3. 安全区域分数
      const safetyScore = spatialAnalysis.getSafetyAt(
        simulation.finalPosition.x,
        simulation.finalPosition.y,
        player.x,
        player.y
      ) / 100 * CONFIG.KITE_WEIGHT;
      score += safetyScore;
      
      // 4. 经验收集分数
      const expScore = simulation.totalExp * CONFIG.COLLECT_WEIGHT / 100;
      score += expScore;
      
      // 5. 风筝距离分数
      if (threats.length > 0) {
        const nearestThreat = threats[0];
        const futurePos = simulation.finalPosition;
        const futureDist = MathUtils.distance(
          futurePos.x, futurePos.y,
          nearestThreat.enemy.x, nearestThreat.enemy.y
        );
        
        // 理想距离奖励
        const distFromIdeal = Math.abs(futureDist - CONFIG.IDEAL_KITE_DISTANCE);
        const kiteScore = MathUtils.gaussian(distFromIdeal, 100) * CONFIG.KITE_WEIGHT;
        score += kiteScore;
      }
      
      // 6. 远离危险方向的奖励
      if (threats.length > 0) {
        const dangerDir = { x: 0, y: 0 };
        for (let i = 0; i < Math.min(threats.length, 5); i++) {
          const t = threats[i];
          dangerDir.x += t.direction.x * t.threat;
          dangerDir.y += t.direction.y * t.threat;
        }
        const dangerNorm = MathUtils.normalize(dangerDir.x, dangerDir.y);
        
        // 移动方向与危险方向的夹角
        const dot = MathUtils.dot(moveDir.x, moveDir.y, -dangerNorm.x, -dangerNorm.y);
        const escapeScore = (dot + 1) / 2 * CONFIG.SURVIVAL_WEIGHT * 0.5;
        score += escapeScore;
      }
      
      return {
        direction: moveDir,
        score,
        simulation,
        breakdown: {
          survival: survivalScore,
          damage: -damagePenalty,
          safety: safetyScore,
          exp: expScore,
        },
      };
    }

    /**
     * 蒙特卡洛树搜索
     */
    monteCarloSearch(g, threats, spatialAnalysis) {
      const candidates = this.generateCandidateMoves(CONFIG.MONTE_CARLO_SAMPLES);
      const evaluations = [];
      
      for (let i = 0; i < candidates.length; i++) {
        const move = candidates[i];
        const evaluation = this.evaluateMove(g, move, threats, spatialAnalysis);
        evaluations.push(evaluation);
      }
      
      // 按分数排序
      evaluations.sort((a, b) => b.score - a.score);
      
      return evaluations;
    }

    /**
     * 深度优先搜索最佳路径
     */
    depthFirstSearch(g, threats, spatialAnalysis, depth = 3) {
      if (depth === 0) {
        return { direction: { x: 0, y: 0 }, score: 0 };
      }
      
      const candidates = this.generateCandidateMoves(8);
      let bestResult = null;
      
      for (let i = 0; i < candidates.length; i++) {
        const move = candidates[i];
        const evaluation = this.evaluateMove(g, move, threats, spatialAnalysis);
        
        // 递归搜索（简化版，不完全模拟）
        const futureScore = evaluation.score * Math.pow(0.9, 3 - depth);
        
        if (!bestResult || futureScore > bestResult.score) {
          bestResult = {
            direction: move,
            score: futureScore,
            evaluation,
          };
        }
      }
      
      return bestResult;
    }
  }

  // ============================================================================
  // 技能评估系统 (Skill Evaluation System)
  // ============================================================================
  class SkillEvaluator {
    constructor() {
      // 技能类型权重
      this.categoryWeights = {
        damage: 1.0,
        survival: 1.0,
        utility: 0.8,
        summon: 0.9,
      };
    }

    /**
     * 分析当前游戏状态
     */
    analyzeGameState(g) {
      const hpRatio = g.playerHealth / g.playerMaxHealth;
      const level = g.level || 1;
      const enemyCount = (g.enemies || []).filter(e => !e._dead).length;
      
      return {
        hpRatio,
        level,
        enemyCount,
        isLowHp: hpRatio < CONFIG.CRITICAL_HP_RATIO,
        isEarlyGame: level < 5,
        isMidGame: level >= 5 && level < 15,
        isLateGame: level >= 15,
        isOverwhelmed: enemyCount > 20,
        needsDamage: g.bulletDamage < 30,
        needsSurvival: hpRatio < 0.5,
        hasBulletUpgrades: g.bulletCount > 1 || g.pierceCount > 0,
      };
    }

    /**
     * 评估单个技能
     */
    evaluateSkill(skill, g, gameState) {
      let score = 0;
      const name = skill.name || "";
      const desc = skill.description || "";
      const tier = skill.tier || 1;
      
      // 基础稀有度分数
      const tierBonus = [0, 1, 3, 6, 12, 25];
      score += tierBonus[tier] || 1;
      
      // 根据游戏状态调整权重
      const survivalKeywords = ["生命", "恢复", "护盾", "再生", "治疗", "闪避", "护甲", "减伤", "格挡"];
      const damageKeywords = ["伤害", "子弹", "射速", "暴击", "穿透", "爆炸", "连锁"];
      const utilityKeywords = ["经验", "拾取", "速度", "范围"];
      const summonKeywords = ["无人机", "飞刃", "护盾球", "地雷", "幽灵"];
      
      // 生存技能评估
      if (survivalKeywords.some(k => name.includes(k) || desc.includes(k))) {
        if (gameState.isLowHp) score += 20;
        else if (gameState.needsSurvival) score += 10;
        else score += 3;
      }
      
      // 伤害技能评估
      if (damageKeywords.some(k => name.includes(k) || desc.includes(k))) {
        if (gameState.needsDamage) score += 15;
        else if (gameState.isEarlyGame) score += 10;
        else score += 5;
      }
      
      // 召唤物技能评估
      if (summonKeywords.some(k => name.includes(k) || desc.includes(k))) {
        if (gameState.isOverwhelmed) score += 12;
        else score += 8;
      }
      
      // 实用技能评估
      if (utilityKeywords.some(k => name.includes(k) || desc.includes(k))) {
        score += 4;
      }
      
      // 特殊技能加成
      if (name.includes("多重") || name.includes("散弹")) {
        if (g.bulletCount < 3) score += 15;
      }
      
      if (name.includes("穿透") || name.includes("追踪")) {
        score += 8;
      }
      
      if (name.includes("吸血")) {
        if (gameState.needsSurvival) score += 12;
        else score += 5;
      }
      
      // 添加少量随机性避免总是选同一个
      score += Math.random() * 2;
      
      return score;
    }

    /**
     * 选择最佳技能
     */
    selectBestSkill(skills, g) {
      if (!skills || skills.length === 0) return null;
      
      const gameState = this.analyzeGameState(g);
      let bestSkill = skills[0];
      let bestScore = -Infinity;
      
      for (let i = 0; i < skills.length; i++) {
        const score = this.evaluateSkill(skills[i], g, gameState);
        if (score > bestScore) {
          bestScore = score;
          bestSkill = skills[i];
        }
      }
      
      return bestSkill;
    }
  }

  // ============================================================================
  // Elite Brain 核心 (Elite Brain Core)
  // ============================================================================
  class EliteBrain {
    constructor() {
      this.threatAssessment = new ThreatAssessment();
      this.spatialAnalysis = new SpatialAnalysis();
      this.predictionSystem = new PredictionSystem();
      this.decisionTree = new DecisionTree();
      this.skillEvaluator = new SkillEvaluator();
      
      // 状态机
      this.state = "IDLE";
      this.previousState = "IDLE";
      this.stateTimer = 0;
      
      // 决策缓存
      this.lastDecision = null;
      this.decisionCooldown = 0;
      this.smoothedDirection = { x: 0, y: 0 };
      
      // 性能统计
      this.stats = {
        decisionsPerSecond: 0,
        avgDecisionTime: 0,
        stateChanges: 0,
      };
    }

    /**
     * 状态机定义
     */
    static STATES = {
      IDLE: "IDLE",           // 空闲（无敌人）
      KITE: "KITE",           // 风筝（保持距离射击）
      ESCAPE: "ESCAPE",       // 逃跑（被包围或低血）
      COLLECT: "COLLECT",     // 收集（安全时收集经验）
      AGGRESSIVE: "AGGRESSIVE", // 进攻（主动靠近敌人）
    };

    /**
     * 更新状态机
     */
    updateStateMachine(g, threats, surrounding) {
      const hpRatio = g.playerHealth / g.playerMaxHealth;
      const enemyCount = threats.length;
      const overallThreat = this.threatAssessment.calculateOverallThreatLevel(threats);
      
      let newState = this.state;
      
      // 状态转换逻辑 - 更激进的策略
      if (enemyCount === 0) {
        newState = EliteBrain.STATES.COLLECT;
      } else if (surrounding.isSurrounded && hpRatio < CONFIG.CRITICAL_HP_RATIO) {
        // 只有被包围且血量低时才逃跑
        newState = EliteBrain.STATES.ESCAPE;
      } else if (hpRatio < CONFIG.CRITICAL_HP_RATIO && overallThreat > 80) {
        // 血量很低且威胁很高时逃跑
        newState = EliteBrain.STATES.ESCAPE;
      } else if (hpRatio > 0.5 || enemyCount < 10) {
        // 血量还行或敌人不多时，进攻
        newState = EliteBrain.STATES.AGGRESSIVE;
      } else if (overallThreat > 60) {
        // 威胁很高时风筝
        newState = EliteBrain.STATES.KITE;
      } else {
        // 默认进攻
        newState = EliteBrain.STATES.AGGRESSIVE;
      }
      
      // 状态变化
      if (newState !== this.state) {
        this.previousState = this.state;
        this.state = newState;
        this.stateTimer = 0;
        this.stats.stateChanges++;
      } else {
        this.stateTimer += 0.016; // 约60fps
      }
      
      return this.state;
    }

    /**
     * 根据状态获取行为
     */
    getStateBehavior(state, g, threats, surrounding, spatialAnalysis) {
      switch (state) {
        case EliteBrain.STATES.ESCAPE:
          return this.escapeStrategy(g, threats, surrounding, spatialAnalysis);
        
        case EliteBrain.STATES.KITE:
          return this.kiteStrategy(g, threats, spatialAnalysis);
        
        case EliteBrain.STATES.COLLECT:
          return this.collectStrategy(g, spatialAnalysis);
        
        case EliteBrain.STATES.AGGRESSIVE:
          return this.aggressiveStrategy(g, threats, spatialAnalysis);
        
        case EliteBrain.STATES.IDLE:
        default:
          return { x: 0, y: 0 };
      }
    }

    /**
     * 逃跑策略
     */
    escapeStrategy(g, threats, surrounding, spatialAnalysis) {
      // 优先使用包围检测的逃跑方向
      if (surrounding.isSurrounded) {
        return surrounding.escapeDirection;
      }
      
      // 使用决策树找最安全方向
      const evaluations = this.decisionTree.monteCarloSearch(g, threats, spatialAnalysis);
      if (evaluations.length > 0) {
        return evaluations[0].direction;
      }
      
      // 后备：远离最近威胁
      if (threats.length > 0) {
        const nearest = threats[0];
        return MathUtils.normalize(-nearest.direction.x, -nearest.direction.y);
      }
      
      return { x: 0, y: 0 };
    }

    /**
     * 风筝策略
     */
    kiteStrategy(g, threats, spatialAnalysis) {
      if (threats.length === 0) {
        return { x: 0, y: 0 };
      }
      
      const player = g.player;
      const nearest = threats[0];
      const distance = nearest.distance;
      
      // 计算理想位置
      let moveDir = { x: 0, y: 0 };
      
      if (distance < CONFIG.MIN_SAFE_DISTANCE) {
        // 太近，快速后退
        moveDir = MathUtils.normalize(-nearest.direction.x, -nearest.direction.y);
      } else if (distance < CONFIG.IDEAL_KITE_DISTANCE * 0.8) {
        // 稍近，边后退边绕行
        const retreatDir = MathUtils.normalize(-nearest.direction.x, -nearest.direction.y);
        const tangentDir = MathUtils.normalize(-nearest.direction.y, nearest.direction.x);
        moveDir = {
          x: retreatDir.x * 0.7 + tangentDir.x * 0.3,
          y: retreatDir.y * 0.7 + tangentDir.y * 0.3,
        };
      } else if (distance > CONFIG.IDEAL_KITE_DISTANCE * 1.2) {
        // 太远，可以稍微靠近或收集经验
        const expResult = spatialAnalysis.findBestExpDirection(g);
        if (expResult.value > 5) {
          moveDir = expResult.direction;
        } else {
          // 轻微靠近
          moveDir = {
            x: nearest.direction.x * 0.3,
            y: nearest.direction.y * 0.3,
          };
        }
      } else {
        // 理想距离，绕行
        const tangentDir = MathUtils.normalize(-nearest.direction.y, nearest.direction.x);
        moveDir = tangentDir;
      }
      
      // 使用决策树优化方向
      const evaluations = this.decisionTree.monteCarloSearch(g, threats, spatialAnalysis);
      if (evaluations.length > 0 && evaluations[0].score > 0) {
        // 混合决策树结果
        const treeDir = evaluations[0].direction;
        moveDir = {
          x: moveDir.x * 0.6 + treeDir.x * 0.4,
          y: moveDir.y * 0.6 + treeDir.y * 0.4,
        };
      }
      
      return MathUtils.normalize(moveDir.x, moveDir.y);
    }

    /**
     * 收集策略
     */
    collectStrategy(g, spatialAnalysis) {
      const player = g.player;
      const expOrbs = g.expOrbs || [];
      
      // 首先尝试直接找最近的经验球
      let nearestOrb = null;
      let nearestDist = Infinity;
      
      for (let i = 0; i < expOrbs.length; i++) {
        const orb = expOrbs[i];
        if (!orb || orb._dead) continue;
        
        const dist = MathUtils.distance(player.x, player.y, orb.x, orb.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestOrb = orb;
        }
      }
      
      // 如果找到经验球，直接朝它移动
      if (nearestOrb) {
        const dx = nearestOrb.x - player.x;
        const dy = nearestOrb.y - player.y;
        return MathUtils.normalize(dx, dy);
      }
      
      // 使用网格分析作为备选
      const expResult = spatialAnalysis.findBestExpDirection(g);
      if (expResult.value > 0) {
        return expResult.direction;
      }
      
      // 没有经验球，停止移动而不是随机移动
      return { x: 0, y: 0 };
    }

    /**
     * 进攻策略 - 更激进，同时收集经验
     */
    aggressiveStrategy(g, threats, spatialAnalysis) {
      const player = g.player;
      const expOrbs = g.expOrbs || [];
      
      // 首先检查附近是否有经验球可以顺便收集
      let nearestOrb = null;
      let nearestOrbDist = Infinity;
      
      for (let i = 0; i < expOrbs.length; i++) {
        const orb = expOrbs[i];
        if (!orb || orb._dead) continue;
        
        const dist = MathUtils.distance(player.x, player.y, orb.x, orb.y);
        if (dist < nearestOrbDist) {
          nearestOrbDist = dist;
          nearestOrb = orb;
        }
      }
      
      // 如果有很近的经验球（200像素内），优先收集
      if (nearestOrb && nearestOrbDist < 200) {
        const dx = nearestOrb.x - player.x;
        const dy = nearestOrb.y - player.y;
        return MathUtils.normalize(dx, dy);
      }
      
      if (threats.length === 0) {
        // 没有敌人，找经验球
        if (nearestOrb) {
          const dx = nearestOrb.x - player.x;
          const dy = nearestOrb.y - player.y;
          return MathUtils.normalize(dx, dy);
        }
        return { x: 0, y: 0 };
      }
      
      const nearest = threats[0];
      
      // 更激进：只有非常近才稍微后退
      if (nearest.distance < CONFIG.MIN_SAFE_DISTANCE) {
        // 太近了，稍微后退但同时绕行
        const retreatDir = MathUtils.normalize(-nearest.direction.x, -nearest.direction.y);
        const tangentDir = MathUtils.normalize(-nearest.direction.y, nearest.direction.x);
        return {
          x: retreatDir.x * 0.3 + tangentDir.x * 0.7,
          y: retreatDir.y * 0.3 + tangentDir.y * 0.7,
        };
      } else if (nearest.distance > CONFIG.MAX_ENGAGE_DISTANCE) {
        // 太远，靠近敌人
        return nearest.direction;
      }
      
      // 在合适距离，绕行射击
      return MathUtils.normalize(-nearest.direction.y, nearest.direction.x);
    }

    /**
     * 平滑移动方向
     */
    smoothDirection(newDir, smoothFactor = 0.3) {
      this.smoothedDirection = {
        x: MathUtils.lerp(this.smoothedDirection.x, newDir.x, smoothFactor),
        y: MathUtils.lerp(this.smoothedDirection.y, newDir.y, smoothFactor),
      };
      
      // 归一化
      const len = MathUtils.magnitude(this.smoothedDirection.x, this.smoothedDirection.y);
      if (len > 0.01) {
        this.smoothedDirection.x /= len;
        this.smoothedDirection.y /= len;
      }
      
      return this.smoothedDirection;
    }

    /**
     * 主决策函数
     */
    decide(g, t) {
      if (!g || !g.player || g.isGameOver || g.isPausedGame || g.isLevelingUp) {
        return { dx: 0, dy: 0 };
      }
      
      const startTime = performance.now();
      
      // 1. 威胁评估
      const threats = this.threatAssessment.evaluateAllThreats(g);
      const surrounding = this.threatAssessment.detectSurrounding(g);
      
      // 2. 空间分析
      this.spatialAnalysis.calculateSafetyGrid(g, threats);
      this.spatialAnalysis.calculateExpValueGrid(g);
      
      // 3. 更新状态机
      const state = this.updateStateMachine(g, threats, surrounding);
      
      // 4. 获取行为
      const rawDirection = this.getStateBehavior(state, g, threats, surrounding, this.spatialAnalysis);
      
      // 5. 平滑移动
      const smoothedDir = this.smoothDirection(rawDirection, 0.4);
      
      // 性能统计
      const decisionTime = performance.now() - startTime;
      this.stats.avgDecisionTime = this.stats.avgDecisionTime * 0.9 + decisionTime * 0.1;
      
      return { dx: smoothedDir.x, dy: smoothedDir.y };
    }

    /**
     * 技能选择
     */
    selectSkill(skills, g) {
      return this.skillEvaluator.selectBestSkill(skills, g);
    }

    /**
     * 获取当前状态信息（用于调试）
     */
    getDebugInfo() {
      return {
        state: this.state,
        previousState: this.previousState,
        stateTimer: this.stateTimer,
        smoothedDirection: this.smoothedDirection,
        stats: this.stats,
      };
    }
  }

  // ============================================================================
  // 导出
  // ============================================================================
  GameApp.EliteBrain = EliteBrain;
  GameApp.EliteBrainConfig = CONFIG;
  GameApp.EliteBrainMath = MathUtils;

  // 创建全局实例
  GameApp.eliteBrainInstance = new EliteBrain();

})();
