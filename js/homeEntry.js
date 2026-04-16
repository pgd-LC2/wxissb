(() => {
  "use strict";

  window.addEventListener("load", () => {
    if (window.GameApp && window.GameApp.HomePage && window.GameApp.HomePage.init) {
      window.GameApp.HomePage.init();
    }
  }, { once: true });
})();
