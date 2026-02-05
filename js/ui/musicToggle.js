(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const PREF_MUSIC_MUTED = "bigear_pref_music_muted";

  const getMusicPlayer = () => window.MusicPlayer;

  let musicMuted = false;

  function isMuted() {
    return musicMuted;
  }

  function setMuted(muted) {
    musicMuted = !!muted;
    const mp = getMusicPlayer();
    if (mp) {
      if (musicMuted) {
        mp.pause();
      } else {
        mp.play();
      }
    }
    try {
      localStorage.setItem(PREF_MUSIC_MUTED, musicMuted ? "1" : "0");
    } catch {}
    refreshMusicIcon();
  }

  function toggle() {
    setMuted(!musicMuted);
  }

  function refreshMusicIcon() {
    const btn = GameApp.DOM && GameApp.DOM.musicToggle;
    if (!btn) return;
    if (musicMuted) {
      btn.classList.add("muted");
      btn.textContent = "\uD83D\uDD07";
      btn.title = "\u97F3\u4E50\u5DF2\u7981\u7528\uFF08\u70B9\u51FB\u5F00\u542F\uFF09";
    } else {
      btn.classList.remove("muted");
      btn.textContent = "\uD83C\uDFB5";
      btn.title = "\u7981\u7528\u97F3\u4E50\uFF08\u70B9\u51FB\u5173\u95ED\uFF09";
    }
  }

  try {
    const pref = localStorage.getItem(PREF_MUSIC_MUTED);
    if (pref === "1") {
      musicMuted = true;
      const mp = getMusicPlayer();
      if (mp && mp.pause) mp.pause();
    }
  } catch {}

  const musicBtn = GameApp.DOM && GameApp.DOM.musicToggle;
  if (musicBtn) {
    musicBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });
  }

  refreshMusicIcon();

  const musicToggle = GameApp.MusicToggle = GameApp.MusicToggle || {};
  musicToggle.isMuted = isMuted;
  musicToggle.setMuted = setMuted;
  musicToggle.toggle = toggle;
  musicToggle.refreshMusicIcon = refreshMusicIcon;
})();
