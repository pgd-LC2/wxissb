(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const utils = window.GameUtils;

  GameApp.Deps = {
    utils,
    SFX: window.SFX,
    GameConfig: window.GameConfig,
    SkillSystem: window.SkillSystem,
    nextId: window.nextId
  };
})();
