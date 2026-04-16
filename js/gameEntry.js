(() => {
  "use strict";

  const scriptQueue = [
    "../js/game.js",
    "../js/utils.js",
    "../js/sfx.js",
    "../js/content/supabaseConfig.js",
    "../js/infra/preferences.js",
    "../js/infra/playerNameStore.js",
    "../js/infra/supabaseClient.js",
    "../js/infra/leaderboardApi.js",
    "../js/infra/skillReportApi.js",
    "../js/music.js",
    "../js/content/classWeaponData.js",
    "../js/content/cyberSkills.js",
    "../js/content/bladeSkills.js",
    "../js/selectionStore.js",
    "../js/classWeaponApplier.js",
    "../js/skills.js",
    "../js/skillDropRates.js",
    "../js/core/deps.js",
    "../js/core/dom.js",
    "../js/core/runtime.js",
    "../js/uiGame.js",
    "../js/core/helpers.js",
    "../js/renderWithCssSize.js",
    "../js/gameRenderer.js",
    "../js/canvas.js",
    "../js/systems/progression/combatRating.js",
    "../js/systems/progression/skillSelection.js",
    "../js/core/gameFactory.js",
    "../js/uiShared.js",
    "../js/ui/skillsOverlay.js",
    "../js/ui/gameover.js",
    "../js/ui/hud.js",
    "../js/eliteBrain.js",
    "../js/ui/autoPlay.js",
    "../js/ui/pause.js",
    "../js/ui/leaderboard.js",
    "../js/input.js",
    "../js/gameLoop.js",
    "../js/bootstrap.js",
    "../js/main.js"
  ];

  function appendScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  }

  async function loadScriptsSequentially() {
    for (const src of scriptQueue) {
      await appendScript(src);
    }
  }

  loadScriptsSequentially().catch((error) => {
    console.error("游戏入口加载失败", error);
  });
})();
