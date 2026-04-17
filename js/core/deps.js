import { GameApp as __GameApp } from '../legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const Audio = GameApp.Infra && GameApp.Infra.Audio ? GameApp.Infra.Audio : {};

  GameApp.Deps = {
    utils: GameApp.Utils,
    SFX: Audio.sfx,
    GameConfig: GameApp.Config ? GameApp.Config.game : null,
    SkillSystem: GameApp.SkillSystem || null,
    nextId: GameApp.nextId
  };
})();
