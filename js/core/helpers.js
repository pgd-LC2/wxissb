import { GameApp as __GameApp } from '../legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const Storage = GameApp.Infra && GameApp.Infra.Storage ? GameApp.Infra.Storage : {};

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
    if (Storage.getPlayerName) return Storage.getPlayerName();
    if (Storage.safeGet) return Storage.safeGet("bigear_player_name", "");
    return "";
  }

  function storePlayerName(name) {
    if (Storage.setPlayerName) {
      Storage.setPlayerName(name || "");
      return;
    }
    if (Storage.safeSet) Storage.safeSet("bigear_player_name", name || "");
  }

  GameApp.Helpers = {
    escapeHtml,
    formatTime,
    getStoredPlayerName,
    storePlayerName
  };
})();
