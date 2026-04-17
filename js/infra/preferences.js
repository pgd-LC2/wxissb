import { GameApp as __GameApp } from '../legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const Infra = GameApp.Infra = GameApp.Infra || {};
  const Storage = Infra.Storage = Infra.Storage || {};

  const keys = {
    soundMuted: "bigear_pref_muted",
    shakeEnabled: "bigear_pref_shake",
    musicMuted: "bigear_pref_music_muted",
    autoPlayEnabled: "bigear_pref_autoplay",
    eliteAiEnabled: "bigear_pref_elite_ai",
    playerName: "bigear_player_name"
  };

  function safeGet(key, fallback = "") {
    try {
      const value = localStorage.getItem(key);
      if (value === null || value === undefined || value === "") return fallback;
      return value;
    } catch {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }

  function getFlag(key, defaultValue = false) {
    return safeGet(key, defaultValue ? "1" : "0") === "1";
  }

  function setFlag(key, enabled) {
    safeSet(key, enabled ? "1" : "0");
  }

  Storage.keys = keys;
  Storage.safeGet = safeGet;
  Storage.safeSet = safeSet;
  Storage.safeRemove = safeRemove;
  Storage.getFlag = getFlag;
  Storage.setFlag = setFlag;
})();
