(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { soundToggle } = GameApp.DOM;
  const { SFX } = GameApp.Deps;
  const PREF_MUTED = "bigear_pref_muted"; // "1" = muted

  // 获取音乐播放器（可能在 music.js 中定义）
  const getMusicPlayer = () => window.MusicPlayer;

  try {
    const pref = localStorage.getItem(PREF_MUTED);
    if (pref === "1") {
      SFX.setMuted(true);
      // 同时静音背景音乐
      const mp = getMusicPlayer();
      if (mp && mp.pause) mp.pause();
    }
    if (pref === "0") {
      SFX.setMuted(false);
      // 同时恢复背景音乐
      const mp = getMusicPlayer();
      if (mp && mp.play) mp.play();
    }
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
      const newMuted = !SFX.isMuted();
      SFX.setMuted(newMuted);
      
      // 同时控制背景音乐
      const mp = getMusicPlayer();
      if (mp) {
        if (newMuted) {
          mp.pause();
        } else {
          mp.play();
        }
      }
      
      try {
        localStorage.setItem(PREF_MUTED, newMuted ? "1" : "0");
      } catch {}
      refreshSoundIcon();
    });
  }

  // first user gesture unlock (for autoplay policies)
  window.addEventListener("pointerdown", () => { SFX.unlock(); }, { once: true, passive: true });

  const ui = GameApp.UI = GameApp.UI || {};
  ui.refreshSoundIcon = refreshSoundIcon;
})();
