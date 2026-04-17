import { GameApp as __GameApp } from './legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const State = GameApp.State = GameApp.State || {};

  State.Selection = {
    selectedClass: null,
    selectedWeapon: null,
    isSelectionComplete: false,
    callbacks: {
      onComplete: null
    }
  };
})();
