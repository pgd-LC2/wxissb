/**
 * PPO训练器 - 连接PPO网络和游戏环境
 * 
 * 从游戏中提取状态向量，计算奖励，驱动训练循环
 * 支持加速训练（跳帧）和实时可视化
 */
(() => {
  "use strict";

  const { STATE_DIM, ACTION_DIM, ACTION_MAP, PPONetwork, PPOTrainer } = window.PPONet;

  const NORM_DIST = 800;
  const NORM_LEVEL = 50;
  const NORM_ENEMIES = 20;
  const NORM_RATING = 500;

  function extractState(g) {
    const state = new Float32Array(STATE_DIM);
    if (!g || !g.player) return state;

    const px = g.player.x;
    const py = g.player.y;

    state[0] = Math.min(1, Math.max(0, (g.playerHealth || 0) / Math.max(1, g.playerMaxHealth || 100)));
    state[1] = g.joystickVector ? g.joystickVector.dx : 0;
    state[2] = g.joystickVector ? g.joystickVector.dy : 0;

    const enemies = g.enemies || [];
    let nearest = null;
    let nearestDist = Infinity;
    let second = null;
    let secondDist = Infinity;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e._dead) continue;
      const dx = e.x - px;
      const dy = e.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        second = nearest;
        secondDist = nearestDist;
        nearest = e;
        nearestDist = dist;
      } else if (dist < secondDist) {
        second = e;
        secondDist = dist;
      }
    }

    if (nearest) {
      state[3] = Math.max(-1, Math.min(1, (nearest.x - px) / NORM_DIST));
      state[4] = Math.max(-1, Math.min(1, (nearest.y - py) / NORM_DIST));
      state[5] = Math.min(1, nearestDist / NORM_DIST);
    }

    if (second) {
      state[6] = Math.max(-1, Math.min(1, (second.x - px) / NORM_DIST));
      state[7] = Math.max(-1, Math.min(1, (second.y - py) / NORM_DIST));
    }

    let nearbyCount = 0;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e._dead) continue;
      const dx = e.x - px;
      const dy = e.y - py;
      if (dx * dx + dy * dy < 300 * 300) nearbyCount++;
    }
    state[8] = Math.min(1, nearbyCount / NORM_ENEMIES);

    state[9] = Math.min(1, Math.max(0, (g.currentExp || 0) / Math.max(1, g.maxExp || 70)));
    state[10] = Math.min(1, (g.level || 1) / NORM_LEVEL);
    state[11] = Math.min(1, (g.combat && g.combat.rating ? g.combat.rating : 0) / NORM_RATING);

    const expOrbs = g.expOrbs || [];
    let nearestOrb = null;
    let nearestOrbDist = Infinity;
    for (let i = 0; i < expOrbs.length; i++) {
      const orb = expOrbs[i];
      if (!orb || orb._dead) continue;
      const dx = orb.x - px;
      const dy = orb.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestOrbDist) {
        nearestOrbDist = dist;
        nearestOrb = orb;
      }
    }

    if (nearestOrb) {
      state[12] = Math.max(-1, Math.min(1, (nearestOrb.x - px) / NORM_DIST));
      state[13] = Math.max(-1, Math.min(1, (nearestOrb.y - py) / NORM_DIST));
    }

    return state;
  }

  class GameEnvTracker {
    constructor() {
      this.prevHealth = 100;
      this.prevLevel = 1;
      this.prevKills = 0;
      this.prevExp = 0;
      this.episodeReward = 0;
      this.stepCount = 0;
    }

    reset(g) {
      if (!g) return;
      this.prevHealth = g.playerHealth || 100;
      this.prevLevel = g.level || 1;
      this.prevKills = (g.stats && g.stats.kills) || 0;
      this.prevExp = g.currentExp || 0;
      this.episodeReward = 0;
      this.stepCount = 0;
    }

    computeReward(g) {
      if (!g || !g.player) return { reward: 0, done: false };

      let reward = 0;
      const done = g.isGameOver || false;

      reward += 0.1;

      const currentHealth = g.playerHealth || 0;
      const healthDiff = currentHealth - this.prevHealth;
      if (healthDiff < 0) {
        reward += healthDiff * 0.3;
      }
      this.prevHealth = currentHealth;

      const currentKills = (g.stats && g.stats.kills) || 0;
      const newKills = currentKills - this.prevKills;
      if (newKills > 0) {
        reward += newKills * 5;
      }
      this.prevKills = currentKills;

      const currentLevel = g.level || 1;
      if (currentLevel > this.prevLevel) {
        reward += (currentLevel - this.prevLevel) * 20;
      }
      this.prevLevel = currentLevel;

      const currentExp = g.currentExp || 0;
      if (currentExp > this.prevExp) {
        reward += 0.5;
      }
      this.prevExp = currentExp;

      const enemies = g.enemies || [];
      let nearestDist = Infinity;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e || e._dead) continue;
        const dx = e.x - g.player.x;
        const dy = e.y - g.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) nearestDist = dist;
      }

      if (nearestDist < Infinity) {
        if (nearestDist > 80 && nearestDist < 300) {
          reward += 0.3;
        } else if (nearestDist < 40) {
          reward -= 0.5;
        }
      }

      if (done) {
        reward -= 50;
      }

      this.episodeReward += reward;
      this.stepCount++;

      return { reward, done };
    }
  }

  class PPOGameTrainer {
    constructor(config) {
      this.config = Object.assign({
        hiddenSize: 64,
        lr: 3e-4,
        gamma: 0.99,
        lamda: 0.95,
        epsilon: 0.2,
        entropyCoef: 0.01,
        rolloutLength: 256,
        epochs: 4,
        miniBatchSize: 64,
        speedMultiplier: 1,
      }, config || {});

      this.network = new PPONetwork(STATE_DIM, ACTION_DIM, this.config.hiddenSize);
      this.trainer = new PPOTrainer(this.network, {
        lr: this.config.lr,
        gamma: this.config.gamma,
        lamda: this.config.lamda,
        epsilon: this.config.epsilon,
        entropyCoef: this.config.entropyCoef,
        epochs: this.config.epochs,
        miniBatchSize: this.config.miniBatchSize,
      });

      this.envTracker = new GameEnvTracker();
      this.isTraining = false;
      this.isPaused = false;
      this.currentGame = null;
      this.stepsInRollout = 0;

      this.bestReward = -Infinity;
      this.bestNetwork = null;

      this.onTrainStep = null;
      this.onEpisodeEnd = null;
      this.onTrainUpdate = null;
    }

    attachGame(g) {
      this.currentGame = g;
      this.envTracker.reset(g);
    }

    step(t) {
      if (!this.isTraining || this.isPaused) return;
      if (!this.currentGame) return;

      const g = this.currentGame;

      if (g.isGameOver) {
        const totalReward = this.envTracker.episodeReward;
        this.trainer.recordEpisodeReward(totalReward);

        if (totalReward > this.bestReward) {
          this.bestReward = totalReward;
          this.bestNetwork = this.network.clone();
        }

        if (this.onEpisodeEnd) {
          this.onEpisodeEnd({
            episode: this.trainer.trainStats.totalEpisodes,
            reward: totalReward,
            steps: this.envTracker.stepCount,
            level: g.level || 1,
            kills: (g.stats && g.stats.kills) || 0,
            avgReward: this.trainer.trainStats.avgReward,
          });
        }

        if (this.stepsInRollout >= 16) {
          this.trainer.train();
          this.stepsInRollout = 0;

          if (this.onTrainUpdate) {
            this.onTrainUpdate({
              policyLoss: this.trainer.trainStats.policyLoss,
              valueLoss: this.trainer.trainStats.valueLoss,
              entropy: this.trainer.trainStats.entropy,
              totalSteps: this.trainer.trainStats.totalSteps,
            });
          }
        }
        return;
      }

      if (g.isPausedGame && !g.isGameOver) return;

      if (g.isLevelingUp) {
        this._autoSelectSkill(g);
        return;
      }

      const state = extractState(g);
      const { action, prob } = this.network.sampleAction(state);
      const value = this.network.forwardCritic(state);

      const move = ACTION_MAP[action];
      g.joystickVector = { dx: move.dx, dy: move.dy };

      const { reward, done } = this.envTracker.computeReward(g);
      const logProb = Math.log(prob + 1e-8);
      this.trainer.storeTransition(state, action, reward, done, logProb, value);
      this.stepsInRollout++;

      if (this.stepsInRollout >= this.config.rolloutLength && !done) {
        this.trainer.train();
        this.stepsInRollout = 0;

        if (this.onTrainUpdate) {
          this.onTrainUpdate({
            policyLoss: this.trainer.trainStats.policyLoss,
            valueLoss: this.trainer.trainStats.valueLoss,
            entropy: this.trainer.trainStats.entropy,
            totalSteps: this.trainer.trainStats.totalSteps,
          });
        }
      }

      if (this.onTrainStep) {
        this.onTrainStep({
          step: this.trainer.trainStats.totalSteps,
          action,
          reward,
          episodeReward: this.envTracker.episodeReward,
          hp: state[0],
          level: g.level,
        });
      }
    }

    _autoSelectSkill(g) {
      if (!g.skillChoices || g.skillChoices.length === 0) return;
      const idx = Math.floor(Math.random() * g.skillChoices.length);
      const skill = g.skillChoices[idx];
      if (g.selectSkill) {
        g.selectSkill(skill);
        const overlay = document.getElementById("overlay");
        if (overlay) overlay.classList.remove("show");
      }
    }

    startTraining() {
      this.isTraining = true;
      this.isPaused = false;
    }

    pauseTraining() {
      this.isPaused = true;
    }

    resumeTraining() {
      this.isPaused = false;
    }

    stopTraining() {
      this.isTraining = false;
      this.isPaused = false;
    }

    getStats() {
      return {
        totalSteps: this.trainer.trainStats.totalSteps,
        totalEpisodes: this.trainer.trainStats.totalEpisodes,
        avgReward: this.trainer.trainStats.avgReward,
        bestReward: this.bestReward,
        policyLoss: this.trainer.trainStats.policyLoss,
        valueLoss: this.trainer.trainStats.valueLoss,
        entropy: this.trainer.trainStats.entropy,
        rewardHistory: this.trainer.trainStats.rewardHistory,
        lossHistory: this.trainer.trainStats.lossHistory,
      };
    }

    exportModel() {
      return this.network.exportJSON();
    }

    importModel(json) {
      this.network = PPONetwork.fromJSON(json);
      this.trainer.net = this.network;
    }

    exportBestModel() {
      if (this.bestNetwork) return this.bestNetwork.exportJSON();
      return this.network.exportJSON();
    }
  }

  window.PPOTrainerSystem = {
    extractState,
    GameEnvTracker,
    PPOGameTrainer,
  };
})();
