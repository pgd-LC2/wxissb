/**
 * 联机游戏主循环模块
 * 处理 Host/Client 不同的更新逻辑和网络同步
 */
(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};

  /**
   * 联机游戏循环管理器
   */
  class MultiplayerTick {
    constructor() {
      this.game = null;
      this.roomManager = null;
      this.isRunning = false;
      this.rafId = null;
      
      // 网络同步配置
      this.snapshotInterval = 1000 / 15; // 15 Hz 快照发送
      this.inputInterval = 1000 / 30;    // 30 Hz 输入发送
      this.lastSnapshotTime = 0;
      this.lastInputTime = 0;
      this.inputSeq = 0;
      
      // 输入缓冲
      this.inputBuffer = new GameApp.Protocol.InputBuffer();
      
      // 本地输入
      this.localInput = { dx: 0, dy: 0 };
    }

    /**
     * 初始化
     */
    init(game, roomManager) {
      this.game = game;
      this.roomManager = roomManager;
      
      // 设置消息处理
      roomManager.onMessage = (type, payload) => {
        this.handleMessage(type, payload);
      };
    }

    /**
     * 开始游戏循环
     */
    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.lastSnapshotTime = performance.now();
      this.lastInputTime = performance.now();
      this.tick();
    }

    /**
     * 停止游戏循环
     */
    stop() {
      this.isRunning = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    /**
     * 主循环
     */
    tick() {
      if (!this.isRunning) return;
      
      const now = performance.now();
      const t = now / 1000;
      
      // 1. 应用远程输入 (Host only)
      if (this.game.isHost) {
        this.applyRemoteInputs();
      }
      
      // 2. 应用本地输入
      this.applyLocalInput();
      
      // 3. 更新游戏状态 (Host only runs full simulation)
      if (this.game.isHost) {
        this.game.update(t);
      } else {
        // Client 只更新本地玩家位置预测
        this.clientPrediction(t);
      }
      
      // 4. 渲染
      this.game.render(t);
      
      // 5. 发送网络消息
      if (this.game.isHost) {
        // Host 发送快照
        if (now - this.lastSnapshotTime >= this.snapshotInterval) {
          this.sendSnapshot(t);
          this.lastSnapshotTime = now;
        }
      } else {
        // Client 发送输入
        if (now - this.lastInputTime >= this.inputInterval) {
          this.sendInput(t);
          this.lastInputTime = now;
        }
      }
      
      // 6. 更新 UI
      this.game.updateUI();
      
      // 继续循环
      this.rafId = requestAnimationFrame(() => this.tick());
    }

    /**
     * 设置本地输入
     */
    setLocalInput(dx, dy) {
      this.localInput.dx = dx;
      this.localInput.dy = dy;
    }

    /**
     * 应用本地输入
     */
    applyLocalInput() {
      const myId = this.roomManager.playerId;
      this.game.setPlayerInput(myId, this.localInput.dx, this.localInput.dy);
    }

    /**
     * 应用远程输入 (Host only)
     */
    applyRemoteInputs() {
      for (const [playerId, player] of Object.entries(this.game.players)) {
        if (playerId === this.roomManager.playerId) continue;
        
        const input = this.inputBuffer.getLatestInput(playerId);
        this.game.setPlayerInput(playerId, input.dx, input.dy);
      }
    }

    /**
     * Client 端预测
     */
    clientPrediction(t) {
      const myPlayer = this.game.getMyPlayer();
      if (!myPlayer || myPlayer.health <= 0) return;
      
      // 简单的本地移动预测
      const dt = 0.016;
      const speed = 200 * myPlayer.playerSpeedMulti;
      myPlayer.x += this.localInput.dx * speed * dt;
      myPlayer.y += this.localInput.dy * speed * dt;
      
      // 更新相机
      this.game.camera.x = myPlayer.x;
      this.game.camera.y = myPlayer.y;
    }

    /**
     * 发送输入消息 (Client -> Host)
     */
    async sendInput(t) {
      if (!this.roomManager) return;
      
      this.inputSeq++;
      const inputMsg = GameApp.Protocol.createInputMsg(
        this.roomManager.playerId,
        this.inputSeq,
        this.localInput,
        t
      );
      
      await this.roomManager.sendInput(inputMsg);
    }

    /**
     * 发送快照 (Host -> All)
     */
    async sendSnapshot(t) {
      if (!this.roomManager || !this.game.isHost) return;
      
      const snapshot = GameApp.Protocol.createSnapshotMsg(this.game, t);
      await this.roomManager.sendSnapshot(snapshot);
    }

    /**
     * 处理网络消息
     */
    handleMessage(type, payload) {
      switch (type) {
        case 'input':
          this.handleInputMessage(payload);
          break;
        case 'snapshot':
          this.handleSnapshotMessage(payload);
          break;
        case 'skill_pick':
          this.handleSkillPickMessage(payload);
          break;
        case 'event':
          this.handleEventMessage(payload);
          break;
      }
    }

    /**
     * 处理输入消息 (Host receives from Client)
     */
    handleInputMessage(payload) {
      if (!this.game.isHost) return;
      if (payload.playerId === this.roomManager.playerId) return;
      
      this.inputBuffer.addInput(payload.playerId, payload);
    }

    /**
     * 处理快照消息 (Client receives from Host)
     */
    handleSnapshotMessage(payload) {
      if (this.game.isHost) return;
      
      GameApp.Protocol.applySnapshot(this.game, payload);
    }

    /**
     * 处理技能选择消息
     */
    handleSkillPickMessage(payload) {
      const { playerId, level, pickIndex } = payload;
      
      if (this.game.isHost) {
        // Host 执行技能选择
        this.game.selectSkillForPlayer(playerId, pickIndex);
      }
    }

    /**
     * 处理游戏事件消息
     */
    handleEventMessage(payload) {
      // 处理击杀、命中等事件
      console.log('Game event:', payload);
    }

    /**
     * 发送技能选择
     */
    async sendSkillPick(level, pickIndex) {
      if (!this.roomManager) return;
      
      await this.roomManager.sendSkillPick(level, pickIndex);
      
      // 如果是 Host，直接执行
      if (this.game.isHost) {
        this.game.selectSkillForPlayer(this.roomManager.playerId, pickIndex);
      }
    }
  }

  // 创建全局实例
  GameApp.MultiplayerTick = new MultiplayerTick();
})();
