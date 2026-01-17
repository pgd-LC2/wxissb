(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { shakeToggle } = GameApp.DOM;
  const runtime = GameApp.Runtime;
  const PREF_SHAKE = "bigear_pref_shake"; // "1" = enabled

  try {
    const pref = localStorage.getItem(PREF_SHAKE);
    if (pref === "0") runtime.shakeEnabled = false;
    if (pref === "1") runtime.shakeEnabled = true;
  } catch {}

  function refreshShakeIcon() {
    if (!shakeToggle) return;
    if (runtime.shakeEnabled) {
      shakeToggle.classList.remove("disabled");
      shakeToggle.textContent = "\uD83D\uDCF3";
      shakeToggle.title = "屏幕震动：开启（点击关闭）";
    } else {
      shakeToggle.classList.add("disabled");
      shakeToggle.textContent = "\uD83D\uDCF4";
      shakeToggle.title = "屏幕震动：关闭（点击开启）";
    }
  }

  refreshShakeIcon();

  if (shakeToggle) {
    shakeToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      runtime.shakeEnabled = !runtime.shakeEnabled;
      try {
        localStorage.setItem(PREF_SHAKE, runtime.shakeEnabled ? "1" : "0");
      } catch {}
      refreshShakeIcon();
    });
  }

  const ui = GameApp.UI = GameApp.UI || {};
  ui.isShakeEnabled = () => runtime.shakeEnabled;
})();
