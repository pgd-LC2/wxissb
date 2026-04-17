import { GameApp as __GameApp } from './legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;

  const GameConfig = {
    basePlayerSpeed: 200,
    baseBulletSpeed: 600,
    baseEnemySpeed: 80,
    mapSize: 3000,
    difficultyScaling: 0.15,

    // 命中停顿会让移动手感发粘，默认关闭以保证操作丝滑。
    hitStopEnabled: false
  };

  let idSeq = 1;

  function nextId() {
    return idSeq++;
  }

  GameApp.Config = GameApp.Config || {};
  GameApp.Config.game = GameConfig;
  GameApp.nextId = nextId;
})();
