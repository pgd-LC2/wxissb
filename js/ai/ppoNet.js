/**
 * PPO (Proximal Policy Optimization) 神经网络 - 纯JS实现
 * 
 * 在浏览器端运行的轻量级PPO算法
 * Actor-Critic 架构，离散动作空间
 * 
 * 状态向量 (14维):
 *   0: 玩家HP比例 (0-1)
 *   1: 玩家移动方向X (-1~1)
 *   2: 玩家移动方向Y (-1~1)
 *   3: 最近敌人相对X (归一化)
 *   4: 最近敌人相对Y (归一化)
 *   5: 最近敌人距离 (归一化 0-1)
 *   6: 第二近敌人相对X
 *   7: 第二近敌人相对Y
 *   8: 附近敌人数量 (归一化 /20)
 *   9: 经验条比例 (0-1)
 *  10: 等级 (归一化 /50)
 *  11: 战力评分 (归一化)
 *  12: 最近经验球相对X (归一化)
 *  13: 最近经验球相对Y (归一化)
 * 
 * 动作空间 (9个离散动作):
 *   0:不按 1:W 2:A 3:S 4:D 5:WA 6:WD 7:SA 8:SD
 */
(() => {
  "use strict";

  const STATE_DIM = 14;
  const ACTION_DIM = 9;

  class Matrix {
    constructor(rows, cols, data) {
      this.rows = rows;
      this.cols = cols;
      this.data = data || new Float32Array(rows * cols);
    }

    static zeros(rows, cols) {
      return new Matrix(rows, cols);
    }

    static random(rows, cols, scale) {
      const m = new Matrix(rows, cols);
      const s = scale || Math.sqrt(2.0 / (rows + cols));
      for (let i = 0; i < m.data.length; i++) {
        m.data[i] = (Math.random() * 2 - 1) * s;
      }
      return m;
    }

    get(r, c) { return this.data[r * this.cols + c]; }
    set(r, c, v) { this.data[r * this.cols + c] = v; }

    clone() {
      return new Matrix(this.rows, this.cols, new Float32Array(this.data));
    }
  }

  function matMulVec(mat, vec) {
    const out = new Float32Array(mat.rows);
    for (let r = 0; r < mat.rows; r++) {
      let sum = 0;
      const off = r * mat.cols;
      for (let c = 0; c < mat.cols; c++) {
        sum += mat.data[off + c] * vec[c];
      }
      out[r] = sum;
    }
    return out;
  }

  function vecAdd(a, b) {
    const out = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) out[i] = a[i] + b[i];
    return out;
  }

  function tanh(x) {
    const out = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) {
      const e2 = Math.exp(2 * Math.max(-20, Math.min(20, x[i])));
      out[i] = (e2 - 1) / (e2 + 1);
    }
    return out;
  }

  function relu(x) {
    const out = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) {
      out[i] = x[i] > 0 ? x[i] : 0;
    }
    return out;
  }

  function softmax(x) {
    let maxVal = -Infinity;
    for (let i = 0; i < x.length; i++) {
      if (x[i] > maxVal) maxVal = x[i];
    }
    const out = new Float32Array(x.length);
    let sum = 0;
    for (let i = 0; i < x.length; i++) {
      out[i] = Math.exp(x[i] - maxVal);
      sum += out[i];
    }
    for (let i = 0; i < x.length; i++) {
      out[i] /= sum;
    }
    return out;
  }

  class PPONetwork {
    constructor(stateDim, actionDim, hiddenSize) {
      this.stateDim = stateDim || STATE_DIM;
      this.actionDim = actionDim || ACTION_DIM;
      this.hiddenSize = hiddenSize || 64;

      this.actorW1 = Matrix.random(this.hiddenSize, this.stateDim);
      this.actorB1 = new Float32Array(this.hiddenSize);
      this.actorW2 = Matrix.random(this.hiddenSize, this.hiddenSize);
      this.actorB2 = new Float32Array(this.hiddenSize);
      this.actorW3 = Matrix.random(this.actionDim, this.hiddenSize);
      this.actorB3 = new Float32Array(this.actionDim);

      this.criticW1 = Matrix.random(this.hiddenSize, this.stateDim);
      this.criticB1 = new Float32Array(this.hiddenSize);
      this.criticW2 = Matrix.random(this.hiddenSize, this.hiddenSize);
      this.criticB2 = new Float32Array(this.hiddenSize);
      this.criticW3 = Matrix.random(1, this.hiddenSize);
      this.criticB3 = new Float32Array(1);
    }

    forwardActor(state) {
      let h = tanh(vecAdd(matMulVec(this.actorW1, state), this.actorB1));
      h = tanh(vecAdd(matMulVec(this.actorW2, h), this.actorB2));
      const logits = vecAdd(matMulVec(this.actorW3, h), this.actorB3);
      return softmax(logits);
    }

    forwardCritic(state) {
      let h = tanh(vecAdd(matMulVec(this.criticW1, state), this.criticB1));
      h = tanh(vecAdd(matMulVec(this.criticW2, h), this.criticB2));
      const val = vecAdd(matMulVec(this.criticW3, h), this.criticB3);
      return val[0];
    }

    sampleAction(state) {
      const probs = this.forwardActor(state);
      let r = Math.random();
      for (let i = 0; i < probs.length; i++) {
        r -= probs[i];
        if (r <= 0) return { action: i, prob: probs[i], probs };
      }
      return { action: probs.length - 1, prob: probs[probs.length - 1], probs };
    }

    greedyAction(state) {
      const probs = this.forwardActor(state);
      let bestIdx = 0;
      for (let i = 1; i < probs.length; i++) {
        if (probs[i] > probs[bestIdx]) bestIdx = i;
      }
      return { action: bestIdx, prob: probs[bestIdx], probs };
    }

    getAllParams() {
      const params = [];
      const layers = [
        this.actorW1, this.actorB1, this.actorW2, this.actorB2, this.actorW3, this.actorB3,
        this.criticW1, this.criticB1, this.criticW2, this.criticB2, this.criticW3, this.criticB3
      ];
      for (const l of layers) {
        const d = l.data || l;
        for (let i = 0; i < d.length; i++) params.push(d[i]);
      }
      return params;
    }

    setAllParams(params) {
      const layers = [
        this.actorW1, this.actorB1, this.actorW2, this.actorB2, this.actorW3, this.actorB3,
        this.criticW1, this.criticB1, this.criticW2, this.criticB2, this.criticW3, this.criticB3
      ];
      let idx = 0;
      for (const l of layers) {
        const d = l.data || l;
        for (let i = 0; i < d.length; i++) {
          d[i] = params[idx++];
        }
      }
    }

    getParamCount() {
      return this.getAllParams().length;
    }

    clone() {
      const net = new PPONetwork(this.stateDim, this.actionDim, this.hiddenSize);
      net.setAllParams(this.getAllParams());
      return net;
    }

    exportJSON() {
      return JSON.stringify({
        stateDim: this.stateDim,
        actionDim: this.actionDim,
        hiddenSize: this.hiddenSize,
        params: Array.from(this.getAllParams())
      });
    }

    static fromJSON(json) {
      const obj = typeof json === "string" ? JSON.parse(json) : json;
      const net = new PPONetwork(obj.stateDim, obj.actionDim, obj.hiddenSize);
      net.setAllParams(obj.params);
      return net;
    }
  }

  class PPOTrainer {
    constructor(network, config) {
      this.net = network;
      this.cfg = Object.assign({
        lr: 3e-4,
        gamma: 0.99,
        lamda: 0.95,
        epsilon: 0.2,
        entropyCoef: 0.01,
        valueLossCoef: 0.5,
        maxGradNorm: 0.5,
        epochs: 4,
        miniBatchSize: 64,
      }, config || {});

      this.buffer = {
        states: [],
        actions: [],
        rewards: [],
        dones: [],
        logProbs: [],
        values: [],
      };

      this.trainStats = {
        totalSteps: 0,
        totalEpisodes: 0,
        policyLoss: 0,
        valueLoss: 0,
        entropy: 0,
        avgReward: 0,
        rewardHistory: [],
        lossHistory: [],
      };
    }

    storeTransition(state, action, reward, done, logProb, value) {
      this.buffer.states.push(new Float32Array(state));
      this.buffer.actions.push(action);
      this.buffer.rewards.push(reward);
      this.buffer.dones.push(done ? 1 : 0);
      this.buffer.logProbs.push(logProb);
      this.buffer.values.push(value);
      this.trainStats.totalSteps++;
    }

    computeGAE() {
      const T = this.buffer.rewards.length;
      const advantages = new Float32Array(T);
      const returns = new Float32Array(T);

      let gae = 0;
      const lastVal = this.buffer.dones[T - 1] ? 0 :
        this.net.forwardCritic(this.buffer.states[T - 1]);

      for (let t = T - 1; t >= 0; t--) {
        const nextVal = (t === T - 1) ? lastVal : this.buffer.values[t + 1];
        const nextDone = (t === T - 1) ? this.buffer.dones[T - 1] : this.buffer.dones[t + 1];
        const delta = this.buffer.rewards[t] + this.cfg.gamma * nextVal * (1 - nextDone) - this.buffer.values[t];
        gae = delta + this.cfg.gamma * this.cfg.lamda * (1 - this.buffer.dones[t]) * gae;
        advantages[t] = gae;
        returns[t] = advantages[t] + this.buffer.values[t];
      }

      const mean = advantages.reduce((a, b) => a + b, 0) / T;
      let std = 0;
      for (let i = 0; i < T; i++) std += (advantages[i] - mean) ** 2;
      std = Math.sqrt(std / T + 1e-8);
      for (let i = 0; i < T; i++) advantages[i] = (advantages[i] - mean) / std;

      return { advantages, returns };
    }

    numericalGradient(paramIdx, state, action, advantage, oldLogProb, ret, h) {
      const params = this.net.getAllParams();
      const original = params[paramIdx];

      params[paramIdx] = original + h;
      this.net.setAllParams(params);
      const lossPlus = this._computeLoss(state, action, advantage, oldLogProb, ret);

      params[paramIdx] = original - h;
      this.net.setAllParams(params);
      const lossMinus = this._computeLoss(state, action, advantage, oldLogProb, ret);

      params[paramIdx] = original;
      this.net.setAllParams(params);

      return (lossPlus - lossMinus) / (2 * h);
    }

    _computeLoss(state, action, advantage, oldLogProb, ret) {
      const probs = this.net.forwardActor(state);
      const newLogProb = Math.log(probs[action] + 1e-8);
      const ratio = Math.exp(newLogProb - oldLogProb);

      const surr1 = ratio * advantage;
      const surr2 = Math.max(Math.min(ratio, 1 + this.cfg.epsilon), 1 - this.cfg.epsilon) * advantage;
      const policyLoss = -Math.min(surr1, surr2);

      const value = this.net.forwardCritic(state);
      const valueLoss = 0.5 * (ret - value) ** 2;

      let entropy = 0;
      for (let i = 0; i < probs.length; i++) {
        if (probs[i] > 1e-8) entropy -= probs[i] * Math.log(probs[i]);
      }

      return policyLoss + this.cfg.valueLossCoef * valueLoss - this.cfg.entropyCoef * entropy;
    }

    train() {
      const T = this.buffer.states.length;
      if (T < 16) {
        this.clearBuffer();
        return;
      }

      const { advantages, returns } = this.computeGAE();

      let totalPolicyLoss = 0;
      let totalValueLoss = 0;
      let totalEntropy = 0;
      let updateCount = 0;

      const paramCount = this.net.getParamCount();
      const h = 1e-3;

      for (let epoch = 0; epoch < this.cfg.epochs; epoch++) {
        const indices = [];
        for (let i = 0; i < T; i++) indices.push(i);
        for (let i = T - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
        }

        for (let start = 0; start < T; start += this.cfg.miniBatchSize) {
          const end = Math.min(start + this.cfg.miniBatchSize, T);
          const batchSize = end - start;

          const grads = new Float32Array(paramCount);

          for (let b = start; b < end; b++) {
            const idx = indices[b];
            const state = this.buffer.states[idx];
            const action = this.buffer.actions[idx];
            const advantage = advantages[idx];
            const oldLogProb = this.buffer.logProbs[idx];
            const ret = returns[idx];

            const probs = this.net.forwardActor(state);
            const newLogProb = Math.log(probs[action] + 1e-8);
            const ratio = Math.exp(newLogProb - oldLogProb);
            const surr1 = ratio * advantage;
            const surr2 = Math.max(Math.min(ratio, 1 + this.cfg.epsilon), 1 - this.cfg.epsilon) * advantage;
            totalPolicyLoss += -Math.min(surr1, surr2);

            const value = this.net.forwardCritic(state);
            totalValueLoss += 0.5 * (ret - value) ** 2;

            let entropy = 0;
            for (let i = 0; i < probs.length; i++) {
              if (probs[i] > 1e-8) entropy -= probs[i] * Math.log(probs[i]);
            }
            totalEntropy += entropy;
            updateCount++;

            for (let p = 0; p < paramCount; p++) {
              grads[p] += this.numericalGradient(p, state, action, advantage, oldLogProb, ret, h);
            }
          }

          let gradNorm = 0;
          for (let p = 0; p < paramCount; p++) {
            grads[p] /= batchSize;
            gradNorm += grads[p] * grads[p];
          }
          gradNorm = Math.sqrt(gradNorm);

          if (gradNorm > this.cfg.maxGradNorm) {
            const scale = this.cfg.maxGradNorm / gradNorm;
            for (let p = 0; p < paramCount; p++) grads[p] *= scale;
          }

          const params = this.net.getAllParams();
          for (let p = 0; p < paramCount; p++) {
            params[p] -= this.cfg.lr * grads[p];
          }
          this.net.setAllParams(params);
        }
      }

      if (updateCount > 0) {
        this.trainStats.policyLoss = totalPolicyLoss / updateCount;
        this.trainStats.valueLoss = totalValueLoss / updateCount;
        this.trainStats.entropy = totalEntropy / updateCount;
        this.trainStats.lossHistory.push({
          policy: this.trainStats.policyLoss,
          value: this.trainStats.valueLoss,
          entropy: this.trainStats.entropy,
        });
      }

      this.clearBuffer();
    }

    clearBuffer() {
      this.buffer.states = [];
      this.buffer.actions = [];
      this.buffer.rewards = [];
      this.buffer.dones = [];
      this.buffer.logProbs = [];
      this.buffer.values = [];
    }

    recordEpisodeReward(totalReward) {
      this.trainStats.totalEpisodes++;
      this.trainStats.rewardHistory.push(totalReward);
      const recent = this.trainStats.rewardHistory.slice(-100);
      this.trainStats.avgReward = recent.reduce((a, b) => a + b, 0) / recent.length;
    }
  }

  const ACTION_MAP = [
    { dx: 0, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 0 },
    { dx: -0.7071, dy: -0.7071 },
    { dx: 0.7071, dy: -0.7071 },
    { dx: -0.7071, dy: 0.7071 },
    { dx: 0.7071, dy: 0.7071 },
  ];

  window.PPONet = {
    STATE_DIM,
    ACTION_DIM,
    ACTION_MAP,
    PPONetwork,
    PPOTrainer,
    Matrix,
  };
})();
