(() => {
  "use strict";

  window.addEventListener("load", () => {
    if (window.GameApp && window.GameApp.LeaderboardPage && window.GameApp.LeaderboardPage.init) {
      window.GameApp.LeaderboardPage.init();
    }
  }, { once: true });
})();
