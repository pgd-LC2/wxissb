(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { canvas, ctx } = GameApp.DOM;

  function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // After setTransform to dpr, we want coordinates in CSS pixels
    // => keep render code in CSS pixels by using canvas.width/dpr
  }

  function getCssSize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    return { w: canvas.width / dpr, h: canvas.height / dpr };
  }

  function wrapRender(game) {
    if (!game) return;
    game.render = (t) => {
      const { w, h } = getCssSize();
      GameApp.Render.renderWithCssSize(game, t, w, h);
    };
  }

  function init() {
    resize();
    window.addEventListener("resize", resize);
  }

  GameApp.Canvas = {
    init,
    resize,
    getCssSize,
    wrapRender
  };
})();
