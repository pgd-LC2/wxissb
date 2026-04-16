(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const Infra = GameApp.Infra = GameApp.Infra || {};
  const Storage = Infra.Storage = Infra.Storage || {};
  const keys = Storage.keys || { playerName: "bigear_player_name" };

  function getPlayerName() {
    return Storage.safeGet ? Storage.safeGet(keys.playerName, "") : "";
  }

  function setPlayerName(name) {
    if (!Storage.safeSet) return;
    Storage.safeSet(keys.playerName, name || "");
  }

  Storage.getPlayerName = getPlayerName;
  Storage.setPlayerName = setPlayerName;
})();
