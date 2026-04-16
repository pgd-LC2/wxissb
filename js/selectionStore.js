(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
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
