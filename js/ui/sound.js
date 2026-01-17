(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { soundToggle } = GameApp.DOM;
  const { SFX } = GameApp.Deps;
  const PREF_MUTED = "bigear_pref_muted"; // "1" = muted

  try {
    const pref = localStorage.getItem(PREF_MUTED);
    if (pref === "1") SFX.setMuted(true);
    if (pref === "0") SFX.setMuted(false);
  } catch {}

  function refreshSoundIcon() {
    if (!soundToggle) return;
    if (SFX.isMuted()) {
      soundToggle.classList.add("muted");
      soundToggle.textContent = "\uD83D\uDD07";
    } else {
      soundToggle.classList.remove("muted");
      soundToggle.textContent = "\uD83D\uDD0A";
    }
  }

  refreshSoundIcon();

  if (soundToggle) {
    soundToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      SFX.unlock();
      SFX.setMuted(!SFX.isMuted());
      try {
        localStorage.setItem(PREF_MUTED, SFX.isMuted() ? "1" : "0");
      } catch {}
      refreshSoundIcon();
    });
  }

  // first user gesture unlock (for autoplay policies)
  window.addEventListener("pointerdown", () => { SFX.unlock(); }, { once: true, passive: true });

  const ui = GameApp.UI = GameApp.UI || {};
  ui.refreshSoundIcon = refreshSoundIcon;
})();
