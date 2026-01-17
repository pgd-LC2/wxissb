(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const listeners = [];

  const runtime = {
    game: null,
    spawnTimer: 0,
    shakeEnabled: true,
    isPausedByUser: false,
    pauseScoreSubmitted: false,
    setGame(g) {
      runtime.game = g;
      for (const fn of listeners) fn(g);
    },
    onGameChange(fn) {
      listeners.push(fn);
      if (runtime.game) fn(runtime.game);
    }
  };

  GameApp.Runtime = runtime;
})();
