(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const Audio = GameApp.Infra && GameApp.Infra.Audio ? GameApp.Infra.Audio : {};

  GameApp.Deps = {
    utils: GameApp.Utils,
    SFX: Audio.sfx,
    GameConfig: GameApp.Config ? GameApp.Config.game : null,
    SkillSystem: GameApp.SkillSystem || null,
    nextId: GameApp.nextId
  };
})();
