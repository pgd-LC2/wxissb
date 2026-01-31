/**
 * 联机大厅界面逻辑
 * 处理房间创建、加入、等待和游戏开始
 */
(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};

  /**
   * 大厅管理器
   */
  class LobbyManager {
    constructor() {
      this.currentScreen = 'lobby'; // 'lobby' | 'waiting' | 'game'
      this.game = null;
      
      // DOM 元素引用
      this.elements = {};
    }

    /**
     * 初始化
     */
    init() {
      this.cacheElements();
      this.bindEvents();
      this.showScreen('lobby');
    }

    /**
     * 缓存 DOM 元素
     */
    cacheElements() {
      this.elements = {
        // 屏幕
        lobbyScreen: document.getElementById('lobbyScreen'),
        waitingScreen: document.getElementById('waitingScreen'),
        gameScreen: document.getElementById('gameScreen'),
        
        // 大厅
        playerNameInput: document.getElementById('playerNameInput'),
        createRoomBtn: document.getElementById('createRoomBtn'),
        roomCodeInput: document.getElementById('roomCodeInput'),
        joinRoomBtn: document.getElementById('joinRoomBtn'),
        backToMenuBtn: document.getElementById('backToMenuBtn'),
        lobbyStatus: document.getElementById('lobbyStatus'),
        
        // 等待房间
        roomCodeDisplay: document.getElementById('roomCodeDisplay'),
        copyCodeBtn: document.getElementById('copyCodeBtn'),
        playersList: document.getElementById('playersList'),
        waitingInfo: document.getElementById('waitingInfo'),
        startGameBtn: document.getElementById('startGameBtn'),
        leaveRoomBtn: document.getElementById('leaveRoomBtn'),
        
        // 游戏
        connectionStatus: document.getElementById('connectionStatus'),
        
        // HUD
        player1Hud: document.getElementById('player1Hud'),
        player2Hud: document.getElementById('player2Hud')
      };
    }

    /**
     * 绑定事件
     */
    bindEvents() {
      const { 
        createRoomBtn, joinRoomBtn, backToMenuBtn,
        copyCodeBtn, startGameBtn, leaveRoomBtn,
        playerNameInput, roomCodeInput
      } = this.elements;

      // 创建房间
      if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => this.createRoom());
      }

      // 加入房间
      if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', () => this.joinRoom());
      }

      // 返回主菜单
      if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
          window.location.href = '../index.html';
        });
      }

      // 复制房间代码
      if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', () => this.copyRoomCode());
      }

      // 开始游戏
      if (startGameBtn) {
        startGameBtn.addEventListener('click', () => this.startGame());
      }

      // 离开房间
      if (leaveRoomBtn) {
        leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
      }

      // 输入框回车
      if (roomCodeInput) {
        roomCodeInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.joinRoom();
        });
      }

      // 设置 RoomManager 回调
      const rm = GameApp.RoomManager;
      if (rm) {
        rm.onPlayersChange = (players) => this.updatePlayersList(players);
        rm.onHostChange = (isHost) => this.updateHostStatus(isHost);
        rm.onGameStart = (data) => this.handleGameStart(data);
        rm.onDisconnect = (reason) => this.handleDisconnect(reason);
        rm.onError = (error) => this.showError(error);
      }
    }

    /**
     * 显示屏幕
     */
    showScreen(screen) {
      this.currentScreen = screen;
      
      const { lobbyScreen, waitingScreen, gameScreen } = this.elements;
      
      if (lobbyScreen) lobbyScreen.classList.toggle('hidden', screen !== 'lobby');
      if (waitingScreen) waitingScreen.classList.toggle('hidden', screen !== 'waiting');
      if (gameScreen) gameScreen.classList.toggle('hidden', screen !== 'game');
    }

    /**
     * 显示状态消息
     */
    showStatus(message, type = 'info') {
      const { lobbyStatus } = this.elements;
      if (!lobbyStatus) return;
      
      lobbyStatus.textContent = message;
      lobbyStatus.className = 'lobby-status ' + type;
      lobbyStatus.style.display = 'block';
    }

    /**
     * 隐藏状态消息
     */
    hideStatus() {
      const { lobbyStatus } = this.elements;
      if (lobbyStatus) {
        lobbyStatus.style.display = 'none';
      }
    }

    /**
     * 显示错误
     */
    showError(message) {
      this.showStatus(message, 'error');
    }

    /**
     * 获取玩家名称
     */
    getPlayerName() {
      const { playerNameInput } = this.elements;
      let name = playerNameInput ? playerNameInput.value.trim() : '';
      if (!name) {
        name = '玩家' + Math.floor(Math.random() * 10000);
      }
      return name;
    }

    /**
     * 创建房间
     */
    async createRoom() {
      const rm = GameApp.RoomManager;
      if (!rm) {
        this.showError('房间管理器未初始化');
        return;
      }

      const playerName = this.getPlayerName();
      this.showStatus('正在创建房间...', 'info');

      try {
        const roomCode = await rm.createRoom(playerName);
        this.showScreen('waiting');
        this.updateRoomCode(roomCode);
        this.updatePlayersList(rm.getPlayers());
        this.updateStartButton();
      } catch (error) {
        console.error('创建房间失败:', error);
        this.showError('创建房间失败: ' + error.message);
      }
    }

    /**
     * 加入房间
     */
    async joinRoom() {
      const rm = GameApp.RoomManager;
      if (!rm) {
        this.showError('房间管理器未初始化');
        return;
      }

      const { roomCodeInput } = this.elements;
      const roomCode = roomCodeInput ? roomCodeInput.value.trim().toUpperCase() : '';
      
      if (!roomCode || roomCode.length !== 6) {
        this.showError('请输入有效的 6 位房间代码');
        return;
      }

      const playerName = this.getPlayerName();
      this.showStatus('正在加入房间...', 'info');

      try {
        await rm.joinRoom(roomCode, playerName);
        this.showScreen('waiting');
        this.updateRoomCode(roomCode);
        this.updatePlayersList(rm.getPlayers());
        this.updateStartButton();
      } catch (error) {
        console.error('加入房间失败:', error);
        this.showError('加入房间失败: ' + error.message);
      }
    }

    /**
     * 更新房间代码显示
     */
    updateRoomCode(code) {
      const { roomCodeDisplay } = this.elements;
      if (roomCodeDisplay) {
        roomCodeDisplay.textContent = code;
      }
    }

    /**
     * 复制房间代码
     */
    async copyRoomCode() {
      const rm = GameApp.RoomManager;
      if (!rm || !rm.roomCode) return;

      try {
        await navigator.clipboard.writeText(rm.roomCode);
        const { copyCodeBtn } = this.elements;
        if (copyCodeBtn) {
          const originalText = copyCodeBtn.textContent;
          copyCodeBtn.textContent = '已复制!';
          setTimeout(() => {
            copyCodeBtn.textContent = originalText;
          }, 2000);
        }
      } catch (error) {
        console.error('复制失败:', error);
      }
    }

    /**
     * 更新玩家列表
     */
    updatePlayersList(players) {
      const { playersList } = this.elements;
      if (!playersList) return;

      playersList.innerHTML = '';

      // 排序：Host 在前
      const sorted = [...players].sort((a, b) => {
        if (a.isHost && !b.isHost) return -1;
        if (!a.isHost && b.isHost) return 1;
        return a.playerIndex - b.playerIndex;
      });

      for (let i = 0; i < 2; i++) {
        const player = sorted[i];
        const div = document.createElement('div');
        
        if (player) {
          div.className = `player-item p${player.playerIndex + 1}${player.isHost ? ' host' : ''}`;
          div.innerHTML = `
            <div class="player-avatar">${player.playerIndex === 0 ? 'A' : 'B'}</div>
            <div class="player-info">
              <div class="player-name">${this.escapeHtml(player.name)}</div>
              <div class="player-role">${player.isHost ? '房主' : '玩家'}</div>
            </div>
            ${player.isHost ? '<span class="host-badge">HOST</span>' : ''}
          `;
        } else {
          div.className = 'player-item empty';
          div.innerHTML = '<span>等待玩家加入...</span>';
        }
        
        playersList.appendChild(div);
      }

      this.updateStartButton();
      this.updateWaitingInfo(players.length);
    }

    /**
     * 更新等待信息
     */
    updateWaitingInfo(playerCount) {
      const { waitingInfo } = this.elements;
      if (!waitingInfo) return;

      if (playerCount < 2) {
        waitingInfo.innerHTML = `
          <p>等待其他玩家加入...</p>
          <div class="loading-dots">
            <span></span><span></span><span></span>
          </div>
        `;
      } else {
        const rm = GameApp.RoomManager;
        if (rm && rm.isHost) {
          waitingInfo.innerHTML = '<p>玩家已就绪，点击开始游戏！</p>';
        } else {
          waitingInfo.innerHTML = '<p>等待房主开始游戏...</p>';
        }
      }
    }

    /**
     * 更新开始按钮状态
     */
    updateStartButton() {
      const { startGameBtn } = this.elements;
      if (!startGameBtn) return;

      const rm = GameApp.RoomManager;
      const canStart = rm && rm.canStartGame();
      
      startGameBtn.disabled = !canStart;
      startGameBtn.textContent = canStart ? '开始游戏' : '等待玩家...';
    }

    /**
     * 更新 Host 状态
     */
    updateHostStatus(isHost) {
      this.updateStartButton();
      
      const rm = GameApp.RoomManager;
      if (rm) {
        this.updatePlayersList(rm.getPlayers());
      }
    }

    /**
     * 开始游戏
     */
    async startGame() {
      const rm = GameApp.RoomManager;
      if (!rm || !rm.canStartGame()) return;

      try {
        await rm.startGame();
      } catch (error) {
        console.error('开始游戏失败:', error);
        this.showError('开始游戏失败: ' + error.message);
      }
    }

    /**
     * 处理游戏开始
     */
    handleGameStart(data) {
      console.log('游戏开始:', data);
      
      this.showScreen('game');
      this.initGame(data);
    }

    /**
     * 初始化游戏
     */
    initGame(startData) {
      const rm = GameApp.RoomManager;
      if (!rm) return;

      // 创建游戏实例
      const playersInfo = startData.players.map(p => ({
        id: p.id,
        name: p.name,
        index: p.playerIndex
      }));

      this.game = GameApp.makeMultiplayerGame(
        rm.isHost,
        rm.playerId,
        playersInfo
      );

      // 设置回调
      this.game.onStateChange = (expRatio, hpRatio, level) => {
        this.updateHUD();
      };

      this.game.onPlayerLevelUp = (playerId, level) => {
        this.handlePlayerLevelUp(playerId, level);
      };

      this.game.onGameOver = () => {
        this.handleGameOver();
      };

      // 初始化游戏循环
      const tick = GameApp.MultiplayerTick;
      tick.init(this.game, rm);

      // 设置输入
      this.setupInput();

      // 开始游戏循环
      tick.start();

      // 更新连接状态
      this.updateConnectionStatus('connected');
    }

    /**
     * 设置输入
     */
    setupInput() {
      // 键盘输入
      const keys = { w: false, a: false, s: false, d: false };
      
      document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (keys.hasOwnProperty(key)) {
          keys[key] = true;
          this.updateInputFromKeys(keys);
        }
      });

      document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (keys.hasOwnProperty(key)) {
          keys[key] = false;
          this.updateInputFromKeys(keys);
        }
      });

      // 虚拟摇杆 (如果存在)
      const joystickEl = document.getElementById('joystick');
      if (joystickEl) {
        this.setupJoystick(joystickEl);
      }
    }

    /**
     * 从键盘状态更新输入
     */
    updateInputFromKeys(keys) {
      let dx = 0, dy = 0;
      if (keys.a) dx -= 1;
      if (keys.d) dx += 1;
      if (keys.w) dy -= 1;
      if (keys.s) dy += 1;
      
      // 归一化
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
      }

      const tick = GameApp.MultiplayerTick;
      if (tick) {
        tick.setLocalInput(dx, dy);
      }
    }

    /**
     * 设置虚拟摇杆
     */
    setupJoystick(el) {
      let isActive = false;
      let startX = 0, startY = 0;
      const maxDist = 50;

      const handleStart = (e) => {
        isActive = true;
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;
      };

      const handleMove = (e) => {
        if (!isActive) return;
        e.preventDefault();
        
        const touch = e.touches ? e.touches[0] : e;
        let dx = touch.clientX - startX;
        let dy = touch.clientY - startY;
        
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }

        const tick = GameApp.MultiplayerTick;
        if (tick) {
          tick.setLocalInput(dx / maxDist, dy / maxDist);
        }
      };

      const handleEnd = () => {
        isActive = false;
        const tick = GameApp.MultiplayerTick;
        if (tick) {
          tick.setLocalInput(0, 0);
        }
      };

      el.addEventListener('touchstart', handleStart);
      el.addEventListener('touchmove', handleMove);
      el.addEventListener('touchend', handleEnd);
      el.addEventListener('mousedown', handleStart);
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
    }

    /**
     * 更新 HUD
     */
    updateHUD() {
      if (!this.game) return;

      const players = Object.values(this.game.players);
      
      for (let i = 0; i < players.length && i < 2; i++) {
        const player = players[i];
        const hudEl = i === 0 ? this.elements.player1Hud : this.elements.player2Hud;
        if (!hudEl) continue;

        const hpFill = hudEl.querySelector('.hp-fill');
        const expFill = hudEl.querySelector('.exp-fill');
        const levelBadge = hudEl.querySelector('.level-badge');

        if (hpFill) {
          hpFill.style.width = (player.health / player.maxHealth * 100) + '%';
        }
        if (expFill) {
          expFill.style.width = (player.exp / player.maxExp * 100) + '%';
        }
        if (levelBadge) {
          levelBadge.textContent = 'Lv.' + player.level;
        }
      }
    }

    /**
     * 处理玩家升级
     */
    handlePlayerLevelUp(playerId, level) {
      const rm = GameApp.RoomManager;
      if (!rm) return;

      // 只处理本地玩家的升级
      if (playerId !== rm.playerId) return;

      // 生成技能选择
      this.game.generateSkillsForPlayer(playerId);
      
      // 显示技能选择界面
      this.showSkillSelection(playerId);
    }

    /**
     * 显示技能选择界面
     */
    showSkillSelection(playerId) {
      const player = this.game.players[playerId];
      if (!player || !player.skillChoices) return;

      // 暂停游戏
      this.game.isPausedGame = true;

      // 创建技能选择 UI
      const overlay = document.createElement('div');
      overlay.className = 'skill-overlay';
      overlay.innerHTML = `
        <div class="skill-container">
          <h2>选择技能 (等级 ${player.level})</h2>
          <div class="skill-choices">
            ${player.skillChoices.map((skill, i) => `
              <div class="skill-card tier${skill.tier || 1}" data-index="${i}">
                <div class="skill-icon">${skill.icon || '?'}</div>
                <div class="skill-name">${this.escapeHtml(skill.name)}</div>
                <div class="skill-desc">${this.escapeHtml(skill.description)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // 绑定点击事件
      overlay.querySelectorAll('.skill-card').forEach(card => {
        card.addEventListener('click', () => {
          const index = parseInt(card.dataset.index);
          this.selectSkill(playerId, index);
          overlay.remove();
        });
      });

      document.body.appendChild(overlay);
    }

    /**
     * 选择技能
     */
    async selectSkill(playerId, skillIndex) {
      const player = this.game.players[playerId];
      if (!player) return;

      // 发送技能选择
      const tick = GameApp.MultiplayerTick;
      if (tick) {
        await tick.sendSkillPick(player.level, skillIndex);
      }

      // 如果是 Host，直接执行
      if (this.game.isHost) {
        this.game.selectSkillForPlayer(playerId, skillIndex);
      }

      // 恢复游戏
      this.game.isPausedGame = false;
    }

    /**
     * 处理游戏结束
     */
    handleGameOver() {
      const tick = GameApp.MultiplayerTick;
      if (tick) {
        tick.stop();
      }

      // 显示游戏结束界面
      const overlay = document.createElement('div');
      overlay.className = 'gameover-overlay';
      
      const players = Object.values(this.game.players);
      const stats = players.map(p => `
        <div class="player-stats">
          <h3 style="color: ${p.color}">${this.escapeHtml(p.name)}</h3>
          <p>等级: ${p.level}</p>
          <p>击杀: ${p.stats.kills}</p>
          <p>伤害: ${Math.round(p.stats.dmgDealt)}</p>
        </div>
      `).join('');

      overlay.innerHTML = `
        <div class="gameover-container">
          <h1>游戏结束</h1>
          <div class="stats-grid">${stats}</div>
          <button class="lobby-btn primary" onclick="location.reload()">返回大厅</button>
        </div>
      `;

      document.body.appendChild(overlay);
    }

    /**
     * 离开房间
     */
    async leaveRoom() {
      const rm = GameApp.RoomManager;
      if (rm) {
        await rm.leaveRoom();
      }
      this.showScreen('lobby');
      this.hideStatus();
    }

    /**
     * 处理断开连接
     */
    handleDisconnect(reason) {
      console.log('断开连接:', reason);
      
      const tick = GameApp.MultiplayerTick;
      if (tick) {
        tick.stop();
      }

      this.updateConnectionStatus('disconnected');

      if (reason === 'host_left') {
        alert('房主已离开，游戏结束');
        this.showScreen('lobby');
      }
    }

    /**
     * 更新连接状态
     */
    updateConnectionStatus(status) {
      const { connectionStatus } = this.elements;
      if (!connectionStatus) return;

      connectionStatus.className = 'connection-status ' + status;
      
      const textEl = connectionStatus.querySelector('.status-text');
      if (textEl) {
        switch (status) {
          case 'connected':
            textEl.textContent = '已连接';
            break;
          case 'disconnected':
            textEl.textContent = '已断开';
            break;
          case 'reconnecting':
            textEl.textContent = '重连中...';
            break;
        }
      }
    }

    /**
     * HTML 转义
     */
    escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // 创建全局实例
  GameApp.LobbyManager = new LobbyManager();

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      GameApp.LobbyManager.init();
    });
  } else {
    GameApp.LobbyManager.init();
  }
})();
