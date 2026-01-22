/**
 * 联机消息协议模块
 * 定义 Host 和 Client 之间的消息格式和处理逻辑
 */
(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};

  /**
   * 消息类型定义
   */
  const MessageTypes = {
    // Client -> Host
    INPUT: 'input',           // 输入消息 (高频, 20-30Hz)
    SKILL_PICK: 'skill_pick', // 技能选择 (低频)
    
    // Host -> All
    SNAPSHOT: 'snapshot',     // 世界快照 (中频, 10-15Hz)
    EVENT: 'event',           // 游戏事件 (击杀/命中等)
    GAME_START: 'game_start', // 游戏开始
    GAME_OVER: 'game_over'    // 游戏结束
  };

  /**
   * 创建输入消息
   * @param {string} playerId - 玩家ID
   * @param {number} seq - 序列号
   * @param {object} move - 移动向量 {dx, dy}
   * @param {number} t - 时间戳
   */
  function createInputMsg(playerId, seq, move, t) {
    return {
      type: MessageTypes.INPUT,
      playerId: playerId,
      seq: seq,
      move: { dx: move.dx, dy: move.dy },
      t: t
    };
  }

  /**
   * 创建技能选择消息
   * @param {string} playerId - 玩家ID
   * @param {number} level - 当前等级
   * @param {number} pickIndex - 选择的技能索引 (0-2)
   */
  function createSkillPickMsg(playerId, level, pickIndex) {
    return {
      type: MessageTypes.SKILL_PICK,
      playerId: playerId,
      level: level,
      pickIndex: pickIndex
    };
  }

  /**
   * 创建世界快照消息
   * @param {object} game - 游戏实例
   * @param {number} t - 时间戳
   */
  function createSnapshotMsg(game, t) {
    // 序列化玩家状态
    const playersData = {};
    for (const [id, player] of Object.entries(game.players)) {
      playersData[id] = {
        x: player.x,
        y: player.y,
        hp: player.health,
        maxHp: player.maxHealth,
        exp: player.exp,
        maxExp: player.maxExp,
        level: player.level,
        isLevelingUp: player.isLevelingUp
      };
    }

    // 序列化敌人 (只发送关键数据)
    const enemiesData = game.enemies.slice(0, 100).map(e => ({
      id: e.id,
      x: e.x,
      y: e.y,
      hp: e.hp,
      maxHp: e.maxHp,
      type: e.type,
      frozen: e.frozenUntil > t
    }));

    // 序列化子弹
    const bulletsData = game.bullets.slice(0, 200).map(b => ({
      id: b.id,
      ownerId: b.ownerId,
      x: b.x,
      y: b.y,
      vx: b.vx,
      vy: b.vy
    }));

    // 序列化经验球
    const expOrbsData = game.expOrbs.slice(0, 100).map(o => ({
      id: o.id,
      x: o.x,
      y: o.y,
      val: o.val
    }));

    return {
      type: MessageTypes.SNAPSHOT,
      t: t,
      players: playersData,
      enemies: enemiesData,
      bullets: bulletsData,
      expOrbs: expOrbsData,
      director: {
        diff: game.director.diff,
        strength: game.director.strength
      }
    };
  }

  /**
   * 创建游戏事件消息
   * @param {string} eventType - 事件类型
   * @param {object} data - 事件数据
   */
  function createEventMsg(eventType, data) {
    return {
      type: MessageTypes.EVENT,
      eventType: eventType,
      ...data
    };
  }

  /**
   * 应用快照到游戏状态 (Client 端)
   * @param {object} game - 游戏实例
   * @param {object} snapshot - 快照数据
   */
  function applySnapshot(game, snapshot) {
    // 更新玩家状态
    if (snapshot.players) {
      for (const [id, pData] of Object.entries(snapshot.players)) {
        if (game.players[id]) {
          const player = game.players[id];
          // 位置插值 (平滑过渡)
          const lerpFactor = 0.3;
          player.x = player.x + (pData.x - player.x) * lerpFactor;
          player.y = player.y + (pData.y - player.y) * lerpFactor;
          // 直接更新其他状态
          player.health = pData.hp;
          player.maxHealth = pData.maxHp;
          player.exp = pData.exp;
          player.maxExp = pData.maxExp;
          player.level = pData.level;
          player.isLevelingUp = pData.isLevelingUp;
        }
      }
    }

    // 更新敌人
    if (snapshot.enemies) {
      const enemyMap = new Map();
      for (const e of game.enemies) {
        enemyMap.set(e.id, e);
      }

      for (const eData of snapshot.enemies) {
        let enemy = enemyMap.get(eData.id);
        if (enemy) {
          // 更新现有敌人
          const lerpFactor = 0.3;
          enemy.x = enemy.x + (eData.x - enemy.x) * lerpFactor;
          enemy.y = enemy.y + (eData.y - enemy.y) * lerpFactor;
          enemy.hp = eData.hp;
          enemy._frozen = eData.frozen;
          enemyMap.delete(eData.id);
        } else {
          // 创建新敌人 (简化版)
          game.enemies.push({
            id: eData.id,
            x: eData.x,
            y: eData.y,
            hp: eData.hp,
            maxHp: eData.maxHp,
            type: eData.type,
            w: 30,
            h: 30,
            _frozen: eData.frozen
          });
        }
      }

      // 移除不在快照中的敌人
      for (const [id] of enemyMap) {
        const idx = game.enemies.findIndex(e => e.id === id);
        if (idx !== -1) {
          game.enemies.splice(idx, 1);
        }
      }
    }

    // 更新子弹
    if (snapshot.bullets) {
      const bulletMap = new Map();
      for (const b of game.bullets) {
        bulletMap.set(b.id, b);
      }

      for (const bData of snapshot.bullets) {
        let bullet = bulletMap.get(bData.id);
        if (bullet) {
          bullet.x = bData.x;
          bullet.y = bData.y;
          bullet.vx = bData.vx;
          bullet.vy = bData.vy;
          bulletMap.delete(bData.id);
        } else {
          game.bullets.push({
            id: bData.id,
            ownerId: bData.ownerId,
            x: bData.x,
            y: bData.y,
            vx: bData.vx,
            vy: bData.vy,
            w: 8,
            h: 8,
            die: Date.now() / 1000 + 2
          });
        }
      }

      // 移除不在快照中的子弹
      for (const [id] of bulletMap) {
        const idx = game.bullets.findIndex(b => b.id === id);
        if (idx !== -1) {
          game.bullets.splice(idx, 1);
        }
      }
    }

    // 更新经验球
    if (snapshot.expOrbs) {
      game.expOrbs = snapshot.expOrbs.map(o => ({
        id: o.id,
        x: o.x,
        y: o.y,
        val: o.val,
        r: 8
      }));
    }

    // 更新 Director
    if (snapshot.director) {
      game.director.diff = snapshot.director.diff;
      game.director.strength = snapshot.director.strength;
    }
  }

  /**
   * 输入缓冲区 (用于 Host 端处理远程输入)
   */
  class InputBuffer {
    constructor() {
      this.inputs = new Map(); // playerId -> [{seq, move, t}]
      this.lastProcessedSeq = new Map(); // playerId -> seq
    }

    /**
     * 添加输入
     */
    addInput(playerId, inputMsg) {
      if (!this.inputs.has(playerId)) {
        this.inputs.set(playerId, []);
      }
      const buffer = this.inputs.get(playerId);
      buffer.push({
        seq: inputMsg.seq,
        move: inputMsg.move,
        t: inputMsg.t
      });
      // 保持缓冲区大小合理
      if (buffer.length > 30) {
        buffer.shift();
      }
    }

    /**
     * 获取最新输入
     */
    getLatestInput(playerId) {
      const buffer = this.inputs.get(playerId);
      if (!buffer || buffer.length === 0) {
        return { dx: 0, dy: 0 };
      }
      return buffer[buffer.length - 1].move;
    }

    /**
     * 清空玩家输入
     */
    clearPlayer(playerId) {
      this.inputs.delete(playerId);
      this.lastProcessedSeq.delete(playerId);
    }
  }

  // 导出
  GameApp.Protocol = {
    MessageTypes,
    createInputMsg,
    createSkillPickMsg,
    createSnapshotMsg,
    createEventMsg,
    applySnapshot,
    InputBuffer
  };
})();
