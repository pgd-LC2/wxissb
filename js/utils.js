(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + (b - a) * Math.random();
  const nowSec = () => performance.now() / 1000;
  const hypot = (dx, dy) => Math.sqrt(dx * dx + dy * dy);

  function colorWithAlpha(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  const utils = { TAU, clamp, lerp, rand, nowSec, hypot, colorWithAlpha };

  GameApp.Infra = GameApp.Infra || {};
  GameApp.Infra.Utils = utils;
  GameApp.Utils = utils;
})();
