/**
 * 联机房间管理模块
 * 使用 Supabase Realtime (Presence + Broadcast) 实现房间系统
 */
(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};

  // 生成 6 位房间代码
  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // 生成玩家 ID
  function generatePlayerId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 房间管理器
   */
  class RoomManager {
    constructor() {
      this.channel = null;
      this.roomCode = null;
      this.playerId = generatePlayerId();
      this.playerName = '';
      this.isHost = false;
      this.players = new Map();
      this.joinTime = 0;
      
      // 回调函数
      this.onPlayersChange = null;
      this.onHostChange = null;
      this.onGameStart = null;
      this.onMessage = null;
      this.onDisconnect = null;
      this.onError = null;
    }

    /**
     * 获取 Supabase 客户端
     */
    getClient() {
      if (window.getSupabaseClient) {
        return window.getSupabaseClient();
      }
      return null;
    }

    /**
     * 创建房间
     */
    async createRoom(playerName) {
      const client = this.getClient();
      if (!client) {
        throw new Error('Supabase 客户端未初始化');
      }

      this.playerName = playerName;
      this.roomCode = generateRoomCode();
      this.joinTime = Date.now();
      this.isHost = true;

      await this.joinChannel();
      return this.roomCode;
    }

    /**
     * 加入房间
     */
    async joinRoom(roomCode, playerName) {
      const client = this.getClient();
      if (!client) {
        throw new Error('Supabase 客户端未初始化');
      }

      this.playerName = playerName;
      this.roomCode = roomCode.toUpperCase();
      this.joinTime = Date.now();
      this.isHost = false;

      await this.joinChannel();
      
      // 等待一小段时间确认房间存在
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (this.players.size < 2) {
        // 只有自己，可能房间不存在或 Host 已离开
        const hasHost = Array.from(this.players.values()).some(p => p.isHost);
        if (!hasHost && this.players.size === 1) {
          // 房间可能不存在，但我们允许等待
          console.log('等待 Host 加入或确认房间存在...');
        }
      }
    }

    /**
     * 加入 Realtime Channel
     */
    async joinChannel() {
      const client = this.getClient();
      const channelName = `game_room_${this.roomCode}`;

      this.channel = client.channel(channelName, {
        config: {
          presence: {
            key: this.playerId
          }
        }
      });

      // 监听 Presence 事件
      this.channel
        .on('presence', { event: 'sync' }, () => {
          this.handlePresenceSync();
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('玩家加入:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('玩家离开:', key, leftPresences);
          this.handlePlayerLeave(key);
        });

      // 监听 Broadcast 消息
      this.channel
        .on('broadcast', { event: 'game_input' }, (payload) => {
          if (this.onMessage) this.onMessage('input', payload.payload);
        })
        .on('broadcast', { event: 'game_snapshot' }, (payload) => {
          if (this.onMessage) this.onMessage('snapshot', payload.payload);
        })
        .on('broadcast', { event: 'skill_pick' }, (payload) => {
          if (this.onMessage) this.onMessage('skill_pick', payload.payload);
        })
        .on('broadcast', { event: 'game_start' }, (payload) => {
          if (this.onGameStart) this.onGameStart(payload.payload);
        })
        .on('broadcast', { event: 'game_event' }, (payload) => {
          if (this.onMessage) this.onMessage('event', payload.payload);
        });

      // 订阅频道
      const status = await this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // 发送自己的 Presence 状态
          await this.channel.track({
            playerId: this.playerId,
            playerName: this.playerName,
            joinTime: this.joinTime,
            isHost: this.isHost
          });
        }
      });

      return status;
    }

    /**
     * 处理 Presence 同步
     */
    handlePresenceSync() {
      if (!this.channel) return;

      const state = this.channel.presenceState();
      this.players.clear();

      // 收集所有玩家
      const allPlayers = [];
      for (const [key, presences] of Object.entries(state)) {
        if (presences && presences.length > 0) {
          const p = presences[0];
          allPlayers.push({
            id: p.playerId,
            name: p.playerName,
            joinTime: p.joinTime,
            isHost: p.isHost
          });
        }
      }

      // 按加入时间排序，确定 Host
      allPlayers.sort((a, b) => a.joinTime - b.joinTime);

      // 第一个加入的是 Host
      allPlayers.forEach((p, index) => {
        const isActualHost = index === 0;
        this.players.set(p.id, {
          ...p,
          isHost: isActualHost,
          playerIndex: index
        });

        // 更新自己的 Host 状态
        if (p.id === this.playerId) {
          const wasHost = this.isHost;
          this.isHost = isActualHost;
          if (wasHost !== this.isHost && this.onHostChange) {
            this.onHostChange(this.isHost);
          }
        }
      });

      // 触发玩家列表更新回调
      if (this.onPlayersChange) {
        this.onPlayersChange(Array.from(this.players.values()));
      }
    }

    /**
     * 处理玩家离开
     */
    handlePlayerLeave(playerId) {
      const player = this.players.get(playerId);
      if (player && player.isHost && playerId !== this.playerId) {
        // Host 离开了，游戏结束
        if (this.onDisconnect) {
          this.onDisconnect('host_left');
        }
      }
    }

    /**
     * 发送广播消息
     */
    async broadcast(event, payload) {
      if (!this.channel) return;

      await this.channel.send({
        type: 'broadcast',
        event: event,
        payload: {
          ...payload,
          senderId: this.playerId,
          timestamp: Date.now()
        }
      });
    }

    /**
     * 发送输入消息 (Client -> Host)
     */
    async sendInput(inputData) {
      await this.broadcast('game_input', {
        type: 'input',
        playerId: this.playerId,
        ...inputData
      });
    }

    /**
     * 发送世界快照 (Host -> All)
     */
    async sendSnapshot(snapshotData) {
      if (!this.isHost) return;
      await this.broadcast('game_snapshot', {
        type: 'snapshot',
        ...snapshotData
      });
    }

    /**
     * 发送技能选择
     */
    async sendSkillPick(level, pickIndex) {
      await this.broadcast('skill_pick', {
        type: 'skill_pick',
        playerId: this.playerId,
        level: level,
        pickIndex: pickIndex
      });
    }

    /**
     * 发送游戏开始信号 (Host only)
     */
    async startGame() {
      if (!this.isHost) return;
      
      const players = Array.from(this.players.values());
      await this.broadcast('game_start', {
        type: 'game_start',
        players: players.map(p => ({
          id: p.id,
          name: p.name,
          playerIndex: p.playerIndex
        })),
        hostId: this.playerId,
        startTime: Date.now()
      });
    }

    /**
     * 发送游戏事件
     */
    async sendEvent(eventType, eventData) {
      await this.broadcast('game_event', {
        type: 'event',
        eventType: eventType,
        ...eventData
      });
    }

    /**
     * 离开房间
     */
    async leaveRoom() {
      if (this.channel) {
        await this.channel.untrack();
        await this.channel.unsubscribe();
        this.channel = null;
      }
      this.roomCode = null;
      this.players.clear();
      this.isHost = false;
    }

    /**
     * 获取玩家列表
     */
    getPlayers() {
      return Array.from(this.players.values());
    }

    /**
     * 获取自己的玩家索引 (0 或 1)
     */
    getMyPlayerIndex() {
      const me = this.players.get(this.playerId);
      return me ? me.playerIndex : 0;
    }

    /**
     * 获取对方玩家
     */
    getOtherPlayer() {
      for (const [id, player] of this.players) {
        if (id !== this.playerId) {
          return player;
        }
      }
      return null;
    }

    /**
     * 检查房间是否已满 (2人)
     */
    isRoomFull() {
      return this.players.size >= 2;
    }

    /**
     * 检查是否可以开始游戏
     */
    canStartGame() {
      return this.isHost && this.players.size === 2;
    }
  }

  // 创建全局实例
  GameApp.RoomManager = new RoomManager();
})();
