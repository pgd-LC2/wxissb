(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { hypot } = GameApp.Deps.utils;
  const { SFX } = GameApp.Deps;

  let game = null;
  GameApp.Runtime.onGameChange((g) => { game = g; });

  const keys = new Set();
  function recomputeKeyVector() {
    let dx = 0, dy = 0;
    if (keys.has("w")) dy -= 1;
    if (keys.has("s")) dy += 1;
    if (keys.has("a")) dx -= 1;
    if (keys.has("d")) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = hypot(dx, dy);
      dx /= len;
      dy /= len;
    }
    return { dx, dy };
  }

  window.addEventListener("keydown", (e) => {
    // 如果焦点在输入框中，完全不处理，让浏览器默认行为处理输入
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      return; // 直接返回，不阻止任何默认行为
    }

    const k = e.key.toLowerCase();

    // unlock audio on user gesture (autoplay policies)
    SFX.unlock();

    // toggle mute
    if (k === "m") {
      SFX.setMuted(!SFX.isMuted());
      const ui = GameApp.UI;
      if (ui && ui.refreshSoundIcon) ui.refreshSoundIcon();
      e.preventDefault();
      return;
    }

    if (["w", "a", "s", "d"].includes(k)) {
      keys.add(k);
      e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener("keyup", (e) => {
    // 如果焦点在输入框中，完全不处理
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      return; // 直接返回，不阻止任何默认行为
    }

    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(k)) {
      keys.delete(k);
      e.preventDefault();
    }
  }, { passive: false });

  function clearMovementInputs() {
    keys.clear();
    if (game) game.joystickVector = { dx: 0, dy: 0 };
    const input = GameApp.Input;
    if (input && input.setJoyKnob) input.setJoyKnob(0, 0);
  }
  window.addEventListener("blur", clearMovementInputs);
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearMovementInputs(); });

  const input = GameApp.Input = GameApp.Input || {};
  input.recomputeKeyVector = recomputeKeyVector;
  input.clearMovementInputs = clearMovementInputs;
})();
