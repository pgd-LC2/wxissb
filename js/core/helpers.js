(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function getStoredPlayerName() {
    try {
      return localStorage.getItem("bigear_player_name") || "";
    } catch {
      return "";
    }
  }

  function storePlayerName(name) {
    try {
      localStorage.setItem("bigear_player_name", name);
    } catch {}
  }

  GameApp.Helpers = {
    escapeHtml,
    formatTime,
    getStoredPlayerName,
    storePlayerName
  };
})();
